import { getAccessToken } from '../auth/client.js'
import { API_BASE } from '../config.js'

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

// ─── Report types ─────────────────────────────────────────────────────────────

const BRAND_IDENTITY_REPORTS = [
  {
    id: 'domain_availability',
    label: 'Domain Availability',
    icon: '🌐',
    description: '.com, .io, .ai, .co, .app, .dev',
    default: true,
  },
  {
    id: 'trademark',
    label: 'Trademark',
    icon: '⚖️',
    description: 'US trademark screening',
    default: true,
  },
  {
    id: 'products_for_sale',
    label: 'Products for Sale',
    icon: '🛒',
    description: 'Amazon marketplace conflicts',
    default: true,
  },
  {
    id: 'social_handles',
    label: 'Social Handles',
    icon: '📱',
    description: 'GitHub, Reddit + major platforms',
    default: false,
  },
  {
    id: 'app_store',
    label: 'App Store',
    icon: '📦',
    description: 'iOS App Store conflicts',
    default: false,
  },
]

const NAME_GENERATOR_INDUSTRIES = [
  'Technology / SaaS', 'Fintech', 'Health & Wellness', 'E-commerce',
  'Consumer Goods', 'Media & Entertainment', 'Education', 'Real Estate',
  'Food & Beverage', 'Travel', 'Professional Services', 'Other',
]

const NAME_GENERATOR_VIBES = [
  { id: 'technical', label: 'Technical', icon: '⚙️' },
  { id: 'friendly',  label: 'Friendly',  icon: '😊' },
  { id: 'premium',   label: 'Premium',   icon: '💎' },
  { id: 'playful',   label: 'Playful',   icon: '🎉' },
  { id: 'minimal',   label: 'Minimal',   icon: '◻️' },
  { id: 'bold',      label: 'Bold',      icon: '🔥' },
]

// ─── State ────────────────────────────────────────────────────────────────────

function createState() {
  return {
    step: 1,
    sessionType: null,  // 'brand_identity' | 'name_generator'

    // Brand Identity fields
    sessionName: '',
    brandNames: [''],
    selectedReports: BRAND_IDENTITY_REPORTS.filter((r) => r.default).map((r) => r.id),

    // Name Generator fields
    productDesc: '',
    industry: '',
    vibes: [],
    nameLength: 'any',
    startLetters: '',
    avoidWords: '',
    _showAdvanced: false,

    // UI
    submitting: false,
    error: '',
    _nameError: false,
  }
}

// ─── Page entry point ─────────────────────────────────────────────────────────

