// Tests for worker-modules/lead-ingest-handler.js (edge inbox: Turnstile + receipt)
//
// The handler is a plain script injected into the generated worker, so it has no
// exports. We load the source and evaluate it with a shim that hands the functions
// back, then drive it with stubbed fetch/env — no network, no database.
//
// Run: node scripts/test-lead-ingest-handler.mjs

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(
  path.join(here, '..', 'worker-modules', 'lead-ingest-handler.js'),
  'utf-8',
);

const load = new Function(
  `${source}\nreturn { handleLeadIngest, forwardToGateway, handleLeadScheduled, computeLeadBodyHash };`,
);
const mod = load();

const BASE_ENV = {
  SUPABASE_URL: 'https://db.example.test',
  SUPABASE_SERVICE_KEY: 'service-key',
  TURNSTILE_SECRET: 'ts-test-secret',
};
const GATEWAY_ENV = {
  ...BASE_ENV,
  MVT_LEAD_GATEWAY_URL: 'https://gw.example.test',
  LEAD_GATEWAY_HMAC_SECRET: 'test-hmac-secret',
};

let calls = [];
let waitUntils = [];
const realFetch = globalThis.fetch;

// Route stubs: list of { match(url, init), respond(url, init) → Response }.
// Defaults below cover the happy path: siteverify OK, no receipt, insert succeeds.
function defaultRoutes() {
  return [
    {
      match: (url) => url.includes('challenges.cloudflare.com/turnstile'),
      respond: () => jsonResponse(200, { success: true }),
    },
    {
      match: (url, init) => (init.method || 'GET') === 'GET' && url.includes('request_id=eq.'),
      respond: () => jsonResponse(200, []),
    },
    {
      match: (url, init) => (init.method || 'GET') === 'POST' && url.includes('/marketing_leads'),
      respond: (url, init) => jsonResponse(201, [{ ...JSON.parse(init.body), id: 'edge-receipt-1' }]),
    },
  ];
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function stubFetch(routes) {
  globalThis.fetch = async (url, init = {}) => {
    const target = String(url);
    calls.push({ url: target, method: init.method || 'GET', init });
    for (const route of routes) {
      if (route.match(target, init)) return route.respond(target, init);
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
      'cf-connecting-ip': '203.0.113.7',
      ...(typeof payload === 'string' ? { 'content-length': String(Buffer.byteLength(payload)) } : {}),
    },
    body: method === 'POST' ? payload : undefined,
  });
}

async function run(body, opts = {}, { env = BASE_ENV, routes } = {}) {
  calls = [];
  waitUntils = [];
  stubFetch(routes || defaultRoutes());
  const req = makeRequest(body, opts);
  const url = new URL(req.url);
  const ctx = { waitUntil: (p) => { waitUntils.push(p); return p; } };
  const res = await mod.handleLeadIngest(req, url, env, ctx);
  const json = await res.clone().json();
  return { res, json, calls, env, ctx };
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
  travel_date: '2026-11-02',
  party_size: '2',
  tour_interest: '10-day escape',
  utm_source: 'google',
  utm_campaign: 'escape-core-au',
  gclid: 'Cj0KTest',
  gbraid: 'GB-Test',
  wbraid: 'WB-Test',
  landing_url: 'https://escape.myvivatour.com/?utm_source=google',
  requestId: '11111111-2222-4333-8444-555555555555',
  turnstileToken: 'tok-single-use',
  page_path: '/',
};

console.log('lead-ingest-handler');

