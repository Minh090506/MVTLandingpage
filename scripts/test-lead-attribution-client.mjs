// Tests for worker-modules/lead-attribution-client.js
//
// The client is an IIFE meant for a browser, so we run it against hand-rolled
// stubs for localStorage / location / document / fetch / turnstile. No jsdom, no network.
//
// Run: node scripts/test-lead-attribution-client.mjs

import { webcrypto } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = fs.readFileSync(
  path.join(here, '..', 'worker-modules', 'lead-attribution-client.js'),
  'utf-8',
);

let failures = 0;
function check(name, condition, detail = '') {
  if (condition) console.log(`  ok   ${name}`);
  else {
    failures++;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

// Build a fake browser, run the client inside it, and hand back the pieces a test
// needs to assert on.
//
// leadResponses: array of {status, json} consumed per /api/lead call (last one
// repeats). leadStatus: legacy shorthand — every call gets {success: status<400}.
// withTurnstile: false simulates the Turnstile script never loading.
function boot({
  search = '',
  referrer = '',
  storage = {},
  landingPage = 'escape',
  leadDelayMs = 0,
  leadStatus = 200,
  leadResponses = null,
  web3Status = 200,
  web3Body = { success: true, message: 'OK' },
  withTurnstile = true,
  web3Hang = false,
  // (options, tokenCount) => void — custom Turnstile execute behaviour; default
  // issues a token synchronously (the invisible pass).
  onExecute = null,
  tokenTimeoutMs = undefined,
  interactiveTimeoutMs = undefined,
  ackRequestTimeoutMs = undefined,
  // Edge behaviour: a post without a Turnstile token is rejected 403, like the Worker.
  leadRequiresToken = false,
} = {}) {
  const store = { ...storage };
  const calls = [];

  let leadCall = 0;
  let tokenCount = 0;
  let resets = 0;
  let executes = 0;
  let widgetOptions = null;
  const rendered = []; // { el, options }
  const submitListeners = [];

  const win = {
    location: { search, pathname: '/', href: `https://escape.myvivatour.com/${search}` },
    crypto: webcrypto,
    // Speed the retry/poll loops up — unit tests must not wait real backoff.
    __MVT_ACK_BACKOFF_MS: [0, 0],
    __MVT_TURNSTILE_POLL_MS: 5,
    __MVT_TURNSTILE_TIMEOUT_MS: withTurnstile ? 8000 : 30,
    __MVT_TURNSTILE_TOKEN_TIMEOUT_MS: tokenTimeoutMs,
    __MVT_TURNSTILE_INTERACTIVE_TIMEOUT_MS: interactiveTimeoutMs,
    __MVT_ACK_REQUEST_TIMEOUT_MS: ackRequestTimeoutMs,
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
    },
    fetch: async (input, init) => {
      const url = String(input);
      calls.push({ url, init, at: Date.now() });
      if (url === '/api/lead') {
        leadCall += 1;
        if (leadDelayMs > 0) await new Promise((r) => setTimeout(r, leadDelayMs));
        const step = leadResponses
          ? leadResponses[Math.min(leadCall - 1, leadResponses.length - 1)]
          : { status: leadStatus, json: { success: leadStatus < 400 } };
        if (leadRequiresToken && !JSON.parse(init.body).turnstileToken) {
          return new Response(JSON.stringify({ success: false, error: 'turnstile_rejected' }), { status: 403 });
        }
        if (step.hang) {
          // Stalled edge: only an abort ends it (or nothing, if the stub ignores it).
          return new Promise((resolve, reject) => {
            const signal = init && init.signal;
            if (signal && !step.ignoreAbort) {
              signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
            }
          });
        }
        const body = step.json !== undefined ? step.json : {};
        if (step.throw) throw new Error('lead network down');
        return new Response(JSON.stringify(body), { status: step.status });
      }
      if (url.includes('api.web3forms.com')) {
        if (web3Hang) return new Promise(() => {}); // email request never settles
        return new Response(JSON.stringify(web3Body), { status: web3Status });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    },
  };

  if (withTurnstile) {
    win.turnstile = {
      render: (el, options) => {
        widgetOptions = options;
        rendered.push({ el, options });
        return 7 + rendered.length - 1;
      },
      reset: () => { resets += 1; },
      execute: (id) => {
        executes += 1;
        tokenCount += 1;
        const opts = rendered[id - 7] ? rendered[id - 7].options : widgetOptions;
        if (onExecute) onExecute(opts, tokenCount);
        else opts.callback(`tok-${tokenCount}`);
      },
    };
  }

  const bodyChildren = [];
  const doc = {
    referrer,
    createElement: (tag) => ({ tagName: String(tag).toUpperCase(), style: {}, className: '' }),
    head: { appendChild() {} },
    body: { appendChild(el) { bodyChildren.push(el); } },
    addEventListener: (type, fn, capture) => {
      if (type === 'submit') submitListeners.push({ fn, capture });
    },
  };

  const run = new Function(
    'window', 'document', 'URLSearchParams', 'Date', 'JSON', 'Object',
    SOURCE.replace(/__MVT_LANDING_PAGE__/g, landingPage),
  );
  run(win, doc, URLSearchParams, Date, JSON, Object);

  return {
    win, store, calls, rendered, bodyChildren,
    // Simulate the browser dispatching a submit event for `form` (capture phase).
    dispatchSubmit: (form) => submitListeners.forEach((l) => l.fn({ target: form })),
    counts: {
      get leadCalls() { return leadCall; },
      get resets() { return resets; },
      get executes() { return executes; },
    },
  };
}

const AD_CLICK = '?utm_source=google&utm_medium=cpc&utm_campaign=escape-core-au&gclid=Cj0KTest';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function submitLead(win, extra = {}) {
  return win.fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_key: 'k', name: 'Jane', email: 'jane@example.com', ...extra }),
  });
}

