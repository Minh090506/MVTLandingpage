// Lead ingest endpoint — POST /api/lead (edge inbox: Turnstile at the edge,
// receipt idempotency, forward-to-gateway with replay).
//
// Injected verbatim into the generated worker.js by build.js. Runs same-origin on
// every landing-page host, so browsers never issue a CORS preflight.
//
// State machine (phase 2 spec, public door A):
//   method/host → body cap → parse → honeypot (200 silent, nothing written) →
//   validate (email or phone + requestId UUID) → per-IP rate limit →
//   receipt lookup by request_id → (same body_hash → ACK old, no re-verify;
//   different hash → 409) → verify Turnstile at the edge → INSERT inbox row
//   (request_id, body_hash, turnstile_verified_at) → 200 ACK →
//   ctx.waitUntil(forwardToGateway). Infra failure → 503 {retry:'new_token'}:
//   the token is spent, so the client must reset Turnstile and keep requestId.
//
// Bindings (set with `wrangler secret put` on each worker):
//   SUPABASE_URL              e.g. https://tnwelgvypmhhksqwnfmr.supabase.co
//   SUPABASE_SERVICE_KEY      service_role JWT — bypasses RLS, never expose client-side
//   TURNSTILE_SECRET          Cloudflare Turnstile secret key — fail-closed when missing
//   MVT_LEAD_GATEWAY_URL      optional — mvt-saas origin, e.g. https://operator.myvivatour.com
//   LEAD_GATEWAY_HMAC_SECRET  optional — shared HMAC secret for the internal intake route
// Optional non-secret bindings:
//   LEAD_RATE_LIMITER         Workers ratelimit binding (wrangler [[ratelimits]]);
//                             missing binding is tolerated (no limit enforced)
//   LEAD_REPLAY_HOSTS         [vars] comma-separated hosts this worker replays for
// MVT_CRM_LEAD_URL / MVT_CRM_TOKEN are no longer read (superseded by the gateway
// forward above); leftover values on Cloudflare are harmless.

// Hosts allowed to post leads. Anything else is rejected so the endpoint cannot be
// used as an open relay for spam into the sales inbox.
const LEAD_ALLOWED_HOSTS = new Set([
  'escape.myvivatour.com',
  'happytours.myvivatour.com',
  'implant.vietnamdentaltravel.com',
]);

// Hard limits before accepting a body — public endpoint, rate-limited at this layer.
const LEAD_MAX_BODY_BYTES = 32768; // 32 KB JSON / form payload
const LEAD_MAX_BODY_KEYS = 64; // attribution + turnstile + requestId now ride along

// Fields copied straight through to their own columns. Everything else survives in `raw`.
const LEAD_TEXT_FIELDS = [
  'landing_page', 'page_host', 'page_path', 'form_id',
  'full_name', 'email', 'phone',
  'state', 'country', 'travel_date', 'party_size', 'tour_interest', 'message',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid', 'referrer',
  'landing_url',
];

// Internal intake route on mvt-saas. publicId per landing host (public, not secret).
const LEAD_GATEWAY_PATH = '/api/internal/lead-intake/';
const LEAD_GATEWAY_PUBLIC_IDS = {
  'escape.myvivatour.com': 'da6736a68ba84c1a',
  'happytours.myvivatour.com': 'd1de3fa528854edf',
  'implant.vietnamdentaltravel.com': 'b7d3e1a95c2f4068',
};

// Replay (cron) tuning — mirrors the phase-2 spec.
const LEAD_REPLAY_LIMIT = 25;
const LEAD_REPLAY_MIN_AGE_MS = 10 * 60 * 1000; // only rows older than 10 minutes
const LEAD_REPLAY_MAX_ATTEMPTS = 20;
const LEAD_FORWARD_TIMEOUT_MS = 10000;
const LEAD_RETENTION_DAYS = 90; // ACKed rows only — unacked rows are never deleted

function leadJson(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json;charset=UTF-8', 'Cache-Control': 'no-store' },
  });
}

// Trim and cap every string so one oversized field cannot bloat a row.
function cleanLeadValue(value, max) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.length > max ? text.slice(0, max) : text;
}

async function readLeadBody(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return await request.json();
  const form = await request.formData();
  const out = {};
  for (const [key, value] of form.entries()) out[key] = value;
  return out;
}

function rejectOversizedBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return leadJson(400, { success: false, message: 'Malformed body' });
  }
  const keys = Object.keys(body);
  if (keys.length > LEAD_MAX_BODY_KEYS) {
    return leadJson(413, { success: false, message: 'Too many fields' });
  }
  let size;
  try {
    size = JSON.stringify(body).length;
  } catch (err) {
    return leadJson(400, { success: false, message: 'Malformed body' });
  }
  if (size > LEAD_MAX_BODY_BYTES) {
    return leadJson(413, { success: false, message: 'Payload too large' });
  }
  return null;
}

// ---- Canonical body hash (receipt idempotency) ------------------------------
//
// SHA-256 over the BUSINESS payload only: every form field + attribution +
// landing_url. Protocol fields (requestId — keys the receipt; turnstileToken,
// botcheck — single-use / anti-spam) are excluded so a retried submit with a
// fresh token hashes identically and gets the stored ACK back.

const LEAD_HASH_EXCLUDE_KEYS = new Set(['requestId', 'turnstileToken', 'botcheck', '_gotcha']);

function canonicalLeadPayload(value) {
  if (Array.isArray(value)) return value.map(canonicalLeadPayload);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      if (LEAD_HASH_EXCLUDE_KEYS.has(key)) continue;
      out[key] = canonicalLeadPayload(value[key]);
    }
    return out;
  }
  return value === undefined ? null : value;
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function computeLeadBodyHash(body) {
  return sha256Hex(JSON.stringify(canonicalLeadPayload(body)));
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// ---- Supabase REST helpers ---------------------------------------------------

function supabaseHeaders(env, prefer) {
  return {
    'Content-Type': 'application/json',
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

// Returns {id, body_hash} | null (no receipt) | 'error' (infra).
async function lookupLeadReceipt(env, requestId) {
  if (!env || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return 'error';
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/marketing_leads?select=id,body_hash&request_id=eq.${encodeURIComponent(requestId)}`,
      { headers: supabaseHeaders(env) },
    );
    if (!res.ok) {
      console.log(`lead-ingest: receipt lookup ${res.status}`);
      return 'error';
    }
    const rows = await res.json();
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  } catch (err) {
    console.log(`lead-ingest: receipt lookup threw ${err.message}`);
    return 'error';
  }
}

// Returns {ok:true, row} | {conflict:true} | {ok:false}.
async function insertLeadRow(env, row) {
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/marketing_leads`, {
      method: 'POST',
      headers: supabaseHeaders(env, 'return=representation'),
      body: JSON.stringify(row),
    });
    if (res.status === 409) return { conflict: true }; // unique request_id — concurrent insert
    if (!res.ok) {
      // PostgREST error text can echo submitted values (PII) — log status + code only.
      const err = await res.json().catch(() => null);
      console.log(`lead-ingest: insert ${res.status} ${(err && err.code) || ''}`.trim());
      return { ok: false };
    }
    const rows = await res.json().catch(() => null);
    const stored = Array.isArray(rows) && rows[0] ? rows[0] : null;
    if (!stored || !stored.id) return { ok: false };
    return { ok: true, row: stored };
  } catch (err) {
    console.log(`lead-ingest: insert threw ${err.message}`);
    return { ok: false };
  }
}

async function patchLeadRow(env, id, patch) {
  if (!env || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY || !id) return;
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/marketing_leads?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: supabaseHeaders(env, 'return=minimal'),
      body: JSON.stringify(patch),
    });
  } catch (err) {
    console.log(`lead-ingest: patch threw ${err.message}`);
  }
}

// ---- Turnstile verification at the edge --------------------------------------
//
// Returns {ok:true} | {status:403} (rejected/missing token) | {status:503} (fail-closed).

async function verifyTurnstile(env, token, remoteip) {
  if (!env || !env.TURNSTILE_SECRET) return { status: 503 };
  if (!token) return { status: 403 };
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET,
        response: token,
        ...(remoteip ? { remoteip } : {}),
      }),
    });
    // siteverify itself failing (5xx) is infra, not a bad token — fail closed but retriable.
    if (res.status >= 500) return { status: 503 };
    const json = await res.json().catch(() => ({}));
    return json && json.success ? { ok: true } : { status: 403 };
  } catch (err) {
    console.log(`lead-ingest: siteverify threw ${err.message}`);
    return { status: 503 };
  }
}

