const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

const SERVICE_URL_TEMPLATES = {
  x: 'https://x.com/{name}',
  instagram: 'https://www.instagram.com/{name}/',
  facebook: 'https://www.facebook.com/{name}',
  youtube: 'https://www.youtube.com/@{name}',
  tiktok: 'https://www.tiktok.com/@{name}',
  pinterest: 'https://www.pinterest.com/{name}/',
  linkedin: 'https://www.linkedin.com/in/{name}/',
  github: 'https://github.com/{name}',
  reddit: 'https://www.reddit.com/user/{name}',
  medium: 'https://medium.com/@{name}',
  twitch: 'https://www.twitch.tv/{name}',
  producthunt: 'https://www.producthunt.com/@{name}',
  substack: 'https://{name}.substack.com',
}

export function AdvancedReport() {
  const el = document.createElement('section')
  el.className = 'page advanced-report container'
  el.innerHTML = `
    <h1>Advanced report</h1>
    <p class="sub">This report is stubbed. It is meant to show the structure of multi-name + variation guidance.</p>

    <div id="report-status" class="status">Loading report…</div>
    <div id="report-root"></div>

    <div class="actions-inline" style="margin-top: 16px;">
      <a class="btn" href="#/advanced">Run another advanced search</a>
      <a class="btn" href="#/search">Run a basic search</a>
    </div>
  `

  attachLogic(el)
  return el
}

