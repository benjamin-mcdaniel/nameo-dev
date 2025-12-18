import leoProfanity from 'leo-profanity'

let PROFANITY_READY = false

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: CORS_HEADERS,
        })
      }

      // Require Auth0 token for all API routes (stubbed for now)
      const authResult = await verifyAuth0Token(request, env)
      if (!authResult.ok) {
        return json({ error: 'unauthorized' }, 401)
      }

      if (url.pathname === '/api/check' && request.method === 'GET') {
        return handleCheck(url, env)
      }

      if (url.pathname === '/api/suggestions' && request.method === 'GET') {
        return handleSuggestions(url, env)
      }

      return json({ error: 'not_found' }, 404)
    }

    return new Response('OK')
  },
}

async function handleCheck(url, env) {
  const name = url.searchParams.get('name')?.trim() || ''
  const safetyConfig = await loadSafetyConfig(env)
  const servicesConfig = await loadServicesConfig(env)

  const safety = await evaluateNameSafety(name, safetyConfig)
  if (!safety.ok) {
    return json({ status: 'unsafe', reason: safety.reason, message: safety.message }, 400)
  }

  if (!name) {
    return json({ status: 'error', error: 'missing_name' }, 400)
  }

  const checks = await Promise.allSettled(
    servicesConfig.services.map((service) => checkServiceAvailability(service, name))
  )

  const results = servicesConfig.services.map((service, index) => {
    const r = checks[index]
    if (r.status === 'fulfilled') {
      return { service: service.id, label: service.label, ...r.value }
    }
    return {
      service: service.id,
      label: service.label,
      status: 'error',
      error: 'check_failed',
    }
  })

  return json({ status: 'ok', name, results })
}

async function handleSuggestions(url, env) {
  const name = url.searchParams.get('name')?.trim() || ''
  const safetyConfig = await loadSafetyConfig(env)

  const baseSafety = await evaluateNameSafety(name, safetyConfig)
  if (!baseSafety.ok) {
    return json({ status: 'unsafe', reason: baseSafety.reason, message: baseSafety.message }, 400)
  }

  const suggestions = generateSuggestions(name, safetyConfig)
  return json({ status: 'ok', name, suggestions })
}

async function loadSafetyConfig(env) {
  // In a more advanced setup, this could come from KV. For now, static JSON bundled at build.
  const config = await import('../../config/safety.json', { assert: { type: 'json' } })
  return config.default || config
}

async function loadServicesConfig(env) {
  const config = await import('../../config/services.json', { assert: { type: 'json' } })
  return config.default || config
}

async function evaluateNameSafety(name, safetyConfig) {
  if (!name) {
    return { ok: false, reason: 'empty', message: 'Name is required.' }
  }

  const { minLength, maxLength, allowedPattern, bannedSubstrings } = safetyConfig

  if (name.length < minLength || name.length > maxLength) {
    return { ok: false, reason: 'length', message: 'Name length is out of allowed range.' }
  }

  const re = new RegExp(allowedPattern)
  if (!re.test(name)) {
    return { ok: false, reason: 'pattern', message: 'Name contains invalid characters.' }
  }

  const lower = name.toLowerCase()
  if (Array.isArray(bannedSubstrings)) {
    for (const banned of bannedSubstrings) {
      if (banned && lower.includes(banned)) {
        return { ok: false, reason: 'banned_substring', message: 'Name contains disallowed language.' }
      }
    }
  }

  // Profanity check using leo-profanity in addition to simple substring rules.
  if (!PROFANITY_READY) {
    leoProfanity.loadDictionary()
    PROFANITY_READY = true
  }

  if (leoProfanity.check(name)) {
    return { ok: false, reason: 'profanity', message: 'Name contains profanity or inappropriate language.' }
  }

  return { ok: true }
}

async function checkServiceAvailability(service, name) {
  if (service.strategy === 'url_status') {
    const url = service.urlTemplate.replace('{name}', encodeURIComponent(name))
    const res = await fetch(url, { method: 'HEAD' })

    if (res.status === 404) {
      return { status: 'available', code: res.status }
    }

    if (res.status >= 200 && res.status < 400) {
      return { status: 'taken', code: res.status }
    }

    return { status: 'unknown', code: res.status }
  }

  return { status: 'unsupported' }
}

function generateSuggestions(name, safetyConfig) {
  const prefixes = ['the', 'real', 'its']
  const suffixes = ['app', 'hq', 'official']

  const raw = []

  for (const p of prefixes) {
    raw.push(p + name)
  }

  raw.push(name + '_')
  raw.push(name + '1')

  for (const s of suffixes) {
    raw.push(name + s)
  }

  const seen = new Set()
  const allowed = []

  for (const candidate of raw) {
    if (seen.has(candidate)) continue
    seen.add(candidate)

    const evalResult = simpleSafetyCheck(candidate, safetyConfig)
    if (evalResult.ok) {
      allowed.push(candidate)
    }
  }

  return allowed.slice(0, 20)
}

function simpleSafetyCheck(name, safetyConfig) {
  const { minLength, maxLength, allowedPattern, bannedSubstrings } = safetyConfig

  if (name.length < minLength || name.length > maxLength) {
    return { ok: false }
  }

  const re = new RegExp(allowedPattern)
  if (!re.test(name)) {
    return { ok: false }
  }

  const lower = name.toLowerCase()
  if (Array.isArray(bannedSubstrings)) {
    for (const banned of bannedSubstrings) {
      if (banned && lower.includes(banned)) {
        return { ok: false }
      }
    }
  }

  return { ok: true }
}

async function verifyAuth0Token(request, env) {
  // TODO: Implement JWT verification against Auth0 JWKS using env.AUTH0_DOMAIN and env.AUTH0_AUDIENCE.
  // For now, this stub allows all requests through so we can develop the rest of the flow.
  return { ok: true }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  })
}
