// Tests for worker-modules/lead-attribution-client.js
//
// The client is an IIFE meant for a browser, so we run it against hand-rolled
// stubs for localStorage / location / document / fetch. No jsdom, no network.
//
// Run: node scripts/test-lead-attribution-client.mjs

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
function boot({
  search = '',
  referrer = '',
  storage = {},
  landingPage = 'escape',
  leadDelayMs = 0,
  leadStatus = 200,
  web3Status = 200,
  web3Body = { success: true, message: 'OK' },
} = {}) {
  const store = { ...storage };
  const calls = [];

  const win = {
    location: { search, pathname: '/', href: `https://escape.myvivatour.com/${search}` },
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
    },
    fetch: async (input, init) => {
      const url = String(input);
      calls.push({ url, init, at: Date.now() });
      if (url === '/api/lead') {
        if (leadDelayMs > 0) {
          await new Promise((r) => setTimeout(r, leadDelayMs));
        }
        if (leadStatus === 'throw') throw new Error('lead network down');
        return {
          ok: leadStatus < 400,
          status: leadStatus,
          json: async () => ({ success: leadStatus < 400 }),
        };
      }
      if (url.includes('api.web3forms.com')) {
        return {
          ok: web3Status < 400,
          status: web3Status,
          json: async () => web3Body,
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    },
  };
  const doc = { referrer };

  const run = new Function(
    'window', 'document', 'URLSearchParams', 'Date', 'JSON', 'Object',
    SOURCE.replace(/__MVT_LANDING_PAGE__/g, landingPage),
  );
  run(win, doc, URLSearchParams, Date, JSON, Object);

  return { win, store, calls };
}

const AD_CLICK = '?utm_source=google&utm_medium=cpc&utm_campaign=escape-core-au&gclid=Cj0KTest';

console.log('lead-attribution-client');

{
  const { win, store } = boot({ search: AD_CLICK, referrer: 'https://www.google.com/' });
  const attr = win.mvtAttribution();
  check('captures utm_source', attr.utm_source === 'google');
  check('captures utm_campaign', attr.utm_campaign === 'escape-core-au');
  check('captures gclid', attr.gclid === 'Cj0KTest');
  check('records landing_page', attr.landing_page === 'escape');
  check('records referrer', attr.referrer === 'https://www.google.com/');
  check('stamps landing_first_seen', typeof attr.landing_first_seen === 'string');
  check('persists to localStorage', Boolean(store.mvt_attribution));
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
  const pageRes = await win.fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_key: 'k', name: 'Jane', email: 'jane@example.com' }),
  });
  // Allow microtask for fire-and-forget /api/lead
  await new Promise((r) => setTimeout(r, 0));

  const w3f = calls.filter((c) => c.url.includes('web3forms'));
  const lead = calls.filter((c) => c.url === '/api/lead');
  check('dual-send hits Web3Forms', w3f.length === 1);
  check('dual-send hits /api/lead', lead.length === 1);
  check('page receives Web3Forms response', pageRes.ok === true && pageRes.status === 200);

  const w3fPayload = JSON.parse(w3f[0].init.body);
  const leadPayload = JSON.parse(lead[0].init.body);
  check('Web3Forms payload gets utm_campaign', w3fPayload.utm_campaign === 'escape-core-au');
  check('Web3Forms payload gets gclid', w3fPayload.gclid === 'Cj0KTest');
  check('maps name to full_name on both paths',
    w3fPayload.full_name === 'Jane' && leadPayload.full_name === 'Jane');
  check('keeps original fields', w3fPayload.email === 'jane@example.com');
  check('/api/lead gets same attribution merge', leadPayload.gclid === 'Cj0KTest');
}

{
  const { win, calls } = boot({ search: AD_CLICK, leadStatus: 502 });
  const pageRes = await win.fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    body: JSON.stringify({ access_key: 'k', email: 'jane@example.com' }),
  });
  await new Promise((r) => setTimeout(r, 0));
  check('/api/lead failure does not change page response',
    pageRes.ok === true && pageRes.status === 200);
  check('Web3Forms still called when /api/lead fails',
    calls.some((c) => c.url.includes('web3forms')));
}

