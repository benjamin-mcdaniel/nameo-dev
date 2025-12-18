const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

export function Search() {
  const el = document.createElement('section')
  el.className = 'page search container'
  el.innerHTML = `
    <h1 class="search-title">Search names across platforms</h1>
    <div class="search-layout">
      <main class="search-main">
        <section class="search-panel">
          <h2>Search</h2>
          <form id="search-form" class="stack">
            <label for="search-input">Name</label>
            <input id="search-input" type="text" autocomplete="off" placeholder="e.g. blubrdbkpk" />
            <small class="hint">We block unsafe or offensive names before checking.</small>
          </form>
          <div id="search-status" class="status"></div>
          <div class="search-actions">
            <button id="btn-run-search" class="btn btn-primary">Run search</button>
          </div>
          <div class="search-meta">
            <button id="btn-favorite" class="btn">Add to favorites</button>
            <button id="btn-add-campaign" class="btn">Add to campaign</button>
            <div id="search-meta-message" class="hint"></div>
          </div>
        </section>

        <section class="search-results-block">
          <div id="search-results" class="results"></div>
          <div id="search-suggestions" class="suggestions"></div>
        </section>
      </main>

      <aside class="search-side search-side-right">
        <h2>Recent searches</h2>
        <div id="search-history" class="search-history"></div>
      </aside>
    </div>
  `

  attachSearchLogic(el)
  return el
}

function attachSearchLogic(root) {
  const input = root.querySelector('#search-input')
  const statusEl = root.querySelector('#search-status')
  const resultsEl = root.querySelector('#search-results')
  const suggestionsEl = root.querySelector('#search-suggestions')
  const runBtn = root.querySelector('#btn-run-search')
  const favBtn = root.querySelector('#btn-favorite')
  const addCampaignBtn = root.querySelector('#btn-add-campaign')
  const metaMessageEl = root.querySelector('#search-meta-message')
  const historyEl = root.querySelector('#search-history')

  if (!input || !statusEl || !resultsEl || !suggestionsEl || !runBtn || !favBtn || !addCampaignBtn || !metaMessageEl || !historyEl) return

  let currentController = null

  function setStatus(message, type = '') {
    statusEl.textContent = message || ''
    statusEl.className = 'status' + (type ? ` status-${type}` : '')
  }

  function classifySearch(results) {
    if (!Array.isArray(results) || results.length === 0) return 'partial'
    const statuses = results.map((r) => r.status || 'unknown')
    const allAvailable = statuses.every((s) => s === 'available')
    const anyAvailable = statuses.some((s) => s === 'available')
    const anyTaken = statuses.some((s) => s === 'taken')
    if (allAvailable) return 'full'
    if (anyAvailable && anyTaken) return 'partial'
    if (anyTaken && !anyAvailable) return 'taken'
    return 'partial'
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem('nameo_search_history')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  function saveHistory(items) {
    try {
      localStorage.setItem('nameo_search_history', JSON.stringify(items.slice(0, 50)))
    } catch {
      // ignore
    }
  }

  function addToHistory(name, status) {
    const trimmed = (name || '').trim()
    if (!trimmed) return
    const items = loadHistory().filter((i) => i.name !== trimmed)
    items.unshift({ name: trimmed, status, ts: Date.now() })
    saveHistory(items)
    renderHistory()
  }

  function renderHistory() {
    const items = loadHistory()
    if (!items.length) {
      historyEl.innerHTML = '<p class="hint">No searches yet.</p>'
      return
    }
    const html = items
      .map((item) => {
        const statusClass = `chip-status-${item.status}`
        return `
          <button class="history-item" data-name="${item.name}">
            <span class="history-name">${item.name}</span>
            <span class="history-status ${statusClass}">${item.status}</span>
          </button>
        `
      })
      .join('')
    historyEl.innerHTML = html

    historyEl.querySelectorAll('.history-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name') || ''
        input.value = name
        runSearch(name)
      })
    })
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
      <h2>Results</h2>
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
    if (currentController) currentController.abort()
    currentController = new AbortController()
    const res = await fetch(path, { signal: currentController.signal })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data }
  }

  async function runSearch(name) {
    const trimmed = (name || '').trim()
    if (!trimmed) {
      setStatus('')
      resultsEl.innerHTML = ''
      suggestionsEl.innerHTML = ''
      return
    }

    setStatus('Checking availability…', 'info')
    resultsEl.innerHTML = ''
    suggestionsEl.innerHTML = ''

    try {
      const checkResp = await fetchJson(`${API_BASE}/api/check?name=${encodeURIComponent(trimmed)}`)
      if (!checkResp.ok) {
        if (checkResp.status === 400 && checkResp.data && checkResp.data.status === 'unsafe') {
          setStatus(checkResp.data.message || 'Name is not allowed.', 'error')
        } else {
          setStatus('Unable to check name right now.', 'error')
        }
        return
      }

      setStatus('')
      renderResults(checkResp.data)
      const searchStatus = classifySearch(checkResp.data.results)
      addToHistory(trimmed, searchStatus)

      const suggResp = await fetchJson(`${API_BASE}/api/suggestions?name=${encodeURIComponent(trimmed)}`)
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

  async function apiFetchWithAuth(path, options = {}) {
    const headers = new Headers(options.headers || {})
    headers.set('Content-Type', 'application/json')
    try {
      const { getAccessToken } = await import('../auth/client.js')
      const token = await getAccessToken()
      if (token) headers.set('Authorization', `Bearer ${token}`)
    } catch {
      // ignore
    }
    const res = await fetch(path, { ...options, headers })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data }
  }

  runBtn.addEventListener('click', () => {
    runSearch(input.value)
  })

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      runSearch(input.value)
    }
  })

  favBtn.addEventListener('click', () => {
    const name = (input.value || '').trim()
    if (!name) {
      metaMessageEl.textContent = 'Type a name first before adding to favorites.'
      return
    }
    try {
      const raw = localStorage.getItem('nameo_favorites')
      const list = raw ? JSON.parse(raw) : []
      if (!list.includes(name)) list.push(name)
      localStorage.setItem('nameo_favorites', JSON.stringify(list))
      metaMessageEl.textContent = 'Added to favorites.'
    } catch {
      metaMessageEl.textContent = 'Could not save favorite.'
    }
  })

  addCampaignBtn.addEventListener('click', async () => {
    const name = (input.value || '').trim()
    if (!name) {
      metaMessageEl.textContent = 'Type a name first before adding to a campaign.'
      return
    }

    metaMessageEl.textContent = 'Adding to campaign…'

    try {
      const listResp = await apiFetchWithAuth('/api/campaigns')
      if (listResp.status === 401) {
        metaMessageEl.textContent = 'Login is required to use campaigns. Use the Login page first.'
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
          body: JSON.stringify({ name: 'My first campaign', description: 'Default campaign created from Search page.' }),
        })
        if (!createResp.ok) {
          metaMessageEl.textContent = 'Unable to create a campaign. Try again later.'
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
          metaMessageEl.textContent = 'Login is required to use campaigns. Use the Login page first.'
        } else {
          metaMessageEl.textContent = 'Unable to add to campaign right now.'
        }
        return
      }

      metaMessageEl.textContent = 'Added to your campaign.'
    } catch (err) {
      metaMessageEl.textContent = 'An error occurred while adding to campaign.'
    }
  })

  renderHistory()
}
