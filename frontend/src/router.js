import { Home } from './pages/home.js'
import { Help } from './pages/help.js'
import { Login } from './pages/login.js'
import { Pricing } from './pages/pricing.js'
import { Features } from './pages/features.js'
import { Status } from './pages/status.js'
import { Privacy } from './pages/privacy.js'
import { Terms } from './pages/terms.js'
import { NotFound } from './pages/notfound.js'
import { Test } from './pages/test.js'
import { Campaigns } from './pages/campaigns.js'
import { Search } from './pages/search.js'

const routes = {
  '/': Home,
  '/search': Search,
  '/help': Help,
  '/login': Login,
  '/pricing': Pricing,
  '/features': Features,
  '/status': Status,
  '/privacy': Privacy,
  '/terms': Terms,
  '/test': Test,
  '/campaigns': Campaigns,
}

function getPath() {
  const hash = window.location.hash || '#/'
  const pathWithQuery = hash.slice(1)
  const [path] = pathWithQuery.split('?')
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