export function NewSession() {
  const el = document.createElement('section')
  el.className = 'page new-session container'

  const state = createState()

  // Handle ?prefill=NAME and ?type= from URL hash
  const hashQuery = window.location.hash.includes('?')
    ? window.location.hash.slice(window.location.hash.indexOf('?') + 1)
    : ''
  const params = new URLSearchParams(hashQuery)
  const prefill = params.get('prefill')?.trim()
  const typeParam = params.get('type')?.trim()

  if (prefill) {
    state.sessionType = 'brand_identity'
    state.brandNames = [prefill]
    state.step = 2
  } else if (typeParam === 'brand_identity' || typeParam === 'name_generator') {
    state.sessionType = typeParam
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
    <h1>${
      state.step === 1
        ? 'What do you need?'
        : state.sessionType === 'brand_identity'
        ? 'Brand Identity Report'
        : 'Name Generator'
    }</h1>
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
      ? ['Type', 'Configure', 'Launch']
      : state.sessionType === 'name_generator'
      ? ['Type', 'Describe', 'Launch']
      : ['Type', 'Configure', 'Launch']

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

// ─── Step 1: Choose session type — auto-advances on selection ─────────────────

function renderStep1(body, state, root) {
  body.innerHTML = `
    <div class="wizard-section">
      <div class="session-type-grid">
        <button class="session-type-card ${state.sessionType === 'brand_identity' ? 'is-selected' : ''}" data-type="brand_identity">
          <div class="stc-icon">🔍</div>
          <div class="stc-body">
            <div class="stc-title">Check a name</div>
            <div class="stc-desc">Research domains, trademarks, social handles, and marketplace conflicts for a name you have in mind.</div>
          </div>
          <div class="stc-check">✓</div>
        </button>
        <button class="session-type-card ${state.sessionType === 'name_generator' ? 'is-selected' : ''}" data-type="name_generator">
          <div class="stc-icon">✨</div>
          <div class="stc-body">
            <div class="stc-title">Generate name ideas</div>
            <div class="stc-desc">Describe your product and brand feel. We'll generate and check original name candidates.</div>
          </div>
          <div class="stc-check">✓</div>
        </button>
      </div>
    </div>
    <div class="wizard-nav">
      <a href="#/sessions" class="btn btn-ghost">Cancel</a>
    </div>
  `

  // Auto-advance on card tap — no separate Continue button needed
  body.querySelectorAll('.session-type-card').forEach((card) => {
    card.addEventListener('click', () => {
      state.sessionType = card.dataset.type
      state.step = 2
      renderPage(root, state)
    })
  })
}

// ─── Step 2a: Brand Identity config ──────────────────────────────────────────

function renderStep2BrandIdentity(body, state, root) {
  body.innerHTML = `
    <div class="wizard-section">
      <div class="form-row">
        <label for="bi-session-name">Research label <span class="required">*</span></label>
        <input type="text" id="bi-session-name" placeholder="e.g. Series A naming audit" value="${escHtml(state.sessionName)}" maxlength="100" />
        <div class="field-hint">For your own reference — so you can find it later.</div>
        ${state._nameError ? `<div class="field-error">Please enter a label to continue.</div>` : ''}
      </div>

      <div class="form-row" style="margin-top:24px">
        <label>Names to check <span class="required">*</span></label>
        <div class="field-hint" style="margin-bottom:8px">Enter up to 5 brand names to research.</div>
        <div id="brand-names-list">
          ${state.brandNames.map((n, i) => renderBrandNameInput(n, i, state.brandNames.length)).join('')}
        </div>
        ${state.brandNames.length < 5
          ? `<button id="btn-add-name" class="btn btn-ghost btn-sm" style="margin-top:8px">+ Add name</button>`
          : ''}
      </div>
    </div>

    <div class="wizard-section">
      <label style="font-weight:600;font-size:0.9375rem;display:block;margin-bottom:4px">Checks to run</label>
      <div class="field-hint" style="margin-bottom:12px">Toggle on the checks you want included.</div>
      <div class="report-toggles">
        ${BRAND_IDENTITY_REPORTS.map((r) => `
          <div class="report-toggle-row ${state.selectedReports.includes(r.id) ? 'is-on' : ''}">
            <div class="report-toggle-meta">
              <span class="report-toggle-icon">${r.icon}</span>
              <div>
                <div class="report-toggle-label">${r.label}</div>
                <div class="report-toggle-desc">${r.description}</div>
              </div>
            </div>
            <button type="button" class="toggle-switch ${state.selectedReports.includes(r.id) ? 'is-on' : ''}" data-report="${r.id}" role="switch" aria-checked="${state.selectedReports.includes(r.id)}">
              <span class="toggle-knob"></span>
            </button>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="wizard-nav">
      <button id="btn-back-2" class="btn btn-ghost">← Back</button>
      <button id="btn-next-2" class="btn btn-primary">Review →</button>
    </div>
  `

  // Session name
  body.querySelector('#bi-session-name')?.addEventListener('input', (e) => {
    state.sessionName = e.target.value
    if (state._nameError && state.sessionName.trim()) {
      state._nameError = false
      body.querySelector('.field-error')?.remove()
    }
  })

  // Brand name inputs
  function syncBrandNames() {
    state.brandNames = Array.from(body.querySelectorAll('.brand-name-input')).map((inp) => inp.value)
  }
  body.addEventListener('input', (e) => {
    if (e.target.classList.contains('brand-name-input')) syncBrandNames()
  })
  body.querySelector('#btn-add-name')?.addEventListener('click', () => {
    syncBrandNames()
    if (state.brandNames.length < 5) { state.brandNames.push(''); renderPage(root, state) }
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

  // Toggle switches
  body.querySelectorAll('.toggle-switch').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const id = toggle.dataset.report
      const isOn = state.selectedReports.includes(id)
      if (isOn) {
        state.selectedReports = state.selectedReports.filter((r) => r !== id)
      } else {
        state.selectedReports = [...state.selectedReports, id]
      }
      toggle.classList.toggle('is-on', !isOn)
      toggle.setAttribute('aria-checked', String(!isOn))
      toggle.closest('.report-toggle-row')?.classList.toggle('is-on', !isOn)
    })
  })

  body.querySelector('#btn-back-2')?.addEventListener('click', () => { state.step = 1; renderPage(root, state) })
  body.querySelector('#btn-next-2')?.addEventListener('click', () => {
    syncBrandNames()
    if (!state.sessionName.trim()) {
      state._nameError = true
      renderPage(root, state)
      root.querySelector('#bi-session-name')?.focus()
      return
    }
    if (!state.brandNames.filter((n) => n.trim()).length) return
    state._nameError = false
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

// ─── Step 2b: Name Generator ──────────────────────────────────────────────────

function renderStep2NameGenerator(body, state, root) {
  body.innerHTML = `
    <div class="wizard-section">
      <div class="form-row">
        <label for="ng-product-desc">What does your product do? <span class="required">*</span></label>
        <textarea id="ng-product-desc" rows="3" placeholder="Describe your product in 1–3 sentences. What problem does it solve? Who is it for?">${escHtml(state.productDesc)}</textarea>
        ${state._descError ? `<div class="field-error">Please describe your product to continue.</div>` : ''}
      </div>
    </div>

    <div class="wizard-section">
      <div class="form-row">
        <label>Brand feel <span class="hint">(pick up to 3)</span></label>
        <div class="vibe-pill-row">
          ${NAME_GENERATOR_VIBES.map((v) => `
            <button type="button" class="vibe-pill ${state.vibes.includes(v.id) ? 'is-selected' : ''}" data-vibe="${v.id}">
              ${v.icon} ${v.label}
            </button>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="wizard-section">
      <button type="button" id="btn-show-advanced" class="btn btn-ghost btn-sm" style="margin-bottom:0">
        ${state._showAdvanced ? '− Fewer options' : '+ More options'}
      </button>
      ${state._showAdvanced ? `
        <div class="advanced-prefs" style="margin-top:16px">
          <div class="form-row">
            <label for="ng-industry">Industry</label>
            <select id="ng-industry">
              <option value="">Select one…</option>
              ${NAME_GENERATOR_INDUSTRIES.map(
                (ind) => `<option value="${escHtml(ind)}" ${state.industry === ind ? 'selected' : ''}>${ind}</option>`
              ).join('')}
            </select>
          </div>

          <div class="form-row" style="margin-top:16px">
            <label>Name length</label>
            <div class="radio-pill-row">
              ${[
                { id: 'short', label: 'Short', desc: '1–5 chars' },
                { id: 'medium', label: 'Medium', desc: '6–9 chars' },
                { id: 'any', label: 'Any', desc: 'No preference' },
              ].map((opt) => `
                <button type="button" class="radio-pill ${state.nameLength === opt.id ? 'is-selected' : ''}" data-length="${opt.id}">
                  ${opt.label} <span class="radio-pill-desc">${opt.desc}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="form-row" style="margin-top:16px">
            <label for="ng-start">Preferred starting sounds <span class="hint">(optional)</span></label>
            <input type="text" id="ng-start" placeholder="e.g. V, Sp, Cr" value="${escHtml(state.startLetters)}" maxlength="50" />
            <div class="field-hint">Comma-separated.</div>
          </div>

          <div class="form-row" style="margin-top:16px">
            <label for="ng-avoid">Sounds to avoid <span class="hint">(optional)</span></label>
            <input type="text" id="ng-avoid" placeholder="e.g. dark, death, cheap" value="${escHtml(state.avoidWords)}" maxlength="100" />
            <div class="field-hint">Comma-separated.</div>
          </div>
        </div>
      ` : ''}
    </div>

    <div class="wizard-nav">
      <button id="btn-back-2b" class="btn btn-ghost">← Back</button>
      <button id="btn-next-2b" class="btn btn-primary">Review →</button>
    </div>
  `

  body.querySelector('#ng-product-desc')?.addEventListener('input', (e) => {
    state.productDesc = e.target.value
    if (state._descError && state.productDesc.trim()) {
      state._descError = false
      body.querySelector('.field-error')?.remove()
    }
  })

  body.querySelector('#btn-show-advanced')?.addEventListener('click', () => {
    state._showAdvanced = !state._showAdvanced
    renderPage(root, state)
    // preserve textarea value across re-render
  })

  body.querySelectorAll('.vibe-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.vibe
      if (state.vibes.includes(id)) {
        state.vibes = state.vibes.filter((v) => v !== id)
        btn.classList.remove('is-selected')
      } else if (state.vibes.length < 3) {
        state.vibes = [...state.vibes, id]
        btn.classList.add('is-selected')
      }
    })
  })

  if (state._showAdvanced) {
    body.querySelector('#ng-industry')?.addEventListener('change', (e) => { state.industry = e.target.value })
    body.querySelector('#ng-start')?.addEventListener('input', (e) => { state.startLetters = e.target.value })
    body.querySelector('#ng-avoid')?.addEventListener('input', (e) => { state.avoidWords = e.target.value })
    body.querySelectorAll('.radio-pill[data-length]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.nameLength = btn.dataset.length
        body.querySelectorAll('.radio-pill[data-length]').forEach((b) =>
          b.classList.toggle('is-selected', b.dataset.length === state.nameLength)
        )
      })
    })
  }

  body.querySelector('#btn-back-2b')?.addEventListener('click', () => { state.step = 1; renderPage(root, state) })
  body.querySelector('#btn-next-2b')?.addEventListener('click', () => {
    if (!state.productDesc.trim()) {
      state._descError = true
      renderPage(root, state)
      root.querySelector('#ng-product-desc')?.focus()
      return
    }
    // Auto-generate session name from product description
    if (!state.sessionName.trim()) {
      const words = state.productDesc.trim().split(/\s+/).slice(0, 5).join(' ')
      state.sessionName = words.length > 40 ? words.slice(0, 40) + '…' : words
    }
    state._descError = false
    state.step = 3
    renderPage(root, state)
  })
}

// ─── Step 3: Review & launch ──────────────────────────────────────────────────

function renderStep3Review(body, state, root) {
  const isBrand = state.sessionType === 'brand_identity'

  const checkedNames = state.brandNames.filter((n) => n.trim())
  const selectedReportLabels = state.selectedReports
    .map((id) => BRAND_IDENTITY_REPORTS.find((r) => r.id === id)?.label || id)

  const summaryRows = isBrand
    ? `
      <div class="review-row">
        <span class="review-label">Names</span>
        <span class="review-value">
          ${checkedNames.map((n) => `<span class="name-chip">${escHtml(n)}</span>`).join('')}
        </span>
      </div>
      <div class="review-row">
        <span class="review-label">Checks</span>
        <span class="review-value">${selectedReportLabels.join(', ')}</span>
      </div>
    `
    : `
      <div class="review-row">
        <span class="review-label">Product</span>
        <span class="review-value">${escHtml(state.productDesc)}</span>
      </div>
      ${state.industry ? `<div class="review-row"><span class="review-label">Industry</span><span class="review-value">${escHtml(state.industry)}</span></div>` : ''}
      ${state.vibes.length ? `<div class="review-row"><span class="review-label">Brand feel</span><span class="review-value">${state.vibes.map((v) => NAME_GENERATOR_VIBES.find((x) => x.id === v)?.label || v).join(', ')}</span></div>` : ''}
    `

  body.innerHTML = `
    <div class="wizard-section">
      <div class="review-card">
        <div class="review-row review-row--header">
          <span class="review-label">Label</span>
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
        ${state.submitting ? 'Creating…' : '🚀 Launch'}
      </button>
    </div>
  `

  body.querySelector('#btn-back-3')?.addEventListener('click', () => { state.step = 2; renderPage(root, state) })
  body.querySelector('#btn-launch')?.addEventListener('click', async () => {
    if (state.submitting) return
    state.submitting = true
    state.error = ''
    renderPage(root, state)

    const payload = buildPayload(state)
    const resp = await apiFetch('/api/sessions', { method: 'POST', body: JSON.stringify(payload) })

    if (!resp.ok) {
      state.submitting = false
      state.error = resp.data?.error || 'Could not create session. Please try again.'
      renderPage(root, state)
      return
    }

    const sessionId = resp.data?.id
    window.location.hash = sessionId ? `#/session?id=${sessionId}` : '#/sessions'
  })
}

function buildPayload(state) {
  const base = { name: state.sessionName.trim(), session_type: state.sessionType }

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
