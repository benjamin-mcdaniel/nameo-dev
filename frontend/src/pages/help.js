export function Help() {
  const el = document.createElement('section')
  el.className = 'page help container'
  el.innerHTML = `
    <div class="support-hero">
      <h1>Support</h1>
      <p class="sub">Answers, troubleshooting, and product notes for nameo.dev.</p>
    </div>

    <div class="support-layout">
      <aside class="support-nav" aria-label="Support navigation">
        <div class="support-nav-inner">
          <div class="support-nav-title">On this page</div>
          <a class="support-nav-link" href="#support-getting-started">Getting started</a>
          <a class="support-nav-link" href="#support-search-results">Understanding results</a>
          <a class="support-nav-link" href="#support-advanced">Advanced workflows</a>
          <a class="support-nav-link" href="#support-accounts">Accounts & data</a>
          <a class="support-nav-link" href="#support-troubleshooting">Troubleshooting</a>
          <a class="support-nav-link" href="#support-contact">Contact</a>
        </div>
      </aside>

      <main class="support-content">
        <section id="support-getting-started" class="support-section card">
          <h2>Getting started</h2>
          <p class="hint">Most users land in one of two paths: quick checks (basic search) or deeper research (advanced workflows).</p>
          <div class="actions-inline">
            <a class="btn btn-primary" href="#/search">Open basic search</a>
            <a class="btn" href="#/advanced">Open advanced workflow</a>
          </div>
          <div class="support-callout" style="margin-top: 12px;">
            <div class="support-callout-title">Tip</div>
            <div class="hint">If you type a name on the home page, it will carry over into basic search automatically.</div>
          </div>
        </section>

        <section id="support-search-results" class="support-section card">
          <h2>Understanding results</h2>
          <div class="support-grid">
            <div class="support-mini">
              <h3>Available</h3>
              <p class="hint">The platform likely does not have an account/page for that name.</p>
            </div>
            <div class="support-mini">
              <h3>Taken</h3>
              <p class="hint">Something exists at that URL. You should verify directly on the platform.</p>
            </div>
            <div class="support-mini">
              <h3>Unknown / Coming soon</h3>
              <p class="hint">The check is not supported yet, or the platform responded in an unexpected way.</p>
            </div>
          </div>
          <p class="hint" style="margin-top: 12px;">nameo.dev is a best-effort discovery tool. Results are not guarantees and can change after you check.</p>
        </section>

        <section id="support-advanced" class="support-section card">
          <h2>Advanced workflows</h2>
          <p>Advanced workflows are designed for startups and teams that need a unified naming plan across domains and social handles.</p>
          <ul class="bullet-list">
            <li><strong>Reports.</strong> The advanced flow creates a report view that can show multiple candidate names.</li>
            <li><strong>Handle variations.</strong> The report can suggest variations like <code>official</code>, <code>real</code>, <code>app</code>, or <code>platform</code> to help align across networks.</li>
            <li><strong>Status.</strong> Advanced workflow data is currently stubbed and will be replaced with real checks.</li>
          </ul>
          <div class="support-callout" style="margin-top: 12px;">
            <div class="support-callout-title">What you will eventually get</div>
            <div class="hint">A final report that recommends a small set of viable names, with the best matching domain + social handles for each.</div>
          </div>
        </section>

        <section id="support-accounts" class="support-section card">
          <h2>Accounts & data</h2>
          <p>Authentication is handled by Auth0. When you log in, we receive a minimal profile that we can use to attach saved searches to you.</p>
          <div class="support-grid">
            <div class="support-mini">
              <h3>Saved history</h3>
              <p class="hint">Logged-in users can sync recent searches across devices.</p>
            </div>
            <div class="support-mini">
              <h3>Local-only mode</h3>
              <p class="hint">If you are not logged in, favorites/history (and advanced reports) are stored locally in your browser.</p>
            </div>
            <div class="support-mini">
              <h3>Privacy</h3>
              <p class="hint">We do not front-run your ideas, sell your search data, or register domains or handles based on your searches.</p>
            </div>
          </div>
          <p class="hint" style="margin-top: 12px;">Also see <a href="#/terms">Terms of Service</a> for the current usage guidelines.</p>
        </section>

        <section id="support-troubleshooting" class="support-section card">
          <h2>Troubleshooting</h2>
          <ul class="bullet-list">
            <li><strong>Results look wrong.</strong> Click through to the platform link to confirm. Some platforms return non-obvious responses for missing pages.</li>
            <li><strong>Search feels stuck.</strong> Try again with a shorter name, or refresh the page.</li>
            <li><strong>Login issues.</strong> If Auth0 is unavailable, the site still works in anonymous mode.</li>
          </ul>
          <div class="support-callout" style="margin-top: 12px;">
            <div class="support-callout-title">When reporting a bug</div>
            <div class="hint">Include the name you searched, what you expected, and any console errors if available.</div>
          </div>
        </section>

        <section id="support-contact" class="support-section card">
          <h2>Contact</h2>
          <p>If you run into issues or have ideas, reach out anytime. There is no formal support SLA, but feedback helps shape the product.</p>
          <div class="support-contact-grid">
            <div class="support-contact-item">
              <div class="support-contact-title">Email</div>
              <div><a href="mailto:support@nameo.dev">support@nameo.dev</a></div>
            </div>
            <div class="support-contact-item">
              <div class="support-contact-title">What to include</div>
              <div class="hint">Name you searched, page URL, and what happened.</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  `
  return el
}
