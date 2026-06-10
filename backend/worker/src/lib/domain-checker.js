// domain-checker.js
//
// Layered availability check: DoH first (fast, free), RDAP fallback (rate-limited).
// Never guesses — returns 'unknown' when both layers are inconclusive.
//
// DoH:  Status 3 (NXDOMAIN) → available | Status 0 (NOERROR) → taken
// RDAP: HTTP 404            → available | HTTP 200             → taken

const DOH_TIMEOUT_MS  = 5000
const RDAP_TIMEOUT_MS = 8000

async function checkDoH(domain) {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=NS`
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/dns-json' },
      signal: AbortSignal.timeout(DOH_TIMEOUT_MS),
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

async function checkRDAP(domain) {
  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      signal: AbortSignal.timeout(RDAP_TIMEOUT_MS),
    })
    if (res.status === 404) return 'available'
    if (res.status === 200) return 'taken'
    return null
  } catch {
    return null
  }
}

/**
 * Check a single domain. Returns 'available' | 'taken' | 'unknown'.
 */
export async function checkDomain(domain) {
  const doh = await checkDoH(domain)
  if (doh) return doh
  const rdap = await checkRDAP(domain)
  return rdap ?? 'unknown'
}

/**
 * Check a list of { name, tld } pairs concurrently (batched to be polite).
 * Returns Array<{ domain, name, tld, status }>.
 *
 * @param {Array<{name: string, tld: string}>} pairs
 * @param {number} [batchSize=80]
 * @returns {Promise<Array<{domain:string, name:string, tld:string, status:string}>>}
 */
export async function checkDomainsBatched(pairs, batchSize = 80) {
  const results = []
  for (let i = 0; i < pairs.length; i += batchSize) {
    const batch = pairs.slice(i, i + batchSize)
    const settled = await Promise.allSettled(
      batch.map(async ({ name, tld }) => {
        const domain = `${name}${tld}`
        const status = await checkDomain(domain)
        return { domain, name, tld, status }
      })
    )
    for (const r of settled) {
      if (r.status === 'fulfilled') results.push(r.value)
    }
  }
  return results
}
