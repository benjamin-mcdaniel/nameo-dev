export function NotFound() {
  const el = document.createElement('section')
  el.className = 'page notfound container'
  el.innerHTML = `
    <h1>Page not found</h1>
    <p>The page you are looking for does not exist.</p>
    <a class="btn" href="#/">Go Home</a>
  `
  return el
}
