#!/usr/bin/env node
// lp-report.mjs — per-landing-page lead report (read-only, local CLI).
//
// Reads the file registry (data/landing-pages.json via scripts/lib/load-registry.js)
// and, for every LP that declares a canonicalHost, runs ONE aggregate SQL query
// against marketing_leads to print {leads, gclid%, campaign, last_lead_at}.
//
// SECURITY / DESIGN
//   - Read-only is enforced at the DATABASE (the mvt_lead_report role only has
//     SELECT on 3 non-PII columns), never by client trust. This CLI merely
//     selects page_host, gclid, created_at — it never reads email/phone/message.
//   - The connection string comes from the LP_REPORT_DB_URL env var, which the
//     user sources from ~/.secrets. It is never hardcoded, never committed,
//     never logged. Without it (and without --dry-run) the CLI exits non-zero
//     and connects to nothing.
//   - `campaign` is printed from the REGISTRY, not the DB (utm_campaign is not
//     granted to the role).
//   - All row filters are parameterized; the only interpolated identifier is the
//     timestamp column name, which is whitelisted against a strict pattern after
//     being discovered from information_schema at real-run time.
//
// USAGE
//   1. Provision the read-only role once (human gate):
//        psql "<admin url>" -v pw=... -f scripts/sql/provision-lead-report-role.sql
//   2. Store that role's connection string in ~/.secrets and export it:
//        export LP_REPORT_DB_URL="postgresql://mvt_lead_report:...@host:5432/postgres"
//   3. Run:
//        node scripts/lp-report.mjs --days 30
//        node scripts/lp-report.mjs --dry-run --days 30   # prints SQL, no DB
//
// See scripts/README-lp-report.md for the full provisioning + rollback flow.

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { loadRegistry } = require('./lib/load-registry.js');

// Data floor: leads are only trustworthy from this date onward (the tracking fix
// landed then). The report window is the intersection of --days and this floor.
const DATA_FLOOR_DATE = '2026-08-12';
const DEFAULT_DAYS = 30;
const ENV_VAR = 'LP_REPORT_DB_URL';

// ---- arg parsing ---------------------------------------------------------

function parseArgs(argv) {
  const args = { dryRun: false, days: DEFAULT_DAYS };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') {
      args.dryRun = true;
    } else if (a === '--days') {
      args.days = argv[++i];
    } else if (a.startsWith('--days=')) {
      args.days = a.slice('--days='.length);
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  const days = Number(args.days);
  if (!Number.isInteger(days) || days <= 0) {
    throw new Error(`--days must be a positive integer, got: ${args.days}`);
  }
  args.days = days;
  return args;
}

function printHelp() {
  process.stdout.write(
    'Usage: node scripts/lp-report.mjs [--dry-run] [--days N]\n' +
    `  --days N    lookback window in days (default ${DEFAULT_DAYS}); ` +
    `intersected with the ${DATA_FLOOR_DATE} data floor\n` +
    '  --dry-run   print the SQL that would run, without connecting to any DB\n' +
    `  Requires ${ENV_VAR} for a real run (see scripts/README-lp-report.md).\n`
  );
}

// ---- SQL builder ---------------------------------------------------------

// Identifier whitelist for the discovered timestamp column (cannot be a bind param).
const IDENT_RE = /^[a-z_][a-z0-9_]*$/;

function assertSafeIdent(name) {
  if (!IDENT_RE.test(name)) {
    throw new Error(`Unsafe/unknown timestamp column name from preflight: ${name}`);
  }
  return name;
}

// Builds the per-host aggregate query. Selects ONLY the 3 non-PII columns
// (aggregated). $1 = page_host, $2 = days. tsCol is a whitelisted identifier.
function buildHostQuery(tsCol = 'created_at') {
  const col = assertSafeIdent(tsCol);
  const text =
`SELECT
  count(*)::int AS leads,
  round(count(gclid)::numeric / NULLIF(count(*), 0), 4) AS gclid_ratio,
  max(${col}) AS last_lead_at
FROM public.marketing_leads
WHERE page_host = $1
  AND ${col} >= now() - ($2 || ' days')::interval
  AND ${col} >= '${DATA_FLOOR_DATE}'`;
  return text;
}

// ---- registry -> host list ----------------------------------------------

function hostEntries() {
  const registry = loadRegistry();
  return Object.entries(registry)
    .filter(([, cfg]) => typeof cfg.canonicalHost === 'string' && cfg.canonicalHost.length > 0)
    .map(([slug, cfg]) => ({
      slug,
      host: cfg.canonicalHost,
      campaign: cfg.campaign ?? null,
    }));
}

// ---- output --------------------------------------------------------------

function formatPct(ratio) {
  if (ratio === null || ratio === undefined) return '—';
  return `${(Number(ratio) * 100).toFixed(1)}%`;
}

function printTable(rows) {
  const cols = [
    ['host', (r) => r.host],
    ['leads', (r) => String(r.leads)],
    ['gclid%', (r) => formatPct(r.gclidRatio)],
    ['campaign', (r) => (r.campaign === null ? '—' : String(r.campaign))],
    ['last_lead_at', (r) => (r.lastLeadAt ? String(r.lastLeadAt) : '—')],
  ];
  const widths = cols.map(([h, get]) =>
    Math.max(h.length, ...rows.map((r) => get(r).length)));
  const line = (cells) =>
    cells.map((c, i) => c.padEnd(widths[i])).join('  ');
  process.stdout.write(line(cols.map(([h]) => h)) + '\n');
  process.stdout.write(widths.map((w) => '-'.repeat(w)).join('  ') + '\n');
  for (const r of rows) {
    process.stdout.write(line(cols.map(([, get]) => get(r))) + '\n');
  }
}

