import { describe, it, expect } from 'vitest';
import { isValidShort, generateRandomShorts } from '../../src/lib/nameGenerator.js';

describe('isValidShort', () => {
  it('accepts valid shorts', () => {
    expect(isValidShort('bird')).toBe(true);
    expect(isValidShort('sulfur')).toBe(true);
    expect(isValidShort('fo')).toBe(true);
    expect(isValidShort('aab')).toBe(true);
  });

  it('rejects words longer than 6', () => {
    expect(isValidShort('toolong')).toBe(false);
  });

  it('rejects words with no vowels', () => {
    expect(isValidShort('bcd')).toBe(false);
    expect(isValidShort('str')).toBe(false);
  });

  it('rejects words with numbers', () => {
    expect(isValidShort('b1rd')).toBe(false);
  });

  it('rejects 3+ consecutive same-type chars', () => {
    expect(isValidShort('aaa')).toBe(false);  // 3 vowels
    expect(isValidShort('bbb')).toBe(false);  // 3 consonants
    expect(isValidShort('strb')).toBe(false); // str = 3 consonants
  });

  it('allows 2 consecutive same-type', () => {
    expect(isValidShort('aabc')).toBe(true);
    expect(isValidShort('boot')).toBe(true);
  });
});

describe('generateRandomShorts', () => {
  it('returns the requested count', () => {
    const results = generateRandomShorts(20);
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(20);
  });

  it('returns only valid shorts', () => {
    const results = generateRandomShorts(50);
    results.forEach(w => expect(isValidShort(w)).toBe(true));
  });

  it('returns no duplicates', () => {
    const results = generateRandomShorts(50);
    expect(new Set(results).size).toBe(results.length);
  });

  it('respects the exclude set', () => {
    const first = generateRandomShorts(10);
    const second = generateRandomShorts(10, new Set(first));
    const overlap = first.filter(w => second.includes(w));
    expect(overlap.length).toBe(0);
  });
});
