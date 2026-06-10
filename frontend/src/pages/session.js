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

const REPORT_TYPE_META = {
  domain_availability: { label: 'Domain Availability', icon: '🌐', desc: 'Domain availability across TLDs' },
  trademark:           { label: 'Trademark Check',     icon: '⚖️',  desc: 'US trademark screening for potential conflicts' },
  products_for_sale:   { label: 'Products for Sale',   icon: '🛒',  desc: 'Amazon marketplace listing conflicts' },
  social_handles:      { label: 'Social Handles',      icon: '📱',  desc: 'Handle availability on major platforms' },
  app_store:           { label: 'App Store',            icon: '📦',  desc: 'iOS App Store name conflict check' },
  questionnaire:       { label: 'Brand Preferences',   icon: '🎯',  desc: 'Preference questionnaire responses' },
  name_candidates:     { label: 'Name Candidates',     icon: '✨',  desc: 'AI-generated name candidates' },
}

// Report types the runner actually handles. Others stay pending and show "coming soon".
const RUNNABLE_REPORT_TYPES = new Set(['domain_availability', 'social_handles', 'app_store', 'products_for_sale', 'trademark', 'questionnaire', 'name_candidates'])

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

// Platforms that can be checked without API keys
const SOCIAL_LIVE_PLATFORMS = new Set(['github', 'reddit', 'x'])

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
        ${session.session_type === 'brand_identity' && reports.every((r) => r.status === 'complete' || r.status === 'error')
          ? `<button id="btn-export-pdf" class="btn btn-ghost" style="align-self:flex-start;margin-top:4px">↓ Download PDF</button>`
          : ''}
      </div>
    </div>

    <!-- Session metadata summary -->
    ${renderSessionMeta(session)}

    <!-- Reports -->
    <div class="session-reports-section">
      <div class="section-header">
        <h2>Reports</h2>
        ${reports.some((r) => r.status === 'running' || r.status === 'pending')
          ? `<span class="polling-indicator"><span class="polling-dot"></span> Checking…</span>`
          : ''}
        ${reports.some((r) => r.status === 'pending') && reports.some((r) => r.status !== 'running')
          ? `<button id="btn-run-all" class="btn btn-sm btn-primary" style="margin-left:auto">Run all</button>`
          : ''}
      </div>
      <div id="reports-list">
        ${reports.length
          ? `<div class="reports-list">${reports.map((r) => renderReportCard(r, session.id)).join('')}</div>`
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
      setTimeout(() => loadSession(el.closest('.page') || el, session.id), 800)
    })
  })

  // Wire Run all button
  el.querySelector('#btn-run-all')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget
    btn.disabled = true
    btn.textContent = 'Starting…'
    const pending = reports.filter((r) => r.status === 'pending')
    await Promise.all(
      pending.map((r) => apiFetch(`/api/sessions/${session.id}/reports/${r.id}/run`, { method: 'POST' }))
    )
    setTimeout(() => loadSession(el.closest('.page') || el, session.id), 600)
  })

  // Wire PDF export button
  const pdfBtn = el.querySelector('#btn-export-pdf')
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => openPdfWindow(session, reports))
  }
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

  // Questionnaire shows its content from input (it's always "complete" once submitted)
  const isQuestionnaire = report.report_type === 'questionnaire'
  const isNameCandidates = report.report_type === 'name_candidates'

  let resultHtml = ''
  if (isQuestionnaire) {
    resultHtml = renderReportResults(report)
  } else if (isComplete && report.result) {
    resultHtml = renderReportResults(report)
  }

  let actionHtml = ''
  if (isComingSoon) {
    actionHtml = `<span class="badge badge-pending" style="font-size:0.7rem">Coming soon</span>`
  } else if (isError) {
    actionHtml = `<button class="btn btn-sm btn-ghost" data-rerun-report="${escHtml(report.id)}">Retry</button>`
  } else if (isNameCandidates && isComplete) {
    actionHtml = `<button class="btn btn-sm btn-ghost" data-rerun-report="${escHtml(report.id)}">Regenerate</button>`
  } else if (isComplete && !isQuestionnaire) {
    actionHtml = `<button class="btn btn-sm btn-ghost" data-rerun-report="${escHtml(report.id)}">Re-run</button>`
  } else if (report.status === 'running') {
    actionHtml = `<span class="badge badge-running">Running…</span>`
  } else if (report.status === 'pending' && isRunnable) {
    actionHtml = `<span class="badge badge-pending">Pending</span>`
  }

  // Results are always shown inline — no toggle
  const resultPanelHtml = resultHtml
    ? `<div class="report-results-panel">${resultHtml}</div>`
    : ''

  return `
    <div class="report-card report-card--row" data-report-id="${escHtml(report.id)}">
      <div class="report-card-head-row">
        <div class="report-card-title-group">
          <span class="report-type-icon">${typeMeta.icon}</span>
          <div>
            <div class="report-card-title">${typeMeta.label}</div>
            <div class="report-card-desc">${typeMeta.desc}</div>
          </div>
        </div>
        <div class="report-card-actions">
          <span class="badge ${statusMeta.cls}">${statusMeta.label}</span>
          ${actionHtml}
        </div>
      </div>
      ${resultPanelHtml}
    </div>
  `
}

