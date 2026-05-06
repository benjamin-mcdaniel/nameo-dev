import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runSocialHandlesReport } from '../../src/runners/social.js'

vi.mock('../../src/lib/report-status.js', () => ({
  updateReportStatus: vi.fn(),
}))

import { updateReportStatus } from '../../src/lib/report-status.js'

function mockFetch(responses) {
  return vi.fn((url) => {
    const urlStr = typeof url === 'string' ? url : url.toString()
    for (const [pattern, resp] of Object.entries(responses)) {
      if (urlStr.includes(pattern)) {
        return Promise.resolve({ status: resp.status, json: () => Promise.resolve({}) })
      }
    }
    return Promise.resolve({ status: 200, json: () => Promise.resolve({}) })
  })
}

const mockEnv = { NAMEO_DB: {} }
const REPORT_ID = 'test-report-id'

beforeEach(() => { vi.clearAllMocks() })

describe('Social handles runner', () => {
  it('marks github available when API returns 404', async () => {
    global.fetch = mockFetch({ 'api.github.com': { status: 404 }, 'reddit.com': { status: 200 } })
    await runSocialHandlesReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })
    const handles = updateReportStatus.mock.calls[0][3].names[0].handles
    expect(handles.github.status).toBe('available')
  })

  it('marks github taken when API returns 200', async () => {
    global.fetch = mockFetch({ 'api.github.com': { status: 200 }, 'reddit.com': { status: 404 } })
    await runSocialHandlesReport(mockEnv, REPORT_ID, { brand_names: ['stripe'] })
    const handles = updateReportStatus.mock.calls[0][3].names[0].handles
    expect(handles.github.status).toBe('taken')
    expect(handles.reddit.status).toBe('available')
  })

  it('marks github unknown on unexpected status', async () => {
    global.fetch = mockFetch({ 'api.github.com': { status: 429 }, 'reddit.com': { status: 429 } })
    await runSocialHandlesReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })
    const handles = updateReportStatus.mock.calls[0][3].names[0].handles
    expect(handles.github.status).toBe('unknown')
  })

  it('always returns unknown for blocked platforms', async () => {
    global.fetch = mockFetch({ 'api.github.com': { status: 404 }, 'reddit.com': { status: 404 } })
    await runSocialHandlesReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })
    const handles = updateReportStatus.mock.calls[0][3].names[0].handles
    expect(handles.instagram.status).toBe('unknown')
    expect(handles.tiktok.status).toBe('unknown')
    expect(handles.linkedin.status).toBe('unknown')
    expect(handles.youtube.status).toBe('unknown')
  })

  it('checks x via twitter API when TWITTER_BEARER_TOKEN is set', async () => {
    global.fetch = mockFetch({ 'api.github.com': { status: 200 }, 'reddit.com': { status: 200 }, 'api.twitter.com': { status: 404 } })
    const envWithToken = { ...mockEnv, TWITTER_BEARER_TOKEN: 'fake-token' }
    await runSocialHandlesReport(envWithToken, REPORT_ID, { brand_names: ['lumio'] })
    const handles = updateReportStatus.mock.calls[0][3].names[0].handles
    expect(handles.x.status).toBe('available')
  })

  it('returns x as unknown with note when no TWITTER_BEARER_TOKEN', async () => {
    global.fetch = mockFetch({ 'api.github.com': { status: 404 }, 'reddit.com': { status: 404 } })
    await runSocialHandlesReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })
    const handles = updateReportStatus.mock.calls[0][3].names[0].handles
    expect(handles.x.status).toBe('unknown')
    expect(handles.x.note).toBe('Requires API key')
  })

  it('handles multiple brand names', async () => {
    global.fetch = mockFetch({ 'api.github.com': { status: 404 }, 'reddit.com': { status: 200 } })
    await runSocialHandlesReport(mockEnv, REPORT_ID, { brand_names: ['alpha', 'beta'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(result.names).toHaveLength(2)
    expect(result.names[0].name).toBe('alpha')
    expect(result.names[1].name).toBe('beta')
  })

  it('includes checked_at timestamp', async () => {
    global.fetch = mockFetch({ 'api.github.com': { status: 404 }, 'reddit.com': { status: 404 } })
    await runSocialHandlesReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })
    const result = updateReportStatus.mock.calls[0][3]
    expect(typeof result.checked_at).toBe('number')
  })

  it('errors when no brand names provided', async () => {
    await runSocialHandlesReport(mockEnv, REPORT_ID, { brand_names: [] })
    expect(updateReportStatus).toHaveBeenCalledWith(mockEnv, REPORT_ID, 'error', { error: 'no_brand_names' })
  })

  it('returns unknown on fetch failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network error'))
    await runSocialHandlesReport(mockEnv, REPORT_ID, { brand_names: ['lumio'] })
    const handles = updateReportStatus.mock.calls[0][3].names[0].handles
    expect(handles.github.status).toBe('unknown')
    expect(handles.reddit.status).toBe('unknown')
  })
})
