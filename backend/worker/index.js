import leoProfanity from 'leo-profanity'
import { createRemoteJWKSet, jwtVerify } from 'jose'

let PROFANITY_READY = false
let JWKS_CACHE = null

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: CORS_HEADERS,
        })
      }

      if (url.pathname === '/api/health' && request.method === 'GET') {
        return handleHealth(env)
      }

      if (url.pathname === '/api/test-orchestrator' && request.method === 'GET') {
        return handleTestOrchestrator(url, env)
      }

      if (url.pathname === '/api/check' && request.method === 'GET') {
        return handleCheck(url, env)
      }

      if (url.pathname === '/api/suggestions' && request.method === 'GET') {
        return handleSuggestions(url, env)
      }

      // Below this point, routes require a real Auth0 user. We verify the
      // token and ensure a corresponding row exists in the D1 `users` table.
      const authResult = await verifyAuth0Token(request, env)
      if (!authResult.ok || !authResult.sub) {
        return json({ error: 'unauthorized' }, 401)
      }

      const user = await getOrCreateUser(env, authResult.sub, authResult.email || null)
      if (!user) {
        return json({ error: 'user_init_failed' }, 500)
      }

      if (url.pathname === '/api/account' && request.method === 'DELETE') {
        return handleDeleteAccount(env, user.id)
      }

      if (url.pathname === '/api/campaigns' && request.method === 'GET') {
        return handleListCampaigns(env, user.id)
      }

      if (url.pathname === '/api/campaigns' && request.method === 'POST') {
        return handleCreateCampaign(request, env, user.id)
      }

      if (url.pathname === '/api/search-history' && request.method === 'GET') {
        return handleListSearchHistory(env, user.id)
      }

      if (url.pathname === '/api/search-history' && request.method === 'POST') {
        return handleAddSearchHistory(request, env, user.id)
      }

      if (url.pathname === '/api/search-history' && request.method === 'DELETE') {
        return handleDeleteSearchHistory(url, env, user.id)
      }

      if (url.pathname === '/api/advanced-reports' && request.method === 'GET') {
        return handleListAdvancedReports(url, env, user.id)
      }

      if (url.pathname === '/api/advanced-reports' && request.method === 'POST') {
        return handleCreateAdvancedReport(request, env, user.id)
      }

      const advancedReportMatch = url.pathname.match(/^\/api\/advanced-reports\/([^/]+)$/)
      if (advancedReportMatch && request.method === 'GET') {
        const reportId = advancedReportMatch[1]
        return handleGetAdvancedReport(env, user.id, reportId)
      }

      const campaignOptionsMatch = url.pathname.match(/^\/api\/campaigns\/([^/]+)\/options$/)
      if (campaignOptionsMatch && request.method === 'POST') {
        const campaignId = campaignOptionsMatch[1]
        return handleCreateOption(request, env, user.id, campaignId)
      }

      const optionCheckMatch = url.pathname.match(/^\/api\/options\/([^/]+)\/check$/)
      if (optionCheckMatch && request.method === 'POST') {
        const optionId = optionCheckMatch[1]
        return handleCheckOption(env, user.id, optionId)
      }

      return json({ error: 'not_found' }, 404)
    }

    return new Response('OK')
  },
}

async function handleCheck(url, env) {
  const rawName = url.searchParams.get('name')?.trim() || ''
  const name = rawName.replace(/\s+/g, '')
  const safetyConfig = await loadSafetyConfig(env)

  const debug = url.searchParams.get('debug') === '1'

  const turnstileToken = url.searchParams.get('cf_turnstile_token') || ''

  const turnstileOk = await verifyTurnstile(env, turnstileToken)
  if (!turnstileOk) {
    return json({ status: 'captcha_failed' }, 400)
  }

  const safety = await evaluateNameSafety(name, safetyConfig)
  if (!safety.ok) {
    return json({ status: 'unsafe', reason: safety.reason, message: safety.message }, 400)
  }

  if (!name) {
    return json({ status: 'error', error: 'missing_name' }, 400)
  }

  const results = await runChecksForName(env, name, null, debug)
  return json({ status: 'ok', name, results })
}

