export function Home() {
  const el = document.createElement('section')
  el.className = 'page home'

  el.innerHTML = `
    <!-- Hero -->
    <section class="home-hero">
      <div class="home-hero-inner container">
        <div class="eyebrow">Brand Research for Startups</div>
        <h1>Know if your name<br>is really available.</h1>
        <p class="home-hero-sub">
          Domains, trademarks, marketplace listings, app stores, and social handles —
          everything a founder needs to vet a product name before going all in.
        </p>
        <div class="home-hero-actions">
          <a class="btn btn-primary btn-lg" href="#/sessions/new">Create a Report</a>
          <a class="btn btn-lg" href="#how-it-works" data-scroll-to="how-it-works">How it works ↓</a>
        </div>
        <p class="home-hero-note">Free to start &mdash; no credit card required</p>
      </div>
    </section>

    <!-- Platform coverage strip -->
    <div class="home-platforms">
      <div class="home-platforms-inner container">
        <span class="home-platforms-label">Checks include</span>
        <span class="platform-pill platform-pill--primary">Domains</span>
        <span class="platform-pill platform-pill--primary">Trademarks</span>
        <span class="platform-pill platform-pill--primary">Products for Sale</span>
        <span class="platform-pill">App Store</span>
        <span class="platform-pill">Social Handles</span>
      </div>
    </div>

    <!-- Session types -->
    <section class="home-session-types">
      <div class="container">
        <div class="home-features-header">
          <div class="eyebrow">Two ways to work</div>
          <h2>Research a name. Or generate one.</h2>
          <p>Nameo gives startups two focused workflows depending on where you are in the naming process.</p>
        </div>
        <div class="session-type-showcase">
          <div class="stshow-card">
            <div class="stshow-icon">🔍</div>
            <h3>Brand Identity Report</h3>
            <p>Have a name — or a shortlist? Run it through the full suite of checks: domains, US &amp; EU trademarks, marketplace listings, app stores, and social handles. Know every risk before you commit.</p>
            <div class="stshow-reports">
              <span class="report-type-chip">🌐 Domains</span>
              <span class="report-type-chip">⚖️ Trademarks</span>
              <span class="report-type-chip">🛒 Products for Sale</span>
              <span class="report-type-chip">📦 App Store</span>
              <span class="report-type-chip">📱 Social Handles</span>
            </div>
            <a class="btn btn-primary" href="#/sessions/new">Start a Brand Identity Report →</a>
          </div>
          <div class="stshow-card">
            <div class="stshow-icon">✨</div>
            <h3>Name Generator</h3>
            <p>Starting from scratch? Answer a short questionnaire about your product, brand personality, and preferences. Nameo builds a weighted profile and generates original name candidates tailored to you.</p>
            <div class="stshow-reports">
              <span class="report-type-chip">🎯 Preference questionnaire</span>
              <span class="report-type-chip">⚖️ Weighted matrix</span>
              <span class="report-type-chip">✨ Name candidates</span>
            </div>
            <a class="btn btn-primary" href="#/sessions/new">Generate name ideas →</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="home-features">
      <div class="container">
        <div class="home-features-header">
          <div class="eyebrow">What gets checked</div>
          <h2>The full picture, not half the story.</h2>
          <p>Most name checkers only look at one thing. Nameo bundles every surface that matters for a product launch into a single, clear report.</p>
        </div>
        <div class="home-features-grid">
          <div class="feature-card">
            <div class="feature-icon">🌐</div>
            <h3>Domain availability</h3>
            <p>Check .com, .io, .ai, .co, and more across all your candidates simultaneously. See exactly what's registerable before you fall in love with a name.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">⚖️</div>
            <h3>Trademark screening</h3>
            <p>Basic US and EU trademark checks to surface potential conflicts early — before you've invested in branding, decks, or legal fees.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🛒</div>
            <h3>Products for sale</h3>
            <p>Search Amazon, eBay, and major marketplaces for name collisions with existing products. Know who you're up against in the market.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📦</div>
            <h3>App store signals</h3>
            <p>Check for name collisions in the iOS App Store and Google Play so you're not launching into an already-crowded namespace.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h3>Social handle checks</h3>
            <p>X, Instagram, LinkedIn, YouTube, GitHub — know if the handle is available across the platforms that matter most to your audience.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Session-based reports</h3>
            <p>Organise all your research into named sessions. Run multiple report types, compare candidates, and share findings with your co-founders.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="home-how" id="how-it-works">
      <div class="container">
        <div class="home-how-header">
          <div class="eyebrow">How it works</div>
          <h2>From idea to decision in minutes</h2>
          <p>A focused workflow built for founders who need to move fast without skipping the checks that protect you later.</p>
        </div>
        <div class="home-how-steps">
          <div class="how-step">
            <div class="how-step-num">1</div>
            <div class="how-step-body">
              <h3>Start a session</h3>
              <p>Choose a Brand Identity Report to vet existing names, or a Name Generator session to build fresh candidates from your brand preferences.</p>
            </div>
          </div>
          <div class="how-step">
            <div class="how-step-num">2</div>
            <div class="how-step-body">
              <h3>Configure your reports</h3>
              <p>Pick which checks to run — domains, trademarks, marketplace listings, app stores, social handles — or answer the preference questionnaire.</p>
            </div>
          </div>
          <div class="how-step">
            <div class="how-step-num">3</div>
            <div class="how-step-body">
              <h3>Review and decide</h3>
              <p>Every report surfaces availability, conflicts, and signals in a single view so you can pick the name with the strongest position.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="home-cta">
      <div class="container">
        <div class="eyebrow">Ready to start?</div>
        <h2>Name your next product right.</h2>
        <p>Join founders who use Nameo to make smarter naming decisions before they launch.</p>
        <div class="actions">
          <a class="btn btn-primary btn-lg" href="#/sessions/new">Start your first session</a>
          <a class="btn btn-lg" href="#/pricing">See pricing</a>
        </div>
      </div>
    </section>
  `

  // Smooth-scroll "How it works" button — uses a data attr to avoid router
  // treating the href as a hash route
  el.querySelector('[data-scroll-to]')?.addEventListener('click', (e) => {
    e.preventDefault()
    const target = document.getElementById('how-it-works')
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })

  return el
}
