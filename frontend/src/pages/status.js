const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

export function Status() {
  const el = document.createElement('section')
  el.className = 'page status-page'

  el.innerHTML = `
    <div class="status-panel">
      <div class="eyebrow">System Status</div>
      <h1>Service health</h1>
      <p class="hint" style="margin-bottom:20px">Live status of Nameo services.</p>
      <div id="status-content">
        <p class="hint">Checking status…</p>
      </div>
    </div>
  `

  const contentEl = el.querySelector('#status-content')

  fetch(`${API_BASE}/api/health`)
    .then((r) => r.json())
    .catch(() => null)
    .then((data) => {
      if (!data) {
        contentEl.innerHTML = `<p class="hint" style="color:var(--error)">Unable to reach the API right now.</p>`
        return
      }

      const workerOk = data.worker?.healthy
      const orchOk = data.orchestrator?.reachable

      contentEl.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:10px">
          <div class="inline-status ${workerOk ? 'is-success' : 'is-error'}">
            <strong>API Worker</strong>&nbsp;&mdash;&nbsp;${workerOk ? 'Operational' : 'Degraded'}
          </div>
          <div class="inline-status ${orchOk ? 'is-success' : 'is-warning'}">
            <strong>Search Orchestrator</strong>&nbsp;&mdash;&nbsp;${orchOk ? 'Operational' : 'Unavailable (fallback active)'}
          </div>
        </div>
      `
    })

  return el
}
