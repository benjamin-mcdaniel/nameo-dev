// ── Products for Sale runner ──────────────────────────────────────────────────
//
// Uses Amazon's public search-suggestion endpoint (no key required).
// NOTE: This endpoint is undocumented and may become rate-limited or blocked
// from Cloudflare Workers. If it starts returning empty results consistently,
// swap to the eBay Finding API (free app ID at developer.ebay.com).
//
// eBay fallback endpoint when ready:
//   https://svcs.ebay.com/services/search/FindingService/v1
//   ?OPERATION-NAME=findItemsByKeywords
//   &SERVICE-VERSION=1.0.0
//   &SECURITY-APPNAME={APP_ID}
//   &RESPONSE-DATA-FORMAT=JSON
//   &keywords={NAME}
//   &paginationInput.entriesPerPage=10
//
// Match logic:
//   conflict  — suggestion value exactly matches brand name
//   possible  — suggestion value contains brand name (starts-with or anywhere)
//   clear     — no matching suggestions

import { updateReportStatus } from '../lib/report-status.js'

async function searchAmazonProducts(term) {
  const url = `https://completion.amazon.com/api/2017/suggestions?mid=ATVPDKIKX0DER&alias=aps&prefix=${encodeURIComponent(term)}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.suggestions || []).map((s) => ({ value: s.value || '' }))
  } catch {
    return []
  }
}

export async function runProductsForSaleReport(env, reportId, input) {
  const rawNames   = input?.brand_names ?? []
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
      const nameLower   = name.toLowerCase()
      const matches = suggestions.filter((s) => {
        const val = s.value.toLowerCase()
        return val === nameLower || val.startsWith(nameLower + ' ') || val.includes(nameLower)
      })
      const hasExactConflict = matches.some((m) => m.value.toLowerCase() === nameLower)
      return {
        name,
        suggestions: matches.slice(0, 8).map((m) => m.value),
        total_suggestions: suggestions.length,
        status: hasExactConflict ? 'conflict' : (matches.length ? 'possible' : 'clear'),
      }
    })
  )

  await updateReportStatus(env, reportId, 'complete', {
    names: results,
    checked_at: Math.floor(Date.now() / 1000),
  })
}
