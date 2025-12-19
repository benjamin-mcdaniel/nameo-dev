export function Header() {
  const header = document.createElement('header')
  header.className = 'site-header'

  const brand = document.createElement('a')
  brand.href = '#/'
  brand.className = 'brand'
  brand.innerHTML = '<span class="brand-mark">N</span><span class="brand-text">nameo.dev</span>'

  const nav = document.createElement('nav')
  nav.className = 'site-nav'
  nav.innerHTML = `
    <a href="#/search">Search</a>
    <a href="#/pricing">Pricing</a>
    <a href="#/help">Help</a>
  `

  const userSlot = document.createElement('div')
  userSlot.className = 'user-slot'
  userSlot.innerHTML = `
    <a href="#/login" class="btn btn-primary" id="header-login-link">Login</a>
  `

  header.appendChild(brand)
  header.appendChild(nav)
  header.appendChild(userSlot)
  attachHeaderAuthState(userSlot.querySelector('#header-login-link'))
  return header
}

function attachHeaderAuthState(linkEl) {
  if (!linkEl) return

  import('../auth/client.js')
    .then(async (mod) => {
      const { isAuthenticated } = mod
      const authed = await isAuthenticated().catch(() => false)
      if (authed) {
        linkEl.textContent = 'Account'
        linkEl.href = '#/login'
      } else {
        linkEl.textContent = 'Login'
        linkEl.href = '#/login'
      }
    })
    .catch(() => {
      // leave as Login on error
    })
}
