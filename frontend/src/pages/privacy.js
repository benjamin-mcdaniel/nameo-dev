export function Privacy() {
  const el = document.createElement('section')
  el.className = 'page privacy container'
  el.innerHTML = `
    <div class="container-sm">
      <div class="page-header">
        <div class="eyebrow">Legal</div>
        <h1>Privacy Policy</h1>
        <p>Last updated: April 2026</p>
      </div>
      <div style="color:var(--text-secondary);line-height:1.8;font-size:0.95rem">
        <h2>What we collect</h2>
        <p>When you sign in, we store your Auth0 user ID and email address. We also store the projects, name candidates, and search history you create while using Nameo.</p>
        <h2>How we use it</h2>
        <p>Your data is used solely to provide the Nameo service — storing your projects and search results so you can access them across sessions. We do not sell your data or use it for advertising.</p>
        <h2>Name checks</h2>
        <p>When you run a name check, the name you submit is sent to third-party platforms (social networks, domain registrars, etc.) via standard HTTP requests to check availability. These requests do not include your account information.</p>
        <h2>Data deletion</h2>
        <p>You can delete your account and all associated data at any time from the <a href="#/login">Account</a> page.</p>
        <h2>Contact</h2>
        <p>Questions? Email <a href="mailto:hello@nameo.dev">hello@nameo.dev</a>.</p>
      </div>
    </div>
  `
  return el
}
