export function Pricing() {
  const el = document.createElement('section')
  el.className = 'page pricing container'
  el.innerHTML = `
    <div class="page-header">
      <div class="eyebrow">Pricing</div>
      <h1>Start small. Scale when it matters.</h1>
      <p>Buy a token pack. Use what you need. Come back when you need more. No subscription, no monthly drain.</p>
    </div>

    <div class="pricing-grid">

      <!-- Explore -->
      <div class="pricing-card">
        <h3>Explore</h3>
        <div class="pricing-price">
          <span class="pricing-price-amount">$0</span>
        </div>
        <div class="pricing-desc">Kick the tires. See if it fits before spending anything.</div>
        <ul class="pricing-list">
          <li><span class="pricing-check"></span>1 session</li>
          <li><span class="pricing-check"></span>15 tokens</li>
          <li><span class="pricing-check"></span>Basic AI name generation</li>
          <li><span class="pricing-check"></span>.com and .net domain check</li>
        </ul>
        <div class="pricing-limits">
          <span>No social checks</span>
          <span>No trademark or marketplace</span>
          <span>No export</span>
        </div>
        <div class="pricing-cta">
          <a href="#/sessions/new" class="btn" style="width:100%;justify-content:center">Try free</a>
        </div>
      </div>

      <!-- Starter -->
      <div class="pricing-card recommended">
        <span class="pricing-badge">Most popular</span>
        <h3>Starter</h3>
        <div class="pricing-price">
          <span class="pricing-price-amount">$49</span>
          <span class="pricing-price-note">/ 10 sessions</span>
        </div>
        <div class="pricing-desc">Enough to name a product and know what you're committing to.</div>
        <ul class="pricing-list">
          <li><span class="pricing-check"></span>10 sessions · 50 tokens each</li>
          <li><span class="pricing-check"></span>Standard AI name generation</li>
          <li><span class="pricing-check"></span>Full domain checks (6 TLDs)</li>
          <li><span class="pricing-check"></span>Social handles (major platforms)</li>
          <li><span class="pricing-check"></span>Adjustable search depth</li>
          <li><span class="pricing-check"></span>PDF report export</li>
        </ul>
        <div class="pricing-limits">
          <span>No trademark or marketplace checks</span>
          <span>No shareable links</span>
        </div>
        <div class="pricing-cta">
          <a href="#/login" class="btn btn-primary" style="width:100%;justify-content:center">Get Starter</a>
        </div>
      </div>

      <!-- Pro -->
      <div class="pricing-card">
        <h3>Pro</h3>
        <div class="pricing-price">
          <span class="pricing-price-amount">$149</span>
          <span class="pricing-price-note">/ 100 sessions</span>
        </div>
        <div class="pricing-desc">Everything unlocked. Turn on what you need, spend tokens accordingly.</div>
        <ul class="pricing-list">
          <li><span class="pricing-check"></span>100 sessions · 50 tokens each</li>
          <li><span class="pricing-check"></span>Everything in Starter</li>
          <li><span class="pricing-check"></span>Trademark signals (US + EU)</li>
          <li><span class="pricing-check"></span>Marketplace &amp; App Store checks</li>
          <li><span class="pricing-check"></span>Premium AI name generation</li>
          <li><span class="pricing-check"></span>Competitive threat summary</li>
          <li><span class="pricing-check"></span>Permanent shareable report links</li>
        </ul>
        <div class="pricing-cta">
          <a href="#/login" class="btn" style="width:100%;justify-content:center">Get Pro</a>
        </div>
      </div>

    </div>

    <div class="pricing-depth-callout">
      <div class="pricing-depth-inner">
        <div class="pricing-depth-icon">⚙️</div>
        <div>
          <strong>You control how deep each search goes.</strong>
          <p>Light search (just domains + key socials) uses fewer tokens. Deep search (all TLDs, all platforms, trademark, marketplace) uses more. Run light checks to explore, then go deep on the names worth committing to.</p>
        </div>
      </div>
    </div>

    <div class="pricing-tokens-explainer">
      <h3>How tokens work</h3>
      <p>Tokens are spent on AI features and deeper checks. Fast lookups (domain ping, social check) are included with every session at no token cost. The more complex the research, the more tokens it uses.</p>
      <div class="token-cost-grid">
        <div class="token-cost-item">
          <span class="token-cost-action">Domain &amp; social checks</span>
          <span class="token-cost-amount">Free with session</span>
        </div>
        <div class="token-cost-item">
          <span class="token-cost-action">AI name generation (standard)</span>
          <span class="token-cost-amount">10 tokens / batch</span>
        </div>
        <div class="token-cost-item">
          <span class="token-cost-action">AI name generation (premium)</span>
          <span class="token-cost-amount">25 tokens / batch</span>
        </div>
        <div class="token-cost-item">
          <span class="token-cost-action">Trademark check (US + EU)</span>
          <span class="token-cost-amount">3 tokens</span>
        </div>
        <div class="token-cost-item">
          <span class="token-cost-action">Marketplace / App Store check</span>
          <span class="token-cost-amount">2 tokens</span>
        </div>
        <div class="token-cost-item">
          <span class="token-cost-action">Competitive threat summary</span>
          <span class="token-cost-amount">8 tokens</span>
        </div>
      </div>
    </div>

    <div class="pricing-sharelinks-callout">
      <div>
        <div class="eyebrow" style="margin-bottom:6px">Pro feature</div>
        <h3>Permanent shareable links</h3>
        <p>Generate a permanent link to any report and share it with your team, investors, or co-founder — no account needed to view. Links stay live as long as your session is active. Perfect for async review without setting up logins.</p>
      </div>
    </div>

    <div class="pricing-faq" style="margin-top:48px;max-width:640px;margin-left:auto;margin-right:auto">
      <h3 style="margin-bottom:16px;font-size:1.1rem">Common questions</h3>
      <details class="faq-item">
        <summary>Why sessions instead of a monthly subscription?</summary>
        <p>Naming is bursty. You need it hard for a few weeks, then not at all for months. Sessions mean you only pay for active work — not for the months you're heads-down building.</p>
      </details>
      <details class="faq-item">
        <summary>What's the difference between a light and a deep search?</summary>
        <p>When you create a session you choose which checks to run. Light = domains and primary social handles. Deep = all TLDs, all platforms, trademark, marketplace, and app stores. Light uses no tokens. Deep uses 2–3 tokens per check category. You can mix and match per name.</p>
      </details>
      <details class="faq-item">
        <summary>What happens when I run out of tokens?</summary>
        <p>Your session stays open and all your existing results are still there. You just can't run new AI generations or deep checks. Buy another session pack any time — no expiry on your history.</p>
      </details>
      <details class="faq-item">
        <summary>Do unused sessions expire?</summary>
        <p>Sessions are valid for 90 days from purchase. Buy a pack, use it when you need it — you won't lose sessions to a billing cycle.</p>
      </details>
      <details class="faq-item">
        <summary>Can my team view my reports?</summary>
        <p>On Pro, yes — generate a permanent shareable link to any report. Anyone with the link can view it without an account. For full collaboration or multi-admin access, that's on the roadmap.</p>
      </details>
      <details class="faq-item">
        <summary>Is the trademark check legal advice?</summary>
        <p>No. Trademark results are informational signals. We surface potential conflicts so you can ask the right questions — always consult an attorney before filing or making major brand decisions.</p>
      </details>
    </div>
  `
  return el
}
