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
  injectSentinelTokens,
} = require('./lib/content-token-injector');
const {
  assertJsonLdConsistency,
  assertJsonLdProseConsistency,
} = require('./lib/jsonld-price-drift');

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

console.log('sentinel pass (@@TOKEN@@) + fail-closed');
ok('replaces a @@TOKEN@@ sentinel in a meta/attribute context, $ verbatim', () => {
  const html = '<meta content="from @@ESCAPE_PRICE@@ AUD">';
  const out = injectSentinelTokens(html, { ESCAPE_PRICE: { type: 'text', required: true, value: '$2,099' } }, 'data/escape.json');
  assert.strictEqual(out, '<meta content="from $2,099 AUD">');
});
ok('replaces EVERY occurrence of a sentinel (meta + title + JS)', () => {
  const html = '<title>@@P@@</title><script>const x="@@P@@ AUD";</script>';
  const out = injectSentinelTokens(html, { P: { type: 'text', required: true, value: '$676' } }, 'd');
  assert.strictEqual(out, '<title>$676</title><script>const x="$676 AUD";</script>');
});
ok('number sentinel emits a bare numeric (JS price counter)', () => {
  const out = injectSentinelTokens('const c = @@N@@;', { N: { type: 'number', required: true, value: 2099 } }, 'd');
  assert.strictEqual(out, 'const c = 2099;');
});
ok('preserves a form value string structure, substituting only the price', () => {
  const html = '<input value="VHM10 - Honeymoon (10 days · @@HP@@ AUD)">';
  const out = injectSentinelTokens(html, { HP: { type: 'text', required: true, value: '$2,070' } }, 'd');
  assert.strictEqual(out, '<input value="VHM10 - Honeymoon (10 days · $2,070 AUD)">');
});
ok('attribute-encodes a sentinel value so it cannot break out of the attribute', () => {
  const out = injectSentinelTokens('<meta content="@@X@@">', { X: { type: 'attribute', required: true, value: '" onload="alert(1)' } }, 'd');
  assert.strictEqual(out.includes('" onload='), false);
  assert.ok(out.includes('&quot; onload='));
});
throws('required sentinel with no value fails closed, naming file+token', () => {
  injectSentinelTokens('x @@ESCAPE_PRICE_NUM@@', { ESCAPE_PRICE_NUM: { type: 'number', required: true, value: undefined } }, 'data/escape.json');
}, /Required sentinel token ESCAPE_PRICE_NUM has no value in data\/escape\.json/);
ok('optional sentinel with no value leaves HTML untouched', () => {
  const html = 'keep @@O@@ literal';
  assert.strictEqual(injectSentinelTokens(html, { O: { type: 'text', required: false, value: undefined } }, 'd'), html);
});
ok('a token whose sentinel is absent is a no-op (value present)', () => {
  const html = '<p>no marker here</p>';
  assert.strictEqual(injectSentinelTokens(html, { P: { type: 'text', required: true, value: '$1' } }, 'd'), html);
});

