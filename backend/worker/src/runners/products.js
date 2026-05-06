// Products for Sale runner
//
// Checks major marketplace autocomplete APIs for existing products with this name.
// Uses public autocomplete endpoints -- no API keys required, but undocumented.
//
// Marketplaces:
//   Amazon  - completion.amazon.com/api/2017/suggestions  (live)
//   Walmart - search.walmart.com/api/typeahead            (stub)
//
// Match logic:
//   conflict  -- suggestion exactly matches brand name
//   possible  -- suggestion contains brand name
//   clear     -- no matching suggestions

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
      const nameLower = name.toLowerCase()

      // Amazon (live)
      const amazonSuggestions = await searchAmazonProducts(name)
      const amazonMatches = amazonSuggestions.filter((s) => {
        const val = s.value.toLowerCase()
        return val === nameLower || val.startsWith(nameLower + ' ') || val.includes(nameLower)
      })
      const amazonConflict = amazonMatches.some((m) => m.value.toLowerCase() === nameLower)

      // Walmart (stub)
      const walmart = { status: 'unknown', stub: true, note: 'Coming soon' }

      const topStatus = amazonConflict ? 'conflict' : (amazonMatches.length ? 'possible' : 'clear')

      return {
        name,
        marketplaces: {
          amazon: {
            status: topStatus,
            suggestions: amazonMatches.slice(0, 8).map((m) => m.value),
            total_suggestions: amazonSuggestions.length,
          },
          walmart,
        },
        status: topStatus,
      }
    })
  )

  await updateReportStatus(env, reportId, 'complete', {
    names: results,
    checked_at: Math.floor(Date.now() / 1000),
  })
}
