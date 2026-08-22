'use strict';

// Typed content-render token injector for build.js.
// =================================================
// Replaces `<!--TOKEN-->...<!--/TOKEN-->` spans in landing-page HTML with values
// pulled from data/*.json, encoding each value per its declared type so a
// marketing string can never break out of its HTML / attribute / URL / JSON-LD
// context. The typed encoders + fixture tests (scripts/test-injector.js) are the
// guardrail for this build-time HTML injection surface.
//
// Render modes (per token, not global):
//   'strip'        (default) - the whole span, markers included, becomes the
//                  encoded value. Comment markers do NOT survive into worker.js.
//                  This matches how plain prices/headlines already ship today.
//   'keep-markers' - the markers are re-emitted around the value. Used only by
//                  legacy TA_COUNT, whose markers already ship in HEAD:worker.js;
//                  keeping them preserves byte-equivalence for the migration.
//
// Fail-closed: a token declared `required` whose data value is absent throws,
// naming the source file + token. An `optional` token whose value is absent
// leaves the existing HTML untouched (graceful fallback for not-yet-migrated
// fields).

// text: HTML text-node context. Same escaping as build.js's original escapeHtml.
function encodeText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// attribute: quoted HTML attribute context. The same entity set as text is safe
// inside both single- and double-quoted attribute values (quotes + angle
// brackets + ampersand are all encoded).
const encodeAttribute = encodeText;

// url: attribute context that must also be a safe navigable URL. Rejects any
// explicit scheme other than http/https (e.g. javascript:, data:, vbscript:).
// Relative URLs (no scheme) are allowed. C0 control chars + DEL are stripped
// first so obfuscated schemes like "java\tscript:" cannot slip past the scheme
// check - browsers ignore those characters when resolving the scheme.
function encodeUrl(value) {
  const cleaned = String(value).replace(/[\u0000-\u001f\u007f]/g, '').trim();
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(cleaned);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== 'http' && scheme !== 'https') {
      throw new Error(`url token: refusing non-http(s) scheme "${scheme}:"`);
    }
  }
  return encodeAttribute(cleaned);
}

// number: numeric token. Coerces and rejects non-finite (NaN/Infinity) values.
function encodeNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`number token: value ${JSON.stringify(value)} is not a finite number`);
  }
  return String(n);
}

// json: JSON-LD context inside a <script> element. JSON.stringify alone is not
// safe - a literal "</script>" in a string closes the element early. After
// stringify we escape <, >, & and the JS line separators (U+2028/U+2029) to \u
// escapes (keeping the value valid JSON), then assert no literal </script>
// survives.
function encodeJson(value) {
  const safe = JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  if (safe.includes('</script>')) {
    throw new Error('json token: output still contains a literal </script>');
  }
  return safe;
}

const ENCODERS = {
  text: encodeText,
  attribute: encodeAttribute,
  url: encodeUrl,
  number: encodeNumber,
  json: encodeJson,
};

function encodeToken(type, value) {
  const encoder = ENCODERS[type];
  if (!encoder) throw new Error(`unknown token type "${type}"`);
  return encoder(value);
}

/**
 * Replace every declared token span in `html`.
 * @param {string} html
 * @param {Object<string, {type:string, required?:boolean, render?:string, value:*}>} tokens
 * @param {string} sourceLabel Human-readable data source (for fail-closed errors).
 * @returns {string}
 */
function injectContentTokens(html, tokens, sourceLabel) {
  let result = html;
  for (const [name, spec] of Object.entries(tokens)) {
    const { type, required = false, render = 'strip', value } = spec;

    if (value === undefined || value === null || value === '') {
      if (required) {
        throw new Error(
          `Required token ${name} has no value in ${sourceLabel} - build aborted (fail-closed)`
        );
      }
      continue; // optional: leave existing HTML untouched
    }

    const encoded = encodeToken(type, value);
    const regex = new RegExp(`<!--${name}-->[\\s\\S]*?<!--/${name}-->`, 'g');
    const replacement =
      render === 'keep-markers' ? `<!--${name}-->${encoded}<!--/${name}-->` : encoded;

    // Use a function replacer: token values contain "$" (e.g. $1,379, $2,099).
    // A string replacement would interpret "$1"/"$&" as capture-group refs and
    // corrupt the output. A closure disables all $-pattern interpretation.
    result = result.replace(regex, () => replacement);
  }
  return result;
}

module.exports = {
  encodeText,
  encodeAttribute,
  encodeUrl,
  encodeNumber,
  encodeJson,
  encodeToken,
  injectContentTokens,
  ENCODERS,
};
