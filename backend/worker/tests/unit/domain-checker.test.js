import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkDomain, checkDomainsBatched } from '../../src/lib/domain-checker.js'

describe('checkDomain', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns available when DoH returns NXDOMAIN (status 3)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 3 }),
    }))
    expect(await checkDomain('thisdomaindoesnotexist12345.com')).toBe('available')
  })

  it('returns taken when DoH returns NOERROR (status 0)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 0 }),
    }))
    expect(await checkDomain('google.com')).toBe('taken')
  })

  it('falls back to RDAP when DoH is inconclusive', async () => {
    let callCount = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url) => {
      callCount++
      if (String(url).includes('cloudflare-dns')) {
        return { ok: true, json: async () => ({ Status: 2 }) }  // inconclusive
      }
      // RDAP call
      return { status: 404 }  // available
    }))
    expect(await checkDomain('example.io')).toBe('available')
    expect(callCount).toBe(2)
  })

  it('returns taken when RDAP returns 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url) => {
      if (String(url).includes('cloudflare-dns')) {
        return { ok: true, json: async () => ({ Status: 99 }) }  // inconclusive
      }
      return { status: 200 }  // taken
    }))
    expect(await checkDomain('taken.com')).toBe('taken')
  })

  it('returns unknown when both layers fail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    expect(await checkDomain('anything.co')).toBe('unknown')
  })
})

describe('checkDomainsBatched', () => {
  it('returns results for all pairs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 3 }),
    }))

    const pairs = [
      { name: 'alpha', tld: '.com' },
      { name: 'beta',  tld: '.io'  },
      { name: 'gamma', tld: '.ai'  },
    ]
    const results = await checkDomainsBatched(pairs, 10)
    expect(results).toHaveLength(3)
    expect(results.every(r => r.status === 'available')).toBe(true)
    expect(results[0].domain).toBe('alpha.com')
  })
})