{
  const { res, json, calls } = await run(VALID);
  check('accepts a verified lead', res.status === 200 && json.success === true, `status ${res.status}`);
  check('returns the receipt id', json.receiptId === 'edge-receipt-1');
  check('returns the requestId', json.requestId === VALID.requestId);
  const insert = calls.find((c) => c.method === 'POST' && c.url.includes('/marketing_leads'));
  check('writes to marketing_leads', Boolean(insert));
  const row = insert && insert.init.body ? JSON.parse(insert.init.body) : {};
  check('persists utm_campaign', row.utm_campaign === 'escape-core-au');
  check('persists gclid', row.gclid === 'Cj0KTest');
  check('persists gbraid/wbraid', row.gbraid === 'GB-Test' && row.wbraid === 'WB-Test');
  check('persists landing_url', row.landing_url === VALID.landing_url);
  check('persists request_id + body_hash + turnstile_verified_at',
    row.request_id === VALID.requestId && typeof row.body_hash === 'string' && row.body_hash.length === 64
      && typeof row.turnstile_verified_at === 'string');
  check('derives page_host from the request', row.page_host === 'escape.myvivatour.com');
  check('records ip_country from CF header', row.ip_country === 'AU');
  check('keeps the original payload in raw minus the turnstile token',
    row.raw.full_name === 'Jane Traveller' && !('turnstileToken' in row.raw));
  check('siteverify called with secret, token and remoteip', (() => {
    const sv = calls.find((c) => c.url.includes('siteverify'));
    if (!sv) return false;
    const body = JSON.parse(sv.init.body);
    return body.secret === 'ts-test-secret' && body.response === 'tok-single-use'
      && body.remoteip === '203.0.113.7';
  })());
  check('does not call Web3Forms', !calls.some((c) => c.url.includes('web3forms')));
  check('omits email_forwarded (browser owns email)',
    !Object.prototype.hasOwnProperty.call(row, 'email_forwarded'));
  check('leaves crm_synced_at unset', row.crm_synced_at === undefined);
}

{
  const { res, json, calls } = await run({ ...VALID, botcheck: 'i am a bot' });
  check('honeypot returns 200 without storing', res.status === 200 && json.success === true);
  check('honeypot writes nothing', calls.length === 0, `${calls.length} calls made`);
}

{
  const { res, json } = await run({ ...VALID, requestId: undefined });
  check('rejects a missing requestId with missing_request_id',
    res.status === 400 && json.message === 'missing_request_id');
}

{
  const { res, json } = await run({ ...VALID, requestId: 'not-a-uuid' });
  check('rejects a non-UUID requestId', res.status === 400 && /request_id/.test(json.message));
}

{
  const { res } = await run({ landing_page: 'escape', full_name: 'No Contact', requestId: VALID.requestId });
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
  // Bot with no Turnstile token → rejected before siteverify, nothing inserted.
  const { res, json, calls } = await run({ ...VALID, turnstileToken: undefined });
  check('missing turnstile token → 403 turnstile_rejected',
    res.status === 403 && json.error === 'turnstile_rejected');
  check('no INSERT without a token',
    !calls.some((c) => c.method === 'POST' && c.url.includes('/marketing_leads')));
  check('siteverify skipped when token absent', !calls.some((c) => c.url.includes('siteverify')));
}

{
  // Token rejected by Cloudflare → 403, nothing inserted.
  const { res, json, calls } = await run(VALID, {}, {
    routes: [
      { match: (u) => u.includes('siteverify'), respond: () => jsonResponse(200, { success: false }) },
      { match: (u, i) => (i.method || 'GET') === 'POST' && u.includes('/marketing_leads'), respond: () => jsonResponse(201, [{ id: 'x' }]) },
    ],
  });
  check('rejected token → 403', res.status === 403 && json.error === 'turnstile_rejected');
  check('no INSERT on rejected token',
    !calls.some((c) => c.method === 'POST' && c.url.includes('/marketing_leads')));
}

{
  // Missing TURNSTILE_SECRET → fail-closed 503 with retry:new_token.
  const { res, json, calls } = await run(VALID, {}, { env: { ...BASE_ENV, TURNSTILE_SECRET: undefined } });
  check('missing turnstile secret → 503 fail-closed', res.status === 503);
  check('503 body asks for a new token', json.retry === 'new_token');
  check('fail-closed writes nothing',
    !calls.some((c) => c.method === 'POST' && c.url.includes('/marketing_leads')));
}

{
  // Receipt exists with the same body hash → stored ACK, no Turnstile burn.
  const hash = await mod.computeLeadBodyHash(VALID);
  const { res, json, calls } = await run(VALID, {}, {
    routes: [
      { match: (u) => u.includes('siteverify'), respond: () => jsonResponse(200, { success: true }) },
      {
        match: (u, i) => (i.method || 'GET') === 'GET' && u.includes('request_id=eq.'),
        respond: () => jsonResponse(200, [{ id: 'existing-receipt', body_hash: hash }]),
      },
      { match: (u, i) => (i.method || 'GET') === 'POST' && u.includes('/marketing_leads'), respond: () => jsonResponse(201, [{ id: 'never' }]) },
    ],
  });
  check('same-hash receipt → 200 ACK', res.status === 200 && json.success === true);
  check('ACK marked duplicate with stored receipt id',
    json.duplicate === true && json.receiptId === 'existing-receipt');
  check('duplicate ACK skips siteverify', !calls.some((c) => c.url.includes('siteverify')));
  check('duplicate ACK inserts nothing',
    !calls.some((c) => c.method === 'POST' && c.url.includes('/marketing_leads')));
}

