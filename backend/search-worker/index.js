export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/health') {
      return json({ status: 'ok', worker: 'nameo-search-worker' })
    }

    if (url.pathname === '/v1/search-basic' && request.method === 'POST') {
      const expectedToken = (env && env.ORCHESTRATOR_TOKEN) || ''
      if (expectedToken) {
        const auth = request.headers.get('Authorization') || ''
        const [scheme, token] = auth.split(' ')
        if (scheme !== 'Bearer' || token !== expectedToken) {
          return json({ error: 'unauthorized' }, 401)
        }
      }

      const body = await request.json().catch(() => ({}))
      const name = (body.name || '').trim()
      if (!name) {
        return json({ status: 'error', name: '', results: [] }, 400)
      }

      // For now we ignore groups/modes in the request body and simply run
      // basic availability checks for all configured services. This keeps the
      // contract simple while still offloading the heavy lifting from the main
      // worker.
      const servicesConfig = await loadServicesConfig()

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

    return new Response('Not found', { status: 404 })
  },
}

async function loadServicesConfig() {
  const config = await import('../../config/services.json', { assert: { type: 'json' } })
  return config.default || config
}

async function loadAvailabilitySignatures() {
  const config = await import('../../config/availability_signatures.json', { assert: { type: 'json' } })
  return config.default || config
}

async function checkServiceAvailability(service, name) {
  if (service.strategy === 'coming_soon') {
    return { status: 'coming_soon' }
  }

  if (service.strategy === 'url_status') {
    const signaturesConfig = await loadAvailabilitySignatures()
    const perService =
      signaturesConfig && signaturesConfig.services && signaturesConfig.services[service.id]
        ? signaturesConfig.services[service.id]
        : null

    const url = service.urlTemplate.replace('{name}', encodeURIComponent(name))
    const method = service.method || 'HEAD'
    const res = await fetch(url, { method })
    const finalUrl = (res && res.url) || url

    if (res.status === 404) {
      return { status: 'available', code: res.status }
    }

    const globalTaken =
      signaturesConfig && signaturesConfig.global && Array.isArray(signaturesConfig.global.taken)
        ? signaturesConfig.global.taken
        : []
    const availableNeedleList = perService && Array.isArray(perService.available) ? perService.available : []
    const takenNeedleList = perService && Array.isArray(perService.taken) ? perService.taken : []
    const unknownNeedleList = perService && Array.isArray(perService.unknown) ? perService.unknown : []

    const needsBody =
      availableNeedleList.length > 0 || takenNeedleList.length > 0 || unknownNeedleList.length > 0 ||
      globalTaken.length > 0

    let bodyText = ''
    let bodyFinalUrl = finalUrl

    if (needsBody) {
      if (method === 'GET') {
        bodyFinalUrl = finalUrl
        bodyText = await res.text().catch(() => '')
      } else {
        const res2 = await fetch(url, { method: 'GET' })
        bodyFinalUrl = (res2 && res2.url) || finalUrl
        bodyText = await res2.text().catch(() => '')
      }
    }

    const haystack = `${String(bodyFinalUrl || finalUrl)}\n${String(bodyText || '')}`.toLowerCase()
    const nameLower = String(name || '').toLowerCase()

    const matches = (needles) => {
      for (const raw of needles) {
        if (!raw) continue
        const needle = String(raw).replaceAll('{name}', nameLower).toLowerCase()
        if (needle && haystack.includes(needle)) return true
      }
      return false
    }

    if (matches(unknownNeedleList)) {
      return { status: 'unknown', code: res.status }
    }

    if (matches(availableNeedleList)) {
      return { status: 'available', code: res.status }
    }

    if (matches(takenNeedleList) || matches(globalTaken)) {
      return { status: 'taken', code: res.status }
    }

    return { status: 'unknown', code: res.status }
  }

  return { status: 'unsupported' }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
