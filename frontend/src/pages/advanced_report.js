const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

export function AdvancedReport() {
  const el = document.createElement('section')
  el.className = 'page advanced-report container'
  el.innerHTML = `
    <div class="page-header">
      <div class="eyebrow">Report</div>
      <h1>Name availability report</h1>
      <p>Full availability breakdown across all surfaces for your name candidates.</p>
    </div>
    <div class="inline-status" style="max-width:560px">
      Detailed reports are coming soon. Head back to <a href="#/campaigns">Projects</a> to manage your launch research.
    </div>
  `
  return el
}
