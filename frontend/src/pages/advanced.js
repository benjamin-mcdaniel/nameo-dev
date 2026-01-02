const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

export function Advanced() {
  const el = document.createElement('section')
  el.className = 'page advanced container'
  el.innerHTML = `
    <h1>Advanced naming workflow</h1>
    <p class="sub">Answer a few questions and we will generate a naming report with domain + social variations.</p>

    <div class="card">
      <h2>Start a new naming campaign</h2>
      <form id="advanced-form" class="stack">
        <label>
          <div><strong>What are you naming?</strong></div>
          <select id="adv-project-type">
            <option value="startup">Startup / business</option>
            <option value="app">App / product</option>
            <option value="creator">Creator / persona</option>
          </select>
        </label>

        <label>
          <div><strong>Describe the idea in plain words</strong></div>
          <input id="adv-description" type="text" autocomplete="off" placeholder="e.g. payment processing app on the phone" />
          <div class="hint">This is not the final name. It helps the report explain what we are optimizing for.</div>
        </label>

        <label>
          <div><strong>Seed name (optional)</strong></div>
          <input id="adv-seed" type="text" autocomplete="off" placeholder="e.g. Clover App" />
          <div class="hint">If provided, we will try variations like official/real/app/platform automatically (stubbed for now).</div>
        </label>

        <label>
          <div><strong>Primary surfaces</strong></div>
          <div class="hint">Choose what you care about most (stub – no enforcement yet).</div>
          <div class="actions-inline">
            <label><input type="checkbox" id="adv-surface-domain" checked /> Domain</label>
            <label><input type="checkbox" id="adv-surface-x" checked /> X</label>
            <label><input type="checkbox" id="adv-surface-ig" checked /> Instagram</label>
            <label><input type="checkbox" id="adv-surface-fb" /> Facebook</label>
            <label><input type="checkbox" id="adv-surface-yt" /> YouTube</label>
          </div>
        </label>

        <div class="actions-inline">
          <button class="btn btn-primary" type="submit">Create report</button>
          <a class="btn" href="#/search">Use basic search instead</a>
        </div>

        <div id="advanced-status" class="status"></div>
      </form>
    </div>

    <p class="hint">This is a stub workflow. Next: real generation, real checks, saving campaigns, exporting final reports.</p>
  `

  attachLogic(el)
  return el
}

function attachLogic(root) {
  const form = root.querySelector('#advanced-form')
  const statusEl = root.querySelector('#advanced-status')
  const typeEl = root.querySelector('#adv-project-type')
  const descriptionEl = root.querySelector('#adv-description')
  const seedEl = root.querySelector('#adv-seed')

  if (!form || !statusEl || !typeEl || !descriptionEl || !seedEl) return

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

    const res = await fetch(url, { ...options, headers })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const payload = {
      project_type: (typeEl.value || '').trim(),
      description: (descriptionEl.value || '').trim(),
      seed: (seedEl.value || '').trim(),
      surfaces: {
        domain: !!root.querySelector('#adv-surface-domain')?.checked,
        x: !!root.querySelector('#adv-surface-x')?.checked,
        instagram: !!root.querySelector('#adv-surface-ig')?.checked,
        facebook: !!root.querySelector('#adv-surface-fb')?.checked,
        youtube: !!root.querySelector('#adv-surface-yt')?.checked,
      },
    }

    setStatus('Creating report…', 'info')

    // Minimal persistence strategy:
    // - If backend endpoints exist, use them.
    // - Otherwise fall back to localStorage so the UI still works in dev.
    let created = null

    try {
      const resp = await apiFetch('/api/advanced-reports', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (resp.ok && resp.data && resp.data.id) {
        created = resp.data
      }
    } catch {
      // ignore
    }

    if (!created) {
      try {
        const id = crypto.randomUUID()
        const now = Date.now()
        const report = { id, created_at: now, ...payload, stub: true }
        localStorage.setItem(`nameo_advanced_report_${id}`, JSON.stringify(report))
        created = { id, local_only: true }
      } catch {
        setStatus('Unable to create report right now.', 'error')
        return
      }
    }

    setStatus('')
    window.location.hash = `#/advanced-report?id=${encodeURIComponent(created.id)}`
  })
}
