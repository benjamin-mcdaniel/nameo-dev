import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runTrademarkReport } from '../../src/runners/trademark.js'

vi.mock('../../src/lib/report-status.js', () => ({
  updateReportStatus: vi.fn(),
}))

import { updateReportStatus } from '../../src/lib/report-status.js'

const mockEnv  = { NAMEO_DB: {} }
const REPORT_ID = 'test-report-id'

function mockUSPTO(hits, total) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      hits: { hits, total: { value: total ?? hits.length } },
    }),
  })
}

function makeHit(markText, serial = '12345', owner = 'Acme Corp', status = 'REGISTERED') {
  return { _source: { markText, serialNumber: serial, owner, status } }
}

beforeEach(() => { vi.clearAllMocks() })

describe('Trademark runner', () => {
  it('status is clear when USPTO returns no results', async () => {
    mockUSPTO([], 0)
    await runTrademarkReport(mockEnv, REPORT_ID, { brand_names: ['uniquexyz'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].status).toBe('clear')
    expect(result.names[0].total_results).toBe(0)
  })

  it('status is conflict on exact mark match (case-insensitive)', async () => {
    mockUSPTO([makeHit('LUMIO')], 1)
    await runTrademarkReport(mockEnv, REPORT_ID, { brand_names: ['Lumio'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].status).toBe('conflict')
  })

  it('status is possible when results exist but no exact match', async () => {
    mockUSPTO([makeHit('LUMIO INDUSTRIES'), makeHit('LUMIOPRO')], 2)
    await runTrademarkReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].status).toBe('possible')
    expect(result.names[0].total_results).toBe(2)
  })

  it('returns at most 5 top_results', async () => {
    const hits = Array.from({ length: 8 }, (_, i) => makeHit(`BRAND${i}`))
    mockUSPTO(hits, 8)
    await runTrademarkReport(mockEnv, REPORT_ID, { brand_names: ['brand'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].top_results.length).toBeLessThanOrEqual(5)
  })

  it('top_results contain mark, serial, owner, status fields', async () => {
    mockUSPTO([makeHit('LUMIO', '98765', 'Test Owner', 'LIVE')], 1)
    await runTrademarkReport(mockEnv, REPORT_ID, { brand_names: ['other'] })
    const result = updateReportStatus.mock.calls[0][3]
    const top = result.names[0].top_results[0]
    expect(top).toMatchObject({ mark: 'LUMIO', serial: '98765', owner: 'Test Owner', status: 'LIVE' })
  })

  it('status is unavailable when USPTO fetch fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network'))
    await runTrademarkReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].status).toBe('unavailable')
    expect(result.names[0].message).toMatch(/re-running/i)
  })

  it('status is unavailable when USPTO returns non-200', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 })
    await runTrademarkReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].status).toBe('unavailable')
  })

  it('errors when no brand names provided', async () => {
    await runTrademarkReport(mockEnv, REPORT_ID, { brand_names: [] })
    expect(updateReportStatus).toHaveBeenCalledWith(mockEnv, REPORT_ID, 'error', { error: 'no_brand_names' })
  })
})