// ── Result renderers ──────────────────────────────────────────────────────

function renderReportResults(report) {
  if (report.report_type === 'domain_availability') return renderDomainResults(report.result)
  if (report.report_type === 'social_handles') return renderSocialResults(report.result)
  if (report.report_type === 'app_store') return renderAppStoreResults(report.result)
  if (report.report_type === 'products_for_sale') return renderProductsResults(report.result)
  if (report.report_type === 'trademark') return renderTrademarkResults(report.result)
  if (report.report_type === 'questionnaire') return renderQuestionnaireResults(report.result || report.input)
  if (report.report_type === 'name_candidates') return renderNameCandidatesResults(report.result)
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

  // Collect platforms, live ones first, then api-key-required ones
  const allPlatforms = new Set()
  for (const nameRow of result.names) {
    for (const key of Object.keys(nameRow.handles || {})) allPlatforms.add(key)
  }
  const livePlatforms    = [...allPlatforms].filter((p) => SOCIAL_LIVE_PLATFORMS.has(p))
  const blockedPlatforms = [...allPlatforms].filter((p) => !SOCIAL_LIVE_PLATFORMS.has(p))
  const platformList     = [...livePlatforms, ...blockedPlatforms]

  const headerCells = platformList.map((p) => {
    const isBlocked = !SOCIAL_LIVE_PLATFORMS.has(p)
    return `<th class="${isBlocked ? 'avail-th--muted' : ''}">${escHtml(SOCIAL_LABELS[p] || p)}${isBlocked ? ' <span class="avail-key-note">🔑</span>' : ''}</th>`
  }).join('')

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

  const keyNote = blockedPlatforms.length
    ? `<div class="avail-key-note-legend">🔑 These platforms require an API key to check. Results shown as unknown.</div>`
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
      ${keyNote}
      ${checkedAt}
    </div>
  `
}

// ── App Store result renderer ─────────────────────────────────────────────

function matchBadge(match) {
  if (match === 'exact')    return `<span class="badge badge-error">Exact match</span>`
  if (match === 'strong')   return `<span class="badge badge-warning">Strong match</span>`
  if (match === 'contains') return `<span class="badge badge-pending">Contains name</span>`
  return `<span class="badge badge-muted">Partial</span>`
}

function conflictStatusBadge(status) {
  if (status === 'conflict') return `<span class="badge badge-error">Conflict found</span>`
  if (status === 'possible') return `<span class="badge badge-warning">Possible conflicts</span>`
  return `<span class="badge badge-complete">Clear</span>`
}

function renderAppStoreResults(result) {
  if (!result || !Array.isArray(result.names) || !result.names.length) return ''

  const rows = result.names.map((nameRow) => {
    const apps = nameRow.apps || []
    const appListHtml = apps.length
      ? apps.slice(0, 5).map((app) => `
          <div class="conflict-item">
            <div class="conflict-item-main">
              <strong>${escHtml(app.name)}</strong>
              <span class="conflict-item-detail">${escHtml(app.developer)}${app.category ? ` · ${escHtml(app.category)}` : ''}</span>
            </div>
            ${matchBadge(app.match)}
          </div>
        `).join('')
      : `<div class="conflict-empty">No apps found matching this name.</div>`

    return `
      <div class="conflict-name-group">
        <div class="conflict-name-header">
          <span class="avail-name">${escHtml(nameRow.name)}</span>
          ${conflictStatusBadge(nameRow.status)}
        </div>
        <div class="conflict-items">${appListHtml}</div>
      </div>
    `
  }).join('')

  const checkedAt = result.checked_at
    ? `<div class="report-checked-at">Checked ${formatDate(result.checked_at)}</div>`
    : ''

  return `<div class="conflict-results-wrap">${rows}${checkedAt}</div>`
}

// ── Products for Sale result renderer ─────────────────────────────────────

function renderProductsResults(result) {
  if (!result || !Array.isArray(result.names) || !result.names.length) return ''

  const rows = result.names.map((nameRow) => {
    const suggestions = nameRow.suggestions || []
    const listHtml = suggestions.length
      ? `<div class="conflict-items">
          ${suggestions.map((s) => `
            <div class="conflict-item">
              <div class="conflict-item-main">${escHtml(s)}</div>
            </div>
          `).join('')}
        </div>`
      : `<div class="conflict-empty">No matching product listings found.</div>`

    return `
      <div class="conflict-name-group">
        <div class="conflict-name-header">
          <span class="avail-name">${escHtml(nameRow.name)}</span>
          ${conflictStatusBadge(nameRow.status)}
          <span class="badge badge-muted">${nameRow.total_suggestions} suggestion${nameRow.total_suggestions !== 1 ? 's' : ''}</span>
        </div>
        ${listHtml}
      </div>
    `
  }).join('')

  const checkedAt = result.checked_at
    ? `<div class="report-checked-at">Checked ${formatDate(result.checked_at)}</div>`
    : ''

  return `<div class="conflict-results-wrap">${rows}${checkedAt}</div>`
}

// ── Trademark result renderer ─────────────────────────────────────────────

function renderTrademarkResults(result) {
  if (!result || !Array.isArray(result.names) || !result.names.length) return ''

  const rows = result.names.map((nameRow) => {
    if (nameRow.status === 'unavailable') {
      return `
        <div class="conflict-name-group">
          <div class="conflict-name-header">
            <span class="avail-name">${escHtml(nameRow.name)}</span>
            <span class="badge badge-pending">Search unavailable</span>
          </div>
          <div class="conflict-empty">${escHtml(nameRow.message || 'Could not reach trademark search. Try again later.')}</div>
        </div>
      `
    }

    const topResults = nameRow.top_results || []
    const listHtml = topResults.length
      ? `<div class="conflict-items">
          ${topResults.map((r) => `
            <div class="conflict-item">
              <div class="conflict-item-main">
                <strong>${escHtml(r.mark)}</strong>
                ${r.serial ? `<span class="conflict-item-detail">Serial: ${escHtml(r.serial)}</span>` : ''}
                ${r.owner ? `<span class="conflict-item-detail">${escHtml(r.owner)}</span>` : ''}
              </div>
              ${r.status ? `<span class="badge badge-muted">${escHtml(r.status)}</span>` : ''}
            </div>
          `).join('')}
        </div>`
      : `<div class="conflict-empty">No trademark records found for this name.</div>`

    return `
      <div class="conflict-name-group">
        <div class="conflict-name-header">
          <span class="avail-name">${escHtml(nameRow.name)}</span>
          ${conflictStatusBadge(nameRow.status)}
          ${nameRow.total_results ? `<span class="badge badge-muted">${nameRow.total_results} result${nameRow.total_results !== 1 ? 's' : ''}</span>` : ''}
        </div>
        ${listHtml}
      </div>
    `
  }).join('')

  const checkedAt = result.checked_at
    ? `<div class="report-checked-at">Checked ${formatDate(result.checked_at)}</div>`
    : ''

  return `<div class="conflict-results-wrap">${rows}${checkedAt}</div>`
}

// ── Questionnaire result renderer ────────────────────────────────────────

const VIBE_LABELS = {
  technical: '⚙️ Technical', friendly: '😊 Friendly', premium: '💎 Premium',
  playful: '🎉 Playful', minimal: '◻️ Minimal', bold: '🔥 Bold',
}

const LENGTH_LABELS = { short: 'Short (1–5 chars)', medium: 'Medium (6–9 chars)', any: 'No preference' }

function renderQuestionnaireResults(data) {
  // data may come from result_json or input_json depending on how it was stored
  if (!data) return `<div class="conflict-empty">No questionnaire data found.</div>`

  const rows = []

  if (data.product_description) {
    rows.push({ label: 'Product', value: escHtml(data.product_description) })
  }
  if (data.industry) {
    rows.push({ label: 'Industry', value: escHtml(data.industry) })
  }
  if (data.vibes?.length) {
    const vibeChips = data.vibes.map((v) =>
      `<span class="report-type-chip">${escHtml(VIBE_LABELS[v] || v)}</span>`
    ).join('')
    rows.push({ label: 'Brand vibe', value: vibeChips, isHtml: true })
  }
  if (data.name_length) {
    rows.push({ label: 'Name length', value: escHtml(LENGTH_LABELS[data.name_length] || data.name_length) })
  }
  if (data.start_letters) {
    rows.push({ label: 'Starts with', value: escHtml(data.start_letters) })
  }
  if (data.avoid_words) {
    rows.push({ label: 'Avoid', value: escHtml(data.avoid_words) })
  }

  if (!rows.length) return `<div class="conflict-empty">No preferences recorded.</div>`

  const rowsHtml = rows.map(({ label, value }) => `
    <div class="smc-row">
      <span class="smc-label">${label}</span>
      <span class="smc-value">${value}</span>
    </div>
  `).join('')

  return `
    <div class="questionnaire-results">
      <div class="session-meta-card" style="margin:0">
        ${rowsHtml}
      </div>
    </div>
  `
}

// ── Name candidates result renderer ──────────────────────────────────────

function candidateScoreDot(score) {
  if (!score && score !== 0) return ''
  const pct = Math.min(100, Math.max(0, score))
  const cls = pct >= 75 ? 'score-high' : pct >= 50 ? 'score-mid' : 'score-low'
  return `<span class="candidate-score ${cls}" title="Fit score">${pct}</span>`
}

function renderNameCandidatesResults(result) {
  if (!result) {
    return `
      <div class="candidates-pending">
        <div class="candidates-pending-icon">✨</div>
        <p>Name candidates are being generated based on your brand preferences.</p>
        <p class="text-muted" style="font-size:0.875rem">This may take a moment. The page will update automatically.</p>
      </div>
    `
  }

  const names = result.names || result.candidates || []
  if (!names.length) {
    return `<div class="conflict-empty">No name candidates were generated. Try regenerating.</div>`
  }

  const cardsHtml = names.map((c) => {
    const name = c.name || c
    const rationale = c.rationale || c.reason || ''
    const score = typeof c.score === 'number' ? c.score : null
    const tldHints = c.tlds || []

    const tldPills = tldHints.slice(0, 3).map((t) => {
      const s = t.status || 'unknown'
      const dotCls = s === 'available' ? 'avail-dot--available' : s === 'taken' ? 'avail-dot--taken' : 'avail-dot--unknown'
      return `<span class="avail-dot ${dotCls}" title="${escHtml(t.tld || '')} ${s}" style="font-size:0.7rem;margin-right:2px">${s === 'available' ? '✓' : s === 'taken' ? '✕' : '?'}</span><span style="font-size:0.75rem;color:var(--text-muted)">${escHtml(t.tld || '')}</span>`
    }).join(' ')

    const checkLink = `#/sessions/new?prefill=${encodeURIComponent(name)}`

    return `
      <div class="candidate-card">
        <div class="candidate-card-top">
          <span class="candidate-name">${escHtml(name)}</span>
          ${candidateScoreDot(score)}
        </div>
        ${rationale ? `<p class="candidate-rationale">${escHtml(rationale)}</p>` : ''}
        ${tldPills ? `<div class="candidate-tlds">${tldPills}</div>` : ''}
        <div class="candidate-card-actions">
          <a href="${checkLink}" class="btn btn-sm btn-primary">Check this name →</a>
        </div>
      </div>
    `
  }).join('')

  const generatedAt = result.generated_at
    ? `<div class="report-checked-at">Generated ${formatDate(result.generated_at)}</div>`
    : ''

  return `
    <div class="candidates-results">
      <div class="candidates-grid">${cardsHtml}</div>
      ${generatedAt}
    </div>
  `
}

