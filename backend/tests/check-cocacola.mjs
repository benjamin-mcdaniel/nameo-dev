import fs from 'node:fs/promises'
import assert from 'node:assert/strict'

const FIXTURE_PATH = new URL('./fixtures/cocacola.json', import.meta.url)

async function main() {
  const raw = await fs.readFile(FIXTURE_PATH, 'utf8')
  const fixture = JSON.parse(raw)

  const baseUrl = 'https://nameo-worker.benjamin-f-mcdaniel.workers.dev'
  const url = `${baseUrl}/api/check?name=${encodeURIComponent(fixture.name)}`

  const res = await fetch(url)
  if (!res.ok) {
    console.error('API request failed:', res.status, await res.text())
    process.exit(1)
  }

  const data = await res.json()
  const byService = new Map()
  for (const r of data.results || []) {
    if (r && r.service) byService.set(r.service, r.status || 'unknown')
  }

  let failed = false
  for (const [service, expected] of Object.entries(fixture.expectations || {})) {
    const actual = byService.get(service)
    if (actual !== expected) {
      console.error(`Service ${service}: expected ${expected}, got ${actual}`)
      failed = true
    }
  }

  if (failed) {
    process.exit(1)
  }

  console.log('All expectations met for', fixture.name)
}

main().catch((err) => {
  console.error('Test runner error:', err)
  process.exit(1)
})
