// Tests for worker-modules/lead-ingest-handler.js
//
// The handler is a plain script injected into the generated worker, so it has no
// exports. We load the source and evaluate it with a shim that hands the functions
// back, then drive it with stubbed fetch/env — no network, no database.
//
// Run: node scripts/test-lead-ingest-handler.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(
  path.join(here, '..', 'worker-modules', 'lead-ingest-handler.js'),
  'utf-8',
);

const load = new Function(`${source}\nreturn { handleLeadIngest };`);
const { handleLeadIngest } = load();

const ENV = {
  SUPABASE_URL: 'https://db.example.test',
  SUPABASE_SERVICE_KEY: 'service-key',
};

let calls = [];
const realFetch = globalThis.fetch;

// Route stubbed responses by destination; default everything to 200 OK.
function stubFetch(routes = {}) {
  globalThis.fetch = async (url, init) => {
    const target = String(url);
    calls.push({ url: target, body: init && init.body ? JSON.parse(init.body) : null });
    for (const [fragment, status] of Object.entries(routes)) {
      if (target.includes(fragment)) return new Response('stub', { status });
    }
    return new Response('{}', { status: 200 });
  };
}

function makeRequest(body, { method = 'POST', host = 'escape.myvivatour.com', rawBody } = {}) {
  const payload = rawBody !== undefined ? rawBody : JSON.stringify(body);
  return new Request(`https://${host}/api/lead`, {
    method,
    headers: {
      'content-type': 'application/json',
      'user-agent': 'test-agent',
      'cf-ipcountry': 'AU',
      ...(typeof payload === 'string' ? { 'content-length': String(Buffer.byteLength(payload)) } : {}),
    },
    body: method === 'POST' ? payload : undefined,
  });
}

async function run(body, opts = {}, routes = {}) {
  calls = [];
  stubFetch(routes);
  const req = makeRequest(body, opts);
  const url = new URL(req.url);
  const ctx = { waitUntil: (p) => p };
  const res = await handleLeadIngest(req, url, ENV, ctx);
  return { res, json: await res.clone().json(), calls };
}

let failures = 0;
function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures++;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const VALID = {
  landing_page: 'escape',
  full_name: 'Jane Traveller',
  email: 'jane@example.com',
  phone: '0400000000',
  state: 'NSW',
  message: 'Keen on the 10-day tour',
  utm_source: 'google',
  utm_campaign: 'escape-core-au',
  gclid: 'Cj0KTest',
  page_path: '/',
};

console.log('lead-ingest-handler');

{
  const { res, json, calls } = await run(VALID);
  check('accepts a valid lead', res.status === 200 && json.success === true, `status ${res.status}`);
  const supa = calls.find((c) => c.url.includes('marketing_leads'));
  check('writes to marketing_leads', Boolean(supa));
  check('persists utm_campaign', supa && supa.body.utm_campaign === 'escape-core-au');
  check('persists gclid', supa && supa.body.gclid === 'Cj0KTest');
  check('derives page_host from the request', supa && supa.body.page_host === 'escape.myvivatour.com');
  check('records ip_country from CF header', supa && supa.body.ip_country === 'AU');
  check('keeps the original payload in raw', supa && supa.body.raw.full_name === 'Jane Traveller');
  check('does not call Web3Forms', !calls.some((c) => c.url.includes('web3forms')));
  check('omits email_forwarded (browser owns email)',
    supa && !Object.prototype.hasOwnProperty.call(supa.body, 'email_forwarded'));
}

{
  const { res, json, calls } = await run({ ...VALID, botcheck: 'i am a bot' });
  check('honeypot returns 200 without storing', res.status === 200 && json.success === true);
  check('honeypot writes nothing', calls.length === 0, `${calls.length} calls made`);
}

{
  const { res } = await run({ landing_page: 'escape', full_name: 'No Contact' });
  check('rejects a lead with no email and no phone', res.status === 400);
}

