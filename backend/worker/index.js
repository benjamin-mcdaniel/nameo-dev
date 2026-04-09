import leoProfanity from 'leo-profanity'
import { createRemoteJWKSet, jwtVerify } from 'jose'

let PROFANITY_READY = false
let JWKS_CACHE = null

const DEFAULT_DAILY_GLOBAL_LIMIT = 5000
const DEFAULT_DAILY_IP_LIMIT = 5000

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
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

      if (url.pathname === '/api/check' && request.method === 'GET') {
        return handleCheck(request, url, env)
      }

      if (url.pathname === '/api/suggestions' && request.method === 'GET') {
        return handleSuggestions(request, url, env)
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

      if (url.pathname === '/api/me' && request.method === 'GET') {
        return handleGetMe(env, user)
      }

      if (url.pathname === '/api/account' && request.method === 'DELETE') {
        return handleDeleteAccount(env, user.id)
      }

      if (url.pathname === '/api/test-orchestrator' && request.method === 'GET') {
        return handleTestOrchestrator(url, env)
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

      // ── Sessions (v1 workflow) ────────────────────────────────────────────

      if (url.pathname === '/api/sessions' && request.method === 'GET') {
        return handleListSessions(env, user.id)
      }

      if (url.pathname === '/api/sessions' && request.method === 'POST') {
        return handleCreateSession(request, env, user.id, ctx)
      }

      const sessionMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)$/)
      if (sessionMatch) {
        const sessionId = sessionMatch[1]
        if (request.method === 'GET') return handleGetSession(env, user.id, sessionId)
        if (request.method === 'DELETE') return handleDeleteSession(env, user.id, sessionId)
      }

      const sessionReportsMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/reports$/)
      if (sessionReportsMatch) {
        const sessionId = sessionReportsMatch[1]
        if (request.method === 'GET') return handleListSessionReports(env, user.id, sessionId)
        if (request.method === 'POST') return handleCreateSessionReport(request, env, user.id, sessionId)
      }

      const sessionReportMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/reports\/([^/]+)$/)
      if (sessionReportMatch) {
        const sessionId = sessionReportMatch[1]
        const reportId = sessionReportMatch[2]
        if (request.method === 'GET') return handleGetSessionReport(env, user.id, sessionId, reportId)
      }

      const reportRunMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/reports\/([^/]+)\/run$/)
      if (reportRunMatch && request.method === 'POST') {
        const sessionId = reportRunMatch[1]
        const reportId = reportRunMatch[2]
        return handleRunReport(env, ctx, user.id, sessionId, reportId)
      }

      // ─────────────────────────────────────────────────────────────────────

      return json({ error: 'not_found' }, 404)
    }

    return new Response('OK')
  },
}

function getDailyGlobalLimit(env) {
  const raw = Number(env.DAILY_CHECK_LIMIT || env.RATE_LIMIT_DAILY_GLOBAL || DEFAULT_DAILY_GLOBAL_LIMIT)
  return Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : DEFAULT_DAILY_GLOBAL_LIMIT
}

function getDailyIpLimit(env) {
  const raw = Number(env.RATE_LIMIT_DAILY_IP || DEFAULT_DAILY_IP_LIMIT)
  return Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : DEFAULT_DAILY_IP_LIMIT
}

function utcDayKey(nowMs) {
  try {
    return new Date(nowMs).toISOString().slice(0, 10)
  } catch {
    return 'unknown-day'
  }
}

function secondsUntilNextUtcDay(nowMs) {
  try {
    const d = new Date(nowMs)
    const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0))
    return Math.max(1, Math.floor((next.getTime() - nowMs) / 1000))
  } catch {
    return 3600
  }
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(String(input || ''))
  const hash = await crypto.subtle.digest('SHA-256', data)
  const bytes = Array.from(new Uint8Array(hash))
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function getClientIp(request) {
  const cf = request.headers.get('cf-connecting-ip')
  if (cf) return cf
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return ''
}

