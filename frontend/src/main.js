import { router } from './router.js'
import { Header } from './components/header.js'
import { Footer } from './components/footer.js'
import './styles/base.css'
import './styles/theme.css'
import './styles/layout.css'

function mount() {
  const app = document.getElementById('app')
  app.innerHTML = ''

  const header = Header()
  const main = document.createElement('main')
  main.id = 'main'
  main.setAttribute('role', 'main')
  const footer = Footer()

  app.appendChild(header)
  app.appendChild(main)
  app.appendChild(footer)

  router.mount(main)
}

window.addEventListener('hashchange', () => router.navigate())
window.addEventListener('DOMContentLoaded', mount)
