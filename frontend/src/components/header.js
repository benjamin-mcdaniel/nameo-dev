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
    <a href="#/search" class="nav-search-primary">Search</a>
    <a href="#/use-case">Use Case</a>
    <a href="#/pricing">Pricing</a>
    <a href="#/help">Help</a>
  `

  const userSlot = document.createElement('div')
  userSlot.className = 'user-slot'
  userSlot.innerHTML = `
    <a href="#/login" class="btn btn-primary user-login-trigger" id="header-login-link">Login</a>
  `

  header.appendChild(brand)
  header.appendChild(nav)
  header.appendChild(userSlot)
  attachUserMenu(userSlot)
  return header
}

function attachUserMenu(container) {
  if (!container) return

  import('../auth/client.js')
    .then(async (mod) => {
      const { loginWithRedirect, logout, isAuthenticated, getUser } = mod

      async function render() {
        const authed = await isAuthenticated().catch(() => false)
        container.innerHTML = ''

        if (!authed) {
          const link = document.createElement('a')
          link.href = '#/login'
          link.className = 'btn btn-primary user-login-trigger'
          link.textContent = 'Login'
          link.addEventListener('click', async (e) => {
            // Let the dedicated Login page drive the flow, but also
            // support direct Auth0 login if needed later.
            e.preventDefault()
            await loginWithRedirect()
          })
          container.appendChild(link)
          return
        }

        const user = await getUser().catch(() => null)
        const email = user?.email || ''
        const name = typeof user?.name === 'string' ? user.name : ''
        const givenName = typeof user?.given_name === 'string' ? user.given_name : ''
        const firstName = givenName || (name ? name.split(' ')[0] : '') || (email ? email.split('@')[0] : '')
        const initial = (email || firstName || 'N').charAt(0).toUpperCase()
        const picture = user?.picture || ''

        const wrapper = document.createElement('div')
        wrapper.className = 'user-menu'

        const toggle = document.createElement('button')
        toggle.type = 'button'
        toggle.className = 'user-pill'
        const avatarHtml = picture
          ? `<img src="${picture}" alt="${email || 'Account'}" class="user-avatar">`
          : `<span class="user-initial">${initial}</span>`
        const nameHtml = firstName ? `<span class="user-name">${firstName}</span>` : ''
        toggle.innerHTML = `${avatarHtml}${nameHtml}<span class="user-caret">▾</span>`

        const dropdown = document.createElement('div')
        dropdown.className = 'user-menu-dropdown'
        dropdown.innerHTML = `
          <div class="user-menu-header">
            <div class="user-menu-email">${email}</div>
          </div>
          <button type="button" class="user-menu-item" data-action="account">Account</button>
          <button type="button" class="user-menu-item" data-action="logout">Logout</button>
        `

        function closeMenu() {
          dropdown.classList.remove('open')
          document.removeEventListener('click', onDocClick)
        }

        function onDocClick(e) {
          if (!wrapper.contains(e.target)) {
            closeMenu()
          }
        }

        toggle.addEventListener('click', (e) => {
          e.stopPropagation()
          const willOpen = !dropdown.classList.contains('open')
          if (willOpen) {
            dropdown.classList.add('open')
            document.addEventListener('click', onDocClick)
          } else {
            closeMenu()
          }
        })

        dropdown.addEventListener('click', async (e) => {
          const target = e.target
          if (!(target instanceof HTMLElement)) return
          const action = target.getAttribute('data-action')
          if (!action) return

          if (action === 'account') {
            window.location.hash = '#/login'
          } else if (action === 'logout') {
            await logout()
            // After logout, re-render menu to show Login again
            await render()
          }

          closeMenu()
        })

        wrapper.appendChild(toggle)
        wrapper.appendChild(dropdown)
        container.appendChild(wrapper)
      }

      render()
    })
    .catch(() => {
      // On error, leave the static Login link in place.
    })
}
