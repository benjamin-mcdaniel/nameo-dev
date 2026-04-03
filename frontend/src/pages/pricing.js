export function Pricing() {
  const el = document.createElement('section')
  el.className = 'page pricing container'
  el.innerHTML = `
    <div class="page-header">
      <div class="eyebrow">Pricing</div>
      <h1>Simple, transparent pricing</h1>
      <p>Start free. Upgrade when you need deeper checks and team features.</p>
    </div>

    <div class="pricing-grid">
      <div class="pricing-card">
        <h3>Free</h3>
        <div class="pricing-price">
          <span class="pricing-price-amount">$0</span>
          <span class="pricing-price-note">/ month</span>
        </div>
        <ul class="pricing-list">
          <li><span class="pricing-check"></span>Quick name search</li>
          <li><span class="pricing-check"></span>Social handle checks</li>
          <li><span class="pricing-check"></span>1 active project</li>
          <li><span class="pricing-check"></span>Search history</li>
        </ul>
        <div class="pricing-cta">
          <a href="#/campaigns" class="btn" style="width:100%;justify-content:center">Get started free</a>
        </div>
      </div>

      <div class="pricing-card recommended">
        <span class="pricing-badge">Popular</span>
        <h3>Pro</h3>
        <div class="pricing-price">
          <span class="pricing-price-amount">$19</span>
          <span class="pricing-price-note">/ month</span>
        </div>
        <ul class="pricing-list">
          <li><span class="pricing-check"></span>Everything in Free</li>
          <li><span class="pricing-check"></span>Domain availability checks</li>
          <li><span class="pricing-check"></span>App Store &amp; Play Store signals</li>
          <li><span class="pricing-check"></span>Unlimited projects</li>
          <li><span class="pricing-check"></span>Exportable reports</li>
          <li><span class="pricing-check"></span>Priority checks</li>
        </ul>
        <div class="pricing-cta">
          <a href="#/login" class="btn btn-primary" style="width:100%;justify-content:center">Start Pro</a>
        </div>
      </div>

      <div class="pricing-card">
        <h3>Team</h3>
        <div class="pricing-price">
          <span class="pricing-price-amount">$49</span>
          <span class="pricing-price-note">/ month</span>
        </div>
        <ul class="pricing-list">
          <li><span class="pricing-check"></span>Everything in Pro</li>
          <li><span class="pricing-check"></span>Trademark signals (US + EU)</li>
          <li><span class="pricing-check"></span>Up to 5 team members</li>
          <li><span class="pricing-check"></span>Shared projects</li>
          <li><span class="pricing-check"></span>Shareable report links</li>
        </ul>
        <div class="pricing-cta">
          <a href="#/login" class="btn" style="width:100%;justify-content:center">Start Team</a>
        </div>
      </div>
    </div>

    <p class="hint" style="margin-top:20px;text-align:center">
      All plans include a 14-day free trial. No credit card required to start.
    </p>
  `
  return el
}
