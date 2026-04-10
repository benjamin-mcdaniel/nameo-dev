import { getAccessToken } from '../auth/client.js'

const API_BASE = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', 'application/json')
  try {
    const token = await getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  } catch { /* anonymous fallback */ }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

// ─── Report type definitions ──────────────────────────────────────────────────

const BRAND_IDENTITY_REPORTS = [
  {
    id: 'domain_availability',
    label: 'Domain Availability',
    icon: '🌐',
    description: 'Check .com, .io, .ai, .co, and more for your name candidates.',
    default: true,
  },
  {
    id: 'trademark',
    label: 'Trademark Check',
    icon: '⚖️',
    description: 'Screen US and EU trademark databases for potential conflicts.',
    default: true,
  },
  {
    id: 'products_for_sale',
    label: 'Products for Sale',
    icon: '🛒',
    description: 'Search Amazon, eBay, and major marketplaces for name collisions with existing products.',
    default: true,
  },
  {
    id: 'social_handles',
    label: 'Social Handles',
    icon: '📱',
    description: 'Check availability on X, Instagram, LinkedIn, YouTube, and GitHub.',
    default: false,
  },
  {
    id: 'app_store',
    label: 'App Store',
    icon: '📦',
    description: 'Check iOS App Store and Google Play for existing apps with your name.',
    default: false,
  },
]

const NAME_GENERATOR_INDUSTRIES = [
  'Technology / SaaS', 'Fintech', 'Health & Wellness', 'E-commerce',
  'Consumer Goods', 'Media & Entertainment', 'Education', 'Real Estate',
  'Food & Beverage', 'Travel', 'Professional Services', 'Other',
]

const NAME_GENERATOR_VIBES = [
  { id: 'technical', label: 'Technical', icon: '⚙️', desc: 'Smart, precise, engineering-forward' },
  { id: 'friendly', label: 'Friendly', icon: '😊', desc: 'Warm, approachable, human' },
  { id: 'premium', label: 'Premium', icon: '💎', desc: 'Elevated, exclusive, refined' },
  { id: 'playful', label: 'Playful', icon: '🎉', desc: 'Fun, energetic, memorable' },
  { id: 'minimal', label: 'Minimal', icon: '◻️', desc: 'Clean, simple, no fluff' },
  { id: 'bold', label: 'Bold', icon: '🔥', desc: 'Confident, direct, disruptive' },
]

const NAME_LENGTH_OPTIONS = [
  { id: 'short', label: 'Short', desc: '1–5 characters' },
  { id: 'medium', label: 'Medium', desc: '6–9 characters' },
  { id: 'any', label: 'Any', desc: 'No preference' },
]

// ─── State ────────────────────────────────────────────────────────────────────

function createState() {
  return {
    step: 1,            // 1: type, 2a/2b: details, 3: review
    sessionType: null,  // 'brand_identity' | 'name_generator'

    // Brand Identity fields
    sessionName: '',
    brandNames: [''],   // list of names to analyze
    selectedReports: BRAND_IDENTITY_REPORTS.filter((r) => r.default).map((r) => r.id),

    // Name Generator fields
    productDesc: '',
    industry: '',
    vibes: [],
    nameLength: 'any',
    startLetters: '',
    avoidWords: '',

    // UI
    submitting: false,
    error: '',
  }
}

// ─── Page entry point ─────────────────────────────────────────────────────────

export function NewSession() {
  const el = document.createElement('section')
  el.className = 'page new-session container'

  const state = createState()

  // If the URL contains ?prefill=NAME (linked from name candidate "Check this name →"),
  // jump straight to the brand identity flow with the name pre-populated.
  const prefill = new URLSearchParams(window.location.search).get('prefill')?.trim()
  if (prefill) {
    state.sessionType = 'brand_identity'
    state.brandNames = [prefill]
    state.step = 2
  }

  renderPage(el, state)
  return el
}

