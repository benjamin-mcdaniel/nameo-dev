export function Features() {
  const el = document.createElement('section')
  el.className = 'page usecase container'
  el.innerHTML = `
    <div class="page-header">
      <div class="eyebrow">Use Cases</div>
      <h1>Built for product launches</h1>
      <p>Nameo is designed for the specific challenges of naming a new startup, app, or product line.</p>
    </div>

    <div class="home-features-grid" style="margin-top:24px">
      <div class="feature-card">
        <div class="feature-icon">🚀</div>
        <h3>Startup launches</h3>
        <p>Before you pick a name, know whether you can own it everywhere that matters — domain, social, and app stores.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📱</div>
        <h3>New app releases</h3>
        <p>Check for name collisions in the App Store and Google Play early, so you're not forced into a rebrand after launch.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🏢</div>
        <h3>Product line extensions</h3>
        <p>Naming a new product within an existing brand? Make sure the identity is available and consistent across platforms.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🎨</div>
        <h3>Agency &amp; brand work</h3>
        <p>Running naming projects for clients? Use Nameo to validate candidates quickly before presenting options.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🤝</div>
        <h3>Co-founder alignment</h3>
        <p>Share a clean report with your co-founder or investors showing availability across all surfaces for each candidate.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">⏱️</div>
        <h3>Fast validation</h3>
        <p>Check 20+ signals in seconds rather than spending an hour on manual searches across separate sites.</p>
      </div>
    </div>

    <div style="margin-top:40px;text-align:center">
      <a href="#/campaigns" class="btn btn-primary btn-lg">Start a project</a>
    </div>
  `
  return el
}
