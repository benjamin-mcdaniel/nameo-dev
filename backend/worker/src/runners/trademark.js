// ── Trademark runner ──────────────────────────────────────────────────────────
//
// STATUS: STUBBED FOR TESTING
//
// The real implementation queries USPTO EFTS but that API is blocked from
// Cloudflare edge IPs. The stub returns realistic data shapes so the full
// session → report → display pipeline can be tested end-to-end.
//
// To restore real lookups, replace runTrademarkReport with the commented-out
// implementation below and set env.TRADEMARK_STUB = "" (falsy).
//
// Upgrade path for real data:
//   - Markify API (markify.com) — paid per query, easiest swap
//   - Trademarkia API           — similar, also paid
//   - USPTO TESS TSDR API       — free, stable, but more complex query format
//
// Status values:
//   conflict    — exact mark match found
//   possible    — related marks exist but no exact match
//   clear       — no results
//   unavailable — upstream unreachable

import { updateReportStatus } from '../lib/report-status.js'

export async function runTrademarkReport(env, reportId, input) {
  const rawNames   = input?.brand_names ?? []
  const brandNames = rawNames
    .map((n) => String(n || '').trim().replace(/[^a-zA-Z0-9 -]/g, ''))
    .filter(Boolean)

  if (!brandNames.length) {
    await updateReportStatus(env, reportId, 'error', { error: 'no_brand_names' })
    return
  }

  // Stub: simulate a quick network delay then return shape-correct data.
  // Deterministic: names <= 4 chars get "possible" (short names are crowded),
  // everything else gets "clear". Adjust as needed for demos.
  await new Promise((r) => setTimeout(r, 400))

  const names = brandNames.map((name) => {
    const isShort = name.replace(/\s/g, '').length <= 4
    if (isShort) {
      return {
        name,
        status: 'possible',
        total_results: 3,
        top_results: [
          { mark: name.toUpperCase() + ' SOLUTIONS', serial: '90000001', status: 'REGISTERED', owner: 'Example Corp' },
          { mark: name.toUpperCase() + ' LABS',      serial: '90000002', status: 'REGISTERED', owner: 'Labs Inc' },
          { mark: name.toUpperCase() + ' TECH',      serial: '90000003', status: 'ABANDONED',  owner: 'Old Co' },
        ],
      }
    }
    return {
      name,
      status: 'clear',
      total_results: 0,
      top_results: [],
    }
  })

  await updateReportStatus(env, reportId, 'complete', {
    names,
    checked_at: Math.floor(Date.now() / 1000),
    stub: true,   // tells frontend/QA this came from the stub
  })
}

// ── Real USPTO implementation (restore when edge IP issue is resolved) ────────
//
// const EFTS_SEARCH_URL = 'https://efts.uspto.gov/WEBAPIS/efts/search/results'
//
// async function searchUSPTOTrademarks(term) {
//   const params = new URLSearchParams({
//     query: `_all:"${term}"`, type: 'mark', searchType: 'free-form',
//   })
//   try {
//     const res = await fetch(`${EFTS_SEARCH_URL}?${params}`, {
//       headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
//       signal: AbortSignal.timeout(12000),
//     })
//     if (!res.ok) return { results: [], total: 0, available: false, error: `http_${res.status}` }
//     const data = await res.json()
//     const hits  = data?.hits?.hits ?? data?.results ?? []
//     const total = data?.hits?.total?.value ?? data?.total ?? hits.length
//     return { results: hits, total, available: true }
//   } catch (err) {
//     return { results: [], total: 0, available: false, error: err?.message ?? 'fetch_failed' }
//   }
// }