async function handleHealth(env) {
  const orchestratorService = env.SEARCH_ORCHESTRATOR

  let orchestrator = {
    configured: !!orchestratorService,
    reachable: false,
    search_ok: false,
    last_status: null,
    last_error: null,
  }

  if (orchestrator.configured) {
    try {
      const healthRes = await orchestratorService.fetch('http://orchestrator/health')
      orchestrator.last_status = healthRes.status
      if (healthRes.ok) {
        const data = await healthRes.json().catch(() => ({}))
        orchestrator.reachable = data && data.status === 'ok'
      }
    } catch (err) {
      orchestrator.reachable = false
      orchestrator.last_error = (err && err.message) || 'fetch_failed'
    }

    // If basic /health looks good, also try a tiny test search through the
    // same orchestrator pipeline. This uses the same callOrchestrator helper
    // as /api/check, but with a fixed lightweight name.
    if (orchestrator.reachable) {
      try {
        const testResp = await callOrchestrator(env, null, null, 'healthtest', null)
        if (testResp && testResp.status === 'ok') {
          orchestrator.search_ok = true
        }
      } catch (err) {
        orchestrator.search_ok = false
        orchestrator.last_error = (err && err.message) || 'search_test_failed'
      }
    }
  }

  return json({
    status: 'ok',
    worker: { healthy: true },
    orchestrator,
  })
}

// Simple test endpoint to exercise the orchestrator wiring without
// affecting normal /api/check behavior. It uses ORCHESTRATOR_URL and
// ORCHESTRATOR_TOKEN if present and reports what happened.
async function handleTestOrchestrator(url, env) {
  const name = url.searchParams.get('name')?.trim() || 'healthtest'

  const orchestratorUrl = env.ORCHESTRATOR_URL || ''
  const token = env.ORCHESTRATOR_TOKEN || ''

  if (!orchestratorUrl || !token) {
    return json(
      {
        status: 'orchestrator_disabled',
        message: 'ORCHESTRATOR_URL and ORCHESTRATOR_TOKEN are not configured.',
        name,
      },
      200
    )
  }

  let data = null
  try {
    data = await callOrchestrator(env, orchestratorUrl, token, name, null)
  } catch (err) {
    return json(
      {
        status: 'error',
        name,
        error: 'orchestrator_call_failed',
      },
      200
    )
  }

  if (!data) {
    return json(
      {
        status: 'no_data',
        name,
        message: 'Orchestrator returned no data (null/invalid).',
      },
      200
    )
  }

  return json(
    {
      status: 'ok',
      name,
      orchestrator_response: data,
    },
    200
  )
}

async function verifyTurnstile(env, token) {
  // If no secret is configured, skip verification entirely (use dashboard/WAF rules instead).
  if (!env.TURNSTILE_SECRET) {
    return true
  }

  // If there is a secret but no token was provided, allow the request.
  // This lets you run Turnstile at the edge (before the site loads)
  // without forcing every client request to pass a token parameter.
  if (!token) {
    return true
  }

  const formData = new FormData()
  formData.append('secret', env.TURNSTILE_SECRET)
  formData.append('response', token)

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  })

  const data = await res.json().catch(() => ({}))
  return !!data.success
}

async function handleSuggestions(url, env) {
  const name = url.searchParams.get('name')?.trim() || ''
  const safetyConfig = await loadSafetyConfig(env)

  const baseSafety = await evaluateNameSafety(name, safetyConfig)
  if (!baseSafety.ok) {
    return json({ status: 'unsafe', reason: baseSafety.reason, message: baseSafety.message }, 400)
  }

  const suggestions = generateSuggestions(name, safetyConfig)
  return json({ status: 'ok', name, suggestions })
}

