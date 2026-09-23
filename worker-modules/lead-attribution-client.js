// Client-side attribution capture + lead dual-send with edge-inbox ACK.
//
// build.js injects this into the <head> of every landing page, with
// __MVT_LANDING_PAGE__ replaced by the page folder name.
//
// Three jobs:
//   1. Remember where the visitor came from (first touch survives later navigation,
//      so a lead that converts on a second visit is still credited to the ad).
//   2. On Web3Forms POST: send the email copy to Web3Forms in parallel (unchanged,
//      never blocked) AND post the full record to same-origin /api/lead — but now
//      the page only sees "success" once /api/lead ACKs the edge inbox.
//   3. Run Cloudflare Turnstile (invisible) for /api/lead: one fresh single-use
//      token per attempt; on 503 retry:'new_token' reset the widget, keep the same
//      requestId + payload, retry with backoff (max 3 attempts).
//
// Web3Forms free plan blocks server-side calls (no static Worker IP). Email must leave
// the browser. /api/lead is the durable CRM path — the ACK gates the page's success UX.
(function () {
  'use strict';

  var LANDING_PAGE = '__MVT_LANDING_PAGE__';
  var STORE_KEY = 'mvt_attribution';
  var MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days — matches the Google Ads window
  var PARAMS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid',
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
      landing_url: window.location.href,
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

  // --- Dual-send: Web3Forms (email, parallel) + ACK-gated /api/lead (CRM) ------

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

  // Tracking / internal / protocol keys that must never reach the email inbox.
  var EMAIL_EXCLUDE = {
    landing_page: 1, page_path: 1, referrer: 1, landing_first_seen: 1, landing_url: 1,
    full_name: 1, form_id: 1, formId: 1, popup_id: 1, page_id: 1,
    requestId: 1, turnstileToken: 1,
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

  // --- Turnstile (invisible, on-demand) ---------------------------------------
  //
  // Mirrors the WP main-site pattern: one hidden widget per page, script loaded
  // lazily at the first form submit, execution deferred until we call execute().
  // Tokens are single-use — every attempt resets the widget for a fresh one.

  var TURNSTILE_SITE_KEY = '0x4AAAAAADtJJZkl7Qik4UNn';
  var TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
  var TURNSTILE_TOKEN_TIMEOUT_MS = 9000;
  // Test hooks: unit tests shorten the waits so no real delays hit the suite.
  var TURNSTILE_LOAD_TIMEOUT_MS = window.__MVT_TURNSTILE_TIMEOUT_MS || 8000;
  var TURNSTILE_POLL_MS = window.__MVT_TURNSTILE_POLL_MS || 100;
  var ACK_BACKOFF_MS = window.__MVT_ACK_BACKOFF_MS || [400, 800];
  var ACK_MAX_ATTEMPTS = 3;

  var turnstileScriptRequested = false;
  var turnstileWidgetId = null;
  var turnstilePending = null; // { resolve, timer }

  function loadTurnstileApi(cb) {
    if (window.turnstile && typeof window.turnstile.render === 'function') return cb(true);
    if (!turnstileScriptRequested) {
      turnstileScriptRequested = true;
      try {
        var script = document.createElement('script');
        script.src = TURNSTILE_SRC;
        script.async = true;
        (document.head || document.body).appendChild(script);
      } catch (e) {
        // Fall through to polling — some stubbed/embedded environments predefine
        // window.turnstile without a loadable <script> path.
      }
    }
    var waited = 0;
    (function poll() {
      if (window.turnstile && typeof window.turnstile.render === 'function') return cb(true);
      if (waited >= TURNSTILE_LOAD_TIMEOUT_MS) return cb(false);
      waited += TURNSTILE_POLL_MS;
      setTimeout(poll, TURNSTILE_POLL_MS);
    })();
  }

  function resolveTurnstileToken(token) {
    var pending = turnstilePending;
    turnstilePending = null;
    if (pending) {
      clearTimeout(pending.timer);
      pending.resolve(token);
    }
  }

  function ensureTurnstileWidget() {
    if (turnstileWidgetId !== null) return turnstileWidgetId;
    try {
      var box = document.createElement('div');
      box.style.cssText = 'position:absolute;left:-9999px;width:0;height:0;overflow:hidden;';
      (document.body || document.head).appendChild(box);
      turnstileWidgetId = window.turnstile.render(box, {
        sitekey: TURNSTILE_SITE_KEY,
        execution: 'execute',
        appearance: 'interaction-only',
        callback: function (token) { resolveTurnstileToken(token); },
        'error-callback': function () { resolveTurnstileToken(null); },
        'timeout-callback': function () { resolveTurnstileToken(null); },
        'expired-callback': function () { resolveTurnstileToken(null); },
      });
    } catch (e) {
      turnstileWidgetId = null;
    }
    return turnstileWidgetId;
  }

  // cb(token|null) — null means no token available (blocked script, timeout, error).
  function getTurnstileToken(cb) {
    loadTurnstileApi(function (ready) {
      if (!ready || !window.turnstile) return cb(null);
      var widgetId = ensureTurnstileWidget();
      if (widgetId === null || widgetId === undefined) return cb(null);
      if (turnstilePending) resolveTurnstileToken(null); // release any prior pending
      try { window.turnstile.reset(widgetId); } catch (e) { /* stale widget state */ }
      var timer = setTimeout(function () { resolveTurnstileToken(null); }, TURNSTILE_TOKEN_TIMEOUT_MS);
      turnstilePending = { resolve: cb, timer: timer };
      try { window.turnstile.execute(widgetId); } catch (e) { resolveTurnstileToken(null); }
    });
  }

  function uuid() {
    try {
      if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    } catch (e) {}
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function ackBackoff(attempt, fn) {
    var delay = ACK_BACKOFF_MS[Math.min(attempt, ACK_BACKOFF_MS.length - 1)] || 0;
    setTimeout(fn, delay);
  }

  // Post the merged payload to /api/lead until the edge inbox ACKs it.
  // Resolves { ok:boolean, requestId } — requestId survives every retry of the
  // same submission (it keys the server-side receipt). A 503 retry:'new_token'
  // means the token was spent without a receipt, so the next attempt uses a fresh
  // Turnstile token over an identical business payload.
  function postLeadForAck(merged) {
    var requestId = uuid();
    merged.requestId = requestId;

    function attempt(n) {
      return new Promise(function (resolveAttempt) {
        getTurnstileToken(function (token) {
          var bodyText;
          if (token) {
            var withToken = {};
            for (var key in merged) {
              if (Object.prototype.hasOwnProperty.call(merged, key)) withToken[key] = merged[key];
            }
            withToken.turnstileToken = token;
            bodyText = JSON.stringify(withToken);
          } else {
            // No token (script blocked / timed out) — still try; the edge answers 403
            // and the page falls back to WhatsApp. Never fake success.
            bodyText = JSON.stringify(merged);
          }
          nativeFetch(LEAD_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: bodyText,
          })
            .then(function (res) {
              return res.json().catch(function () { return {}; }).then(function (json) {
                return { status: res.status, json: json };
              });
            })
            .then(function (r) {
              if (r.json && r.json.success) return resolveAttempt({ ok: true, receiptId: r.json.receiptId });
              var retriable = (r.status === 503 && r.json && r.json.retry === 'new_token')
                || r.status === 0; // network blip before/after the request landed
              if (retriable && n + 1 < ACK_MAX_ATTEMPTS) {
                return ackBackoff(n, function () { attempt(n + 1).then(resolveAttempt); });
              }
              resolveAttempt({ ok: false, status: r.status });
            })
            .catch(function () {
              if (n + 1 < ACK_MAX_ATTEMPTS) {
                return ackBackoff(n, function () { attempt(n + 1).then(resolveAttempt); });
              }
              resolveAttempt({ ok: false });
            });
        });
      });
    }

    return attempt(0).then(function (result) {
      result.requestId = requestId;
      return result;
    });
  }

  function ackFailureResponse() {
    // Shape it like a Web3Forms failure so existing page error branches (retry hint +
    // WhatsApp fallback) run unchanged. ok:true + success:false, exactly like
    // Web3Forms' own validation failures.
    return new Response(
      JSON.stringify({
        success: false,
        message: 'We could not verify your submission. Please try again or message us on WhatsApp.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } },
    );
  }

  // The lead is safely in the edge inbox, so the visitor must see success even if the
  // parallel Web3Forms email copy failed — otherwise they resubmit and create a
  // duplicate lead under a fresh requestId.
  function ackSuccessResponse() {
    return new Response(
      JSON.stringify({ success: true, message: 'Thanks! We will be in touch shortly.' }),
      { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } },
    );
  }

  function emailOrAckSuccess(emailPromise) {
    return emailPromise.then(function (res) {
      if (!res || !res.ok) return ackSuccessResponse();
      return res.clone().json().then(function (json) {
        return json && json.success ? res : ackSuccessResponse();
      }, function () { return ackSuccessResponse(); });
    }, function () { return ackSuccessResponse(); });
  }

  window.fetch = function (input, init) {
    if (!isWeb3Forms(input) || !init || init.method !== 'POST' || typeof init.body !== 'string') {
      return nativeFetch(input, init);
    }
    var merged = mergeAttribution(init.body);
    if (!merged) return nativeFetch(input, init);

    // The email inbox gets only what a seller needs to reply — tracking stripped.
    // Sent in parallel; the ACK path below never blocks or cancels it.
    var w3fInit = {
      method: 'POST',
      headers: init.headers || { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(buildEmailPayload(merged)),
    };
    var emailPromise = nativeFetch(input, w3fInit);
    // A pre-ACK email rejection must not fire the browser's unhandled-rejection
    // warning; the page still sees the real rejection when the ACK path returns it.
    emailPromise.catch(function () {});

    // The page may only report success after the edge inbox ACKs. The ACK outcome is
    // published on window.mvtLeadAck BEFORE the response resolves, so page-level
    // conversion firing can gate on it synchronously.
    return postLeadForAck(merged)
      .then(function (ack) {
        window.mvtLeadAck = ack;
        if (ack && ack.ok) return emailOrAckSuccess(emailPromise);
        return ackFailureResponse();
      }, function () {
        window.mvtLeadAck = { ok: false };
        return ackFailureResponse();
      });
  };
})();
