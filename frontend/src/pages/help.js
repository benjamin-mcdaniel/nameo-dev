export function Help() {
  const el = document.createElement('section')
  el.className = 'page help container'
  el.innerHTML = `
    <div class="page-header">
      <div class="eyebrow">Documentation</div>
      <h1>How Nameo works</h1>
      <p>Everything you need to know about running brand research with Nameo.</p>
    </div>

    <div class="content-with-sidebar">
      <div>
        <div class="section">
          <h2>Getting started</h2>
          <p>Nameo is a brand research tool for startups and product teams. The core workflow is: create a project, add your name candidates, run availability checks, and review the results side-by-side.</p>
          <p>You can also use <a href="#/search">Quick Search</a> to do a one-off check on a single name without creating a project.</p>
        </div>

        <div class="section">
          <h2>Projects</h2>
          <p>A project represents a product launch or naming initiative. Inside a project you can add multiple name candidates — the different names you're considering — and run checks on all of them.</p>
          <p>Projects are private to your account. Sign in to create and access your projects.</p>
        </div>

        <div class="section">
          <h2>What gets checked</h2>
          <p>For each name candidate, Nameo checks availability across:</p>
          <ul style="margin:8px 0 0 20px;color:var(--text-secondary);font-size:0.95rem;line-height:1.8">
            <li><strong>Domains</strong> — .com, .io, .ai, .co, .app, .dev</li>
            <li><strong>Social handles</strong> — X/Twitter, LinkedIn, Instagram, YouTube, GitHub, TikTok</li>
            <li><strong>App stores</strong> — iOS App Store and Google Play (name collision signals)</li>
            <li><strong>Trademark signals</strong> — basic US and EU trademark screening (Pro+)</li>
          </ul>
        </div>

        <div class="section">
          <h2>How checks work</h2>
          <p>Social and domain checks use live HTTP probes — we request the URL for a given handle and interpret the response code. A 404 means the handle is likely available; a 200 or 301 means something is already there.</p>
          <p>Results are cached briefly to keep things fast. Re-run a check anytime to get a fresh result.</p>
        </div>

        <div class="section">
          <h2>Need help?</h2>
          <p>Questions or feedback? Reach out at <a href="mailto:hello@nameo.dev">hello@nameo.dev</a>.</p>
        </div>
      </div>

      <div>
        <div class="card-subtle" style="position:sticky;top:80px">
          <h3 style="margin-bottom:12px;font-size:0.95rem">Quick links</h3>
          <div style="display:flex;flex-direction:column;gap:6px">
            <a href="#/campaigns" class="btn btn-sm" style="justify-content:flex-start">My Projects</a>
            <a href="#/search" class="btn btn-sm" style="justify-content:flex-start">Quick Search</a>
            <a href="#/pricing" class="btn btn-sm" style="justify-content:flex-start">Pricing</a>
            <a href="#/status" class="btn btn-sm" style="justify-content:flex-start">System Status</a>
          </div>
        </div>
      </div>
    </div>
  `
  return el
}
