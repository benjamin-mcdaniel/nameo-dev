import { API_BASE } from '../config.js'

const POLL_INTERVAL_MS = 3000
const TLD_ORDER = ['.com', '.io', '.ai', '.co', '.app', '.dev']

export function Sweep({ params = {}, query = {} }) {
  const sweepId = params.id
  const el      = document.createElement('div')
  el.className  = 'page-sweep'

  if (!sweepId) {
    el.innerHTML = '<div class="container"><p class="error-msg">Invalid sweep URL.</p></div>'
    return el
  }

  el.innerHTML = `
    <div class="container">
      <div id="sweep-status">
        <div class="progress-wrap">
          <div class="progress-bar" id="progress-bar" style="width:0%"></div>
        </div>
        <p id="status-text" class="status-text">Loading sweep…</p>
      </div>
      <div id="results-wrap" class="hidden">
        <div class="results-header">
          <h2>Available domains</h2>
          <div class="tld-filters" id="tld-filters"></div>
        </div>
        <div id="results-grid" class="results-grid"></div>
        <div id="load-more-wrap" class="hidden">
          <button id="load-more-btn" class="btn-secondary">Load more</button>
        </div>
      </div>
      <div id="error-wrap" class="hidden">
        <p class="error-msg" id="error-text"></p>
        <a href="#/" class="btn-secondary">Try again</a>
      </div>
    </div>
  `

  const progressBar   = el.querySelector('#progress-bar')
  const statusText    = el.querySelector('#status-text')
  const resultsWrap   = el.querySelector('#results-wrap')
  const resultsGrid   = el.querySelector('#results-grid')
  const tldFilters    = el.querySelector('#tld-filters')
  const loadMoreWrap  = el.querySelector('#load-more-wrap')
  const loadMoreBtn   = el.querySelector('#load-more-btn')
  const errorWrap     = el.querySelector('#error-wrap')
  const errorText     = el.querySelector('#error-text')

  let pollTimer       = null
  let resultsOffset   = 0
  let currentTld      = 'all'
  let totalResults    = 0
  const RESULTS_PAGE  = 100

  // ── TLD filter buttons ─────────────────────────────────────────────────────
  function buildTldFilters() {
    const filters = [{ label: 'All', tld: 'all' }, ...TLD_ORDER.map(t => ({ label: t, tld: t }))]
    tldFilters.innerHTML = filters.map(f =>
      `<button class="tld-btn ${f.tld === currentTld ? 'active' : ''}" data-tld="${f.tld}">${f.label}</button>`
    ).join('')

    tldFilters.querySelectorAll('.tld-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTld      = btn.dataset.tld
        resultsOffset   = 0
        resultsGrid.innerHTML = ''
        tldFilters.querySelectorAll('.tld-btn').forEach(b => b.classList.toggle('active', b.dataset.tld === currentTld))
        loadResults()
      })
    })
  }

  // ── Results rendering ──────────────────────────────────────────────────────
  async function loadResults(append = false) {
    const qs = new URLSearchParams({
      status: 'available',
      limit:  RESULTS_PAGE,
      offset: resultsOffset,
    })
    if (currentTld !== 'all') qs.set('tld', currentTld)

    try {
      const res  = await fetch(`${API_BASE}/api/sweep/${sweepId}/results?${qs}`)
      const data = await res.json()
      if (!res.ok) return

      totalResults = data.total || 0
      const rows   = data.results || []

      if (!append) resultsGrid.innerHTML = ''

      if (rows.length === 0 && !append) {
        resultsGrid.innerHTML = '<p class="no-results">No available domains found yet.</p>'
      } else {
        const frag = document.createDocumentFragment()
        for (const r of rows) {
          const card = document.createElement('div')
          card.className = 'domain-card'
          card.innerHTML = `
            <span class="domain-name">${r.domain}</span>
            <a class="btn-register" href="https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(r.domain)}" target="_blank" rel="noopener">Register</a>
          `
          frag.appendChild(card)
        }
        resultsGrid.appendChild(frag)
      }

      resultsOffset += rows.length
      const hasMore  = resultsOffset < totalResults
      loadMoreWrap.classList.toggle('hidden', !hasMore)
    } catch { /* ignore */ }
  }

  // ── Polling ────────────────────────────────────────────────────────────────
  async function poll() {
    try {
      const res  = await fetch(`${API_BASE}/api/sweep/${sweepId}`)
      if (!res.ok) { stopPoll(); return }
      const data = await res.json()

      const pct = data.progress_pct || 0
      progressBar.style.width = `${pct}%`

      if (data.status === 'awaiting_payment') {
        statusText.textContent = 'Waiting for payment confirmation…'
        return
      }

      if (data.status === 'running') {
        const checked = data.checked_count || 0
        const total   = data.total_candidates || 0
        const avail   = data.available_count || 0
        statusText.textContent = total > 0
          ? `Checking ${checked.toLocaleString()} / ${total.toLocaleString()} domains — ${avail} available so far…`
          : 'Generating candidates…'
        // Show partial results while running
        if (avail > 0) {
          resultsWrap.classList.remove('hidden')
          buildTldFilters()
          await loadResults()
        }
        return
      }

      if (data.status === 'complete') {
        stopPoll()
        progressBar.style.width = '100%'
        const avail = data.available_count || 0
        statusText.textContent = `Done — ${avail.toLocaleString()} available domain${avail !== 1 ? 's' : ''} found`
        resultsWrap.classList.remove('hidden')
        buildTldFilters()
        resultsOffset = 0
        resultsGrid.innerHTML = ''
        await loadResults()
        return
      }

      if (data.status === 'error') {
        stopPoll()
        errorText.textContent = data.error_message || 'Sweep failed. Please try again.'
        errorWrap.classList.remove('hidden')
        return
      }

    } catch {
      // Network hiccup — keep polling
    }
  }

  function stopPoll() {
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = null
  }

  // Load more button
  loadMoreBtn.addEventListener('click', () => loadResults(true))

  // Cleanup when page navigates away
  el.addEventListener('disconnectedCallback', stopPoll)

  // Start polling immediately
  poll()
  pollTimer = setInterval(poll, POLL_INTERVAL_MS)

  return el
}