// ── Empty state ───────────────────────────────────────────────────────────

function renderEmptyReports(session) {
  const isBrand = session.session_type === 'brand_identity'
  const msg = isBrand
    ? 'Reports are generated automatically when you create a session. If nothing appeared, try refreshing.'
    : 'Start with the brand preferences questionnaire to generate your name candidates.'
  return (
    '<div class="empty-state-lg">' +
    '<div class="empty-state-icon">&#128203;</div>' +
    '<h3>No reports yet</h3>' +
    '<p>' + msg + '</p>' +
    '</div>'
  )
}

// ── PDF export ────────────────────────────────────────────────────────────
//
// Opens a print-ready HTML window then triggers window.print() so the user
// can save it as a PDF via the browser's native dialog. No external libs.

function pdfStatusSymbol(status) {
  if (status === 'available') return '✓'
  if (status === 'taken')     return '✗'
  if (status === 'conflict')  return '✗'
  if (status === 'possible')  return '~'
  if (status === 'clear')     return '✓'
  return '?'
}

function buildPdfDomainSection(result) {
  if (!result || !Array.isArray(result.names) || !result.names.length) return '<p>No data.</p>'
  const tlds = result.tlds || ['.com', '.io', '.ai', '.co', '.app', '.dev']
  const headerCells = ['<th>Name</th>', ...tlds.map((t) => '<th>' + t + '</th>')].join('')
  const rows = result.names.map((row) => {
    const cells = tlds.map((tld) => {
      const s = row.tlds ? (row.tlds[tld] || 'unknown') : 'unknown'
      const sym = pdfStatusSymbol(s)
      const cls = s === 'available' ? 'avail' : s === 'taken' ? 'taken' : 'unk'
      return '<td class="' + cls + '">' + sym + '</td>'
    }).join('')
    return '<tr><td><strong>' + row.name + '</strong></td>' + cells + '</tr>'
  }).join('')
  return '<table><thead><tr>' + headerCells + '</tr></thead><tbody>' + rows + '</tbody></table>'
}

