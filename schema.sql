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
  -- registration only. The nine categories of record (FACTS.md §1b):
  -- government | producer | brand | trader | machinery | investor | media |
  -- academic | other.  The V2 six are withdrawn.
  category       TEXT,
  -- Comma-separated subset of: exhibitor, sponsor. A SEPARATE axis from
  -- category, because a tea producer can also want a stand. Stored as text
  -- rather than a join table: it has exactly two possible values and the
  -- Secretariat reads it in a CSV export.
  participation  TEXT,
  website        TEXT,

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

-- ============================================================================
-- Delegate portal
-- ============================================================================
-- Added 2026-08-23 for the portal foundation.
--
-- NO PASSWORDS ANYWHERE, by design (V3-SCOPE.md decision 8). Sign-in is a
-- magic link sent to the address the delegate registered with. There is no
-- password to leak, no reset flow to build, and nothing for a delegate to
-- forget between registering in 2026 and attending in April 2027.
--
-- Tokens are stored as SHA-256 hashes, never in the clear. A dump of this
-- table must not let the reader sign in as anyone.

CREATE TABLE IF NOT EXISTS accounts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  name          TEXT,
  organisation  TEXT,
  job_title     TEXT,
  country       TEXT,
  phone         TEXT,
  category      TEXT,
  participation TEXT,
  -- active | suspended. Never deleted on a data-protection request: the row is
  -- scrubbed and marked, so a re-registration cannot silently resurrect it.
  status        TEXT    NOT NULL DEFAULT 'active',
  last_login_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts (email);

-- Single-use sign-in links. Short-lived, one row per request, deleted on use.
CREATE TABLE IF NOT EXISTS login_tokens (
  token_hash TEXT    PRIMARY KEY,
  email      TEXT    NOT NULL COLLATE NOCASE,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT    NOT NULL,
  used_at    TEXT,
  ip_hash    TEXT
);

CREATE INDEX IF NOT EXISTS idx_login_tokens_expiry ON login_tokens (expires_at);

-- Sessions. The cookie carries a random token; this stores only its hash.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT    PRIMARY KEY,
  account_id  INTEGER NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT    NOT NULL,
  user_agent  TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions (account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry  ON sessions (expires_at);
