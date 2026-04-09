import { getAccessToken, getUser, logout, isAuthenticated, loginWithRedirect } from '../auth/client.js'

const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', 'application/json')
  try {
    const token = await getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  } catch { /* fallback */ }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

const TIER_LABELS = {
  beta:     { label: 'Beta',     cls: 'tier-beta' },
  free:     { label: 'Free',     cls: 'tier-free' },
  starter:  { label: 'Starter',  cls: 'tier-starter' },
  pro:      { label: 'Pro',      cls: 'tier-pro' },
  premium:  { label: 'Premium',  cls: 'tier-premium' },
}

function formatDate(ts) {
  if (!ts) return ''
  try {
    return new Date(ts * 1000).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    })
  } catch { return '' }
}

function escHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}

// ── Page entry point ──────────────────────────────────────────────────────────

export function Account() {
  const el = document.createElement('section')
  el.className = 'page account container'

  el.innerHTML = `
    <div id="account-loading" class="empty-state">Loading…</div>
    <div id="account-main" style="display:none"></div>
  `

  loadAccount(el)
  return el
}

// ── Load ──────────────────────────────────────────────────────────────────────

async function loadAccount(root) {
  const loadingEl = root.querySelector('#account-loading')
  const mainEl = root.querySelector('#account-main')

  // Auth check
  const authed = await isAuthenticated().catch(() => false)
  if (!authed) {
    if (loadingEl) loadingEl.innerHTML = `
      <div class="inline-status is-warning">
        Sign in to view your account.
        <button class="btn btn-sm btn-primary" style="margin-left:10px" id="acct-signin-btn">Sign in</button>
      </div>
    `
    root.querySelector('#acct-signin-btn')?.addEventListener('click', () => loginWithRedirect())
    return
  }

  // Fetch Auth0 user + API account data in parallel
  const [auth0User, meResp] = await Promise.all([
    getUser().catch(() => null),
    apiFetch('/api/me'),
  ])

  if (loadingEl) loadingEl.style.display = 'none'
  if (mainEl) mainEl.style.display = ''

  const me = meResp.ok ? meResp.data : {}
  renderAccount(root, mainEl, auth0User, me)
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderAccount(root, el, auth0User, me) {
  const email = me.email || auth0User?.email || ''
  const name  = auth0User?.name || ''
  const givenName = auth0User?.given_name || (name ? name.split(' ')[0] : '') || email.split('@')[0]
  const initial = (email || 'N').charAt(0).toUpperCase()
  const picture = auth0User?.picture || ''
  const tier = me.tier || 'beta'
  const tierMeta = TIER_LABELS[tier] || { label: tier, cls: 'tier-beta' }
  const sessionCount = me.session_count ?? '—'
  const memberSince = me.created_at ? formatDate(me.created_at) : ''

  const avatarHtml = picture
    ? `<img src="${escHtml(picture)}" alt="${escHtml(email)}" class="account-avatar-img">`
    : `<div class="account-avatar-initial">${initial}</div>`

  el.innerHTML = `
    <div class="page-header">
      <div class="eyebrow">Account</div>
      <h1>Your account</h1>
    </div>

    <!-- Profile card -->
    <div class="account-profile-card">
      <div class="account-avatar">${avatarHtml}</div>
      <div class="account-profile-info">
        <div class="account-name">${escHtml(givenName || email)}</div>
        <div class="account-email">${escHtml(email)}</div>
        <div class="account-meta-row">
          <span class="tier-badge ${tierMeta.cls}">${tierMeta.label}</span>
          ${memberSince ? `<span class="account-since">Member since ${escHtml(memberSince)}</span>` : ''}
        </div>
      </div>
    </div>

    <!-- Stats row -->
    <div class="account-stats-row">
      <div class="account-stat">
        <div class="account-stat-value">${sessionCount}</div>
        <div class="account-stat-label">Sessions created</div>
      </div>
      <div class="account-stat">
        <div class="account-stat-value">${tier === 'beta' ? '∞' : '—'}</div>
        <div class="account-stat-label">Credits remaining</div>
      </div>
      <div class="account-stat">
        <div class="account-stat-value">${tier === 'beta' ? 'Beta' : '—'}</div>
        <div class="account-stat-label">Current plan</div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="account-section">
      <h2>Your sessions</h2>
      <p>All your naming research is organized into sessions. Pick up where you left off or start something new.</p>
      <div class="account-actions-row">
        <a href="#/sessions" class="btn btn-primary">View my sessions</a>
        <a href="#/sessions/new" class="btn">+ New session</a>
      </div>
    </div>

    <!-- Plan -->
    <div class="account-section">
      <h2>Plan &amp; billing</h2>
      ${tier === 'beta'
        ? `<div class="account-plan-note">
            <strong>You're on the beta plan.</strong> During beta, all features are available at no cost. Billing will be introduced when Nameo exits beta — you'll get advance notice before anything changes.
          </div>`
        : `<p>You're on the <strong>${escHtml(tierMeta.label)}</strong> plan. <a href="#/pricing">View all plans →</a></p>`
      }
    </div>

    <!-- Danger zone -->
    <div class="account-section account-danger-zone">
      <h2>Danger zone</h2>
      <p>Deleting your account permanently removes all your sessions, reports, and data. This cannot be undone.</p>
      <button class="btn btn-danger" id="delete-account-btn">Delete my account</button>
    </div>
  `

  // Sign out (in header, but add convenience link here too)
  const signOutBtn = document.createElement('button')
  signOutBtn.className = 'btn'
  signOutBtn.style.marginTop = '8px'
  signOutBtn.textContent = 'Sign out'
  signOutBtn.addEventListener('click', async () => {
    await logout()
    window.location.hash = '#/'
  })
  el.querySelector('.account-actions-row')?.after(signOutBtn)

  // Delete account
  el.querySelector('#delete-account-btn')?.addEventListener('click', async () => {
    const confirmed = window.confirm(
      'Are you sure? This will permanently delete your account and all your sessions and reports. This cannot be undone.'
    )
    if (!confirmed) return

    const btn = el.querySelector('#delete-account-btn')
    if (btn) { btn.disabled = true; btn.textContent = 'Deleting…' }

    const resp = await apiFetch('/api/account', { method: 'DELETE' })
    if (resp.ok) {
      await logout()
      window.location.hash = '#/'
    } else {
      if (btn) { btn.disabled = false; btn.textContent = 'Delete my account' }
      window.alert('Something went wrong. Please try again or contact hello@nameo.dev.')
    }
  })
}
