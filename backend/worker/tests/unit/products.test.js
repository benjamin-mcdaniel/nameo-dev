import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runProductsForSaleReport } from '../../src/runners/products.js'

vi.mock('../../src/lib/report-status.js', () => ({
  updateReportStatus: vi.fn(),
}))

import { updateReportStatus } from '../../src/lib/report-status.js'

const mockEnv  = { NAMEO_DB: {} }
const REPORT_ID = 'test-report-id'

function mockAmazon(suggestions) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ suggestions: suggestions.map(v => ({ value: v })) }),
  })
}

beforeEach(() => { vi.clearAllMocks() })

describe('Products for Sale runner', () => {
  it('status is clear when Amazon returns no suggestions', async () => {
    mockAmazon([])
    await runProductsForSaleReport(mockEnv, REPORT_ID, { brand_names: ['uniquewidget'] })

    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].status).toBe('clear')
    expect(result.names[0].suggestions).toHaveLength(0)
  })

  it('status is conflict on exact name match', async () => {
    mockAmazon(['lumio', 'lumio case', 'lumio light'])
    await runProductsForSaleReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })

    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].status).toBe('conflict')
  })

  it('status is possible when name appears as prefix but not exact', async () => {
    mockAmazon(['lumio desk lamp', 'lumio accessories'])
    await runProductsForSaleReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })

    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].status).toBe('possible')
  })

  it('caps suggestions returned at 8', async () => {
    mockAmazon(['lumio a', 'lumio b', 'lumio c', 'lumio d', 'lumio e', 'lumio f', 'lumio g', 'lumio h', 'lumio i', 'lumio j'])
    await runProductsForSaleReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })

    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].suggestions.length).toBeLessThanOrEqual(8)
  })

  it('total_suggestions reflects raw count before filtering', async () => {
    mockAmazon(['lumio desk', 'lumio lamp', 'something unrelated'])
    await runProductsForSaleReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })

    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].total_suggestions).toBe(3)
  })

  it('handles Amazon fetch failure gracefully — returns clear', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network'))
    await runProductsForSaleReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })

    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].status).toBe('clear')
  })

  it('errors when no brand names provided', async () => {
    await runProductsForSaleReport(mockEnv, REPORT_ID, null)
    expect(updateReportStatus).toHaveBeenCalledWith(mockEnv, REPORT_ID, 'error', { error: 'no_brand_names' })
  })
})