async function incrementCounter(db, key, nowSeconds) {
  // Prefer a single atomic upsert.
  try {
    const row = await db
      .prepare(
        'INSERT INTO rate_limits (key, count, updated_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at RETURNING count'
      )
      .bind(key, nowSeconds)
      .first()
    const count = row && typeof row.count === 'number' ? row.count : null
    if (typeof count === 'number') return count
  } catch {
    // fall through
  }

  // Fallback: update then read. (Less ideal but still provides a safety valve.)
  await db
    .prepare(
      'INSERT INTO rate_limits (key, count, updated_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1, updated_at = ?'
    )
    .bind(key, nowSeconds, nowSeconds)
    .run()

  const row = await db
    .prepare('SELECT count FROM rate_limits WHERE key = ?')
    .bind(key)
    .first()
  const count = row && typeof row.count === 'number' ? row.count : 0
  return count
}

async function enforcePublicApiLimits(request, env, kind) {
  const db = env.NAMEO_DB
  if (!db) return { ok: true }

  const nowMs = Date.now()
  const nowSeconds = Math.floor(nowMs / 1000)
  const day = utcDayKey(nowMs)
  const globalLimit = getDailyGlobalLimit(env)
  const ipLimit = getDailyIpLimit(env)

  // Allow setting limits to 0 to hard-disable the endpoint without removing it.
  if (globalLimit === 0 || ipLimit === 0) {
    return { ok: false, reason: 'disabled', retryAfter: secondsUntilNextUtcDay(nowMs) }
  }

  const ip = getClientIp(request)
  const ipHash = ip ? await sha256Hex(ip) : 'noip'

  const globalKey = `rl:${kind}:global:${day}`
  const ipKey = `rl:${kind}:ip:${day}:${ipHash}`

  const globalCount = await incrementCounter(db, globalKey, nowSeconds)
  if (globalCount > globalLimit) {
    return { ok: false, reason: 'global_cap', retryAfter: secondsUntilNextUtcDay(nowMs) }
  }

  const ipCount = await incrementCounter(db, ipKey, nowSeconds)
  if (ipCount > ipLimit) {
    return { ok: false, reason: 'ip_cap', retryAfter: secondsUntilNextUtcDay(nowMs) }
  }

  return { ok: true }
}

