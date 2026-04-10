// ── Social handles runner ─────────────────────────────────────────────────────
//
// Checks username availability across social platforms using URL-status probing
// defined in config/services.json + config/availability_signatures.json.
//
// Status values: available | taken | unknown | coming_soon
//
// Platforms currently active (from services.json):
//   X, Instagram, Facebook, YouTube, TikTok, Pinterest, GitHub,
//   Reddit, Medium, Twitch, Product Hunt, Substack, Behance, Dribbble
// LinkedIn is marked coming_soon and returns no result.

import { updateReportStatus } from '../lib/report-status.js'
import { runChecksForName }   from '../lib/checks.js'

// Only include platforms relevant to a brand social audit.
// This list intentionally excludes the legacy services not shown in the UI.
const SOCIAL_SERVICE_IDS = [
  'x', 'instagram', 'facebook', 'youtube', 'linkedin',
  'tiktok', 'pinterest', 'github', 'reddit',
  'medium', 'twitch', 'producthunt', 'substack',
]

export async function runSocialHandlesReport(env, reportId, input) {
  const rawNames   = input?.brand_names ?? []
  const brandNames = rawNames
    .map((n) => String(n || '').trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_-]/g, ''))
    .filter(Boolean)

  if (!brandNames.length) {
    await updateReportStatus(env, reportId, 'error', { error: 'no_brand_names' })
    return
  }

  const results = await Promise.all(
    brandNames.map(async (name) => {
      const checks  = await runChecksForName(env, name, null)
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
