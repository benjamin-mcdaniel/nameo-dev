const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

export function Home() {
  const el = document.createElement('section')
  el.className = 'page home'
  el.innerHTML = `
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-copy">
          <h1>Name your product in minutes.</h1>
          <p class="sub">Type a name once and see where its free across the internet from socials to creator platforms. Built for startups, solo makers, small businesses, and streamers.</p>
          <div class="actions">
            <a class="btn btn-primary" href="#/search">Start a search</a>
            <a class="btn" href="#/features">See whats included</a>
          </div>
        </div>
      </div>
    </section>

    <section class="home-main" id="checker">
      <div class="container checker-grid">
        <div class="card card-primary">
          <h2>Ask all your questions about a name.</h2>
          <form id="home-search-form" class="home-search-row">
            <input id="home-search-input" type="text" autocomplete="off" placeholder="Try mybrand, studio, or your stream handle" />
            <button id="home-search-submit" class="btn btn-primary" type="submit">Check availability</button>
          </form>
          <ul class="bullet-list">
            <li><strong>One search, many answers.</strong> See if your name is taken on major platforms without opening a dozen tabs.</li>
            <li><strong>Keep track of the good ones.</strong> Use history and suggestions to remember which ideas felt right.</li>
          </ul>
        </div>

        <div class="card card-secondary">
          <h2>Features today and whats coming next</h2>
          <ul class="bullet-list">
            <li><strong>Today.</strong> One search to check common platforms like X, Instagram, YouTube, GitHub and more.</li>
            <li><strong>Today.</strong> Simple results, basic suggestions, and light history so you can keep moving.</li>
            <li><strong>Coming soon.</strong> Guided search flows that help you ask better questions about your name.</li>
            <li><strong>Later.</strong> Deeper domain, app store, and trademark-style checks for bigger launches and rebrands.</li>
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
