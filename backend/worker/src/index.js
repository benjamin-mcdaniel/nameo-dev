// ── Nameo main Worker ─────────────────────────────────────────────────────────
//
// Entry point. Handles:
//   - CORS preflight
//   - Auth0 JWT verification
//   - Route dispatch (public routes → auth routes → session/report routes)
//
// Heavy lifting lives in:
//   lib/checks.js      — URL-status availability checks + orchestrator call
//   lib/db.js          — report status updates + runner dispatch
//   runners/*.js       — one file per report type

import leoProfanity from 'leo-profanity'
import { createRemoteJWKSet, jwtVerify } from 'jose'

import { json, CORS_HEADERS }            from './lib/json.js'
import { runChecksForName }              from './lib/checks.js'
import { executeAllPendingReports, runSessionReport } from './lib/db.js'

let PROFANITY_READY = false
let JWKS_CACHE      = null

const DEFAULT_DAILY_GLOBAL_LIMIT = 5000
const DEFAULT_DAILY_IP_LIMIT     = 5000

// ── Main fetch handler ────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env, ctx)
    } catch (err) {
      console.error('Unhandled worker error:', err?.message ?? err)
      return new Response(
        JSON.stringify({ error: 'internal_server_error', message: err?.message ?? 'Unknown error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      )
    }
  },
}

async function handleRequest(request, env, ctx) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS })
      }

      // ── Public routes (no auth) ─────────────────────────────────────────────

      if (url.pathname === '/api/health' && request.method === 'GET') {
        return handleHealth(env)
      }
      if (url.pathname === '/api/check' && request.method === 'GET') {
        return handleCheck(request, url, env)
      }
      if (url.pathname === '/api/suggestions' && request.method === 'GET') {
        return handleSuggestions(request, url, env)
      }

      // ── Authenticated routes ────────────────────────────────────────────────

      const authResult = await verifyAuth0Token(request, env)
      if (!authResult.ok || !authResult.sub) {
        return json({ error: 'unauthorized' }, 401)
      }
      const user = await getOrCreateUser(env, authResult.sub, authResult.email || null)
      if (!user) return json({ error: 'user_init_failed' }, 500)

      if (url.pathname === '/api/me' && request.method === 'GET') {
        return handleGetMe(env, user)
      }
      if (url.pathname === '/api/account' && request.method === 'DELETE') {
        return handleDeleteAccount(env, user.id)
      }
      if (url.pathname === '/api/test-orchestrator' && request.method === 'GET') {
        return handleTestOrchestrator(url, env)
      }

      // Legacy routes (kept for backward compat, not surfaced in UI)
      if (url.pathname === '/api/campaigns' && request.method === 'GET')  return handleListCampaigns(env, user.id)
      if (url.pathname === '/api/campaigns' && request.method === 'POST') return handleCreateCampaign(request, env, user.id)
      if (url.pathname === '/api/search-history' && request.method === 'GET')    return handleListSearchHistory(env, user.id)
      if (url.pathname === '/api/search-history' && request.method === 'POST')   return handleAddSearchHistory(request, env, user.id)
      if (url.pathname === '/api/search-history' && request.method === 'DELETE') return handleDeleteSearchHistory(url, env, user.id)
      if (url.pathname === '/api/advanced-reports' && request.method === 'GET')  return handleListAdvancedReports(url, env, user.id)
      if (url.pathname === '/api/advanced-reports' && request.method === 'POST') return handleCreateAdvancedReport(request, env, user.id)

      const advancedReportMatch  = url.pathname.match(/^\/api\/advanced-reports\/([^/]+)$/)
      if (advancedReportMatch && request.method === 'GET') return handleGetAdvancedReport(env, user.id, advancedReportMatch[1])

      const campaignOptionsMatch = url.pathname.match(/^\/api\/campaigns\/([^/]+)\/options$/)
      if (campaignOptionsMatch && request.method === 'POST') return handleCreateOption(request, env, user.id, campaignOptionsMatch[1])

      const optionCheckMatch = url.pathname.match(/^\/api\/options\/([^/]+)\/check$/)
      if (optionCheckMatch && request.method === 'POST') return handleCheckOption(env, user.id, optionCheckMatch[1])

      // ── Sessions (v1 workflow) ──────────────────────────────────────────────

      if (url.pathname === '/api/sessions' && request.method === 'GET')  return handleListSessions(env, user.id)
      if (url.pathname === '/api/sessions' && request.method === 'POST') return handleCreateSession(request, env, user.id, ctx)

      const sessionMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)$/)
      if (sessionMatch) {
        const sessionId = sessionMatch[1]
        if (request.method === 'GET')    return handleGetSession(env, user.id, sessionId)
        if (request.method === 'DELETE') return handleDeleteSession(env, user.id, sessionId)
      }

      const sessionReportsMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/reports$/)
      if (sessionReportsMatch) {
        const sessionId = sessionReportsMatch[1]
        if (request.method === 'GET')  return handleListSessionReports(env, user.id, sessionId)
        if (request.method === 'POST') return handleCreateSessionReport(request, env, user.id, sessionId)
      }

      const sessionReportMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/reports\/([^/]+)$/)
      if (sessionReportMatch && request.method === 'GET') {
        return handleGetSessionReport(env, user.id, sessionReportMatch[1], sessionReportMatch[2])
      }

      const reportRunMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/reports\/([^/]+)\/run$/)
      if (reportRunMatch && request.method === 'POST') {
        return handleRunReport(env, ctx, user.id, reportRunMatch[1], reportRunMatch[2])
      }

      return json({ error: 'not_found' }, 404)
    }

    return new Response('OK')
}

