const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

export function Home() {
  const el = document.createElement('section')
  el.className = 'page home'
  el.innerHTML = `
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-copy">
          <h1>Check your brand name in one place.</h1>
          <p class="sub">Type a name once to see if key handles are open, then keep track of the ideas that look promising. Free while we are in beta.</p>
          <div class="actions">
            <a class="btn btn-primary" href="#/search">Try search</a>
            <a class="btn" href="#/pricing">View plans</a>
          </div>
        </div>
      </div>
    </section>

    <section class="home-main" id="checker">
      <div class="container checker-grid">
        <div class="card card-primary">
          <h2>Instant name availability</h2>
          <form id="home-search-form" class="home-search-row">
            <input id="home-search-input" type="text" autocomplete="off" placeholder="Search across platforms" />
            <button id="home-search-submit" class="btn btn-primary" type="submit">Search</button>
          </form>
        </div>

        <div class="card card-secondary">
          <h2>For solo checks and deeper research</h2>
          <ul class="bullet-list">
            <li><strong>Quick solo checks.</strong> See taken / not taken style results and keep a simple history of ideas.</li>
            <li><strong>Guidance as you grow.</strong> Longer term, basic and advanced tiers will add age-of-taken signals and nudges away from crowded names.</li>
            <li><strong>Reports for teams.</strong> Advanced plans will focus on campaigns, adjacent name suggestions, and reports you can share with founders, marketers, or clients.</li>
          </ul>
        </div>
      </div>
    </section>
  `
  attachLogic(el)
  return el
}

function attachLogic(root) {
  const form = root.querySelector('#home-search-form')
  const input = root.querySelector('#home-search-input')

  if (!form || !input) return

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const value = (input.value || '').trim()
    if (value) {
      try {
        localStorage.setItem('nameo_pending_search', value)
      } catch {
        // ignore storage errors; user will still land on Search page
      }
    }
    window.location.hash = '#/search'
  })
}
