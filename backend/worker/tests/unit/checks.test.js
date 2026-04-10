import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the config JSON imports so tests don't need real files at those paths
vi.mock('../../../../config/services.json', () => ({
  default: {
    services: [
      { id: 'github',    label: 'GitHub',    type: 'social', strategy: 'url_status', urlTemplate: 'https://github.com/{name}' },
      { id: 'linkedin',  label: 'LinkedIn',  type: 'social', strategy: 'coming_soon', urlTemplate: 'https://linkedin.com/in/{name}' },
    ],
  },
}), { assert: { type: 'json' } })

vi.mock('../../../../config/availability_signatures.json', () => ({
  default: {
    global: { taken: ['page not found'] },
    services: {
      github: {
        available: ['not found'],
        taken: ['{name} · github'],
        unknown: [],
      },
    },
  },
}), { assert: { type: 'json' } })

import { runChecksForName, checkServiceAvailability } from '../../src/lib/checks.js'

beforeEach(() => { vi.clearAllMocks() })

describe('checkServiceAvailability', () => {
  it('returns coming_soon for coming_soon strategy', async () => {
    const service = { id: 'linkedin', label: 'LinkedIn', strategy: 'coming_soon', urlTemplate: 'https://linkedin.com/in/{name}' }
    const result  = await checkServiceAvailability(service, 'testuser')
    expect(result.status).toBe('coming_soon')
  })

  it('returns available on HTTP 404', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ status: 404, ok: false, url: 'https://github.com/someuser', text: () => Promise.resolve('') })
    const service = { id: 'github', label: 'GitHub', strategy: 'url_status', urlTemplate: 'https://github.com/{name}', method: 'HEAD' }
    const result  = await checkServiceAvailability(service, 'someuser')
    expect(result.status).toBe('available')
  })

  it('returns unknown on HTTP 429 (rate limited)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ status: 429, ok: false, url: 'https://github.com/someuser', text: () => Promise.resolve('') })
    const service = { id: 'github', label: 'GitHub', strategy: 'url_status', urlTemplate: 'https://github.com/{name}', method: 'HEAD' }
    const result  = await checkServiceAvailability(service, 'someuser')
    expect(result.status).toBe('unknown')
  })

  it('returns taken when body contains a taken needle', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200, ok: true,
      url: 'https://github.com/lumio',
      // GET response with a "taken" needle from our mock config
      text: () => Promise.resolve('<title>lumio · github</title>'),
    })
    const service = { id: 'github', label: 'GitHub', strategy: 'url_status', urlTemplate: 'https://github.com/{name}', method: 'GET' }
    const result  = await checkServiceAvailability(service, 'lumio')
    expect(result.status).toBe('taken')
  })

  it('returns available when body contains an available needle', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200, ok: true,
      url: 'https://github.com/zzznobodythere',
      text: () => Promise.resolve('not found'),
    })
    const service = { id: 'github', label: 'GitHub', strategy: 'url_status', urlTemplate: 'https://github.com/{name}', method: 'GET' }
    const result  = await checkServiceAvailability(service, 'zzznobodythere')
    expect(result.status).toBe('available')
  })
})

describe('runChecksForName', () => {
  it('falls back to local checks when no orchestrator configured', async () => {
    // 404 = available for github; linkedin = coming_soon
    globalThis.fetch = vi.fn().mockResolvedValue({ status: 404, ok: false, url: '', text: () => Promise.resolve('') })
    const env = {}  // no ORCHESTRATOR_URL
    const results = await runChecksForName(env, 'testbrand', null)
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBeGreaterThan(0)
    const github = results.find(r => r.service === 'github')
    expect(github).toBeDefined()
    expect(github.status).toBe('available')
  })

  it('includes coming_soon services in results', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ status: 404, ok: false, url: '', text: () => Promise.resolve('') })
    const results = await runChecksForName({}, 'testbrand', null)
    const linkedin = results.find(r => r.service === 'linkedin')
    expect(linkedin).toBeDefined()
    expect(linkedin.status).toBe('coming_soon')
  })

  it('skips orchestrator call when ORCHESTRATOR_URL is not set', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ status: 404, ok: false, url: '', text: () => Promise.resolve('') })
    globalThis.fetch = fetchSpy
    await runChecksForName({}, 'testbrand', null)
    // All fetch calls should be to github.com (our mock service), not the orchestrator
    const orchestratorCalls = fetchSpy.mock.calls.filter(([url]) => String(url).includes('orchestrator'))
    expect(orchestratorCalls).toHaveLength(0)
  })
})
