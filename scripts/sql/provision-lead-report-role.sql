-- Provision a read-only Postgres role for the landing-page lead report.
--
-- WHAT THIS DOES
--   Creates login role `mvt_lead_report` that can SELECT ONLY the three
--   non-PII columns (page_host, gclid, created_at) of public.marketing_leads.
--   No INSERT/UPDATE/DELETE, no PII columns (email/phone/message/raw), no
--   utm_campaign (campaign is sourced from the file registry, not the DB).
--
-- RUN ORDER IS DELIBERATE: role FIRST -> grants -> RLS policy. A policy that
-- references a role that does not yet exist would fail; creating the role first
-- makes the whole script idempotent and re-runnable.
--
-- PRECONDITIONS (confirm via preflight before running — see scripts/lp-report.mjs):
--   1. Confirm the timestamp column name is `created_at` (vs `inserted_at`) via
--      information_schema.columns. If it differs, adjust the GRANT + the '2026-08-12'
--      window column in the report accordingly.
--   2. Only run the RLS policy section if marketing_leads has RLS enabled
--      (pg_class.relrowsecurity). With RLS on and NO policy for this role, SELECT
--      returns 0 rows silently (default-deny) — the report would under-count to 0.
--
-- HOW TO RUN (password never echoed into shell history / logs):
--   psql "<admin connection string>" \
--     -v pw="$(read -rs -p 'role password: ' p; echo "$p")" \
--     -f scripts/sql/provision-lead-report-role.sql
--   (or pass -v pw=... from a secret manager; do NOT hardcode a password here)
--
-- This SQL is written but NOT executed by any automated step. A human runs it
-- once, then stores the resulting connection string in ~/.secrets and exports
-- LP_REPORT_DB_URL for scripts/lp-report.mjs. See scripts/README-lp-report.md.

-- 1) Role first. CREATE ROLE inside a DO block canNOT interpolate the psql
--    :'pw' variable, so create the role WITHOUT a password here, then set the
--    password with ALTER ROLE outside the DO block (where :'pw' works).
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'mvt_lead_report') THEN
    CREATE ROLE mvt_lead_report LOGIN;
  END IF;
END
$$;

ALTER ROLE mvt_lead_report PASSWORD :'pw';

-- 2) Minimal grants. Column-level SELECT — NO INSERT/UPDATE/DELETE, NO PII
--    columns (email/phone/message/raw), NO utm_campaign.
GRANT CONNECT ON DATABASE postgres TO mvt_lead_report;
GRANT USAGE ON SCHEMA public TO mvt_lead_report;
GRANT SELECT (page_host, gclid, created_at) ON public.marketing_leads TO mvt_lead_report;

-- 3) RLS policy — run this section ONLY if preflight shows RLS is enabled on
--    marketing_leads. Idempotent (DROP IF EXISTS before CREATE). The column
--    grant above still blocks PII even though USING (true) allows every row.
--    NEVER grant BYPASSRLS to this role.
DROP POLICY IF EXISTS lead_report_ro ON public.marketing_leads;
CREATE POLICY lead_report_ro ON public.marketing_leads
  FOR SELECT TO mvt_lead_report USING (true);
