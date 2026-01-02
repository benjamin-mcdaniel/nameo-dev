export function Features() {
  const el = document.createElement('section')
  el.className = 'page usecase'
  el.innerHTML = `
    <section class="hero home-hero">
      <div class="container hero-inner home-hero-inner">
        <div class="home-hero-copy">
          <div class="home-hero-eyebrow">Use cases • Built for startups</div>
          <h1>Get to a name you can own everywhere.</h1>
          <p class="sub">Nameo is designed for modern launch reality: you need a domain, consistent handles, and a decision you can explain to your team.</p>
          <div class="actions home-hero-actions">
            <a class="btn btn-primary" href="#/search">Start searching</a>
            <a class="btn" href="#/pricing">See pricing</a>
          </div>
          <div class="home-hero-footnote">Signals are best-effort. Always verify on the platform before you commit.</div>
        </div>

        <div class="home-hero-panel">
          <div class="home-hero-panel-title">How teams use Nameo</div>
          <div class="home-hero-panel-grid">
            <div class="home-hero-panel-item">
              <div class="home-hero-panel-kicker">Brainstorm</div>
              <div>Fast checks while ideas are fresh.</div>
            </div>
            <div class="home-hero-panel-item">
              <div class="home-hero-panel-kicker">Align</div>
              <div>Compare candidates with your team.</div>
            </div>
            <div class="home-hero-panel-item">
              <div class="home-hero-panel-kicker">Ship</div>
              <div>Pick one name and move forward.</div>
            </div>
            <div class="home-hero-panel-item">
              <div class="home-hero-panel-kicker">Repeat</div>
              <div>Use a consistent naming process.</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="home-main">
      <div class="container">
        <div class="home-highlights">
          <div class="home-highlights-header">
            <h2>Three common startup naming scenarios</h2>
            <p class="hint">Use Nameo differently depending on whether you're exploring ideas, aligning a real brand, or sharing with clients.</p>
          </div>

          <div class="home-highlights-grid">
            <div class="home-highlight-card">
              <h3>Brainstorming (fast + lightweight)</h3>
              <p class="hint">Type an idea once and instantly see if the obvious handles are already taken.</p>
              <ul class="bullet-list">
                <li><strong>Start with a seed.</strong> Run a quick check across common platforms.</li>
                <li><strong>Iterate quickly.</strong> Use suggestions and history to keep momentum.</li>
                <li><strong>Shortlist.</strong> Favorite the few that feel right.</li>
              </ul>
              <div class="actions-inline">
                <a class="btn btn-primary" href="#/search">Run a search</a>
              </div>
            </div>

            <div class="home-highlight-card">
              <h3>Startup launch (domain + handles)</h3>
              <p class="hint">Find a name you can own consistently across surfaces, not just a cool word.</p>
              <ul class="bullet-list">
                <li><strong>One identity.</strong> Domain + handle patterns that can match across X, Instagram, GitHub, and more.</li>
                <li><strong>Tradeoffs made obvious.</strong> Sometimes the domain is free but the handle needs a variation.</li>
                <li><strong>Multiple options.</strong> Most teams end with 3-5 viable candidates.</li>
              </ul>
              <div class="actions-inline">
                <a class="btn btn-primary" href="#/advanced">Try advanced workflow</a>
              </div>
            </div>

            <div class="home-highlight-card">
              <h3>Agencies & teams (coming soon)</h3>
              <p class="hint">A repeatable process that turns naming into a trackable, shareable workflow.</p>
              <ul class="bullet-list">
                <li><strong>Shareable reports.</strong> A clean summary you can send to clients or co-founders.</li>
                <li><strong>Repeatable process.</strong> Same questions and same surfaces every time.</li>
                <li><strong>Higher limits.</strong> More searches and more platforms as you scale.</li>
              </ul>
              <div class="actions-inline">
                <a class="btn" href="#/pricing">See plans</a>
              </div>
            </div>
          </div>

          <div class="home-roadmap">
            <div class="home-roadmap-title">Product principles</div>
            <div class="home-roadmap-grid">
              <div class="home-roadmap-item">
                <div class="home-roadmap-kicker">Honest signals</div>
                <div class="hint">Best-effort availability checks, not legal advice.</div>
              </div>
              <div class="home-roadmap-item">
                <div class="home-roadmap-kicker">Guidance over noise</div>
                <div class="hint">Reduce decision fatigue instead of adding stats.</div>
              </div>
              <div class="home-roadmap-item">
                <div class="home-roadmap-kicker">Privacy-first</div>
                <div class="hint">Your ideas are not sold or used to front-run domains/handles.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
  return el
}
