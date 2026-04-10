import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runAppStoreReport } from '../../src/runners/app-store.js'

vi.mock('../../src/lib/report-status.js', () => ({
  updateReportStatus: vi.fn(),
}))

import { updateReportStatus } from '../../src/lib/report-status.js'

const mockEnv  = { NAMEO_DB: {} }
const REPORT_ID = 'test-report-id'

function mockiTunes(results) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ results }),
  })
}

beforeEach(() => { vi.clearAllMocks() })

describe('App Store runner', () => {
  it('status is clear when iTunes returns no results', async () => {
    mockiTunes([])
    await runAppStoreReport(mockEnv, REPORT_ID, { brand_names: ['uniquexyz'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].status).toBe('clear')
    expect(result.names[0].apps).toHaveLength(0)
  })

  it('status is conflict when exact app name match found', async () => {
    mockiTunes([{ trackName: 'Lumio', artistName: 'Acme', trackViewUrl: '', artworkUrl60: '', primaryGenreName: 'Productivity' }])
    await runAppStoreReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].status).toBe('conflict')
    expect(result.names[0].apps[0].match).toBe('exact')
  })

  it('status is conflict when app name starts with brand name', async () => {
    mockiTunes([{ trackName: 'Lumio Pro', artistName: 'Acme', trackViewUrl: '', artworkUrl60: '', primaryGenreName: 'Productivity' }])
    await runAppStoreReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].status).toBe('conflict')
    expect(result.names[0].apps[0].match).toBe('strong')
  })

  it('status is possible when brand name appears inside a longer app name', async () => {
    mockiTunes([{ trackName: 'Super Lumio Dashboard', artistName: 'Corp', trackViewUrl: '', artworkUrl60: '', primaryGenreName: 'Utilities' }])
    await runAppStoreReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].status).toBe('possible')
    expect(result.names[0].apps[0].match).toBe('contains')
  })

  it('status is possible when iTunes returns unrelated apps (partial match)', async () => {
    mockiTunes([{ trackName: 'Something Else', artistName: 'Corp', trackViewUrl: '', artworkUrl60: '', primaryGenreName: 'Games' }])
    await runAppStoreReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].status).toBe('possible')
  })

  it('result includes checked_at timestamp', async () => {
    mockiTunes([])
    await runAppStoreReport(mockEnv, REPORT_ID, { brand_names: ['x'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(typeof result.checked_at).toBe('number')
  })

  it('handles iTunes fetch failure gracefully — returns clear', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network'))
    await runAppStoreReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].status).toBe('clear')
  })

  it('errors when no brand names provided', async () => {
    await runAppStoreReport(mockEnv, REPORT_ID, { brand_names: [] })
    expect(updateReportStatus).toHaveBeenCalledWith(mockEnv, REPORT_ID, 'error', { error: 'no_brand_names' })
  })
})
