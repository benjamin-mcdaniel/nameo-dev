const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

// Static catalog of platforms grouped by how people typically search.
// Only a subset are actually wired to the backend today; the rest are
// shown as "coming soon" so we can design the layout ahead of time.
const PLATFORM_GROUPS = [
  {
    id: 'common',
    label: 'Common Platforms',
    tier: 'common', // included for all tiers long term
    platforms: [
      { id: 'x', label: 'X (Twitter)', supported: true, urlTemplate: 'https://x.com/{name}' },
      { id: 'instagram', label: 'Instagram', supported: true, urlTemplate: 'https://www.instagram.com/{name}/' },
      { id: 'facebook', label: 'Facebook', supported: true, urlTemplate: 'https://www.facebook.com/{name}' },
      { id: 'youtube', label: 'YouTube', supported: true, urlTemplate: 'https://www.youtube.com/@{name}' },
      { id: 'tiktok', label: 'TikTok', supported: true, urlTemplate: 'https://www.tiktok.com/@{name}' },
      { id: 'pinterest', label: 'Pinterest', supported: true, urlTemplate: 'https://www.pinterest.com/{name}/' },
      { id: 'linkedin', label: 'LinkedIn', supported: true, urlTemplate: 'https://www.linkedin.com/in/{name}/' },
      { id: 'github', label: 'GitHub', supported: true, urlTemplate: 'https://github.com/{name}' },
      { id: 'reddit', label: 'Reddit', supported: true, urlTemplate: 'https://www.reddit.com/user/{name}' },
      { id: 'medium', label: 'Medium', supported: true, urlTemplate: 'https://medium.com/@{name}' },
      // Previously niche/community concepts are folded into the common list so
      // users see everything in one place.
      { id: 'discord', label: 'Discord Servers', supported: false },
      { id: 'twitch', label: 'Twitch', supported: false, urlTemplate: 'https://www.twitch.tv/{name}' },
      { id: 'producthunt', label: 'Product Hunt', supported: false, urlTemplate: 'https://www.producthunt.com/@{name}' },
      { id: 'substack', label: 'Substack', supported: false, urlTemplate: 'https://{name}.substack.com' },
      { id: 'behance', label: 'Behance', supported: false, urlTemplate: 'https://www.behance.net/{name}' },
      { id: 'dribbble', label: 'Dribbble', supported: false, urlTemplate: 'https://dribbble.com/{name}' },
    ],
  },
  {
    id: 'advanced',
    label: 'Advanced Search',
    tier: 'advanced', // planned for Advanced membership
    platforms: [
      { id: 'domains_core', label: 'Core domains (.com, .net, .io, .co)', supported: false },
      { id: 'domains_modern', label: 'Modern domains (.app, .dev, .ai, .xyz)', supported: false },
      { id: 'appstore_ios', label: 'iOS App Store (name collisions)', supported: false },
      { id: 'appstore_android', label: 'Google Play Store (name collisions)', supported: false },
      { id: 'trademarks_us', label: 'US trademarks (basic name checks)', supported: false },
      { id: 'trademarks_eu', label: 'EU trademarks (basic name checks)', supported: false },
    ],
  },
]

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
      <section class="search-main">
        <form id="search-form" class="search-input-row">
          <input id="search-input" type="text" autocomplete="off" placeholder="Search a name across platforms" />
          <button id="btn-run-search" class="btn btn-primary" type="submit">Search</button>
          <button id="btn-favorite" class="btn fav-button" type="button">★ <span>Favorite</span></button>
        </form>
        <div id="search-status" class="status"></div>

        <div class="search-main-inner">
          <aside class="search-actions-col">
            <div id="search-meta-message" class="hint"></div>
          </aside>

          <section class="search-results-block">
            <div id="search-results" class="results"></div>
            <div id="search-suggestions" class="suggestions"></div>
          </section>
        </div>
      </section>

      <aside class="search-side search-side-right">
        <h2>Recent Searches</h2>
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

  async function apiFetchWithAuth(path, options = {}) {
    const headers = new Headers(options.headers || {})
    headers.set('Content-Type', 'application/json')
    try {
      const { getAccessToken } = await import('../auth/client.js')
      const token = await getAccessToken()
      if (token) headers.set('Authorization', `Bearer ${token}`)
    } catch {
      // ignore; will fall back to local-only behavior
    }

    const res = await fetch(path, { ...options, headers })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data }
  }

  async function loadHistory() {
    // Try to load from backend first for logged-in users.
    try {
      const resp = await apiFetchWithAuth('/api/search-history')
      if (resp.ok && Array.isArray(resp.data.items)) {
        return resp.data.items.map((item) => ({
          name: item.name,
          status: item.status,
          ts: (item.searched_at || 0) * 1000,
        }))
      }
    } catch {
      // fall through to local
    }

    try {
      const raw = localStorage.getItem('nameo_search_history')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  function saveHistoryLocally(items) {
    try {
      localStorage.setItem('nameo_search_history', JSON.stringify(items.slice(0, 50)))
    } catch {
      // ignore
    }
  }

  async function addToHistory(name, status) {
    const trimmed = (name || '').trim()
    if (!trimmed) return

    // Fire-and-forget to backend; ignore errors.
    try {
      await apiFetchWithAuth('/api/search-history', {
        method: 'POST',
        body: JSON.stringify({ name: trimmed, status }),
      })
    } catch {
      // ignore; we still maintain a local history below
    }

    // Maintain a local copy for anonymous users or offline fallback.
    const items = (await loadHistory()).filter((i) => i.name !== trimmed)
    items.unshift({ name: trimmed, status, ts: Date.now() })
    saveHistoryLocally(items)
    await renderHistory()
  }

  async function renderHistory() {
    const items = await loadHistory()
    if (!items.length) {
      historyEl.innerHTML = '<p class="hint">No searches yet.</p>'
      return
    }
    const html = items
      .map((item) => {
        const statusClass = `chip-status-${item.status}`
        return `
          <div class="history-item" data-name="${item.name}">
            <button class="history-main" type="button">
              <span class="history-name">${item.name}</span>
              <span class="history-status ${statusClass}">${item.status}</span>
            </button>
            <button class="history-delete" type="button" aria-label="Remove from history">&times;</button>
          </div>
        `
      })
      .join('')
    historyEl.innerHTML = html

    historyEl.querySelectorAll('.history-item').forEach((row) => {
      const name = row.getAttribute('data-name') || ''
      const mainBtn = row.querySelector('.history-main')
      const deleteBtn = row.querySelector('.history-delete')

      if (mainBtn) {
        mainBtn.addEventListener('click', () => {
          input.value = name
          runSearch(name)
        })
      }

      if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation()
          await deleteHistoryItem(name)
        })
      }
    })
  }

  async function deleteHistoryItem(name) {
    const trimmed = (name || '').trim()
    if (!trimmed) return

    // Best-effort delete on backend for logged-in users.
    try {
      await apiFetchWithAuth(`/api/search-history?name=${encodeURIComponent(trimmed)}`, {
        method: 'DELETE',
      })
    } catch {
      // ignore; still update local copy below
    }

    const items = await loadHistory()
    const filtered = items.filter((i) => i.name !== trimmed)
    saveHistoryLocally(filtered)
    await renderHistory()
  }

  function renderResults(data) {
    if (!data || !Array.isArray(data.results)) {
      resultsEl.innerHTML = ''
      return
    }

    const name = (data.name || '').trim()

    const byId = new Map()
    for (const r of data.results) {
      if (!r || !r.service) continue
      byId.set(r.service, r)
    }

    function renderGroup(group) {
      const rows = group.platforms
        .map((p) => {
          const backend = byId.get(p.id)
          const status = backend ? (backend.status || 'unknown') : 'coming_soon'
          const label = backend ? (backend.label || backend.service) : p.label
          const url = p.urlTemplate && name ? p.urlTemplate.replace('{name}', encodeURIComponent(name)) : null
          const history = backend && backend.history ? backend.history : 'unknown'

          const serviceCell = url
            ? `<a href="${url}" target="_blank" rel="noopener">${label}</a>`
            : label

          return `
            <tr>
              <td>${serviceCell}</td>
              <td class="result-${status}">${status === 'coming_soon' ? 'coming soon' : status}</td>
              <td>${history}</td>
            </tr>
          `
        })
        .join('')

      return `
        <div class="results-group">
          <h3>${group.label}</h3>
          <table class="results-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Status</th>
                <th>History</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `
    }

    const groupsHtml = PLATFORM_GROUPS.map(renderGroup).join('')

    resultsEl.innerHTML = `
      <h2>Results</h2>
      ${groupsHtml}
      <p class="hint">Common platforms are checked today. Niche and advanced search areas are being wired up and will show real data as they come online.</p>
    `
  }

  function renderSuggestions(list) {
    if (!Array.isArray(list) || list.length === 0) {
      suggestionsEl.innerHTML = ''
      return
    }

    const items = list
      .map((s) => `<li><a href="#/search?name=${encodeURIComponent(s)}">${s}</a></li>`)
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

    // Reflect the active search in the URL so searches can be linked/bookmarked.
    try {
      const qs = `?name=${encodeURIComponent(trimmed)}`
      window.location.hash = `#/search${qs}`
    } catch {
      // ignore URL errors
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

  // If the home page left a pending search value, pick it up and
  // execute it once when this page is first loaded.
  try {
    // First, check if there's a name in the hash (e.g. #/search?name=foo).
    const hash = window.location.hash || ''
    let initial = ''
    const qIndex = hash.indexOf('?')
    if (hash.startsWith('#/search') && qIndex !== -1) {
      const qs = hash.slice(qIndex + 1)
      const params = new URLSearchParams(qs)
      initial = params.get('name') || ''
    }

    // Fallback to a pending search from the home page if no hash param.
    if (!initial) {
      const pending = localStorage.getItem('nameo_pending_search')
      if (pending) {
        localStorage.removeItem('nameo_pending_search')
        initial = pending
      }
    }

    if (initial) {
      input.value = initial
      runSearch(initial)
    }
  } catch {
    // ignore storage errors
  }
}
