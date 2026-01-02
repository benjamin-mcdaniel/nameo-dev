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

async function checkServiceAvailability(service, name) {
  if (service.strategy === 'url_status') {
    const url = service.urlTemplate.replace('{name}', encodeURIComponent(name))
    const method = service.method || 'HEAD'
    const res = await fetch(url, { method })

    if (res.status === 404) {
      return { status: 'available', code: res.status }
    }

    if (service.id === 'instagram' || service.id === 'facebook') {
      const text = await res.text().catch(() => '')
      const lower = text.toLowerCase()
      if (
        (service.id === 'instagram' && lower.includes("sorry, this page isn't available")) ||
        (service.id === 'facebook' && lower.includes("this content isn't available right now"))
      ) {
        return { status: 'available', code: res.status }
      }
    }

    // Mirror main worker behavior: anything that is not a clear 404 or known
    // "not available" page is effectively taken.
    return { status: 'taken', code: res.status }
  }

  return { status: 'unsupported' }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
