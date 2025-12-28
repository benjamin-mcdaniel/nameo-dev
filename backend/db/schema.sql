-- nameo.dev D1 schema
-- Users are keyed by Auth0 `sub` (subject) strings, e.g. "auth0|abc123".

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,              -- Auth0 sub
  email TEXT,
  created_at INTEGER NOT NULL       -- unix timestamp (seconds)
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,              -- UUID
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS options (
  id TEXT PRIMARY KEY,              -- UUID
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,               -- candidate name (e.g. blubrdbkpk)
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS option_checks (
  id TEXT PRIMARY KEY,              -- UUID
  option_id TEXT NOT NULL REFERENCES options(id) ON DELETE CASCADE,
  checked_at INTEGER NOT NULL,
  services_json TEXT NOT NULL       -- JSON blob of service results from /api/check
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_options_campaign ON options(campaign_id);
CREATE INDEX IF NOT EXISTS idx_checks_option ON option_checks(option_id, checked_at DESC);

-- Per-user search history for the main Search page.
CREATE TABLE IF NOT EXISTS search_history (
  id TEXT PRIMARY KEY,              -- UUID
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL,             -- e.g. full / partial / taken
  searched_at INTEGER NOT NULL      -- unix timestamp (seconds)
);

CREATE INDEX IF NOT EXISTS idx_history_user_ts ON search_history(user_id, searched_at DESC);