function buildPdfSocialSection(result) {
  if (!result || !Array.isArray(result.names) || !result.names.length) return '<p>No data.</p>'
  const platforms = new Set()
  for (const r of result.names) for (const k of Object.keys(r.handles || {})) platforms.add(k)
  const platformList = [...platforms]
  const labels = {
    x: 'X', instagram: 'Instagram', youtube: 'YouTube', github: 'GitHub',
    linkedin: 'LinkedIn', tiktok: 'TikTok', reddit: 'Reddit', facebook: 'Facebook',
    pinterest: 'Pinterest', medium: 'Medium', twitch: 'Twitch',
    producthunt: 'Product Hunt', substack: 'Substack',
  }
  const headerCells = ['<th>Name</th>', ...platformList.map((p) => '<th>' + (labels[p] || p) + '</th>')].join('')
  const rows = result.names.map((row) => {
    const cells = platformList.map((p) => {
      const s = row.handles && row.handles[p] ? row.handles[p].status : 'unknown'
      const sym = pdfStatusSymbol(s)
      const cls = s === 'available' ? 'avail' : s === 'taken' ? 'taken' : 'unk'
      return '<td class="' + cls + '">' + sym + '</td>'
    }).join('')
    return '<tr><td><strong>' + row.name + '</strong></td>' + cells + '</tr>'
  }).join('')
  return '<table><thead><tr>' + headerCells + '</tr></thead><tbody>' + rows + '</tbody></table>'
}

