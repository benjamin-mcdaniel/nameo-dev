import { isAuthConfigured } from '../auth/config.js'
import { loginWithRedirect, logout, isAuthenticated, getUser } from '../auth/client.js'

export function Login() {
  const el = document.createElement('section')
  el.className = 'page login container'
  el.innerHTML = `
    <h1>Login</h1>
    <p>Sign in to save campaigns, track options, and share name searches with your team.</p>
    <div id="auth-status" class="hint">Checking authentication status…</div>
    <div class="actions">
      <button id="btn-login" class="btn btn-primary">Login with Auth0</button>
      <button id="btn-logout" class="btn">Logout</button>
    </div>
    <div id="auth-user" class="hint"></div>
  `

  attachAuthLogic(el)
  return el
}

function attachAuthLogic(root) {
  const statusEl = root.querySelector('#auth-status')
  const userEl = root.querySelector('#auth-user')
  const loginBtn = root.querySelector('#btn-login')
  const logoutBtn = root.querySelector('#btn-logout')

  if (!statusEl || !userEl || !loginBtn || !logoutBtn) return

  const configured = isAuthConfigured()
  if (!configured) {
    statusEl.textContent = 'Auth0 is not configured yet. The name checker and campaigns will work anonymously until keys are added.'
    loginBtn.disabled = true
    logoutBtn.disabled = true
    return
  }

  async function refreshState() {
    const authed = await isAuthenticated()
    if (authed) {
      statusEl.textContent = 'You are logged in.'
      const user = await getUser()
      userEl.textContent = user?.email ? `Signed in as ${user.email}` : ''
    } else {
      statusEl.textContent = 'You are not logged in.'
      userEl.textContent = ''
    }
  }

  loginBtn.addEventListener('click', async () => {
    try {
      await loginWithRedirect()
    } catch (err) {
      statusEl.textContent = 'Login failed. Check console for details.'
      console.error('Auth0 login error', err)
    }
  })

  logoutBtn.addEventListener('click', async () => {
    try {
      await logout()
    } catch (err) {
      statusEl.textContent = 'Logout failed. Check console for details.'
      console.error('Auth0 logout error', err)
    }
  })

  refreshState()
}
