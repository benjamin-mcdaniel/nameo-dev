const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

export function AdvancedReport() {
  const el = document.createElement('section')
  el.className = 'page advanced-report container'
  el.innerHTML = `
    <h1>Advanced report</h1>
    <p class="sub">This report is stubbed. It is meant to show the structure of multi-name + variation guidance.</p>

    <div id="report-status" class="status">Loading report…</div>
    <div id="report-root"></div>

    <div class="actions-inline" style="margin-top: 16px;">
      <a class="btn" href="#/advanced">Start another advanced report</a>
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

    const res = await fetch(url, { ...options, headers })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data }
  }

  function normalizeSeedToBase(seed) {
    const raw = (seed || '').trim()
    if (!raw) return ''
    return raw.toLowerCase().replace(/[^a-z0-9]+/g, '')
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

    // Try backend first.
    try {
      const resp = await apiFetch(`/api/advanced-reports/${encodeURIComponent(id)}`)
      if (resp.ok && resp.data && resp.data.report) {
        setStatus('')
        renderReport(resp.data.report)
        return
      }
    } catch {
      // ignore
    }

    // Fall back to localStorage.
    try {
      const raw = localStorage.getItem(`nameo_advanced_report_${id}`)
      if (!raw) {
        setStatus('Report not found (local-only).', 'error')
        reportRoot.innerHTML = ''
        return
      }
      const report = JSON.parse(raw)
      setStatus('')
      renderReport(report)
    } catch {
      setStatus('Unable to load report.', 'error')
      reportRoot.innerHTML = ''
    }
  }

  load()
}