function leadCallsOf(calls) {
  return calls.filter((c) => c.url === '/api/lead');
}

console.log('lead-attribution-client');

{
  const { win, store } = boot({ search: AD_CLICK, referrer: 'https://www.google.com/' });
  const attr = win.mvtAttribution();
  check('captures utm_source', attr.utm_source === 'google');
  check('captures utm_campaign', attr.utm_campaign === 'escape-core-au');
  check('captures gclid', attr.gclid === 'Cj0KTest');
  check('records landing_page', attr.landing_page === 'escape');
  check('records landing_url', attr.landing_url === 'https://escape.myvivatour.com/' + AD_CLICK);
  check('records referrer', attr.referrer === 'https://www.google.com/');
  check('stamps landing_first_seen', typeof attr.landing_first_seen === 'string');
  check('persists to localStorage', Boolean(store.mvt_attribution));
}

{
  const search = '?utm_source=google&utm_medium=cpc&utm_campaign=escape-core-au&gbraid=GB-123&wbraid=WB-456';
  const { win } = boot({ search });
  const attr = win.mvtAttribution();
  check('captures gbraid', attr.gbraid === 'GB-123');
  check('captures wbraid', attr.wbraid === 'WB-456');
}

{
  // Visitor clicks the ad, leaves, returns directly, then converts.
  const first = boot({ search: AD_CLICK, referrer: 'https://www.google.com/' });
  const second = boot({ search: '', referrer: '', storage: first.store });
  const attr = second.win.mvtAttribution();
  check('a later direct visit keeps the original campaign', attr.utm_campaign === 'escape-core-au');
  check('a later direct visit keeps the gclid', attr.gclid === 'Cj0KTest');
}

{
  // A fresh paid click should take over from the older one.
  const first = boot({ search: AD_CLICK });
  const second = boot({ search: '?utm_source=facebook&utm_campaign=retarget-q3', storage: first.store });
  const attr = second.win.mvtAttribution();
  check('a new campaign click overwrites the previous source', attr.utm_source === 'facebook');
  check('the stale gclid is dropped on a new campaign', attr.gclid === undefined);
}

