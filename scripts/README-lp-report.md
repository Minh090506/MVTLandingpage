# lp-report — per-landing-page lead report (read-only, local CLI)

`scripts/lp-report.mjs` prints, for every landing page that declares a
`canonicalHost` in `data/landing-pages.json`, a one-row aggregate from
`marketing_leads`:

| host | leads | gclid% | campaign | last_lead_at |
|------|-------|--------|----------|--------------|

- **Read-only is enforced at the database**, not by client trust — the CLI
  connects as a dedicated Postgres role that only has `SELECT` on the three
  non-PII columns (`page_host`, `gclid`, `created_at`).
- `campaign` is printed from the **registry**, not the DB (`utm_campaign` is not
  granted).
- The report window is `--days N` (default 30) **intersected** with the data
  floor `2026-08-12` — not lifetime.

## One-time setup (human gate)

1. **Provision the role** (requires an admin connection string; not done by any
   automated step). Confirm the timestamp column name and RLS state first — the
   CLI's preflight reports both on a real run.

   ```bash
   psql "<admin connection string>" \
     -v pw='<choose-a-strong-password>' \
     -f scripts/sql/provision-lead-report-role.sql
   ```

   Only run the RLS policy section if `marketing_leads` has RLS enabled; with RLS
   on and no policy for this role, `SELECT` silently returns 0 rows.

2. **Store the role connection string in `~/.secrets`** (never in the repo) and
   export it:

   ```bash
   export LP_REPORT_DB_URL="postgresql://mvt_lead_report:<pw>@<host>:5432/postgres"
   ```

3. **Install deps** (once): `npm install`.

## Run

```bash
node scripts/lp-report.mjs --days 30          # real run (needs LP_REPORT_DB_URL)
node scripts/lp-report.mjs --dry-run --days 30 # print the SQL, no DB connection
```

Without `LP_REPORT_DB_URL` and without `--dry-run`, the CLI exits non-zero with a
setup message and connects to nothing.

## Rollback

Remove the role, its grants, and its policy, then delete the connection string
from `~/.secrets` and unset `LP_REPORT_DB_URL`:

```bash
psql "<admin connection string>" -f scripts/sql/rollback-lead-report-role.sql
```
