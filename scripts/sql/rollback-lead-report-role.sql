-- Roll back the read-only lead-report role created by provision-lead-report-role.sql.
--
-- Removes the RLS policy, revokes every grant, and drops the role so no
-- credential able to read marketing_leads is left behind. Idempotent:
-- DROP POLICY IF EXISTS + REVOKE are safe to re-run; DROP ROLE errors only if
-- the role still owns objects (it owns none — it only has SELECT grants).
--
-- After running this, also delete the role's connection string from ~/.secrets
-- and unset LP_REPORT_DB_URL.
--
-- HOW TO RUN:
--   psql "<admin connection string>" -f scripts/sql/rollback-lead-report-role.sql

DROP POLICY IF EXISTS lead_report_ro ON public.marketing_leads;

REVOKE ALL ON public.marketing_leads FROM mvt_lead_report;
REVOKE USAGE ON SCHEMA public FROM mvt_lead_report;
REVOKE CONNECT ON DATABASE postgres FROM mvt_lead_report;

DROP ROLE IF EXISTS mvt_lead_report;