function renderPage(root, state) {
  root.innerHTML = ''

  const header = document.createElement('div')
  header.className = 'page-header'
  header.innerHTML = `
    <div class="eyebrow">New Session</div>
    <h1>${state.sessionType ? (state.sessionType === 'brand_identity' ? 'Brand Identity Report' : 'Name Generator') : 'Start a Session'}</h1>
  `

  const stepper = renderStepper(state)
  const body = document.createElement('div')
  body.className = 'wizard-body'

  root.appendChild(header)
  root.appendChild(stepper)
  root.appendChild(body)

  if (state.step === 1) renderStep1(body, state, root)
  else if (state.step === 2 && state.sessionType === 'brand_identity') renderStep2BrandIdentity(body, state, root)
  else if (state.step === 2 && state.sessionType === 'name_generator') renderStep2NameGenerator(body, state, root)
  else if (state.step === 3) renderStep3Review(body, state, root)
}

function renderStepper(state) {
  const steps =
    state.sessionType === 'brand_identity'
      ? ['Choose type', 'Configure reports', 'Review & launch']
      : state.sessionType === 'name_generator'
      ? ['Choose type', 'Brand preferences', 'Review & launch']
      : ['Choose type', 'Configure', 'Review & launch']

  const el = document.createElement('div')
  el.className = 'wizard-stepper'
  el.innerHTML = steps
    .map((label, i) => {
      const num = i + 1
      const cls = num < state.step ? 'step-done' : num === state.step ? 'step-active' : 'step-pending'
      return `
        <div class="wizard-step ${cls}">
          <div class="wizard-step-num">${num < state.step ? '✓' : num}</div>
          <span class="wizard-step-label">${label}</span>
        </div>
        ${i < steps.length - 1 ? '<div class="wizard-step-connector"></div>' : ''}
      `
    })
    .join('')
  return el
}

// ─── Step 1: Choose session type ─────────────────────────────────────────────

function renderStep1(body, state, root) {
  body.innerHTML = `
    <div class="wizard-section">
      <p class="wizard-intro">What kind of naming research do you need?</p>
      <div class="session-type-grid">
        <button class="session-type-card ${state.sessionType === 'brand_identity' ? 'is-selected' : ''}" data-type="brand_identity">
          <div class="stc-icon">🔍</div>
          <div class="stc-body">
            <div class="stc-title">Brand Identity Report</div>
            <div class="stc-desc">Research an existing or candidate name across domains, trademarks, marketplace listings, and more. Know what you're up against before you commit.</div>
          </div>
          <div class="stc-check">✓</div>
        </button>
        <button class="session-type-card ${state.sessionType === 'name_generator' ? 'is-selected' : ''}" data-type="name_generator">
          <div class="stc-icon">✨</div>
          <div class="stc-body">
            <div class="stc-title">Name Generator</div>
            <div class="stc-desc">Answer a short set of preference questions about your product and brand. We'll build a weighted matrix and generate original name candidates for you to explore.</div>
          </div>
          <div class="stc-check">✓</div>
        </button>
      </div>
    </div>
    <div class="wizard-nav">
      <a href="#/sessions" class="btn btn-ghost">Cancel</a>
      <button id="btn-next-1" class="btn btn-primary" ${!state.sessionType ? 'disabled' : ''}>Continue →</button>
    </div>
  `

  body.querySelectorAll('.session-type-card').forEach((card) => {
    card.addEventListener('click', () => {
      state.sessionType = card.dataset.type
      renderPage(root, state)
    })
  })

  body.querySelector('#btn-next-1')?.addEventListener('click', () => {
    if (!state.sessionType) return
    state.step = 2
    renderPage(root, state)
  })
}

// ─── Step 2a: Brand Identity config ──────────────────────────────────────────