{
  const { win, calls } = boot({ search: AD_CLICK, leadStatus: 'throw' });
  const pageRes = await win.fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    body: JSON.stringify({ access_key: 'k', email: 'jane@example.com' }),
  });
  await new Promise((r) => setTimeout(r, 0));
  check('/api/lead throw does not reject page fetch', pageRes.ok === true);
  check('Web3Forms still called when /api/lead throws',
    calls.some((c) => c.url.includes('web3forms')));
}

{
  // Slow /api/lead must not delay the Web3Forms response the page awaits.
  const { win } = boot({ search: AD_CLICK, leadDelayMs: 80 });
  const t0 = Date.now();
  const pageRes = await win.fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    body: JSON.stringify({ access_key: 'k', email: 'jane@example.com' }),
  });
  const elapsed = Date.now() - t0;
  check('slow /api/lead does not delay page response',
    pageRes.ok === true && elapsed < 50,
    `elapsed ${elapsed}ms`);
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
    location: { search: AD_CLICK, pathname: '/' },
    localStorage: {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('denied'); },
    },
    fetch: async () => ({ ok: true, status: 200 }),
  };
  const run = new Function('window', 'document', 'URLSearchParams', 'Date', 'JSON', 'Object',
    SOURCE.replace(/__MVT_LANDING_PAGE__/g, 'escape'));
  let threw = false;
  try { run(win, { referrer: '' }, URLSearchParams, Date, JSON, Object); } catch (e) { threw = true; }
  check('survives blocked localStorage', !threw);
  check('still reads attribution from the current URL',
    !threw && win.mvtAttribution().utm_campaign === 'escape-core-au');
}

{
  // form_id from the page body must reach BOTH Web3Forms and /api/lead (T8).
  // The monkey-patch only sees the body — pages must put form_id in FormData/JSON.
  const { win, calls } = boot({ search: AD_CLICK });
  await win.fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_key: 'k',
      name: 'Jane',
      email: 'jane@example.com',
      form_id: 'bookingForm',
    }),
  });
  await new Promise((r) => setTimeout(r, 0));
  const w3f = calls.filter((c) => c.url.includes('web3forms'));
  const lead = calls.filter((c) => c.url === '/api/lead');
  const w3fPayload = JSON.parse(w3f[0].init.body);
  const leadPayload = JSON.parse(lead[0].init.body);
  check('forwards form_id on Web3Forms body', w3fPayload.form_id === 'bookingForm');
  check('forwards form_id on /api/lead body', leadPayload.form_id === 'bookingForm');
}

{
  // Two sequential submits on one page must not reuse the previous form_id.
  // (Mirrors real pages: each <form> carries its own hidden form_id input.)
  const { win, calls } = boot({ search: AD_CLICK });
  await win.fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_key: 'k', email: 'a@example.com', form_id: 'bookingForm',
    }),
  });
  await new Promise((r) => setTimeout(r, 0));
  await win.fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_key: 'k', email: 'b@example.com', form_id: 'exitForm',
    }),
  });
  await new Promise((r) => setTimeout(r, 0));
  const leadCalls = calls.filter((c) => c.url === '/api/lead');
  check('sequential dual-send produces two /api/lead calls', leadCalls.length === 2);
  const firstLead = JSON.parse(leadCalls[0].init.body);
  const secondLead = JSON.parse(leadCalls[1].init.body);
  check('first submit keeps form_id=bookingForm', firstLead.form_id === 'bookingForm');
  check('second submit keeps form_id=exitForm (no stale reuse)',
    secondLead.form_id === 'exitForm');
  check('second submit does not inherit bookingForm', secondLead.form_id !== 'bookingForm');
}

{
  // formId camelCase is normalised to form_id (client already had this mapping).
  const { win, calls } = boot();
  await win.fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_key: 'k', email: 'c@example.com', formId: 'exitPopup' }),
  });
  await new Promise((r) => setTimeout(r, 0));
  const leadPayload = JSON.parse(calls.find((c) => c.url === '/api/lead').init.body);
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

console.log(failures === 0 ? '\nAll attribution checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
