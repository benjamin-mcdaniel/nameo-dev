const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

export function Advanced() {
  const el = document.createElement('section')
  el.className = 'page advanced container'
  el.innerHTML = `
    <div class="page-header">
      <div class="eyebrow">Advanced</div>
      <h1>Name research wizard</h1>
      <p>Deep-dive availability research for your product launch candidates.</p>
    </div>
    <div class="inline-status" style="max-width:560px">
      Advanced project workflows are coming soon. In the meantime, use
      <a href="#/search">Quick Search</a> to check individual names, or manage your
      <a href="#/campaigns">Projects</a>.
    </div>
  `
  return el
}
