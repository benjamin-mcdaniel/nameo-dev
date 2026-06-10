import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendNtfyAlert } from '../../src/lib/notify.js'

beforeEach(() => { vi.clearAllMocks() })

describe('sendNtfyAlert', () => {
  it('is a no-op when NTFY_TOPIC is not set', async () => {
    globalThis.fetch = vi.fn()
    await sendNtfyAlert({}, 'Test', 'message')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('POSTs to ntfy.sh with the configured topic', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true })
    await sendNtfyAlert({ NTFY_TOPIC: 'my-topic' }, 'Alert title', 'Alert body')
    expect(fetch).toHaveBeenCalledWith(
      'https://ntfy.sh/my-topic',
      expect.objectContaining({
        method: 'POST',
        body:   'Alert body',
        headers: expect.objectContaining({ 'Title': 'Alert title' }),
      })
    )
  })

  it('sends correct priority header', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true })
    await sendNtfyAlert({ NTFY_TOPIC: 'test' }, 'T', 'M', 'urgent')
    const headers = fetch.mock.calls[0][1].headers
    expect(headers['Priority']).toBe('urgent')
  })

  it('does not throw when fetch rejects — swallows error silently', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network down'))
    await expect(sendNtfyAlert({ NTFY_TOPIC: 'test' }, 'T', 'M')).resolves.toBeUndefined()
  })

  it('URL-encodes the topic to handle special characters', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true })
    await sendNtfyAlert({ NTFY_TOPIC: 'topic/with/slashes' }, 'T', 'M')
    const url = fetch.mock.calls[0][0]
    expect(url).toBe('https://ntfy.sh/topic%2Fwith%2Fslashes')
  })
})