// ---- dry-run -------------------------------------------------------------

function runDryRun(args) {
  const entries = hostEntries();
  const sql = buildHostQuery('created_at');
  process.stdout.write(
    `DRY RUN — no database connection. Window: last ${args.days} days ` +
    `INTERSECTED with data floor >= ${DATA_FLOOR_DATE}.\n` +
    'Timestamp column assumed "created_at" (real run confirms via preflight).\n' +
    'Bind params per host: $1 = <canonicalHost>, $2 = ' + `'${args.days}'` + ' (days as text).\n\n'
  );
  for (const e of entries) {
    process.stdout.write(`# ${e.slug}  host=${e.host}  campaign(registry)=${e.campaign ?? 'null'}\n`);
    process.stdout.write(sql + ';\n');
    process.stdout.write(`  -- $1='${e.host}'  $2='${args.days}'\n\n`);
  }
  process.stdout.write(
    `${entries.length} host(s) would be queried. Report data is only from ` +
    `>= ${DATA_FLOOR_DATE}, not lifetime.\n`
  );
}

// ---- real run ------------------------------------------------------------

async function detectTimestampColumn(client) {
  const { rows } = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'marketing_leads'
       AND column_name IN ('created_at', 'inserted_at')
     ORDER BY (column_name = 'created_at') DESC
     LIMIT 1`
  );
  if (rows.length === 0) {
    throw new Error(
      "Could not find a 'created_at' or 'inserted_at' column on public.marketing_leads."
    );
  }
  return rows[0].column_name;
}

async function detectRls(client) {
  const rel = await client.query(
    `SELECT relrowsecurity FROM pg_class
     WHERE oid = 'public.marketing_leads'::regclass`
  );
  const rlsEnabled = rel.rows.length > 0 && rel.rows[0].relrowsecurity === true;
  const pol = await client.query(
    `SELECT policyname FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'marketing_leads'`
  );
  return { rlsEnabled, policyCount: pol.rows.length };
}

async function runReal(args) {
  const connStr = process.env[ENV_VAR];
  if (!connStr) {
    process.stderr.write(
      `${ENV_VAR} is not set — refusing to connect.\n` +
      'This CLI never uses a default/embedded connection string.\n\n' +
      'To run against the database:\n' +
      '  1. Provision the read-only role (once, human gate):\n' +
      '       psql "<admin url>" -v pw=... -f scripts/sql/provision-lead-report-role.sql\n' +
      `  2. Store the role connection string in ~/.secrets and export it:\n` +
      `       export ${ENV_VAR}="postgresql://mvt_lead_report:...@host:5432/postgres"\n` +
      '  3. Re-run: node scripts/lp-report.mjs --days ' + args.days + '\n\n' +
      'Or preview the SQL without a database: node scripts/lp-report.mjs --dry-run\n'
    );
    process.exitCode = 2;
    return;
  }

  const entries = hostEntries();
  let pg;
  try {
    ({ default: pg } = await import('pg'));
  } catch {
    process.stderr.write(
      "The 'pg' package is not installed. Run: npm install\n"
    );
    process.exitCode = 1;
    return;
  }

  const client = new pg.Client({ connectionString: connStr });
  try {
    await client.connect();
  } catch (err) {
    // Never echo the connection string; report only the driver message.
    process.stderr.write(`Failed to connect to the lead database: ${err.message}\n`);
    process.exitCode = 1;
    return;
  }

  try {
    const tsCol = await detectTimestampColumn(client);
    const { rlsEnabled, policyCount } = await detectRls(client);
    if (rlsEnabled && policyCount === 0) {
      process.stderr.write(
        'WARNING: RLS is enabled on marketing_leads but no policy exists — ' +
        'SELECT may return 0 rows (default-deny). Run the RLS policy section of ' +
        'scripts/sql/provision-lead-report-role.sql.\n'
      );
    }
    const sql = buildHostQuery(tsCol);

    const rows = [];
    for (const e of entries) {
      let leads = 0;
      let gclidRatio = null;
      let lastLeadAt = null;
      try {
        const res = await client.query(sql, [e.host, String(args.days)]);
        const r = res.rows[0] || {};
        leads = r.leads ?? 0;
        gclidRatio = r.gclid_ratio ?? null;
        lastLeadAt = r.last_lead_at ?? null;
      } catch (err) {
        process.stderr.write(`  query failed for ${e.host}: ${err.message}\n`);
      }
      rows.push({
        host: e.host,
        leads,
        gclidRatio,
        campaign: e.campaign,
        lastLeadAt,
      });
    }

    process.stdout.write(
      `Lead report — window: last ${args.days} days INTERSECTED with ` +
      `>= ${DATA_FLOOR_DATE} (not lifetime). Timestamp column: ${tsCol}.\n\n`
    );
    printTable(rows);
  } finally {
    await client.end();
  }
}

// ---- main ----------------------------------------------------------------

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`${err.message}\n\n`);
    printHelp();
    process.exitCode = 2;
    return;
  }

  if (args.help) {
    printHelp();
    return;
  }

  if (args.dryRun) {
    runDryRun(args);
    return;
  }

  await runReal(args);
}

main().catch((err) => {
  process.stderr.write(`Unexpected error: ${err.message}\n`);
  process.exitCode = 1;
});
