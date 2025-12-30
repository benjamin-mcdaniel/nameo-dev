export default {
  async fetch(request) {
    const url = new URL(request.url)

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', worker: 'nameo-search-worker' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (url.pathname === '/v1/search-basic' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const name = (body.name || '').trim()
      if (!name) {
        return new Response(JSON.stringify({ status: 'error', name: '', results: [] }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Stub implementation: returns an empty results list. This is meant to
      // be filled in later with real per-platform adapters. Keeping the shape
      // aligned with the orchestrator contract used by the main Worker.
      return new Response(JSON.stringify({ status: 'ok', name, results: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response('Not found', { status: 404 })
  },
}
