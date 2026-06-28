import { getUserResults, getWordWithResults } from '../lib/db.js';
import { stripToTierData } from '../lib/resultFilter.js';
import { json } from '../lib/json.js';

export async function handleHistory(request, env, user) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);

  const { results } = await getUserResults(env.DB, user.userId, limit);

  const enriched = await Promise.all(
    results.map(async row => {
      const wordIds = JSON.parse(row.word_ids);
      const words = (await Promise.all(wordIds.map(id => getWordWithResults(env.DB, id)))).filter(Boolean);
      return {
        id: row.id,
        category: row.category,
        created_at: row.created_at,
        results: words.map(w => stripToTierData(w, user.tier)),
      };
    })
  );

  return json({ results: enriched, total: enriched.length });
}