// ── Rate limiting ─────────────────────────────────────────────────────────────

function getDailyGlobalLimit(env) {
  const raw = Number(env.DAILY_CHECK_LIMIT || env.RATE_LIMIT_DAILY_GLOBAL || DEFAULT_DAILY_GLOBAL_LIMIT)
  return Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : DEFAULT_DAILY_GLOBAL_LIMIT
}

function getDailyIpLimit(env) {
  const raw = Number(env.RATE_LIMIT_DAILY_IP || DEFAULT_DAILY_IP_LIMIT)
  return Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : DEFAULT_DAILY_IP_LIMIT
}

function utcDayKey(nowMs) {
  try { return new Date(nowMs).toISOString().slice(0, 10) } catch { return 'unknown-day' }
}

function secondsUntilNextUtcDay(nowMs) {
  try {
    const d    = new Date(nowMs)
    const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1))
    return Math.max(1, Math.floor((next.getTime() - nowMs) / 1000))
  } catch { return 3600 }
}

async function sha256Hex(input) {
  const data  = new TextEncoder().encode(String(input || ''))
  const hash  = await crypto.subtle.digest('SHA-256', data)
  const bytes = Array.from(new Uint8Array(hash))
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function getClientIp(request) {
  const cf  = request.headers.get('cf-connecting-ip')
  if (cf) return cf
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return ''
}

async function incrementCounter(db, key, nowSeconds) {
  try {
    const row = await db
      .prepare('INSERT INTO rate_limits (key, count, updated_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at RETURNING count')
      .bind(key, nowSeconds)
      .first()
    const count = row && typeof row.count === 'number' ? row.count : null
    if (typeof count === 'number') return count
  } catch { /* fall through */ }

  await db
    .prepare('INSERT INTO rate_limits (key, count, updated_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1, updated_at = ?')
    .bind(key, nowSeconds, nowSeconds)
    .run()
  const row   = await db.prepare('SELECT count FROM rate_limits WHERE key = ?').bind(key).first()
  return row && typeof row.count === 'number' ? row.count : 0
}

async function enforcePublicApiLimits(request, env, kind) {
  const db = env.NAMEO_DB
  if (!db) return { ok: true }

  const nowMs       = Date.now()
  const nowSeconds  = Math.floor(nowMs / 1000)
  const day         = utcDayKey(nowMs)
  const globalLimit = getDailyGlobalLimit(env)
  const ipLimit     = getDailyIpLimit(env)

  if (globalLimit === 0 || ipLimit === 0) {
    return { ok: false, reason: 'disabled', retryAfter: secondsUntilNextUtcDay(nowMs) }
  }

  const ip      = getClientIp(request)
  const ipHash  = ip ? await sha256Hex(ip) : 'noip'
  const globalKey = `rl:${kind}:global:${day}`
  const ipKey     = `rl:${kind}:ip:${day}:${ipHash}`

  const globalCount = await incrementCounter(db, globalKey, nowSeconds)
  if (globalCount > globalLimit) return { ok: false, reason: 'global_cap', retryAfter: secondsUntilNextUtcDay(nowMs) }

  const ipCount = await incrementCounter(db, ipKey, nowSeconds)
  if (ipCount > ipLimit) return { ok: false, reason: 'ip_cap', retryAfter: secondsUntilNextUtcDay(nowMs) }

  return { ok: true }
}

// ── Public API handlers ───────────────────────────────────────────────────────

async function handleCheck(request, url, env) {
  const limit = await enforcePublicApiLimits(request, env, 'check')
  if (!limit.ok) {
    return json({ status: 'rate_limited', reason: limit.reason, message: 'Search is temporarily disabled.' }, 429, {
      'Retry-After': String(limit.retryAfter || 3600),
    })
  }

  const rawName = url.searchParams.get('name')?.trim() || ''
  const name    = rawName.replace(/\s+/g, '')
  const debug   = url.searchParams.get('debug') === '1'
  const safetyConfig = await loadSafetyConfig(env)

  const turnstileOk = await verifyTurnstile(env, url.searchParams.get('cf_turnstile_token') || '')
  if (!turnstileOk) return json({ status: 'captcha_failed' }, 400)

  const safety = await evaluateNameSafety(name, safetyConfig)
  if (!safety.ok) return json({ status: 'unsafe', reason: safety.reason, message: safety.message }, 400)

  if (!name) return json({ status: 'error', error: 'missing_name' }, 400)

  const results = await runChecksForName(env, name, null, debug)
  return json({ status: 'ok', name, results })
}

async function handleHealth(env) {
  return json({ status: 'ok', worker: { healthy: true } })
}

async function handleTestOrchestrator(url, env) {
  const name = url.searchParams.get('name')?.trim() || 'healthtest'
  const orchestratorUrl = env.ORCHESTRATOR_URL || ''
  const token           = env.ORCHESTRATOR_TOKEN || ''
  if (!orchestratorUrl || !token) {
    return json({ status: 'orchestrator_disabled', message: 'ORCHESTRATOR_URL and ORCHESTRATOR_TOKEN are not configured.', name })
  }
  // Falls back to runChecksForName which will call the orchestrator internally
  const results = await runChecksForName(env, name, null)
  return json({ status: 'ok', name, results })
}

async function handleSuggestions(request, url, env) {
  const limit = await enforcePublicApiLimits(request, env, 'suggestions')
  if (!limit.ok) {
    return json({ status: 'rate_limited', reason: limit.reason, message: 'Suggestions are temporarily disabled.' }, 429, {
      'Retry-After': String(limit.retryAfter || 3600),
    })
  }
  const name         = url.searchParams.get('name')?.trim() || ''
  const safetyConfig = await loadSafetyConfig(env)
  const baseSafety   = await evaluateNameSafety(name, safetyConfig)
  if (!baseSafety.ok) return json({ status: 'unsafe', reason: baseSafety.reason, message: baseSafety.message }, 400)
  const suggestions = generateSuggestions(name, safetyConfig)
  return json({ status: 'ok', name, suggestions })
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function verifyTurnstile(env, token) {
  if (!env.TURNSTILE_SECRET) return true
  if (!token) return true
  const formData = new FormData()
  formData.append('secret', env.TURNSTILE_SECRET)
  formData.append('response', token)
  const res  = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: formData })
  const data = await res.json().catch(() => ({}))
  return !!data.success
}

