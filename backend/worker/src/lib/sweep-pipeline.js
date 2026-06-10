// sweep-pipeline.js
//
// Async pipeline that runs after payment confirmation:
//   1. LLM director → structured directions
//   2. Algorithmic factory → candidate name list
//   3. Domain checker (batched DoH→RDAP) → availability results
//   4. D1 writes (progress updates + results)
//
// Called via ctx.waitUntil() so the response is already sent to the user.

import { getDirections }                from './llm-director.js'
import { generateCandidates, expandToDomainPairs, DEFAULT_TLDS } from './name-generator.js'
import { checkDomain }                  from './domain-checker.js'

const BATCH_SIZE   = 80    // concurrent domain checks per batch
const MAX_NAMES    = 1000  // max candidate names to generate

/**
 * Run the full sweep pipeline for a given sweep_id.
 * Updates D1 throughout. Never throws — catches all errors and marks sweep as errored.
 */
export async function runSweepPipeline(env, sweepId) {
  const db = env.NAMEO_DB
  if (!db) return

  const now = () => Math.floor(Date.now() / 1000)

  try {
    // ── 1. Load sweep record ─────────────────────────────────────────────────
    const sweep = await db
      .prepare('SELECT id, seed FROM sweeps WHERE id = ? AND status = ?')
      .bind(sweepId, 'running')
      .first()

    if (!sweep) return  // Already processed or wrong status

    const seedWords = sweep.seed
      .split(/[\s,]+/)
      .map(w => w.replace(/[^a-z0-9]/gi, '').toLowerCase())
      .filter(Boolean)

    // ── 2. LLM director phase ────────────────────────────────────────────────
    let directions = {}
    try {
      directions = await getDirections(sweep.seed, env.ANTHROPIC_API_KEY)
    } catch (err) {
      console.error('sweep-pipeline: LLM director failed, continuing with base generator', err?.message)
      // Non-fatal — fall through with empty directions
    }

    await db
      .prepare('UPDATE sweeps SET llm_directions_json = ?, updated_at = ? WHERE id = ?')
      .bind(JSON.stringify(directions), now(), sweepId)
      .run()

    // ── 3. Name generation phase ─────────────────────────────────────────────
    const candidates = generateCandidates(seedWords, directions, MAX_NAMES)
    const pairs      = expandToDomainPairs(candidates, DEFAULT_TLDS)
    const total      = pairs.length

    await db
      .prepare('UPDATE sweeps SET total_candidates = ?, updated_at = ? WHERE id = ?')
      .bind(total, now(), sweepId)
      .run()

    // ── 4. Domain checking phase (batched) ───────────────────────────────────
    let checked   = 0
    let available = 0

    for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
      const batch = pairs.slice(i, i + BATCH_SIZE)

      const settled = await Promise.allSettled(
        batch.map(async ({ name, tld }) => {
          const domain = `${name}${tld}`
          const status = await checkDomain(domain)
          return { name, tld, domain, status }
        })
      )

      // Bulk insert results
      const toInsert = settled
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)

      if (toInsert.length) {
        const batchNow = now()
        const stmt = db.prepare(
          'INSERT INTO sweep_results (id, sweep_id, domain, name, tld, status, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        const inserts = toInsert.map(({ name, tld, domain, status }) =>
          stmt.bind(crypto.randomUUID(), sweepId, domain, name, tld, status, batchNow)
        )
        await db.batch(inserts)

        checked   += toInsert.length
        available += toInsert.filter(r => r.status === 'available').length
      }

      // Update progress every batch
      await db
        .prepare('UPDATE sweeps SET checked_count = ?, available_count = ?, updated_at = ? WHERE id = ?')
        .bind(checked, available, now(), sweepId)
        .run()
    }

    // ── 5. Mark complete ─────────────────────────────────────────────────────
    await db
      .prepare('UPDATE sweeps SET status = ?, checked_count = ?, available_count = ?, updated_at = ? WHERE id = ?')
      .bind('complete', checked, available, now(), sweepId)
      .run()

  } catch (err) {
    console.error('sweep-pipeline: fatal error', err?.message)
    try {
      await db
        .prepare('UPDATE sweeps SET status = ?, error_message = ?, updated_at = ? WHERE id = ?')
        .bind('error', String(err?.message ?? err).slice(0, 500), now(), sweepId)
        .run()
    } catch { /* ignore secondary failure */ }
  }
}
