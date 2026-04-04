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

const REPORT_TYPE_META = {
  domain_availability: { label: 'Domain Availability', icon: '🌐', desc: 'Domain availability across TLDs' },
  trademark: { label: 'Trademark Check', icon: '⚖️', desc: 'US & EU trademark screening' },
  products_for_sale: { label: 'Products for Sale', icon: '🛒', desc: 'Marketplace listing conflicts' },
  social_handles: { label: 'Social Handles', icon: '📱', desc: 'Handle availability on major platforms' },
  app_store: { label: 'App Store', icon: '📦', desc: 'iOS & Google Play name check' },
  questionnaire: { label: 'Brand Preferences', icon: '🎯', desc: 'Preference questionnaire responses' },
  name_candidates: { label: 'Name Candidates', icon: '✨', desc: 'AI-generated name candidates' },
}

const REPORT_STATUS_META = {
  pending: { label: 'Pending', cls: 'badge-pending' },
  running: { label: 'Running…', cls: 'badge-running' },
  complete: { label: 'Complete', cls: 'badge-complete' },
  error: { label: 'Error', cls: 'badge-error' },
}

const SESSION_TYPE_META = {
  brand_identity: { label: 'Brand Identity Report', icon: '🔍' },
  name_generator: { label: 'Name Generator', icon: '✨' },
}

function formatDate(ts) {
  if (!ts) return ''
  try {
    return new Date(ts * 1000).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  } catch { return '' }
}

function escHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}

function getSessionIdFromHash() {
  const hash = window.location.hash || ''
  const queryStr = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  return new URLSearchParams(queryStr).get('id') || ''
}

export function Session() {
  const el = document.createElement('section')
  el.className = 'page session container'

  const sessionId = getSessionIdFromHash()

  if (!sessionId) {
    el.innerHTML = `
      <div class="page-header">
        <div class="eyebrow">Session</div>
        <h1>Session not found</h1>
      </div>
      <div class="inline-status is-error">No session ID provided. <a href="#/sessions">Back to sessions</a></div>
    `
    return el
  }

  el.innerHTML = `
    <div id="session-loading" class="empty-state">Loading session…</div>
    <div id="session-main" style="display:none"></div>
  `

  loadSession(el, sessionId)
  return el
}

async function loadSession(root, sessionId) {
  const loadingEl = root.querySelector('#session-loading')
  const mainEl = root.querySelector('#session-main')

  const resp = await apiFetch(`/api/sessions/${sessionId}`)

  if (!resp.ok) {
    if (loadingEl) loadingEl.innerHTML = `
      <div class="inline-status is-error">
        Session not found or could not be loaded.
        <a href="#/sessions" style="margin-left:8px">Back to sessions</a>
      </div>
    `
    return
  }

  if (loadingEl) loadingEl.style.display = 'none'
  if (mainEl) mainEl.style.display = ''

  renderSession(mainEl, resp.data.session, resp.data.reports || [])
}

function renderSession(el, session, reports) {
  const typeMeta = SESSION_TYPE_META[session.session_type] || { label: session.session_type, icon: '📋' }
  const meta = session.metadata || {}

  el.innerHTML = `
    <!-- Session header -->
    <div class="session-detail-header">
      <div class="session-detail-breadcrumb">
        <a href="#/sessions">Sessions</a>
        <span class="breadcrumb-sep">/</span>
        <span>${escHtml(session.name)}</span>
      </div>
      <div class="session-detail-title-row">
        <div>
          <div class="session-type-badge session-type-badge--lg">
            <span>${typeMeta.icon}</span>
            <span>${typeMeta.label}</span>
          </div>
          <h1 style="margin-top:8px;margin-bottom:4px">${escHtml(session.name)}</h1>
          <div class="session-detail-date">Created ${formatDate(session.created_at)}</div>
        </div>
      </div>
    </div>

    <!-- Session metadata summary -->
    ${renderSessionMeta(session)}

    <!-- Reports section -->
    <div class="session-reports-section">
      <div class="section-header section-header--with-action">
        <h2>Reports</h2>
        <button id="btn-add-report" class="btn btn-sm btn-primary">+ Add report</button>
      </div>

      <div id="reports-list">
        ${reports.length
          ? `<div class="reports-grid">${reports.map(renderReportCard).join('')}</div>`
          : renderEmptyReports(session)
        }
      </div>
    </div>
  `

  // Add report button (stub — opens a modal or inline form later)
  el.querySelector('#btn-add-report')?.addEventListener('click', () => {
    showAddReportPlaceholder(el, session)
  })

  // Wire up report card clicks
  el.querySelectorAll('.report-card[data-report-id]').forEach((card) => {
    card.querySelector('.btn')?.addEventListener('click', (e) => {
      e.stopPropagation()
      // TODO: navigate to report detail page when built
    })
  })
}

