import { getUserResultById, getWordWithResults, upsertWordResult, incrementDailyUsage } from '../lib/db.js';
import { checkAllTlds } from '../lib/domainChecker.js';
import { stripToTierData } from '../lib/resultFilter.js';
import { checkLimit, today } from '../middleware/rateLimit.js';
import { json } from '../lib/json.js';

export async function handleRefresh(request, env, ctx, user, resultId) {
  const saved = await getUserResultById(env.DB, user.userId, resultId);
  if (!saved) return json({ error: 'Result not found' }, 404);

  const { allowed, usage, limit, date } = await checkLimit(env.DB, user.userId, user.tier);
  if (!allowed) return json({ error: 'Daily limit reached', usage, limit }, 429);

  await incrementDailyUsage(env.DB, user.userId, date);

  const wordIds = JSON.parse(saved.word_ids);
  ctx.waitUntil(recheckWords(env.DB, wordIds, saved.category));

  return json({ ok: true, message: 'Re-check started', result_id: resultId, usage: usage + 1, limit });
}

async function recheckWords(db, wordIds, category) {
  for (const wordId of wordIds) {
    const tldResults = await checkAllTlds(wordId);
    if (tldResults.some(r => r.status === 'free')) {
      await upsertWordResult(db, wordId, category, tldResults);
    }
  }
}
