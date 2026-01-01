const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

const STATUS_EXPECTATIONS = {
  x: 'taken',
  instagram: 'taken',
  facebook: 'taken',
  youtube: 'taken',
  tiktok: 'taken',
  pinterest: 'taken',
  linkedin: 'taken',
  github: 'taken',
  reddit: 'taken',
  medium: 'taken',
}

export function Status() {
  const el = document.createElement('section')
  el.className = 'page status container'
  el.innerHTML = `
    <h1>Service Status</h1>
    <p class="sub">This page runs a small internal check against the search backend to confirm that platform checks are behaving as expected.</p>
    <div id="status-summary" class="status"></div>
    <div id="status-results" class="results"></div>
    <div class="actions">
      <button id="btn-refresh-status" class="btn" type="button">Run checks again</button>
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
      const url = `${API_BASE}/api/check?name=${encodeURIComponent('cocacola')}`
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

    const byService = new Map()
    for (const r of data.results || []) {
      if (r && r.service) byService.set(r.service, r.status || 'unknown')
    }

    const rows = Object.entries(STATUS_EXPECTATIONS)
      .map(([service, expected]) => {
        const actual = byService.get(service)
        const ok = actual === expected
        const label = ok ? 'ok' : 'broken'
        const rowClass = ok ? 'result-available' : 'result-taken'
        return `
          <tr>
            <td>${service}</td>
            <td class="${rowClass}">${label}</td>
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
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `

    const anyBroken = Object.entries(STATUS_EXPECTATIONS).some(([service, expected]) => {
      const actual = byService.get(service)
      return actual !== expected
    })

    summaryEl.textContent = anyBroken ? 'Some checks are currently broken.' : 'All checks are currently passing.'
  }

  refreshBtn.addEventListener('click', () => {
    runChecks()
  })

  // Run once on page load
  runChecks()
}