async function verifyAuth0Token(request, env) {
  const authHeader = request.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) return { ok: false }
  const token = authHeader.slice(7)
  try {
    const domain   = env.AUTH0_DOMAIN || ''
    const audience = env.AUTH0_AUDIENCE || ''
    if (!domain) return { ok: false, reason: 'auth0_not_configured' }
    if (!JWKS_CACHE) {
      JWKS_CACHE = createRemoteJWKSet(new URL(`https://${domain}/.well-known/jwks.json`))
    }
    const { payload } = await jwtVerify(token, JWKS_CACHE, { issuer: `https://${domain}/`, audience })
    return { ok: true, sub: payload.sub, email: payload.email || payload['https://nameo.app/email'] || null }
  } catch {
    return { ok: false }
  }
}

async function getOrCreateUser(env, sub, email) {
  const db = env.NAMEO_DB
  if (!db) return null
  const existing = await db.prepare('SELECT id, email, tier, created_at FROM users WHERE id = ?').bind(sub).first()
  if (existing) return { id: existing.id, email: existing.email, tier: existing.tier || 'beta', created_at: existing.created_at }
  const now = Math.floor(Date.now() / 1000)
  await db.prepare('INSERT INTO users (id, email, tier, created_at) VALUES (?, ?, ?, ?)').bind(sub, email, 'beta', now).run()
  return { id: sub, email, tier: 'beta', created_at: now }
}

