export function Home() {
  const el = document.createElement('section')
  el.className = 'page home'

  el.innerHTML = `
    <!-- Hero -->
    <section class="home-hero">
      <div class="home-hero-inner container">
        <div class="eyebrow">Brand Research for Startups</div>
        <h1>Find a name your<br>product can own.</h1>
        <p class="home-hero-sub">
          Check availability across domains, social handles, app stores, and
          trademark signals — all in one place. Built for founders launching
          something real.
        </p>
        <div class="home-hero-actions">
          <a class="btn btn-primary btn-lg" href="#/campaigns">Start a project</a>
          <a class="btn btn-lg" href="#/search">Quick search</a>
        </div>
        <p class="home-hero-note">Free to start &mdash; no credit card required</p>
      </div>
    </section>

    <!-- Platform coverage strip -->
    <div class="home-platforms">
      <div class="home-platforms-inner container">
        <span class="home-platforms-label">Checks include</span>
        <span class="platform-pill">Domains</span>
        <span class="platform-pill">X&nbsp;/&nbsp;Twitter</span>
        <span class="platform-pill">LinkedIn</span>
        <span class="platform-pill">Instagram</span>
        <span class="platform-pill">YouTube</span>
        <span class="platform-pill">GitHub</span>
        <span class="platform-pill">App Store</span>
        <span class="platform-pill">Trademark signals</span>
      </div>
    </div>

    <!-- Features -->
    <section class="home-features">
      <div class="container">
        <div class="home-features-header">
          <div class="eyebrow">Everything in one place</div>
          <h2>Stop checking tabs. Start making decisions.</h2>
          <p>Brand research used to mean opening a dozen browser tabs. Nameo pulls it all together so you can evaluate candidates and move fast.</p>
        </div>
        <div class="home-features-grid">
          <div class="feature-card">
            <div class="feature-icon">🌐</div>
            <h3>Domain availability</h3>
            <p>Check .com, .io, .ai, .co and more across all your name candidates simultaneously. See what's registerable at a glance.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h3>Social handle checks</h3>
            <p>X, LinkedIn, Instagram, YouTube, GitHub, TikTok and more — know if a handle is available before you fall in love with a name.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📦</div>
            <h3>App store signals</h3>
            <p>Check for name collisions in the iOS App Store and Google Play so you're not launching into a crowded namespace.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">⚖️</div>
            <h3>Trademark signals</h3>
            <p>Basic US and EU trademark screening to surface potential conflicts early — before you've spent money on branding.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Side-by-side reports</h3>
            <p>Compare multiple name candidates across all surfaces in a single view. Export a clean report to share with co-founders or investors.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📁</div>
            <h3>Launch projects</h3>
            <p>Organise your research into named projects. Save candidates, track checks over time, and keep your naming decisions in one place.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="home-how">
      <div class="container">
        <div class="home-how-header">
          <div class="eyebrow">How it works</div>
          <h2>From idea to decision in minutes</h2>
          <p>A focused workflow designed for founders who need to move quickly without skipping important checks.</p>
        </div>
        <div class="home-how-steps">
          <div class="how-step">
            <div class="how-step-num">1</div>
            <div class="how-step-body">
              <h3>Create a project</h3>
              <p>Name your product launch and add the candidate names you're considering. Keep them all in one place.</p>
            </div>
          </div>
          <div class="how-step">
            <div class="how-step-num">2</div>
            <div class="how-step-body">
              <h3>Run the checks</h3>
              <p>Nameo scans domains, social platforms, app stores, and trademark databases for each candidate simultaneously.</p>
            </div>
          </div>
          <div class="how-step">
            <div class="how-step-num">3</div>
            <div class="how-step-body">
              <h3>Review and decide</h3>
              <p>A clear report shows availability across all surfaces side-by-side, so you can pick the name with the strongest position.</p>
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
        <p>Join founders and product teams who use Nameo to make smarter naming decisions before they launch.</p>
        <div class="actions">
          <a class="btn btn-primary btn-lg" href="#/campaigns">Create your first project</a>
          <a class="btn btn-lg" href="#/pricing">See pricing</a>
        </div>
      </div>
    </section>
  `

  return el
}