{
  const expired = {
    mvt_attribution: JSON.stringify({
      first_seen: Date.now() - 200 * 24 * 60 * 60 * 1000,
      params: { utm_campaign: 'ancient' },
      referrer: '',
    }),
  };
  const { win } = boot({ storage: expired });
  check('discards attribution older than 90 days', win.mvtAttribution().utm_campaign === undefined);
}

{
  const { win, calls } = boot({ search: AD_CLICK });
  const pageRes = await submitLead(win);
  const pageJson = await pageRes.json();

  const w3f = calls.filter((c) => c.url.includes('web3forms'));
  const lead = leadCallsOf(calls);
  check('dual-send hits Web3Forms', w3f.length === 1);
  check('dual-send hits /api/lead', lead.length === 1);
  check('page receives Web3Forms response', pageRes.ok === true && pageRes.status === 200);
  check('page sees success after ACK', pageJson.success === true);

  const w3fPayload = JSON.parse(w3f[0].init.body);
  const leadPayload = JSON.parse(lead[0].init.body);
  // The CRM record (/api/lead) keeps the full attribution for reporting.
  check('/api/lead payload gets utm_campaign', leadPayload.utm_campaign === 'escape-core-au');
  check('/api/lead payload gets gclid', leadPayload.gclid === 'Cj0KTest');
  check('/api/lead payload gets landing_url',
    leadPayload.landing_url === 'https://escape.myvivatour.com/' + AD_CLICK);
  check('/api/lead maps name to full_name', leadPayload.full_name === 'Jane');
  check('/api/lead payload has a UUID requestId', UUID_RE.test(leadPayload.requestId));
  check('/api/lead payload carries a turnstile token', typeof leadPayload.turnstileToken === 'string');
  check('ack published on window with matching requestId',
    win.mvtLeadAck && win.mvtLeadAck.ok === true && win.mvtLeadAck.requestId === leadPayload.requestId);
  // The Web3Forms email inbox is stripped of ad-attribution noise (see buildEmailPayload):
  // utm_*, click IDs and the duplicate full_name never reach the seller's email.
  check('Web3Forms email drops utm_campaign', w3fPayload.utm_campaign === undefined);
  check('Web3Forms email drops gclid', w3fPayload.gclid === undefined);
  check('Web3Forms email drops the duplicate full_name', w3fPayload.full_name === undefined);
  check('Web3Forms email drops turnstileToken/requestId/landing_url',
    w3fPayload.turnstileToken === undefined && w3fPayload.requestId === undefined
      && w3fPayload.landing_url === undefined);
  // The human fields the seller actually reads still pass through.
  check('Web3Forms email keeps name', w3fPayload.name === 'Jane');
  check('Web3Forms email keeps email', w3fPayload.email === 'jane@example.com');
}

{
  // gbraid/wbraid ride along to /api/lead (new Google Ads click ids).
  const { win, calls } = boot({
    search: '?utm_source=google&utm_campaign=c&gbraid=GB-9&wbraid=WB-8',
  });
  await (await submitLead(win)).json();
  const leadPayload = JSON.parse(leadCallsOf(calls)[0].init.body);
  check('gbraid reaches /api/lead', leadPayload.gbraid === 'GB-9');
  check('wbraid reaches /api/lead', leadPayload.wbraid === 'WB-8');
}

{
  // 503 retry:'new_token' twice, then success — one requestId, fresh token each try.
  const { win, calls, counts } = boot({
    search: AD_CLICK,
    leadResponses: [
      { status: 503, json: { success: false, retry: 'new_token' } },
      { status: 503, json: { success: false, retry: 'new_token' } },
      { status: 200, json: { success: true, requestId: 'r', receiptId: 'rec-1' } },
    ],
  });
  const pageRes = await submitLead(win);
  const json = await pageRes.json();
  check('retried submit eventually succeeds', pageRes.ok === true && json.success === true);
  const lead = leadCallsOf(calls);
  check('three /api/lead attempts (max 3)', lead.length === 3);
  const ids = lead.map((c) => JSON.parse(c.init.body).requestId);
  check('requestId survives every retry', ids[0] === ids[1] && ids[1] === ids[2] && UUID_RE.test(ids[0]));
  const tokens = lead.map((c) => JSON.parse(c.init.body).turnstileToken);
  check('each retry uses a fresh turnstile token',
    tokens[0] !== tokens[1] && tokens[1] !== tokens[2]);
  check('turnstile.reset called once per attempt', counts.resets === 3);
  check('ack ok after retries', win.mvtLeadAck && win.mvtLeadAck.ok === true);
  // The email copy still went out exactly once, in parallel.
  check('Web3Forms called exactly once despite retries',
    calls.filter((c) => c.url.includes('web3forms')).length === 1);
}

