import { getWordWithResults } from '../lib/db.js';
import { stripToTierData } from '../lib/resultFilter.js';
import { json } from '../lib/json.js';

export async function handleName(request, env, user, word) {
  const clean = word.toLowerCase().trim();
  if (!clean) return json({ error: 'word is required' }, 400);

  const result = await getWordWithResults(env.DB, clean);
  if (!result) return json({ error: 'Name not found in index' }, 404);

  return json(stripToTierData(result, user.tier));
}
