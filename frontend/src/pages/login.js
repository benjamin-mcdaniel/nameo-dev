import { isAuthConfigured } from '../auth/config.js'
import { loginWithRedirect, logout, isAuthenticated, getUser, getAccessToken } from '../auth/client.js'

const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

export function Login() {
  const el = document.createElement('section')
  el.className = 'page login container'

  el.innerHTML = `
    <div class="login-page-inner">
      <div class="login-card">
        <h1>Account</h1>
        <p class="login-sub">Sign in to save projects, track name candidates, and access your research across devices.</p>

        <div id="auth-status" class="status" style="margin-bottom:12px"></div>

        <div id="auth-logged-out">
          <button id="btn-login" class="btn btn-primary" style="width:100%;justify-content:center">
            Continue with Auth0
          </button>
        </div>

        <div id="auth-logged-in" style="display:none">
          <div id="auth-user-info" class="hint" style="margin-bottom:14px"></div>
          <div class="actions-inline">
            <a href="#/campaigns" class="btn btn-primary">My Projects</a>
            <button id="btn-logout" class="btn">Sign out</button>
          </div>

          <hr class="login-divider">

          <div class="login-danger-zone">
            <h3>Danger zone</h3>
            <p class="hint" style="margin-bottom:10px">
              Permanently deletes your account and all saved projects and data. This cannot be undone.
            </p>
            <div class="actions-inline">
              <button id="btn-delete-account" class="btn">Delete account &amp; data</button>
              <span id="delete-account-status" class="hint"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  attachAuthLogic(el)
  return el
}

function attachAuthLogic(root) {
  const statusEl       = root.querySelector('#auth-status')
  const loggedOutEl    = root.querySelector('#auth-logged-out')
  const loggedInEl     = root.querySelector('#auth-logged-in')
  const userInfoEl     = root.querySelector('#auth-user-info')
  const loginBtn       = root.querySelector('#btn-login')
  const logoutBtn      = root.querySelector('#btn-logout')
  const deleteBtn      = root.querySelector('#btn-delete-account')
  const deleteStatusEl = root.querySelector('#delete-account-status')

  if (!statusEl || !loggedOutEl || !loggedInEl) return

  const configured = isAuthConfigured()
  if (!configured) {
    statusEl.textContent = 'Auth is not configured.'
    statusEl.className = 'status status-error'
    if (loginBtn) loginBtn.disabled = true
    return
  }

  async function refreshState() {
    statusEl.textContent = ''
    const authed = await isAuthenticated().catch(() => false)

    if (authed) {
      loggedOutEl.style.display = 'none'
      loggedInEl.style.display = ''
      const user = await getUser().catch(() => null)
      if (userInfoEl) {
        userInfoEl.textContent = user?.email ? `Signed in as ${user.email}` : 'Signed in'
      }
    } else {
      loggedOutEl.style.display = ''
      loggedInEl.style.display = 'none'
      if (userInfoEl) userInfoEl.textContent = ''
    }
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      try { await loginWithRedirect() } catch {
        statusEl.textContent = 'Login failed. Please try again.'
        statusEl.className = 'status status-error'
      }
    })
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try { await logout() } catch {
        statusEl.textContent = 'Sign out failed. Please try again.'
        statusEl.className = 'status status-error'
      }
    })
  }

  if (deleteBtn && deleteStatusEl) {
    deleteBtn.addEventListener('click', async () => {
      const authed = await isAuthenticated()
      if (!authed) { deleteStatusEl.textContent = 'You must be signed in to delete your account.'; return }

      const confirmed = window.confirm(
        'This will permanently delete your account and all saved projects and data. This cannot be undone. Continue?'
      )
      if (!confirmed) return

      deleteStatusEl.textContent = 'Deleting account…'

      try {
        const token = await getAccessToken()
        if (!token) { deleteStatusEl.textContent = 'Could not get access token. Try signing in again.'; return }

        const res = await fetch(`${API_BASE}/api/account`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) { deleteStatusEl.textContent = 'Unable to delete account right now.'; return }

        deleteStatusEl.textContent = 'Account deleted.'
        await logout()
        await refreshState()
      } catch {
        deleteStatusEl.textContent = 'An error occurred. Please try again.'
      }
    })
  }

  refreshState()
}
