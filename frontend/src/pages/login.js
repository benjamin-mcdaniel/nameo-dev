import { isAuthConfigured } from '../auth/config.js'
import { loginWithRedirect, logout, isAuthenticated, getUser, getAccessToken } from '../auth/client.js'

export function Login() {
  const el = document.createElement('section')
  el.className = 'page login container'
  el.innerHTML = `
    <h1>Login</h1>
    <p>Sign in to save campaigns, track options, and share name searches with your team. You can also delete your account and all saved data at any time.</p>
    <div id="auth-status" class="hint">Checking authentication status…</div>
    <div class="actions">
      <button id="btn-login" class="btn btn-primary">Login with Auth0</button>
      <button id="btn-logout" class="btn">Logout</button>
    </div>
    <div id="auth-user" class="hint"></div>
    <div class="actions actions-inline">
      <button id="btn-delete-account" class="btn">Delete account & data</button>
      <span id="delete-account-status" class="hint"></span>
    </div>
  `

  attachAuthLogic(el)
  return el
}

function attachAuthLogic(root) {
  const statusEl = root.querySelector('#auth-status')
  const userEl = root.querySelector('#auth-user')
  const loginBtn = root.querySelector('#btn-login')
  const logoutBtn = root.querySelector('#btn-logout')
  const deleteBtn = root.querySelector('#btn-delete-account')
  const deleteStatusEl = root.querySelector('#delete-account-status')

  if (!statusEl || !userEl || !loginBtn || !logoutBtn || !deleteBtn || !deleteStatusEl) return

  const configured = isAuthConfigured()
  if (!configured) {
    statusEl.textContent = 'Auth0 is not configured yet. The name checker and campaigns will work anonymously until keys are added.'
    loginBtn.disabled = true
    logoutBtn.disabled = true
    deleteBtn.disabled = true
    return
  }

  async function refreshState() {
    const authed = await isAuthenticated()
    if (authed) {
      statusEl.textContent = 'You are logged in.'
      const user = await getUser()
      userEl.textContent = user?.email ? `Signed in as ${user.email}` : ''
      loginBtn.style.display = 'none'
      logoutBtn.style.display = ''
      deleteBtn.style.display = ''
    } else {
      statusEl.textContent = 'You are not logged in.'
      userEl.textContent = ''
      loginBtn.style.display = ''
      logoutBtn.style.display = 'none'
      deleteBtn.style.display = 'none'
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

  deleteBtn.addEventListener('click', async () => {
    const authed = await isAuthenticated()
    if (!authed) {
      deleteStatusEl.textContent = 'You need to be logged in to delete your account.'
      return
    }

    const confirmed = window.confirm('This will delete your account and all saved campaigns and options. This cannot be undone. Continue?')
    if (!confirmed) return

    deleteStatusEl.textContent = 'Deleting your account…'

    try {
      const token = await getAccessToken()
      if (!token) {
        deleteStatusEl.textContent = 'Could not get an access token. Try logging in again.'
        return
      }

      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        deleteStatusEl.textContent = 'Unable to delete account right now.'
        return
      }

      deleteStatusEl.textContent = 'Your account and data were deleted.'
      await logout()
      await refreshState()
    } catch (err) {
      deleteStatusEl.textContent = 'An error occurred while deleting your account.'
      console.error('Delete account error', err)
    }
  })

  refreshState()
}
