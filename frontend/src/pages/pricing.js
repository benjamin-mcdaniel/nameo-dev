export function Pricing() {
  const el = document.createElement('section')
  el.className = 'page pricing container'
  el.innerHTML = `
    <div class="page-header">
      <div class="eyebrow">Pricing</div>
      <h1>Start free. Go deeper when it matters.</h1>
      <p>Basic name checks are free. Upgrade when you're ready to go all-in on a name or need team features.</p>
    </div>

    <div class="pricing-grid">
      <div class="pricing-card">
        <h3>Free</h3>
        <div class="pricing-price">
          <span class="pricing-price-amount">$0</span>
          <span class="pricing-price-note">/ month</span>
        </div>
        <ul class="pricing-list">
          <li><span class="pricing-check"></span>Name Generator — guided sessions</li>
          <li><span class="pricing-check"></span>Social handle checks</li>
          <li><span class="pricing-check"></span>1 active session</li>
          <li><span class="pricing-check"></span>Session history</li>
        </ul>
        <div class="pricing-cta">
          <a href="#/sessions/new" class="btn" style="width:100%;justify-content:center">Get started free</a>
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
          <li><span class="pricing-check"></span>Unlimited sessions</li>
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
          <li><span class="pricing-check"></span>Shared sessions</li>
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

    <div class="pricing-faq" style="margin-top:48px;max-width:640px;margin-left:auto;margin-right:auto">
      <h3 style="margin-bottom:16px;font-size:1.1rem">Common questions</h3>
      <details class="faq-item">
        <summary>What counts as a session?</summary>
        <p>A session is one naming research campaign — either a Brand Identity Report (checking specific names) or a Name Generator run (building candidates from scratch). The Free plan lets you keep 1 active session at a time. Pro and Team have no limit.</p>
      </details>
      <details class="faq-item">
        <summary>Why is domain availability a paid feature?</summary>
        <p>Domain lookups require real-time queries against registrar data, which have per-lookup costs at scale. Social handle checks are simpler and stay free. Domain checks are included in Pro and above.</p>
      </details>
      <details class="faq-item">
        <summary>Is trademark checking legal advice?</summary>
        <p>No. Trademark results are signals, not legal advice. We surface potential conflicts so you can ask the right questions — but always consult an attorney before filing or making major brand commitments.</p>
      </details>
      <details class="faq-item">
        <summary>Can I change plans later?</summary>
        <p>Yes. Upgrade or downgrade any time. Downgrading to Free keeps your most recent session active.</p>
      </details>
    </div>
  `
  return el
}
