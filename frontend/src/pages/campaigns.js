import { getAccessToken } from '../auth/client.js'

const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

async function apiFetchWithAuth(path, options = {}) {
  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', 'application/json')
  try {
    const token = await getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  } catch { /* anonymous fallback */ }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

export function Campaigns() {
  const el = document.createElement('section')
  el.className = 'page campaigns container'

  el.innerHTML = `
    <div class="page-header">
      <div class="eyebrow">Projects</div>
      <h1>My Projects</h1>
      <p>Each project is a naming initiative. Add name candidates and run availability checks across all surfaces.</p>
    </div>

    <div id="campaigns-auth-notice" style="display:none">
      <div class="inline-status is-warning" style="margin-bottom:20px">
        Sign in to create and access your projects.
        <a href="#/login" class="btn btn-sm btn-primary" style="margin-left:10px">Sign in</a>
      </div>
    </div>

    <div id="campaigns-content">
      <div class="empty-state">Loading projects…</div>
    </div>

    <div id="campaigns-create" style="display:none;margin-top:24px">
      <div class="card" style="max-width:480px">
        <h3 style="margin-bottom:14px">New project</h3>
        <div class="form-row">
          <label for="new-project-name">Project name</label>
          <input type="text" id="new-project-name" placeholder="e.g. Clover App Launch" />
        </div>
        <div class="form-row">
          <label for="new-project-desc">Description <span class="hint">(optional)</span></label>
          <input type="text" id="new-project-desc" placeholder="Brief description" />
        </div>
        <div class="actions-inline" style="margin-top:4px">
          <button id="btn-create-project" class="btn btn-primary">Create project</button>
          <span id="create-project-status" class="hint"></span>
        </div>
      </div>
    </div>
  `

  attachCampaignsLogic(el)
  return el
}

function attachCampaignsLogic(root) {
  const contentEl = root.querySelector('#campaigns-content')
  const authNoticeEl = root.querySelector('#campaigns-auth-notice')
  const createEl = root.querySelector('#campaigns-create')
  const nameInput = root.querySelector('#new-project-name')
  const descInput = root.querySelector('#new-project-desc')
  const createBtn = root.querySelector('#btn-create-project')
  const createStatusEl = root.querySelector('#create-project-status')

  async function load() {
    const token = await getAccessToken().catch(() => null)
    if (!token) {
      if (authNoticeEl) authNoticeEl.style.display = ''
      if (contentEl) contentEl.innerHTML = ''
      return
    }

    const resp = await apiFetchWithAuth('/api/campaigns')
    if (!resp.ok) {
      if (contentEl) contentEl.innerHTML = `<p class="hint" style="color:var(--error)">Could not load projects.</p>`
      return
    }

    const campaigns = resp.data.campaigns || []
    if (createEl) createEl.style.display = ''

    if (!campaigns.length) {
      if (contentEl) contentEl.innerHTML = `<div class="empty-state">No projects yet. Create one below to get started.</div>`
      return
    }

    if (contentEl) {
      contentEl.innerHTML = `
        <div class="projects-grid">
          ${campaigns.map((c) => `
            <div class="project-card">
              <h3>${c.name}</h3>
              ${c.description ? `<p class="hint">${c.description}</p>` : ''}
              <div class="actions-inline" style="margin-top:8px">
                <a href="#/advanced?campaign=${c.id}" class="btn btn-sm btn-primary">Open</a>
              </div>
            </div>
          `).join('')}
        </div>
      `
    }
  }

  if (createBtn) {
    createBtn.addEventListener('click', async () => {
      const name = (nameInput?.value || '').trim()
      if (!name) { if (createStatusEl) createStatusEl.textContent = 'Name is required.'; return }

      if (createStatusEl) createStatusEl.textContent = 'Creating…'
      const resp = await apiFetchWithAuth('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({ name, description: (descInput?.value || '').trim() }),
      })

      if (!resp.ok) {
        if (createStatusEl) createStatusEl.textContent = 'Could not create project.'
        return
      }

      if (createStatusEl) createStatusEl.textContent = ''
      if (nameInput) nameInput.value = ''
      if (descInput) descInput.value = ''
      load()
    })
  }

  load()
}