async function handleCheck(request, url, env) {
  const limit = await enforcePublicApiLimits(request, env, 'check')
  if (!limit.ok) {
    const retryAfter = limit.retryAfter || 3600
    return json(
      {
        status: 'rate_limited',
        reason: limit.reason || 'rate_limited',
        message: 'Search is temporarily disabled to prevent abuse. Please try again later.',
      },
      429,
      {
        'Retry-After': String(retryAfter),
      }
    )
  }

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

async function handleSuggestions(request, url, env) {
  const limit = await enforcePublicApiLimits(request, env, 'suggestions')
  if (!limit.ok) {
    const retryAfter = limit.retryAfter || 3600
    return json(
      {
        status: 'rate_limited',
        reason: limit.reason || 'rate_limited',
        message: 'Suggestions are temporarily disabled to prevent abuse. Please try again later.',
      },
      429,
      {
        'Retry-After': String(retryAfter),
      }
    )
  }

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

async function handleGetMe(env, user) {
  const db = env.NAMEO_DB
  let sessionCount = 0
  if (db) {
    const row = await db
      .prepare('SELECT COUNT(*) AS cnt FROM sessions WHERE user_id = ?')
      .bind(user.id)
      .first()
    sessionCount = row?.cnt ?? 0
  }
  return json({
    id: user.id,
    email: user.email,
    tier: user.tier || 'beta',
    created_at: user.created_at,
    session_count: sessionCount,
  })
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

  const cfg = safetyConfig || {}
  const minLen = cfg.minLength || 3
  const maxLen = cfg.maxLength || 32
  const pattern = cfg.allowedPattern ? new RegExp(cfg.allowedPattern) : null
  const banned = Array.isArray(cfg.bannedSubstrings) ? cfg.bannedSubstrings : []

  if (name.length < minLen) {
    return { ok: false, reason: 'too_short', message: `Name must be at least ${minLen} characters.` }
  }
  if (name.length > maxLen) {
    return { ok: false, reason: 'too_long', message: `Name must be ${maxLen} characters or fewer.` }
  }
  if (pattern && !pattern.test(name)) {
    return { ok: false, reason: 'invalid_chars', message: 'Name contains invalid characters. Use letters, numbers, hyphens, underscores, and dots only.' }
  }
  const lower = name.toLowerCase()
  for (const sub of banned) {
    if (lower.includes(sub.toLowerCase())) {
      return { ok: false, reason: 'banned', message: 'That name is not allowed.' }
    }
  }

  // Profanity check via leo-profanity (module-level instance, initialized once)
  try {
    if (!PROFANITY_READY) {
      leoProfanity.loadDictionary()
      PROFANITY_READY = true
    }
    if (leoProfanity.check(lower)) {
      return { ok: false, reason: 'profanity', message: 'That name is not allowed.' }
    }
  } catch {
    // If profanity check fails, allow through rather than blocking legitimate names
  }

  return { ok: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sessions API (v1 startup workflow)
// ─────────────────────────────────────────────────────────────────────────────

async function handleListSessions(env, userId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)

  const result = await db
    .prepare(`
      SELECT s.id, s.name, s.session_type, s.status, s.metadata_json, s.created_at, s.updated_at,
             COUNT(r.id) AS report_count
      FROM sessions s
      LEFT JOIN session_reports r ON r.session_id = s.id
      WHERE s.user_id = ?
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT 50
    `)
    .bind(userId)
    .all()

  const sessions = (result.results || []).map(rowToSession)
  return json({ sessions })
}

async function handleCreateSession(request, env, userId, ctx) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)

  let body = {}
  try { body = await request.json() } catch { return json({ error: 'invalid_json' }, 400) }

  const name = (body.name || '').trim()
  if (!name) return json({ error: 'name_required' }, 400)

  const sessionType = (body.session_type || '').trim()
  const validTypes = ['brand_identity', 'name_generator']
  if (!validTypes.includes(sessionType)) {
    return json({ error: 'invalid_session_type', valid: validTypes }, 400)
  }

  const id = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : {}

  try {
    await db
      .prepare(
        'INSERT INTO sessions (id, user_id, name, session_type, status, metadata_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(id, userId, name, sessionType, 'active', JSON.stringify(metadata), now, now)
      .run()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return json({ error: 'db_insert_failed', message }, 500)
  }

  // If Brand Identity session, auto-create pending reports for each selected report type
  if (sessionType === 'brand_identity' && Array.isArray(metadata.report_types)) {
    const validReportTypes = ['domain_availability', 'trademark', 'products_for_sale', 'social_handles', 'app_store']
    const reportTypes = metadata.report_types.filter((t) => validReportTypes.includes(t))
    for (const reportType of reportTypes) {
      const rid = crypto.randomUUID()
      try {
        await db
          .prepare(
            'INSERT INTO session_reports (id, session_id, report_type, status, input_json, result_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
          )
          .bind(rid, id, reportType, 'pending', JSON.stringify({ brand_names: metadata.brand_names || [] }), null, now, now)
          .run()
      } catch { /* non-fatal – reports can be re-created */ }
    }
  }

  // If Name Generator session, auto-create questionnaire report
  if (sessionType === 'name_generator') {
    const rid = crypto.randomUUID()
    try {
      await db
        .prepare(
          'INSERT INTO session_reports (id, session_id, report_type, status, input_json, result_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(rid, id, 'questionnaire', 'pending', JSON.stringify(metadata), null, now, now)
        .run()
    } catch { /* non-fatal */ }
  }

  // Fire report runners asynchronously — respond immediately, checks run in background
  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(executeAllPendingReports(env, id))
  }

  return json({ id, name, session_type: sessionType, status: 'active', created_at: now }, 201)
}

async function handleGetSession(env, userId, sessionId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)

  const row = await db
    .prepare('SELECT id, name, session_type, status, metadata_json, created_at, updated_at FROM sessions WHERE id = ? AND user_id = ?')
    .bind(sessionId, userId)
    .first()

  if (!row) return json({ error: 'not_found' }, 404)

  const reportsResult = await db
    .prepare('SELECT id, report_type, status, input_json, result_json, created_at, updated_at FROM session_reports WHERE session_id = ? ORDER BY created_at ASC')
    .bind(sessionId)
    .all()

  const reports = (reportsResult.results || []).map(rowToReport)

  return json({ session: rowToSession(row), reports })
}

async function handleDeleteSession(env, userId, sessionId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)

  const row = await db
    .prepare('SELECT id FROM sessions WHERE id = ? AND user_id = ?')
    .bind(sessionId, userId)
    .first()

  if (!row) return json({ error: 'not_found' }, 404)

  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run()
  return json({ status: 'deleted' })
}

