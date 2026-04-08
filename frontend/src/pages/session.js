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
  trademark:           { label: 'Trademark Check',     icon: '⚖️',  desc: 'US & EU trademark screening — coming soon' },
  products_for_sale:   { label: 'Products for Sale',   icon: '🛒',  desc: 'Marketplace listing conflicts — coming soon' },
  social_handles:      { label: 'Social Handles',      icon: '📱',  desc: 'Handle availability on major platforms' },
  app_store:           { label: 'App Store',            icon: '📦',  desc: 'iOS & Google Play name check — coming soon' },
  questionnaire:       { label: 'Brand Preferences',   icon: '🎯',  desc: 'Preference questionnaire responses' },
  name_candidates:     { label: 'Name Candidates',     icon: '✨',  desc: 'AI-generated name candidates' },
}

// Report types the runner actually handles. Others stay pending and show "coming soon".
const RUNNABLE_REPORT_TYPES = new Set(['domain_availability', 'social_handles'])

const REPORT_STATUS_META = {
  pending: { label: 'Pending',    cls: 'badge-pending' },
  running: { label: 'Running…',   cls: 'badge-running' },
  complete: { label: 'Complete',  cls: 'badge-complete' },
  error:    { label: 'Error',     cls: 'badge-error' },
}

const SESSION_TYPE_META = {
  brand_identity:  { label: 'Brand Identity Report', icon: '🔍' },
  name_generator:  { label: 'Name Generator',         icon: '✨' },
}

const SOCIAL_LABELS = {
  x: 'X', instagram: 'Instagram', youtube: 'YouTube', github: 'GitHub',
  linkedin: 'LinkedIn', tiktok: 'TikTok', reddit: 'Reddit',
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

// ── Page entry point ──────────────────────────────────────────────────────

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

// ── Polling state (per page mount) ────────────────────────────────────────

let _pollTimer = null

function startPolling(el, sessionId, intervalMs = 4000) {
  stopPolling()
  _pollTimer = setInterval(async () => {
    const resp = await apiFetch(`/api/sessions/${sessionId}`)
    if (!resp.ok) { stopPolling(); return }

    const reports = resp.data.reports || []
    const hasRunning = reports.some((r) => r.status === 'running' || r.status === 'pending')
    const hasComplete = reports.some((r) => r.status === 'complete')

    // If any report just completed, reload the full view
    if (hasComplete) {
      stopPolling()
      const mainEl = el.querySelector('#session-main')
      if (mainEl) renderSession(mainEl, resp.data.session, reports)
      if (hasRunning) startPolling(el, sessionId)
    }

    if (!hasRunning) stopPolling()
  }, intervalMs)
}

function stopPolling() {
  if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null }
}

// ── Data loading ──────────────────────────────────────────────────────────

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

  const session = resp.data.session
  const reports = resp.data.reports || []

  renderSession(mainEl, session, reports)

  // Auto-poll if anything is still running or pending (runner fired async)
  const needsPoll = reports.some((r) => r.status === 'running' || r.status === 'pending')
  if (needsPoll) startPolling(root, sessionId)
}

// ── Session render ────────────────────────────────────────────────────────

function renderSession(el, session, reports) {
  const typeMeta = SESSION_TYPE_META[session.session_type] || { label: session.session_type, icon: '📋' }

  el.innerHTML = `
    <!-- Breadcrumb + header -->
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

    <!-- Reports -->
    <div class="session-reports-section">
      <div class="section-header">
        <h2>Reports</h2>
      </div>
      <div id="reports-list">
        ${reports.length
          ? `<div class="reports-grid">${reports.map((r) => renderReportCard(r, session.id)).join('')}</div>`
          : renderEmptyReports(session)
        }
      </div>
    </div>
  `

  // Wire re-run buttons
  el.querySelectorAll('[data-rerun-report]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const reportId = btn.dataset.rerunReport
      btn.disabled = true
      btn.textContent = 'Re-running…'
      await apiFetch(`/api/sessions/${session.id}/reports/${reportId}/run`, { method: 'POST' })
      // Brief delay then reload
      setTimeout(() => loadSession(el.closest('.page') || el, session.id), 800)
    })
  })

  // Wire expand/collapse on result panels
  el.querySelectorAll('[data-toggle-results]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = el.querySelector(`#results-${btn.dataset.toggleResults}`)
      if (!panel) return
      const isHidden = panel.style.display === 'none'
      panel.style.display = isHidden ? '' : 'none'
      btn.textContent = isHidden ? 'Hide results ↑' : 'View results ↓'
    })
  })
}

// ── Session metadata card ─────────────────────────────────────────────────

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

// ── Report card ───────────────────────────────────────────────────────────

