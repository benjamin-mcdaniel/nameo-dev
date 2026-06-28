import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkDomain, SUPPORTED_TLDS } from '../../src/lib/domainChecker.js';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('SUPPORTED_TLDS', () => {
  it('includes expected tech TLDs', () => {
    expect(SUPPORTED_TLDS).toContain('.com');
    expect(SUPPORTED_TLDS).toContain('.io');
    expect(SUPPORTED_TLDS).toContain('.ai');
    expect(SUPPORTED_TLDS).toContain('.sh');
    expect(SUPPORTED_TLDS).toContain('.dev');
  });

  it('has at least 10 TLDs', () => {
    expect(SUPPORTED_TLDS.length).toBeGreaterThanOrEqual(10);
  });
});

describe('checkDomain', () => {
  it('returns unknown for unsupported TLDs', async () => {
    const result = await checkDomain('example', '.unsupported');
    expect(result).toBe('unknown');
  });

  it('returns free when DoH returns NXDOMAIN', async () => {
    vi.stubGlobal('fetch', async () =>
      new Response(JSON.stringify({ Status: 3 }), {
        headers: { 'Content-Type': 'application/dns-json' },
      })
    );
    const result = await checkDomain('testword', '.com');
    expect(result).toBe('free');
  });

  it('returns taken when DoH returns NOERROR', async () => {
    vi.stubGlobal('fetch', async () =>
      new Response(JSON.stringify({ Status: 0, Answer: [] }), {
        headers: { 'Content-Type': 'application/dns-json' },
      })
    );
    const result = await checkDomain('google', '.com');
    expect(result).toBe('taken');
  });

  it('returns free when RDAP returns 404', async () => {
    vi.stubGlobal('fetch', async () => new Response('', { status: 404 }));
    const result = await checkDomain('testword', '.io');
    expect(result).toBe('free');
  });

  it('returns taken when RDAP returns 200', async () => {
    vi.stubGlobal('fetch', async () =>
      new Response('{}', { status: 200, headers: { 'Content-Type': 'application/rdap+json' } })
    );
    const result = await checkDomain('github', '.io');
    expect(result).toBe('taken');
  });

  it('returns unknown when fetch throws', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('network error'); });
    const result = await checkDomain('example', '.com');
    expect(result).toBe('unknown');
  });
});
