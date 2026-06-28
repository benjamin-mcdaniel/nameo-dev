import { getSlice, totalWords } from './wordlist.js';

const RDAP_BASE = 'https://rdap.org/domain/';
const DOH_URL = 'https://cloudflare-dns.com/dns-query';

const TLD_METHODS = {
  '.com': 'doh', '.co': 'doh', '.dev': 'doh', '.app': 'doh',
  '.run': 'doh', '.tools': 'doh', '.studio': 'doh', '.fyi': 'doh',
  '.io': 'rdap', '.ai': 'rdap', '.sh': 'rdap', '.so': 'rdap',
  '.xyz': 'rdap', '.gg': 'rdap',
};
const TLDS = Object.keys(TLD_METHODS);

async function checkDomain(word, tld) {
  const domain = `${word}${tld}`;
  try {
    if (TLD_METHODS[tld] === 'doh') {
      const res = await fetch(`${DOH_URL}?name=${domain}&type=A`, {
        headers: { Accept: 'application/dns-json' },
      });
      if (!res.ok) return 'unknown';
      const { Status } = await res.json();
      return Status === 3 ? 'free' : Status === 0 ? 'taken' : 'unknown';
    }
    const res = await fetch(`${RDAP_BASE}${domain}`, {
      headers: { Accept: 'application/rdap+json' },
    });
    return res.status === 404 ? 'free' : res.status === 200 ? 'taken' : 'unknown';
  } catch {
    return 'unknown';
  }
}

async function checkAllTlds(word) {
  const results = await Promise.allSettled(
    TLDS.map(async tld => ({ tld, status: await checkDomain(word, tld) }))
  );
  return results.map(r => r.status === 'fulfilled' ? r.value : { tld: 'unknown', status: 'unknown' });
}

async function indexWord(db, word, category) {
  const tldResults = await checkAllTlds(word);
  const freeCount = tldResults.filter(r => r.status === 'free').length;

  if (freeCount === 0) return false;

  const now = Date.now();
  await db.prepare(`
    INSERT INTO words (id, word, category, indexed_at, last_checked, tld_free_count, tld_checked_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      last_checked = excluded.last_checked,
      tld_free_count = excluded.tld_free_count,
      tld_checked_count = excluded.tld_checked_count
  `).bind(word, word, category, now, now, freeCount, tldResults.length).run();

  const stmts = tldResults.map(r =>
    db.prepare(`
      INSERT INTO domain_results (word_id, tld, status, last_checked)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(word_id, tld) DO UPDATE SET status = excluded.status, last_checked = excluded.last_checked
    `).bind(word, r.tld, r.status, now)
  );
  await db.batch(stmts);
  return true;
}

export async function batchProcessBrandable(db, cursor, batchSize) {
  const total = totalWords();
  const words = getSlice(cursor, batchSize);
  let processed = 0;

  for (const word of words) {
    await indexWord(db, word, 'brandable');
    processed++;
  }

  const nextCursor = cursor + processed;
  return { processed, nextCursor, done: nextCursor >= total };
}

export async function batchProcessShorts(db, count) {
  // Inline short generator (mirrors nameGenerator.js to avoid cross-bundle import)
  const vowels = new Set('aeiou');
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  const all = 'abcdefghijklmnopqrstuvwxyz';

  function genOne(len) {
    const chars = [];
    let prevVowel = null, run = 0;
    for (let i = 0; i < len; i++) {
      const fv = prevVowel === false && run >= 2;
      const fc = prevVowel === true && run >= 2;
      const pool = fv ? 'aeiou' : fc ? consonants : all;
      const c = pool[Math.floor(Math.random() * pool.length)];
      chars.push(c);
      const v = vowels.has(c);
      run = v === prevVowel ? run + 1 : 1;
      prevVowel = v;
    }
    const w = chars.join('');
    return [...w].some(c => vowels.has(c)) ? w : null;
  }

  let indexed = 0;
  let attempts = 0;
  while (indexed < count && attempts < count * 20) {
    attempts++;
    const len = 2 + Math.floor(Math.random() * 5);
    const word = genOne(len);
    if (!word) continue;
    const exists = await db.prepare('SELECT id FROM words WHERE id = ?').bind(word).first();
    if (exists) continue;
    const ok = await indexWord(db, word, 'short');
    if (ok) indexed++;
  }
  return indexed;
}