function attachLogic(root) {
  const statusEl = root.querySelector('#report-status')
  const reportRoot = root.querySelector('#report-root')
  if (!statusEl || !reportRoot) return

  function getServiceUrl(serviceId, name) {
    const tpl = SERVICE_URL_TEMPLATES[serviceId]
    if (!tpl) return ''
    const safeName = encodeURIComponent(String(name || '').trim())
    if (!safeName) return ''
    return tpl.replace('{name}', safeName)
  }

  function statusRank(status) {
    switch (status) {
      case 'available':
        return 0
      case 'taken':
        return 1
      case 'unknown':
        return 2
      case 'coming_soon':
        return 3
      default:
        return 9
    }
  }

  function setStatus(message, type = '') {
    statusEl.textContent = message || ''
    statusEl.className = 'status' + (type ? ` status-${type}` : '')
  }

  function getQueryParam(key) {
    try {
      const hash = window.location.hash || ''
      const qIndex = hash.indexOf('?')
      if (qIndex === -1) return ''
      const qs = hash.slice(qIndex + 1)
      const params = new URLSearchParams(qs)
      return params.get(key) || ''
    } catch {
      return ''
    }
  }

  async function apiFetch(path, options = {}) {
    let url = path
    try {
      url = new URL(path, API_BASE).toString()
    } catch {
      url = path
    }

    const headers = new Headers(options.headers || {})
    headers.set('Content-Type', 'application/json')

    try {
      const { getAccessToken } = await import('../auth/client.js')
      const token = await getAccessToken()
      if (token) headers.set('Authorization', `Bearer ${token}`)
    } catch {
      // ignore; will fall back to local-only behavior
    }

    const res = await fetch(url, { ...options, headers })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data }
  }

  function normalizeSeedToBase(seed) {
    const raw = (seed || '').trim()
    if (!raw) return ''
    return raw.toLowerCase().replace(/[^a-z0-9]+/g, '')
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  function renderGuidedReport(report) {
    const seed = (report && report.seed) || ''
    const seeds = Array.isArray(report?.seeds) ? report.seeds : []
    const prefixes = Array.isArray(report?.prefixes) ? report.prefixes : []
    const suffixes = Array.isArray(report?.suffixes) ? report.suffixes : []
    const candidates = Array.isArray(report?.candidates) ? report.candidates : []

    if (!candidates.length) {
      reportRoot.innerHTML = `
        <div class="card">
          <h2>Advanced search</h2>
          <p class="hint">No candidates found in this report.</p>
        </div>
      `
      return
    }

    const header = `
      <div class="card">
        <h2>Advanced search inputs</h2>
        <div class="hint"><strong>Seeds:</strong> ${escapeHtml(seeds.join(', ') || seed || '—')}</div>
        <div class="hint"><strong>Prefixes:</strong> ${escapeHtml(prefixes.join(', ') || '—')}</div>
        <div class="hint"><strong>Suffixes:</strong> ${escapeHtml(suffixes.join(', ') || '—')}</div>
      </div>
    `

    const rows = candidates
      .map((c, idx) => {
        const name = (c && c.name) || ''
        const results = Array.isArray(c?.results) ? c.results : []
        const available = Number(c?.score?.available || 0)
        const total = Number(c?.score?.total || 0)
        const status = c?.status || 'partial'

        const serviceRows = results
          .filter((r) => {
            const serviceId = r?.service || ''
            if (serviceId === 'behance') return false
            if (serviceId === 'dribbble') return false
            return true
          })
          .map((r) => {
            const serviceId = r?.service || ''
            const label = escapeHtml(r?.label || serviceId || 'Service')
            const s = r?.status || 'unknown'
            const url = getServiceUrl(serviceId, name)

            const statusCell = (() => {
              if (s === 'coming_soon') return 'coming soon'
              if (s === 'unknown') {
                return url
                  ? `<a href="${url}" target="_blank" rel="noopener">Click to check</a>`
                  : 'Click to check'
              }
              return escapeHtml(s)
            })()

            const serviceCell = url
              ? `<a href="${url}" target="_blank" rel="noopener">${label}</a>`
              : label

            return { labelText: String(r?.label || serviceId || ''), status: s, html: `<tr><td>${serviceCell}</td><td class="result-${s}">${statusCell}</td></tr>` }
          })
          .sort((a, b) => {
            const byStatus = statusRank(a.status) - statusRank(b.status)
            if (byStatus !== 0) return byStatus
            return (a.labelText || '').localeCompare(b.labelText || '')
          })
          .map((row) => row.html)
          .join('')

        const ratioText = total ? `${available}/${total} available` : '—'

        return `
          <tr class="adv-row">
            <td class="adv-rank">${idx + 1}</td>
            <td class="adv-name">
              <div class="adv-name-row">
                <span class="adv-name-text">${escapeHtml(name)}</span>
                <span class="adv-status adv-status-${status}">${escapeHtml(status)}</span>
                <span class="adv-availability">${escapeHtml(ratioText)}</span>
              </div>
            </td>
            <td class="adv-details"><button type="button" class="adv-view">View</button></td>
          </tr>
          <tr class="adv-row-details" hidden>
            <td colspan="3">
              <table class="results-table adv-breakdown">
                <thead>
                  <tr><th>Service</th><th>Status</th></tr>
                </thead>
                <tbody>
                  ${serviceRows || '<tr><td colspan="2" class="hint">No results.</td></tr>'}
                </tbody>
              </table>
            </td>
          </tr>
        `
      })
      .join('')

    reportRoot.innerHTML = `
      ${header}
      <h2 style="margin-top: 18px;">Ranked candidates</h2>
      <div class="adv-table-wrap">
        <table class="results-table adv-candidates-table">
          <thead>
            <tr>
              <th style="width: 56px;">#</th>
              <th>Candidate</th>
              <th class="adv-details-col">Details</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `

    const table = reportRoot.querySelector('.adv-candidates-table')
    if (table) {
      table.addEventListener('click', (e) => {
        const target = e.target
        if (target && target.closest && target.closest('table.adv-breakdown')) return
        const row = target && target.closest ? target.closest('tr.adv-row') : null
        if (!row) return

        const detailsRow = row.nextElementSibling
        if (!detailsRow || !detailsRow.classList.contains('adv-row-details')) return

        const open = !detailsRow.hidden
        detailsRow.hidden = open
        row.classList.toggle('adv-row-open', !open)
      })
    }
  }

  function buildStubCandidates(seed) {
    const base = normalizeSeedToBase(seed)
    const fallback = base || 'cloverapp'

    const options = [fallback]
    if (fallback === 'cloverapp') {
      options.push('leafapp')
      options.push('treeapp')
    } else {
      options.push(`${fallback}hq`)
      options.push(`${fallback}app`)
    }

    return options.slice(0, 3)
  }

  function buildHandleVariants(base) {
    const core = normalizeSeedToBase(base)
    if (!core) return []

    const variants = new Set([
      core,
      `official${core}`,
      `${core}official`,
      `real${core}`,
      `${core}real`,
      `${core}app`,
      `${core}platform`,
      `get${core}`,
    ])

    return Array.from(variants)
  }

  function pickBestVariant(variants) {
    if (!variants.length) return ''
    // Stub scoring: prefer "official" prefix if present.
    const official = variants.find((v) => v.startsWith('official'))
    return official || variants[0]
  }

  function renderReport(report) {
    if (report && report.type === 'guided_advanced_search') {
      renderGuidedReport(report)
      return
    }

    const seed = (report && report.seed) || ''
    const description = (report && report.description) || ''
    const projectType = (report && report.project_type) || ''

    const candidates = buildStubCandidates(seed)

    const cards = candidates
      .map((name) => {
        const domain = `${name}.com`
        const variants = buildHandleVariants(name)
        const best = pickBestVariant(variants)

        // Stubbed availability (intentionally fake):
        // - "official" variant is "available" for socials
        // - domain is "available" only for the first candidate
        const domainStatus = name === candidates[0] ? 'available' : 'taken'

        const socialRows = variants
          .slice(0, 6)
          .map((handle) => {
            const status = handle === best ? 'available' : 'taken'
            return `
              <tr>
                <td><code>${handle}</code></td>
                <td class="result-${status}">${status}</td>
                <td class="hint">Suggested for alignment</td>
              </tr>
            `
          })
          .join('')

        const summary = `
          <p class="hint">
            You could use <strong>${domain}</strong>, but to align socials you may need <strong>${best}</strong> on X/Instagram.
          </p>
        `

        return `
          <div class="card" style="margin-top: 12px;">
            <h2>${name}</h2>
            <div class="hint">Domain: <strong>${domain}</strong> — <span class="result-${domainStatus}">${domainStatus}</span></div>
            ${summary}

            <h3 style="margin-top: 14px;">Social handle variations (stub)</h3>
            <table class="results-table">
              <thead>
                <tr>
                  <th>Handle</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${socialRows}
              </tbody>
            </table>
          </div>
        `
      })
      .join('')

    reportRoot.innerHTML = `
      <div class="card">
        <h2>Campaign inputs</h2>
        <div class="hint"><strong>Type:</strong> ${projectType || '—'}</div>
        <div class="hint"><strong>Description:</strong> ${description || '—'}</div>
        <div class="hint"><strong>Seed:</strong> ${seed || '—'}</div>
      </div>

      <h2 style="margin-top: 18px;">Candidate names</h2>
      ${cards}

      <div class="hint" style="margin-top: 18px;">
        Next: replace stub statuses with real domain + social checks, add export/share, and allow iterating on candidates.
      </div>
    `
  }

  async function load() {
    const id = getQueryParam('id')
    if (!id) {
      setStatus('Missing report id.', 'error')
      reportRoot.innerHTML = ''
      return
    }

    try {
      const resp = await apiFetch(`/api/advanced-reports/${encodeURIComponent(id)}`)
      if (resp.ok && resp.data && resp.data.report) {
        setStatus('')
        renderReport(resp.data.report)
        return
      }
      if (resp.status === 401) {
        setStatus('Login required to view advanced reports.', 'error')
        reportRoot.innerHTML = ''
        return
      }
    } catch {
      // ignore
    }

    setStatus('Report not found.', 'error')
    reportRoot.innerHTML = ''
  }

  load()
}
