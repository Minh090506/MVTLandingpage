'use strict';

// Build-failing JSON-LD price/count drift guard.
// ==============================================
// Approach C (Hybrid): the landing-page JSON-LD (`<script type="application/ld+json">`)
// is intentionally NOT tokenized — search engines read those literals and a
// build-time substitution bug there is high blast-radius. Instead this guard
// parses each JSON-LD block and THROWS if a structured-data value diverges from
// the same source-of-truth in data/*.json, naming the page + the specific value.
// That makes structured-data drift impossible to ship while keeping the JSON-LD
// blocks byte-for-byte hand-authored.
//
// Guarded values (per the plan): each tracked tour's Offer.price, and every
// aggregateRating ratingCount / reviewCount.
//
// Offers are matched to a tour by a STABLE name (either the object's own `name`,
// its `itemOffered.name`, or the nearest enclosing name), because one tour's
// price recurs across several JSON-LD shapes (OfferCatalog entry, the Product /
// TouristTrip `offers`, and the comparison ItemList). Un-tracked offers (e.g.
// derived upgrade packages) are ignored — only tours listed by the caller are
// checked, and each tracked tour MUST appear at least once (fail-closed on
// removal/rename).

// Recursively collect { name, price } for every object that carries a `price`,
// resolving the tour name from the object, its itemOffered, or the nearest
// enclosing named object.
function collectOfferPrices(node, inheritedName, out) {
  if (Array.isArray(node)) {
    for (const n of node) collectOfferPrices(n, inheritedName, out);
    return;
  }
  if (!node || typeof node !== 'object') return;

  let localName = inheritedName;
  if (typeof node.name === 'string') {
    localName = node.name;
  } else if (node.itemOffered && typeof node.itemOffered.name === 'string') {
    localName = node.itemOffered.name;
  }

  if (
    Object.prototype.hasOwnProperty.call(node, 'price') &&
    (typeof node.price === 'string' || typeof node.price === 'number')
  ) {
    out.push({ name: localName, price: node.price });
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === 'price') continue;
    collectOfferPrices(value, localName, out);
  }
}

// Recursively collect every ratingCount / reviewCount literal.
function collectRatingCounts(node, out) {
  if (Array.isArray(node)) {
    for (const n of node) collectRatingCounts(n, out);
    return;
  }
  if (!node || typeof node !== 'object') return;

  if (Object.prototype.hasOwnProperty.call(node, 'ratingCount')) {
    out.push({ field: 'ratingCount', value: node.ratingCount });
  }
  if (Object.prototype.hasOwnProperty.call(node, 'reviewCount')) {
    out.push({ field: 'reviewCount', value: node.reviewCount });
  }

  for (const value of Object.values(node)) collectRatingCounts(value, out);
}

// Recursively collect every aggregateRating ratingValue literal. Only checked when
// the caller pins an expected ratingValue (dental carries its own Google rating; the
// travel LPs quote TripAdvisor and pin only the count, so their ratingValue is left
// unguarded here — no behaviour change for them).
function collectRatingValues(node, out) {
  if (Array.isArray(node)) {
    for (const n of node) collectRatingValues(n, out);
    return;
  }
  if (!node || typeof node !== 'object') return;

  if (Object.prototype.hasOwnProperty.call(node, 'ratingValue')) {
    out.push({ field: 'ratingValue', value: node.ratingValue });
  }

  for (const value of Object.values(node)) collectRatingValues(value, out);
}

// Recursively collect current-price PROSE: FAQPage question text, answer text, and
// every `description` field. The JSON-LD Offer.price is only one place a price
// literal lives; the same current price is repeated in human-readable copy that
// search engines and answer engines quote. This gathers exactly the fields the prose
// guard inspects (nothing else, so tour/brand names never get scanned for prices).
function collectProse(node, out) {
  if (Array.isArray(node)) {
    for (const n of node) collectProse(n, out);
    return;
  }
  if (!node || typeof node !== 'object') return;

  if (typeof node.description === 'string') out.push(node.description);
  if (node['@type'] === 'Question' && typeof node.name === 'string') out.push(node.name);
  if (typeof node.text === 'string') out.push(node.text);

  for (const value of Object.values(node)) collectProse(value, out);
}

// Parse a price-shaped prose fragment ("$2,099", "1,220") to a number.
function proseNumber(fragment) {
  return Number(String(fragment).replace(/[^0-9.]/g, ''));
}

// Parse every <script type="application/ld+json"> block into an object.
// A block that is not valid JSON is itself a build failure (fail-closed): the
// guard cannot verify structured data it cannot parse.
function extractJsonLdBlocks(html, pageLabel) {
  const blocks = [];
  const re = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const raw = match[1].trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch (err) {
      throw new Error(
        `JSON-LD drift guard [${pageLabel}]: an application/ld+json block is not valid JSON (${err.message})`
      );
    }
  }
  return blocks;
}

/**
 * Assert the JSON-LD structured data matches the data-file source of truth.
 * @param {string} html          Page HTML (JSON-LD blocks still literal).
 * @param {string} pageLabel     Page slug, used in error messages.
 * @param {Object} expected
 * @param {Object<string, number>} expected.tourPrices  tourName -> expected numeric price
 * @param {number} [expected.reviewCount]               expected rating/review count
 * @throws {Error} naming page + value on any divergence (fail-closed).
 */
