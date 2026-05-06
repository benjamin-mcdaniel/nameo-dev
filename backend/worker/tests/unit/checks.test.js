// checks.js is deprecated -- it was the old URL-scraping availability system.
// The stub just returns {} so imports in index.js don't break the build.
// These tests verify the stub contract only.

import { describe, it, expect } from 'vitest'
import { runChecksForName } from '../../src/lib/checks.js'

describe('runChecksForName (deprecated stub)', () => {
  it('returns an object without throwing', async () => {
    const result = await runChecksForName({}, 'testbrand', null)
    expect(typeof result).toBe('object')
  })

  it('returns an empty object', async () => {
    const result = await runChecksForName()
    expect(result).toEqual({})
  })
})
