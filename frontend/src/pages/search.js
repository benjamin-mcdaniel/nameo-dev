const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

const PLATFORM_GROUPS = [
  {
    id: 'social',
    label: 'Social & Developer',
    platforms: [
      { id: 'x',           label: 'X (Twitter)',   urlTemplate: 'https://x.com/{name}' },
      { id: 'instagram',   label: 'Instagram',     urlTemplate: 'https://www.instagram.com/{name}/' },
      { id: 'linkedin',    label: 'LinkedIn',      urlTemplate: 'https://www.linkedin.com/in/{name}/' },
      { id: 'youtube',     label: 'YouTube',       urlTemplate: 'https://www.youtube.com/@{name}' },
      { id: 'tiktok',      label: 'TikTok',        urlTemplate: 'https://www.tiktok.com/@{name}' },
      { id: 'github',      label: 'GitHub',        urlTemplate: 'https://github.com/{name}' },
      { id: 'facebook',    label: 'Facebook',      urlTemplate: 'https://www.facebook.com/{name}' },
      { id: 'reddit',      label: 'Reddit',        urlTemplate: 'https://www.reddit.com/user/{name}' },
      { id: 'medium',      label: 'Medium',        urlTemplate: 'https://medium.com/@{name}' },
      { id: 'producthunt', label: 'Product Hunt',  urlTemplate: 'https://www.producthunt.com/@{name}' },
    ],
  },
  {
    id: 'advanced',
    label: 'Domains & App Stores',
    platforms: [
      { id: 'domains_core',     label: 'Domains (.com, .io, .ai)', comingSoon: true },
      { id: 'appstore_ios',     label: 'iOS App Store',            comingSoon: true },
      { id: 'appstore_android', label: 'Google Play Store',        comingSoon: true },
      { id: 'trademarks_us',    label: 'US Trademark signals',     comingSoon: true },
    ],
  },
]

export function Search() {
  const el = document.createElement('section')
  el.className = 'page search container'

  el.innerHTML = `
    <div class="page-header">
      <div class="eyebrow">Quick Search</div>
      <h1>Name search</h1>
      <p>Check a single name across social platforms. For full launch research, <a href="#/campaigns">create a project</a>.</p>
    </div>

    <div class="search-layout">
      <div class="search-main">
        <div id="search-terms-banner" class="search-terms-banner">
          <span>By searching you agree to our <a href="#/terms">terms of service</a>.</span>
          <button type="button" class="banner-close" aria-label="Dismiss">&times;</button>
        </div>

        <form id="search-form" class="search-input-row">
          <input id="search-input" type="text" autocomplete="off" placeholder="Enter a product name\u2026" />
          <button id="btn-run-search" class="btn btn-primary" type="submit">Search</button>
        </form>

        <div id="search-status" class="status" style="margin:8px 0"></div>
        <div id="search-results"></div>
        <div id="search-suggestions"></div>
      </div>

      <aside class="search-side">
        <h2>Recent searches</h2>
        <div id="search-history"><p class="hint">Sign in to see history.</p></div>
      </aside>
    </div>

    <div id="toast" class="toast"></div>
  `

  attachSearchLogic(el)
  return el
}