async function handleListSessionReports(env, userId, sessionId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)

  // Verify session belongs to user
  const session = await db
    .prepare('SELECT id FROM sessions WHERE id = ? AND user_id = ?')
    .bind(sessionId, userId)
    .first()
  if (!session) return json({ error: 'not_found' }, 404)

  const result = await db
    .prepare('SELECT id, report_type, status, input_json, result_json, created_at, updated_at FROM session_reports WHERE session_id = ? ORDER BY created_at ASC')
    .bind(sessionId)
    .all()

  return json({ reports: (result.results || []).map(rowToReport) })
}

async function handleCreateSessionReport(request, env, userId, sessionId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)

  const session = await db
    .prepare('SELECT id, session_type FROM sessions WHERE id = ? AND user_id = ?')
    .bind(sessionId, userId)
    .first()
  if (!session) return json({ error: 'not_found' }, 404)

  let body = {}
  try { body = await request.json() } catch { return json({ error: 'invalid_json' }, 400) }

  const reportType = (body.report_type || '').trim()
  const validReportTypes = ['domain_availability', 'trademark', 'products_for_sale', 'social_handles', 'app_store', 'questionnaire', 'name_candidates']
  if (!validReportTypes.includes(reportType)) {
    return json({ error: 'invalid_report_type', valid: validReportTypes }, 400)
  }

  const id = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  const inputJson = body.input && typeof body.input === 'object' ? JSON.stringify(body.input) : null

  try {
    await db
      .prepare(
        'INSERT INTO session_reports (id, session_id, report_type, status, input_json, result_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(id, sessionId, reportType, 'pending', inputJson, null, now, now)
      .run()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return json({ error: 'db_insert_failed', message }, 500)
  }

  return json({ id, session_id: sessionId, report_type: reportType, status: 'pending', created_at: now }, 201)
}

async function handleGetSessionReport(env, userId, sessionId, reportId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)

  const session = await db
    .prepare('SELECT id FROM sessions WHERE id = ? AND user_id = ?')
    .bind(sessionId, userId)
    .first()
  if (!session) return json({ error: 'not_found' }, 404)

  const row = await db
    .prepare('SELECT id, report_type, status, input_json, result_json, created_at, updated_at FROM session_reports WHERE id = ? AND session_id = ?')
    .bind(reportId, sessionId)
    .first()

  if (!row) return json({ error: 'not_found' }, 404)
  return json({ report: rowToReport(row) })
}

// ── Report re-run endpoint ─────────────────────────────────────────────────

async function handleRunReport(env, ctx, userId, sessionId, reportId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)

  // Verify session ownership
  const session = await db
    .prepare('SELECT id FROM sessions WHERE id = ? AND user_id = ?')
    .bind(sessionId, userId)
    .first()
  if (!session) return json({ error: 'not_found' }, 404)

  // Verify report belongs to session
  const report = await db
    .prepare('SELECT id, report_type, input_json FROM session_reports WHERE id = ? AND session_id = ?')
    .bind(reportId, sessionId)
    .first()
  if (!report) return json({ error: 'not_found' }, 404)

  let input = null
  try { input = JSON.parse(report.input_json || 'null') } catch { input = null }

  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(runSessionReport(env, report.id, report.report_type, input))
  }

  return json({ ok: true, report_id: reportId, status: 'running' })
}

