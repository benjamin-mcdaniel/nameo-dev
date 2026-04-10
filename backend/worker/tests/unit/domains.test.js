import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runDomainAvailabilityReport } from '../../src/runners/domains.js'

// Mock updateReportStatus so tests don't need a real DB
vi.mock('../../src/lib/report-status.js', () => ({
  updateReportStatus: vi.fn(),
}))

import { updateReportStatus } from '../../src/lib/report-status.js'

// Minimal env — DB write is mocked, no real D1 needed
const mockEnv = { NAMEO_DB: {} }
const REPORT_ID = 'test-report-id'

// Helper: mock the DoH fetch to return a given DNS status code
function mockDoH(statusCode) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ Status: statusCode }),
  })
}

beforeEach(() => { vi.clearAllMocks() })

describe('Domain availability runner', () => {
  it('marks all TLDs available when DoH returns NXDOMAIN (Status 3)', async () => {
    mockDoH(3)
    await runDomainAvailabilityReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })

    expect(updateReportStatus).toHaveBeenCalledWith(
      mockEnv, REPORT_ID, 'complete',
      expect.objectContaining({
        names: [expect.objectContaining({
          name: 'lumio',
          tlds: expect.objectContaining({ '.com': 'available', '.io': 'available' }),
        })],
        tlds: expect.arrayContaining(['.com', '.io', '.ai']),
      })
    )
  })

  it('marks all TLDs taken when DoH returns NOERROR (Status 0)', async () => {
    mockDoH(0)
    await runDomainAvailabilityReport(mockEnv, REPORT_ID, { brand_names: ['google'] })

    const call = updateReportStatus.mock.calls[0]
    const result = call[3]
    expect(result.names[0].tlds['.com']).toBe('taken')
    expect(result.names[0].tlds['.io']).toBe('taken')
  })

  it('marks TLDs unknown when DoH returns unexpected status', async () => {
    mockDoH(2) // SERVFAIL
    await runDomainAvailabilityReport(mockEnv, REPORT_ID, { brand_names: ['weirdname'] })

    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].tlds['.com']).toBe('unknown')
  })

  it('marks TLDs unknown when fetch throws', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network error'))
    await runDomainAvailabilityReport(mockEnv, REPORT_ID, { brand_names: ['failing'] })

    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].tlds['.com']).toBe('unknown')
  })

  it('handles multiple brand names independently', async () => {
    mockDoH(3)
    await runDomainAvailabilityReport(mockEnv, REPORT_ID, { brand_names: ['alpha', 'beta'] })

    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names).toHaveLength(2)
    expect(result.names.map(n => n.name)).toEqual(['alpha', 'beta'])
  })

  it('strips spaces and special chars from brand names before checking', async () => {
    mockDoH(3)
    await runDomainAvailabilityReport(mockEnv, REPORT_ID, { brand_names: ['my brand!'] })

    const result = updateReportStatus.mock.calls[0][3]
    // Spaces and ! should be removed → 'mybrand'
    expect(result.names[0].name).toBe('mybrand')
  })

  it('errors when no brand names provided', async () => {
    await runDomainAvailabilityReport(mockEnv, REPORT_ID, { brand_names: [] })
    expect(updateReportStatus).toHaveBeenCalledWith(mockEnv, REPORT_ID, 'error', { error: 'no_brand_names' })
  })

  it('errors when input is null', async () => {
    await runDomainAvailabilityReport(mockEnv, REPORT_ID, null)
    expect(updateReportStatus).toHaveBeenCalledWith(mockEnv, REPORT_ID, 'error', { error: 'no_brand_names' })
  })
})