{
  // body_hash ignores protocol fields: a fresh token + same business payload hashes equal.
  const a = await mod.computeLeadBodyHash({ ...VALID, turnstileToken: 'tok-1' });
  const b = await mod.computeLeadBodyHash({ ...VALID, turnstileToken: 'tok-2', requestId: VALID.requestId });
  check('hash stable across token/requestId changes', a === b);
  const c = await mod.computeLeadBodyHash({ ...VALID, message: 'different' });
  check('hash changes with business payload', a !== c);
}

{
  // Receipt with a different hash → 409.
  const { res, json } = await run({ ...VALID, message: 'different intent' }, {}, {
    routes: [
      {
        match: (u, i) => (i.method || 'GET') === 'GET' && u.includes('request_id=eq.'),
        respond: () => jsonResponse(200, [{ id: 'existing-receipt', body_hash: 'deadbeef' }]),
      },
    ],
  });
  check('different-hash receipt → 409', res.status === 409 && json.error === 'request_id_conflict');
}

{
  // Insert infra failure → 503 new_token (token spent, client must reset).
  const { res, json } = await run(VALID, {}, {
    routes: [
      { match: (u) => u.includes('siteverify'), respond: () => jsonResponse(200, { success: true }) },
      { match: (u, i) => (i.method || 'GET') === 'POST' && u.includes('/marketing_leads'), respond: () => jsonResponse(500, 'db down') },
    ],
  });
  check('insert 5xx → 503 new_token', res.status === 503 && json.retry === 'new_token');
}

{
  // Concurrent insert hit the unique index → read the winner's receipt → ACK.
  const hash = await mod.computeLeadBodyHash(VALID);
  let insertTried = false;
  const { res, json } = await run(VALID, {}, {
    routes: [
      { match: (u) => u.includes('siteverify'), respond: () => jsonResponse(200, { success: true }) },
      {
        match: (u, i) => (i.method || 'GET') === 'GET' && u.includes('request_id=eq.'),
        respond: () => jsonResponse(200, insertTried ? [{ id: 'winner-receipt', body_hash: hash }] : []),
      },
      {
        match: (u, i) => (i.method || 'GET') === 'POST' && u.includes('/marketing_leads'),
        respond: () => { insertTried = true; return jsonResponse(409, { code: '23505' }); },
      },
    ],
  });
  check('insert 409 → ACK from winner receipt',
    res.status === 200 && json.success === true && json.receiptId === 'winner-receipt');
}

{
  // Receipt lookup infra error → 503 new_token.
  const { res, json } = await run(VALID, {}, {
    routes: [
      { match: (u, i) => (i.method || 'GET') === 'GET' && u.includes('request_id=eq.'), respond: () => jsonResponse(500, 'db down') },
    ],
  });
  check('lookup 5xx → 503 new_token', res.status === 503 && json.retry === 'new_token');
}

{
  // Missing Supabase secrets — same as DB unavailable (now 503 new_token).
  calls = [];
  stubFetch(defaultRoutes());
  const req = makeRequest(VALID);
  const url = new URL(req.url);
  const res = await mod.handleLeadIngest(req, url, { TURNSTILE_SECRET: 'x' }, { waitUntil: () => {} });
  const json = await res.json();
  check('reports 503 new_token when Supabase secrets missing',
    res.status === 503 && json.success === false && json.retry === 'new_token');
}

{
  // Rate limiter binding present and over limit → 429 before any DB call.
  calls = [];
  stubFetch(defaultRoutes());
  const req = makeRequest(VALID);
  const url = new URL(req.url);
  const res = await mod.handleLeadIngest(req, url, {
    ...BASE_ENV,
    LEAD_RATE_LIMITER: { limit: async () => ({ success: false }) },
  }, { waitUntil: () => {} });
  check('rate limiter over limit → 429', res.status === 429);
  check('429 makes no DB calls', calls.length === 0);
}

