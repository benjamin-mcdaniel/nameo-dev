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

  const themeToggle = document.createElement('button')
  themeToggle.className = 'theme-toggle'
  themeToggle.title = 'Toggle dark mode'
  themeToggle.textContent = '🌓'
  themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  })

  const saved = localStorage.getItem('theme')
  if (saved === 'dark') document.documentElement.classList.add('dark')

  header.appendChild(brand)
  header.appendChild(nav)
  header.appendChild(themeToggle)
  return header
}
