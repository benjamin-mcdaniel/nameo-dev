// Social handles runner
//
// Live checks (no API key needed):
//   github   - api.github.com/users/{name}           404=available, 200=taken
//   reddit   - reddit.com/user/{name}/about.json      404=available, 200=taken
//
// Live checks (API key required):
//   x        - api.twitter.com/2/users/by/username/{name}  needs TWITTER_BEARER_TOKEN
//
// Stubbed (Worker IPs blocked, no reliable public API):
//   instagram, tiktok, linkedin, youtube, facebook, telegram
//
// Always unknown (no public username system):
//   whatsapp
//
// Status values: available | taken | unknown

import { updateReportStatus } from '../lib/report-status.js'

// --- Live checkers ---

async function checkGitHub(name) {
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(name)}`, {
      headers: { 'User-Agent': 'nameo-worker/1.0', Accept: 'application/vnd.github.v3+json' },
      signal: AbortSignal.timeout(7000),
    })
    if (res.status === 404) return { status: 'available' }
    if (res.status === 200) return { status: 'taken' }
    return { status: 'unknown' }
  } catch {
    return { status: 'unknown' }
  }
}

async function checkReddit(name) {
  try {
    const res = await fetch(
      `https://www.reddit.com/user/${encodeURIComponent(name)}/about.json`,
      { headers: { 'User-Agent': 'nameo-worker/1.0' }, signal: AbortSignal.timeout(7000) }
    )
    if (res.status === 404) return { status: 'available' }
    if (res.status === 200) return { status: 'taken' }
    return { status: 'unknown' }
  } catch {
    return { status: 'unknown' }
  }
}

async function checkTwitter(name, token) {
  if (!token) return { status: 'unknown', note: 'Requires API key' }
  try {
    const res = await fetch(
      `https://api.twitter.com/2/users/by/username/${encodeURIComponent(name)}`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(7000) }
    )
    if (res.status === 404) return { status: 'available' }
    if (res.status === 200) return { status: 'taken' }
    return { status: 'unknown' }
  } catch {
    return { status: 'unknown' }
  }
}

// --- Stub: platform IPs blocked from Cloudflare Workers ---
const blocked = (platform) => ({
  status: 'unknown',
  note: `${platform} blocks server-side checks — verify manually`,
})

// --- Main runner ---

export async function runSocialHandlesReport(env, reportId, input) {
  const rawNames = input?.brand_names ?? []
  const brandNames = rawNames
    .map((n) => String(n || '').trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_.-]/g, ''))
    .filter(Boolean)

  if (!brandNames.length) {
    await updateReportStatus(env, reportId, 'error', { error: 'no_brand_names' })
    return
  }

  const results = await Promise.all(
    brandNames.map(async (name) => {
      const [github, reddit, x] = await Promise.all([
        checkGitHub(name),
        checkReddit(name),
        checkTwitter(name, env?.TWITTER_BEARER_TOKEN),
      ])

      return {
        name,
        handles: {
          github,
          reddit,
          x,
          instagram:  blocked('Instagram'),
          tiktok:     blocked('TikTok'),
          linkedin:   blocked('LinkedIn'),
          youtube:    blocked('YouTube'),
          facebook:   blocked('Facebook'),
          telegram:   blocked('Telegram'),
          whatsapp:   { status: 'unknown', note: 'No public username system' },
        },
      }
    })
  )

  await updateReportStatus(env, reportId, 'complete', {
    names: results,
    checked_at: Math.floor(Date.now() / 1000),
  })
}