// ── Safety ────────────────────────────────────────────────────────────────────

async function loadSafetyConfig(env) {
  const config = await import('../../../config/safety.json', { assert: { type: 'json' } })
  return config.default || config
}

async function evaluateNameSafety(name, safetyConfig) {
  if (!name) return { ok: false, reason: 'empty', message: 'Name is required.' }
  const cfg     = safetyConfig || {}
  const minLen  = cfg.minLength || 3
  const maxLen  = cfg.maxLength || 32
  const pattern = cfg.allowedPattern ? new RegExp(cfg.allowedPattern) : null
  const banned  = Array.isArray(cfg.bannedSubstrings) ? cfg.bannedSubstrings : []
  if (name.length < minLen) return { ok: false, reason: 'too_short',    message: `Name must be at least ${minLen} characters.` }
  if (name.length > maxLen) return { ok: false, reason: 'too_long',     message: `Name must be ${maxLen} characters or fewer.` }
  if (pattern && !pattern.test(name)) return { ok: false, reason: 'invalid_chars', message: 'Name contains invalid characters.' }
  const lower = name.toLowerCase()
  for (const sub of banned) {
    if (lower.includes(sub.toLowerCase())) return { ok: false, reason: 'banned', message: 'That name is not allowed.' }
  }
  try {
    if (!PROFANITY_READY) { leoProfanity.loadDictionary(); PROFANITY_READY = true }
    if (leoProfanity.check(lower)) return { ok: false, reason: 'profanity', message: 'That name is not allowed.' }
  } catch { /* allow through */ }
  return { ok: true }
}

function generateSuggestions(name, safetyConfig) {
  if (!name || name.length < 2) return []
  const suggestions = []
  const prefixes = ['get', 'try', 'use', 'go', 'my']
  const suffixes = ['app', 'hq', 'io', 'ai', 'hub', 'lab', 'co']
  for (const p of prefixes) suggestions.push(p + name)
  for (const s of suffixes) suggestions.push(name + s)
  return suggestions.slice(0, 8)
}

// ── Authenticated handler: Me / Account ───────────────────────────────────────

async function handleGetMe(env, user) {
  const db = env.NAMEO_DB
  let sessionCount = 0
  if (db) {
    const row = await db.prepare('SELECT COUNT(*) AS cnt FROM sessions WHERE user_id = ?').bind(user.id).first()
    sessionCount = row?.cnt ?? 0
  }
  return json({ id: user.id, email: user.email, tier: user.tier || 'beta', created_at: user.created_at, session_count: sessionCount })
}

async function handleDeleteAccount(env, userId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)
  await db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run()
  return json({ status: 'deleted' })
}

// ── Sessions ──────────────────────────────────────────────────────────────────

async function handleListSessions(env, userId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)
  const result = await db.prepare(`
    SELECT s.id, s.name, s.session_type, s.status, s.metadata_json, s.created_at, s.updated_at,
           COUNT(r.id) AS report_count
    FROM sessions s
    LEFT JOIN session_reports r ON r.session_id = s.id
    WHERE s.user_id = ?
    GROUP BY s.id
    ORDER BY s.created_at DESC
    LIMIT 50
  `).bind(userId).all()
  return json({ sessions: (result.results || []).map(rowToSession) })
}

