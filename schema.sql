-- Nameo v3 schema
-- Run: wrangler d1 execute nameo-db --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS words (
  id                 TEXT    PRIMARY KEY,
  word               TEXT    NOT NULL UNIQUE,
  category           TEXT    NOT NULL CHECK(category IN ('short', 'brandable')),
  indexed_at         INTEGER NOT NULL,
  last_checked       INTEGER,
  tld_free_count     INTEGER NOT NULL DEFAULT 0,
  tld_checked_count  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_words_category       ON words(category);
CREATE INDEX IF NOT EXISTS idx_words_last_checked   ON words(last_checked);
CREATE INDEX IF NOT EXISTS idx_words_free           ON words(category, tld_free_count);

CREATE TABLE IF NOT EXISTS domain_results (
  word_id       TEXT    NOT NULL,
  tld           TEXT    NOT NULL,
  status        TEXT    NOT NULL CHECK(status IN ('free', 'taken', 'unknown')),
  last_checked  INTEGER NOT NULL,
  PRIMARY KEY (word_id, tld),
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_domain_status ON domain_results(word_id, status);

-- Stub: populated once social checking is implemented
CREATE TABLE IF NOT EXISTS social_results (
  word_id       TEXT    NOT NULL,
  platform      TEXT    NOT NULL CHECK(platform IN ('github', 'x', 'bluesky', 'discord')),
  handle        TEXT    NOT NULL,
  handle_type   TEXT    NOT NULL CHECK(handle_type IN ('exact', 'prefix', 'suffix')),
  status        TEXT    NOT NULL CHECK(status IN ('free', 'taken', 'unknown')),
  last_checked  INTEGER NOT NULL,
  PRIMARY KEY (word_id, platform, handle_type),
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_tiers (
  clerk_user_id      TEXT    PRIMARY KEY,
  tier               TEXT    NOT NULL DEFAULT 'free' CHECK(tier IN ('free', 'paid')),
  stripe_customer_id TEXT,
  updated_at         INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_results (
  id             TEXT    PRIMARY KEY,
  clerk_user_id  TEXT    NOT NULL,
  category       TEXT    NOT NULL CHECK(category IN ('short', 'brandable')),
  created_at     INTEGER NOT NULL,
  word_ids       TEXT    NOT NULL  -- JSON array of word IDs in snapshot
);

CREATE INDEX IF NOT EXISTS idx_user_results_user ON user_results(clerk_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_daily_usage (
  clerk_user_id  TEXT    NOT NULL,
  date           TEXT    NOT NULL,  -- YYYY-MM-DD
  count          INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (clerk_user_id, date)
);
