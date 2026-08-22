'use strict';

// Fixture tests for the typed content-render token injector.
// Run: node scripts/test-injector.js  (exits non-zero on any failure)
//
// Covers per-type encoder safety (the XSS / context-break guardrail) plus the
// injector's strip / keep-markers render modes and fail-closed behaviour.

const assert = require('assert');
const {
  encodeText,
  encodeAttribute,
  encodeUrl,
  encodeNumber,
  encodeJson,
  injectContentTokens,
} = require('./lib/content-token-injector');

let passed = 0;
function ok(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}
function throws(name, fn, match) {
  assert.throws(fn, match, `${name} should throw`);
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const U2028 = '\u2028';
const U2029 = '\u2029';

console.log('text encoder');
ok('escapes < > & " and single quote', () => {
  const out = encodeText(`</script><img src=x onerror="alert('x')">&`);
  assert.strictEqual(out.includes('<'), false);
  assert.strictEqual(out.includes('>'), false);
  assert.strictEqual(out.includes('"'), false);
  assert.strictEqual(out.includes("'"), false);
  assert.ok(out.includes('&amp;'));
  assert.ok(out.includes('&lt;/script&gt;'));
});
ok('preserves a $ price verbatim', () => {
  assert.strictEqual(encodeText('$2,099'), '$2,099');
});

console.log('attribute encoder');
ok('neutralises a quote-breakout payload', () => {
  const out = encodeAttribute(`" onmouseover="alert(1)`);
  assert.strictEqual(out.includes('"'), false);
  assert.ok(out.includes('&quot;'));
});

console.log('url encoder');
ok('accepts http and https', () => {
  assert.strictEqual(encodeUrl('https://x.com/a?b=1&c=2'), 'https://x.com/a?b=1&amp;c=2');
  assert.ok(encodeUrl('http://x.com/').startsWith('http://'));
});
ok('accepts a relative url', () => {
  assert.strictEqual(encodeUrl('/tours/vietnam'), '/tours/vietnam');
});
throws('rejects javascript: scheme', () => encodeUrl('javascript:alert(1)'), /non-http/);
throws('rejects data: scheme', () => encodeUrl('data:text/html,<script>'), /non-http/);
throws('rejects control-char-obfuscated javascript:', () => encodeUrl('java\tscript:alert(1)'), /non-http/);
throws('rejects uppercase JaVaScRiPt: scheme', () => encodeUrl('JaVaScRiPt:alert(1)'), /non-http/);

console.log('number encoder');
ok('coerces a numeric value', () => {
  assert.strictEqual(encodeNumber(230), '230');
  assert.strictEqual(encodeNumber('676'), '676');
});
throws('rejects a non-numeric value', () => encodeNumber('abc'), /not a finite number/);
throws('rejects NaN', () => encodeNumber(NaN), /not a finite number/);
throws('rejects Infinity', () => encodeNumber(Infinity), /not a finite number/);

console.log('json encoder');
ok('escapes </script>, <, >, & so it cannot break out of a script tag', () => {
  const out = encodeJson({ q: `</script><b>tom & jerry` });
  assert.strictEqual(out.includes('</script>'), false);
  assert.strictEqual(out.includes('<'), false);
  assert.strictEqual(out.includes('>'), false);
  assert.ok(out.includes('\\u003c/script\\u003e'));
  assert.ok(out.includes('\\u0026'));
  assert.deepStrictEqual(JSON.parse(out.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>').replace(/\\u0026/g, '&')), { q: '</script><b>tom & jerry' });
});
ok('escapes U+2028 / U+2029 line separators', () => {
  const out = encodeJson({ q: `a${U2028}b${U2029}c` });
  assert.strictEqual(out.includes(U2028), false);
  assert.strictEqual(out.includes(U2029), false);
  assert.ok(out.includes('\\u2028'));
  assert.ok(out.includes('\\u2029'));
});

console.log('injector render modes + fail-closed');
ok('strip mode removes the comment markers', () => {
  const out = injectContentTokens('<p><!--P-->$1,379<!--/P--></p>', { P: { type: 'text', value: '$1,379' } }, 'd');
  assert.strictEqual(out, '<p>$1,379</p>');
});
ok('keep-markers mode preserves the markers', () => {
  const out = injectContentTokens('<p><!--C-->230<!--/C--></p>', { C: { type: 'number', render: 'keep-markers', value: 230 } }, 'd');
  assert.strictEqual(out, '<p><!--C-->230<!--/C--></p>');
});
ok('replaces every occurrence of a token span', () => {
  const out = injectContentTokens('<a><!--P-->x<!--/P--></a><b><!--P-->x<!--/P--></b>', { P: { type: 'text', value: '$2,070' } }, 'd');
  assert.strictEqual(out, '<a>$2,070</a><b>$2,070</b>');
});
throws('required token with no value fails closed, naming the source', () => {
  injectContentTokens('x', { ESCAPE_PRICE: { type: 'text', required: true, value: undefined } }, 'data/escape.json');
}, /Required token ESCAPE_PRICE has no value in data\/escape\.json/);
ok('optional token with no value leaves HTML untouched', () => {
  const html = '<p><!--O-->old<!--/O--></p>';
  assert.strictEqual(injectContentTokens(html, { O: { type: 'text', required: false, value: undefined } }, 'd'), html);
});

console.log(`\n${passed} assertions passed`);
