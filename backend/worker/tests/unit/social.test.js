import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runSocialHandlesReport } from '../../src/runners/social.js'

vi.mock('../../src/lib/report-status.js', () => ({
  updateReportStatus: vi.fn(),
}))

// Mock the whole checks module — social runner delegates everything to runChecksForName
vi.mock('../../src/lib/checks.js', () => ({
  runChecksForName: vi.fn(),
}))

import { updateReportStatus } from '../../src/lib/report-status.js'
import { runChecksForName }   from '../../src/lib/checks.js'

const mockEnv  = { NAMEO_DB: {} }
const REPORT_ID = 'test-report-id'

// A fake services.json-style result from runChecksForName
function fakeChecks(overrides = {}) {
  const defaults = {
    x:          { status: 'available' },
    instagram:  { status: 'taken' },
    github:     { status: 'available' },
    youtube:    { status: 'unknown' },
    facebook:   { status: 'available' },
    linkedin:   { status: 'coming_soon' },
    tiktok:     { status: 'unknown' },
    pinterest:  { status: 'available' },
    reddit:     { status: 'taken' },
    medium:     { status: 'available' },
    twitch:     { status: 'unknown' },
    producthunt:{ status: 'available' },
    substack:   { status: 'unknown' },
  }
  return Object.entries({ ...defaults, ...overrides }).map(([service, vals]) => ({
    service,
    label: service,
    ...vals,
  }))
}

beforeEach(() => { vi.clearAllMocks() })

describe('Social handles runner', () => {
  it('passes the brand name to runChecksForName', async () => {
    runChecksForName.mockResolvedValue(fakeChecks())
    await runSocialHandlesReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })
    expect(runChecksForName).toHaveBeenCalledWith(mockEnv, 'lumio', null)
  })

  it('includes expected social platforms in the result', async () => {
    runChecksForName.mockResolvedValue(fakeChecks())
    await runSocialHandlesReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })

    const result = updateReportStatus.mock.calls[0][3]
    const handles = result.names[0].handles
    expect(handles).toHaveProperty('x')
    expect(handles).toHaveProperty('instagram')
    expect(handles).toHaveProperty('github')
    expect(handles).toHaveProperty('youtube')
  })

  it('passes correct status values from checks', async () => {
    runChecksForName.mockResolvedValue(fakeChecks({ x: { status: 'available' }, instagram: { status: 'taken' } }))
    await runSocialHandlesReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })

    const handles = updateReportStatus.mock.calls[0][3].names[0].handles
    expect(handles.x.status).toBe('available')
    expect(handles.instagram.status).toBe('taken')
  })

  it('handles multiple brand names', async () => {
    runChecksForName.mockResolvedValue(fakeChecks())
    await runSocialHandlesReport(mockEnv, REPORT_ID, { brand_names: ['alpha', 'beta'] })

    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names).toHaveLength(2)
    expect(runChecksForName).toHaveBeenCalledTimes(2)
  })

  it('handles runChecksForName failure gracefully — no handles returned', async () => {
    runChecksForName.mockResolvedValue([])
    await runSocialHandlesReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })

    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names[0].handles).toEqual({})
  })

  it('includes checked_at timestamp', async () => {
    runChecksForName.mockResolvedValue(fakeChecks())
    await runSocialHandlesReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })

    const result = updateReportStatus.mock.calls[0][3]
    expect(typeof result.checked_at).toBe('number')
  })

  it('errors when no brand names provided', async () => {
    await runSocialHandlesReport(mockEnv, REPORT_ID, { brand_names: [] })
    expect(updateReportStatus).toHaveBeenCalledWith(mockEnv, REPORT_ID, 'error', { error: 'no_brand_names' })
  })
})
