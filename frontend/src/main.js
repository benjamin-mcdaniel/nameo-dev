import { router } from './router.js'
import { Header } from './components/header.js'
import { Footer } from './components/footer.js'
import './styles/base.css'
import './styles/theme.css'
import './styles/layout.css'

async function mount() {
  const app = document.getElementById('app')
  app.innerHTML = ''

  // Ensure we complete any Auth0 redirect handling *before* we
  // render the header, so the header can immediately reflect
  // the correct authenticated state on first paint.
  try {
    const { handleAuthRedirectCallbackIfNeeded } = await import('./auth/client.js')
    await handleAuthRedirectCallbackIfNeeded()
  } catch (err) {
    // ignore auth redirect errors; app can still function anonymously
  }

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
