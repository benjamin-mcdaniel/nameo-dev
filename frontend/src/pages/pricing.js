export function Pricing() {
  const el = document.createElement('section')
  el.className = 'page pricing container'
  el.innerHTML = `
    <div class="pricing-hero">
      <h1>Beta tiers</h1>
      <p class="sub">Limited beta platform. There are no paid features yet. The tiers below are just a way to describe what is available today vs what is planned as the platform stabilizes.</p>
      <div class="pricing-hero-actions">
        <a class="btn btn-primary" href="#/search">Start with basic search</a>
        <a class="btn" href="#/advanced">Try advanced search</a>
      </div>
    </div>

    <div class="pricing-grid">
      <div class="pricing-card">
        <h3>Core (beta)</h3>
        <p class="hint">For anyone trying out quick name checks.</p>
        <ul class="pricing-list">
          <li><span class="pricing-check" aria-hidden="true"></span><span>Best-effort checks across core platforms</span></li>
          <li><span class="pricing-check" aria-hidden="true"></span><span>Clear "self-check" guidance when platforms block automation</span></li>
          <li><span class="pricing-check" aria-hidden="true"></span><span>Core platform checks (social availability signals)</span></li>
          <li><span class="pricing-check" aria-hidden="true"></span><span>Local history + favorites in your browser</span></li>
        </ul>
        <div class="pricing-cta">
          <a class="btn btn-primary" href="#/search">Use free search</a>
          <div class="hint">Best for quick exploration.</div>
        </div>
      </div>

      <div class="pricing-card recommended">
        <div class="pricing-badge">Recommended</div>
        <h3>Builder (beta)</h3>
        <p class="hint">In beta. This tier represents the experience we’re targeting as reliability improves.</p>
        <ul class="pricing-list">
          <li><span class="pricing-check" aria-hidden="true"></span><span>Higher daily search limits</span></li>
          <li><span class="pricing-check" aria-hidden="true"></span><span>Broader platform coverage as we add more destinations</span></li>
          <li><span class="pricing-check" aria-hidden="true"></span><span>Smarter suggestions when a name is crowded (planned)</span></li>
          <li><span class="pricing-check" aria-hidden="true"></span><span>Synced search history when logged in</span></li>
        </ul>
        <div class="pricing-cta">
          <a class="btn btn-primary" href="#/search">Start building a shortlist</a>
          <div class="hint">Most users will start here after beta.</div>
        </div>
      </div>

      <div class="pricing-card">
        <h3>Pro Search (beta)</h3>
        <p class="hint">In beta. This tier represents deeper checks + unified reports once platform coverage is expanded.</p>
        <ul class="pricing-list">
          <li><span class="pricing-check" aria-hidden="true"></span><span>Pro Search checks (domains, marketplaces, and deeper destinations as they come online)</span></li>
          <li><span class="pricing-check" aria-hidden="true"></span><span>Unified reports for teams and launches</span></li>
          <li><span class="pricing-check" aria-hidden="true"></span><span>Handle-variation recommendations (official/real/app/platform)</span></li>
          <li><span class="pricing-check" aria-hidden="true"></span><span>Exportable/shareable reports for teams and clients (planned)</span></li>
        </ul>
        <div class="pricing-cta">
          <a class="btn btn-primary" href="#/advanced">Run advanced search</a>
          <div class="hint">Best for higher-stakes naming decisions.</div>
        </div>
      </div>
    </div>

    <div class="pricing-fineprint">
      All tiers are beta tiers. Pricing is not enabled.
      If you need something specific for a launch, email <a href="mailto:support@nameo.dev">support@nameo.dev</a>.
    </div>
  `
  return el
}
