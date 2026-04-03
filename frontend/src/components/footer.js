export function Footer() {
  const footer = document.createElement('footer')
  footer.className = 'site-footer'
  footer.innerHTML = `
    <div class="container">
      <div class="footer-copy">&copy; ${new Date().getFullYear()} nameo.dev</div>
      <div class="footer-links">
        <a href="#/pricing">Pricing</a>
        <a href="#/help">Docs</a>
        <a href="#/status">Status</a>
        <a href="#/privacy">Privacy</a>
        <a href="#/terms">Terms</a>
      </div>
    </div>
  `
  return footer
}
