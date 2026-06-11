-- Stayable Procurement portal — auth + audit schema (Neon Postgres).
-- Run once in the Neon SQL editor (or psql) against the portal project's database.
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS portal_users (
  email         text PRIMARY KEY,                 -- store lowercased
  password_hash text NOT NULL,                    -- scrypt: "<saltHex>:<keyHex>"
  role          text NOT NULL DEFAULT 'reviewer',  -- 'admin' | 'reviewer'
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_audit (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ts         timestamptz NOT NULL DEFAULT now(),
  event      text NOT NULL,        -- login | login_failed | logout | portal_decision
  email      text,                 -- actor (lowercased) when known
  detail     jsonb                 -- e.g. {"itemId":"...","action":"approve","stage":"Approved"}
);

CREATE INDEX IF NOT EXISTS portal_audit_ts_idx    ON portal_audit (ts DESC);
CREATE INDEX IF NOT EXISTS portal_audit_email_idx ON portal_audit (email);

-- Seed the 3 users with: node hash-password.js  (prints an UPSERT to paste here).
-- Example shape (DO NOT use this literal hash):
--   INSERT INTO portal_users (email, password_hash, role) VALUES
--     ('rb@rise8companies.com', '<saltHex>:<keyHex>', 'admin')
--   ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = now();
