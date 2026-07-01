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

-- Workflow activity log (append-only): who did what to which item.
-- Feeds the per-item timeline + the global activity feed.
CREATE TABLE IF NOT EXISTS portal_activity (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor      text,                 -- real logged-in user, or "jefferson@ (via Zoho)" for webhook-sourced
  action     text NOT NULL,        -- item_created | quotes_ready | approved | awarded | declined | vendor_added | quote_added
  item_id    text,                 -- Zoho Procurement_Items id
  detail     jsonb,                -- action-specific payload
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portal_activity_item_idx ON portal_activity (item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS portal_activity_ts_idx   ON portal_activity (created_at DESC);

-- Per-user webapp notifications (the bell). read_at NULL = unread.
CREATE TABLE IF NOT EXISTS portal_notifications (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  recipient  text NOT NULL,        -- portal user email (lowercased)
  type       text NOT NULL,        -- item_created | quotes_ready | decision_made
  item_id    text,                 -- deep-link target
  title      text NOT NULL,
  body       text,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portal_notifications_recip_idx ON portal_notifications (recipient, created_at DESC);

-- Seed the 3 users with: node hash-password.js  (prints an UPSERT to paste here).
-- Example shape (DO NOT use this literal hash):
--   INSERT INTO portal_users (email, password_hash, role) VALUES
--     ('rb@rise8companies.com', '<saltHex>:<keyHex>', 'admin')
--   ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = now();