// ---- Forward to mvt-saas internal intake (HMAC-signed) ------------------------
//
// Contract (fixed — the mvt-saas lane implements the receiving side):
//   POST {MVT_LEAD_GATEWAY_URL}/api/internal/lead-intake/{publicId}
//   x-mvt-timestamp: unix seconds · x-mvt-signature: hex HMAC-SHA256 over
//   "POST\n{path}\n{publicId}\n{sha256hex(rawBody)}\n{timestamp}"
//   200 = ACK (patch crm_ack_at) · 4xx = permanent/config error (patch crm_error) ·
//   5xx/timeout = transient (bump forward_attempts; replay retries).

function buildGatewayBody(row) {
  const note = [
    row.travel_date ? `Travel date: ${row.travel_date}` : '',
    row.party_size ? `Party size: ${row.party_size}` : '',
    row.tour_interest ? `Tour: ${row.tour_interest}` : '',
    row.state ? `State: ${row.state}` : '',
    row.country ? `Country: ${row.country}` : '',
    row.message ? `Message: ${row.message}` : '',
  ].filter(Boolean).join('\n');
  const pick = (key) => (row[key] === undefined || row[key] === null || row[key] === '') ? null : row[key];
  return {
    requestId: row.request_id,
    edgeReceiptId: row.id,
    turnstileVerifiedAt: row.turnstile_verified_at,
    landingUrl: pick('landing_url'),
    answers: {
      name: pick('full_name'),
      contact: pick('phone') || pick('email'),
      whatsapp: pick('phone'),
      email: pick('email'),
      note: note || null,
    },
    utm: {
      utm_source: pick('utm_source'),
      utm_medium: pick('utm_medium'),
      utm_campaign: pick('utm_campaign'),
      utm_term: pick('utm_term'),
      utm_content: pick('utm_content'),
      gclid: pick('gclid'),
      gbraid: pick('gbraid'),
      wbraid: pick('wbraid'),
      fbclid: pick('fbclid'),
    },
  };
}

async function hmacSha256Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function forwardToGateway(env, row) {
  if (!env || !env.MVT_LEAD_GATEWAY_URL || !env.LEAD_GATEWAY_HMAC_SECRET) {
    // Forwarding disabled (cutover knob) — replay picks the row up once enabled.
    console.log('lead-ingest: gateway forward disabled (env unset)');
    return;
  }
  const publicId = LEAD_GATEWAY_PUBLIC_IDS[row.page_host];
  if (!publicId) {
    console.log('lead-ingest: no gateway publicId for host'); // host name withheld on purpose
    return;
  }

  const rawBody = JSON.stringify(buildGatewayBody(row));
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const path = `${LEAD_GATEWAY_PATH}${publicId}`;
  const signature = await hmacSha256Hex(
    env.LEAD_GATEWAY_HMAC_SECRET,
    `POST\n${path}\n${publicId}\n${await sha256Hex(rawBody)}\n${timestamp}`,
  );

  let status = 0;
  let receiptId = null;
  let reason = '';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LEAD_FORWARD_TIMEOUT_MS);
  try {
    const res = await fetch(`${env.MVT_LEAD_GATEWAY_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-mvt-timestamp': timestamp,
        'x-mvt-signature': signature,
      },
      body: rawBody,
      signal: controller.signal,
    });
    status = res.status;
    const json = await res.json().catch(() => null);
    receiptId = json && json.receiptId ? json.receiptId : null;
    reason = (json && json.error) || res.statusText || '';
  } catch (err) {
    status = 0; // timeout / network — transient, replay will retry
  } finally {
    clearTimeout(timer);
  }

  if (status === 200) {
    await patchLeadRow(env, row.id, {
      crm_ack_at: new Date().toISOString(),
      crm_receipt_id: receiptId,
      crm_error: null,
    });
    return;
  }
  // 408/429 are throttling/timeouts on the gateway side — transient like 5xx.
  if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
    // Permanent (409/400/404/410/422) or misconfigured secret (401): stop retrying.
    await patchLeadRow(env, row.id, {
      crm_error: `${status} ${String(reason).slice(0, 180)}`.trim(),
      forward_attempts: (row.forward_attempts || 0) + 1,
    });
    return;
  }
  await patchLeadRow(env, row.id, { forward_attempts: (row.forward_attempts || 0) + 1 });
}

// ---- Replay + retention (cron, every 10 minutes) ------------------------------

const LEAD_REPLAY_SELECT = [
  'id', 'request_id', 'body_hash', 'turnstile_verified_at', 'crm_ack_at',
  'crm_receipt_id', 'crm_error', 'forward_attempts',
  'landing_page', 'page_host', 'page_path', 'form_id',
  'full_name', 'email', 'phone', 'state', 'country', 'travel_date', 'party_size',
  'tour_interest', 'message',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'gbraid', 'wbraid', 'fbclid', 'landing_url',
].join(',');

// PostgREST `in.(...)` filter for the hosts this worker owns.
function leadHostFilter(hosts) {
  return `in.(${hosts.map((h) => `"${h}"`).join(',')})`;
}

async function runLeadReplay(env, hosts) {
  const cutoff = new Date(Date.now() - LEAD_REPLAY_MIN_AGE_MS).toISOString();
  const params = new URLSearchParams({
    select: LEAD_REPLAY_SELECT,
    crm_ack_at: 'is.null',
    turnstile_verified_at: 'not.is.null',
    created_at: `lt.${cutoff}`,
    forward_attempts: `lt.${LEAD_REPLAY_MAX_ATTEMPTS}`,
    page_host: leadHostFilter(hosts),
    order: 'created_at.asc',
    limit: String(LEAD_REPLAY_LIMIT),
  });
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/marketing_leads?${params}`, {
      headers: supabaseHeaders(env),
    });
    if (!res.ok) {
      console.log(`lead-replay: select ${res.status}`);
      return;
    }
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) return;
    await Promise.all(rows.map((row) => forwardToGateway(env, row)));
  } catch (err) {
    console.log(`lead-replay: threw ${err.message}`);
  }
}

