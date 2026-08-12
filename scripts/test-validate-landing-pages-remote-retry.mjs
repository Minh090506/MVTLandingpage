// Tests for transient HEAD retry in scripts/validate-landing-pages.js
//
// Stubs globalThis.fetch — no real network. Proves:
//   1) timeout/transient failures retry up to 3 times and succeed on last try
//   2) permanent 404 is not retried (exactly 1 attempt)
//
// Run: node scripts/test-validate-landing-pages-remote-retry.mjs

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const {
  headUrl,
  isTransientHeadFailure,
  REMOTE_MAX_ATTEMPTS,
} = require(path.join(here, 'validate-landing-pages.js'));

let failures = 0;
function check(name, condition, detail = '') {
  if (condition) console.log(`  ok   ${name}`);
  else {
    failures += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function makeResponse(status, url = 'https://cdn.example.test/img.webp') {
  return {
    status,
    url,
    ok: status >= 200 && status < 300,
  };
}

function stubFetchSequence(outcomes) {
  const calls = [];
  let index = 0;
  const realFetch = globalThis.fetch;

  globalThis.fetch = async (url, init) => {
    const step = outcomes[Math.min(index, outcomes.length - 1)];
    index += 1;
    calls.push({ url: String(url), method: init && init.method, at: Date.now() });

    if (typeof step === 'function') {
      return step(url, init);
    }
    if (step && step.throw) {
      const err = new Error(step.message || 'network down');
      err.name = step.name || 'TypeError';
      throw err;
    }
    if (step && step.abort) {
      const err = new Error('This operation was aborted');
      err.name = 'AbortError';
      throw err;
    }
    return makeResponse(step.status ?? 200, String(url));
  };

  return {
    calls,
    restore() {
      globalThis.fetch = realFetch;
    },
  };
}

async function testTransientTimeoutThenOk() {
  console.log('\ntransient: AbortError x2 then HTTP 200');
  const stub = stubFetchSequence([
    { abort: true },
    { abort: true },
    { status: 200 },
  ]);

  try {
    const started = Date.now();
    const result = await headUrl('https://cdn.example.test/ok.webp');
    const elapsed = Date.now() - started;

    check('result.ok after 3rd try', result.ok === true);
    check('attempts === 3', result.attempts === 3, `got ${result.attempts}`);
    check('fetch called 3 times', stub.calls.length === 3, `got ${stub.calls.length}`);
    check('all HEAD', stub.calls.every((c) => c.method === 'HEAD'));
    // 300 + 900 backoff between attempts (allow some scheduling slack)
    check('backoff applied (~1.2s)', elapsed >= 1100, `elapsed ${elapsed}ms`);
    check('no error on success', result.error === null);
  } finally {
    stub.restore();
  }
}

async function testPermanent404NoRetry() {
  console.log('\npermanent: HTTP 404 once only');
  const stub = stubFetchSequence([{ status: 404 }]);

  try {
    const result = await headUrl('https://cdn.example.test/missing.webp');

    check('result not ok', result.ok === false);
    check('status 404', result.status === 404);
    check('attempts === 1', result.attempts === 1, `got ${result.attempts}`);
    check('fetch called exactly once', stub.calls.length === 1, `got ${stub.calls.length}`);
    check(
      'error mentions 1 attempt',
      typeof result.error === 'string' && /after 1 attempt\b/.test(result.error),
      result.error,
    );
    check(
      'error mentions 404',
      typeof result.error === 'string' && result.error.includes('404'),
      result.error,
    );
  } finally {
    stub.restore();
  }
}

async function test5xxRetriesThenFail() {
  console.log('\ntransient: HTTP 503 all three attempts then fail');
  const stub = stubFetchSequence([
    { status: 503 },
    { status: 503 },
    { status: 503 },
  ]);

  try {
    const result = await headUrl('https://cdn.example.test/flaky.webp');

    check('result not ok', result.ok === false);
    check('status 503', result.status === 503);
    check(`attempts === ${REMOTE_MAX_ATTEMPTS}`, result.attempts === REMOTE_MAX_ATTEMPTS);
    check('fetch called 3 times', stub.calls.length === 3, `got ${stub.calls.length}`);
    check(
      'error mentions 3 attempts',
      typeof result.error === 'string' && /after 3 attempts\b/.test(result.error),
      result.error,
    );
  } finally {
    stub.restore();
  }
}

function testIsTransientHelper() {
  console.log('\nisTransientHeadFailure helper');
  check('null status is transient', isTransientHeadFailure({ ok: false, status: null }) === true);
  check('429 is transient', isTransientHeadFailure({ ok: false, status: 429 }) === true);
  check('503 is transient', isTransientHeadFailure({ ok: false, status: 503 }) === true);
  check('404 is not transient', isTransientHeadFailure({ ok: false, status: 404 }) === false);
  check('403 is not transient', isTransientHeadFailure({ ok: false, status: 403 }) === false);
  check('ok is not transient', isTransientHeadFailure({ ok: true, status: 200 }) === false);
}

async function main() {
  console.log('validate-landing-pages remote HEAD retry');
  testIsTransientHelper();
  await testTransientTimeoutThenOk();
  await testPermanent404NoRetry();
  await test5xxRetriesThenFail();

  console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'}: ${failures} failure(s)`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main();