function renderStep2BrandIdentity(body, state, root) {
  body.innerHTML = `
    <div class="wizard-section">
      <h3 class="wizard-section-title">Session details</h3>
      <div class="form-row">
        <label for="bi-session-name">Session name <span class="required">*</span></label>
        <input type="text" id="bi-session-name" placeholder="e.g. Series A brand audit" value="${escHtml(state.sessionName)}" maxlength="100" />
        <div class="field-hint">Give this session a name so you can find it later.</div>
      </div>

      <div class="form-row" style="margin-top:24px">
        <label>Name candidates <span class="required">*</span></label>
        <div class="field-hint" style="margin-bottom:8px">Enter the brand names you want to research. Add up to 5.</div>
        <div id="brand-names-list">
          ${state.brandNames.map((n, i) => renderBrandNameInput(n, i, state.brandNames.length)).join('')}
        </div>
        ${state.brandNames.length < 5 ? `<button id="btn-add-name" class="btn btn-ghost btn-sm" style="margin-top:8px">+ Add another name</button>` : ''}
      </div>
    </div>

    <div class="wizard-section">
      <h3 class="wizard-section-title">Reports to run</h3>
      <div class="field-hint" style="margin-bottom:16px">Choose which checks to include. You can always add more later.</div>
      <div class="report-types-grid">
        ${BRAND_IDENTITY_REPORTS.map((r) => `
          <label class="report-type-card ${state.selectedReports.includes(r.id) ? 'is-selected' : ''}">
            <input type="checkbox" name="report" value="${r.id}" ${state.selectedReports.includes(r.id) ? 'checked' : ''} />
            <div class="rtc-icon">${r.icon}</div>
            <div class="rtc-body">
              <div class="rtc-title">${r.label}</div>
              <div class="rtc-desc">${r.description}</div>
            </div>
            <div class="rtc-check">✓</div>
          </label>
        `).join('')}
      </div>
    </div>

    <div class="wizard-nav">
      <button id="btn-back-2" class="btn btn-ghost">← Back</button>
      <button id="btn-next-2" class="btn btn-primary">Review →</button>
    </div>
  `

  // Session name sync
  body.querySelector('#bi-session-name')?.addEventListener('input', (e) => {
    state.sessionName = e.target.value
  })

  // Brand name inputs
  function syncBrandNames() {
    state.brandNames = Array.from(body.querySelectorAll('.brand-name-input')).map(
      (inp) => inp.value
    )
  }

  body.addEventListener('input', (e) => {
    if (e.target.classList.contains('brand-name-input')) syncBrandNames()
  })

  body.querySelector('#btn-add-name')?.addEventListener('click', () => {
    syncBrandNames()
    if (state.brandNames.length < 5) {
      state.brandNames.push('')
      renderPage(root, state)
    }
  })

  body.querySelectorAll('.brand-name-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      syncBrandNames()
      const idx = Number(btn.dataset.idx)
      state.brandNames.splice(idx, 1)
      if (!state.brandNames.length) state.brandNames = ['']
      renderPage(root, state)
    })
  })

  // Report checkboxes
  body.querySelectorAll('input[name="report"]').forEach((cb) => {
    cb.addEventListener('change', () => {
      state.selectedReports = Array.from(body.querySelectorAll('input[name="report"]:checked')).map(
        (c) => c.value
      )
      body.querySelectorAll('.report-type-card').forEach((card) => {
        const val = card.querySelector('input')?.value
        card.classList.toggle('is-selected', state.selectedReports.includes(val))
      })
    })
  })

  body.querySelector('#btn-back-2')?.addEventListener('click', () => {
    state.step = 1
    renderPage(root, state)
  })

  body.querySelector('#btn-next-2')?.addEventListener('click', () => {
    syncBrandNames()
    if (!state.sessionName.trim()) {
      body.querySelector('#bi-session-name')?.focus()
      return
    }
    if (!state.brandNames.filter((n) => n.trim()).length) return
    state.step = 3
    renderPage(root, state)
  })
}

function renderBrandNameInput(value, idx, total) {
  return `
    <div class="brand-name-row">
      <input type="text" class="brand-name-input" placeholder="e.g. Lumio" value="${escHtml(value)}" maxlength="60" />
      ${total > 1 ? `<button type="button" class="brand-name-remove btn-icon-ghost" data-idx="${idx}" title="Remove">✕</button>` : ''}
    </div>
  `
}

// ─── Step 2b: Name Generator questionnaire ────────────────────────────────────

