export function Header() {
  const header = document.createElement('header')
  header.className = 'site-header'

  const brand = document.createElement('a')
  brand.href = '#/'
  brand.className = 'brand'
  brand.textContent = 'nameo.dev'

  const nav = document.createElement('nav')
  nav.className = 'site-nav'
  nav.innerHTML = `
    <a href="#/search">Search</a>
    <a href="#/campaigns">Campaigns</a>
    <a href="#/pricing">Pricing</a>
    <a href="#/help">Help</a>
  `

  const userSlot = document.createElement('div')
  userSlot.className = 'user-slot'
  userSlot.innerHTML = `
    <button class="btn btn-primary user-login-trigger" type="button">Login</button>
  `

  header.appendChild(brand)
  header.appendChild(nav)
  header.appendChild(userSlot)

  attachUserMenu(userSlot)
  return header
}

function attachUserMenu(container) {
  if (!container) return

  // Lazy-load auth client so the header doesn't force Auth0 on first paint.
  import('../auth/client.js')
    .then(async (mod) => {
      const { loginWithRedirect, logout, isAuthenticated, getUser } = mod

      async function render() {
        const authed = await isAuthenticated()
        container.innerHTML = ''

        if (!authed) {
          const btn = document.createElement('button')
          btn.type = 'button'
          btn.className = 'btn btn-primary user-login-trigger'
          btn.textContent = 'Login'
          btn.addEventListener('click', async () => {
            await loginWithRedirect()
          })
          container.appendChild(btn)
          return
        }

        const user = await getUser().catch(() => null)
        const email = user?.email || ''
        const initial = (email || 'N').charAt(0).toUpperCase()

        const wrapper = document.createElement('div')
        wrapper.className = 'user-menu'

        const toggle = document.createElement('button')
        toggle.type = 'button'
        toggle.className = 'user-pill'
        toggle.innerHTML = `<span class="user-initial">${initial}</span><span class="user-caret">847</span>`

        const dropdown = document.createElement('div')
        dropdown.className = 'user-menu-dropdown'
        dropdown.innerHTML = `
          <div class="user-menu-header">
            <div class="user-menu-email">${email}</div>
          </div>
          <button type="button" class="user-menu-item" data-action="campaigns">My campaigns</button>
          <button type="button" class="user-menu-item" data-action="account">Account & login</button>
          <button type="button" class="user-menu-item" data-action="logout">Logout</button>
        `

        function closeMenu() {
          dropdown.classList.remove('open')
        }

        toggle.addEventListener('click', (e) => {
          e.stopPropagation()
          dropdown.classList.toggle('open')
        })

        dropdown.addEventListener('click', async (e) => {
          const target = e.target
          if (!(target instanceof HTMLElement)) return
          const action = target.getAttribute('data-action')
          if (!action) return

          if (action === 'campaigns') {
            window.location.hash = '#/campaigns'
          } else if (action === 'account') {
            window.location.hash = '#/login'
          } else if (action === 'logout') {
            await logout()
          }
          closeMenu()
        })

        document.addEventListener('click', closeMenu)

        wrapper.appendChild(toggle)
        wrapper.appendChild(dropdown)
        container.appendChild(wrapper)
      }

      render()
    })
    .catch(() => {
      // If auth fails to load, leave the simple Login button in place.
    })
}
