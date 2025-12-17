export function Home() {
  const el = document.createElement('section')
  el.className = 'page home'
  el.innerHTML = `
    <section class="hero">
      <div class="container">
        <h1>Name your product in minutes.</h1>
        <p class="sub">A minimalist naming tool for founders and indie hackers.</p>
        <div class="actions">
          <a class="btn" href="#/pricing">See Pricing</a>
        </div>
      </div>
    </section>

    <section class="container" id="checker">
      <div class="card">
        <h2>Check name availability</h2>
        <p class="sub">Enter a name to see availability across social platforms.</p>
        <form id="name-form" class="stack">
          <label for="name-input">Name</label>
          <input id="name-input" type="text" autocomplete="off" placeholder="e.g. cloaky" />
          <small id="name-help" class="hint">We automatically block unsafe or offensive names before checking.</small>
        </form>
        <div id="status-message" class="status"></div>
        <div id="results" class="results"></div>
        <div id="suggestions" class="suggestions"></div>
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

  if (!input || !statusEl || !resultsEl || !suggestionsEl) return

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
      const checkResp = await fetchJson(`/api/check?name=${encodeURIComponent(name)}`)

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

      const suggResp = await fetchJson(`/api/suggestions?name=${encodeURIComponent(name)}`)
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
}
