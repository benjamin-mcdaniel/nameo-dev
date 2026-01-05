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
          <input id="adv-seed" type="text" autocomplete="off" placeholder="e.g. iron, mountain" />
          <div class="hint">Comma separated. We will generate up to 30 candidates based on your options below.</div>
        </label>

        <label>
          <div><strong>Prefixes</strong></div>
          <div class="hint">Optional. Applies before each seed.</div>
          <div class="actions-inline">
            <label><input type="checkbox" id="adv-pre-the" checked /> the</label>
            <label><input type="checkbox" id="adv-pre-real" checked /> real</label>
            <label><input type="checkbox" id="adv-pre-its" checked /> its</label>
            <label><input type="checkbox" id="adv-pre-get" checked /> get</label>
            <label><input type="checkbox" id="adv-pre-try" /> try</label>
            <label><input type="checkbox" id="adv-pre-join" /> join</label>
          </div>
        </label>

        <label>
          <div><strong>Suffixes</strong></div>
          <div class="hint">Optional. Applies after each seed.</div>
          <div class="actions-inline">
            <label><input type="checkbox" id="adv-suf-app" checked /> app</label>
            <label><input type="checkbox" id="adv-suf-official" checked /> official</label>
            <label><input type="checkbox" id="adv-suf-hq" checked /> hq</label>
            <label><input type="checkbox" id="adv-suf-ai" /> ai</label>
            <label><input type="checkbox" id="adv-suf-labs" /> labs</label>
            <label><input type="checkbox" id="adv-suf-studio" /> studio</label>
            <label><input type="checkbox" id="adv-suf-tools" /> tools</label>
            <label><input type="checkbox" id="adv-suf-co" /> co</label>
            <label><input type="checkbox" id="adv-suf-service" /> service</label>
            <label><input type="checkbox" id="adv-suf-agency" /> agency</label>
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
  const prefixEls = {
    the: root.querySelector('#adv-pre-the'),
    real: root.querySelector('#adv-pre-real'),
    its: root.querySelector('#adv-pre-its'),
    get: root.querySelector('#adv-pre-get'),
    try: root.querySelector('#adv-pre-try'),
    join: root.querySelector('#adv-pre-join'),
  }
  const suffixEls = {
    app: root.querySelector('#adv-suf-app'),
    official: root.querySelector('#adv-suf-official'),
    hq: root.querySelector('#adv-suf-hq'),
    ai: root.querySelector('#adv-suf-ai'),
    labs: root.querySelector('#adv-suf-labs'),
    studio: root.querySelector('#adv-suf-studio'),
    tools: root.querySelector('#adv-suf-tools'),
    co: root.querySelector('#adv-suf-co'),
    service: root.querySelector('#adv-suf-service'),
    agency: root.querySelector('#adv-suf-agency'),
  }

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

  function parseSeeds(raw) {
    const parts = String(raw || '')
      .split(',')
      .map((s) => (s || '').trim())
      .filter(Boolean)
    return uniqueLimit(parts, 12)
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

  function buildCandidates(seedList, prefixes, suffixes) {
    const seeds = Array.isArray(seedList) ? seedList : []
    const candidates = []

    const normalizedSeeds = seeds
      .map((s) => normalizeSeedToBase(s))
      .filter(Boolean)

    for (const s of normalizedSeeds) {
      candidates.push(s)

      for (const pre of prefixes) {
        candidates.push(`${pre}${s}`)
      }

      for (const suf of suffixes) {
        candidates.push(`${s}${suf}`)
      }

      for (const pre of prefixes) {
        for (const suf of suffixes) {
          candidates.push(`${pre}${s}${suf}`)
        }
      }
    }

    return uniqueLimit(candidates, 30)
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

    const seedRaw = (seedEl.value || '').trim()
    const seeds = parseSeeds(seedRaw)

    if (!seeds.length) {
      setStatus('Type at least one seed name first.', 'error')
      return
    }

    const prefixes = Object.entries(prefixEls)
      .filter(([, el]) => !!el?.checked)
      .map(([key]) => key)

    const suffixes = Object.entries(suffixEls)
      .filter(([, el]) => !!el?.checked)
      .map(([key]) => key)

    if (!prefixes.length && !suffixes.length) {
      setStatus('Select at least one prefix or suffix option.', 'error')
      return
    }

    const candidates = buildCandidates(seeds, prefixes, suffixes)
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
      seed: seedRaw,
      prefixes,
      suffixes,
      seeds,
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
