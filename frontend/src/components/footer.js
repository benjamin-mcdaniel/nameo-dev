export function Footer() {
  const footer = document.createElement('footer')
  footer.className = 'site-footer'
  footer.innerHTML = `
    <div class="container">
      <div class="left">© ${new Date().getFullYear()} nameo.dev</div>
      <div class="right">
        <a href="https://portal.nameo.dev" target="_blank" rel="noopener">Portal</a>
        <a href="mailto:support@nameo.dev">Email Support</a>
        <a href="https://portal.nameo.dev/support/tickets" target="_blank" rel="noopener">Submit a Ticket</a>
      </div>
    </div>
  `
  return footer
}