// ── Report runner engine ───────────────────────────────────────────────────

async function updateReportStatus(env, reportId, status, resultJson) {
  const db = env.NAMEO_DB
  if (!db) return
  const now = Math.floor(Date.now() / 1000)
  try {
    await db
      .prepare('UPDATE session_reports SET status = ?, result_json = ?, updated_at = ? WHERE id = ?')
      .bind(status, resultJson != null ? JSON.stringify(resultJson) : null, now, reportId)
      .run()
  } catch { /* non-fatal */ }
}

async function executeAllPendingReports(env, sessionId) {
  const db = env.NAMEO_DB
  if (!db) return
  try {
    const reports = await db
      .prepare('SELECT id, report_type, input_json FROM session_reports WHERE session_id = ? AND status = ?')
      .bind(sessionId, 'pending')
      .all()
    for (const report of (reports.results || [])) {
      let input = null
      try { input = JSON.parse(report.input_json || 'null') } catch { input = null }
      await runSessionReport(env, report.id, report.report_type, input)
    }
  } catch { /* non-fatal — session still created successfully */ }
}

async function runSessionReport(env, reportId, reportType, input) {
  try {
    await updateReportStatus(env, reportId, 'running', null)
    if (reportType === 'domain_availability') {
      await runDomainAvailabilityReport(env, reportId, input)
    } else if (reportType === 'social_handles') {
      await runSocialHandlesReport(env, reportId, input)
    } else if (reportType === 'app_store') {
      await runAppStoreReport(env, reportId, input)
    } else if (reportType === 'products_for_sale') {
      await runProductsForSaleReport(env, reportId, input)
    } else if (reportType === 'trademark') {
      await runTrademarkReport(env, reportId, input)
    } else {
      // Not yet implemented — leave as pending so user can see it's queued
      await updateReportStatus(env, reportId, 'pending', null)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await updateReportStatus(env, reportId, 'error', { error: msg })
  }
}

// ── Domain availability runner (Cloudflare DoH, no API key required) ───────

const DOMAIN_TLDS = ['.com', '.io', '.ai', '.co', '.app', '.dev']

async function checkDomainViaDoH(name, tld) {
  const domain = `${name}${tld}`
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=NS`
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/dns-json' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return 'unknown'
    const data = await res.json()
    // Status 3 = NXDOMAIN (domain not registered → available)
    if (data.Status === 3) return 'available'
    // Status 0 = NOERROR — domain resolves, almost certainly registered
    if (data.Status === 0) return 'taken'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

async function runDomainAvailabilityReport(env, reportId, input) {
  const rawNames = (input && Array.isArray(input.brand_names) ? input.brand_names : [])
  const brandNames = rawNames
    .map((n) => String(n || '').trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9-]/g, ''))
    .filter(Boolean)

  if (!brandNames.length) {
    await updateReportStatus(env, reportId, 'error', { error: 'no_brand_names' })
    return
  }

  const results = await Promise.all(
    brandNames.map(async (name) => {
      const tldChecks = await Promise.allSettled(
        DOMAIN_TLDS.map(async (tld) => ({ tld, status: await checkDomainViaDoH(name, tld) }))
      )
      const tlds = {}
      for (const r of tldChecks) {
        if (r.status === 'fulfilled') tlds[r.value.tld] = r.value.status
      }
      return { name, tlds }
    })
  )

  await updateReportStatus(env, reportId, 'complete', {
    names: results,
    tlds: DOMAIN_TLDS,
    checked_at: Math.floor(Date.now() / 1000),
  })
}

// ── Social handles runner (reuses existing orchestrator/check pipeline) ─────

const SOCIAL_SERVICE_IDS = ['x', 'instagram', 'youtube', 'github', 'linkedin', 'tiktok', 'reddit']

async function runSocialHandlesReport(env, reportId, input) {
  const rawNames = (input && Array.isArray(input.brand_names) ? input.brand_names : [])
  const brandNames = rawNames
    .map((n) => String(n || '').trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_-]/g, ''))
    .filter(Boolean)

  if (!brandNames.length) {
    await updateReportStatus(env, reportId, 'error', { error: 'no_brand_names' })
    return
  }

  const results = await Promise.all(
    brandNames.map(async (name) => {
      const checks = await runChecksForName(env, name, null)
      const handles = {}
      for (const check of (checks || [])) {
        if (SOCIAL_SERVICE_IDS.includes(check.service)) {
          handles[check.service] = { status: check.status, label: check.label }
        }
      }
      return { name, handles }
    })
  )

  await updateReportStatus(env, reportId, 'complete', {
    names: results,
    checked_at: Math.floor(Date.now() / 1000),
  })
}

// ── App Store runner (Apple iTunes Search API, free, no key) ──────────────

async function searchAppStore(term) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=us&entity=software&limit=10`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []).map((app) => ({
      name: app.trackName || '',
      developer: app.artistName || '',
      url: app.trackViewUrl || '',
      icon: app.artworkUrl60 || '',
      rating: app.averageUserRating || null,
      category: app.primaryGenreName || '',
    }))
  } catch {
    return []
  }
}