async function handleCreateSession(request, env, userId, ctx) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)
  let body = {}
  try { body = await request.json() } catch { return json({ error: 'invalid_json' }, 400) }

  const name        = (body.name || '').trim()
  if (!name) return json({ error: 'name_required' }, 400)

  const sessionType = (body.session_type || '').trim()
  if (!['brand_identity', 'name_generator'].includes(sessionType)) {
    return json({ error: 'invalid_session_type', valid: ['brand_identity', 'name_generator'] }, 400)
  }

  const id       = crypto.randomUUID()
  const now      = Math.floor(Date.now() / 1000)
  const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : {}

  try {
    await db.prepare('INSERT INTO sessions (id, user_id, name, session_type, status, metadata_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, userId, name, sessionType, 'active', JSON.stringify(metadata), now, now)
      .run()
  } catch (err) {
    return json({ error: 'db_insert_failed', message: err?.message }, 500)
  }

  // Auto-create pending reports
  if (sessionType === 'brand_identity' && Array.isArray(metadata.report_types)) {
    const validReportTypes = ['domain_availability', 'trademark', 'products_for_sale', 'social_handles', 'app_store']
    for (const reportType of metadata.report_types.filter((t) => validReportTypes.includes(t))) {
      const rid = crypto.randomUUID()
      try {
        await db.prepare('INSERT INTO session_reports (id, session_id, report_type, status, input_json, result_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(rid, id, reportType, 'pending', JSON.stringify({ brand_names: metadata.brand_names || [] }), null, now, now)
          .run()
      } catch { /* non-fatal */ }
    }
  }

  if (sessionType === 'name_generator') {
    const rid = crypto.randomUUID()
    try {
      await db.prepare('INSERT INTO session_reports (id, session_id, report_type, status, input_json, result_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(rid, id, 'questionnaire', 'pending', JSON.stringify(metadata), null, now, now)
        .run()
    } catch { /* non-fatal */ }
  }

  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(executeAllPendingReports(env, id))
  }

  return json({ id, name, session_type: sessionType, status: 'active', created_at: now }, 201)
}

async function handleGetSession(env, userId, sessionId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)
  const row = await db.prepare('SELECT id, name, session_type, status, metadata_json, created_at, updated_at FROM sessions WHERE id = ? AND user_id = ?')
    .bind(sessionId, userId).first()
  if (!row) return json({ error: 'not_found' }, 404)
  const reportsResult = await db.prepare('SELECT id, report_type, status, input_json, result_json, created_at, updated_at FROM session_reports WHERE session_id = ? ORDER BY created_at ASC')
    .bind(sessionId).all()
  return json({ session: rowToSession(row), reports: (reportsResult.results || []).map(rowToReport) })
}

async function handleDeleteSession(env, userId, sessionId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)
  const row = await db.prepare('SELECT id FROM sessions WHERE id = ? AND user_id = ?').bind(sessionId, userId).first()
  if (!row) return json({ error: 'not_found' }, 404)
  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run()
  return json({ status: 'deleted' })
}

async function handleListSessionReports(env, userId, sessionId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)
  const session = await db.prepare('SELECT id FROM sessions WHERE id = ? AND user_id = ?').bind(sessionId, userId).first()
  if (!session) return json({ error: 'not_found' }, 404)
  const result = await db.prepare('SELECT id, report_type, status, input_json, result_json, created_at, updated_at FROM session_reports WHERE session_id = ? ORDER BY created_at ASC')
    .bind(sessionId).all()
  return json({ reports: (result.results || []).map(rowToReport) })
}

async function handleCreateSessionReport(request, env, userId, sessionId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)
  const session = await db.prepare('SELECT id FROM sessions WHERE id = ? AND user_id = ?').bind(sessionId, userId).first()
  if (!session) return json({ error: 'not_found' }, 404)
  let body = {}
  try { body = await request.json() } catch { return json({ error: 'invalid_json' }, 400) }
  const reportType = (body.report_type || '').trim()
  const validTypes = ['domain_availability', 'trademark', 'products_for_sale', 'social_handles', 'app_store', 'questionnaire', 'name_candidates']
  if (!validTypes.includes(reportType)) return json({ error: 'invalid_report_type', valid: validTypes }, 400)
  const id        = crypto.randomUUID()
  const now       = Math.floor(Date.now() / 1000)
  const inputJson = body.input && typeof body.input === 'object' ? JSON.stringify(body.input) : null
  try {
    await db.prepare('INSERT INTO session_reports (id, session_id, report_type, status, input_json, result_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, sessionId, reportType, 'pending', inputJson, null, now, now).run()
  } catch (err) {
    return json({ error: 'db_insert_failed', message: err?.message }, 500)
  }
  return json({ id, session_id: sessionId, report_type: reportType, status: 'pending', created_at: now }, 201)
}