console.log('JSON-LD price/count drift guard');
const LD = (obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
const goodLd =
  LD({
    '@type': 'TravelAgency',
    hasOfferCatalog: {
      itemListElement: [
        { '@type': 'Offer', itemOffered: { name: 'Base Package' }, price: '2099' },
      ],
    },
  }) +
  LD({
    '@type': 'TouristTrip',
    name: 'Escape Australia - 10 Day All-Inclusive Vietnam Journey',
    offers: { '@type': 'Offer', price: '2099' },
    aggregateRating: { '@type': 'AggregateRating', ratingCount: '230', reviewCount: '230' },
  });
ok('passes when JSON-LD prices + counts match the data values', () => {
  assertJsonLdConsistency(goodLd, 'escape', {
    tourPrices: { 'Base Package': 2099, 'Escape Australia - 10 Day All-Inclusive Vietnam Journey': 2099 },
    reviewCount: 230,
  });
});
throws('THROWS naming page+value when an Offer.price diverges from data', () => {
  assertJsonLdConsistency(goodLd, 'escape', { tourPrices: { 'Base Package': 3000 } });
}, /drift guard \[escape\][\s\S]*Base Package[\s\S]*3000/);
throws('THROWS when a guarded tour is missing/renamed in the JSON-LD', () => {
  assertJsonLdConsistency(goodLd, 'escape', { tourPrices: { 'Ghost Tour': 2099 } });
}, /no Offer\.price found for guarded tour "Ghost Tour"/);
throws('THROWS when ratingCount/reviewCount diverges from data', () => {
  assertJsonLdConsistency(goodLd, 'escape', { reviewCount: 231 });
}, /aggregateRating[\s\S]*diverges from data value 231/);
ok('resolves a nested Offer via inherited enclosing name (comparison ItemList)', () => {
  const nested = LD({
    '@type': 'ItemList',
    itemListElement: [
      { '@type': 'ListItem', item: { '@type': 'TouristTrip', name: 'Overlook Vietnam Family Tour — 7 Days', offers: { '@type': 'Offer', price: '676' } } },
    ],
  });
  assertJsonLdConsistency(nested, 'happytours', { tourPrices: { 'Overlook Vietnam Family Tour — 7 Days': 676 } });
  assert.throws(
    () => assertJsonLdConsistency(nested, 'happytours', { tourPrices: { 'Overlook Vietnam Family Tour — 7 Days': 999 } }),
    /diverges from data value 999/
  );
});
throws('THROWS on an unparseable ld+json block (cannot verify → fail-closed)', () => {
  assertJsonLdConsistency('<script type="application/ld+json">{ bad json }</script>', 'escape', { reviewCount: 230 });
}, /not valid JSON/);

console.log('dental content tokens (from-price + own rating)');
ok('injects DENTAL_FROM_PRICE as both a meta sentinel and a body comment span', () => {
  const html =
    '<title>From @@DENTAL_FROM_PRICE@@</title><div><!--DENTAL_FROM_PRICE-->AUD 1,220<!--/DENTAL_FROM_PRICE--></div>';
  const specs = { DENTAL_FROM_PRICE: { type: 'text', required: true, value: 'AUD 1,220' } };
  let out = injectSentinelTokens(html, specs, 'data/dental-implants-vietnam.json');
  out = injectContentTokens(out, specs, 'data/dental-implants-vietnam.json');
  assert.strictEqual(out, '<title>From AUD 1,220</title><div>AUD 1,220</div>');
});
ok('injects dental OWN rating value + count (own aggregateRating, not TA)', () => {
  const html =
    '<span><!--DENTAL_RATING_VALUE-->4.9<!--/DENTAL_RATING_VALUE-->/5</span><b><!--DENTAL_RATING_COUNT-->500<!--/DENTAL_RATING_COUNT-->+</b>';
  const specs = {
    DENTAL_RATING_VALUE: { type: 'text', required: true, value: '4.9' },
    DENTAL_RATING_COUNT: { type: 'number', required: true, value: 500 },
  };
  const out = injectContentTokens(html, specs, 'data/dental-implants-vietnam.json');
  assert.strictEqual(out, '<span>4.9/5</span><b>500+</b>');
});
throws('dental from-price required + missing fails closed naming file+token', () => {
  injectSentinelTokens(
    '@@DENTAL_FROM_PRICE@@',
    { DENTAL_FROM_PRICE: { type: 'text', required: true, value: undefined } },
    'data/dental-implants-vietnam.json'
  );
}, /Required sentinel token DENTAL_FROM_PRICE has no value in data\/dental-implants-vietnam\.json/);

console.log('JSON-LD ratingValue guard (dental carries its own Google rating)');
const dentalLd = LD({
  '@type': 'Product',
  name: 'Dental Implants Vietnam',
  offers: { '@type': 'Offer', price: '1220' },
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', ratingCount: '500' },
});
ok('passes when dental Offer.price + ratingValue + ratingCount all match', () => {
  assertJsonLdConsistency(dentalLd, 'dental-implants-vietnam', {
    tourPrices: { 'Dental Implants Vietnam': 1220 },
    reviewCount: 500,
    ratingValue: '4.9',
  });
});
throws('THROWS when dental ratingValue diverges from data', () => {
  assertJsonLdConsistency(dentalLd, 'dental-implants-vietnam', {
    tourPrices: { 'Dental Implants Vietnam': 1220 },
    reviewCount: 500,
    ratingValue: '4.8',
  });
}, /ratingValue "4.9"[\s\S]*diverges from data value 4\.8/);

console.log('JSON-LD prose drift guard (stale current-price sentences)');
const proseLd =
  LD({
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: "What's included in the $2,099 price?",
        acceptedAnswer: { '@type': 'Answer', text: 'All hotels, meals and guides.' },
      },
    ],
  }) +
  LD({ '@type': 'WebPage', description: '10-Day All-Inclusive Vietnam Tour from $2,099 AUD.' });
const escapeAnchors = [
  { label: 'FAQ "…included in the … price?"', regex: /included in the \$?([\d.,]+) price/g },
  { label: 'description "Vietnam Tour from … AUD"', regex: /Vietnam Tour from \$?([\d.,]+) AUD/g },
];
ok('passes when the current-price prose matches the data value', () => {
  assertJsonLdProseConsistency(proseLd, 'escape', { price: 2099, anchors: escapeAnchors });
});
throws('THROWS naming the anchor + value when a FAQ/description price is stale', () => {
  assertJsonLdProseConsistency(proseLd, 'escape', { price: 2199, anchors: escapeAnchors });
}, /prose drift guard \[escape\][\s\S]*2,099[\s\S]*2199/);
throws('fail-closed when NO current-price anchor matches (prose reworded away)', () => {
  assertJsonLdProseConsistency(
    LD({ '@type': 'WebPage', description: 'No price mentioned here at all.' }),
    'escape',
    { price: 2099, anchors: escapeAnchors }
  );
}, /none of the current-price prose anchors matched/);
ok('dental anchors ignore secondary prices in the same prose blob', () => {
  const dLd = LD({
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How much do dental implants cost in Vietnam?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Single implants start from AUD 1,220 (USD 800). Straumann from AUD 2,200. All-on-4 from AUD 8,240 per jaw.',
        },
      },
    ],
  });
  const dAnchors = [
    { label: 'FAQ single-implant from-price', regex: /Single implants start from AUD ([\d.,]+)/g },
  ];
  // 2,200 and 8,240 in the same blob must NOT trip the guard.
  assertJsonLdProseConsistency(dLd, 'dental-implants-vietnam', { price: 1220, anchors: dAnchors });
  assert.throws(
    () => assertJsonLdProseConsistency(dLd, 'dental-implants-vietnam', { price: 1300, anchors: dAnchors }),
    /1,220[\s\S]*1300/
  );
});

console.log(`\n${passed} assertions passed`);