async function runAppStoreReport(env, reportId, input) {
  const rawNames = (input && Array.isArray(input.brand_names) ? input.brand_names : [])
  const brandNames = rawNames
    .map((n) => String(n || '').trim().toLowerCase().replace(/[^a-z0-9 -]/g, ''))
    .filter(Boolean)

  if (!brandNames.length) {
    await updateReportStatus(env, reportId, 'error', { error: 'no_brand_names' })
    return
  }

  const results = await Promise.all(
    brandNames.map(async (name) => {
      const apps = await searchAppStore(name)
      // Score relevance: exact match, starts-with, or contains
      const scored = apps.map((app) => {
        const appLower = app.name.toLowerCase()
        const nameLower = name.toLowerCase()
        let match = 'partial'
        if (appLower === nameLower) match = 'exact'
        else if (appLower.startsWith(nameLower + ' ') || appLower.startsWith(nameLower + ':')) match = 'strong'
        else if (appLower.includes(nameLower)) match = 'contains'
        return { ...app, match }
      })
      const hasConflict = scored.some((a) => a.match === 'exact' || a.match === 'strong')
      return { name, apps: scored, status: hasConflict ? 'conflict' : (scored.length ? 'possible' : 'clear') }
    })
  )

  await updateReportStatus(env, reportId, 'complete', {
    names: results,
    checked_at: Math.floor(Date.now() / 1000),
  })
}

// ── Products for Sale runner (Amazon search via public autocomplete) ──────