{
  // All attempts fail → the page must NOT report success.
  const { win, calls } = boot({
    search: AD_CLICK,
    leadResponses: [{ status: 503, json: { success: false, retry: 'new_token' } }],
  });
  const pageRes = await submitLead(win);
  const json = await pageRes.json();
  check('page does not report success without an ACK', pageRes.ok === true && json.success === false);
  check('failure message guides to WhatsApp', /whatsapp/i.test(json.message || ''));
  check('ack failure published for conversion gating',
    win.mvtLeadAck && win.mvtLeadAck.ok === false && UUID_RE.test(win.mvtLeadAck.requestId));
  check('three attempts were made before giving up', leadCallsOf(calls).length === 3);
  check('Web3Forms email still sent (seller copy survives the outage)',
    calls.some((c) => c.url.includes('web3forms')));
}

{
  // ACK ok but the Web3Forms email copy failed → the lead is captured, so the page
  // still reports success (no duplicate resubmit).
  const { win } = boot({
    search: AD_CLICK,
    web3Status: 500,
    web3Body: { success: false, message: 'upstream down' },
  });
  const pageRes = await submitLead(win);
  const json = await pageRes.json();
  check('ACK ok + email failure → page still reports success', pageRes.ok === true && json.success === true);
  check('ACK ok + email failure → ack flag ok', win.mvtLeadAck && win.mvtLeadAck.ok === true);
}

{
  // 403 (Turnstile rejected) is permanent — no retry loop.
  const { win, calls } = boot({
    search: AD_CLICK,
    leadResponses: [{ status: 403, json: { success: false, error: 'turnstile_rejected' } }],
  });
  const pageRes = await submitLead(win);
  const json = await pageRes.json();
  check('403 → single attempt', leadCallsOf(calls).length === 1);
  check('403 → page reports failure', json.success === false);
  check('403 → ack not ok', win.mvtLeadAck && win.mvtLeadAck.ok === false);
}

{
  // Turnstile script blocked → still posts (fail-closed at the edge), no token key.
  const { win, calls } = boot({
    search: AD_CLICK,
    withTurnstile: false,
    leadResponses: [{ status: 403, json: { success: false, error: 'turnstile_rejected' } }],
  });
  const pageRes = await submitLead(win);
  const json = await pageRes.json();
  const lead = leadCallsOf(calls);
  check('posts /api/lead even without a turnstile token', lead.length >= 1);
  check('payload omits turnstileToken when none was issued',
    !('turnstileToken' in JSON.parse(lead[0].init.body)));
  check('blocked turnstile ends in page failure', json.success === false);
}

{
  // Only 503 retry:'new_token' (and network throws) retry — other statuses fail fast.
  const a = boot({ search: AD_CLICK, leadStatus: 502 });
  const aJson = await (await submitLead(a.win)).json();
  check('plain 502 → page failure, single attempt', aJson.success === false
    && leadCallsOf(a.calls).length === 1);

  const b = boot({ search: AD_CLICK, leadResponses: [{ throw: true }] });
  const bJson = await (await submitLead(b.win)).json();
  check('network throw → page failure after retries', bJson.success === false);
  check('network throw → three attempts', leadCallsOf(b.calls).length === 3);
}

