// ── Domain availability runner ────────────────────────────────────────────────
//
// Uses Cloudflare DNS-over-HTTPS. No API key required.
// NXDOMAIN (Status 3) → available. NOERROR (Status 0) → taken.

import { updateReportStatus } from '../lib/report-status.js'

const DOMAIN_TLDS = ['.com', '.io', '.ai', '.co', '.app', '.dev']

async function checkDomainViaDoH(name, tld) {
  const domain = `${name}${tld}`
  const url    = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=NS`
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/dns-json' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return 'unknown'
    const data = await res.json()
    if (data.Status === 3) return 'available'  // NXDOMAIN
    if (data.Status === 0) return 'taken'      // NOERROR
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

export async function runDomainAvailabilityReport(env, reportId, input) {
  const rawNames   = input?.brand_names ?? []
  const brandNames = rawNames
    .map((n) => String(n || '').trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9-]/g, ''))
    .filter(Boolean)

  if (!brandNames.length) {
    await updateReportStatus(env, reportId, 'error', { error: 'no_brand_names' })
    return
  }

  const results = await Promise.all(
    brandNames.map(async (name) => {
      const tldChecks = await Promise.allSettled(
        DOMAIN_TLDS.map(async (tld) => ({ tld, status: await checkDomainViaDoH(name, tld) }))
      )
      const tlds = {}
      for (const r of tldChecks) {
        if (r.status === 'fulfilled') tlds[r.value.tld] = r.value.status
      }
      return { name, tlds }
    })
  )

  await updateReportStatus(env, reportId, 'complete', {
    names: results,
    tlds: DOMAIN_TLDS,
    checked_at: Math.floor(Date.now() / 1000),
  })
}