async function searchAmazonProducts(term) {
  // Amazon's public search-suggestion endpoint — no API key needed
  const url = `https://completion.amazon.com/api/2017/suggestions?mid=ATVPDKIKX0DER&alias=aps&prefix=${encodeURIComponent(term)}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.suggestions || []).map((s) => ({
      value: s.value || '',
    }))
  } catch {
    return []
  }
}

async function runProductsForSaleReport(env, reportId, input) {
  const rawNames = (input && Array.isArray(input.brand_names) ? input.brand_names : [])
  const brandNames = rawNames
    .map((n) => String(n || '').trim().toLowerCase().replace(/[^a-z0-9 -]/g, ''))
    .filter(Boolean)

  if (!brandNames.length) {
    await updateReportStatus(env, reportId, 'error', { error: 'no_brand_names' })
    return
  }

  const results = await Promise.all(
    brandNames.map(async (name) => {
      const suggestions = await searchAmazonProducts(name)
      // Check if any suggestions match closely
      const nameLower = name.toLowerCase()
      const matches = suggestions.filter((s) => {
        const val = s.value.toLowerCase()
        return val === nameLower || val.startsWith(nameLower + ' ') || val.includes(nameLower)
      })
      const hasConflict = matches.some((m) => m.value.toLowerCase() === nameLower)
      return {
        name,
        suggestions: matches.slice(0, 8).map((m) => m.value),
        total_suggestions: suggestions.length,
        status: hasConflict ? 'conflict' : (matches.length ? 'possible' : 'clear'),
      }
    })
  )

  await updateReportStatus(env, reportId, 'complete', {
    names: results,
    checked_at: Math.floor(Date.now() / 1000),
  })
}

// ── Trademark runner (USPTO free text search) ─────────────────────────────

async function searchUSPTOTrademarks(term) {
  // USPTO's new Trademark Search system has a public JSON endpoint
  const url = `https://tsdr.uspto.gov/documentretrieval?specialCharConvert=yes&sn=&rn=&in=&on=&mn=${encodeURIComponent(term)}&ms=&type=default`
  try {
    // Fallback: use the public search results page as a signal
    // The cleanest free approach is checking the trademark search suggestions endpoint
    const searchUrl = `https://efts.uspto.gov/WEBAPIS/efts/search/results?query=${encodeURIComponent(term)}&type=mark`
    const res = await fetch(searchUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return { results: [], available: false, error: 'search_unavailable' }
    const data = await res.json()
    const hits = (data.hits || data.results || []).slice(0, 10)
    return { results: hits, total: data.total || hits.length, available: true }
  } catch {
    // If the USPTO endpoint doesn't work, try a simpler fallback
    return { results: [], available: false, error: 'search_unavailable' }
  }
}

async function runTrademarkReport(env, reportId, input) {
  const rawNames = (input && Array.isArray(input.brand_names) ? input.brand_names : [])
  const brandNames = rawNames
    .map((n) => String(n || '').trim().replace(/[^a-zA-Z0-9 -]/g, ''))
    .filter(Boolean)

  if (!brandNames.length) {
    await updateReportStatus(env, reportId, 'error', { error: 'no_brand_names' })
    return
  }

  const results = await Promise.all(
    brandNames.map(async (name) => {
      const search = await searchUSPTOTrademarks(name)
      if (!search.available) {
        return {
          name,
          status: 'unavailable',
          message: 'Trademark search service could not be reached. Results may be available on retry.',
          results: [],
        }
      }
      const hasExact = search.results.some((r) => {
        const markText = (r.markText || r.mark_text || r.wordmark || '').toLowerCase()
        return markText === name.toLowerCase()
      })
      return {
        name,
        status: hasExact ? 'conflict' : (search.total > 0 ? 'possible' : 'clear'),
        total_results: search.total,
        top_results: search.results.slice(0, 5).map((r) => ({
          mark: r.markText || r.mark_text || r.wordmark || '',
          serial: r.serialNumber || r.serial_number || '',
          status: r.status || '',
          owner: r.owner || '',
        })),
      }
    })
  )

  await updateReportStatus(env, reportId, 'complete', {
    names: results,
    checked_at: Math.floor(Date.now() / 1000),
  })
}

// ── Row serializers ────────────────────────────────────────────────────────

function rowToSession(row) {
  let metadata = null
  try { metadata = JSON.parse(row.metadata_json || 'null') } catch { metadata = null }
  return {
    id: row.id,
    name: row.name,
    session_type: row.session_type,
    status: row.status,
    metadata: metadata || {},
    report_count: typeof row.report_count === 'number' ? row.report_count : 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function rowToReport(row) {
  let input = null
  let result = null
  try { input = JSON.parse(row.input_json || 'null') } catch { input = null }
  try { result = JSON.parse(row.result_json || 'null') } catch { result = null }
  return {
    id: row.id,
    report_type: row.report_type,
    status: row.status,
    input: input || {},
    result: result || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}