async function handleGetSessionReport(env, userId, sessionId, reportId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)
  const session = await db.prepare('SELECT id FROM sessions WHERE id = ? AND user_id = ?').bind(sessionId, userId).first()
  if (!session) return json({ error: 'not_found' }, 404)
  const row = await db.prepare('SELECT id, report_type, status, input_json, result_json, created_at, updated_at FROM session_reports WHERE id = ? AND session_id = ?')
    .bind(reportId, sessionId).first()
  if (!row) return json({ error: 'not_found' }, 404)
  return json({ report: rowToReport(row) })
}

async function handleRunReport(env, ctx, userId, sessionId, reportId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)
  const session = await db.prepare('SELECT id FROM sessions WHERE id = ? AND user_id = ?').bind(sessionId, userId).first()
  if (!session) return json({ error: 'not_found' }, 404)
  const report = await db.prepare('SELECT id, report_type, input_json FROM session_reports WHERE id = ? AND session_id = ?')
    .bind(reportId, sessionId).first()
  if (!report) return json({ error: 'not_found' }, 404)
  let input = null
  try { input = JSON.parse(report.input_json || 'null') } catch { input = null }
  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(runSessionReport(env, report.id, report.report_type, input))
  }
  return json({ ok: true, report_id: reportId, status: 'running' })
}

// ── Legacy route handlers (kept, not surfaced in UI) ─────────────────────────

async function handleListAdvancedReports(url, env, userId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)
  const rawLimit = Number(url.searchParams.get('limit') || 25)
  const limit    = Number.isFinite(rawLimit) ? Math.max(1, Math.min(50, rawLimit)) : 25
  const result   = await db.prepare('SELECT id, report_json, created_at, updated_at FROM advanced_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').bind(userId, limit).all()
  const items    = (result.results || []).map((row) => {
    let report = null
    try { report = JSON.parse(row.report_json || 'null') } catch { report = null }
    return { id: row.id, created_at: row.created_at, updated_at: row.updated_at, report: report || { id: row.id } }
  })
  return json({ items })
}

async function handleCreateAdvancedReport(request, env, userId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)
  let body = {}
  try { body = await request.json() } catch { return json({ error: 'invalid_json' }, 400) }
  const id  = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  const report = body.report_json && typeof body.report_json === 'object'
    ? { ...body.report_json, id, created_at: now, updated_at: now }
    : { id, project_type: (body.project_type || '').trim(), description: (body.description || '').trim(), seed: (body.seed || '').trim(), surfaces: body.surfaces || {}, status: 'stub', created_at: now, updated_at: now }
  try {
    await db.prepare('INSERT INTO advanced_reports (id, user_id, report_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').bind(id, userId, JSON.stringify(report), now, now).run()
  } catch (err) {
    return json({ error: 'db_insert_failed', message: err?.message }, 500)
  }
  return json({ id, created_at: now }, 201)
}

async function handleGetAdvancedReport(env, userId, reportId) {
  const db  = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)
  const id  = (reportId || '').trim()
  if (!id)  return json({ error: 'id_required' }, 400)
  const row = await db.prepare('SELECT id, report_json, created_at, updated_at FROM advanced_reports WHERE id = ? AND user_id = ?').bind(id, userId).first()
  if (!row) return json({ error: 'not_found' }, 404)
  let report = null
  try { report = JSON.parse(row.report_json || 'null') } catch { report = null }
  return json({ report: report || { id: row.id } })
}

async function handleListSearchHistory(env, userId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)
  const result = await db.prepare('SELECT id, name, status, searched_at FROM search_history WHERE user_id = ? ORDER BY searched_at DESC LIMIT 50').bind(userId).all()
  return json({ items: result.results || [] })
}

