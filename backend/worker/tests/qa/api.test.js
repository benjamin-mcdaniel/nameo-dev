/**
 * QA tests — hit the live deployed worker.
 *
 * Required env vars:
 *   WORKER_URL      Base URL of the deployed worker, e.g. https://nameo-worker.xyz.workers.dev
 *
 * Optional env vars:
 *   QA_API_TOKEN    Valid Auth0 bearer token — enables authenticated route tests.
 *                   Without it, only public endpoint tests run.
 *
 * Run with:
 *   WORKER_URL=https://... npx vitest run --config vitest.qa.config.js
 */

import { describe, it, expect, beforeAll } from 'vitest'

const BASE_URL = process.env.WORKER_URL?.replace(/\/$/, '')
const TOKEN    = process.env.QA_API_TOKEN || ''

// Skip entire suite cleanly if WORKER_URL not configured
if (!BASE_URL) {
  console.warn('[QA] WORKER_URL not set — skipping all QA tests')
}

async function get(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...opts.headers }
  if (TOKEN && opts.auth !== false) headers['Authorization'] = `Bearer ${TOKEN}`
  const res = await fetch(`${BASE_URL}${path}`, { method: 'GET', headers })
  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

async function post(path, data, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...opts.headers }
  if (TOKEN && opts.auth !== false) headers['Authorization'] = `Bearer ${TOKEN}`
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

async function del(path) {
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` }
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers })
  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

// Poll until all reports are no longer pending/running, or timeout
async function pollSession(sessionId, maxWaitMs = 20000) {
  const deadline = Date.now() + maxWaitMs
  while (Date.now() < deadline) {
    const { body } = await get(`/api/sessions/${sessionId}`)
    const reports = body?.reports ?? []
    const allDone = reports.length > 0 && reports.every(r => r.status === 'complete' || r.status === 'error')
    if (allDone) return body
    await new Promise(r => setTimeout(r, 2000))
  }
  throw new Error(`Session ${sessionId} did not complete within ${maxWaitMs}ms`)
}

// ── Public endpoint tests (no auth needed) ────────────────────────────────────

describe.skipIf(!BASE_URL)('Public endpoints', () => {
  it('GET /api/health returns 200 with status ok', async () => {
    const { status, body } = await get('/api/health', { auth: false })
    expect(status).toBe(200)
    expect(body.status).toBe('ok')
    expect(body.worker?.healthy).toBe(true)
  })

  it('GET /api/check?name=testbrand returns results array', async () => {
    const { status, body } = await get('/api/check?name=testbrand', { auth: false })
    // May be 200 (results) or 429 (rate limited) — both are valid live responses
    expect([200, 400, 429]).toContain(status)
    if (status === 200) {
      expect(body.status).toBe('ok')
      expect(Array.isArray(body.results)).toBe(true)
      expect(body.results.length).toBeGreaterThan(0)
      // Every result has a service id and a valid status string
      for (const r of body.results) {
        expect(typeof r.service).toBe('string')
        expect(['available', 'taken', 'unknown', 'coming_soon', 'error']).toContain(r.status)
      }
    }
  })

  it('GET /api/check with empty name returns 400 or rate-limited', async () => {
    const { status } = await get('/api/check?name=', { auth: false })
    expect([400, 429]).toContain(status)
  })

  it('GET /api/check without name param returns 400 or rate-limited', async () => {
    const { status } = await get('/api/check', { auth: false })
    expect([400, 429]).toContain(status)
  })

  it('unauthenticated request to /api/sessions returns 401', async () => {
    const { status } = await get('/api/sessions', { auth: false })
    expect(status).toBe(401)
  })

  it('unauthenticated request to /api/me returns 401', async () => {
    const { status } = await get('/api/me', { auth: false })
    expect(status).toBe(401)
  })

  it('unknown route returns non-200', async () => {
    const { status } = await get('/api/does-not-exist', { auth: false })
    expect(status).not.toBe(200)
  })
})

// ── Authenticated tests (require QA_API_TOKEN) ────────────────────────────────

describe.skipIf(!BASE_URL || !TOKEN)('Authenticated endpoints', () => {
  it('GET /api/me returns user object', async () => {
    const { status, body } = await get('/api/me')
    expect(status).toBe(200)
    expect(typeof body.id).toBe('string')
    expect(typeof body.email).toBe('string')
    expect(typeof body.tier).toBe('string')
  })

  it('GET /api/sessions returns sessions array', async () => {
    const { status, body } = await get('/api/sessions')
    expect(status).toBe(200)
    expect(Array.isArray(body.sessions)).toBe(true)
  })

  // Full session lifecycle: create → poll for completion → verify result shapes → delete
  it('brand identity session runs all reports and returns correct result shapes', async () => {
    // 1. Create session
    const { status: createStatus, body: created } = await post('/api/sessions', {
      name: `QA test ${Date.now()}`,
      session_type: 'brand_identity',
      metadata: {
        brand_names: ['testbrand'],
        report_types: ['domain_availability', 'app_store'],  // fast ones only for QA
      },
    })
    expect(createStatus).toBe(201)
    expect(typeof created.id).toBe('string')

    const sessionId = created.id

    try {
      // 2. Poll until done
      const session = await pollSession(sessionId)

      // 3. Verify report shapes
      const reports = session.reports ?? []
      expect(reports.length).toBeGreaterThan(0)

      for (const report of reports) {
        expect(['complete', 'error']).toContain(report.status)

        if (report.report_type === 'domain_availability' && report.status === 'complete') {
          expect(Array.isArray(report.result?.names)).toBe(true)
          expect(Array.isArray(report.result?.tlds)).toBe(true)
          const name = report.result.names[0]
          expect(name.name).toBe('testbrand')
          expect(typeof name.tlds['.com']).toBe('string')
        }

        if (report.report_type === 'app_store' && report.status === 'complete') {
          expect(Array.isArray(report.result?.names)).toBe(true)
          const name = report.result.names[0]
          expect(['conflict', 'possible', 'clear']).toContain(name.status)
          expect(Array.isArray(name.apps)).toBe(true)
        }
      }
    } finally {
      // 4. Cleanup regardless of test outcome
      await del(`/api/sessions/${sessionId}`)
    }
  })

  it('DELETE /api/sessions/:id removes the session', async () => {
    const { body: created } = await post('/api/sessions', {
      name: `QA delete test ${Date.now()}`,
      session_type: 'brand_identity',
      metadata: { brand_names: ['deleteme'], report_types: [] },
    })
    const { status } = await del(`/api/sessions/${created.id}`)
    expect(status).toBe(200)

    // Confirm it's gone
    const { status: getStatus } = await get(`/api/sessions/${created.id}`)
    expect(getStatus).toBe(404)
  })

  it('POST /api/sessions with invalid session_type returns 400', async () => {
    const { status } = await post('/api/sessions', {
      name: 'Bad session',
      session_type: 'not_a_real_type',
      metadata: {},
    })
    expect(status).toBe(400)
  })

  it('GET /api/sessions/:id for non-existent session returns 404', async () => {
    const { status } = await get('/api/sessions/00000000-0000-0000-0000-000000000000')
    expect(status).toBe(404)
  })
})