async function handleListCampaigns(env, userId) {
  const db = env.NAMEO_DB
  if (!db) {
    return json({ error: 'db_not_configured' }, 500)
  }

  const result = await db
    .prepare('SELECT id, name, description, created_at, updated_at FROM campaigns WHERE user_id = ? ORDER BY created_at DESC')
    .bind(userId)
    .all()

  return json({ campaigns: result.results || [] })
}

async function handleCreateCampaign(request, env, userId) {
  const db = env.NAMEO_DB
  if (!db) {
    return json({ error: 'db_not_configured' }, 500)
  }

  let body = {}
  try {
    body = await request.json()
  } catch (err) {
    return json({ error: 'invalid_json' }, 400)
  }

  const name = (body.name || '').trim()
  const description = (body.description || '').trim() || null

  if (!name) {
    return json({ error: 'name_required' }, 400)
  }

  const now = Math.floor(Date.now() / 1000)
  const id = crypto.randomUUID()

  await db
    .prepare('INSERT INTO campaigns (id, user_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, userId, name, description, now, now)
    .run()

  return json({ id, name, description, created_at: now, updated_at: now }, 201)
}

async function handleCreateOption(request, env, userId, campaignId) {
  const db = env.NAMEO_DB
  if (!db) {
    return json({ error: 'db_not_configured' }, 500)
  }

  // Ensure campaign belongs to this user
  const campaign = await db
    .prepare('SELECT id FROM campaigns WHERE id = ? AND user_id = ?')
    .bind(campaignId, userId)
    .first()

  if (!campaign) {
    return json({ error: 'campaign_not_found' }, 404)
  }

  let body = {}
  try {
    body = await request.json()
  } catch (err) {
    return json({ error: 'invalid_json' }, 400)
  }

  const name = (body.name || '').trim()
  if (!name) {
    return json({ error: 'name_required' }, 400)
  }

  const now = Math.floor(Date.now() / 1000)
  const id = crypto.randomUUID()

  await db
    .prepare('INSERT INTO options (id, campaign_id, name, created_at) VALUES (?, ?, ?, ?)')
    .bind(id, campaignId, name, now)
    .run()

  return json({ id, campaign_id: campaignId, name, created_at: now }, 201)
}

async function handleCheckOption(env, userId, optionId) {
  const db = env.NAMEO_DB
  if (!db) {
    return json({ error: 'db_not_configured' }, 500)
  }

  // Load option and verify it belongs to this user via its campaign
  const row = await db
    .prepare(
      'SELECT o.id, o.name, o.campaign_id FROM options o JOIN campaigns c ON o.campaign_id = c.id WHERE o.id = ? AND c.user_id = ?'
    )
    .bind(optionId, userId)
    .first()

  if (!row) {
    return json({ error: 'option_not_found' }, 404)
  }

  const safetyConfig = await loadSafetyConfig(env)
  const servicesConfig = await loadServicesConfig(env)

  const safety = await evaluateNameSafety(row.name, safetyConfig)
  if (!safety.ok) {
    return json({ status: 'unsafe', reason: safety.reason, message: safety.message }, 400)
  }

  const results = await runChecksForName(env, row.name, userId)

  const checkedAt = Math.floor(Date.now() / 1000)
  const checkId = crypto.randomUUID()

  await db
    .prepare('INSERT INTO option_checks (id, option_id, checked_at, services_json) VALUES (?, ?, ?, ?)')
    .bind(checkId, optionId, checkedAt, JSON.stringify(results))
    .run()

  return json({ status: 'ok', option_id: optionId, checked_at: checkedAt, results })
}

// Central place to decide how to run checks for a given name.
// This function is the only place that knows whether we:
// - Call out to the external orchestrator service, or
// - Fall back to the local services.json + url_status checks.
async function runChecksForName(env, name, userIdOrNull, debug = false) {
  // Try orchestrator first when configured. Any failure should fall back
  // to local checks so the public API keeps working even if the VM or
  // Cloudflare routing is down.
  const url = env.ORCHESTRATOR_URL
  const token = env.ORCHESTRATOR_TOKEN

  if (url && token) {
    try {
      const orchestrated = await callOrchestrator(env, url, token, name, userIdOrNull)
      if (
        orchestrated &&
        orchestrated.status === 'ok' &&
        Array.isArray(orchestrated.results) &&
        orchestrated.results.length > 0
      ) {
        return orchestrated.results
      }
      // If orchestrator returns an error or empty list, fall through to local checks.
    } catch (err) {
      // Ignore orchestrator failures and continue to local checks.
    }
  }

  const servicesConfig = await loadServicesConfig(env)

  const checks = await Promise.allSettled(
    servicesConfig.services.map((service) => checkServiceAvailability(service, name, debug))
  )

  const results = servicesConfig.services.map((service, index) => {
    const r = checks[index]
    if (r.status === 'fulfilled') {
      return { service: service.id, label: service.label, ...r.value }
    }
    return {
      service: service.id,
      label: service.label,
      status: 'error',
      error: 'check_failed',
    }
  })

  return results
}

// Low-level helper for calling the orchestrator VM. This is intentionally
// conservative: we only use it when ORCHESTRATOR_URL and ORCHESTRATOR_TOKEN
// are configured, and any network / HTTP / JSON error is treated as a
// signal to fall back to local checks.
async function callOrchestrator(env, url, token, name, userIdOrNull) {
  const trimmed = (name || '').trim()
  if (!trimmed) {
    return null
  }

  const body = {
    name: trimmed,
    user: userIdOrNull
      ? {
          id: userIdOrNull,
          // We could look up tier here in the future and pass it through.
        }
      : undefined,
    groups: ['common', 'niche', 'advanced'],
    modes: ['basic_availability'],
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 4000)

  let res
  try {
    res = await fetch(new URL('/v1/search-basic', url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (err) {
    // Treat timeouts / network failures as a signal to fall back.
    return null
  } finally {
    clearTimeout(timeoutId)
  }

  if (!res.ok) {
    return null
  }

  const data = await res.json().catch(() => null)
  if (!data || typeof data !== 'object') {
    return null
  }

  return data
}

async function handleDeleteAccount(env, userId) {
  const db = env.NAMEO_DB
  if (!db) {
    return json({ error: 'db_not_configured' }, 500)
  }

  await db
    .prepare('DELETE FROM users WHERE id = ?')
    .bind(userId)
    .run()

  return json({ status: 'deleted' })
}

async function handleListAdvancedReports(url, env, userId) {
  const db = env.NAMEO_DB
  if (!db) {
    return json({ error: 'db_not_configured' }, 500)
  }

  const rawLimit = Number(url.searchParams.get('limit') || 25)
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(50, rawLimit)) : 25

  const result = await db
    .prepare(
      'SELECT id, report_json, created_at, updated_at FROM advanced_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    )
    .bind(userId, limit)
    .all()

  const items = (result.results || []).map((row) => {
    let report = null
    try {
      report = JSON.parse(row.report_json || 'null')
    } catch {
      report = null
    }
    return {
      id: row.id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      report: report || { id: row.id },
    }
  })

  return json({ items })
}

async function handleCreateAdvancedReport(request, env, userId) {
  const db = env.NAMEO_DB
  if (!db) {
    return json({ error: 'db_not_configured' }, 500)
  }

  let body = {}
  try {
    body = await request.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const id = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)

  let report = null
  if (body && body.report_json && typeof body.report_json === 'object') {
    report = { ...body.report_json, id, created_at: now, updated_at: now }
  } else {
    report = {
      id,
      project_type: (body.project_type || '').trim(),
      description: (body.description || '').trim(),
      seed: (body.seed || '').trim(),
      surfaces: body.surfaces && typeof body.surfaces === 'object' ? body.surfaces : {},
      status: 'stub',
      created_at: now,
      updated_at: now,
    }
  }

  try {
    await db
      .prepare('INSERT INTO advanced_reports (id, user_id, report_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .bind(id, userId, JSON.stringify(report), now, now)
      .run()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // Most common cause is missing migrations/table in the remote D1.
    return json({ error: 'db_insert_failed', message }, 500)
  }

  return json({ id, created_at: now }, 201)
}

async function handleGetAdvancedReport(env, userId, reportId) {
  const db = env.NAMEO_DB
  if (!db) {
    return json({ error: 'db_not_configured' }, 500)
  }

  const id = (reportId || '').trim()
  if (!id) {
    return json({ error: 'id_required' }, 400)
  }

  const row = await db
    .prepare('SELECT id, report_json, created_at, updated_at FROM advanced_reports WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first()

  if (!row) {
    return json({ error: 'not_found' }, 404)
  }

  let report = null
  try {
    report = JSON.parse(row.report_json || 'null')
  } catch {
    report = null
  }

  return json({ report: report || { id: row.id } })
}

async function handleListSearchHistory(env, userId) {
  const db = env.NAMEO_DB
  if (!db) {
    return json({ error: 'db_not_configured' }, 500)
  }

  const result = await db
    .prepare(
      'SELECT id, name, status, searched_at FROM search_history WHERE user_id = ? ORDER BY searched_at DESC LIMIT 50'
    )
    .bind(userId)
    .all()

  return json({ items: result.results || [] })
}

async function handleAddSearchHistory(request, env, userId) {
  const db = env.NAMEO_DB
  if (!db) {
    return json({ error: 'db_not_configured' }, 500)
  }

  let body = {}
  try {
    body = await request.json()
  } catch (err) {
    return json({ error: 'invalid_json' }, 400)
  }

  const name = (body.name || '').trim()
  const status = (body.status || '').trim() || 'partial'

  if (!name) {
    return json({ error: 'name_required' }, 400)
  }

  const id = crypto.randomUUID()
  const searchedAt = Math.floor(Date.now() / 1000)

  await db
    .prepare(
      'INSERT INTO search_history (id, user_id, name, status, searched_at) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(id, userId, name, status, searchedAt)
    .run()

  return json({ id, name, status, searched_at: searchedAt }, 201)
}

async function handleDeleteSearchHistory(url, env, userId) {
  const db = env.NAMEO_DB
  if (!db) {
    return json({ error: 'db_not_configured' }, 500)
  }

  const name = url.searchParams.get('name')?.trim() || ''
  if (!name) {
    return json({ error: 'name_required' }, 400)
  }

  await db
    .prepare('DELETE FROM search_history WHERE user_id = ? AND name = ?')
    .bind(userId, name)
    .run()

  return json({ status: 'deleted' })
}

async function getOrCreateUser(env, sub, email) {
  const db = env.NAMEO_DB
  if (!db) {
    return null
  }

  const existing = await db
    .prepare('SELECT id, email, tier, created_at FROM users WHERE id = ?')
    .bind(sub)
    .first()

  if (existing) {
    // Older rows may not have tier populated; treat missing/empty as beta.
    const tier = existing.tier || 'beta'
    return { id: existing.id, email: existing.email, tier, created_at: existing.created_at }
  }

  const now = Math.floor(Date.now() / 1000)
  const tier = 'beta' // initial signup tier with full access during beta; updated later via backend flows

  await db
    .prepare('INSERT INTO users (id, email, tier, created_at) VALUES (?, ?, ?, ?)')
    .bind(sub, email, tier, now)
    .run()

  return { id: sub, email, tier, created_at: now }
}

async function loadSafetyConfig(env) {
  // In a more advanced setup, this could come from KV. For now, static JSON bundled at build.
  const config = await import('../../config/safety.json', { assert: { type: 'json' } })
  return config.default || config
}

async function loadServicesConfig(env) {
  const config = await import('../../config/services.json', { assert: { type: 'json' } })
  return config.default || config
}

async function loadAvailabilitySignatures(env) {
  const config = await import('../../config/availability_signatures.json', { assert: { type: 'json' } })
  return config.default || config
}

async function evaluateNameSafety(name, safetyConfig) {
  if (!name) {
    return { ok: false, reason: 'empty', message: 'Name is required.' }
  }

  const { minLength, maxLength, allowedPattern, bannedSubstrings } = safetyConfig

  if (name.length < minLength || name.length > maxLength) {
    return { ok: false, reason: 'length', message: 'Name length is out of allowed range.' }
  }

  const re = new RegExp(allowedPattern)
  if (!re.test(name)) {
    return { ok: false, reason: 'pattern', message: 'Name contains invalid characters.' }
  }

  const lower = name.toLowerCase()
  if (Array.isArray(bannedSubstrings)) {
    for (const banned of bannedSubstrings) {
      if (banned && lower.includes(banned)) {
        return { ok: false, reason: 'banned_substring', message: 'Name contains disallowed language.' }
      }
    }
  }

  // Profanity check using leo-profanity in addition to simple substring rules.
  if (!PROFANITY_READY) {
    leoProfanity.loadDictionary()
    PROFANITY_READY = true
  }

  if (leoProfanity.check(name)) {
    return { ok: false, reason: 'profanity', message: 'Name contains profanity or inappropriate language.' }
  }

  return { ok: true }
}

async function checkServiceAvailability(service, name, debug = false) {
  if (service.strategy === 'coming_soon') {
    return { status: 'coming_soon' }
  }

  if (service.strategy === 'url_status') {
    const signaturesConfig = await loadAvailabilitySignatures()
    const perService =
      signaturesConfig && signaturesConfig.services && signaturesConfig.services[service.id]
        ? signaturesConfig.services[service.id]
        : null

    const url = service.urlTemplate.replace('{name}', encodeURIComponent(name))
    const method = service.method || 'HEAD'

    const res = await fetch(url, { method })
    const finalUrl = (res && res.url) || url

    if (res.status === 404) {
      return debug
        ? { status: 'available', code: res.status, debug: { finalUrl, matched: 'status:404', bodyFetched: false } }
        : { status: 'available', code: res.status }
    }

    if (res.status === 401 || res.status === 403 || res.status === 429) {
      return debug
        ? { status: 'unknown', code: res.status, debug: { finalUrl, matched: `status:${res.status}`, bodyFetched: false } }
        : { status: 'unknown', code: res.status }
    }

    const globalTaken =
      signaturesConfig && signaturesConfig.global && Array.isArray(signaturesConfig.global.taken)
        ? signaturesConfig.global.taken
        : []
    const availableNeedleList = perService && Array.isArray(perService.available) ? perService.available : []
    const takenNeedleList = perService && Array.isArray(perService.taken) ? perService.taken : []
    const unknownNeedleList = perService && Array.isArray(perService.unknown) ? perService.unknown : []

    const needsBody =
      availableNeedleList.length > 0 || takenNeedleList.length > 0 || unknownNeedleList.length > 0 ||
      globalTaken.length > 0

    let bodyText = ''
    let bodyFinalUrl = finalUrl
    let bodyFetched = false

    if (needsBody) {
      if (method === 'GET') {
        bodyFinalUrl = finalUrl
        bodyText = await res.text().catch(() => '')
        bodyFetched = true
      } else {
        const res2 = await fetch(url, { method: 'GET' })
        bodyFinalUrl = (res2 && res2.url) || finalUrl
        bodyText = await res2.text().catch(() => '')
        bodyFetched = true
      }
    }

    const haystack = `${String(bodyFinalUrl || finalUrl)}\n${String(bodyText || '')}`.toLowerCase()
    const nameLower = String(name || '').toLowerCase()

    const matches = (needles) => {
      for (const raw of needles) {
        if (!raw) continue
        const needle = String(raw).replaceAll('{name}', nameLower).toLowerCase()
        if (needle && haystack.includes(needle)) return true
      }
      return false
    }

    const firstMatch = (needles) => {
      for (const raw of needles) {
        if (!raw) continue
        const needle = String(raw).replaceAll('{name}', nameLower).toLowerCase()
        if (needle && haystack.includes(needle)) return String(raw)
      }
      return null
    }

    // Precedence: available/taken should win over unknown to reduce false-unknown
    // when generic strings like "login" or "verify" appear on otherwise valid pages.
    const availableHit = firstMatch(availableNeedleList)
    if (availableHit) {
      return debug
        ? { status: 'available', code: res.status, debug: { finalUrl: bodyFinalUrl, matched: `available:${availableHit}`, bodyFetched } }
        : { status: 'available', code: res.status }
    }

    const takenHit = firstMatch(takenNeedleList) || firstMatch(globalTaken)
    if (takenHit) {
      return debug
        ? { status: 'taken', code: res.status, debug: { finalUrl: bodyFinalUrl, matched: `taken:${takenHit}`, bodyFetched } }
        : { status: 'taken', code: res.status }
    }

    const unknownHit = firstMatch(unknownNeedleList)
    if (unknownHit) {
      return debug
        ? { status: 'unknown', code: res.status, debug: { finalUrl: bodyFinalUrl, matched: `unknown:${unknownHit}`, bodyFetched } }
        : { status: 'unknown', code: res.status }
    }

    return debug
      ? { status: 'unknown', code: res.status, debug: { finalUrl: bodyFinalUrl, matched: 'no_match', bodyFetched } }
      : { status: 'unknown', code: res.status }
  }

  return { status: 'unsupported' }
}

function generateSuggestions(name, safetyConfig) {
  const prefixes = ['the', 'real', 'its']
  const suffixes = ['app', 'hq', 'official']

  const raw = []

  for (const p of prefixes) {
    raw.push(p + name)
  }

  raw.push(name + '_')
  raw.push(name + '1')

  for (const s of suffixes) {
    raw.push(name + s)
  }

  const seen = new Set()
  const allowed = []

  for (const candidate of raw) {
    if (seen.has(candidate)) continue
    seen.add(candidate)

    const evalResult = simpleSafetyCheck(candidate, safetyConfig)
    if (evalResult.ok) {
      allowed.push(candidate)
    }
  }

  return allowed.slice(0, 20)
}

function simpleSafetyCheck(name, safetyConfig) {
  const { minLength, maxLength, allowedPattern, bannedSubstrings } = safetyConfig

  if (name.length < minLength || name.length > maxLength) {
    return { ok: false }
  }

  const re = new RegExp(allowedPattern)
  if (!re.test(name)) {
    return { ok: false }
  }

  const lower = name.toLowerCase()
  if (Array.isArray(bannedSubstrings)) {
    for (const banned of bannedSubstrings) {
      if (banned && lower.includes(banned)) {
        return { ok: false }
      }
    }
  }

  return { ok: true }
}

async function verifyAuth0Token(request, env) {
  const authHeader = request.headers.get('Authorization') || ''
  const [scheme, token] = authHeader.split(' ')

  if (!token || scheme !== 'Bearer') {
    return { ok: false }
  }

  const domain = env.AUTH0_DOMAIN
  const audience = env.AUTH0_AUDIENCE

  if (!domain || !audience) {
    return { ok: false }
  }

  try {
    if (!JWKS_CACHE) {
      const jwksUrl = new URL(`https://${domain}/.well-known/jwks.json`)
      JWKS_CACHE = createRemoteJWKSet(jwksUrl)
    }

    const issuer = `https://${domain}/`

    const { payload } = await jwtVerify(token, JWKS_CACHE, {
      issuer,
      audience,
    })

    const sub = payload.sub
    if (!sub || typeof sub !== 'string') {
      return { ok: false }
    }

    const email = typeof payload.email === 'string' ? payload.email : null

    return { ok: true, sub, email }
  } catch (err) {
    return { ok: false }
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  })
}