{
  // The ACK now gates the page response — a slow /api/lead delays it (by design).
  const { win, calls } = boot({ search: AD_CLICK, leadDelayMs: 80 });
  const t0 = Date.now();
  const pageRes = await submitLead(win);
  const elapsed = Date.now() - t0;
  check('page response waits for the /api/lead ACK', pageRes.ok === true && elapsed >= 70,
    `elapsed ${elapsed}ms`);
  check('Web3Forms still completes in parallel',
    calls.some((c) => c.url.includes('web3forms')));
}

{
  const { win, calls } = boot();
  await win.fetch('https://api.web3forms.com/submit', { method: 'POST', body: new Uint8Array([1]) });
  check('leaves non-string bodies alone',
    calls[calls.length - 1].url.includes('web3forms') &&
    !calls.some((c) => c.url === '/api/lead'));
}

{
  const { win, calls } = boot();
  await win.fetch('https://example.com/other', { method: 'POST', body: '{}' });
  check('leaves unrelated requests alone', calls[calls.length - 1].url === 'https://example.com/other');
}

{
  // Private browsing: localStorage throws. The page must still work.
  const win = {
    location: { search: AD_CLICK, pathname: '/', href: 'https://escape.myvivatour.com/' + AD_CLICK },
    crypto: webcrypto,
    __MVT_ACK_BACKOFF_MS: [0, 0],
    __MVT_TURNSTILE_POLL_MS: 5,
    __MVT_TURNSTILE_TIMEOUT_MS: 30, // no turnstile stub — fail fast instead of waiting 8s
    localStorage: {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('denied'); },
    },
    fetch: async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
  };
  const run = new Function('window', 'document', 'URLSearchParams', 'Date', 'JSON', 'Object',
    SOURCE.replace(/__MVT_LANDING_PAGE__/g, 'escape'));
  let threw = false;
  try { run(win, { referrer: '', createElement: () => ({ style: {} }), head: { appendChild() {} }, body: { appendChild() {} } }, URLSearchParams, Date, JSON, Object); } catch (e) { threw = true; }
  check('survives blocked localStorage', !threw);
  check('still reads attribution from the current URL',
    !threw && win.mvtAttribution().utm_source === 'google');
}

{
  // form_id from the page body must reach /api/lead (the CRM keys the source form
  // off it). It is internal routing, not a field the seller reads, so it is stripped
  // from the Web3Forms email (EMAIL_EXCLUDE).
  const { win, calls } = boot({ search: AD_CLICK });
  await (await submitLead(win, { form_id: 'bookingForm' })).json();
  const w3f = calls.filter((c) => c.url.includes('web3forms'));
  const lead = leadCallsOf(calls);
  const w3fPayload = JSON.parse(w3f[0].init.body);
  const leadPayload = JSON.parse(lead[0].init.body);
  check('forwards form_id on /api/lead body', leadPayload.form_id === 'bookingForm');
  check('strips form_id from the Web3Forms email body', w3fPayload.form_id === undefined);
}

{
  // Two sequential submits on one page must not reuse the previous form_id NOR the
  // previous requestId (server receipts are keyed by requestId).
  const { win, calls } = boot({ search: AD_CLICK });
  await (await submitLead(win, { form_id: 'bookingForm', email: 'a@example.com' })).json();
  await (await submitLead(win, { form_id: 'exitForm', email: 'b@example.com' })).json();
  const leadCalls = leadCallsOf(calls);
  check('sequential dual-send produces two /api/lead calls', leadCalls.length === 2);
  const firstLead = JSON.parse(leadCalls[0].init.body);
  const secondLead = JSON.parse(leadCalls[1].init.body);
  check('first submit keeps form_id=bookingForm', firstLead.form_id === 'bookingForm');
  check('second submit keeps form_id=exitForm (no stale reuse)',
    secondLead.form_id === 'exitForm');
  check('each submit gets a fresh requestId', firstLead.requestId !== secondLead.requestId);
  check('the ack flag tracks the latest submit', win.mvtLeadAck.requestId === secondLead.requestId);
}

{
  // formId camelCase is normalised to form_id (client already had this mapping).
  const { win, calls } = boot();
  await (await submitLead(win, { formId: 'exitPopup' })).json();
  const leadPayload = JSON.parse(leadCallsOf(calls)[0].init.body);
  check('normalises formId → form_id', leadPayload.form_id === 'exitPopup');
}

