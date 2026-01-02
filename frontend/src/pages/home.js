const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

export function Home() {
  const el = document.createElement('section')
  el.className = 'page home'
  el.innerHTML = `
    <section class="hero home-hero">
      <div class="container hero-inner home-hero-inner">
        <div class="home-hero-copy">
          <div class="home-hero-eyebrow">Nameo.dev • Everywhere identity</div>
          <h1>Find a name you can actually use.</h1>
          <p class="sub">Check availability across the internet in one place - from social handles to creator platforms. Built for founders, makers, and creators.</p>
          <div class="actions home-hero-actions">
            <a class="btn btn-primary" href="#/search">Start searching</a>
            <a class="btn" href="#/pricing">Pricing</a>
          </div>
          <div class="home-hero-footnote">Best-effort signals. Always verify on the platform before you commit.</div>
        </div>

        <div class="home-hero-panel">
          <div class="home-hero-panel-title">What you get</div>
          <div class="home-hero-panel-grid">
            <div class="home-hero-panel-item">
              <div class="home-hero-panel-kicker">Fast</div>
              <div>One input, many checks.</div>
            </div>
            <div class="home-hero-panel-item">
              <div class="home-hero-panel-kicker">Clear</div>
              <div>Simple available/taken signals.</div>
            </div>
            <div class="home-hero-panel-item">
              <div class="home-hero-panel-kicker">Guided</div>
              <div>Suggestions to keep you moving.</div>
            </div>
            <div class="home-hero-panel-item">
              <div class="home-hero-panel-kicker">Built to grow</div>
              <div>Advanced workflows and reports.</div>
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
            <p class="hint">A modern brand needs a domain and consistent handles. Nameo is designed around that reality.</p>
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
