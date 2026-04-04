import { getAccessToken } from '../auth/client.js'

const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

async function apiFetch(path, options = {}) {
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

const SESSION_TYPE_LABELS = {
  brand_identity: 'Brand Identity Report',
  name_generator: 'Name Generator',
}

const SESSION_TYPE_ICONS = {
  brand_identity: '🔍',
  name_generator: '✨',
}

const SESSION_STATUS_CLASSES = {
  active: 'badge-active',
  complete: 'badge-complete',
  draft: 'badge-draft',
}

function formatDate(ts) {
  if (!ts) return ''
  try {
    return new Date(ts * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export function Sessions() {
  const el = document.createElement('section')
  el.className = 'page sessions container'

  el.innerHTML = `
    <div class="page-header page-header--with-action">
      <div>
        <div class="eyebrow">Workspace</div>
        <h1>My Sessions</h1>
        <p>Each session is a naming research campaign. Run reports on existing names or generate new brand name candidates.</p>
      </div>
      <a href="#/sessions/new" class="btn btn-primary">+ New Session</a>
    </div>

    <div id="sessions-auth-notice" style="display:none">
      <div class="inline-status is-warning" style="margin-bottom:24px">
        Sign in to create and access your sessions.
        <a href="#/login" class="btn btn-sm btn-primary" style="margin-left:10px">Sign in</a>
      </div>
    </div>

    <div id="sessions-content">
      <div class="empty-state">Loading sessions…</div>
    </div>
  `

  attachSessionsLogic(el)
  return el
}

function attachSessionsLogic(root) {
  const contentEl = root.querySelector('#sessions-content')
  const authNoticeEl = root.querySelector('#sessions-auth-notice')

  async function load() {
    const token = await getAccessToken().catch(() => null)
    if (!token) {
      if (authNoticeEl) authNoticeEl.style.display = ''
      if (contentEl) contentEl.innerHTML = ''
      return
    }

    const resp = await apiFetch('/api/sessions')

    if (!resp.ok) {
      if (contentEl) {
        contentEl.innerHTML = `<p style="color:var(--error)">Could not load sessions. The API may not be deployed yet.</p>`
      }
      return
    }

    const sessions = resp.data.sessions || []

    if (!sessions.length) {
      if (contentEl) {
        contentEl.innerHTML = `
          <div class="empty-state-lg">
            <div class="empty-state-icon">📋</div>
            <h3>No sessions yet</h3>
            <p>Start a Brand Identity Report to research a name, or kick off a Name Generator session to build fresh candidates.</p>
            <a href="#/sessions/new" class="btn btn-primary" style="margin-top:12px">Start your first session</a>
          </div>
        `
      }
      return
    }

    if (contentEl) {
      contentEl.innerHTML = `
        <div class="sessions-grid">
          ${sessions.map((s) => renderSessionCard(s)).join('')}
        </div>
      `
    }
  }

  load()
}

function renderSessionCard(s) {
  const typeLabel = SESSION_TYPE_LABELS[s.session_type] || s.session_type || 'Session'
  const typeIcon = SESSION_TYPE_ICONS[s.session_type] || '📋'
  const statusClass = SESSION_STATUS_CLASSES[s.status] || 'badge-active'
  const dateStr = formatDate(s.created_at)
  const reportCount = s.report_count ?? 0

  return `
    <div class="session-card">
      <div class="session-card-head">
        <div class="session-type-badge">
          <span class="session-type-icon">${typeIcon}</span>
          <span class="session-type-label">${typeLabel}</span>
        </div>
        <span class="badge ${statusClass}">${s.status || 'active'}</span>
      </div>
      <h3 class="session-card-title">${escapeHtml(s.name)}</h3>
      ${s.description ? `<p class="session-card-desc">${escapeHtml(s.description)}</p>` : ''}
      <div class="session-card-meta">
        <span>${reportCount} report${reportCount !== 1 ? 's' : ''}</span>
        ${dateStr ? `<span>${dateStr}</span>` : ''}
      </div>
      <div class="session-card-actions">
        <a href="#/session?id=${s.id}" class="btn btn-sm btn-primary">Open</a>
      </div>
    </div>
  `
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}
