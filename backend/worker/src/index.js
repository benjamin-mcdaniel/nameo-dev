// Nameo v2 — main Worker
//
// Routes:
//   GET  /api/health
//   POST /api/sweep/init        — create sweep + Stripe Checkout
//   GET  /api/sweep/:id         — poll sweep status + results
//   GET  /api/sweep/:id/results — paginated available domains (after complete)
//   POST /api/stripe/webhook    — Stripe payment confirmation

import { json, CORS_HEADERS }    from './lib/json.js'
import { createCheckoutSession, verifyWebhookSignature } from './lib/stripe.js'
import { runSweepPipeline }      from './lib/sweep-pipeline.js'

// ── Default env values ────────────────────────────────────────────────────────
const DEFAULT_SWEEP_PRICE_CENTS = 2500   // $25
const DEFAULT_RATE_LIMIT_IP     = 10     // init calls per IP per day

// ── Entry point ───────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env, ctx)
    } catch (err) {
      console.error('Worker unhandled error:', err?.message)
      return json({ error: 'internal_server_error' }, 500)
    }
  },
}

async function handleRequest(request, env, ctx) {
  const url = new URL(request.url)

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  // ── Routes ──────────────────────────────────────────────────────────────────

  if (url.pathname === '/api/health' && request.method === 'GET') {
    return json({ status: 'ok' })
  }

  if (url.pathname === '/api/sweep/init' && request.method === 'POST') {
    return handleSweepInit(request, url, env)
  }

  if (url.pathname === '/api/stripe/webhook' && request.method === 'POST') {
    return handleStripeWebhook(request, env, ctx)
  }

  const sweepMatch = url.pathname.match(/^\/api\/sweep\/([a-f0-9-]+)$/)
  if (sweepMatch && request.method === 'GET') {
    return handleGetSweep(env, sweepMatch[1])
  }

  const resultsMatch = url.pathname.match(/^\/api\/sweep\/([a-f0-9-]+)\/results$/)
  if (resultsMatch && request.method === 'GET') {
    return handleGetResults(url, env, resultsMatch[1])
  }

  return json({ error: 'not_found' }, 404)
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleSweepInit(request, url, env) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)

  // Rate limit by IP (prevent sweep creation spam before payment)
  const ip      = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown'
  const limited = await checkRateLimit(db, `sweep_init:${ip}`, DEFAULT_RATE_LIMIT_IP)
  if (!limited.ok) return json({ error: 'rate_limited', message: 'Too many requests. Try again tomorrow.' }, 429)

  let body = {}
  try { body = await request.json() } catch { return json({ error: 'invalid_json' }, 400) }

  const seed  = String(body.seed  || '').trim().slice(0, 500)
  const email = String(body.email || '').trim().toLowerCase().slice(0, 254)

  if (!seed)  return json({ error: 'seed_required',  message: 'Describe your product.' }, 400)
  if (!email) return json({ error: 'email_required', message: 'Email required to receive your results.' }, 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'invalid_email' }, 400)

  const sweepId = crypto.randomUUID()
  const now     = Math.floor(Date.now() / 1000)

  await db.prepare(
    'INSERT INTO sweeps (id, email, seed, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(sweepId, email, seed, 'awaiting_payment', now, now).run()

  // Build Stripe Checkout session
  const secretKey  = env.STRIPE_SECRET_KEY
  if (!secretKey) {
    // Dev / staging mode — skip payment, start pipeline immediately
    await db.prepare('UPDATE sweeps SET status = ?, updated_at = ? WHERE id = ?')
      .bind('running', now, sweepId).run()
    // Fire pipeline async
    const pipelinePromise = runSweepPipeline(env, sweepId)
    // Note: in dev without ctx.waitUntil we just let it run (this path is test-only)
    return json({ sweep_id: sweepId, checkout_url: null, dev_mode: true })
  }

  const baseUrl   = env.APP_URL || `https://${new URL(request.url).hostname}`
  const successUrl = `${baseUrl}/#/sweep/${sweepId}?paid=1&session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl  = `${baseUrl}/#/?cancelled=1`
  const amountCents = Number(env.SWEEP_PRICE_CENTS || DEFAULT_SWEEP_PRICE_CENTS)

  let checkout
  try {
    checkout = await createCheckoutSession({
      secretKey,
      sweepId,
      email,
      successUrl,
      cancelUrl,
      amountCents,
    })
  } catch (err) {
    console.error('Stripe checkout error:', err?.message)
    // Clean up the sweep record on Stripe failure
    await db.prepare('DELETE FROM sweeps WHERE id = ?').bind(sweepId).run().catch(() => {})
    return json({ error: 'payment_init_failed', message: 'Could not start checkout. Try again.' }, 502)
  }

  // Store Stripe session ID
  await db.prepare('UPDATE sweeps SET stripe_session_id = ?, updated_at = ? WHERE id = ?')
    .bind(checkout.id, now, sweepId).run()

  return json({ sweep_id: sweepId, checkout_url: checkout.url }, 201)
}

