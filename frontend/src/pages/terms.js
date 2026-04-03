export function Terms() {
  const el = document.createElement('section')
  el.className = 'page terms container'
  el.innerHTML = `
    <div class="container-sm">
      <div class="page-header">
        <div class="eyebrow">Legal</div>
        <h1>Terms of Service</h1>
        <p>Last updated: April 2026</p>
      </div>
      <div style="color:var(--text-secondary);line-height:1.8;font-size:0.95rem">
        <h2>Use of the service</h2>
        <p>Nameo provides name availability research as a convenience tool. Results are indicative only — always verify availability independently before making business decisions or committing to a name.</p>
        <h2>Accuracy</h2>
        <p>Availability checks are performed via live HTTP probes and may not reflect the true availability of a handle, domain, or trademark. Nameo makes no guarantees about the accuracy or completeness of results.</p>
        <h2>Acceptable use</h2>
        <p>You agree not to use Nameo to scrape data at scale, abuse the availability check endpoints, or circumvent rate limits. Automated or bulk use requires written permission.</p>
        <h2>Account</h2>
        <p>You are responsible for maintaining the security of your account. You may delete your account at any time from the Account page.</p>
        <h2>Changes</h2>
        <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
        <h2>Contact</h2>
        <p>Questions? Email <a href="mailto:hello@nameo.dev">hello@nameo.dev</a>.</p>
      </div>
    </div>
  `
  return el
}
