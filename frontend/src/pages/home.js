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
            <a class="btn btn-primary" href="#checker">Start checking a name</a>
            <a class="btn" href="#/pricing">See pricing</a>
          </div>
        </div>
      </div>
    </section>

    <section class="home-main" id="checker">
      <div class="container checker-grid">
        <div class="card card-primary">
          <h2>Instant availability check</h2>
          <p class="sub">Type a name once to see how it looks across major platforms.</p>
          <form id="name-form" class="stack">
            <label for="name-input">Name</label>
            <input id="name-input" type="text" autocomplete="off" placeholder="e.g. blubrdbkpk" />
            <small id="name-help" class="hint">We automatically block unsafe or offensive names before checking.</small>
          </form>
          <div id="status-message" class="status"></div>
          <div id="results" class="results"></div>
          <div id="suggestions" class="suggestions"></div>
          <div class="actions actions-inline">
            <button id="btn-save-name" class="btn">Save this name (beta)</button>
          </div>
          <div id="save-message" class="hint"></div>
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
  const input = root.querySelector('#name-input')
  const statusEl = root.querySelector('#status-message')
  const resultsEl = root.querySelector('#results')
  const suggestionsEl = root.querySelector('#suggestions')
  const saveBtn = root.querySelector('#btn-save-name')
  const saveMessageEl = root.querySelector('#save-message')

  if (!input || !statusEl || !resultsEl || !suggestionsEl || !saveBtn || !saveMessageEl) return

  let currentController = null
  let debounceId = null

  function setStatus(message, type = '') {
    statusEl.textContent = message || ''
    statusEl.className = 'status' + (type ? ` status-${type}` : '')
  }

  function renderResults(data) {
    if (!data || !Array.isArray(data.results)) {
      resultsEl.innerHTML = ''
      return
    }

    const rows = data.results
      .map((r) => {
        const status = r.status || 'unknown'
        return `
          <tr>
            <td>${r.label || r.service}</td>
            <td class="result-${status}">${status}</td>
          </tr>
        `
      })
      .join('')

    resultsEl.innerHTML = `
      <h3>Results</h3>
      <table class="results-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `
  }

  function renderSuggestions(list) {
    if (!Array.isArray(list) || list.length === 0) {
      suggestionsEl.innerHTML = ''
      return
    }

    const items = list
      .map((s) => `<li>${s}</li>`)
      .join('')

    suggestionsEl.innerHTML = `
      <h3>Suggestions</h3>
      <ul class="suggestions-list">
        ${items}
      </ul>
    `
  }

  async function fetchJson(path) {
    if (currentController) {
      currentController.abort()
    }
    currentController = new AbortController()

    const res = await fetch(path, { signal: currentController.signal })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data }
  }

  async function runChecks(name) {
    if (!name) {
      setStatus('')
      resultsEl.innerHTML = ''
      suggestionsEl.innerHTML = ''
      return
    }

    setStatus('Checking availability…', 'info')
    resultsEl.innerHTML = ''
    suggestionsEl.innerHTML = ''

    try {
      const checkResp = await fetchJson(
        `${API_BASE}/api/check?name=${encodeURIComponent(name)}`
      )

      if (!checkResp.ok) {
        if (checkResp.status === 400 && checkResp.data && checkResp.data.status === 'unsafe') {
          setStatus(checkResp.data.message || 'Name is not allowed.', 'error')
        } else {
          setStatus('Unable to check name right now.', 'error')
        }
        resultsEl.innerHTML = ''
        suggestionsEl.innerHTML = ''
        return
      }

      setStatus('', '')
      renderResults(checkResp.data)

      const suggResp = await fetchJson(
        `${API_BASE}/api/suggestions?name=${encodeURIComponent(name)}`
      )
      if (suggResp.ok && suggResp.data && Array.isArray(suggResp.data.suggestions)) {
        renderSuggestions(suggResp.data.suggestions)
      } else {
        suggestionsEl.innerHTML = ''
      }
    } catch (err) {
      if (err.name === 'AbortError') return
      setStatus('An unexpected error occurred.', 'error')
    }
  }

  function scheduleRun() {
    const value = input.value.trim()
    if (debounceId) {
      clearTimeout(debounceId)
    }
    debounceId = setTimeout(() => {
      runChecks(value)
    }, 500)
  }

  input.addEventListener('input', scheduleRun)

  async function apiFetchWithAuth(path, options = {}) {
    const headers = new Headers(options.headers || {})
    headers.set('Content-Type', 'application/json')
    // Try to attach Auth0 token if available. This is lazy-imported to
    // avoid forcing auth code on first paint.
    try {
      const { getAccessToken } = await import('../auth/client.js')
      const token = await getAccessToken()
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
    } catch (err) {
      // ignore, will fall back to anonymous user if backend allows it
    }

    const res = await fetch(path, { ...options, headers })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data }
  }

  saveBtn.addEventListener('click', async () => {
    const name = input.value.trim()
    if (!name) {
      saveMessageEl.textContent = 'Type a name first before saving.'
      return
    }

    saveMessageEl.textContent = 'Saving name…'

    try {
      // Ensure there is at least one campaign. For now, we use or create
      // a default campaign called "My first campaign".
      const listResp = await apiFetchWithAuth('/api/campaigns')
      if (listResp.status === 401) {
        saveMessageEl.textContent = 'Login is required to save names. Use the Login page first.'
        return
      }

      let campaignId = null
      const campaigns = listResp.data?.campaigns || []
      const existing = campaigns.find((c) => c.name === 'My first campaign')
      if (existing) {
        campaignId = existing.id
      } else {
        const createResp = await apiFetchWithAuth('/api/campaigns', {
          method: 'POST',
          body: JSON.stringify({ name: 'My first campaign', description: 'Default campaign created from Home page.' }),
        })
        if (!createResp.ok) {
          saveMessageEl.textContent = 'Unable to create a campaign. Try again later.'
          return
        }
        campaignId = createResp.data.id
      }

      const optionResp = await apiFetchWithAuth(`/api/campaigns/${encodeURIComponent(campaignId)}/options`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      })

      if (!optionResp.ok) {
        if (optionResp.status === 401) {
          saveMessageEl.textContent = 'Login is required to save names. Use the Login page first.'
        } else {
          saveMessageEl.textContent = 'Unable to save this name right now.'
        }
        return
      }

      saveMessageEl.textContent = 'Name saved to your campaign.'
    } catch (err) {
      saveMessageEl.textContent = 'An error occurred while saving.'
      console.error('Save name error', err)
    }
  })
}