function renderStep2NameGenerator(body, state, root) {
  body.innerHTML = `
    <div class="wizard-section">
      <h3 class="wizard-section-title">Session details</h3>
      <div class="form-row">
        <label for="ng-session-name">Session name <span class="required">*</span></label>
        <input type="text" id="ng-session-name" placeholder="e.g. Product launch naming" value="${escHtml(state.sessionName)}" maxlength="100" />
      </div>
    </div>

    <div class="wizard-section">
      <h3 class="wizard-section-title">Tell us about your product</h3>
      <div class="form-row">
        <label for="ng-product-desc">What does your product do? <span class="required">*</span></label>
        <textarea id="ng-product-desc" rows="3" placeholder="Describe your product in 1–3 sentences. What problem does it solve? Who is it for?">${escHtml(state.productDesc)}</textarea>
      </div>

      <div class="form-row" style="margin-top:20px">
        <label for="ng-industry">Industry / category</label>
        <select id="ng-industry">
          <option value="">Select one…</option>
          ${NAME_GENERATOR_INDUSTRIES.map(
            (ind) => `<option value="${escHtml(ind)}" ${state.industry === ind ? 'selected' : ''}>${ind}</option>`
          ).join('')}
        </select>
      </div>
    </div>

    <div class="wizard-section">
      <h3 class="wizard-section-title">Brand personality</h3>
      <div class="field-hint" style="margin-bottom:14px">Pick up to 3 vibes that should come through in the name.</div>
      <div class="vibe-grid">
        ${NAME_GENERATOR_VIBES.map((v) => `
          <button type="button" class="vibe-card ${state.vibes.includes(v.id) ? 'is-selected' : ''}" data-vibe="${v.id}">
            <span class="vibe-icon">${v.icon}</span>
            <span class="vibe-label">${v.label}</span>
            <span class="vibe-desc">${v.desc}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <div class="wizard-section">
      <h3 class="wizard-section-title">Name preferences</h3>
      <div class="form-row">
        <label>Preferred name length</label>
        <div class="radio-card-row">
          ${NAME_LENGTH_OPTIONS.map((opt) => `
            <label class="radio-card ${state.nameLength === opt.id ? 'is-selected' : ''}">
              <input type="radio" name="nameLength" value="${opt.id}" ${state.nameLength === opt.id ? 'checked' : ''} />
              <span class="rc-label">${opt.label}</span>
              <span class="rc-desc">${opt.desc}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <div class="form-row" style="margin-top:20px">
        <label for="ng-start">Preferred starting letters or sounds <span class="hint">(optional)</span></label>
        <input type="text" id="ng-start" placeholder="e.g. V, Sp, Cr" value="${escHtml(state.startLetters)}" maxlength="50" />
        <div class="field-hint">Comma-separated. Leave blank for no preference.</div>
      </div>

      <div class="form-row" style="margin-top:20px">
        <label for="ng-avoid">Words or sounds to avoid <span class="hint">(optional)</span></label>
        <input type="text" id="ng-avoid" placeholder="e.g. dark, death, cheap" value="${escHtml(state.avoidWords)}" maxlength="100" />
        <div class="field-hint">Comma-separated. Anything that feels off-brand.</div>
      </div>
    </div>

    <div class="wizard-nav">
      <button id="btn-back-2b" class="btn btn-ghost">← Back</button>
      <button id="btn-next-2b" class="btn btn-primary">Review →</button>
    </div>
  `

  body.querySelector('#ng-session-name')?.addEventListener('input', (e) => { state.sessionName = e.target.value })
  body.querySelector('#ng-product-desc')?.addEventListener('input', (e) => { state.productDesc = e.target.value })
  body.querySelector('#ng-industry')?.addEventListener('change', (e) => { state.industry = e.target.value })
  body.querySelector('#ng-start')?.addEventListener('input', (e) => { state.startLetters = e.target.value })
  body.querySelector('#ng-avoid')?.addEventListener('input', (e) => { state.avoidWords = e.target.value })

  body.querySelectorAll('.vibe-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.vibe
      if (state.vibes.includes(id)) {
        state.vibes = state.vibes.filter((v) => v !== id)
      } else if (state.vibes.length < 3) {
        state.vibes = [...state.vibes, id]
      }
      body.querySelectorAll('.vibe-card').forEach((b) => {
        b.classList.toggle('is-selected', state.vibes.includes(b.dataset.vibe))
      })
    })
  })

  body.querySelectorAll('input[name="nameLength"]').forEach((rb) => {
    rb.addEventListener('change', (e) => {
      state.nameLength = e.target.value
      body.querySelectorAll('.radio-card').forEach((rc) => {
        rc.classList.toggle('is-selected', rc.querySelector('input')?.value === state.nameLength)
      })
    })
  })

  body.querySelector('#btn-back-2b')?.addEventListener('click', () => {
    state.step = 1
    renderPage(root, state)
  })

  body.querySelector('#btn-next-2b')?.addEventListener('click', () => {
    if (!state.sessionName.trim() || !state.productDesc.trim()) {
      if (!state.sessionName.trim()) body.querySelector('#ng-session-name')?.focus()
      else body.querySelector('#ng-product-desc')?.focus()
      return
    }
    state.step = 3
    renderPage(root, state)
  })
}

