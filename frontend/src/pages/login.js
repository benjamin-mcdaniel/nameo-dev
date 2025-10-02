export function Login() {
  const el = document.createElement('section')
  el.className = 'page login container'
  el.innerHTML = `
    <h1>Login</h1>
    <p>Authentication is handled in the portal.</p>
    <a class="btn btn-primary" href="https://portal.nameo.dev/login" target="_blank" rel="noopener">Continue to Portal Login</a>
  `
  return el
}
