import strategies from '../../../config/tld-strategies.json' assert { type: 'json' };

const DOH_URL = 'https://cloudflare-dns.com/dns-query';
const RDAP_BASE = 'https://rdap.org/domain/';

export const SUPPORTED_TLDS = Object.keys(strategies);

export async function checkDomain(word, tld) {
  const strategy = strategies[tld];
  if (!strategy) return 'unknown';

  const domain = `${word}${tld}`;
  try {
    return strategy.method === 'doh'
      ? await checkViaDoh(domain)
      : await checkViaRdap(domain);
  } catch {
    return 'unknown';
  }
}

export async function checkAllTlds(word) {
  const results = await Promise.allSettled(
    SUPPORTED_TLDS.map(async tld => ({ tld, status: await checkDomain(word, tld) }))
  );
  return results.map(r =>
    r.status === 'fulfilled' ? r.value : { tld: 'unknown', status: 'unknown' }
  );
}

async function checkViaDoh(domain) {
  const res = await fetch(`${DOH_URL}?name=${domain}&type=A`, {
    headers: { Accept: 'application/dns-json' },
    cf: { cacheTtl: 300 },
  });
  if (!res.ok) return 'unknown';
  const { Status } = await res.json();
  if (Status === 3) return 'free';   // NXDOMAIN
  if (Status === 0) return 'taken';  // NOERROR
  return 'unknown';
}

async function checkViaRdap(domain) {
  const res = await fetch(`${RDAP_BASE}${domain}`, {
    headers: { Accept: 'application/rdap+json' },
    cf: { cacheTtl: 300 },
  });
  if (res.status === 404) return 'free';
  if (res.status === 200) return 'taken';
  return 'unknown';
}