function assertJsonLdConsistency(html, pageLabel, expected) {
  const blocks = extractJsonLdBlocks(html, pageLabel);

  const prices = [];
  const ratings = [];
  for (const block of blocks) {
    collectOfferPrices(block, null, prices);
    collectRatingCounts(block, ratings);
  }

  const tourPrices = (expected && expected.tourPrices) || {};
  for (const [tourName, expectedNum] of Object.entries(tourPrices)) {
    const matches = prices.filter((p) => p.name === tourName);
    if (matches.length === 0) {
      throw new Error(
        `JSON-LD drift guard [${pageLabel}]: no Offer.price found for guarded tour "${tourName}" ` +
          `(expected ${expectedNum} from data) — a tour was renamed/removed in the JSON-LD`
      );
    }
    for (const p of matches) {
      if (Number(p.price) !== Number(expectedNum)) {
        throw new Error(
          `JSON-LD drift guard [${pageLabel}]: Offer.price "${p.price}" for "${tourName}" ` +
            `diverges from data value ${expectedNum} — update the JSON-LD literal AND/OR data/${pageLabel}.json so structured data matches`
        );
      }
    }
  }

  if (expected && expected.reviewCount !== undefined && expected.reviewCount !== null) {
    if (ratings.length === 0) {
      throw new Error(
        `JSON-LD drift guard [${pageLabel}]: no aggregateRating ratingCount/reviewCount found ` +
          `(expected ${expected.reviewCount} from tripadvisor-reviews.json)`
      );
    }
    for (const r of ratings) {
      if (Number(r.value) !== Number(expected.reviewCount)) {
        throw new Error(
          `JSON-LD drift guard [${pageLabel}]: aggregateRating ${r.field} "${r.value}" ` +
            `diverges from data value ${expected.reviewCount} — update the JSON-LD literal or tripadvisor-reviews.json`
        );
      }
    }
  }

  if (expected && expected.ratingValue !== undefined && expected.ratingValue !== null) {
    const ratingValues = [];
    for (const block of blocks) collectRatingValues(block, ratingValues);
    if (ratingValues.length === 0) {
      throw new Error(
        `JSON-LD drift guard [${pageLabel}]: no aggregateRating ratingValue found ` +
          `(expected ${expected.ratingValue} from data/${pageLabel}.json)`
      );
    }
    for (const r of ratingValues) {
      if (Number(r.value) !== Number(expected.ratingValue)) {
        throw new Error(
          `JSON-LD drift guard [${pageLabel}]: aggregateRating ratingValue "${r.value}" ` +
            `diverges from data value ${expected.ratingValue} — update the JSON-LD literal or data/${pageLabel}.json`
        );
      }
    }
  }
}

/**
 * Assert the CURRENT price rendered as prose (FAQPage question/answer text and
 * `description` fields) matches the data source of truth.
 * ======================================================================
 * The JSON-LD Offer.price literal is guarded by assertJsonLdConsistency, but the
 * same current price is repeated in human-readable copy — e.g. a FAQ "What's
 * included in the $2,099 price?" or "Single implants start from AUD 1,220". A price
 * bump that updates Offer.price but forgets the prose ships stale structured data.
 *
 * Each anchor is a tight literal-context regex with ONE numeric capture group; the
 * captured number must equal the data current price. Anchors are deliberately
 * specific so unrelated prices in the same prose (dental's 1,510 / 8,240, comparison
 * ranges) never match. Fail-closed: if NOT ONE anchor matches, the current-price
 * sentence was reworded/removed and the guard would silently pass — that also throws.
 * The JSON-LD stays literal; this only prevents shipping drift.
 *
 * @param {string} html       Page HTML (JSON-LD blocks still literal).
 * @param {string} pageLabel  Page slug, used in error messages.
 * @param {Object} expected
 * @param {number} expected.price                       numeric current price
 * @param {Array<{label:string, regex:RegExp}>} expected.anchors
 * @throws {Error} naming page + anchor + value on any divergence (fail-closed).
 */
function assertJsonLdProseConsistency(html, pageLabel, expected) {
  if (!expected || !Array.isArray(expected.anchors) || expected.anchors.length === 0) {
    return;
  }
  const blocks = extractJsonLdBlocks(html, pageLabel);
  const proseParts = [];
  for (const block of blocks) collectProse(block, proseParts);
  const prose = proseParts.join('\n');

  const expectedPrice = Number(expected.price);
  let totalMatches = 0;

  for (const anchor of expected.anchors) {
    // Force a fresh global regex per call so lastIndex state never leaks between
    // anchors or builds.
    const flags = anchor.regex.flags.includes('g') ? anchor.regex.flags : anchor.regex.flags + 'g';
    const re = new RegExp(anchor.regex.source, flags);
    let match;
    while ((match = re.exec(prose)) !== null) {
      totalMatches += 1;
      const found = proseNumber(match[1]);
      if (found !== expectedPrice) {
        throw new Error(
          `JSON-LD prose drift guard [${pageLabel}]: ${anchor.label} shows current price "${match[1]}" ` +
            `but data/${pageLabel}.json current price is ${expectedPrice} — update the JSON-LD prose literal or the data file`
        );
      }
    }
  }

  if (totalMatches === 0) {
    throw new Error(
      `JSON-LD prose drift guard [${pageLabel}]: none of the current-price prose anchors matched — ` +
        `the FAQ/description current-price sentence was reworded or removed; update JSONLD_PROSE_GUARD anchors so drift stays caught`
    );
  }
}

module.exports = {
  collectOfferPrices,
  collectRatingCounts,
  collectRatingValues,
  collectProse,
  extractJsonLdBlocks,
  assertJsonLdConsistency,
  assertJsonLdProseConsistency,
};
