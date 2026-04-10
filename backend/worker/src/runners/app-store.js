// ── App Store runner ──────────────────────────────────────────────────────────
//
// Uses the Apple iTunes Search API (public, no key required).
// Google Play has no official API; it is not checked in v1.
//
// Match scoring:
//   exact   — app name === brand name (case-insensitive)
//   strong  — app name starts with brand name followed by space or colon
//   contains — app name contains brand name anywhere
//   partial — any other match returned by the search
//
// Conflict status:
//   conflict  — exact or strong match found
//   possible  — contains or partial matches only
//   clear     — no results returned for this name

import { updateReportStatus } from '../lib/report-status.js'

async function searchAppStore(term) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=us&entity=software&limit=10`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []).map((app) => ({
      name:      app.trackName || '',
      developer: app.artistName || '',
      url:       app.trackViewUrl || '',
      icon:      app.artworkUrl60 || '',
      rating:    app.averageUserRating ?? null,
      category:  app.primaryGenreName || '',
    }))
  } catch {
    return []
  }
}

export async function runAppStoreReport(env, reportId, input) {
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
      const apps   = await searchAppStore(name)
      const scored = apps.map((app) => {
        const appLower  = app.name.toLowerCase()
        const nameLower = name.toLowerCase()
        let match = 'partial'
        if (appLower === nameLower) match = 'exact'
        else if (appLower.startsWith(nameLower + ' ') || appLower.startsWith(nameLower + ':')) match = 'strong'
        else if (appLower.includes(nameLower)) match = 'contains'
        return { ...app, match }
      })
      const hasConflict = scored.some((a) => a.match === 'exact' || a.match === 'strong')
      return {
        name,
        apps: scored,
        status: hasConflict ? 'conflict' : (scored.length ? 'possible' : 'clear'),
      }
    })
  )

  await updateReportStatus(env, reportId, 'complete', {
    names: results,
    checked_at: Math.floor(Date.now() / 1000),
  })
}
