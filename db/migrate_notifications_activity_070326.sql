-- Migration: add workflow activity log + webapp notifications (Phase 2).
-- Run once against the portal's Neon database (the one your production DATABASE_URL points to).
-- Idempotent: safe to re-run. No redeploy needed after running.
--
-- HOW TO RUN: Vercel -> Storage -> your Neon database -> Query tab -> paste this file -> Run.
-- (Or Neon console -> SQL Editor.) Make sure you're on the default/production branch.

-- Workflow activity log (append-only): who did what to which item.
CREATE TABLE IF NOT EXISTS portal_activity (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor      text,                 -- real logged-in user, or "jefferson@ (via zoho)" for webhook-sourced
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

-- Confirm they exist:
-- SELECT table_name FROM information_schema.tables WHERE table_name IN ('portal_activity','portal_notifications');
