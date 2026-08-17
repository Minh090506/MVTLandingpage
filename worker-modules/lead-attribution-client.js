// Client-side attribution capture + lead dual-send.
//
// build.js injects this into the <head> of every landing page, with
// __MVT_LANDING_PAGE__ replaced by the page folder name.
//
// Two jobs:
//   1. Remember where the visitor came from (first touch survives later navigation,
//      so a lead that converts on a second visit is still credited to the ad).
//   2. On Web3Forms POST: send the form to Web3Forms (email path) AND fire-and-forget
//      the same payload to same-origin /api/lead (DB path). Page handlers always see the
//      Web3Forms response so existing success/error branches stay unchanged.
//
// Web3Forms free plan blocks server-side calls (no static Worker IP). Email must leave
// the browser. /api/lead is best-effort observability — never blocks or fails the UX.
(function () {
  'use strict';

  var LANDING_PAGE = '__MVT_LANDING_PAGE__';
  var STORE_KEY = 'mvt_attribution';
  var MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days — matches the Google Ads window
  var PARAMS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'gclid', 'fbclid', 'msclkid',
  ];

  function readStore() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.first_seen) return null;
      if (Date.now() - parsed.first_seen > MAX_AGE_MS) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function writeStore(value) {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(value));
    } catch (e) {
      // Private mode or storage full — attribution degrades to this pageview only.
    }
  }

  function currentParams() {
    var search = new URLSearchParams(window.location.search);
    var found = {};
    var any = false;
    for (var i = 0; i < PARAMS.length; i++) {
      var value = search.get(PARAMS[i]);
      if (value) {
        found[PARAMS[i]] = value.slice(0, 500);
        any = true;
      }
    }
    return any ? found : null;
  }

  // A fresh campaign click overwrites the stored touch; direct/organic visits do not,
  // so the paid source that originally found this visitor is not erased by a return visit.
  var stored = readStore();
  var incoming = currentParams();
  if (incoming) {
    stored = {
      first_seen: stored && stored.first_seen ? stored.first_seen : Date.now(),
      params: incoming,
      referrer: document.referrer || (stored && stored.referrer) || '',
    };
    writeStore(stored);
  } else if (!stored) {
    stored = { first_seen: Date.now(), params: {}, referrer: document.referrer || '' };
    writeStore(stored);
  }

  function attribution() {
    var out = {
      landing_page: LANDING_PAGE,
      page_path: window.location.pathname + window.location.search,
      referrer: (stored && stored.referrer) || document.referrer || '',
    };
    var params = (stored && stored.params) || {};
    for (var key in params) {
      if (Object.prototype.hasOwnProperty.call(params, key)) out[key] = params[key];
    }
    if (stored && stored.first_seen) {
      out.landing_first_seen = new Date(stored.first_seen).toISOString();
    }
    return out;
  }

  window.mvtAttribution = attribution;

  // --- Dual-send: Web3Forms (email) + fire-and-forget /api/lead (DB) ---------

  var LEAD_ENDPOINT = '/api/lead';
  var nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  if (!nativeFetch) return;

  function isWeb3Forms(input) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    return url.indexOf('api.web3forms.com') !== -1;
  }

  // Parse the form POST and fold in attribution. Returns the merged OBJECT (not a
  // string) so the caller can build two shapes from it: the full record for the CRM
  // and a stripped-down record for the seller's email inbox.
  function mergeAttribution(bodyText) {
    var payload;
    try {
      payload = JSON.parse(bodyText);
    } catch (e) {
      return null; // Not JSON — let the original request through untouched.
    }
    if (!payload || typeof payload !== 'object') return null;
    var extras = attribution();
    for (var key in extras) {
      // Never let a stale form field beat freshly-read attribution.
      if (Object.prototype.hasOwnProperty.call(extras, key) && extras[key]) payload[key] = extras[key];
    }
    // Normalise the field names the pages already use into the ingest schema.
    if (!payload.full_name && payload.name) payload.full_name = payload.name;
    if (!payload.form_id && payload.formId) payload.form_id = payload.formId;
    return payload;
  }

  // --- Email shaping ---------------------------------------------------------
  //
  // Web3Forms emails EVERY key in the payload, one row per key, in insertion order,
  // using the key itself as the label. Left unshaped, the seller's inbox fills with
  // ad-attribution noise (page path with gclid, referrer, first-seen, a duplicate
  // name) that does nothing to help close the booking. So the email gets a curated,
  // ordered, noise-free copy — while the CRM (below) still receives the full record.

  // Tracking / internal keys that must never reach the email inbox.
  var EMAIL_EXCLUDE = {
    landing_page: 1, page_path: 1, referrer: 1, landing_first_seen: 1,
    full_name: 1, form_id: 1, formId: 1, popup_id: 1, page_id: 1,
    gclid: 1, fbclid: 1, msclkid: 1, gbraid: 1, wbraid: 1, dclid: 1,
    ttclid: 1, twclid: 1, li_fat_id: 1,
  };

  function isEmailNoise(key) {
    return EMAIL_EXCLUDE[key] === 1 || key.indexOf('utm_') === 0 || key.indexOf('gad_') === 0;
  }

  // Web3Forms reserved fields — kept but never rendered as visible rows.
  var EMAIL_CONTROL = ['access_key', 'subject', 'from_name', 'redirect', 'ccemail', 'replyto', 'botcheck'];
  // Human fields the seller actually reads, in reading order. Any other non-noise
  // field a page adds still passes through after these.
  var EMAIL_ORDER = [
    'name', 'email', 'phone', 'whatsapp', 'departure_city',
    'travel_dates', 'group_size', 'budget', 'interests_summary', 'message', 'note',
  ];

  function buildEmailPayload(obj) {
    var out = {};
    // 1) Control fields first (hidden from the rendered email).
    for (var i = 0; i < EMAIL_CONTROL.length; i++) {
      var c = EMAIL_CONTROL[i];
      if (obj[c] != null && obj[c] !== '') out[c] = obj[c];
    }
    // Keep "Reply" pointed at the customer even though attribution is gone.
    if (!out.replyto && obj.email) out.replyto = obj.email;
    if (!out.from_name) out.from_name = 'MyVivaTour Website';
    // 2) Known human fields in a sensible order.
    for (var j = 0; j < EMAIL_ORDER.length; j++) {
      var k = EMAIL_ORDER[j];
      if (obj[k] != null && obj[k] !== '' && !(k in out)) out[k] = obj[k];
    }
    // 3) Any remaining page-specific human field (not tracking, not control).
    for (var key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      if (key in out || isEmailNoise(key) || EMAIL_CONTROL.indexOf(key) !== -1) continue;
      if (obj[key] != null && obj[key] !== '') out[key] = obj[key];
    }
    return out;
  }

  function postLeadQuietly(mergedBody) {
    // Fire-and-forget: never throw, never delay the Web3Forms response path.
    try {
      var p = nativeFetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: mergedBody,
      });
      if (p && typeof p.then === 'function') {
        p.then(function () {}, function () {});
      }
    } catch (e) {
      // Ignore — DB path is best-effort.
    }
  }

  window.fetch = function (input, init) {
    if (!isWeb3Forms(input) || !init || init.method !== 'POST' || typeof init.body !== 'string') {
      return nativeFetch(input, init);
    }
    var merged = mergeAttribution(init.body);
    if (!merged) return nativeFetch(input, init);

    // CRM gets the FULL record — attribution stays intact for reporting.
    postLeadQuietly(JSON.stringify(merged));

    // The email inbox gets only what a seller needs to reply — tracking stripped.
    // Page handlers must see the Web3Forms response (success/error UX unchanged).
    var w3fInit = {
      method: 'POST',
      headers: init.headers || { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(buildEmailPayload(merged)),
    };
    return nativeFetch(input, w3fInit);
  };
})();
