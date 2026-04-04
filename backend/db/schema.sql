-- nameo.dev D1 schema
-- Users are keyed by Auth0 `sub` (subject) strings, e.g. "auth0|abc123".

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,              -- Auth0 sub
  email TEXT,
  tier TEXT NOT NULL DEFAULT 'beta', -- beta, free, standard, advanced
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

CREATE TABLE IF NOT EXISTS advanced_reports (
  id TEXT PRIMARY KEY,              -- UUID
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_json TEXT NOT NULL,        -- JSON blob of report inputs + (future) computed outputs
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_options_campaign ON options(campaign_id);
CREATE INDEX IF NOT EXISTS idx_checks_option ON option_checks(option_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_advanced_reports_user ON advanced_reports(user_id, created_at DESC);

-- Per-user search history for the main Search page.
CREATE TABLE IF NOT EXISTS search_history (
  id TEXT PRIMARY KEY,              -- UUID
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL,             -- e.g. full / partial / taken
  searched_at INTEGER NOT NULL      -- unix timestamp (seconds)
);

CREATE INDEX IF NOT EXISTS idx_history_user_ts ON search_history(user_id, searched_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- v1 Sessions (startup naming workflow)
-- ─────────────────────────────────────────────────────────────────────────────
-- A "session" is the top-level container for a naming research campaign.
-- session_type is one of:
--   brand_identity  → Brand Identity Report (check an existing/candidate name)
--   name_generator  → Name Generator (build name candidates from brand prefs)

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,                        -- UUID
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                          -- user-facing session name
  session_type TEXT NOT NULL,                  -- brand_identity | name_generator
  status TEXT NOT NULL DEFAULT 'active',       -- active | complete | archived
  metadata_json TEXT,                          -- flexible JSON: brand_names, report_types, vibe prefs, etc.
  created_at INTEGER NOT NULL,                 -- unix timestamp (seconds)
  updated_at INTEGER NOT NULL
);

-- Reports belong to a session. Each report_type has its own runner.
-- report_type values:
--   Brand Identity: domain_availability | trademark | products_for_sale | social_handles | app_store
--   Name Generator: questionnaire | name_candidates
-- status: pending | running | complete | error

CREATE TABLE IF NOT EXISTS session_reports (
  id TEXT PRIMARY KEY,                        -- UUID
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  input_json TEXT,                             -- inputs used to generate this report
  result_json TEXT,                            -- computed results (null until complete)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_reports_session ON session_reports(session_id, created_at ASC);