function buildPdfSimpleStatusSection(result) {
  if (!result || !Array.isArray(result.names) || !result.names.length) return '<p>No data.</p>'
  const rows = result.names.map((row) => {
    const sym = pdfStatusSymbol(row.status)
    const cls = row.status === 'clear' ? 'avail' : row.status === 'conflict' ? 'taken' : 'unk'
    return '<tr><td><strong>' + row.name + '</strong></td><td class="' + cls + '">' + sym + ' ' + (row.status || '') + '</td><td>' + (row.total_results || 0) + ' result(s)</td></tr>'
  }).join('')
  return '<table><thead><tr><th>Name</th><th>Status</th><th>Results</th></tr></thead><tbody>' + rows + '</tbody></table>'
}

function buildPdfReportSection(report) {
  const meta = REPORT_TYPE_META[report.report_type] || { label: report.report_type, icon: '' }
  let body = '<p>No results available.</p>'
  if (report.status === 'complete' && report.result) {
    if      (report.report_type === 'domain_availability')  body = buildPdfDomainSection(report.result)
    else if (report.report_type === 'social_handles')       body = buildPdfSocialSection(report.result)
    else if (report.report_type === 'app_store')            body = buildPdfSimpleStatusSection(report.result)
    else if (report.report_type === 'products_for_sale')    body = buildPdfSimpleStatusSection(report.result)
    else if (report.report_type === 'trademark')            body = buildPdfSimpleStatusSection(report.result)
  } else if (report.status === 'error') {
    body = '<p class="unk">This check encountered an error. Re-run the report to retry.</p>'
  }
  return '<section class="pdf-report"><h3>' + meta.icon + ' ' + meta.label + '</h3>' + body + '</section>'
}

