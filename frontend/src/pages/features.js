export function Features() {
  const el = document.createElement('section')
  el.className = 'page usecase'
  el.innerHTML = `
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-copy">
          <h1>Use cases, features, and what's next</h1>
          <p class="sub">Nameo helps founders, makers, and teams pick a name they can actually use. Below is what you can do today, and what we are building next.</p>
          <div class="actions">
            <a class="btn btn-primary" href="#/search">Run a search</a>
            <a class="btn" href="#/advanced">Advanced workflow</a>
          </div>
        </div>
      </div>
    </section>

    <section class="home-main">
      <div class="container">
        <div class="home-highlights">
          <div class="home-highlights-header">
            <h2>What works today</h2>
            <p class="hint">The current MVP focuses on fast, clear handle checks and lightweight workflows.</p>
          </div>

          <div class="home-highlights-grid">
            <div class="home-highlight-card">
              <h3>Common platform checks</h3>
              <p class="hint">Run availability checks across the platforms that define your online identity.</p>
              <ul class="bullet-list">
                <li><strong>One input, many platforms.</strong> X, Instagram, Facebook, YouTube, TikTok, GitHub, and more.</li>
                <li><strong>Simple signal.</strong> Available vs taken status with direct links.</li>
                <li><strong>Best-effort.</strong> Always confirm on the platform before committing.</li>
              </ul>
              <div class="actions-inline">
                <a class="btn btn-primary" href="#/search">Start searching</a>
              </div>
            </div>

            <div class="home-highlight-card">
              <h3>Suggestions + history + favorites</h3>
              <p class="hint">Keep momentum while you iterate through naming ideas.</p>
              <ul class="bullet-list">
                <li><strong>Suggestions.</strong> Generate variations to explore quickly.</li>
                <li><strong>Recent searches.</strong> Re-run candidates without re-typing.</li>
                <li><strong>Favorites.</strong> Shortlist names while you brainstorm.</li>
              </ul>
            </div>

            <div class="home-highlight-card">
              <h3>Campaign workflow (logged in)</h3>
              <p class="hint">Organize candidates and checks inside a naming campaign.</p>
              <ul class="bullet-list">
                <li><strong>Campaigns.</strong> Group options for a project or product.</li>
                <li><strong>Option checks.</strong> Re-check candidates as you narrow down.</li>
                <li><strong>Delete anytime.</strong> Remove saved data when you're done.</li>
              </ul>
              <div class="actions-inline">
                <a class="btn" href="#/campaigns">Open campaigns</a>
              </div>
            </div>
          </div>

          <div class="home-roadmap">
            <div class="home-roadmap-title">Next releases</div>
            <div class="home-roadmap-grid">
              <div class="home-roadmap-item">
                <div class="home-roadmap-kicker">Domains</div>
                <div class="hint">Core + modern TLD checks and clearer guidance on tradeoffs.</div>
              </div>
              <div class="home-roadmap-item">
                <div class="home-roadmap-kicker">App stores + trademarks</div>
                <div class="hint">Deeper checks for higher-stakes launches.</div>
              </div>
              <div class="home-roadmap-item">
                <div class="home-roadmap-kicker">Reports + sharing</div>
                <div class="hint">Shareable summaries for co-founders, teams, and clients.</div>
              </div>
            </div>
          </div>

          <div class="home-roadmap">
            <div class="home-roadmap-title">Product principles</div>
            <div class="home-roadmap-grid">
              <div class="home-roadmap-item">
                <div class="home-roadmap-kicker">Honest signals</div>
                <div class="hint">Availability checks, not legal advice.</div>
              </div>
              <div class="home-roadmap-item">
                <div class="home-roadmap-kicker">Guidance over noise</div>
                <div class="hint">Help you decide faster, not drown you in data.</div>
              </div>
              <div class="home-roadmap-item">
                <div class="home-roadmap-kicker">Privacy-first</div>
                <div class="hint">Your naming ideas are not sold or used to front-run domains/handles.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
  return el
}
