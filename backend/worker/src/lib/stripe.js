// stripe.js
//
// Stripe Checkout session creation and webhook signature verification.
// Uses the Stripe REST API directly (no SDK) to keep bundle size minimal.

const STRIPE_API_BASE  = 'https://api.stripe.com/v1'

/**
 * Create a Stripe Checkout Session for a sweep.
 *
 * @param {object} opts
 * @param {string} opts.secretKey       STRIPE_SECRET_KEY
 * @param {string} opts.sweepId         sweep UUID (stored in metadata)
 * @param {string} opts.email           pre-fill customer email
 * @param {string} opts.successUrl      redirect after payment (include {CHECKOUT_SESSION_ID})
 * @param {string} opts.cancelUrl       redirect on cancel
 * @param {number} opts.amountCents     price in cents (e.g. 2500 = $25)
 * @returns {Promise<{id: string, url: string}>}
 */
export async function createCheckoutSession({ secretKey, sweepId, email, successUrl, cancelUrl, amountCents }) {
  const body = new URLSearchParams({
    'payment_method_types[]':              'card',
    'mode':                                'payment',
    'customer_email':                       email,
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][product_data][name]': 'Nameo Domain Sweep',
    'line_items[0][price_data][product_data][description]': 'Up to 6,000 domain availability checks',
    'line_items[0][price_data][unit_amount]': String(amountCents),
    'line_items[0][quantity]':              '1',
    'metadata[sweep_id]':                   sweepId,
    'success_url':                          successUrl,
    'cancel_url':                           cancelUrl,
  })

  const res = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(`Stripe error ${res.status}: ${data?.error?.message ?? JSON.stringify(data)}`)
  }

  const session = await res.json()
  return { id: session.id, url: session.url }
}

/**
 * Verify a Stripe webhook signature (Stripe-Signature header).
 * Returns true if valid. Rejects requests older than 5 minutes.
 *
 * @param {string} rawBody    Raw request body as string
 * @param {string} sigHeader  Value of the Stripe-Signature header
 * @param {string} secret     STRIPE_WEBHOOK_SECRET
 * @returns {Promise<boolean>}
 */
export async function verifyWebhookSignature(rawBody, sigHeader, secret) {
  if (!sigHeader || !secret) return false

  const parts = {}
  for (const kv of sigHeader.split(',')) {
    const [k, v] = kv.split('=')
    parts[k.trim()] = v?.trim()
  }

  const timestamp = parts.t
  const received  = parts.v1
  if (!timestamp || !received) return false

  // Reject stale webhooks (> 5 min)
  const age = Math.floor(Date.now() / 1000) - Number(timestamp)
  if (age > 300) return false

  const payload    = `${timestamp}.${rawBody}`
  const encoder    = new TextEncoder()
  const keyData    = encoder.encode(secret)
  const msgData    = encoder.encode(payload)

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig      = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
  const expected = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return expected === received
}
