export function Terms() {
  const el = document.createElement('section')
  el.className = 'page terms container'
  el.innerHTML = `
    <h1>Terms of Service</h1>
    <p>These terms are a simple description of how nameo.dev is intended to be used today. They are not legal advice and may change over time as the product evolves.</p>

    <h2>What nameo.dev does (and does not do)</h2>
    <ul class="bullet-list">
      <li><strong>Discovery tool.</strong> The site is a small discovery tool for checking name patterns across a few supported services. It is not a registrar, trademark search, or legal service.</li>
      <li><strong>No guarantees.</strong> Availability results are best-effort and may be incomplete, out of date, or change after you run a search. Always verify critical decisions with the underlying services or your own advisors.</li>
      <li><strong>External services.</strong> Checks may rely on public information from third-party platforms. Those platforms can update their rules, rate limits, or availability without notice.</li>
    </ul>

    <h2>Using the search feature</h2>
    <ul class="bullet-list">
      <li><strong>Reasonable usage.</strong> You agree not to automate high-volume scraping or abuse the service in ways that could disrupt it or the platforms being checked.</li>
      <li><strong>Content responsibility.</strong> You are responsible for any names you type into the search box. Do not intentionally search for, save, or share illegal, hateful, or clearly abusive content.</li>
      <li><strong>Safety filters.</strong> The app may block or reject obviously unsafe or offensive terms before sending requests. These filters are heuristic and not perfect.</li>
    </ul>

    <h2>Accounts and saved data</h2>
    <ul class="bullet-list">
      <li><strong>Authentication.</strong> Login is handled by Auth0. When you sign in, a minimal profile (such as your email address) is used to attach saved data to your account.</li>
      <li><strong>Saved items.</strong> Features like campaigns or favorites are intended as lightweight helpers. They should not be treated as a permanent archive or record.</li>
      <li><strong>Deletion.</strong> The app currently includes an option to delete your account and associated saved data. Deletion is best-effort and may not remove logs needed for security or troubleshooting.</li>
    </ul>

    <h2>Acceptable use</h2>
    <ul class="bullet-list">
      <li><strong>No abuse.</strong> You agree not to use nameo.dev to harass others, probe systems, or violate the terms of the platforms being checked.</li>
      <li><strong>No security testing.</strong> The service is not intended for penetration testing, load testing, or similar experiments without prior written permission.</li>
      <li><strong>Personal responsibility.</strong> You remain responsible for how you act on any information returned by the app.</li>
    </ul>

    <h2>Changes and availability</h2>
    <ul class="bullet-list">
      <li><strong>Service changes.</strong> Features may change, break, or be removed at any time without notice while the project is being improved.</li>
      <li><strong>Downtime.</strong> There is no uptime guarantee. Maintenance, provider issues, or bugs may make the service temporarily unavailable.</li>
      <li><strong>Updates to these terms.</strong> These terms may be updated occasionally. Continued use of the site after updates means you accept the current version.</li>
    </ul>
  `
  return el
}
