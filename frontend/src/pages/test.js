import { getAccessToken } from '../auth/client.js'

export function Test() {
  const el = document.createElement('section')
  el.className = 'page test container'
  el.innerHTML = `
    <h1>Test tools</h1>
    <p>Use this page to exercise the backend campaigns API while we build out the full UI.</p>
    <p>
      Go back to <a href="#/">Home</a> for the live name checker.
    </p>

    <div class="card">
      <h2>Campaigns API</h2>
      <p class="hint">If you are logged in, requests will be tied to your Auth0 user. Otherwise, they use the anonymous user.</p>
      <div class="actions">
        <button id="btn-list-campaigns" class="btn">List campaigns</button>
        <button id="btn-create-campaign" class="btn btn-primary">Create test campaign</button>
      </div>
      <pre id="campaign-output" class="code-block"></pre>
    </div>
  `

  attachTestLogic(el)
  return el
}

function attachTestLogic(root) {
  const listBtn = root.querySelector('#btn-list-campaigns')
  const createBtn = root.querySelector('#btn-create-campaign')
  const output = root.querySelector('#campaign-output')

  if (!listBtn || !createBtn || !output) return

  function setOutput(data) {
    try {
      output.textContent = JSON.stringify(data, null, 2)
    } catch (err) {
      output.textContent = String(data)
    }
  }

  async function apiFetch(path, options = {}) {
    const token = await getAccessToken()
    const headers = new Headers(options.headers || {})
    headers.set('Content-Type', 'application/json')
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    const res = await fetch(path, { ...options, headers })
    const body = await res.json().catch(() => null)
    return { ok: res.ok, status: res.status, body }
  }

  listBtn.addEventListener('click', async () => {
    setOutput('Loading campaigns…')
    try {
      const resp = await apiFetch('/api/campaigns')
      setOutput({ status: resp.status, body: resp.body })
    } catch (err) {
      setOutput({ error: 'request_failed', detail: String(err) })
    }
  })

  createBtn.addEventListener('click', async () => {
    const name = `Test campaign ${new Date().toISOString()}`
    const description = 'Created from /#/test page'
    setOutput(`Creating campaign: ${name}`)
    try {
      const resp = await apiFetch('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      })
      setOutput({ status: resp.status, body: resp.body })
    } catch (err) {
      setOutput({ error: 'request_failed', detail: String(err) })
    }
  })
}
