// ── Name availability checks ──────────────────────────────────────────────────
//
// runChecksForName    — main entry: tries orchestrator, falls back to local URL checks
// callOrchestrator    — HTTP call to the optional orchestrator VM
// loadServicesConfig  — loads config/services.json
// checkServiceAvailability — performs a single service URL-status check

export async function loadServicesConfig() {
  const config = await import('../../../../config/services.json', { assert: { type: 'json' } })
  return config.default || config
}

async function loadAvailabilitySignatures() {
  const config = await import('../../../../config/availability_signatures.json', { assert: { type: 'json' } })
  return config.default || config
}

// Central dispatch: try the external orchestrator first; fall back to local checks.
export async function runChecksForName(env, name, userIdOrNull, debug = false) {
  const url   = env.ORCHESTRATOR_URL
  const token = env.ORCHESTRATOR_TOKEN

  if (url && token) {
    try {
      const orchestrated = await callOrchestrator(env, url, token, name, userIdOrNull)
      if (
        orchestrated &&
        orchestrated.status === 'ok' &&
        Array.isArray(orchestrated.results) &&
        orchestrated.results.length > 0
      ) {
        return orchestrated.results
      }
    } catch { /* fall through to local */ }
  }

  const servicesConfig = await loadServicesConfig()
  const checks = await Promise.allSettled(
    servicesConfig.services.map((service) => checkServiceAvailability(service, name, debug))
  )

  return servicesConfig.services.map((service, index) => {
    const r = checks[index]
    if (r.status === 'fulfilled') {
      return { service: service.id, label: service.label, ...r.value }
    }
    return { service: service.id, label: service.label, status: 'error', error: 'check_failed' }
  })
}

async function callOrchestrator(env, url, token, name, userIdOrNull) {
  const trimmed = (name || '').trim()
  if (!trimmed) return null

  const body = {
    name: trimmed,
    user: userIdOrNull ? { id: userIdOrNull } : undefined,
    groups: ['common', 'niche', 'advanced'],
    modes: ['basic_availability'],
  }

  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), 4000)

  let res
  try {
    res = await fetch(new URL('/v1/search-basic', url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }

  if (!res.ok) return null
  return res.json().catch(() => null)
}

export async function checkServiceAvailability(service, name, debug = false) {
  if (service.strategy === 'coming_soon') {
    return { status: 'coming_soon' }
  }

  if (service.strategy !== 'url_status') {
    return { status: 'unsupported' }
  }

  const signaturesConfig = await loadAvailabilitySignatures()
  const perService =
    signaturesConfig?.services?.[service.id] ?? null

  const url    = service.urlTemplate.replace('{name}', encodeURIComponent(name))
  const method = service.method || 'HEAD'
  const res    = await fetch(url, { method })
  const finalUrl = res.url || url

  if (res.status === 404) {
    return debug
      ? { status: 'available', code: res.status, debug: { finalUrl, matched: 'status:404', bodyFetched: false } }
      : { status: 'available', code: res.status }
  }

  if (res.status === 401 || res.status === 403 || res.status === 429) {
    return debug
      ? { status: 'unknown', code: res.status, debug: { finalUrl, matched: `status:${res.status}`, bodyFetched: false } }
      : { status: 'unknown', code: res.status }
  }

  const globalTaken       = signaturesConfig?.global?.taken ?? []
  const availableNeedles  = perService?.available ?? []
  const takenNeedles      = perService?.taken ?? []
  const unknownNeedles    = perService?.unknown ?? []

  const needsBody = availableNeedles.length || takenNeedles.length || unknownNeedles.length || globalTaken.length

  let bodyText     = ''
  let bodyFinalUrl = finalUrl
  let bodyFetched  = false

  if (needsBody) {
    if (method === 'GET') {
      bodyFinalUrl = finalUrl
      bodyText     = await res.text().catch(() => '')
      bodyFetched  = true
    } else {
      const res2   = await fetch(url, { method: 'GET' })
      bodyFinalUrl = res2.url || finalUrl
      bodyText     = await res2.text().catch(() => '')
      bodyFetched  = true
    }
  }

  const haystack  = `${bodyFinalUrl}\n${bodyText}`.toLowerCase()
  const nameLower = name.toLowerCase()

  const firstMatch = (needles) => {
    for (const raw of needles) {
      if (!raw) continue
      const needle = String(raw).replaceAll('{name}', nameLower).toLowerCase()
      if (needle && haystack.includes(needle)) return String(raw)
    }
    return null
  }

  const availableHit = firstMatch(availableNeedles)
  if (availableHit) {
    return debug
      ? { status: 'available', code: res.status, debug: { finalUrl: bodyFinalUrl, matched: `available:${availableHit}`, bodyFetched } }
      : { status: 'available', code: res.status }
  }

  const takenHit = firstMatch(takenNeedles) || firstMatch(globalTaken)
  if (takenHit) {
    return debug
      ? { status: 'taken', code: res.status, debug: { finalUrl: bodyFinalUrl, matched: `taken:${takenHit}`, bodyFetched } }
      : { status: 'taken', code: res.status }
  }

  const unknownHit = firstMatch(unknownNeedles)
  if (unknownHit) {
    return debug
      ? { status: 'unknown', code: res.status, debug: { finalUrl: bodyFinalUrl, matched: `unknown:${unknownHit}`, bodyFetched } }
      : { status: 'unknown', code: res.status }
  }

  return debug
    ? { status: 'unknown', code: res.status, debug: { finalUrl: bodyFinalUrl, matched: 'no_match', bodyFetched } }
    : { status: 'unknown', code: res.status }
}