function renderSessionMeta(session) {
  const meta = session.metadata || {}
  const isBrand = session.session_type === 'brand_identity'

  if (isBrand && meta.brand_names?.length) {
    return `
      <div class="session-meta-card">
        <div class="smc-row">
          <span class="smc-label">Names researching</span>
          <span class="smc-value">
            ${meta.brand_names.map((n) => `<span class="name-chip">${escHtml(n)}</span>`).join('')}
          </span>
        </div>
        ${meta.report_types?.length ? `
          <div class="smc-row">
            <span class="smc-label">Report types</span>
            <span class="smc-value">${meta.report_types.map((id) => {
              const m = REPORT_TYPE_META[id]
              return m ? `<span class="report-type-chip">${m.icon} ${m.label}</span>` : id
            }).join('')}</span>
          </div>
        ` : ''}
      </div>
    `
  }

  if (!isBrand && meta.product_description) {
    const vibeLabels = (meta.vibes || []).join(', ')
    return `
      <div class="session-meta-card">
        <div class="smc-row">
          <span class="smc-label">Product</span>
          <span class="smc-value">${escHtml(meta.product_description)}</span>
        </div>
        ${meta.industry ? `<div class="smc-row"><span class="smc-label">Industry</span><span class="smc-value">${escHtml(meta.industry)}</span></div>` : ''}
        ${vibeLabels ? `<div class="smc-row"><span class="smc-label">Brand vibe</span><span class="smc-value">${escHtml(vibeLabels)}</span></div>` : ''}
      </div>
    `
  }

  return ''
}

function renderReportCard(report) {
  const typeMeta = REPORT_TYPE_META[report.report_type] || { label: report.report_type, icon: '📄', desc: '' }
  const statusMeta = REPORT_STATUS_META[report.status] || { label: report.status, cls: 'badge-pending' }

  return `
    <div class="report-card" data-report-id="${report.id}">
      <div class="report-card-head">
        <div class="report-type-icon">${typeMeta.icon}</div>
        <span class="badge ${statusMeta.cls}">${statusMeta.label}</span>
      </div>
      <div class="report-card-title">${typeMeta.label}</div>
      <div class="report-card-desc">${typeMeta.desc}</div>
      <div class="report-card-date">${formatDate(report.created_at)}</div>
      <div class="report-card-actions">
        <button class="btn btn-sm ${report.status === 'complete' ? 'btn-primary' : 'btn-ghost'}" ${report.status !== 'complete' ? 'disabled' : ''}>
          ${report.status === 'complete' ? 'View report' : report.status === 'running' ? 'In progress…' : 'Pending'}
        </button>
      </div>
    </div>
  `
}

function renderEmptyReports(session) {
  const isBrand = session.session_type === 'brand_identity'
  return `
    <div class="empty-state-lg">
      <div class="empty-state-icon">📋</div>
      <h3>No reports yet</h3>
      <p>${isBrand ? 'Run your first report to check domain availability, trademarks, and more for your name candidates.' : 'Start with the brand preferences questionnaire to generate your name candidates.'}</p>
    </div>
  `
}

function showAddReportPlaceholder(root, session) {
  // Placeholder — full report creation UI will be built in a future sprint
  const existing = root.querySelector('#add-report-notice')
  if (existing) { existing.remove(); return }

  const notice = document.createElement('div')
  notice.id = 'add-report-notice'
  notice.className = 'inline-status'
  notice.style.cssText = 'margin: 16px 0; max-width: 560px'
  notice.innerHTML = `
    <strong>Report generation coming soon.</strong>
    The report runner is being built — this session is set up and ready to run reports once the engine is live.
    <button class="btn-text" style="margin-left:12px" id="dismiss-notice">Dismiss</button>
  `

  root.querySelector('.session-reports-section')?.insertBefore(
    notice,
    root.querySelector('#reports-list')
  )

  root.querySelector('#dismiss-notice')?.addEventListener('click', () => notice.remove())
}
