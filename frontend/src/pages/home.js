export function Home() {
  const el = document.createElement('section')
  el.className = 'page home'

  el.innerHTML = `
    <!-- Hero -->
    <section class="home-hero">
      <div class="home-hero-inner container">
        <h1>Find a name that's actually available.</h1>
        <p class="home-hero-sub">
          Check domains, trademarks, social handles, and marketplace listings in one run.
          No more toggling between ten tabs.
        </p>
        <div class="home-hero-actions">
          <a class="btn btn-primary btn-lg" href="#/sessions/new?type=brand_identity">Check a name</a>
          <a class="btn btn-lg" href="#/sessions/new?type=name_generator">or generate name ideas</a>
        </div>
        <p class="home-hero-note">Free to start &mdash; no credit card required</p>
      </div>
    </section>

    <!-- Session type picker -->
    <section class="home-section">
      <div class="container">
        <h2>Where do you want to start?</h2>
        <div class="home-picker">
          <a class="home-picker-row" href="#/sessions/new?type=brand_identity">
            <span class="hpr-icon">🔍</span>
            <span class="hpr-body">
              <span class="hpr-title">I have a name to check</span>
              <span class="hpr-desc">Domains, trademarks, marketplace listings, app stores, social handles</span>
            </span>
            <span class="hpr-arrow">›</span>
          </a>
          <a class="home-picker-row" href="#/sessions/new?type=name_generator">
            <span class="hpr-icon">✨</span>
            <span class="hpr-body">
              <span class="hpr-title">I need a name</span>
              <span class="hpr-desc">Answer a few questions and get AI-generated candidates with availability already checked</span>
            </span>
            <span class="hpr-arrow">›</span>
          </a>
        </div>
      </div>
    </section>

    <!-- What gets checked -->
    <section class="home-section home-section--muted">
      <div class="container">
        <h2>What gets checked</h2>
        <p class="home-section-sub">Every surface that matters before you commit to a name.</p>
        <div class="home-checks-list">
          <div class="home-check-row">
            <span class="home-check-icon">🌐</span>
            <div>
              <strong>Domain availability</strong>
              <p>.com, .io, .ai, .co, .app, .dev &mdash; see what's open and what's taken across all major TLDs.</p>
            </div>
          </div>
          <div class="home-check-row">
            <span class="home-check-icon">⚖️</span>
            <div>
              <strong>Trademark screening</strong>
              <p>US trademark search to surface conflicts early, before you've spent money on a logo or legal filing.</p>
            </div>
          </div>
          <div class="home-check-row">
            <span class="home-check-icon">📱</span>
            <div>
              <strong>Social handles</strong>
              <p>X, GitHub, Reddit, Instagram, LinkedIn, TikTok, YouTube &mdash; checked with common variations.</p>
            </div>
          </div>
          <div class="home-check-row">
            <span class="home-check-icon">🛒</span>
            <div>
              <strong>Marketplace listings</strong>
              <p>Amazon and Walmart &mdash; know if consumers searching your name will find someone else's product first.</p>
            </div>
          </div>
          <div class="home-check-row">
            <span class="home-check-icon">📦</span>
            <div>
              <strong>App store signals</strong>
              <p>iOS App Store name conflict check so you're not surprised during app review.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `

  return el
}
