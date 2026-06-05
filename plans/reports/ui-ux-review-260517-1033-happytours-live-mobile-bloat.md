# happytours.myvivatour.com — UX Review (2026-05-17)

Reviewed live page on iPhone 13 Pro (390×844, DPR 2) and desktop 1440×900 via Playwright. Screenshots: `/tmp/happytours-review-260517/`. Raw signals: `mobile-signals.json`.

## TL;DR

**Page works — sticky-bar smart-sync chạy đúng, brand orange-red consistent, preview cards đẹp.** Vấn đề lớn: **mobile scroll = 19,433px (skill yêu cầu < 12,000)**. Bloat tập trung ở 3 chỗ: per-tour Price blocks (~600px × 3), Why MyVivaTour (~4,000px), Hero CTA pill 2 dòng. Trim đúng 3 chỗ này = giảm ~6,000-7,000px, đưa về dưới 13k.

## Measured data

| Metric | Mobile | Desktop | Target | Status |
|---|---:|---:|---:|---|
| Total page height | **19,433px** | 12,702px | <12k (mobile) | **FAIL — 60% over** |
| Hero | 753px | ~700px | <650 mobile | over |
| Tour Selector section | **1,743px** | ~700px | <1,100 | over |
| Tour-Honeymoon section | 1,663px | ~1,100px | <1,000 (compact) | over |
| Tour-Family section | 1,685px | ~1,100px | <1,000 | over |
| Tour-Luxury section | 1,708px | ~1,100px | <1,000 | over |
| Compare section | 1,488px | ~900px | <1,000 | borderline |
| Why MyVivaTour | **2,214px (visible) — actual ~4,000px** | ~1,400px | <1,200 | **FAIL** |
| Testimonials+Video+Highlights (gap) | ~3,468px | ~1,800px | <2,000 | **FAIL** |
| Booking | 2,536px | ~1,400px | <1,800 | over |

## Issues — by priority

### P0-1 · Per-tour Price block bloats each tour section (~600px × 3 = 1,800px)

**Evidence:** `mobile-06-compare.png` — Luxury tour section ends with a giant `$2,999` price card listing all-inclusive details + "Where you'll go" + book button. Inspected markup confirms `.tour-price-card / .tour-price-row / .tour-price-was / .tour-highlights-grid / tour-cta-row` exist in all 3 tour sections.

**Skill rule violated** (`multi-tour-landing-page-with-smart-sticky-bar-and-preview-cards.md`):
> No per-tour Pricing section — the selector card price + the Compare Table cover it. A 3rd price reveal = redundant scroll cost.

Price is now shown 3× per tour: selector card, in-section card, compare table. Visitor hits same number 3 times → friction without trust gain.

**Fix:** Strip `.tour-price-card` + `.tour-highlights-grid` (the pill row) + `.tour-cta-row` from each `<section class="tour-section">`. Keep only: hero image, day-by-day itinerary (collapsed accordion), inline `<a class="tour-book-btn">` to scroll-to-booking with `selectTourAndScroll(key)`. Saves ~1,800px.

### P0-2 · Why MyVivaTour section ≈ 4,000px (6 cards stacking single-column on mobile)

**Evidence:** `mobile-09-faq.png` shows hero of why-mvt + first card ("Personalised Itineraries"). `mobile-10-highlights-bridge.png` shows "Premium Accommodations" + "Authentic Experiences" — i.e. cards 5-6. `mobile-11-booking.png` shows "All-Inclusive Pricing" — still in why-mvt. Confirms 6 cards × ~600px each + section padding ≈ 4,000px.

**Fix:** Switch to **2-column grid on mobile** (375px+) with tighter padding. Each card becomes ~280px tall × 3 rows = ~900px total. Saves ~3,000px.

```css
@media (max-width: 768px) {
  .why-mvt-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  .why-mvt-card {
    padding: 1rem 0.75rem;
    min-height: auto;
  }
  .why-mvt-card h3 { font-size: 1rem; }
  .why-mvt-card p  { font-size: 0.85rem; line-height: 1.4; }
  .why-mvt-icon    { width: 48px; height: 48px; font-size: 1.5rem; }
}
```

Alternative: keep 1-column but shrink to icon-left + text-right horizontal row (~150px each × 6 = 900px). Equally compact, easier to scan.

### P0-3 · Hero CTA pill wraps 2 lines, eats 30% of mobile viewport

**Evidence:** `mobile-01-hero.png` — "Packages from $1,699 AUD · All-Inclusive" wraps after "AUD". Pill takes 2 rows, ~130px tall.

**Fix:** Tighten copy + single line. Suggest:
- Option A (recommended): `From $1,699 AUD →` (single line, lets `→` invite scroll/click)
- Option B: `See packages from $1,699 AUD` (action-led)

Plus reduce font-size mobile-only `clamp(1rem, 4vw, 1.25rem)` and `padding: 1rem 1.75rem`. Saves ~70px above the fold = stronger LCP signal + headline + trust pills all fit.

### P1-4 · Tour Selector cards = 580px each (1,743px stacked) — too tall for "quick navigator"

**Evidence:** `mobile-02-tour-selector.png` shows only 1 full card + edge of next. To see all 3 visitor must scroll a full viewport.

The selector is meant to be a **menu**, not a sales card. Right now it shows: image (199px) + tag + h3 + meta + was-price + price + "See itinerary →" button. Selector should preview, sales card should sell.

