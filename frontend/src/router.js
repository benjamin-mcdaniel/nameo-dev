import { Home } from './pages/home.js'
import { Help } from './pages/help.js'
import { Login } from './pages/login.js'
import { Pricing } from './pages/pricing.js'
import { Privacy } from './pages/privacy.js'
import { Terms } from './pages/terms.js'
import { NotFound } from './pages/notfound.js'
import { Test } from './pages/test.js'

const routes = {
  '/': Home,
  '/help': Help,
  '/login': Login,
  '/pricing': Pricing,
  '/privacy': Privacy,
  '/terms': Terms,
  '/test': Test,
}

function getPath() {
  const hash = window.location.hash || '#/'
  const path = hash.slice(1)
  return path
}

export const router = {
  outlet: null,
  mount(outlet) {
    this.outlet = outlet
    this.navigate()
  },
  navigate() {
    if (!this.outlet) return
    const path = getPath()
    const Page = routes[path] || NotFound
    this.outlet.innerHTML = ''
    this.outlet.appendChild(Page())
    window.scrollTo(0, 0)
  },
}
