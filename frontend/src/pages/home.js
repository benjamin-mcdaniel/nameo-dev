const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

export function Home() {
  const el = document.createElement('section')
  el.className = 'page home'
  el.innerHTML = `
    <section class="hero home-hero">
      <div class="container hero-inner home-hero-inner">
        <div class="home-hero-copy">
          <div class="home-hero-eyebrow">Nameo.dev • Everywhere identity Search</div>
          <h1>Find a name you can actually use.</h1>
          <p class="sub">Limited beta: best-effort checks across core platforms. Some destinations may require manual verification when they block automated requests.</p>
          <div class="actions home-hero-actions">
            <a class="btn btn-primary" href="#/search">Start searching</a>
            <a class="btn" href="#/pricing">Beta tiers</a>
          </div>
        </div>

        <div class="home-hero-panel">
          <div class="home-hero-panel-title">What you get</div>
          <div class="home-hero-panel-grid">
            <div class="home-hero-panel-item">
              <div class="home-hero-panel-kicker">Fast Search</div>
              <div>One input, many checks.</div>
            </div>
            <div class="home-hero-panel-item">
              <div class="home-hero-panel-kicker">Clear Results</div>
              <div>Simple available/taken signals.</div>
            </div>
            <div class="home-hero-panel-item">
              <div class="home-hero-panel-kicker">Pro Guided Search</div>
              <div>Suggestions and alternatives to keep you moving if your running into roadblocks.</div>
            </div>
            <div class="home-hero-panel-item">
              <div class="home-hero-panel-kicker">Built to grow</div>
              <div>Advanced workflows and reports to help you make decisions on new product launches.</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="home-main">
      <div class="container">
        <div class="home-highlights">
          <div class="home-highlights-header">
            <h2>Built for real naming decisions</h2>
            <p class="hint">A modern brand needs a island to build is moat around, today its not just your URL its also your social handles and creator platform names. Nameo is designed for that reality.</p>
          </div>

          <div class="home-highlights-grid">
            <div class="home-highlight-card">
              <h3>Social core checks</h3>
              <p class="hint">Quick visibility across the common platforms that define your presence.</p>
              <div class="actions-inline">
                <a class="btn btn-primary" href="#/search">Run a search</a>
              </div>
            </div>
            <div class="home-highlight-card">
              <h3>Shortlist without losing ideas</h3>
              <p class="hint">History, favorites, and a workflow that keeps momentum while you explore options.</p>
              <div class="actions-inline">
                <a class="btn" href="#/use-case">See use cases</a>
              </div>
            </div>
            <div class="home-highlight-card">
              <h3>Advanced workflows</h3>
              <p class="hint">For startups and teams: compare candidates, see handle variations, and generate a report.</p>
              <div class="actions-inline">
                <a class="btn" href="#/advanced">Try advanced</a>
              </div>
            </div>
          </div>

          <div class="home-roadmap">
            <div class="home-roadmap-title">Coming soon</div>
            <div class="home-roadmap-grid">
              <div class="home-roadmap-item">
                <div class="home-roadmap-kicker">Guided flows</div>
                <div class="hint">Step-by-step naming help that turns a rough idea into a shortlist.</div>
              </div>
              <div class="home-roadmap-item">
                <div class="home-roadmap-kicker">Domains + app stores</div>
                <div class="hint">Deeper checks for launches where the stakes are higher.</div>
              </div>
              <div class="home-roadmap-item">
                <div class="home-roadmap-kicker">Shareable reports</div>
                <div class="hint">Clean summaries you can send to co-founders or clients.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
  return el
}
