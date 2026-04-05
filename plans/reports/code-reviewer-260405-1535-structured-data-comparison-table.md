# Code Review: Structured Data & Comparison Table

**File:** `/Users/minhhome/projects/MVTLandingpage/pages/escape/index.html`
**Date:** 2026-04-05
**Focus:** JSON-LD schema additions, HTML comparison table

## Overall Assessment

Solid additions. All 6 JSON-LD blocks parse as valid JSON. Schema types are appropriate. Table math is correct. A few issues worth addressing.

## Critical Issues

None.

## High Priority

### 1. Placeholder prices "0" in hasOfferCatalog (line 1708-1710)

Three tours (Honeymoon, Family, Luxury Cruise) have `"price": "0"`. Google treats price "0" as a real free offer. This will confuse Rich Results and potentially trigger manual actions for misleading pricing.

**Fix:** Remove the `price` and `priceCurrency` fields from placeholder offers, or replace with a `priceSpecification` using `minPrice` if a range is known. Simplest fix -- omit price entirely:

```json
{"@type": "Offer", "itemOffered": {"@type": "TouristTrip", "name": "Vietnam Honeymoon Package"}, "availability": "https://schema.org/PreOrder"}
```

### 2. aggregateRating reviewCount vs actual reviews mismatch (line 1764-1765)

`reviewCount: "89"` but only 3 reviews are provided in the `review` array. This is technically valid (you don't need to list all reviews), but Google may flag the discrepancy if the page has no other visible review content showing 89 reviews.

**Recommendation:** Ensure the page visibly displays the "89 reviews" claim somewhere (e.g., testimonials section header). If reviews are sourced from external platforms, add `"url"` pointing to the source.

## Medium Priority

### 3. Review datePublished values are in the future relative to current date context

Reviews dated 2025-12-15, 2025-11-20, 2025-10-08. Current date is 2026-04-05 so these are in the past -- **valid and plausible**.

### 4. HTML table accessibility gaps (lines 2509-2549)

- Missing `<caption>` element for screen readers
- No `scope="col"` on `<th>` elements
- No `aria-label` on the table
- Inline styles are heavy but acceptable for a single-page landing

**Fix example:**
```html
<table role="table" aria-label="Package comparison">
  <caption class="sr-only">Compare Vietnam tour packages by price, hotel, cruise, and guide type</caption>
  <thead>
    <tr>
      <th scope="col">Package</th>
      ...
```

### 5. ItemList "Private Tour Package" is misleading (line 1939-1944)

The ItemList position 4 is "Private Tour Package" at $2,369 which is base + private guide upgrade. But the HTML table shows the same 3-4 star hotels / standard cruise -- it's not really a separate "package" in the same tier as 4-star/5-star. Consider renaming to "Base + Private Guide" for clarity, or noting it in the description.

## Low Priority

### 6. WebPage speakable cssSelectors validated

`.hero-content` defined at CSS line 320, used at HTML line 1990. `.pricing-header` defined at CSS line 841, used at HTML line 2427. Both exist and match -- **no issue**.

### 7. Single-item BreadcrumbList (lines 1868-1881)

A BreadcrumbList with only one "Home" item provides minimal SEO value. Not harmful, but won't generate breadcrumb rich results (Google requires 2+ items). Consider adding a second level or removing to reduce payload.

## Positive Observations

- All 6 JSON-LD blocks parse without errors
- Price math verified: $2,389 = 2099+290, $2,779 = 2099+680, $2,369 = 2099+270 -- all correct
- TouristTrip schema is well-structured with full 10-item itinerary
- Review authors match real testimonial names visible on page
- FAQ schema comprehensive with 8 questions covering key buyer concerns
- Speakable selectors point to real CSS classes
- Table has responsive overflow-x wrapper for mobile
- Build passes cleanly

## Recommended Actions (Priority Order)

1. **[High]** Remove or fix `price: "0"` on placeholder tour offers
2. **[High]** Ensure 89-review claim is substantiated visually on page
3. **[Medium]** Add `<caption>` and `scope="col"` to comparison table for a11y
4. **[Low]** Consider removing single-item BreadcrumbList or expanding it
5. **[Low]** Clarify "Private Tour Package" naming in ItemList

## Metrics

- JSON-LD blocks: 6 (all valid)
- Schema types: TravelAgency, TouristTrip, FAQPage, BreadcrumbList, WebPage, ItemList
- Accessibility issues: 2 (table caption, th scope)
- Data accuracy issues: 1 (price "0" placeholders)
- Build: Passes

## Unresolved Questions

1. Are the 89 reviews sourced from a specific platform (Google, TripAdvisor)? If so, linking to the source would strengthen credibility.
2. Will the honeymoon/family/cruise pages eventually have real pricing? If so, placeholder offers could be removed entirely until then.
