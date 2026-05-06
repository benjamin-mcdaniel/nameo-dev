// Domain availability runner
//
// Layered approach -- tries each method in order, uses first definitive result:
//   Layer 1: Cloudflare DoH (dns-query) -- fast, covers all TLDs, always available
//   Layer 2: RDAP (rdap.org) -- richer data, covers most gTLDs
//   Fallback: unknown (never guesses)
//
// NXDOMAIN (DoH Status 3) or RDAP 404 -> available
// NOERROR  (DoH Status 0) or RDAP 200 -> taken

import { updateReportStatus } from '../lib/report-status.js'

const DOMAIN_TLDS = ['.com', '.io', '.ai', '.co', '.app', '.dev']

// Layer 1: Cloudflare DNS-over-HTTPS
async function checkDoH(domain) {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=NS`
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/dns-json' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.Status === 3) return 'available'
    if (data.Status === 0) return 'taken'
    return null
  } catch {
    return null
  }
}

// Layer 2: RDAP (Registration Data Access Protocol -- modern WHOIS replacement)
async function checkRDAP(domain) {
  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      signal: AbortSignal.timeout(8000),
    })
    if (res.status === 404) return 'available'
    if (res.status === 200) return 'taken'
    return null
  } catch {
    return null
  }
}

async function checkDomain(name, tld) {
  const domain = `${name}${tld}`
  const doh = await checkDoH(domain)
  if (doh) return doh
  const rdap = await checkRDAP(domain)
  if (rdap) return rdap
  return 'unknown'
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
        DOMAIN_TLDS.map(async (tld) => ({ tld, status: await checkDomain(name, tld) }))
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
