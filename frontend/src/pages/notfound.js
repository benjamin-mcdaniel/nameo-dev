export function NotFound() {
  const el = document.createElement('section')
  el.className = 'page notfound container'
  el.style.textAlign = 'center'
  el.style.paddingTop = '80px'
  el.innerHTML = `
    <div style="font-size:3rem;margin-bottom:16px">404</div>
    <h1 style="margin-bottom:8px">Page not found</h1>
    <p class="hint" style="margin-bottom:24px">The page you're looking for doesn't exist.</p>
    <a href="#/" class="btn btn-primary">Back to home</a>
  `
  return el
}
