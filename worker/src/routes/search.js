import { checkAllTlds } from '../lib/domainChecker.js';
import { searchAvailableWords, getWordWithResults, saveUserResult, incrementDailyUsage, upsertWordResult } from '../lib/db.js';
import { applyTierFilter, stripToTierData } from '../lib/resultFilter.js';
import { generateRandomShorts } from '../lib/nameGenerator.js';
import { checkLimit, today } from '../middleware/rateLimit.js';
import { json } from '../lib/json.js';

const RESULTS_PER_SEARCH = 20;

export async function handleSearch(request, env, ctx, user) {
  const body = await request.json().catch(() => ({}));
  const { category } = body;

  if (!['short', 'brandable'].includes(category)) {
    return json({ error: 'category must be "short" or "brandable"' }, 400);
  }
  if (user.tier === 'free' && category !== 'short') {
    return json({ error: 'Free tier supports short category only. Upgrade to search brandable names.' }, 403);
  }

  const { allowed, usage, limit, date } = await checkLimit(env.DB, user.userId, user.tier);
  if (!allowed) return json({ error: 'Daily limit reached', usage, limit }, 429);

  let wordRows = (await searchAvailableWords(env.DB, category, RESULTS_PER_SEARCH * 2)).results;

  // For shorts: seed the index on-demand if sparse
  if (category === 'short' && wordRows.length < RESULTS_PER_SEARCH) {
    ctx.waitUntil(seedShortIndex(env.DB, RESULTS_PER_SEARCH * 3));
  }

  const fullResults = (
    await Promise.all(wordRows.slice(0, RESULTS_PER_SEARCH).map(w => getWordWithResults(env.DB, w.id)))
  ).filter(Boolean);

  const { visible, hiddenCount } = applyTierFilter(fullResults, user.tier);
  const resultWordIds = visible.map(r => r.word);
  const resultId = await saveUserResult(env.DB, user.userId, category, resultWordIds);
  await incrementDailyUsage(env.DB, user.userId, date);

  return json({
    id: resultId,
    category,
    created_at: Date.now(),
    results: visible.map(r => stripToTierData(r, user.tier)),
    hidden_count: hiddenCount,
    usage: usage + 1,
    limit,
  });
}

async function seedShortIndex(db, count) {
  const candidates = generateRandomShorts(count);
  for (const word of candidates) {
    const exists = await db.prepare('SELECT id FROM words WHERE id = ?').bind(word).first();
    if (exists) continue;
    const tldResults = await checkAllTlds(word);
    if (tldResults.some(r => r.status === 'free')) {
      await upsertWordResult(db, word, 'short', tldResults);
    }
  }
}