async function handleStripeWebhook(request, env, ctx) {
  const sigHeader = request.headers.get('stripe-signature') || ''
  const rawBody   = await request.text()

  const valid = await verifyWebhookSignature(rawBody, sigHeader, env.STRIPE_WEBHOOK_SECRET || '')
  if (!valid) {
    console.warn('Stripe webhook: invalid signature')
    return json({ error: 'invalid_signature' }, 400)
  }

  let event
  try { event = JSON.parse(rawBody) } catch { return json({ error: 'invalid_json' }, 400) }

  if (event.type === 'checkout.session.completed') {
    const session = event.data?.object
    const sweepId = session?.metadata?.sweep_id
    if (!sweepId) return json({ ok: true })

    const db  = env.NAMEO_DB
    const now = Math.floor(Date.now() / 1000)

    // Mark running and kick off pipeline
    await db.prepare('UPDATE sweeps SET status = ?, updated_at = ? WHERE id = ? AND status = ?')
      .bind('running', now, sweepId, 'awaiting_payment').run()

    ctx.waitUntil(runSweepPipeline(env, sweepId))
  }

  return json({ ok: true })
}

async function handleGetSweep(env, sweepId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)

  const row = await db.prepare(
    'SELECT id, seed, status, total_candidates, checked_count, available_count, error_message, created_at, updated_at FROM sweeps WHERE id = ?'
  ).bind(sweepId).first()

  if (!row) return json({ error: 'not_found' }, 404)

  // Don't expose email in polling responses
  return json({
    id:               row.id,
    seed:             row.seed,
    status:           row.status,
    total_candidates: row.total_candidates,
    checked_count:    row.checked_count,
    available_count:  row.available_count,
    error_message:    row.error_message ?? null,
    created_at:       row.created_at,
    updated_at:       row.updated_at,
    progress_pct:     row.total_candidates > 0
                        ? Math.floor((row.checked_count / row.total_candidates) * 100)
                        : 0,
  })
}

async function handleGetResults(url, env, sweepId) {
  const db = env.NAMEO_DB
  if (!db) return json({ error: 'db_not_configured' }, 500)

  // Verify sweep exists
  const sweep = await db.prepare('SELECT id, status FROM sweeps WHERE id = ?').bind(sweepId).first()
  if (!sweep) return json({ error: 'not_found' }, 404)

  const limit  = Math.min(200, Math.max(1, Number(url.searchParams.get('limit')  || 100)))
  const offset = Math.max(0,              Number(url.searchParams.get('offset') || 0))
  const filter = url.searchParams.get('status') || 'available'  // available | taken | unknown | all

  const statusClause = filter === 'all'
    ? ''
    : `AND status = '${filter.replace(/'/g, "''")}'`

  const rows = await db.prepare(
    `SELECT domain, name, tld, status, checked_at
     FROM sweep_results
     WHERE sweep_id = ? ${statusClause}
     ORDER BY
       CASE status WHEN 'available' THEN 0 WHEN 'unknown' THEN 1 ELSE 2 END,
       LENGTH(name),
       name
     LIMIT ? OFFSET ?`
  ).bind(sweepId, limit, offset).all()

  const total = await db.prepare(
    `SELECT COUNT(*) AS cnt FROM sweep_results WHERE sweep_id = ? ${statusClause}`
  ).bind(sweepId).first()

  return json({
    sweep_id: sweepId,
    status:   sweep.status,
    results:  rows.results || [],
    total:    total?.cnt ?? 0,
    limit,
    offset,
  })
}

// ── Rate limiting ─────────────────────────────────────────────────────────────

function utcDayKey() {
  return new Date().toISOString().slice(0, 10)
}

async function checkRateLimit(db, keyBase, limit) {
  const key = `${keyBase}:${utcDayKey()}`
  const now = Math.floor(Date.now() / 1000)
  try {
    const row = await db.prepare(
      'INSERT INTO rate_limits (key, count, updated_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1, updated_at = ? RETURNING count'
    ).bind(key, now, now).first()
    const count = row?.count ?? 1
    return { ok: count <= limit, count }
  } catch {
    return { ok: true }  // fail open on DB error
  }
}
