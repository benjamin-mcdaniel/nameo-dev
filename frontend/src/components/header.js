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
    <a href="#/pricing">Pricing</a>
    <a href="#/help">Help</a>
    <a href="#/login" class="btn btn-primary">Login</a>
  `

  header.appendChild(brand)
  header.appendChild(nav)
  return header
}