// ─── Step 3: Review & launch ──────────────────────────────────────────────────

function renderStep3Review(body, state, root) {
  const isBrand = state.sessionType === 'brand_identity'

  const summaryRows = isBrand
    ? `
      <div class="review-row"><span class="review-label">Names to research</span><span class="review-value">${state.brandNames.filter((n) => n.trim()).map(escHtml).join(', ')}</span></div>
      <div class="review-row"><span class="review-label">Reports</span><span class="review-value">${state.selectedReports.map((id) => BRAND_IDENTITY_REPORTS.find((r) => r.id === id)?.label || id).join(', ')}</span></div>
    `
    : `
      <div class="review-row"><span class="review-label">Product</span><span class="review-value">${escHtml(state.productDesc)}</span></div>
      ${state.industry ? `<div class="review-row"><span class="review-label">Industry</span><span class="review-value">${escHtml(state.industry)}</span></div>` : ''}
      ${state.vibes.length ? `<div class="review-row"><span class="review-label">Brand vibe</span><span class="review-value">${state.vibes.map((v) => NAME_GENERATOR_VIBES.find((x) => x.id === v)?.label || v).join(', ')}</span></div>` : ''}
      <div class="review-row"><span class="review-label">Name length</span><span class="review-value">${NAME_LENGTH_OPTIONS.find((o) => o.id === state.nameLength)?.label || state.nameLength}</span></div>
      ${state.startLetters ? `<div class="review-row"><span class="review-label">Preferred starts</span><span class="review-value">${escHtml(state.startLetters)}</span></div>` : ''}
      ${state.avoidWords ? `<div class="review-row"><span class="review-label">Avoid</span><span class="review-value">${escHtml(state.avoidWords)}</span></div>` : ''}
    `

  body.innerHTML = `
    <div class="wizard-section">
      <h3 class="wizard-section-title">Review your session</h3>
      <div class="review-card">
        <div class="review-row review-row--header">
          <span class="review-label">Session name</span>
          <span class="review-value">${escHtml(state.sessionName)}</span>
        </div>
        <div class="review-row">
          <span class="review-label">Type</span>
          <span class="review-value">${isBrand ? '🔍 Brand Identity Report' : '✨ Name Generator'}</span>
        </div>
        ${summaryRows}
      </div>
    </div>

    ${state.error ? `<div class="inline-status is-error" style="margin-bottom:16px">${escHtml(state.error)}</div>` : ''}

    <div class="wizard-nav">
      <button id="btn-back-3" class="btn btn-ghost">← Back</button>
      <button id="btn-launch" class="btn btn-primary" ${state.submitting ? 'disabled' : ''}>
        ${state.submitting ? 'Creating…' : '🚀 Launch session'}
      </button>
    </div>
  `

  body.querySelector('#btn-back-3')?.addEventListener('click', () => {
    state.step = 2
    renderPage(root, state)
  })

  body.querySelector('#btn-launch')?.addEventListener('click', async () => {
    if (state.submitting) return
    state.submitting = true
    state.error = ''
    renderPage(root, state)

    const payload = buildPayload(state)
    const resp = await apiFetch('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (!resp.ok) {
      state.submitting = false
      state.error = resp.data?.error || 'Could not create session. Please try again.'
      renderPage(root, state)
      return
    }

    const sessionId = resp.data?.id
    if (sessionId) {
      window.location.hash = `#/session?id=${sessionId}`
    } else {
      window.location.hash = '#/sessions'
    }
  })
}

function buildPayload(state) {
  const base = {
    name: state.sessionName.trim(),
    session_type: state.sessionType,
  }

  if (state.sessionType === 'brand_identity') {
    return {
      ...base,
      metadata: {
        brand_names: state.brandNames.filter((n) => n.trim()).map((n) => n.trim()),
        report_types: state.selectedReports,
      },
    }
  }

  return {
    ...base,
    metadata: {
      product_description: state.productDesc.trim(),
      industry: state.industry,
      vibes: state.vibes,
      name_length: state.nameLength,
      start_letters: state.startLetters.trim(),
      avoid_words: state.avoidWords.trim(),
    },
  }
}

function escHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}
