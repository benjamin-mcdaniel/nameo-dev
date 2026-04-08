export function Pricing() {
  const el = document.createElement('section')
  el.className = 'page pricing container'
  el.innerHTML = `
    <div class="page-header">
      <div class="eyebrow">Pricing</div>
      <h1>Buy a session. Run your sprint.</h1>
      <p>Nameo is built for how naming actually works — intense research for a few weeks, then you ship. No monthly drain for months you don't use it.</p>
    </div>

    <div class="pricing-grid">
      <div class="pricing-card">
        <h3>Explore</h3>
        <div class="pricing-price">
          <span class="pricing-price-amount">$0</span>
        </div>
        <div class="pricing-desc">See what Nameo can do before you commit.</div>
        <ul class="pricing-list">
          <li><span class="pricing-check"></span>AI name generation (basic model)</li>
          <li><span class="pricing-check"></span>.com and .net domain check only</li>
          <li><span class="pricing-check"></span>1 session per month</li>
          <li><span class="pricing-check"></span>15 tokens per session</li>
        </ul>
        <div class="pricing-limits">
          <span>No social checks</span>
          <span>No trademark or marketplace</span>
          <span>No export or reports</span>
        </div>
        <div class="pricing-cta">
          <a href="#/sessions/new" class="btn" style="width:100%;justify-content:center">Try it free</a>
        </div>
      </div>

      <div class="pricing-card recommended">
        <span class="pricing-badge">Most founders start here</span>
        <h3>Starter</h3>
        <div class="pricing-price">
          <span class="pricing-price-amount">$249</span>
          <span class="pricing-price-note">/ session</span>
        </div>
        <div class="pricing-desc">One full research session for a product launch.</div>
        <ul class="pricing-list">
          <li><span class="pricing-check"></span>100 tokens per session</li>
          <li><span class="pricing-check"></span>Full domain checks (6 TLDs)</li>
          <li><span class="pricing-check"></span>Social handles (7 platforms)</li>
          <li><span class="pricing-check"></span>Trademark signals (US + EU)</li>
          <li><span class="pricing-check"></span>Marketplace &amp; App Store checks</li>
          <li><span class="pricing-check"></span>Premium AI name generation</li>
          <li><span class="pricing-check"></span>Exportable PDF report</li>
        </ul>
        <div class="pricing-cta">
          <a href="#/login" class="btn btn-primary" style="width:100%;justify-content:center">Buy a session</a>
        </div>
      </div>

      <div class="pricing-card">
        <h3>Pro</h3>
        <div class="pricing-price">
          <span class="pricing-price-amount">$499</span>
          <span class="pricing-price-note">/ 3 sessions</span>
        </div>
        <div class="pricing-desc">For founders naming multiple products or iterating hard.</div>
        <ul class="pricing-list">
          <li><span class="pricing-check"></span>3 sessions (300 tokens each)</li>
          <li><span class="pricing-check"></span>Everything in Starter</li>
          <li><span class="pricing-check"></span>AI competitive threat summary</li>
          <li><span class="pricing-check"></span>Priority check processing</li>
          <li><span class="pricing-check"></span>Session history &amp; comparison</li>
        </ul>
        <div class="pricing-cta">
          <a href="#/login" class="btn" style="width:100%;justify-content:center">Buy 3 sessions</a>
        </div>
      </div>

      <div class="pricing-card">
        <h3>Premium</h3>
        <div class="pricing-price">
          <span class="pricing-price-amount">$1,999</span>
          <span class="pricing-price-note">/ 10 sessions</span>
        </div>
        <div class="pricing-desc">Full-scale naming for agencies, studios, or serial launchers.</div>
        <ul class="pricing-list">
          <li><span class="pricing-check"></span>10 sessions (1,500 tokens total)</li>
          <li><span class="pricing-check"></span>Everything in Pro</li>
          <li><span class="pricing-check"></span>Team sharing (up to 5 seats)</li>
          <li><span class="pricing-check"></span>Shareable report links</li>
          <li><span class="pricing-check"></span>Priority support</li>
        </ul>
        <div class="pricing-cta">
          <a href="#/login" class="btn" style="width:100%;justify-content:center">Buy 10 sessions</a>
        </div>
      </div>
    </div>

    <div class="pricing-tokens-explainer">
      <h3>How tokens work</h3>
      <p>Every session comes with a token budget. Tokens are spent when you use AI features — the checks themselves (domains, socials, trademarks) don't cost tokens. Heavy AI generation in a single session uses more tokens; light research uses fewer.</p>
      <div class="token-cost-grid">
        <div class="token-cost-item">
          <span class="token-cost-action">AI name generation (basic)</span>
          <span class="token-cost-amount">10 tokens</span>
        </div>
        <div class="token-cost-item">
          <span class="token-cost-action">AI name generation (premium)</span>
          <span class="token-cost-amount">25 tokens</span>
        </div>
        <div class="token-cost-item">
          <span class="token-cost-action">Competitive threat summary</span>
          <span class="token-cost-amount">8 tokens</span>
        </div>
        <div class="token-cost-item">
          <span class="token-cost-action">Domain &amp; social checks</span>
          <span class="token-cost-amount">Free with session</span>
        </div>
        <div class="token-cost-item">
          <span class="token-cost-action">Trademark / marketplace / app store</span>
          <span class="token-cost-amount">2–3 tokens</span>
        </div>
      </div>
    </div>

    <div class="pricing-faq" style="margin-top:48px;max-width:640px;margin-left:auto;margin-right:auto">
      <h3 style="margin-bottom:16px;font-size:1.1rem">Common questions</h3>
      <details class="faq-item">
        <summary>Why sessions instead of a monthly subscription?</summary>
        <p>Most founders need Nameo intensely for a few weeks, then not again for months. A monthly subscription charges you for time you're not using it. Sessions match how naming actually works — you buy what you need, use it, and come back when the next product needs a name.</p>
      </details>
      <details class="faq-item">
        <summary>What happens when I run out of tokens?</summary>
        <p>Your session stays active and you keep access to all your results. You just can't run new AI generations or paid checks until you buy another session. Domain and social checks that are already in your results stay visible.</p>
      </details>
      <details class="faq-item">
        <summary>Do unused tokens roll over?</summary>
        <p>Sessions are valid for 30 days from purchase. Unused tokens within a session don't carry to other sessions — this keeps pricing simple and lets us invest in better AI models without worrying about token debt.</p>
      </details>
      <details class="faq-item">
        <summary>Can I buy just one more session later?</summary>
        <p>Yes. Come back in 6 months, buy a Starter session, and pick up where you left off. Your previous session history is always there.</p>
      </details>
      <details class="faq-item">
        <summary>Is the trademark check legal advice?</summary>
        <p>No. Trademark results are informational signals. We surface potential conflicts so you can ask the right questions — but always consult an attorney before filing or making major brand decisions.</p>
      </details>
    </div>
  `
  return el
}
