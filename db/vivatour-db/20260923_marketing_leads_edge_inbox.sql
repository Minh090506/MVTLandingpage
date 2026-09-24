-- marketing_leads → edge inbox for the landing-page Worker (phase 2, decision D)
--
-- Adds receipt/idempotency + gateway-forward columns. Idempotent (IF NOT EXISTS).
-- No backfill: the 26 existing rows keep turnstile_verified_at NULL, so the replay
-- job never selects them (backfill is a separate, conductor-owned task).
-- RLS stays on with 0 policies — only the service key reads/writes this table.

alter table public.marketing_leads
  add column if not exists request_id text,
  add column if not exists body_hash text,
  add column if not exists turnstile_verified_at timestamptz,
  add column if not exists crm_ack_at timestamptz,
  add column if not exists crm_receipt_id text,
  add column if not exists forward_attempts int not null default 0,
  add column if not exists gbraid text,
  add column if not exists wbraid text,
  add column if not exists landing_url text;

-- Receipt lookup key: same request_id must never insert twice.
create unique index if not exists marketing_leads_request_id_uidx
  on public.marketing_leads (request_id)
  where request_id is not null;

-- Replay scan: unacknowledged, Turnstile-verified rows oldest-first.
create index if not exists marketing_leads_replay_idx
  on public.marketing_leads (created_at)
  where crm_ack_at is null and turnstile_verified_at is not null;
