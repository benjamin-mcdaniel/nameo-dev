// ── ntfy.sh push notifications ────────────────────────────────────────────────
//
// Sends a push notification to the configured ntfy topic.
// Topic is read from env.NTFY_TOPIC (set as a Wrangler secret).
// If NTFY_TOPIC is not set, all calls are silent no-ops.
//
// Priority values: min | low | default | high | urgent
// See: https://docs.ntfy.sh/publish/#message-priority

const NTFY_BASE = 'https://ntfy.sh'

/**
 * Send a push notification to the operator's ntfy topic.
 *
 * @param {object} env        - Cloudflare Worker env
 * @param {string} title      - Notification title (shown in bold)
 * @param {string} message    - Notification body
 * @param {string} [priority] - ntfy priority: min | low | default | high | urgent
 */
export async function sendNtfyAlert(env, title, message, priority = 'default') {
  const topic = env.NTFY_TOPIC
  if (!topic) return   // not configured — silent no-op

  try {
    await fetch(`${NTFY_BASE}/${encodeURIComponent(topic)}`, {
      method: 'POST',
      headers: {
        'Title':        title,
        'Priority':     priority,
        'Content-Type': 'text/plain',
        'Tags':         'nameo',
      },
      body: message,
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // Never let a notification failure affect the main request
  }
}