{
  const { res } = await run({ ...VALID, email: 'not-an-email' });
  check('rejects a malformed email', res.status === 400);
}

{
  const { res } = await run({ ...VALID, email: '', phone: '0400000000' });
  check('accepts phone-only leads', res.status === 200);
}

{
  const { res } = await run(VALID, { host: 'evil.example.com' });
  check('rejects unknown hosts', res.status === 403);
}

{
  const { res } = await run(VALID, { method: 'GET' });
  check('rejects non-POST', res.status === 405);
}

{
  // Database down — DB-only path reports failure (client ignores this; email is browser-side).
  const { res, json, calls } = await run(VALID, {}, { marketing_leads: 500 });
  check('reports failure when database is down', res.status === 502 && json.success === false);
  check('still does not call Web3Forms when DB is down',
    !calls.some((c) => c.url.includes('web3forms')));
}

{
  // Missing secrets — same as DB unavailable.
  calls = [];
  stubFetch({});
  const req = makeRequest(VALID);
  const url = new URL(req.url);
  const res = await handleLeadIngest(req, url, {}, { waitUntil: () => {} });
  const json = await res.json();
  check('reports failure when Supabase secrets missing', res.status === 502 && json.success === false);
}

{
  const { calls } = await run(VALID, {}, {});
  const supa = calls.find((c) => c.url.includes('marketing_leads'));
  check('does not push to CRM when MVT_CRM_LEAD_URL is unset',
    !calls.some((c) => c.url.includes('crm')));
  check('leaves crm_synced_at unset for later backfill', supa && supa.body.crm_synced_at === undefined);
}

{
  const { calls } = await run({ ...VALID, landing_first_seen: '2026-08-01T10:00:00.000Z' });
  const supa = calls.find((c) => c.url.includes('marketing_leads'));
  check('stores landing_first_seen', supa && supa.body.landing_first_seen === '2026-08-01T10:00:00.000Z');
}

{
  const { res, calls } = await run({ ...VALID, landing_first_seen: 'not-a-date' });
  const supa = calls.find((c) => c.url.includes('marketing_leads'));
  check('nulls an unparseable landing_first_seen instead of failing the insert',
    res.status === 200 && supa && supa.body.landing_first_seen === null);
}

{
  const longMessage = 'x'.repeat(9000);
  const { calls } = await run({ ...VALID, message: longMessage });
  const supa = calls.find((c) => c.url.includes('marketing_leads'));
  check('caps oversized message at 5000 chars', supa && supa.body.message.length === 5000);
}

{
  // Server-derived page_host must win over a client-spoofed value.
  const { calls } = await run({ ...VALID, page_host: 'evil.spoofed.com' });
  const supa = calls.find((c) => c.url.includes('marketing_leads'));
  check('server page_host overwrites client spoof',
    supa && supa.body.page_host === 'escape.myvivatour.com');
}

{
  // Too many keys.
  const bloated = { ...VALID };
  for (let i = 0; i < 50; i++) bloated[`extra_${i}`] = 'x';
  const { res, json, calls } = await run(bloated);
  check('rejects body with too many keys', res.status === 413 && json.success === false);
  check('does not write oversized-key payloads', calls.length === 0);
}

{
  // Payload larger than LEAD_MAX_BODY_BYTES via content-length gate.
  const huge = { ...VALID, message: 'y'.repeat(40000) };
  const { res, json, calls } = await run(huge);
  check('rejects oversized payload', res.status === 413 && json.success === false,
    `status ${res.status}`);
  check('does not write oversized payloads', calls.length === 0);
}

// Source-level: forwardLeadToEmail / web3forms must be gone from handler.
check('source has no forwardLeadToEmail', !source.includes('forwardLeadToEmail'));
check('source has no web3forms URL', !source.includes('web3forms.com'));
check('source has no WEB3FORMS_KEY binding', !source.includes('WEB3FORMS_KEY'));

globalThis.fetch = realFetch;

console.log(failures === 0 ? '\nAll lead-ingest checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
