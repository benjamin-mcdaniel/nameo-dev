export function Login() {
  const el = document.createElement('section')
  el.className = 'page login container'
  el.innerHTML = `
    <h1>Login</h1>
    <p>Sign-in for nameo.dev will live here. For now, the name checker is open to everyone so you can test it freely.</p>
  `
  return el
}