function renderReportCard(report, sessionId) {
  const typeMeta = REPORT_TYPE_META[report.report_type] || { label: report.report_type, icon: '📄', desc: '' }
  const statusMeta = REPORT_STATUS_META[report.status] || { label: report.status, cls: 'badge-pending' }
  const isComplete = report.status === 'complete'
  const isError = report.status === 'error'
  const isRunnable = RUNNABLE_REPORT_TYPES.has(report.report_type)
  const isComingSoon = !isRunnable && report.status === 'pending'

  let resultHtml = ''
  if (isComplete && report.result) {
    resultHtml = renderReportResults(report)
  }

  let actionHtml = ''
  if (isComingSoon) {
    actionHtml = `<span class="badge badge-pending" style="font-size:0.7rem">Coming soon</span>`
  } else if (isError) {
    actionHtml = `
      <button class="btn btn-sm btn-ghost" data-rerun-report="${escHtml(report.id)}">Re-run</button>
    `
  } else if (isComplete && resultHtml) {
    actionHtml = `
      <button class="btn btn-sm btn-primary" data-toggle-results="${escHtml(report.id)}">View results ↓</button>
      <button class="btn btn-sm btn-ghost" data-rerun-report="${escHtml(report.id)}" style="margin-left:8px">Re-run</button>
    `
  } else if (report.status === 'running') {
    actionHtml = `<span class="badge badge-running">Running…</span>`
  } else if (report.status === 'pending' && isRunnable) {
    actionHtml = `<span class="badge badge-pending">Pending</span>`
  }

  return `
    <div class="report-card" data-report-id="${escHtml(report.id)}">
      <div class="report-card-head">
        <div class="report-type-icon">${typeMeta.icon}</div>
        <span class="badge ${statusMeta.cls}">${statusMeta.label}</span>
      </div>
      <div class="report-card-title">${typeMeta.label}</div>
      <div class="report-card-desc">${typeMeta.desc}</div>
      <div class="report-card-date">${formatDate(report.created_at)}</div>
      <div class="report-card-actions">${actionHtml}</div>
      ${resultHtml ? `<div id="results-${escHtml(report.id)}" class="report-results-panel" style="display:none">${resultHtml}</div>` : ''}
    </div>
  `
}

// ── Result renderers ──────────────────────────────────────────────────────

function renderReportResults(report) {
  if (report.report_type === 'domain_availability') return renderDomainResults(report.result)
  if (report.report_type === 'social_handles') return renderSocialResults(report.result)
  return ''
}

function statusDot(status) {
  if (status === 'available') return `<span class="avail-dot avail-dot--available" title="Available">✓</span>`
  if (status === 'taken')     return `<span class="avail-dot avail-dot--taken" title="Taken">✕</span>`
  return `<span class="avail-dot avail-dot--unknown" title="Unknown">?</span>`
}

function renderDomainResults(result) {
  if (!result || !Array.isArray(result.names) || !result.names.length) return ''
  const tlds = result.tlds || ['.com', '.io', '.ai', '.co', '.app', '.dev']

  const headerCells = tlds.map((t) => `<th>${escHtml(t)}</th>`).join('')
  const rows = result.names.map((nameRow) => {
    const cells = tlds.map((tld) => {
      const s = nameRow.tlds ? (nameRow.tlds[tld] || 'unknown') : 'unknown'
      return `<td>${statusDot(s)}</td>`
    }).join('')
    return `<tr><td class="avail-name">${escHtml(nameRow.name)}</td>${cells}</tr>`
  }).join('')

  const checkedAt = result.checked_at
    ? `<div class="report-checked-at">Checked ${formatDate(result.checked_at)}</div>`
    : ''

  return `
    <div class="avail-table-wrap">
      <table class="avail-table">
        <thead><tr><th>Name</th>${headerCells}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="avail-legend">
        <span class="avail-dot avail-dot--available">✓</span> Available &nbsp;
        <span class="avail-dot avail-dot--taken">✕</span> Taken &nbsp;
        <span class="avail-dot avail-dot--unknown">?</span> Unknown
      </div>
      ${checkedAt}
    </div>
  `
}

function renderSocialResults(result) {
  if (!result || !Array.isArray(result.names) || !result.names.length) return ''

  // Collect which platforms appeared in any result
  const platforms = new Set()
  for (const nameRow of result.names) {
    for (const key of Object.keys(nameRow.handles || {})) platforms.add(key)
  }
  const platformList = [...platforms]

  const headerCells = platformList.map((p) => `<th>${escHtml(SOCIAL_LABELS[p] || p)}</th>`).join('')
  const rows = result.names.map((nameRow) => {
    const cells = platformList.map((p) => {
      const h = nameRow.handles ? nameRow.handles[p] : null
      const s = h ? h.status : 'unknown'
      return `<td>${statusDot(s)}</td>`
    }).join('')
    return `<tr><td class="avail-name">${escHtml(nameRow.name)}</td>${cells}</tr>`
  }).join('')

  const checkedAt = result.checked_at
    ? `<div class="report-checked-at">Checked ${formatDate(result.checked_at)}</div>`
    : ''

  return `
    <div class="avail-table-wrap">
      <table class="avail-table">
        <thead><tr><th>Name</th>${headerCells}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="avail-legend">
        <span class="avail-dot avail-dot--available">✓</span> Available &nbsp;
        <span class="avail-dot avail-dot--taken">✕</span> Taken &nbsp;
        <span class="avail-dot avail-dot--unknown">?</span> Unknown
      </div>
      ${checkedAt}
    </div>
  `
}

// ── Empty state ───────────────────────────────────────────────────────────

function renderEmptyReports(session) {
  const isBrand = session.session_type === 'brand_identity'
  return `
    <div class="empty-state-lg">
      <div class="empty-state-icon">📋</div>
      <h3>No reports yet</h3>
      <p>${isBrand
        ? 'Reports are generated automatically when you create a session. If nothing appeared, try refreshing.'
        : 'Start with the brand preferences questionnaire to generate your name candidates.'
      }</p>
    </div>
  `
}