function openPdfWindow(session, reports) {
  const meta   = session.metadata || {}
  const names  = (meta.brand_names || []).join(', ')
  const date   = formatDate(session.created_at)
  const today  = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const brandReports = reports.filter((r) =>
    ['domain_availability', 'social_handles', 'app_store', 'products_for_sale', 'trademark'].includes(r.report_type)
  )
  const reportSections = brandReports.map(buildPdfReportSection).join('')

  const css = [
    '* { box-sizing: border-box; margin: 0; padding: 0; }',
    'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 12px; color: #111; background: #fff; padding: 32px 40px; }',
    '.pdf-header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px; }',
    '.pdf-brand { font-size: 20px; font-weight: 700; color: #6366f1; letter-spacing: -0.5px; }',
    '.pdf-brand span { color: #111; }',
    '.pdf-meta { text-align: right; color: #555; font-size: 11px; line-height: 1.6; }',
    '.pdf-names { background: #f5f5ff; border-left: 3px solid #6366f1; padding: 10px 14px; margin-bottom: 24px; border-radius: 0 6px 6px 0; }',
    '.pdf-names strong { font-size: 13px; display: block; margin-bottom: 4px; }',
    '.pdf-report { margin-bottom: 24px; page-break-inside: avoid; }',
    '.pdf-report h3 { font-size: 13px; font-weight: 600; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e5e5e5; color: #333; }',
    'table { width: 100%; border-collapse: collapse; font-size: 11px; }',
    'th { background: #f0f0f8; text-align: left; padding: 6px 8px; font-weight: 600; color: #444; border: 1px solid #e0e0e8; }',
    'td { padding: 5px 8px; border: 1px solid #eee; }',
    'tr:nth-child(even) td { background: #fafafa; }',
    'td.avail { color: #16a34a; font-weight: 600; }',
    'td.taken { color: #dc2626; font-weight: 600; }',
    'td.unk   { color: #999; }',
    '.pdf-footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #eee; font-size: 10px; color: #999; text-align: center; }',
    '@media print { body { padding: 0; } .pdf-report { page-break-inside: avoid; } }',
  ].join('\n')

  const nameBlock = names
    ? '<div class="pdf-names"><strong>Names researched</strong><span>' + names + '</span></div>'
    : ''

  const html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Nameo Report — '
    + escHtml(session.name)
    + '</title><style>' + css + '</style></head><body>'
    + '<div class="pdf-header"><div>'
    + '<div class="pdf-brand">nameo<span>.dev</span></div>'
    + '<div style="font-size:15px;font-weight:600;margin-top:6px">' + escHtml(session.name) + '</div>'
    + '<div style="color:#555;font-size:11px;margin-top:2px">Brand Identity Report</div>'
    + '</div><div class="pdf-meta"><div>Generated ' + today + '</div><div>Session created ' + date + '</div></div></div>'
    + nameBlock
    + reportSections
    + '<div class="pdf-footer">Generated by Nameo · nameo.dev · Data sourced from public registries. Not legal advice.</div>'
    + '</body></html>'

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) {
    alert('Pop-up blocked — please allow pop-ups for nameo.dev to export PDFs.')
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(function() { win.print() }, 600)
}