{
  // A throwing limiter must fail open (Turnstile still gates the request).
  const { res } = await run(VALID, {}, {
    env: { ...BASE_ENV, LEAD_RATE_LIMITER: { limit: async () => { throw new Error('boom'); } } },
  });
  check('throwing rate limiter fails open', res.status === 200);
}

{
  const { calls } = await run({ ...VALID, landing_first_seen: '2026-08-01T10:00:00.000Z' });
  const insert = calls.find((c) => c.method === 'POST' && c.url.includes('/marketing_leads'));
  const row = JSON.parse(insert.init.body);
  check('stores landing_first_seen', row.landing_first_seen === '2026-08-01T10:00:00.000Z');
}

{
  const { res, calls } = await run({ ...VALID, landing_first_seen: 'not-a-date' });
  const insert = calls.find((c) => c.method === 'POST' && c.url.includes('/marketing_leads'));
  const row = JSON.parse(insert.init.body);
  check('nulls an unparseable landing_first_seen instead of failing the insert',
    res.status === 200 && row.landing_first_seen === null);
}

{
  const longMessage = 'x'.repeat(9000);
  const { calls } = await run({ ...VALID, message: longMessage });
  const insert = calls.find((c) => c.method === 'POST' && c.url.includes('/marketing_leads'));
  check('caps oversized message at 5000 chars', JSON.parse(insert.init.body).message.length === 5000);
}

{
  // Server-derived page_host must win over a client-spoofed value.
  const { calls } = await run({ ...VALID, page_host: 'evil.spoofed.com' });
  const insert = calls.find((c) => c.method === 'POST' && c.url.includes('/marketing_leads'));
  check('server page_host overwrites client spoof',
    JSON.parse(insert.init.body).page_host === 'escape.myvivatour.com');
}

