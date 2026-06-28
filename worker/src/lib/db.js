export async function getWordWithResults(db, wordId) {
  const word = await db.prepare('SELECT * FROM words WHERE id = ?').bind(wordId).first();
  if (!word) return null;

  const [tlds, socials] = await Promise.all([
    db.prepare('SELECT tld, status, last_checked FROM domain_results WHERE word_id = ?')
      .bind(wordId).all(),
    db.prepare('SELECT platform, handle, handle_type, status FROM social_results WHERE word_id = ?')
      .bind(wordId).all(),
  ]);

  return { ...word, tlds: tlds.results, socials: socials.results };
}

export async function upsertWordResult(db, word, category, tldResults) {
  const freeCount = tldResults.filter(r => r.status === 'free').length;
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
      ON CONFLICT(word_id, tld) DO UPDATE SET
        status = excluded.status,
        last_checked = excluded.last_checked
    `).bind(word, r.tld, r.status, now)
  );

  await db.batch(stmts);
}

export async function searchAvailableWords(db, category, limit = 40) {
  return db.prepare(`
    SELECT id, word, tld_free_count
    FROM words
    WHERE category = ? AND tld_free_count > 0
    ORDER BY RANDOM()
    LIMIT ?
  `).bind(category, limit).all();
}

export async function getUserTier(db, userId) {
  const row = await db.prepare(
    'SELECT tier FROM user_tiers WHERE clerk_user_id = ?'
  ).bind(userId).first();
  return row?.tier || 'free';
}

export async function setUserTier(db, userId, tier, stripeCustomerId = null) {
  await db.prepare(`
    INSERT INTO user_tiers (clerk_user_id, tier, stripe_customer_id, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(clerk_user_id) DO UPDATE SET
      tier = excluded.tier,
      stripe_customer_id = COALESCE(excluded.stripe_customer_id, stripe_customer_id),
      updated_at = excluded.updated_at
  `).bind(userId, tier, stripeCustomerId, Date.now()).run();
}

export async function saveUserResult(db, userId, category, wordIds) {
  const id = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO user_results (id, clerk_user_id, category, created_at, word_ids)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, userId, category, Date.now(), JSON.stringify(wordIds)).run();

  // Trim to 100 most recent
  await db.prepare(`
    DELETE FROM user_results
    WHERE clerk_user_id = ? AND id NOT IN (
      SELECT id FROM user_results WHERE clerk_user_id = ?
      ORDER BY created_at DESC LIMIT 100
    )
  `).bind(userId, userId).run();

  return id;
}

export async function getUserResults(db, userId, limit = 100) {
  return db.prepare(`
    SELECT id, category, created_at, word_ids
    FROM user_results
    WHERE clerk_user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(userId, Math.min(limit, 100)).all();
}

export async function getUserResultById(db, userId, resultId) {
  return db.prepare(
    'SELECT * FROM user_results WHERE id = ? AND clerk_user_id = ?'
  ).bind(resultId, userId).first();
}

export async function getDailyUsage(db, userId, date) {
  const row = await db.prepare(
    'SELECT count FROM user_daily_usage WHERE clerk_user_id = ? AND date = ?'
  ).bind(userId, date).first();
  return row?.count || 0;
}

export async function incrementDailyUsage(db, userId, date) {
  await db.prepare(`
    INSERT INTO user_daily_usage (clerk_user_id, date, count)
    VALUES (?, ?, 1)
    ON CONFLICT(clerk_user_id, date) DO UPDATE SET count = count + 1
  `).bind(userId, date).run();
}
