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
}

module.exports = {
  collectOfferPrices,
  collectRatingCounts,
  extractJsonLdBlocks,
  assertJsonLdConsistency,
};