{
  // Too many keys.
  const bloated = { ...VALID };
  for (let i = 0; i < 80; i++) bloated[`extra_${i}`] = 'x';
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

// ---- Gateway forward (HMAC contract) -----------------------------------------

function gatewayRoute(status, body = { success: true, receiptId: 'gw-receipt-9' }) {
  return { match: (u) => u.includes('/api/internal/lead-intake/'), respond: () => jsonResponse(status, body) };
}
function patchCalls() {
  return calls.filter((c) => c.method === 'PATCH' && c.url.includes('/marketing_leads'));
}

{
  const { res } = await run(VALID, {}, { env: GATEWAY_ENV, routes: [...defaultRoutes(), gatewayRoute(200)] });
  await Promise.all(waitUntils);
  check('successful submit still ACKs', res.status === 200);
  const gw = calls.find((c) => c.url.includes('/api/internal/lead-intake/'));
  check('forward posted to the host gateway URL', Boolean(gw) && gw.url.startsWith('https://gw.example.test'));
  const publicId = 'da6736a68ba84c1a';
  check('forward path carries the escape publicId', gw.url.endsWith(`/api/internal/lead-intake/${publicId}`));

  // Verify the HMAC exactly as the contract defines it.
  const gwUrl = new URL(gw.url);
  const ts = gw.init.headers['x-mvt-timestamp'];
  const rawBody = gw.init.body;
  const bodySha = crypto.createHash('sha256').update(rawBody).digest('hex');
  const expected = crypto.createHmac('sha256', 'test-hmac-secret')
    .update(`POST\n${gwUrl.pathname}\n${publicId}\n${bodySha}\n${ts}`)
    .digest('hex');
  check('x-mvt-signature matches the contract HMAC', gw.init.headers['x-mvt-signature'] === expected);
  check('x-mvt-timestamp is unix seconds', /^\d{10}$/.test(ts));

  const gwBody = JSON.parse(rawBody);
  check('gateway body carries requestId + edgeReceiptId',
    gwBody.requestId === VALID.requestId && gwBody.edgeReceiptId === 'edge-receipt-1');
  check('gateway body carries turnstileVerifiedAt + landingUrl',
    typeof gwBody.turnstileVerifiedAt === 'string' && gwBody.landingUrl === VALID.landing_url);
  check('answers.contact prefers phone', gwBody.answers.contact === '0400000000'
    && gwBody.answers.whatsapp === '0400000000' && gwBody.answers.email === 'jane@example.com');
  check('answers.note merges trip lines',
    gwBody.answers.note === 'Travel date: 2026-11-02\nParty size: 2\nTour: 10-day escape\nState: NSW\nMessage: Keen on the 10-day tour');
  check('utm block carries click ids incl gbraid/wbraid',
    gwBody.utm.gclid === 'Cj0KTest' && gwBody.utm.gbraid === 'GB-Test'
      && gwBody.utm.wbraid === 'WB-Test' && gwBody.utm.utm_campaign === 'escape-core-au');

  const patch = patchCalls();
  check('forward 200 → PATCH crm_ack_at + receipt id', patch.length === 1
    && typeof JSON.parse(patch[0].init.body).crm_ack_at === 'string'
    && JSON.parse(patch[0].init.body).crm_receipt_id === 'gw-receipt-9');
}

{
  const host = 'implant.vietnamdentaltravel.com';
  const { res } = await run(VALID, { host }, { env: GATEWAY_ENV, routes: [...defaultRoutes(), gatewayRoute(200)] });
  await Promise.all(waitUntils);
  check('dental submit ACKs', res.status === 200);
  const gw = calls.find((c) => c.url.includes('/api/internal/lead-intake/'));
  check('dental forward uses the dental publicId', gw.url.endsWith('/api/internal/lead-intake/b7d3e1a95c2f4068'));
}

{
  // Forward 4xx (permanent) → crm_error + attempts bumped, never ACKed.
  await run(VALID, {}, { env: GATEWAY_ENV, routes: [...defaultRoutes(), gatewayRoute(422, { error: 'schema' })] });
  await Promise.all(waitUntils);
  const patch = patchCalls();
  const body = patch.length ? JSON.parse(patch[0].init.body) : {};
  check('forward 422 → PATCH crm_error + forward_attempts=1',
    patch.length === 1 && /^422/.test(body.crm_error) && body.forward_attempts === 1
      && body.crm_ack_at === undefined);
}

{
  // Forward 5xx (transient) → attempts bumped only; replay owns the retry.
  await run(VALID, {}, { env: GATEWAY_ENV, routes: [...defaultRoutes(), gatewayRoute(503, {})] });
  await Promise.all(waitUntils);
  const patch = patchCalls();
  const body = patch.length ? JSON.parse(patch[0].init.body) : {};
  check('forward 503 → PATCH forward_attempts=1 without crm_error/ack',
    patch.length === 1 && body.forward_attempts === 1
      && body.crm_error === undefined && body.crm_ack_at === undefined);
}

{
  // Gateway env unset → no forward, submit still ACKs (email + inbox intact).
  const { res, calls: localCalls } = await run(VALID);
  await Promise.all(waitUntils);
  check('no gateway call when env unset',
    !localCalls.some((c) => c.url.includes('/api/internal/')));
  check('submit still succeeds without gateway env', res.status === 200);
}

// ---- Scheduled: replay + retention -------------------------------------------

function replayRow(overrides = {}) {
  return {
    id: 'replay-row-1',
    request_id: VALID.requestId,
    body_hash: 'hash',
    turnstile_verified_at: '2026-09-23T00:00:00Z',
    crm_ack_at: null,
    crm_receipt_id: null,
    crm_error: null,
    forward_attempts: 0,
    landing_page: 'escape',
    page_host: 'escape.myvivatour.com',
    page_path: '/',
    form_id: 'bookingForm',
    full_name: 'Jane Traveller',
    email: 'jane@example.com',
    phone: '0400000000',
    state: 'NSW',
    country: null,
    travel_date: '2026-11-02',
    party_size: '2',
    tour_interest: '10-day escape',
    message: 'Keen',
    utm_source: 'google',
    utm_medium: null,
    utm_campaign: 'escape-core-au',
    utm_term: null,
    utm_content: null,
    gclid: 'Cj0KTest',
    gbraid: null,
    wbraid: null,
    fbclid: null,
    landing_url: 'https://escape.myvivatour.com/',
    ...overrides,
  };
}

async function runScheduled(env, rows) {
  calls = [];
  stubFetch([
    {
      match: (u, i) => (i.method || 'GET') === 'GET' && u.includes('/marketing_leads?'),
      respond: () => jsonResponse(200, rows),
    },
    gatewayRoute(200),
  ]);
  await mod.handleLeadScheduled(env, {});
  return calls;
}

{
  const env = { ...GATEWAY_ENV, LEAD_REPLAY_HOSTS: 'escape.myvivatour.com,happytours.myvivatour.com' };
  const scalls = await runScheduled(env, [replayRow(), replayRow({ id: 'replay-row-2', page_host: 'happytours.myvivatour.com' })]);
  const select = scalls.find((c) => c.url.includes('/marketing_leads?'));
  check('replay select filters unacked + verified + attempts + hosts', select && (() => {
    const q = decodeURIComponent(select.url);
    return q.includes('crm_ack_at=is.null') && q.includes('turnstile_verified_at=not.is.null')
      && q.includes('forward_attempts=lt.20') && q.includes('page_host=in.')
      && q.includes('escape.myvivatour.com') && q.includes('happytours.myvivatour.com')
      && q.includes('limit=25');
  })());
  const forwards = scalls.filter((c) => c.url.includes('/api/internal/lead-intake/'));
  check('each replayed row is forwarded once', forwards.length === 2);
  check('happytours row forwards to its own publicId',
    forwards.some((c) => c.url.endsWith('/api/internal/lead-intake/d1de3fa528854edf')));
  const del = scalls.find((c) => c.method === 'DELETE');
  check('retention deletes only ACKed rows',
    Boolean(del) && decodeURIComponent(del.url).includes('crm_ack_at=lt.')
      && !decodeURIComponent(del.url).includes('crm_ack_at=is.null'));
  check('retention is scoped to this worker hosts',
    Boolean(del) && decodeURIComponent(del.url).includes('page_host=in.')
      && decodeURIComponent(del.url).includes('escape.myvivatour.com')
      && !decodeURIComponent(del.url).includes('implant.vietnamdentaltravel.com'));
}

{
  // No LEAD_REPLAY_HOSTS → the cron does nothing (no replay, no retention).
  const scalls = await runScheduled(GATEWAY_ENV, [replayRow()]);
  check('no replay select without LEAD_REPLAY_HOSTS',
    !scalls.some((c) => c.method === 'GET' && c.url.includes('/marketing_leads?')));
  check('no forward without LEAD_REPLAY_HOSTS',
    !scalls.some((c) => c.url.includes('/api/internal/')));
  check('no retention delete without LEAD_REPLAY_HOSTS',
    !scalls.some((c) => c.method === 'DELETE'));
}

{
  // Forward 429 (gateway throttling) is transient: attempts bumped, no crm_error.
  await run(VALID, {}, { env: GATEWAY_ENV, routes: [...defaultRoutes(), gatewayRoute(429, { error: 'slow_down' })] });
  await Promise.all(waitUntils);
  const patch = patchCalls();
  const body = patch.length ? JSON.parse(patch[0].init.body) : {};
  check('forward 429 → forward_attempts=1 without crm_error/ack',
    patch.length === 1 && body.forward_attempts === 1
      && body.crm_error === undefined && body.crm_ack_at === undefined);
}

{
  // siteverify outage (5xx) is infra, not a bad token → 503 new_token, nothing inserted.
  const { res, json } = await run(VALID, {}, {
    routes: [
      { match: (u) => u.includes('siteverify'), respond: () => jsonResponse(502, {}) },
      ...defaultRoutes(),
    ],
  });
  check('siteverify 5xx → 503 new_token', res.status === 503 && json.retry === 'new_token');
  check('siteverify 5xx → no insert',
    !calls.some((c) => c.method === 'POST' && c.url.includes('/marketing_leads')));
}

{
  // Insert failure logs never echo PostgREST error text (it can contain submitted PII).
  const logs = [];
  const realLog = console.log;
  console.log = (...args) => logs.push(args.join(' '));
  try {
    await run(VALID, {}, {
      routes: [
        { match: (u) => u.includes('siteverify'), respond: () => jsonResponse(200, { success: true }) },
        { match: (u, i) => (i.method || 'GET') === 'GET' && u.includes('request_id=eq.'), respond: () => jsonResponse(200, []) },
        {
          match: (u, i) => i.method === 'POST' && u.includes('/marketing_leads'),
          respond: () => jsonResponse(400, { code: '22007', message: 'invalid input jane@example.com' }),
        },
      ],
    });
  } finally {
    console.log = realLog;
  }
  check('insert error log carries status + code only',
    logs.some((l) => l.includes('insert 400 22007')) && !logs.some((l) => l.includes('jane@example.com')));
}

// ---- Nameless leads: never forward an empty answers.name --------------------

async function forwardedBodyFor(payload) {
  await run(payload, {}, { env: GATEWAY_ENV, routes: [...defaultRoutes(), gatewayRoute(200)] });
  await Promise.all(waitUntils);
  const gw = calls.find((c) => c.url.includes('/api/internal/lead-intake/'));
  return gw ? JSON.parse(gw.init.body) : null;
}

{
  const body = await forwardedBodyFor({ ...VALID, full_name: '   ' });
  check('whitespace-only name → answers.name falls back to email',
    body && body.answers.name === 'jane@example.com');
}

{
  const body = await forwardedBodyFor({ ...VALID, full_name: undefined, email: '', phone: '0411111111' });
  check('no name + no email → answers.name falls back to phone',
    body && body.answers.name === '0411111111');
}

{
  const body = await forwardedBodyFor({ ...VALID, full_name: '  Jane Traveller  ' });
  check('real name is trimmed and kept', body && body.answers.name === 'Jane Traveller');
}

{
  // A replayed legacy row with a blank name is also covered (fallback lives in the
  // gateway body builder, not only on the ingest path).
  const env = { ...GATEWAY_ENV, LEAD_REPLAY_HOSTS: 'escape.myvivatour.com' };
  const scalls = await runScheduled(env, [replayRow({ full_name: ' ' })]);
  const gw = scalls.find((c) => c.url.includes('/api/internal/lead-intake/'));
  check('replayed blank-name row forwards email as name',
    Boolean(gw) && JSON.parse(gw.init.body).answers.name === 'jane@example.com');
}

{
  // Fallback must not change body_hash: it is computed on the client payload.
  const { calls: c1 } = await run({ ...VALID, full_name: '' });
  const row = JSON.parse(c1.find((c) => c.method === 'POST' && c.url.includes('/marketing_leads')).init.body);
  const expected = await mod.computeLeadBodyHash({ ...VALID, full_name: '' });
  check('body_hash is over the original client payload (no name fallback)',
    row.body_hash === expected && row.full_name === null);
}

// ---- Rejected token vs concurrent receipt ------------------------------------

{
  // Winner consumed the shared single-use token; our siteverify says duplicate, but
  // the winner's receipt now exists with the same hash → same ACK, not 403.
  const hash = await mod.computeLeadBodyHash(VALID);
  let lookups = 0;
  const { res, json, calls: c2 } = await run(VALID, {}, {
    routes: [
      {
        match: (u) => u.includes('siteverify'),
        respond: () => jsonResponse(200, { success: false, 'error-codes': ['timeout-or-duplicate'] }),
      },
      {
        match: (u, i) => (i.method || 'GET') === 'GET' && u.includes('request_id=eq.'),
        respond: () => {
          lookups += 1;
          return jsonResponse(200, lookups === 1 ? [] : [{ id: 'winner-receipt', body_hash: hash }]);
        },
      },
    ],
  });
  check('rejected token + concurrent same-hash receipt → 200 winner ACK',
    res.status === 200 && json.success === true && json.receiptId === 'winner-receipt'
      && json.duplicate === true);
  check('reconciled ACK inserts nothing',
    !c2.some((c) => c.method === 'POST' && c.url.includes('/marketing_leads')));
}

{
  // Winner inserts only after our rejection returns → the delayed re-check finds it.
  const hash = await mod.computeLeadBodyHash(VALID);
  let lookups = 0;
  const { res, json } = await run(VALID, {}, {
    routes: [
      { match: (u) => u.includes('siteverify'), respond: () => jsonResponse(200, { success: false }) },
      {
        match: (u, i) => (i.method || 'GET') === 'GET' && u.includes('request_id=eq.'),
        respond: () => {
          lookups += 1;
          return jsonResponse(200, lookups <= 2 ? [] : [{ id: 'late-winner', body_hash: hash }]);
        },
      },
    ],
  });
  check('rejected token + late winner receipt → ACK after re-check',
    res.status === 200 && json.receiptId === 'late-winner' && lookups === 3, `lookups ${lookups}`);
}

{
  // Rejected token + a receipt with a DIFFERENT hash → 409 (same rule as the first lookup).
  let lookups = 0;
  const { res, json } = await run(VALID, {}, {
    routes: [
      { match: (u) => u.includes('siteverify'), respond: () => jsonResponse(200, { success: false }) },
      {
        match: (u, i) => (i.method || 'GET') === 'GET' && u.includes('request_id=eq.'),
        respond: () => {
          lookups += 1;
          return jsonResponse(200, lookups === 1 ? [] : [{ id: 'other', body_hash: 'deadbeef' }]);
        },
      },
    ],
  });
  check('rejected token + different-hash receipt → 409', res.status === 409 && json.error === 'request_id_conflict');
}

{
  // Rejected token and still no receipt after the re-check → 403 as before.
  let lookups = 0;
  const { res, json } = await run(VALID, {}, {
    routes: [
      { match: (u) => u.includes('siteverify'), respond: () => jsonResponse(200, { success: false }) },
      {
        match: (u, i) => (i.method || 'GET') === 'GET' && u.includes('request_id=eq.'),
        respond: () => { lookups += 1; return jsonResponse(200, []); },
      },
    ],
  });
  check('rejected token + no receipt → 403 turnstile_rejected',
    res.status === 403 && json.error === 'turnstile_rejected' && lookups === 3, `lookups ${lookups}`);
}

// ---- Gateway ACK shape -------------------------------------------------------

async function forwardPatchFor(route) {
  await run(VALID, {}, { env: GATEWAY_ENV, routes: [...defaultRoutes(), route] });
  await Promise.all(waitUntils);
  const patch = patchCalls();
  return { patch, body: patch.length ? JSON.parse(patch[0].init.body) : {} };
}

function isTransientPatch({ patch, body }) {
  return patch.length === 1 && body.forward_attempts === 1
    && body.crm_ack_at === undefined && body.crm_error === undefined;
}

{
  const r = await forwardPatchFor(gatewayRoute(200, { success: false, receiptId: 'gw-1' }));
  check('200 with success:false → transient, not ACKed', isTransientPatch(r));
}

{
  const r = await forwardPatchFor(gatewayRoute(200, { success: true }));
  check('200 without receiptId → transient, not ACKed', isTransientPatch(r));
}

{
  const r = await forwardPatchFor(gatewayRoute(200, { success: true, receiptId: '  ' }));
  check('200 with blank receiptId → transient, not ACKed', isTransientPatch(r));
}

{
  const r = await forwardPatchFor(gatewayRoute(200, { success: true, receiptId: 42 }));
  check('200 with non-string receiptId → transient, not ACKed', isTransientPatch(r));
}

{
  const r = await forwardPatchFor({
    match: (u) => u.includes('/api/internal/lead-intake/'),
    respond: () => new Response('<html>ok</html>', { status: 200, headers: { 'content-type': 'text/html' } }),
  });
  check('200 HTML page → transient, not ACKed', isTransientPatch(r));
}

{
  const r = await forwardPatchFor({
    match: (u) => u.includes('/api/internal/lead-intake/'),
    respond: () => new Response(JSON.stringify({ success: true, receiptId: 'gw-1' }), { status: 200 }),
  });
  check('200 JSON body without JSON content-type → transient, not ACKed', isTransientPatch(r));
}

{
  const r = await forwardPatchFor({
    match: (u) => u.includes('/api/internal/lead-intake/'),
    respond: () => new Response(null, { status: 302, headers: { location: 'https://gw.example.test/login' } }),
  });
  check('302 redirect → transient, not ACKed', isTransientPatch(r));
  const gw = calls.find((c) => c.url.includes('/api/internal/lead-intake/'));
  check('gateway fetch does not follow redirects', gw && gw.init.redirect === 'manual');
}

{
  const r = await forwardPatchFor(gatewayRoute(408, { error: 'timeout' }));
  check('forward 408 → transient', isTransientPatch(r));
}

// Source-level: the old CRM push path must be gone.
check('source has no pushLeadToCrm', !source.includes('pushLeadToCrm'));
check('source has no MVT_CRM_LEAD_URL read', !/env\.MVT_CRM_LEAD_URL/.test(source));
check('source has no web3forms URL', !source.includes('web3forms.com'));
check('source has no WEB3FORMS_KEY binding', !source.includes('WEB3FORMS_KEY'));

globalThis.fetch = realFetch;

console.log(failures === 0 ? '\nAll lead-ingest checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
