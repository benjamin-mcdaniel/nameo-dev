// ── Trademark runner ──────────────────────────────────────────────────────────
//
// Queries USPTO's EFTS (full-text search) API.
// This endpoint is public but unofficial — it is the same API that powers
// the USPTO Trademark Search website UI.
//
// IMPORTANT: The response shape from this endpoint is not officially documented.
// If results stop coming through, the most likely causes are:
//   1. USPTO changed the EFTS endpoint URL or response format
//   2. Rate limiting (USPTO sometimes throttles headless requests)
//
// Upgrade path for v1.5+:
//   - Markify API (markify.com) — paid per query, very clean JSON, easiest swap
//   - Trademarkia API — similar
//   - USPTO TESS API (tsdr.uspto.gov) — more stable but complex query format
//
// Status values:
//   conflict    — exact mark match found
//   possible    — related marks exist but no exact match
//   clear       — no results returned
//   unavailable — upstream API could not be reached (frontend shows retry prompt)

import { updateReportStatus } from '../lib/report-status.js'

// Known working EFTS search endpoint as of 2026-04.
// The query format: `_all:"TERM"` scopes to all searchable fields.
const EFTS_SEARCH_URL = 'https://efts.uspto.gov/WEBAPIS/efts/search/results'

async function searchUSPTOTrademarks(term) {
  const params = new URLSearchParams({
    query:     `_all:"${term}"`,
    type:      'mark',
    searchType: 'free-form',
  })
  try {
    const res = await fetch(`${EFTS_SEARCH_URL}?${params}`, {
      headers: {
        Accept: 'application/json',
        // Mimic a browser origin — USPTO occasionally blocks non-browser UA
        'User-Agent': 'Mozilla/5.0',
      },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return { results: [], total: 0, available: false, error: `http_${res.status}` }
    const data = await res.json()
    // EFTS returns hits.hits[] (Elasticsearch format) or a results[] array
    const hits = data?.hits?.hits ?? data?.results ?? []
    const total = data?.hits?.total?.value ?? data?.total ?? hits.length
    return { results: hits, total, available: true }
  } catch (err) {
    return { results: [], total: 0, available: false, error: err?.message ?? 'fetch_failed' }
  }
}

function extractMarkText(hit) {
  // EFTS wraps source fields in _source; some endpoints return them flat
  const src = hit?._source ?? hit ?? {}
  return src.markText ?? src.mark_text ?? src.wordmark ?? src.mark ?? ''
}

export async function runTrademarkReport(env, reportId, input) {
  const rawNames   = input?.brand_names ?? []
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
          message: 'Trademark search service could not be reached. Try re-running this report.',
          top_results: [],
        }
      }

      const hasExact = search.results.some(
        (r) => extractMarkText(r).toLowerCase() === name.toLowerCase()
      )

      return {
        name,
        status: hasExact ? 'conflict' : (search.total > 0 ? 'possible' : 'clear'),
        total_results: search.total,
        top_results: search.results.slice(0, 5).map((r) => {
          const src = r?._source ?? r ?? {}
          return {
            mark:   extractMarkText(r),
            serial: src.serialNumber ?? src.serial_number ?? '',
            status: src.status ?? src.statusCode ?? '',
            owner:  src.owner ?? src.ownerName ?? '',
          }
        }),
      }
    })
  )

  await updateReportStatus(env, reportId, 'complete', {
    names: results,
    checked_at: Math.floor(Date.now() / 1000),
  })
}
