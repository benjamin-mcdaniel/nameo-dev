import { getAccessToken } from '../auth/client.js'
import { API_BASE } from '../config.js'

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
        <h1>Sessions</h1>
        <p>Your naming research. Open a session to see report results or start a new one.</p>
      </div>
      <a href="#/sessions/new" class="btn btn-primary">New session</a>
    </div>

    <div id="sessions-auth-notice" style="display:none">
      <div class="inline-status is-warning" style="margin-bottom:24px">
        Sign in to create and access your sessions.
        <a href="#/login" class="btn btn-sm btn-primary" style="margin-left:10px">Sign in</a>
      </div>
    </div>

    <div id="sessions-content">
      <div class="empty-state">Loading sessions...</div>
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
      if (contentEl) contentEl.innerHTML = `
        <div class="empty-state-lg">
          <div class="empty-state-icon">🔒</div>
          <h3>Sign in to view your sessions</h3>
          <p>Your naming research is saved to your account. Sign in to access your sessions and create new ones.</p>
        </div>
      `
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
        <div class="sessions-list">
          ${sessions.map((s) => renderSessionRow(s)).join('')}
        </div>
      `
    }
  }

  load()
}

function renderSessionRow(s) {
  const typeLabel = SESSION_TYPE_LABELS[s.session_type] || s.session_type || 'Session'
  const typeIcon = SESSION_TYPE_ICONS[s.session_type] || '📋'
  const statusClass = SESSION_STATUS_CLASSES[s.status] || 'badge-active'
  const dateStr = formatDate(s.created_at)
  const reportCount = s.report_count ?? 0

  return `
    <a class="session-row" href="#/session?id=${escapeHtml(s.id)}">
      <span class="session-row-icon">${typeIcon}</span>
      <span class="session-row-main">
        <span class="session-row-name">${escapeHtml(s.name)}</span>
        <span class="session-row-meta">${typeLabel} &middot; ${reportCount} report${reportCount !== 1 ? 's' : ''}</span>
      </span>
      <span class="session-row-right">
        <span class="badge ${statusClass}">${s.status || 'active'}</span>
        <span class="session-row-date">${dateStr}</span>
        <span style="color:var(--text-muted);font-size:1rem">&rsaquo;</span>
      </span>
    </a>
  `
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}