**Fix:** Compact each card to **~360px** (saves ~660px total):
- Image: 199px → 140px (`aspect-ratio: 16 / 7` instead of `16 / 9`)
- Remove was-price (it's a menu pick, not a deal pitch — was-price belongs in compare table + per-tour section)
- Remove tag (For Couples / For Families / Lowest Price Ever) OR convert to single corner badge over image
- Trim body padding from `1.25rem 1.25rem 1.5rem` → `0.85rem 1rem 1.1rem`

Alternative: **3-column horizontal grid even on mobile** (tablet `768px+` already does this). At 390px viewport that's tight but doable if cards are this compact (~120px wide, image-led, title only).

### P1-5 · Floating buttons stack visually on right edge

**Evidence:** Mobile screenshots — back-to-top (orange circle ↑) + WhatsApp (green) sit one above the other on right side, both above sticky bar. 3 elements competing for visitor's right thumb. Looks busy.

**Fix:** Either:
- Hide back-to-top on mobile (sticky bar already provides clear next-step) — `@media (max-width: 768px) { #backToTop { display: none; } }`
- OR merge into sticky bar: add small `↑` icon button left of the price text in sticky bar

### P1-6 · Section gap suggests testimonials/video/highlights are bloated

**Evidence:** Mobile sections jump from `why-mvt` end (~11,796) → `faq` start (15,264) = **3,468px** for Testimonials + Video + Highlights. Likely 1,200px each.

Need to render with proper sections to measure. Quick wins likely:
- **Testimonials**: 6 TripAdvisor cards stacking single-column = bloat. Convert to 1 featured (Aussie) + horizontal scroll-snap carousel for the other 5.
- **Video**: facade is fine; just verify aspect ratio doesn't exceed 16:9 panel.
- **Highlights**: 6 icon cards repeating Why-MVT structure = candidate for 2-col grid (same fix as P0-2).

### P2-7 · Sticky bar default state has weird whitespace

**Evidence:** `mobile-signals.json` → `stickyBarText: "From $1,699 AUD\n        Book Now →"` — newlines + 8 spaces leaking into rendered text. Indentation from HTML source.

**Fix:** Move `From $1,699 AUD` and `Book Now →` into siblings without inline whitespace, or use `white-space: nowrap` + trim in JS update. Not visible to user but worth tidying.

### P2-8 · Hero gives no scroll cue

Above-the-fold = headline + CTA + trust pills + inclusion pills. No "↓ More below" indicator. On a 19k-tall page, visitor needs a stronger hint that there's a tour selector right below.

**Fix:** Add tiny chevron animation below trust bar, OR show 30-40px of next section (selector intro) peeking above the fold by trimming hero `min-height: 88vh` on mobile.

## What's working well (don't break)

- **Smart sticky bar smart-sync** — confirmed via screenshot at scroll Y=6200 (luxury section): bar shows `$2,999 AUD · Book Luxury Cruise →`. Pattern is solid.
- **Preview images** in selector cards render panoramic, not portrait-crop. `height: 100%` CSS override holds.
- **selectTourAndScroll()** pre-selects the right radio via `getElementById('tour_' + key)` — works correctly despite human-readable radio values (id vs value separation, smart choice).
- **Compare table** has both top + bottom swipe hints, white italic on dark navy — readable.
- **Brand orange-red** consistent across hero CTA, price badges, sticky bar, compare CTAs, in-section book buttons.
- **TripAdvisor trust bar** (5.0 · 230 reviews) above the fold — strong social proof.
- **Tour radio includes `Not sure - help me choose`** — captures browsers who refuse to commit.

## Proposed fix bundle (1 commit, ~30 min work)

| # | Change | Saves | Risk |
|---|---|---:|---|
| 1 | Strip per-tour Price block (`.tour-price-card` + `.tour-highlights-grid` + `.tour-cta-row` in each `<section.tour-section>`) | ~1,800px | low — selector + compare cover it |
| 2 | Why-MVT → 2-col mobile grid + tighter card padding | ~3,000px | none |
| 3 | Hero CTA: `From $1,699 AUD →` single line, smaller mobile font | ~70px above fold | none |
| 4 | Tour selector cards: aspect-ratio 16/7, drop was-price, trim padding | ~660px | low |
| 5 | Hide #backToTop on mobile | n/a (declutter) | none |
| 6 | Testimonials → carousel on mobile (1 featured + horizontal scroll-snap) | ~800px | medium — needs new JS for scroll-snap |
| 7 | Highlights → same 2-col grid as Why-MVT | ~1,500px | none |

**Total estimated saving: ~7,800px** → mobile page drops from 19,433 to ~11,600. Hits the < 12k target.

## Unresolved questions

1. **Per-tour price block removal**: keep the `<a class="tour-book-btn">` inline link at the bottom of each tour section, or move to a section-bottom CTA bar? (Recommend keep inline link, low cost, anchors the section visually.)
2. **Testimonials carousel**: build scroll-snap CSS-only (simpler, no JS) or use IntersectionObserver-driven slide indicators (richer UX, more JS)? (Recommend CSS-only first — iterate if data shows poor swipe engagement.)
3. **Hero scroll cue**: chevron animation vs peek-next-section — which does the user prefer aesthetically? (Need user pick.)