{
  // Static page contract: each form path that dual-sends must emit form_id.
  // (Prevents regression of the T8 hidden-input / object-literal fix.)
  const pagesRoot = path.join(here, '..', 'pages');
  const escapeHtml = fs.readFileSync(path.join(pagesRoot, 'escape', 'index.html'), 'utf-8');
  const happyHtml = fs.readFileSync(path.join(pagesRoot, 'happytours', 'index.html'), 'utf-8');
  const dentalHtml = fs.readFileSync(path.join(pagesRoot, 'dental-implants-vietnam', 'index.html'), 'utf-8');

  function formHasHiddenFormId(html, formIdAttr, expectedValue) {
    // Extract the <form id="...">...</form> block (non-greedy, first match).
    const re = new RegExp(
      `<form[^>]*\\bid=["']${formIdAttr}["'][^>]*>([\\s\\S]*?)<\\/form>`,
      'i',
    );
    const m = html.match(re);
    if (!m) return false;
    const hiddenRe = new RegExp(
      `<input[^>]*type=["']hidden["'][^>]*name=["']form_id["'][^>]*value=["']${expectedValue}["']`,
      'i',
    );
    const hiddenReAlt = new RegExp(
      `<input[^>]*name=["']form_id["'][^>]*type=["']hidden["'][^>]*value=["']${expectedValue}["']`,
      'i',
    );
    const hiddenReValFirst = new RegExp(
      `<input[^>]*name=["']form_id["'][^>]*value=["']${expectedValue}["'][^>]*type=["']hidden["']`,
      'i',
    );
    return hiddenRe.test(m[1]) || hiddenReAlt.test(m[1]) || hiddenReValFirst.test(m[1])
      || new RegExp(
        `<input[^>]*type=["']hidden["'][^>]*value=["']${expectedValue}["'][^>]*name=["']form_id["']`,
        'i',
      ).test(m[1]);
  }

  check('escape #bookingForm has hidden form_id=bookingForm',
    formHasHiddenFormId(escapeHtml, 'bookingForm', 'bookingForm'));
  check('escape #exitForm has hidden form_id=exitForm',
    formHasHiddenFormId(escapeHtml, 'exitForm', 'exitForm'));
  check('happytours #bookingForm has hidden form_id=bookingForm',
    formHasHiddenFormId(happyHtml, 'bookingForm', 'bookingForm'));
  check('happytours #exitForm has hidden form_id=exitForm',
    formHasHiddenFormId(happyHtml, 'exitForm', 'exitForm'));
  check('dental #bookingForm has hidden form_id=bookingForm',
    formHasHiddenFormId(dentalHtml, 'bookingForm', 'bookingForm'));
  // Dental exit popup builds an explicit object literal (no FormData) — assert the key is present.
  check('dental exit popup body includes form_id: exitPopup',
    /form_id:\s*['"]exitPopup['"]/.test(dentalHtml));
}

// ---- Page success never waits on the Web3Forms email ------------------------

{
  // Web3Forms stalls forever, /api/lead ACKs → page must report success right away.
  const { win, calls } = boot({ search: AD_CLICK, web3Hang: true });
  const outcome = await Promise.race([
    submitLead(win).then((res) => res.json()),
    new Promise((resolve) => setTimeout(() => resolve('timed-out'), 500)),
  ]);
  check('ACK ok + stalled Web3Forms → page success without waiting',
    outcome !== 'timed-out' && outcome.success === true);
  check('stalled Web3Forms request was still started',
    calls.some((c) => c.url.includes('web3forms')));
  check('stalled Web3Forms → ack flag ok', win.mvtLeadAck && win.mvtLeadAck.ok === true);
}

// ---- Turnstile container is reachable for interactive challenges -------------

function fakeForm() {
  const inserted = [];
  const submit = {
    parentNode: { insertBefore: (el, ref) => inserted.push({ el, ref }) },
  };
  return {
    tagName: 'FORM',
    inserted,
    submit,
    appended: [],
    querySelector: (sel) => (sel === '[type="submit"]' ? submit : null),
    appendChild(el) { this.appended.push(el); },
  };
}

function isOffscreen(style) {
  const css = String(style.cssText || '');
  return /-9999px/.test(css) || /width:\s*0/.test(css) || /height:\s*0/.test(css)
    || /overflow:\s*hidden/.test(css);
}

{
  const { win, rendered, dispatchSubmit } = boot({ search: AD_CLICK });
  const form = fakeForm();
  dispatchSubmit(form);
  await (await submitLead(win)).json();
  const placed = form.inserted[0];
  check('widget container is placed inside the submitted form, before the submit button',
    Boolean(placed) && placed.ref === form.submit && rendered[0] && rendered[0].el === placed.el);
  check('widget container is not off-screen or zero-sized', placed && !isOffscreen(placed.el.style),
    placed ? placed.el.style.cssText : 'none');
  check('widget uses interaction-only appearance with deferred execution',
    rendered[0].options.appearance === 'interaction-only' && rendered[0].options.execution === 'execute');
  check('widget listens for before-interactive-callback',
    typeof rendered[0].options['before-interactive-callback'] === 'function');
}

{
  // No known form (e.g. programmatic submit) → fixed, on-screen body-level box.
  const { win, rendered, bodyChildren } = boot({ search: AD_CLICK });
  await (await submitLead(win)).json();
  const box = rendered[0] && rendered[0].el;
  check('fallback container is on-screen (fixed, not off-screen)',
    Boolean(box) && bodyChildren.includes(box) && /position:fixed/.test(box.style.cssText)
      && !isOffscreen(box.style));
}

{
  // A second form on the page gets its own widget inside that form.
  const { win, rendered, dispatchSubmit } = boot({ search: AD_CLICK });
  const a = fakeForm();
  const b = fakeForm();
  dispatchSubmit(a);
  await (await submitLead(win)).json();
  dispatchSubmit(b);
  await (await submitLead(win)).json();
  check('each form renders its own widget in place',
    rendered.length === 2 && a.inserted.length === 1 && b.inserted.length === 1);
}

{
  // Interactive challenge: token arrives after the short invisible timeout, but the
  // before-interactive-callback extends the wait so the human can finish.
  const { win, calls } = boot({
    search: AD_CLICK,
    tokenTimeoutMs: 30,
    interactiveTimeoutMs: 2000,
    onExecute: (opts, n) => {
      opts['before-interactive-callback']();
      setTimeout(() => opts.callback(`human-tok-${n}`), 120);
    },
  });
  const json = await (await submitLead(win)).json();
  const lead = leadCallsOf(calls);
  check('interactive challenge solved after the invisible timeout still succeeds',
    json.success === true && JSON.parse(lead[0].init.body).turnstileToken === 'human-tok-1');
}

{
  // Control: without the interactive signal the short invisible timeout applies.
  const { win, calls } = boot({
    search: AD_CLICK,
    tokenTimeoutMs: 30,
    interactiveTimeoutMs: 2000,
    leadResponses: [{ status: 403, json: { success: false, error: 'turnstile_rejected' } }],
    onExecute: (opts, n) => { setTimeout(() => opts.callback(`late-tok-${n}`), 120); },
  });
  await (await submitLead(win)).json();
  const lead = leadCallsOf(calls);
  check('invisible pass keeps the short timeout (no token after it lapses)',
    lead.length === 1 && !('turnstileToken' in JSON.parse(lead[0].init.body)));
}

{
  // Interactive challenge the visitor never completes → released at the long timeout.
  const { win, calls } = boot({
    search: AD_CLICK,
    tokenTimeoutMs: 30,
    interactiveTimeoutMs: 150,
    leadResponses: [{ status: 403, json: { success: false, error: 'turnstile_rejected' } }],
    onExecute: (opts) => { opts['before-interactive-callback'](); },
  });
  const t0 = Date.now();
  const json = await (await submitLead(win)).json();
  const elapsed = Date.now() - t0;
  check('unfinished interactive challenge ends at the interactive timeout',
    json.success === false && elapsed >= 140 && leadCallsOf(calls).length === 1, `elapsed ${elapsed}ms`);
}

{
  // Form 1 is mid-challenge (visitor has not clicked yet) when form 2 is submitted.
  // Each form must keep its own pending token request and both leads must succeed.
  const { win, calls, dispatchSubmit } = boot({
    search: AD_CLICK,
    tokenTimeoutMs: 30,
    interactiveTimeoutMs: 2000,
    leadRequiresToken: true,
    onExecute: (opts, n) => {
      if (n === 1) {
        opts['before-interactive-callback']();
        setTimeout(() => opts.callback('form1-tok'), 150); // human solves it later
      } else {
        opts.callback(`form2-tok-${n}`);
      }
    },
  });
  const a = fakeForm();
  const b = fakeForm();
  dispatchSubmit(a);
  const first = submitLead(win, { form_id: 'bookingForm', email: 'a@example.com' });
  await new Promise((r) => setTimeout(r, 40)); // form 1 now waiting on its challenge
  dispatchSubmit(b);
  const second = submitLead(win, { form_id: 'exitForm', email: 'b@example.com' });
  const [j1, j2] = await Promise.all([first.then((r) => r.json()), second.then((r) => r.json())]);
  const lead = leadCallsOf(calls).map((c) => JSON.parse(c.init.body));
  const byForm = (id) => lead.find((p) => p.form_id === id) || {};
  check('overlapping forms: both submits succeed', j1.success === true && j2.success === true);
  check('overlapping forms: form 1 keeps its own challenge token',
    byForm('bookingForm').turnstileToken === 'form1-tok', JSON.stringify(byForm('bookingForm').turnstileToken));
  check('overlapping forms: form 2 gets its own token',
    /^form2-tok-/.test(byForm('exitForm').turnstileToken || ''));
}

// ---- /api/lead request timeout ----------------------------------------------

{
  // First attempt stalls → aborted at the timeout → retried → ACK.
  const { win, calls } = boot({
    search: AD_CLICK,
    ackRequestTimeoutMs: 60,
    leadResponses: [
      { hang: true },
      { status: 200, json: { success: true, requestId: 'r', receiptId: 'rec-t' } },
    ],
  });
  // Race so a client without a timeout reports FAIL instead of hanging the suite.
  const json = await Promise.race([
    submitLead(win).then((res) => res.json()),
    new Promise((resolve) => setTimeout(() => resolve({ success: 'timed-out' }), 2000)),
  ]);
  const lead = leadCallsOf(calls);
  check('stalled /api/lead attempt times out and is retried to success',
    json.success === true && lead.length === 2);
  check('the stalled attempt was given an abort signal',
    Boolean(lead[0].init.signal) && lead[0].init.signal.aborted === true);
  const ids = lead.map((c) => JSON.parse(c.init.body).requestId);
  check('timeout retry keeps the same requestId', ids[0] === ids[1]);
}

{
  // Every attempt stalls (and the fetch ignores abort) → page failure + WhatsApp, bounded.
  const { win, calls } = boot({
    search: AD_CLICK,
    ackRequestTimeoutMs: 40,
    leadResponses: [{ hang: true, ignoreAbort: true }],
  });
  const t0 = Date.now();
  const outcome = await Promise.race([
    submitLead(win).then((res) => res.json()),
    new Promise((resolve) => setTimeout(() => resolve('timed-out'), 2000)),
  ]);
  const elapsed = Date.now() - t0;
  check('all attempts stalled → page failure (not stuck sending)',
    outcome !== 'timed-out' && outcome.success === false, `elapsed ${elapsed}ms`);
  check('stalled failure message points to WhatsApp', outcome !== 'timed-out' && /whatsapp/i.test(outcome.message || ''));
  check('stalled submit made the max 3 attempts', leadCallsOf(calls).length === 3);
  check('stalled submit → ack not ok', win.mvtLeadAck && win.mvtLeadAck.ok === false);
}

console.log(failures === 0 ? '\nAll attribution checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
