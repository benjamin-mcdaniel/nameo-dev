const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

export function Home() {
  const el = document.createElement('section')
  el.className = 'page home'
  el.innerHTML = `
    <section class="hero">
      <div class="container">
        <h1>Give every product name a home.</h1>
        <p class="sub">Check names instantly, organize them into campaigns, and get ready to share with your team.</p>
        <div class="actions">
          <a class="btn btn-primary" href="#checker">Start checking a name</a>
          <a class="btn" href="#/pricing">See pricing</a>
        </div>
      </div>
    </section>

    <section class="container" id="checker">
      <div class="card">
        <h2>Search once, keep it forever</h2>
        <p class="sub">Enter a name to see availability across social platforms. Soon youll be able to save this as part of a campaign.</p>
        <form id="name-form" class="stack">
          <label for="name-input">Name</label>
          <input id="name-input" type="text" autocomplete="off" placeholder="e.g. blubrdbkpk" />
          <small id="name-help" class="hint">We automatically block unsafe or offensive names before checking.</small>
        </form>
        <div id="status-message" class="status"></div>
        <div id="results" class="results"></div>
        <div id="suggestions" class="suggestions"></div>
        <div class="actions">
          <button id="btn-save-name" class="btn">Save this name (beta)</button>
        </div>
        <div id="save-message" class="hint"></div>
        <div class="hint">
          Coming soon: save this check into a campaign, track multiple options for a launch, and share them with marketing or founders.
        </div>
      </div>
    </section>

    <section class="container features">
      <div class="feature">
        <h3>Campaigns for launches</h3>
        <p>Create a campaign for each product or project, and group all of your name ideas in one place.</p>
      </div>
      <div class="feature">
        <h3>Saved searches & results</h3>
        <p>Keep a history of which names you checked and where they were available, so you can come back later.</p>
      </div>
      <div class="feature">
        <h3>Share with your team</h3>
        <p>Share a campaign with marketing, founders, or clients so everyone can review the same set of options.</p>
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
