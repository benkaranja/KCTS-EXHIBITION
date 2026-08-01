-- D1 lead ledger — Kenya-China Tea Summit 2027
--
-- The contract (web-factory standard, and the reason D1 is on every project):
-- the row is written BEFORE the Brevo call. A send that fails leaves a row with
-- email_status='queued'. Spam is FLAGGED, never discarded — a keyword-matched
-- submission that gets silently dropped and returns HTTP 200 is a lost lead the
-- client never learns about.

CREATE TABLE IF NOT EXISTS submissions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),

  -- which form: contact | registration | sponsorship | exhibitor | speaker | newsletter
  form_type      TEXT    NOT NULL,
  -- registration only: delegate | exhibitor | sponsor | government | media | student
  category       TEXT,

  name           TEXT    NOT NULL,
  email          TEXT    NOT NULL,
  phone          TEXT,
  organisation   TEXT,
  job_title      TEXT,
  country        TEXT,
  message        TEXT,

  -- anti-spam signals, kept for audit rather than thrown away
  spam_score     INTEGER NOT NULL DEFAULT 0,
  is_spam        INTEGER NOT NULL DEFAULT 0,
  spam_reason    TEXT,
  turnstile_ok   INTEGER NOT NULL DEFAULT 0,
  time_elapsed   INTEGER,

  -- queued -> sent | failed. Never deleted on failure.
  email_status   TEXT    NOT NULL DEFAULT 'queued',
  email_attempts INTEGER NOT NULL DEFAULT 0,
  email_error    TEXT,
  message_id     TEXT,
  sent_at        TEXT,

  ip_country     TEXT,
  user_agent     TEXT,
  referer        TEXT
);

CREATE INDEX IF NOT EXISTS idx_submissions_created  ON submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_status   ON submissions (email_status) WHERE email_status != 'sent';
CREATE INDEX IF NOT EXISTS idx_submissions_form     ON submissions (form_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_email    ON submissions (email);

-- Rate limiting. Keyed by a hash of the client IP, never the IP itself, so the
-- table holds no PII (S4). Rows older than the window are pruned on write.
CREATE TABLE IF NOT EXISTS rate_limit (
  ip_hash    TEXT NOT NULL,
  window_key TEXT NOT NULL,
  hits       INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (ip_hash, window_key)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_updated ON rate_limit (updated_at);
