const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

export function Home() {
  const el = document.createElement('section')
  el.className = 'page home'
  el.innerHTML = `
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-copy">
          <h1>Find a name that is actually available.</h1>
          <p class="sub">Check social handles in one place, then save the best options into a simple campaign you can revisit later.</p>
          <div class="actions">
            <a class="btn btn-primary" href="#/search">Start checking a name</a>
            <a class="btn" href="#/pricing">See pricing</a>
          </div>
        </div>
      </div>
    </section>

    <section class="home-main" id="checker">
      <div class="container checker-grid">
        <div class="card card-primary">
          <h2>Instant availability check</h2>
          <form id="home-search-form" class="home-search-row">
            <input id="home-search-input" type="text" autocomplete="off" placeholder="Search across platforms" />
            <button id="home-search-submit" class="btn btn-primary" type="submit">Search</button>
          </form>
        </div>

        <div class="card card-secondary">
          <h2>Stay organized as you name</h2>
          <ul class="bullet-list">
            <li><strong>Campaigns for launches.</strong> Group all of your name options for each product in one place.</li>
            <li><strong>Saved searches.</strong> Come back to see which names were available without re-running everything.</li>
            <li><strong>Shareable later.</strong> The same campaigns will power shared views for founders, marketers, and clients.</li>
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
