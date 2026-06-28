import { describe, it, expect } from 'vitest';
import { applyTierFilter, stripToTierData } from '../../src/lib/resultFilter.js';

const makeWords = n => Array.from({ length: n }, (_, i) => ({
  word: `word${i}`,
  tlds: [{ tld: '.com', status: 'free' }],
  socials: [],
  conflict_score: 0,
}));

describe('applyTierFilter', () => {
  it('paid tier sees all results', () => {
    const words = makeWords(10);
    const { visible, hiddenCount } = applyTierFilter(words, 'paid');
    expect(visible.length).toBe(10);
    expect(hiddenCount).toBe(0);
  });

  it('free tier sees ceil(n/2) results', () => {
    const { visible, hiddenCount } = applyTierFilter(makeWords(10), 'free');
    expect(visible.length).toBe(5);
    expect(hiddenCount).toBe(5);
  });

  it('rounds up for odd counts', () => {
    const { visible, hiddenCount } = applyTierFilter(makeWords(9), 'free');
    expect(visible.length).toBe(5);
    expect(hiddenCount).toBe(4);
  });

  it('handles empty input', () => {
    const { visible, hiddenCount } = applyTierFilter([], 'free');
    expect(visible.length).toBe(0);
    expect(hiddenCount).toBe(0);
  });
});

describe('stripToTierData', () => {
  const full = {
    word: 'test',
    tlds: [{ tld: '.com', status: 'free' }],
    socials: [{ platform: 'github', handle: 'test', handle_type: 'exact', status: 'free' }],
    conflict_score: 0.1,
  };

  it('paid tier gets full data', () => {
    const result = stripToTierData(full, 'paid');
    expect(result.socials).toBeDefined();
    expect(result.conflict_score).toBeDefined();
  });

  it('free tier gets only word and tlds', () => {
    const result = stripToTierData(full, 'free');
    expect(result.word).toBe('test');
    expect(result.tlds).toBeDefined();
    expect(result.socials).toBeUndefined();
    expect(result.conflict_score).toBeUndefined();
  });
});
