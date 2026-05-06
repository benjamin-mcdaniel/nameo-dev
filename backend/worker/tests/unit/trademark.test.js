import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runTrademarkReport } from '../../src/runners/trademark.js'

vi.mock('../../src/lib/report-status.js', () => ({
  updateReportStatus: vi.fn(),
}))

import { updateReportStatus } from '../../src/lib/report-status.js'

const mockEnv   = { NAMEO_DB: {} }
const REPORT_ID = 'test-report-id'

beforeEach(() => { vi.clearAllMocks() })

// Tests verify the stub contract so the full UI pipeline stays testable.
// Runner is currently a stub: names <=4 chars -> 'possible', >4 chars -> 'clear'.
// When the real Markify/USPTO runner is wired in, update these tests accordingly.

describe('Trademark runner (stub)', () => {
  it('errors when no brand names provided', async () => {
    await runTrademarkReport(mockEnv, REPORT_ID, { brand_names: [] })
    expect(updateReportStatus).toHaveBeenCalledWith(
      mockEnv, REPORT_ID, 'error', { error: 'no_brand_names' }
    )
  })

  it('status is clear for names longer than 4 chars', async () => {
    await runTrademarkReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].status).toBe('clear')
    expect(result.names[0].total_results).toBe(0)
  })

  it('status is possible for short names (4 chars or fewer)', async () => {
    await runTrademarkReport(mockEnv, REPORT_ID, { brand_names: ['acme'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].status).toBe('possible')
    expect(result.names[0].total_results).toBeGreaterThan(0)
  })

  it('result shape has required fields', async () => {
    await runTrademarkReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0]).toMatchObject({
      name:          'lumio',
      status:        expect.stringMatching(/^(clear|possible|conflict|unavailable)$/),
      total_results: expect.any(Number),
      top_results:   expect.any(Array),
    })
  })

  it('result includes checked_at timestamp', async () => {
    await runTrademarkReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(result.checked_at).toBeGreaterThan(0)
  })

  it('result includes stub:true flag', async () => {
    await runTrademarkReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(result.stub).toBe(true)
  })

  it('handles multiple brand names', async () => {
    await runTrademarkReport(mockEnv, REPORT_ID, { brand_names: ['lumio', 'acme'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names).toHaveLength(2)
  })
})
