import { getAccessToken } from '../auth/client.js'

async function apiFetchWithAuth(path, options = {}) {
  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', 'application/json')

  try {
    const token = await getAccessToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  } catch (err) {
    // ignore; backend will return 401 if auth is required
  }

  const res = await fetch(path, { ...options, headers })
  const body = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, body }
}

export function Campaigns() {
  const el = document.createElement('section')
  el.className = 'page campaigns container'
  el.innerHTML = `
    <h1>My campaigns</h1>
    <p class="sub">See the campaigns you have started while naming products.</p>
    <div id="campaigns-status" class="hint">Loading campaigns…</div>
    <div id="campaigns-list"></div>
  `

  attachCampaignsLogic(el)
  return el
}

async function attachCampaignsLogic(root) {
  const statusEl = root.querySelector('#campaigns-status')
  const listEl = root.querySelector('#campaigns-list')
  if (!statusEl || !listEl) return

  statusEl.textContent = 'Loading campaigns…'

  try {
    const resp = await apiFetchWithAuth('/api/campaigns')

    if (resp.status === 401) {
      statusEl.textContent = 'Login is required to view your campaigns. Use the Login page first.'
      listEl.innerHTML = ''
      return
    }

    const campaigns = resp.body?.campaigns || []
    if (campaigns.length === 0) {
      statusEl.textContent = 'You have no campaigns yet. Save a name from the home page to start one.'
      listEl.innerHTML = ''
      return
    }

    statusEl.textContent = ''

    const items = campaigns
      .map((c) => {
        const created = c.created_at ? new Date(c.created_at * 1000).toLocaleString() : ''
        return `
          <div class="card" data-id="${c.id}">
            <h2>${c.name}</h2>
            ${c.description ? `<p class="hint">${c.description}</p>` : ''}
            ${created ? `<p class="hint">Created ${created}</p>` : ''}
          </div>
        `
      })
      .join('')

    listEl.innerHTML = items
  } catch (err) {
    statusEl.textContent = 'Unable to load campaigns right now.'
    console.error('Campaigns load error', err)
  }
}