async function handleAddSearchHistory(request, env, userId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)
  let body = {}
  try { body = await request.json() } catch { return json({ error: 'invalid_json' }, 400) }
  const name   = (body.name || '').trim()
  if (!name)   return json({ error: 'name_required' }, 400)
  const status = (body.status || 'partial').trim()
  const id     = crypto.randomUUID()
  const searchedAt = Math.floor(Date.now() / 1000)
  await db.prepare('INSERT INTO search_history (id, user_id, name, status, searched_at) VALUES (?, ?, ?, ?, ?)').bind(id, userId, name, status, searchedAt).run()
  return json({ id, name, status, searched_at: searchedAt }, 201)
}

async function handleDeleteSearchHistory(url, env, userId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)
  const name = url.searchParams.get('name')?.trim() || ''
  if (!name) return json({ error: 'name_required' }, 400)
  await db.prepare('DELETE FROM search_history WHERE user_id = ? AND name = ?').bind(userId, name).run()
  return json({ status: 'deleted' })
}

async function handleListCampaigns(env, userId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)
  const result = await db.prepare('SELECT id, name, description, created_at, updated_at FROM campaigns WHERE user_id = ? ORDER BY created_at DESC').bind(userId).all()
  return json({ campaigns: result.results || [] })
}

async function handleCreateCampaign(request, env, userId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)
  let body = {}
  try { body = await request.json() } catch { return json({ error: 'invalid_json' }, 400) }
  const name        = (body.name || '').trim()
  if (!name) return json({ error: 'name_required' }, 400)
  const description = (body.description || '').trim() || null
  const id  = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  await db.prepare('INSERT INTO campaigns (id, user_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, userId, name, description, now, now).run()
  return json({ id, name, description, created_at: now, updated_at: now }, 201)
}

async function handleCreateOption(request, env, userId, campaignId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)
  const campaign = await db.prepare('SELECT id FROM campaigns WHERE id = ? AND user_id = ?').bind(campaignId, userId).first()
  if (!campaign) return json({ error: 'campaign_not_found' }, 404)
  let body = {}
  try { body = await request.json() } catch { return json({ error: 'invalid_json' }, 400) }
  const name = (body.name || '').trim()
  if (!name) return json({ error: 'name_required' }, 400)
  const id  = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  await db.prepare('INSERT INTO options (id, campaign_id, name, created_at) VALUES (?, ?, ?, ?)').bind(id, campaignId, name, now).run()
  return json({ id, campaign_id: campaignId, name, created_at: now }, 201)
}

async function handleCheckOption(env, userId, optionId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)
  const row = await db.prepare('SELECT o.id, o.name, o.campaign_id FROM options o JOIN campaigns c ON o.campaign_id = c.id WHERE o.id = ? AND c.user_id = ?').bind(optionId, userId).first()
  if (!row) return json({ error: 'option_not_found' }, 404)
  const safetyConfig = await loadSafetyConfig(env)
  const safety       = await evaluateNameSafety(row.name, safetyConfig)
  if (!safety.ok) return json({ status: 'unsafe', reason: safety.reason, message: safety.message }, 400)
  const results    = await runChecksForName(env, row.name, userId)
  const checkedAt  = Math.floor(Date.now() / 1000)
  const checkId    = crypto.randomUUID()
  await db.prepare('INSERT INTO option_checks (id, option_id, checked_at, services_json) VALUES (?, ?, ?, ?)').bind(checkId, optionId, checkedAt, JSON.stringify(results)).run()
  return json({ status: 'ok', option_id: optionId, checked_at: checkedAt, results })
}

// ── Row serialisers ───────────────────────────────────────────────────────────

function rowToSession(row) {
  let metadata = null
  try { metadata = JSON.parse(row.metadata_json || 'null') } catch { metadata = null }
  return {
    id:           row.id,
    name:         row.name,
    session_type: row.session_type,
    status:       row.status,
    metadata:     metadata || {},
    report_count: typeof row.report_count === 'number' ? row.report_count : 0,
    created_at:   row.created_at,
    updated_at:   row.updated_at,
  }
}

function rowToReport(row) {
  let input  = null
  let result = null
  try { input  = JSON.parse(row.input_json  || 'null') } catch { input  = null }
  try { result = JSON.parse(row.result_json || 'null') } catch { result = null }
  return {
    id:          row.id,
    report_type: row.report_type,
    status:      row.status,
    input:       input  || {},
    result:      result || null,
    created_at:  row.created_at,
    updated_at:  row.updated_at,
  }
}
