import { API_BASE } from '../config.js'

export function Home() {
  const el = document.createElement('div')
  el.className = 'page-home'

  el.innerHTML = `
    <section class="hero">
      <div class="container">
        <h1>Find a name for your product.</h1>
        <p class="hero-sub">Describe what you're building. We generate thousands of domain candidates and check availability — so you can pick a real name, fast.</p>
        <p class="hero-price">$25 per sweep &nbsp;·&nbsp; ~6,000 domain checks &nbsp;·&nbsp; results in under a minute</p>
      </div>
    </section>

    <section class="form-section">
      <div class="container form-card">
        <div class="form-group">
          <label for="seed">What are you building?</label>
          <textarea id="seed" placeholder="e.g. a tool that helps remote teams run better async standups" rows="3"></textarea>
          <p class="field-hint">One sentence or a few keywords. The more specific, the better the names.</p>
        </div>
        <div class="form-group">
          <label for="email">Your email</label>
          <input id="email" type="email" placeholder="you@example.com" />
          <p class="field-hint">We'll save your results at a private URL. No account needed.</p>
        </div>
        <div id="error-msg" class="error-msg hidden"></div>
        <button id="start-btn" class="btn-primary">Find available names &nbsp;→</button>
      </div>
    </section>

    <section class="how-section">
      <div class="container">
        <h2>How it works</h2>
        <div class="steps">
          <div class="step">
            <div class="step-num">1</div>
            <div>
              <strong>Describe your product</strong>
              <p>We use AI to understand your space and generate targeted naming directions.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div>
              <strong>We sweep the namespace</strong>
              <p>Thousands of domain candidates are checked against .com, .io, .ai, .co, .app, and .dev — all in under 60 seconds.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div>
              <strong>Pick your name</strong>
              <p>Available domains are ranked by length and quality. Copy the ones you like and register them.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `

  const seedEl   = el.querySelector('#seed')
  const emailEl  = el.querySelector('#email')
  const btn      = el.querySelector('#start-btn')
  const errorEl  = el.querySelector('#error-msg')

  function showError(msg) {
    errorEl.textContent = msg
    errorEl.classList.remove('hidden')
  }
  function clearError() {
    errorEl.classList.add('hidden')
  }

  btn.addEventListener('click', async () => {
    clearError()
    const seed  = seedEl.value.trim()
    const email = emailEl.value.trim()

    if (!seed)  return showError('Please describe what you\'re building.')
    if (!email) return showError('Email is required to save your results.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError('Please enter a valid email address.')

    btn.disabled    = true
    btn.textContent = 'Starting…'

    try {
      const res  = await fetch(`${API_BASE}/api/sweep/init`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ seed, email }),
      })
      const data = await res.json()

      if (!res.ok) {
        showError(data.message || 'Something went wrong. Please try again.')
        return
      }

      // Dev mode or Stripe checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else if (data.sweep_id) {
        // Dev mode — no payment required
        window.location.hash = `#/sweep/${data.sweep_id}`
      }
    } catch (err) {
      showError('Network error. Please check your connection and try again.')
    } finally {
      btn.disabled    = false
      btn.textContent = 'Find available names →'
    }
  })

  return el
}
