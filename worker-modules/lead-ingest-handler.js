// Lead ingest endpoint — POST /api/lead
//
// Injected verbatim into the generated worker.js by build.js. Runs same-origin on
// every landing-page host, so browsers never issue a CORS preflight.
//
// DB-only path. Email is sent by the browser to Web3Forms (free plan blocks
// server-side calls; Workers have no static IP). Client dual-sends both paths;
// this handler never talks to Web3Forms.
//
// Bindings (set with `wrangler secret put` on each worker):
//   SUPABASE_URL          e.g. https://tnwelgvypmhhksqwnfmr.supabase.co
//   SUPABASE_SERVICE_KEY  service_role JWT — bypasses RLS, never expose client-side
//   MVT_CRM_LEAD_URL      optional — when set, lead is pushed to mvt-saas
//   MVT_CRM_TOKEN         optional — bearer token for the above

// Hosts allowed to post leads. Anything else is rejected so the endpoint cannot be
// used as an open relay for spam into the sales inbox.
const LEAD_ALLOWED_HOSTS = new Set([
  'escape.myvivatour.com',
  'happytours.myvivatour.com',
  'implant.vietnamdentaltravel.com',
]);

// Hard limits before accepting a body — public endpoint, no rate limit at this layer.
const LEAD_MAX_BODY_BYTES = 32768; // 32 KB JSON / form payload
const LEAD_MAX_BODY_KEYS = 40;

// Fields copied straight through to their own columns. Everything else survives in `raw`.
const LEAD_TEXT_FIELDS = [
  'landing_page', 'page_host', 'page_path', 'form_id',
  'full_name', 'email', 'phone',
  'state', 'country', 'travel_date', 'party_size', 'tour_interest', 'message',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'fbclid', 'msclkid', 'referrer',
];

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

  // Client fields first, then server-derived values so they always win.
  const row = { raw: body };
  for (const field of LEAD_TEXT_FIELDS) {
    row[field] = cleanLeadValue(body[field], field === 'message' ? 5000 : 500);
  }
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

  // Email is browser → Web3Forms. Worker no longer forwards; omit email_forwarded so
  // the DB default (false/null) stays — column means "worker emailed" which is never true now.

  const stored = await storeLeadInSupabase(env, row);
  if (!stored) {
    return leadJson(502, { success: false, message: 'Could not record your enquiry.' });
  }

  // CRM push must never delay the visitor's response; unsynced rows stay queryable
  // via the crm_synced_at IS NULL index for a later backfill.
  if (env && env.MVT_CRM_LEAD_URL && ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(pushLeadToCrm(env, row));
  }

  return leadJson(200, { success: true, message: 'Thanks! We will be in touch shortly.' });
}

async function storeLeadInSupabase(env, row) {
  if (!env || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return false;
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/marketing_leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      console.log(`lead-ingest: supabase ${res.status} ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.log(`lead-ingest: supabase threw ${err.message}`);
    return false;
  }
}

async function pushLeadToCrm(env, row) {
  try {
    const res = await fetch(env.MVT_CRM_LEAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.MVT_CRM_TOKEN ? { 'Authorization': `Bearer ${env.MVT_CRM_TOKEN}` } : {}),
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) console.log(`lead-ingest: crm ${res.status}`);
  } catch (err) {
    console.log(`lead-ingest: crm threw ${err.message}`);
  }
}
