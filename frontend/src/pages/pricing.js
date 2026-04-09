export function Pricing() {
  const el = document.createElement('section')
  el.className = 'page pricing container'
  el.innerHTML = `
    <div class="page-header">
      <div class="eyebrow">Pricing</div>
      <h1>Pay for what you use.</h1>
      <p>Every action in Nameo costs credits. Buy a pack, use them across any feature, and top up when you need more. No subscriptions. No monthly bills.</p>
    </div>

    <div class="pricing-grid">

      <!-- Free -->
      <div class="pricing-card">
        <h3>Free</h3>
        <div class="pricing-price">
          <span class="pricing-price-amount">$0</span>
        </div>
        <div class="pricing-desc">Try every feature. See what Nameo can do before you spend a thing.</div>
        <ul class="pricing-list">
          <li><span class="pricing-check"></span>50 credits</li>
          <li><span class="pricing-check"></span>Unlimited sessions</li>
          <li><span class="pricing-check"></span>AI name generation</li>
          <li><span class="pricing-check"></span>Domain checks (6 TLDs)</li>
          <li><span class="pricing-check"></span>Social handle checks</li>
        </ul>
        <div class="pricing-limits">
          <span>No trademark or marketplace checks</span>
          <span>No export</span>
        </div>
        <div class="pricing-cta">
          <a href="#/sessions/new" class="btn" style="width:100%;justify-content:center">Start free</a>
        </div>
      </div>

      <!-- Starter -->
      <div class="pricing-card recommended">
        <span class="pricing-badge">Most popular</span>
        <h3>Starter</h3>
        <div class="pricing-price">
          <span class="pricing-price-amount">$29</span>
          <span class="pricing-price-note">/ 500 credits</span>
        </div>
        <div class="pricing-desc">Enough to name a product and know exactly what you're committing to.</div>
        <ul class="pricing-list">
          <li><span class="pricing-check"></span>500 credits</li>
          <li><span class="pricing-check"></span>Everything in Free</li>
          <li><span class="pricing-check"></span>Trademark screening (US + EU)</li>
          <li><span class="pricing-check"></span>Marketplace &amp; App Store checks</li>
          <li><span class="pricing-check"></span>PDF report export</li>
        </ul>
        <div class="pricing-limits">
          <span>No shareable report links</span>
        </div>
        <div class="pricing-cta">
          <a href="#/login" class="btn btn-primary" style="width:100%;justify-content:center">Get Starter</a>
        </div>
      </div>

      <!-- Pro -->
      <div class="pricing-card">
        <h3>Pro</h3>
        <div class="pricing-price">
          <span class="pricing-price-amount">$99</span>
          <span class="pricing-price-note">/ 2,000 credits</span>
        </div>
        <div class="pricing-desc">Full power. Best value per credit. Built for founders who are serious about getting the name right.</div>
        <ul class="pricing-list">
          <li><span class="pricing-check"></span>2,000 credits</li>
          <li><span class="pricing-check"></span>Everything in Starter</li>
          <li><span class="pricing-check"></span>Premium AI generation (deeper models)</li>
          <li><span class="pricing-check"></span>Competitive threat summaries</li>
          <li><span class="pricing-check"></span>Permanent shareable report links</li>
          <li><span class="pricing-check"></span>Priority processing</li>
        </ul>
        <div class="pricing-cta">
          <a href="#/login" class="btn" style="width:100%;justify-content:center">Get Pro</a>
        </div>
      </div>

    </div>

    <!-- What costs what -->
    <div class="pricing-tokens-explainer">
      <h3>What costs what</h3>
      <p>Credits are consumed per action. Run a quick domain check for 1 credit, or go deep with AI generation and trademark screening. You control the spend.</p>
      <div class="token-cost-grid">
        <div class="token-cost-item">
          <span class="token-cost-action">Domain availability check</span>
          <span class="token-cost-amount">1 credit / name</span>
        </div>
        <div class="token-cost-item">
          <span class="token-cost-action">Social handle check</span>
          <span class="token-cost-amount">1 credit / name</span>
        </div>
        <div class="token-cost-item">
          <span class="token-cost-action">AI name generation</span>
          <span class="token-cost-amount">10 credits / batch</span>
        </div>
        <div class="token-cost-item">
          <span class="token-cost-action">Premium AI generation</span>
          <span class="token-cost-amount">25 credits / batch</span>
        </div>
        <div class="token-cost-item">
          <span class="token-cost-action">Trademark screening (US + EU)</span>
          <span class="token-cost-amount">5 credits / name</span>
        </div>
        <div class="token-cost-item">
          <span class="token-cost-action">Marketplace &amp; App Store check</span>
          <span class="token-cost-amount">3 credits / name</span>
        </div>
        <div class="token-cost-item">
          <span class="token-cost-action">Competitive threat summary</span>
          <span class="token-cost-amount">10 credits</span>
        </div>
      </div>
    </div>

    <!-- How far credits go -->
    <div class="pricing-depth-callout">
      <div class="pricing-depth-inner">
        <div class="pricing-depth-icon">💡</div>
        <div>
          <strong>How far do credits go?</strong>
          <p>A typical naming session — generate 3 batches of name ideas, check domains and socials for your top 5, and run trademark screening on 2 finalists — costs around 60 credits. The free tier covers that and then some.</p>
        </div>
      </div>
    </div>

    <!-- Shareable links callout -->
    <div class="pricing-sharelinks-callout">
      <div>
        <div class="eyebrow" style="margin-bottom:6px">Pro feature</div>
        <h3>Shareable report links</h3>
        <p>Generate a permanent link to any report and share it with your team, investors, or co-founder — no account needed to view. Perfect for async review without setting up logins.</p>
      </div>
    </div>

    <!-- FAQ -->
    <div class="pricing-faq" style="margin-top:48px;max-width:640px;margin-left:auto;margin-right:auto">
      <h3 style="margin-bottom:16px;font-size:1.1rem">Common questions</h3>
      <details class="faq-item">
        <summary>Why credits instead of a monthly subscription?</summary>
        <p>Naming is bursty. You go hard for a few weeks, then not at all for months. Credits mean you only pay for the work you actually do — not for idle months while you're heads-down building.</p>
      </details>
      <details class="faq-item">
        <summary>Do credits expire?</summary>
        <p>Credits are valid for 12 months from purchase. Your sessions and results never expire — you just need credits to run new checks or generate new names.</p>
      </details>
      <details class="faq-item">
        <summary>What happens when I run out of credits?</summary>
        <p>All your sessions and results stay exactly where you left them. You just can't run new checks or AI generations until you top up. Buy another pack any time.</p>
      </details>
      <details class="faq-item">
        <summary>Can I buy more credits without upgrading tiers?</summary>
        <p>Yes. Each tier is a credit pack — buy the same tier again to top up, or upgrade to unlock more features. Your existing credits carry over.</p>
      </details>
      <details class="faq-item">
        <summary>Can my team view my reports?</summary>
        <p>On Pro, yes — generate a permanent shareable link to any report. Anyone with the link can view it. For full multi-user collaboration, that's on the roadmap.</p>
      </details>
      <details class="faq-item">
        <summary>Is the trademark check legal advice?</summary>
        <p>No. Trademark results are informational signals. We surface potential conflicts so you can ask the right questions — always consult an attorney before filing or making major brand decisions.</p>
      </details>
    </div>
  `
  return el
}
