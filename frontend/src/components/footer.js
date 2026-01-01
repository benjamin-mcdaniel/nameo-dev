export function Footer() {
  const footer = document.createElement('footer')
  footer.className = 'site-footer'
  footer.innerHTML = `
    <div class="container">
      <div class="left">© ${new Date().getFullYear()} nameo.dev</div>
      <div class="right">
        <a href="#/features">Features</a>
        <a href="#/status">Status</a>
      </div>
    </div>
  `
  return footer
}
