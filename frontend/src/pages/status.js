const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

export function Status() {
  const el = document.createElement('section')
  el.className = 'page status'
  el.innerHTML = `
    <div class="container status-page">
      <div class="status-panel">
        <h1>Service Status</h1>
        <p class="sub">This page runs a lightweight check against the backend and reports platform status. Some platforms block automated checks and will show as self-check only.</p>
        <div id="status-summary" class="status"></div>
        <div id="status-results" class="results"></div>
        <div class="actions">
          <button id="btn-refresh-status" class="btn" type="button">Run checks again</button>
        </div>
      </div>
    </div>
  `

  attachStatusLogic(el)
  return el
}

function attachStatusLogic(root) {
  const summaryEl = root.querySelector('#status-summary')
  const resultsEl = root.querySelector('#status-results')
  const refreshBtn = root.querySelector('#btn-refresh-status')

  if (!summaryEl || !resultsEl || !refreshBtn) return

  async function runChecks() {
    summaryEl.textContent = 'Running checks…'
    resultsEl.innerHTML = ''

    let data
    try {
      // Hidden test search: the UI never shows the query string.
      const url = `${API_BASE}/api/check?name=${encodeURIComponent('cocacola')}&debug=1`
      const res = await fetch(url)
      data = await res.json().catch(() => ({}))
      if (!res.ok) {
        summaryEl.textContent = 'Checks failed: backend not reachable.'
        return
      }
    } catch {
      summaryEl.textContent = 'Checks failed: network error.'
      return
    }

    const results = Array.isArray(data.results) ? data.results : []

    const statusRank = (status) => {
      switch (status) {
        case 'available':
          return 0
        case 'taken':
          return 1
        case 'unknown':
          return 2
        case 'coming_soon':
          return 3
        default:
          return 9
      }
    }

    const rows = results
      .map((r) => {
        const service = r?.label || r?.service || 'service'
        const status = r?.status || 'unknown'
        const code = typeof r?.code === 'number' ? r.code : null

        let display = 'Unknown'
        let note = ''

        if (status === 'unknown' && (code === 403 || code === 429)) {
          display = 'Self-check only'
          note = `HTTP ${code}`
        } else if (status === 'error') {
          display = 'Not working'
          note = code ? `HTTP ${code}` : ''
        } else if (status === 'coming_soon') {
          display = 'Unknown'
          note = 'coming soon'
        } else if (status === 'available' || status === 'taken') {
          display = 'Working'
          note = code ? `HTTP ${code}` : ''
        } else if (status === 'unknown') {
          display = 'Unknown'
          note = code ? `HTTP ${code}` : ''
        } else {
          display = 'Unknown'
          note = code ? `HTTP ${code}` : ''
        }

        const sortStatus = display === 'Not working'
          ? 'error'
          : display === 'Self-check only'
            ? 'unknown'
            : display === 'Working'
              ? 'available'
              : 'unknown'

        return { serviceText: String(service), status: sortStatus, display, note, code }
      })
      .sort((a, b) => {
        const byStatus = statusRank(a.status) - statusRank(b.status)
        if (byStatus !== 0) return byStatus
        return (a.serviceText || '').localeCompare(b.serviceText || '')
      })
      .map((row) => {
        return `
          <tr>
            <td>${row.serviceText}</td>
            <td class="result-${row.status}">${row.display}</td>
            <td class="hint">${row.note || ''}</td>
          </tr>
        `
      })
      .join('')

    resultsEl.innerHTML = `
      <table class="results-table">
        <thead>
          <tr>
            <th>Source</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `

    const anyHardErrors = results.some((r) => r && (r.status === 'error' || r.status === 'unsupported'))
    summaryEl.textContent = anyHardErrors ? 'Some checks are currently failing.' : 'Status page check completed.'
  }

  refreshBtn.addEventListener('click', () => {
    runChecks()
  })

  // Run once on page load
  runChecks()
}
