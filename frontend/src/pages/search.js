const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

export function Search() {
  const el = document.createElement('section')
  el.className = 'page search container'
  el.innerHTML = `
    <h1 class="search-title">Search names across platforms</h1>
    <div class="search-terms-banner" id="search-terms-banner">
      <span>Please read our <a href="#/terms">terms and conditions</a> before using the search.</span>
      <button type="button" class="banner-close" aria-label="Dismiss notice">&times;</button>
    </div>
    <div class="search-layout">
      <main class="search-main">
        <div class="search-main-inner">
          <aside class="search-actions-col">
            <button id="btn-favorite" class="btn fav-button">★ <span>Add to favorites</span></button>
            <div id="search-meta-message" class="hint"></div>
          </aside>

          <section class="search-results-panel">
            <form id="search-form" class="search-input-row">
              <input id="search-input" type="text" autocomplete="off" placeholder="Search a name across platforms" />
              <button id="btn-run-search" class="btn btn-primary" type="submit">Search</button>
            </form>
            <div id="search-status" class="status"></div>
            <section class="search-results-block">
              <div id="search-results" class="results"></div>
              <div id="search-suggestions" class="suggestions"></div>
            </section>
          </section>
        </div>
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
  const termsBannerEl = root.querySelector('#search-terms-banner')
  const termsBannerClose = termsBannerEl?.querySelector('.banner-close')
  const input = root.querySelector('#search-input')
  const statusEl = root.querySelector('#search-status')
  const resultsEl = root.querySelector('#search-results')
  const suggestionsEl = root.querySelector('#search-suggestions')
  const runBtn = root.querySelector('#btn-run-search')
  const favBtn = root.querySelector('#btn-favorite')
  const metaMessageEl = root.querySelector('#search-meta-message')
  const historyEl = root.querySelector('#search-history')
  const form = root.querySelector('#search-form')

  if (!input || !statusEl || !resultsEl || !suggestionsEl || !runBtn || !favBtn || !metaMessageEl || !historyEl || !form) return

  if (termsBannerEl && termsBannerClose) {
    termsBannerClose.addEventListener('click', () => {
      termsBannerEl.style.display = 'none'
    })
  }

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

  form.addEventListener('submit', (e) => {
    e.preventDefault()
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

  renderHistory()
}
