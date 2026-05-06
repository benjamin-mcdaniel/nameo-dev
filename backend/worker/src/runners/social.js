// Social handles runner
//
// Strategy per platform:
//   github   - api.github.com/users/{name}         -> 404=available, 200=taken  (no key)
//   reddit   - reddit.com/user/{name}/about.json   -> 404=available             (no key)
//   x        - api.twitter.com/2/users/by/username -> needs TWITTER_BEARER_TOKEN env var
//
// instagram, tiktok, linkedin, youtube, facebook - Worker IPs are blocked by
// these platforms. Returned as status:'unknown' with a note so the UI is honest.
//
// Status values: available | taken | unknown

import { updateReportStatus } from '../lib/report-status.js'

async function checkGitHub(name) {
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(name)}`, {
      headers: {
        'User-Agent': 'nameo-worker/1.0',
        Accept: 'application/vnd.github.v3+json',
      },
      signal: AbortSignal.timeout(7000),
    })
    if (res.status === 404) return 'available'
    if (res.status === 200) return 'taken'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

async function checkReddit(name) {
  try {
    const res = await fetch(
      `https://www.reddit.com/user/${encodeURIComponent(name)}/about.json`,
      {
        headers: { 'User-Agent': 'nameo-worker/1.0' },
        signal: AbortSignal.timeout(7000),
      }
    )
    if (res.status === 404) return 'available'
    if (res.status === 200) return 'taken'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

async function checkTwitter(name, env) {
  const token = env?.TWITTER_BEARER_TOKEN
  if (!token) return 'unknown'
  try {
    const res = await fetch(
      `https://api.twitter.com/2/users/by/username/${encodeURIComponent(name)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(7000),
      }
    )
    if (res.status === 404) return 'available'
    if (res.status === 200) return 'taken'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

export async function runSocialHandlesReport(env, reportId, input) {
  const rawNames = input?.brand_names ?? []
  const brandNames = rawNames
    .map((n) => String(n || '').trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_-]/g, ''))
    .filter(Boolean)

  if (!brandNames.length) {
    await updateReportStatus(env, reportId, 'error', { error: 'no_brand_names' })
    return
  }

  const results = await Promise.all(
    brandNames.map(async (name) => {
      const [githubStatus, redditStatus, xStatus] = await Promise.all([
        checkGitHub(name),
        checkReddit(name),
        checkTwitter(name, env),
      ])

      const handles = {
        github: { status: githubStatus },
        reddit: { status: redditStatus },
        x: {
          status: xStatus,
          note: !env?.TWITTER_BEARER_TOKEN ? 'Requires API key' : null,
        },
        instagram: { status: 'unknown', note: 'Requires API key' },
        tiktok:    { status: 'unknown', note: 'Requires API key' },
        linkedin:  { status: 'unknown', note: 'Requires API key' },
        youtube:   { status: 'unknown', note: 'Requires API key' },
      }

      return { name, handles }
    })
  )

  await updateReportStatus(env, reportId, 'complete', {
    names: results,
    checked_at: Math.floor(Date.now() / 1000),
  })
}
