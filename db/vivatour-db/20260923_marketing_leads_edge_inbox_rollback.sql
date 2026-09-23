-- Rollback for 20260923_marketing_leads_edge_inbox.sql
--
-- Drops the indexes and columns added by the edge-inbox migration.
-- Data loss: request_id/body_hash/turnstile_verified_at/crm_ack_at/crm_receipt_id/
-- forward_attempts/gbraid/wbraid/landing_url values are discarded. Rows themselves
-- are untouched. Forward with care once the Worker has written receipts.

drop index if exists public.marketing_leads_replay_idx;
drop index if exists public.marketing_leads_request_id_uidx;

alter table public.marketing_leads
  drop column if exists request_id,
  drop column if exists body_hash,
  drop column if exists turnstile_verified_at,
  drop column if exists crm_ack_at,
  drop column if exists crm_receipt_id,
  drop column if exists forward_attempts,
  drop column if exists gbraid,
  drop column if exists wbraid,
  drop column if exists landing_url;
