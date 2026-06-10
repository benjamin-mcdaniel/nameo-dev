import { describe, it, expect } from 'vitest'
import { generateCandidates, expandToDomainPairs, DEFAULT_TLDS } from '../../src/lib/name-generator.js'

describe('generateCandidates', () => {
  it('returns an array of strings', () => {
    const results = generateCandidates(['acme'])
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBeGreaterThan(0)
    expect(results.every(r => typeof r === 'string')).toBe(true)
  })

  it('includes the seed word itself', () => {
    const results = generateCandidates(['acme'])
    expect(results).toContain('acme')
  })

  it('generates prefix variants of the seed', () => {
    const results = generateCandidates(['acme'])
    expect(results).toContain('getacme')
    expect(results).toContain('tryacme')
  })

  it('generates suffix variants of the seed', () => {
    const results = generateCandidates(['acme'])
    expect(results).toContain('acmehq')
    expect(results).toContain('acmeapp')
  })

  it('incorporates LLM concept words', () => {
    const directions = { concepts: ['swift', 'nimble'] }
    const results = generateCandidates(['acme'], directions)
    expect(results).toContain('swift')
    expect(results.some(r => r.includes('acme') && r.includes('swift'))).toBe(true)
  })

  it('respects the limit', () => {
    const results = generateCandidates(['acme'], {}, 50)
    expect(results.length).toBeLessThanOrEqual(50)
  })

  it('returns no duplicates', () => {
    const results = generateCandidates(['cloud', 'flow'])
    const unique = new Set(results)
    expect(unique.size).toBe(results.length)
  })

  it('does not include empty strings', () => {
    const results = generateCandidates(['cloud'])
    expect(results.every(r => r.length > 0)).toBe(true)
  })

  it('handles multi-word seeds', () => {
    const results = generateCandidates(['cloud', 'flow'])
    expect(results.length).toBeGreaterThan(10)
  })

  it('returns at least 20 candidates for a typical seed', () => {
    const results = generateCandidates(['spark'], { concepts: ['bright', 'quick'], syllables: ['ven', 'sol'] })
    expect(results.length).toBeGreaterThan(20)
  })
})

describe('expandToDomainPairs', () => {
  it('creates one pair per name per TLD', () => {
    const names = ['alpha', 'beta']
    const tlds  = ['.com', '.io']
    const pairs = expandToDomainPairs(names, tlds)
    expect(pairs).toHaveLength(4)
    expect(pairs[0]).toEqual({ name: 'alpha', tld: '.com' })
    expect(pairs[1]).toEqual({ name: 'alpha', tld: '.io' })
  })

  it('uses DEFAULT_TLDS when none provided', () => {
    const pairs = expandToDomainPairs(['test'])
    expect(pairs).toHaveLength(DEFAULT_TLDS.length)
  })
})