async function runLeadRetention(env, hosts) {
  const cutoff = new Date(Date.now() - LEAD_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  // crm_ack_at=lt implies NOT NULL — unacknowledged rows are never deleted. Scoped
  // to this worker's hosts, like replay, so each worker only prunes its own rows.
  const params = new URLSearchParams({
    crm_ack_at: `lt.${cutoff}`,
    page_host: leadHostFilter(hosts),
  });
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/marketing_leads?${params}`,
      { method: 'DELETE', headers: supabaseHeaders(env, 'return=minimal') },
    );
    if (!res.ok) console.log(`lead-retention: delete ${res.status}`);
  } catch (err) {
    console.log(`lead-retention: threw ${err.message}`);
  }
}

// LEAD_REPLAY_HOSTS keeps the two deployed workers from touching each other's rows.
// Unset → the cron does nothing at all (neither replay nor retention).
async function handleLeadScheduled(env, ctx) {
  if (!env || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return;
  const hosts = String(env.LEAD_REPLAY_HOSTS || '')
    .split(',').map((h) => h.trim()).filter(Boolean);
  if (!hosts.length) return;
  await runLeadReplay(env, hosts);
  await runLeadRetention(env, hosts);
}

// ---- Rate limiting (per-IP, Cloudflare ratelimit binding) ---------------------
//
// Binding is optional: a worker deployed without LEAD_RATE_LIMITER simply skips
// this gate rather than failing every lead.

async function checkLeadRateLimit(env, request) {
  const limiter = env && env.LEAD_RATE_LIMITER;
  if (!limiter || typeof limiter.limit !== 'function') return null;
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  try {
    const result = await limiter.limit({ key: ip });
    if (result && result.success === false) {
      return leadJson(429, { success: false, error: 'rate_limited' });
    }
  } catch (err) {
    console.log(`lead-ingest: ratelimit threw ${err.message}`); // fail-open, Turnstile still gates
  }
  return null;
}

// ---- Request handler -----------------------------------------------------------

async function handleLeadIngest(request, url, env, ctx) {
  if (request.method !== 'POST') {
    return leadJson(405, { success: false, message: 'Method not allowed' });
  }
  if (!LEAD_ALLOWED_HOSTS.has(url.hostname) && !url.hostname.endsWith('.workers.dev')) {
    return leadJson(403, { success: false, message: 'Origin not allowed' });
  }

  // Cheap Content-Length gate before reading (header can be spoofed; re-check after parse).
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > LEAD_MAX_BODY_BYTES) {
    return leadJson(413, { success: false, message: 'Payload too large' });
  }

  let body;
  try {
    body = await readLeadBody(request);
  } catch (err) {
    return leadJson(400, { success: false, message: 'Malformed body' });
  }

  const sizeReject = rejectOversizedBody(body);
  if (sizeReject) return sizeReject;

  // Honeypot: real users never fill a hidden field. Answer 200 so bots do not retry.
  if (cleanLeadValue(body.botcheck, 200) || cleanLeadValue(body._gotcha, 200)) {
    return leadJson(200, { success: true, message: 'Thanks!' });
  }

  const email = cleanLeadValue(body.email, 320);
  const phone = cleanLeadValue(body.phone, 40);
  if (!email && !phone) {
    return leadJson(400, { success: false, message: 'Email or phone is required' });
  }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return leadJson(400, { success: false, message: 'Email looks invalid' });
  }

  const requestId = cleanLeadValue(body.requestId, 100);
  if (!requestId) {
    return leadJson(400, { success: false, message: 'missing_request_id' });
  }
  if (!isUuid(requestId)) {
    return leadJson(400, { success: false, message: 'invalid_request_id' });
  }

  const rateLimited = await checkLeadRateLimit(env, request);
  if (rateLimited) return rateLimited;

  // Receipt lookup BEFORE Turnstile: a retry after a lost ACK must not burn a token.
  const bodyHash = await computeLeadBodyHash(body);
  const receipt = await lookupLeadReceipt(env, requestId);
  if (receipt === 'error') {
    return leadJson(503, { success: false, retry: 'new_token' });
  }
  if (receipt) {
    if (receipt.body_hash === bodyHash) {
      return leadJson(200, { success: true, requestId, receiptId: receipt.id, duplicate: true });
    }
    return leadJson(409, { success: false, error: 'request_id_conflict' });
  }

  const turnstile = cleanLeadValue(body.turnstileToken, 4096);
  const verified = await verifyTurnstile(env, turnstile, request.headers.get('cf-connecting-ip') || '');
  if (verified.status === 503) {
    return leadJson(503, { success: false, retry: 'new_token', error: 'turnstile_unavailable' });
  }
  if (!verified.ok) {
    return leadJson(403, { success: false, error: 'turnstile_rejected' });
  }

  // Client fields first, then server-derived values so they always win.
  const row = {};
  for (const field of LEAD_TEXT_FIELDS) {
    row[field] = cleanLeadValue(body[field], field === 'message' ? 5000 : 500);
  }
  row.raw = (() => {
    const raw = {};
    for (const key of Object.keys(body)) {
      if (key === 'turnstileToken') continue; // single-use secret — never persist
      raw[key] = body[key];
    }
    return raw;
  })();
  row.page_host = url.hostname;
  row.page_path = cleanLeadValue(body.page_path, 500) || '/';
  row.landing_page = row.landing_page || 'unknown';
  row.email = email;
  row.phone = phone;
  row.user_agent = cleanLeadValue(request.headers.get('user-agent'), 500);
  row.ip_country = request.headers.get('cf-ipcountry') || null;
  row.referrer = row.referrer || cleanLeadValue(request.headers.get('referer'), 500);

  // Timestamptz column — only forward a value Postgres will actually parse, otherwise
  // one malformed client string rejects the whole insert.
  const firstSeen = cleanLeadValue(body.landing_first_seen, 40);
  row.landing_first_seen = firstSeen && !Number.isNaN(Date.parse(firstSeen)) ? firstSeen : null;

  row.request_id = requestId;
  row.body_hash = bodyHash;
  row.turnstile_verified_at = new Date().toISOString();

  const inserted = await insertLeadRow(env, row);
  if (inserted.conflict) {
    // Concurrent insert won the unique index — its receipt decides our answer.
    const winner = await lookupLeadReceipt(env, requestId);
    if (winner && winner !== 'error') {
      if (winner.body_hash === bodyHash) {
        return leadJson(200, { success: true, requestId, receiptId: winner.id, duplicate: true });
      }
      return leadJson(409, { success: false, error: 'request_id_conflict' });
    }
    return leadJson(503, { success: false, retry: 'new_token' });
  }
  if (!inserted.ok) {
    // Token is spent — tell the client to reset Turnstile and keep requestId/payload.
    return leadJson(503, { success: false, retry: 'new_token' });
  }

  // Gateway forward never delays the visitor's response; failures land in
  // forward_attempts/crm_error and the cron replay picks the row up.
  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(forwardToGateway(env, inserted.row));
  }

  return leadJson(200, { success: true, requestId, receiptId: inserted.row.id });
}