function attachSearchLogic(root) {
  const bannerEl      = root.querySelector('#search-terms-banner')
  const bannerClose   = root.querySelector('.banner-close')
  const input         = root.querySelector('#search-input')
  const form          = root.querySelector('#search-form')
  const statusEl      = root.querySelector('#search-status')
  const resultsEl     = root.querySelector('#search-results')
  const suggestionsEl = root.querySelector('#search-suggestions')
  const historyEl     = root.querySelector('#search-history')
  const toastEl       = root.querySelector('#toast')

  if (!input || !statusEl || !resultsEl) return

  if (bannerClose) {
    bannerClose.addEventListener('click', () => { if (bannerEl) bannerEl.style.display = 'none' })
  }

  // Toast helper
  let toastTimer = null
  function showToast(msg) {
    if (!toastEl) return
    toastEl.textContent = msg || ''
    toastEl.classList.toggle('toast-show', !!msg)
    if (toastTimer) clearTimeout(toastTimer)
    if (msg) toastTimer = setTimeout(() => toastEl.classList.remove('toast-show'), 2000)
  }

  function setStatus(msg, type) {
    statusEl.textContent = msg || ''
    statusEl.className = 'status' + (type ? ' status-' + type : '')
  }

  // Auth helpers (lazy import so auth module is not required for anonymous use)
  async function getAuthToken() {
    try {
      const mod = await import('../auth/client.js')
      return await mod.getAccessToken()
    } catch { return null }
  }

  async function isLoggedIn() {
    try {
      const mod = await import('../auth/client.js')
      return await mod.isAuthenticated()
    } catch { return false }
  }

  // History
  async function loadAndRenderHistory() {
    if (!historyEl) return
    const loggedIn = await isLoggedIn()
    if (!loggedIn) {
      historyEl.innerHTML = '<p class="hint">Sign in to see history.</p>'
      return
    }
    try {
      const token = await getAuthToken()
      const res = await fetch(API_BASE + '/api/search-history', {
        headers: token ? { Authorization: 'Bearer ' + token } : {},
      })
      const data = await res.json().catch(() => ({}))
      const items = data.items || []
      if (!items.length) { historyEl.innerHTML = '<p class="hint">No searches yet.</p>'; return }
      historyEl.innerHTML = items.map(function(item) {
        return '<div class="history-item" data-name="' + item.name + '">' +
          '<button class="history-main" type="button">' +
          '<span class="history-name">' + item.name + '</span>' +
          '<span class="history-status chip-status-' + item.status + '">' + item.status + '</span>' +
          '</button>' +
          '<button class="history-delete" type="button" aria-label="Remove">&times;</button>' +
          '</div>'
      }).join('')
      historyEl.querySelectorAll('.history-item').forEach(function(row) {
        var name = row.getAttribute('data-name') || ''
        var mainBtn = row.querySelector('.history-main')
        var delBtn = row.querySelector('.history-delete')
        if (mainBtn) mainBtn.addEventListener('click', function() { input.value = name; runSearch(name) })
        if (delBtn) delBtn.addEventListener('click', async function() {
          var token = await getAuthToken()
          await fetch(API_BASE + '/api/search-history?name=' + encodeURIComponent(name), {
            method: 'DELETE',
            headers: token ? { Authorization: 'Bearer ' + token } : {},
          }).catch(function() {})
          loadAndRenderHistory()
        })
      })
    } catch(e) {
      historyEl.innerHTML = '<p class="hint">Could not load history.</p>'
    }
  }

  async function saveToHistory(name, status) {
    var loggedIn = await isLoggedIn()
    if (!loggedIn) return
    try {
      var token = await getAuthToken()
      await fetch(API_BASE + '/api/search-history', {
        method: 'POST',
        headers: Object.assign(
          { 'Content-Type': 'application/json' },
          token ? { Authorization: 'Bearer ' + token } : {}
        ),
        body: JSON.stringify({ name: name, status: status }),
      })
    } catch(e) { /* ignore */ }
    loadAndRenderHistory()
  }

  function classifyResults(results) {
    if (!Array.isArray(results) || !results.length) return 'partial'
    var statuses = results.map(function(r) { return r.status || 'unknown' })
    if (statuses.every(function(s) { return s === 'available' })) return 'full'
    if (statuses.every(function(s) { return s === 'taken' })) return 'taken'
    if (statuses.some(function(s) { return s === 'available' })) return 'partial'
    return 'partial'
  }

  function renderResults(data) {
    if (!data || !data.results) { resultsEl.innerHTML = ''; return }
    var name = (data.name || '').trim()
    var byId = {}
    data.results.forEach(function(r) { if (r && r.service) byId[r.service] = r })

    var groupsHtml = PLATFORM_GROUPS.map(function(group) {
      var rows = group.platforms.map(function(p) {
        if (p.comingSoon) {
          return '<tr><td>' + p.label + '</td><td class="result-coming_soon">coming soon</td><td>\u2014</td></tr>'
        }
        var backend = byId[p.id]
        var status = backend ? (backend.status || 'unknown') : 'unknown'
        var url = p.urlTemplate ? p.urlTemplate.replace('{name}', encodeURIComponent(name)) : null
        var labelCell = url
          ? '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + p.label + '</a>'
          : p.label
        return '<tr>' +
          '<td>' + labelCell + '</td>' +
          '<td class="result-' + status + '">' + status + '</td>' +
          '<td class="text-muted" style="font-size:0.8rem">' + (backend && backend.code != null ? backend.code : '\u2014') + '</td>' +
          '</tr>'
      }).join('')
      return '<div class="results-group">' +
        '<h3>' + group.label + '</h3>' +
        '<table class="results-table">' +
        '<thead><tr><th>Platform</th><th>Status</th><th>Code</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '</table></div>'
    }).join('')

    resultsEl.innerHTML = '<div style="margin-top:4px">' + groupsHtml + '</div>'
  }

  function renderSuggestions(list) {
    if (!Array.isArray(list) || !list.length) { suggestionsEl.innerHTML = ''; return }
    var items = list.map(function(s) {
      return '<li><a href="#/search?name=' + encodeURIComponent(s) + '">' + s + '</a></li>'
    }).join('')
    suggestionsEl.innerHTML = '<div class="suggestions"><h3>Suggestions</h3><ul class="suggestions-list">' + items + '</ul></div>'
  }

  var currentController = null

  async function runSearch(name) {
    var trimmed = (name || '').trim()
    if (!trimmed) { setStatus(''); resultsEl.innerHTML = ''; suggestionsEl.innerHTML = ''; return }

    try { window.location.hash = '#/search?name=' + encodeURIComponent(trimmed) } catch(e) {}

    if (currentController) currentController.abort()
    currentController = new AbortController()

    setStatus('Checking availability\u2026', 'info')
    resultsEl.innerHTML = ''
    suggestionsEl.innerHTML = ''

    try {
      var checkRes = await fetch(
        API_BASE + '/api/check?name=' + encodeURIComponent(trimmed),
        { signal: currentController.signal }
      )
      var checkData = await checkRes.json().catch(function() { return {} })

      if (!checkRes.ok) {
        var msg = (checkData && checkData.message) || 'Unable to check name right now.'
        setStatus(msg, 'error')
        return
      }

      setStatus('')
      renderResults(checkData)
      var searchStatus = classifyResults(checkData.results)
      saveToHistory(trimmed, searchStatus)

      // Suggestions — non-blocking
      fetch(API_BASE + '/api/suggestions?name=' + encodeURIComponent(trimmed))
        .then(function(r) { return r.json() })
        .then(function(d) { if (d && d.suggestions) renderSuggestions(d.suggestions) })
        .catch(function() {})
    } catch(err) {
      if (err.name === 'AbortError') return
      setStatus('An unexpected error occurred.', 'error')
    }
  }

  if (form) {
    form.addEventListener('submit', function(e) { e.preventDefault(); runSearch(input.value) })
  }

  // Pick up name from URL on load
  try {
    var hash = window.location.hash || ''
    var qIdx = hash.indexOf('?')
    if (hash.startsWith('#/search') && qIdx !== -1) {
      var urlName = new URLSearchParams(hash.slice(qIdx + 1)).get('name') || ''
      if (urlName) { input.value = urlName; runSearch(urlName) }
    }
  } catch(e) { /* ignore */ }

  loadAndRenderHistory()
}
