export function Pricing() {
  const el = document.createElement('section')
  el.className = 'page pricing container'
  el.innerHTML = `
    <div class="pricing-hero">
      <h1>Pricing</h1>
      <p class="sub">We are in beta. Pricing will evolve, but the structure below shows where the product is heading. Basic stays accessible; advanced features fund deeper checks and reporting.</p>
      <div class="pricing-hero-actions">
        <a class="btn btn-primary" href="#/search">Start with basic search</a>
        <a class="btn" href="#/advanced">Try advanced search</a>
      </div>
    </div>

    <div class="pricing-grid">
      <div class="pricing-card">
        <h3>Free (beta)</h3>
        <div class="pricing-price">
          <div class="pricing-price-amount">$0</div>
          <div class="pricing-price-note">during beta</div>
        </div>
        <p class="hint">For anyone trying out quick name checks.</p>
        <ul class="pricing-list">
          <li><span class="pricing-check" aria-hidden="true"></span><span>Up to 25 searches per day during beta</span></li>
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
        <h3>Basic</h3>
        <div class="pricing-price">
          <div class="pricing-price-amount">$9</div>
          <div class="pricing-price-note">/ month (planned)</div>
        </div>
        <p class="hint">For solo builders who want higher limits and better guidance.</p>
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
        <h3>Pro Search</h3>
        <div class="pricing-price">
          <div class="pricing-price-amount">$29</div>
          <div class="pricing-price-note">/ month (planned)</div>
        </div>
        <p class="hint">For startups, agencies, and launches that need a unified identity report.</p>
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
      Pricing and limits are placeholders while the product is in beta.
      If you need something specific for a launch, email <a href="mailto:support@nameo.dev">support@nameo.dev</a>.
    </div>
  `
  return el
}
