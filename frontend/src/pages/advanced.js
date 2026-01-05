const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

export function Advanced() {
  const el = document.createElement('section')
  el.className = 'page advanced container'
  el.innerHTML = `
    <h1>Advanced search</h1>
    <p class="sub">Guided search that generates multiple name options and shows which candidates are the most open across platforms.</p>

    <div class="card">
      <h2>Generate candidates</h2>
      <form id="advanced-form" class="stack">
        <label>
          <div><strong>Seed word or phrase</strong></div>
          <input id="adv-seed" type="text" autocomplete="off" placeholder="e.g. iron" />
          <div class="hint">We will generate 20–30 candidates based on your selection below.</div>
        </label>

        <label>
          <div><strong>What are you naming?</strong></div>
          <div class="hint">Select one or multiple categories.</div>
          <div class="actions-inline">
            <label><input type="checkbox" id="adv-cat-identity" checked /> Personal identity</label>
            <label><input type="checkbox" id="adv-cat-product" checked /> Product</label>
            <label><input type="checkbox" id="adv-cat-service" checked /> Service</label>
          </div>
        </label>

        <div class="actions-inline">
          <button class="btn btn-primary" type="submit">Run advanced search</button>
          <a class="btn" href="#/search">Back to basic search</a>
        </div>

        <div id="advanced-status" class="status"></div>
      </form>
    </div>
  `

  attachLogic(el)
  return el
}

function attachLogic(root) {
  const form = root.querySelector('#advanced-form')
  const statusEl = root.querySelector('#advanced-status')
  const seedEl = root.querySelector('#adv-seed')
  const catIdentityEl = root.querySelector('#adv-cat-identity')
  const catProductEl = root.querySelector('#adv-cat-product')
  const catServiceEl = root.querySelector('#adv-cat-service')

  if (!form || !statusEl || !seedEl) return

  function setStatus(message, type = '') {
    statusEl.textContent = message || ''
    statusEl.className = 'status' + (type ? ` status-${type}` : '')
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
      // ignore; save will fail for logged-out users
    }

    const res = await fetch(url, { ...options, headers })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data }
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

  try {
    const seedFromQuery = getQueryParam('seed')
    if (seedFromQuery && !(seedEl.value || '').trim()) {
      seedEl.value = seedFromQuery
    }
  } catch {
    // ignore
  }

  function normalizeSeedToBase(seed) {
    const raw = (seed || '').trim()
    if (!raw) return ''
    return raw
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]+/g, '')
  }

  function uniqueLimit(list, limit) {
    const out = []
    const seen = new Set()
    for (const item of list) {
      const v = (item || '').trim()
      if (!v) continue
      if (seen.has(v)) continue
      seen.add(v)
      out.push(v)
      if (out.length >= limit) break
    }
    return out
  }

  function buildCandidates(seed, categories) {
    const base = normalizeSeedToBase(seed)
    const rootName = base || ''
    if (!rootName) return []

    const candidates = []

    const identity = [
      rootName,
      `the${rootName}`,
      `real${rootName}`,
      `its${rootName}`,
      `${rootName}official`,
      `${rootName}hq`,
      `${rootName}live`,
      `${rootName}media`,
    ]

    const product = [
      rootName,
      `${rootName}app`,
      `get${rootName}`,
      `try${rootName}`,
      `${rootName}go`,
      `${rootName}ai`,
      `${rootName}labs`,
      `${rootName}studio`,
      `${rootName}tools`,
    ]

    const service = [
      rootName,
      `${rootName}service`,
      `${rootName}co`,
      `${rootName}works`,
      `${rootName}group`,
      `${rootName}partners`,
      `${rootName}solutions`,
      `${rootName}systems`,
      `${rootName}agency`,
    ]

    if (categories.includes('identity')) candidates.push(...identity)
    if (categories.includes('product')) candidates.push(...product)
    if (categories.includes('service')) candidates.push(...service)

    const trimmed = uniqueLimit(candidates, 30)

    // Add some lightweight compound variants if we still need more.
    if (trimmed.length < 20) {
      const extra = [
        `${rootName}plus`,
        `${rootName}hub`,
        `${rootName}world`,
        `${rootName}base`,
        `${rootName}zone`,
        `join${rootName}`,
      ]
      return uniqueLimit([...trimmed, ...extra], 30)
    }

    return trimmed
  }

  function scoreResults(results) {
    if (!Array.isArray(results)) return { available: 0, total: 0, ratio: 0 }
    const total = results.length
    const available = results.filter((r) => r && r.status === 'available').length
    const ratio = total ? available / total : 0
    return { available, total, ratio }
  }

  function classifyCandidate(results) {
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const seed = (seedEl.value || '').trim()
    const categories = []
    if (catIdentityEl?.checked) categories.push('identity')
    if (catProductEl?.checked) categories.push('product')
    if (catServiceEl?.checked) categories.push('service')

    if (!seed) {
      setStatus('Type a seed name first.', 'error')
      return
    }

    if (!categories.length) {
      setStatus('Select at least one category.', 'error')
      return
    }

    const candidates = buildCandidates(seed, categories)
    if (!candidates.length) {
      setStatus('Could not generate candidates.', 'error')
      return
    }

    setStatus(`Checking ${candidates.length} candidates…`, 'info')

    const checked = []
    for (let i = 0; i < candidates.length; i += 1) {
      const name = candidates[i]
      setStatus(`Checking ${i + 1}/${candidates.length}: ${name}`, 'info')
      try {
        const resp = await apiFetch(`/api/check?name=${encodeURIComponent(name)}`, {
          method: 'GET',
        })
        const results = resp.ok && resp.data && Array.isArray(resp.data.results) ? resp.data.results : []
        const score = scoreResults(results)
        checked.push({
          name,
          results,
          score,
          status: classifyCandidate(results),
        })
      } catch {
        checked.push({
          name,
          results: [],
          score: { available: 0, total: 0, ratio: 0 },
          status: 'partial',
        })
      }
    }

    checked.sort((a, b) => {
      const ar = a?.score?.ratio || 0
      const br = b?.score?.ratio || 0
      if (br !== ar) return br - ar
      const aa = a?.score?.available || 0
      const ba = b?.score?.available || 0
      if (ba !== aa) return ba - aa
      return (a.name || '').localeCompare(b.name || '')
    })

    const report = {
      type: 'guided_advanced_search',
      seed,
      categories,
      candidates: checked,
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
    }

    setStatus('Saving report…', 'info')

    let created = null
    try {
      const resp = await apiFetch('/api/advanced-reports', {
        method: 'POST',
        body: JSON.stringify({ report_json: report }),
      })
      if (resp.ok && resp.data && resp.data.id) {
        created = resp.data
      } else if (resp.status === 401) {
        setStatus('Login required to save advanced searches.', 'error')
        return
      } else {
        const err = (resp.data && (resp.data.error || resp.data.message)) || ''
        const detail = err ? ` (${err})` : ''
        setStatus(`Unable to save report right now. (HTTP ${resp.status})${detail}`, 'error')
        return
      }
    } catch {
      // ignore
    }

    if (!created) {
      setStatus('Unable to save report right now.', 'error')
      return
    }

    setStatus('')
    window.location.hash = `#/advanced-report?id=${encodeURIComponent(created.id)}`
  })
}
