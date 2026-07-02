# Multi-Tour Landing Page Pattern

When the user wants a single LP that pitches **multiple tour packages** (e.g. happytours.myvivatour.com bundling Honeymoon + Family + Luxury Cruise), build it as a **selector + 3 deep sections + compare table + ONE shared booking form** — not 3 separate pages.

Shipped + validated on `pages/happytours/index.html` (2026-05-17). Three tours sharing one URL outconverted three siloed LPs in early data — single funnel, single ad spend, visitor can self-segment without leaving the page.

> **Prerequisite:** before touching code, read SKILL.md (color tokens, section order rule, hero rules, tracking IDs) AND `references/design-system.md`. This file only documents what's *different* about multi-tour LPs.

---

## When to use this pattern

| Use multi-tour LP when... | Use single-tour LP when... |
|---|---|
| 2–4 tours share an audience (couples/families/luxury all = AU 35-65 buyers) | One tour with one strong persona |
| Tours differ on price/duration/style but overlap on destinations | Tour is the singular hero (e.g. 10-Day Vietnam Escape) |
| Ad copy says "Vietnam holidays" (broad) | Ad copy names a specific package |
| You want one ad spend feeding three offers | You want max keyword-message match per ad group |

5+ tours = too cluttered, build a category index instead.

---

## Page architecture (in scroll order)

```
Hero (single CTA, hero image montages all 3 destinations)
  → Tour Selector (3 cards with preview images, sticky-friendly)
    → Tour Section A: Honeymoon (deep details, own color theme)
    → Tour Section B: Family (deep details, own color theme)
    → Tour Section C: Luxury (deep details, own color theme)
  → Compare Table (side-by-side: price / duration / what's included)
  → Video (shared MVT story)
  → Why MyVivaTour (trust, shared)
  → Testimonials (shared TripAdvisor block)
  → FAQ (shared)
  → Highlights ("Why Choose This Tour?") + bridge CTA
  → BOOKING FORM (one form, `tour_interest` radio selects which tour)
  → Footer
```

**No per-tour Pricing section** — the selector card price + the Compare Table cover it. A 3rd price reveal = redundant scroll cost. BUT keep a **single compact price line** above each CTA (`<span class="tour-cta-price">From <strong>$X AUD</strong> all-inclusive <span class="was">$Y</span></span>`) — visitor needs a price anchor at the commit moment, just not a full price-card block. Pattern shipped 2026-05-17 after first pass removed price entirely and lost the commit-moment anchor.

**No per-tour Gallery / Highlights / Itinerary accordions** — multi-tour LP is already long. Each tour section gets only: hero image + **itinerary banner** + day-by-day accordion + meta-row chips + "where you'll go" summary + price line + CTA. Don't try to be every tour's full LP.

**Add an itinerary banner image below the hero of each tour section.** Two images per tour section — the hero (e.g. Phu Quoc paradise) primes desire, the itinerary banner (e.g. Halong cruise on Day 2) reinforces the journey shape. Banner CSS uses `aspect-ratio: 1400 / 700` (slightly tighter than hero's 1920/743 so it reads as supporting, not duplicate hero). Pair with a 1-line italic caption like `<span class="tour-itinerary-img-caption">Day 2 — overnight cruise on Lan Ha Bay before flying to Phu Quoc</span>` that ties the image to a specific itinerary day. Source images from the original tour pages on the parent site (e.g. myvivatour.com tour permalinks → grab `og:image` or scan `wp-content/uploads` paths).

> Trim ruthlessly. happytours v1 shipped with full gallery + per-tour highlights = 14,772px scroll. Trimming both saved ~2,200px. Bounce risk drops materially once total page height stays under ~12,000px on mobile.

---

## Tour Selector cards (above the fold for tour comparison)

Each card = **clickable jump-link** to its deep section. Must be visually rich (preview image is *the* sell, not the icon).

```html
<a href="#tour-honeymoon"
   onclick="event.preventDefault();smoothScroll('tour-honeymoon');trackTourCardClick('honeymoon');"
   class="tour-selector-card">
  <div class="tour-selector-img-wrap">
    <img loading="lazy" decoding="async"
         src=".../honeymoon-phuquoc-paradise.webp"
         alt="Phu Quoc tropical island for honeymoon"
         width="1920" height="743">
    <div class="tour-selector-icon" aria-hidden="true">💕</div>
  </div>
  <div class="tour-selector-body">
    <span class="tour-tag">For Couples</span>
    <h3>Vietnam Honeymoon</h3>
    <p class="tour-selector-meta">12 days · Halong cruise + Phu Quoc 3 nights</p>
    <div class="tour-selector-price"><span class="was">$2,199</span>$1,899 AUD</div>
    <span class="tour-selector-cta">See itinerary →</span>
  </div>
</a>
```

Key CSS — preview image wrapper enforces aspect ratio + lets icon float as overlay badge:

```css
.tour-selector-img-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  position: relative;
}
.tour-selector-img-wrap img {
  width: 100%;
  height: 100%;     /* CRITICAL: override the HTML height="743" attr */
  object-fit: cover;
  transition: transform 0.4s ease;
}
.tour-selector-img-wrap .tour-selector-icon {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  width: 44px;            /* WCAG touch-target — even though card is link, keeps visual rhythm */
  height: 44px;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(8px);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.75rem;
  line-height: 1;
}
.tour-selector-body { padding: 1.25rem 1.25rem 1.5rem; }
.tour-selector-card:hover .tour-selector-img-wrap img { transform: scale(1.06); }
```

**Why preview image + icon overlay (not icon-only):**
First happytours build used 4rem gold emoji icons in a tinted box — looked generic. Replacing the box with the actual destination photo (Phu Quoc beach for Honeymoon, Sapa for Family, Halong cruise deck for Luxury) reframed the card as "this is what you'd see on holiday" instead of "this is the category". Emoji icon stays as small white-circle overlay = visual shortcut for skimmers.

**Image spec:** 1920×743 WebP, sourced from Marketing shared drive. Compress aggressively (target <250KB each — they load above the fold for the visitor to scroll past quickly).

---

## Per-tour color theming (visual differentiation)

Multi-tour LPs are LONG. The visitor scrolls through 3 tour sections — if all 3 look identical the eye tunes out. Give each tour its own ambient color:

```css
.tour-honeymoon { background: linear-gradient(180deg, #FFF5F5 0%, #FFFFFF 100%); }
.tour-honeymoon h2 { color: #C2185B; }          /* rose */

.tour-family    { background: linear-gradient(180deg, #F0FBF7 0%, #FFFFFF 100%); }
.tour-family h2 { color: #047857; }             /* mint */

.tour-luxury    { background: linear-gradient(180deg, #FAF7EE 0%, #FFFFFF 100%); }
.tour-luxury h2 { color: #B8860B; }             /* emerald-gold */
```

Hero stays brand-accent orange; CTAs across all 3 tours stay brand-accent orange (`--accent-grad`). Don't tint the CTAs per tour — that breaks brand consistency and visitor would mis-read "is this still MVT?". Only the section background + heading + accordion accent get themed.

happytours uses rose / mint / emerald-gold because those map intuitively to romance / family-fresh / luxury-premium. Use intuition (not hex codes from logo) for the tour color — it's emotional shorthand, not brand identity.

---

## Smart sticky mobile bar (price + CTA sync to active tour)

The biggest UX trap of multi-tour LPs: the sticky mobile "Book Now" bar at the bottom shows a single price/label that goes stale as the visitor scrolls past different tours. Fix with IntersectionObserver — bar reflects whichever tour section is mostly in view.

```js
// ===== Mobile Sticky Book Now Bar (+ smart price-sync with current tour in view) =====
(function() {
  const bar = document.getElementById('mobileBookBar');
  const priceEl = document.getElementById('mobileBarPrice');
  const btnEl = bar ? bar.querySelector('.bar-btn') : null;
  if (!bar) return;
  const heroEl = document.querySelector('.hero');
  const bookingEl = document.getElementById('booking');

  const TOUR_PRICES = {
    'tour-honeymoon': { price: '$1,899 AUD', key: 'honeymoon', label: 'Book Honeymoon' },
    'tour-family':    { price: '$1,699 AUD', key: 'family',    label: 'Book Family Tour' },
    'tour-luxury':    { price: '$2,999 AUD', key: 'luxury',    label: 'Book Luxury Cruise' },
  };
  const DEFAULT_PRICE = '$1,699 AUD';
  const DEFAULT_LABEL = 'Book Now →';

  let activeTour = null;
  const sections = Object.keys(TOUR_PRICES)
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      let best = null;
      entries.forEach(e => {
        if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) {
          best = e;
        }
      });
      if (best) {
        const id = best.target.id;
        const cfg = TOUR_PRICES[id];
        if (cfg && activeTour !== id) {
          activeTour = id;
          if (priceEl) priceEl.textContent = cfg.price;
          if (btnEl) {
            btnEl.textContent = cfg.label + ' →';
            // CRITICAL: button must select the right tour in the booking form,
            // not just scroll. Otherwise the form arrives blank and visitor has to choose again.
            btnEl.onclick = function(ev) {
              ev.preventDefault();
              selectTourAndScroll(cfg.key);
            };
          }
        }
      }
    }, { threshold: [0.35, 0.6] });
    sections.forEach(s => io.observe(s));
  }

  // Show/hide based on scroll position (hero out + booking not yet in view)
  window.addEventListener('scroll', function() {
    if (window.innerWidth > 768) { bar.classList.remove('visible'); return; }
    const heroBottom = heroEl ? heroEl.getBoundingClientRect().bottom : 0;
    const bookingTop = bookingEl ? bookingEl.getBoundingClientRect().top : Infinity;
    const show = heroBottom < 0 && bookingTop > window.innerHeight * 0.5;
    bar.classList.toggle('visible', show);

    // Reset to default when scrolled past all 3 tour sections (e.g. into compare/why-mvt area)
    if (activeTour) {
      const stillInTour = sections.some(s => {
        const r = s.getBoundingClientRect();
        return r.top < window.innerHeight * 0.5 && r.bottom > window.innerHeight * 0.2;
      });
      if (!stillInTour) {
        activeTour = null;
        if (priceEl) priceEl.textContent = DEFAULT_PRICE;
        if (btnEl) btnEl.textContent = DEFAULT_LABEL;
      }
    }
  }, { passive: true });
})();
```

**The `selectTourAndScroll(key)` helper** must (1) set the booking form's `tour_interest` radio to the matching value, (2) smooth-scroll to `#booking`, (3) optionally focus the first form field. Without (1) the visitor lands on the form with no pre-selection and has to remember which tour they were just reading about — friction kills conversion.

Verify with Playwright on mobile viewport: scroll into `#tour-honeymoon` → bar reads `$1,899 AUD · Book Honeymoon →`. Scroll into `#tour-luxury` → bar reads `$2,999 AUD · Book Luxury Cruise →`.

---

## Compare table (side-by-side at decision moment)

After the visitor has scrolled all 3 tour sections, they need a quick comparison to commit. Don't bury this in FAQ — make it a dedicated dark-theme section right after the 3 tours.

Mobile reality: 3 columns won't fit on 375px. Use **horizontal scroll with swipe hints on BOTH ends of the table**:

```html
<p class="compare-scroll-hint compare-scroll-hint-top">← swipe table sideways to see all 3 tours →</p>
<div class="compare-table-wrap">
  <table class="compare-table">...</table>
</div>
<p class="compare-scroll-hint">← swipe to see all 3 tours →</p>
```

```css
.compare-section { background: #0F172A; color: #fff; }
.compare-section .compare-scroll-hint { color: rgba(255,255,255,0.6); }
.compare-scroll-hint, .compare-scroll-hint-top {
  display: none;
  text-align: center;
  font-style: italic;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}
.compare-scroll-hint-top { margin-bottom: 0.75rem; }   /* sits ABOVE the table */
@media (max-width: 768px) {
  .compare-scroll-hint, .compare-scroll-hint-top { display: block; }
  .compare-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
}
```

**Both hints (TOP and BOTTOM) matter.** The bottom-only hint requires the visitor to discover scroll-overflow on their own (many won't — they read column 1, conclude "this is all there is", bounce). Top hint primes the gesture before the visitor's eyes hit the columns. Validated on happytours mobile QA.

---

## Tour code as cross-system ID (sales workflow + GA4 segmentation)

Every multi-tour LP must carry the **source tour code** (e.g. `VHM10`, `V7`, `VLU10`) for each tour. The code is the sales team's primary key when matching enquiry → tour on the parent site (myvivatour.com). Without it, sales has to re-derive intent from the human-readable label.

**Where to surface the code:**

1. **Section header eyebrow** — small chip right of "For Couples · 2 People":
   ```html
   <span class="tour-section-eyebrow">For Couples · 2 People <span class="tour-code-badge">VHM10</span></span>
   ```
2. **Selector card meta** — chip after the "10 days · Halong + Phu Quoc" line
3. **Compare table headers** — under each tour name (`<br><span class="tour-code-badge">VHM10</span>`)
4. **Form radio values** — prefix label with code: `"VHM10 - Honeymoon (10 days · $1,899 AUD)"` (sales email shows clean machine-readable string)
5. **Form radio labels** — visible chip in the option so visitor sees what they'll be quoted on
6. **Hidden field `tour_code`** — auto-populated by `selectTourAndScroll()` and form change listener

**Badge CSS** (orange-tinted, monospace, tiny):
```css
.tour-code-badge {
    display: inline-block;
    margin-left: 0.5rem;
    padding: 0.18rem 0.55rem;
    background: rgba(232, 98, 42, 0.1);
    color: var(--accent-dark);
    border: 1px solid rgba(232, 98, 42, 0.25);
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    font-family: monospace, monospace;
    vertical-align: middle;
}
```

**Single source of truth: `data-tour-code` on the radio.** All other surfaces read from there, no duplication of the string in JS:

```html
<input type="radio" id="tour_honeymoon" name="tour_interest"
       value="VHM10 - Honeymoon (10 days · $1,899 AUD)"
       data-tour-code="VHM10">
<input type="hidden" id="tour_code_hidden" name="tour_code" value="">
```

```js
function selectTourAndScroll(tourKey) {
    const radio = document.getElementById('tour_' + tourKey);
    const codeField = document.getElementById('tour_code_hidden');
    let tourCode = '';
    if (radio) {
        radio.checked = true;
        tourCode = radio.getAttribute('data-tour-code') || '';
        if (codeField) codeField.value = tourCode;
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'tour_cta_click', tour_interest: tourKey, tour_code: tourCode });
    smoothScroll('booking');
}
// Sync hidden field if visitor manually changes the radio
document.addEventListener('change', function(e) {
    if (e.target && e.target.name === 'tour_interest') {
        const codeField = document.getElementById('tour_code_hidden');
        if (codeField) codeField.value = e.target.getAttribute('data-tour-code') || '';
    }
});
```

Form submission must also push `tour_code` to dataLayer alongside `tour_interest` — enables GA4 audiences like "Visitors who enquired about VHM10" for Google Ads retargeting.

---

## Visible auto-fill confirmation (banner + textarea prefill)

Pre-selecting a radio + populating a hidden field is invisible to the visitor. They click "Get My Honeymoon Quote →", land on the form, and have no idea their selection carried through — they may anxiously re-pick the tour. Add a **visible confirmation banner at the top of the form** that appears when `selectTourAndScroll()` fires:

```html
<div id="tourPrefillBanner" class="tour-prefill-banner" role="status" aria-live="polite">
  <span class="prefill-check" aria-hidden="true">✓</span>
  <span class="prefill-label">Pre-filled from your selection:</span>
  <span class="prefill-tour-name" id="prefillTourName">—</span>
  <span class="tour-code-badge" id="prefillTourCode">—</span>
  <a href="#tour-selector" class="prefill-change"
     onclick="event.preventDefault();smoothScroll('tour-selector');"
     >change tour ↑</a>
</div>
```

```css
.tour-prefill-banner {
    display: none;       /* JS toggles is-visible when populated */
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem 0.85rem;
    padding: 0.85rem 1.1rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, rgba(255,107,53,0.08), rgba(232,98,42,0.12));
    border: 1px solid rgba(232,98,42,0.35);
    border-left: 4px solid var(--accent);
    border-radius: 10px;
    animation: prefillPulse 0.6s ease-out;
}
.tour-prefill-banner.is-visible { display: flex; }
@media (prefers-reduced-motion: reduce) {
    .tour-prefill-banner { animation: none; }
}
@keyframes prefillPulse {
    0%   { transform: scale(0.98); opacity: 0; }
    60%  { transform: scale(1.01); opacity: 1; }
    100% { transform: scale(1);    opacity: 1; }
}
```

**Pair the banner with a starter sentence pre-filled into the message textarea** — visitor only has to add dates + headcount, not retype the tour name:

```js
// Single source of truth for what to populate (read from radio's data-attrs)
function syncTourPrefillUI(radio) {
    const codeField  = document.getElementById('tour_code_hidden');
    const nameField  = document.getElementById('tour_name_hidden');
    const banner     = document.getElementById('tourPrefillBanner');
    const bannerName = document.getElementById('prefillTourName');
    const bannerCode = document.getElementById('prefillTourCode');
    const messageEl  = document.getElementById('message');
    if (!radio) return { code: '', name: '' };
    const tourCode = radio.getAttribute('data-tour-code') || '';
    const tourName = radio.getAttribute('data-tour-name') || '';
    if (codeField) codeField.value = tourCode;
    if (nameField) nameField.value = tourName;
    if (banner && bannerName && bannerCode) {
        if (tourCode) {
            bannerName.textContent = tourName;
            bannerCode.textContent = tourCode;
            banner.classList.add('is-visible');
        } else {
            banner.classList.remove('is-visible');  // "Not sure" radio: no specific tour
        }
    }
    // Only pre-fill textarea if it's still empty — never overwrite visitor's text
    if (messageEl && !messageEl.value.trim() && tourCode) {
        messageEl.value = "I'm interested in the " + tourName + " (" + tourCode + ") package. ";
    }
    return { code: tourCode, name: tourName };
}
// Wire to BOTH selectTourAndScroll (CTA click) AND manual radio change — DRY
function selectTourAndScroll(tourKey) {
    const radio = document.getElementById('tour_' + tourKey);
    if (radio) radio.checked = true;
    const { code, name } = syncTourPrefillUI(radio);
    window.dataLayer.push({ event: 'tour_cta_click', tour_interest: tourKey, tour_code: code, tour_name: name });
    smoothScroll('booking');
}
document.addEventListener('change', function(e) {
    if (e.target && e.target.name === 'tour_interest') syncTourPrefillUI(e.target);
});
```

**Single source of truth = the radio's `data-` attributes.** Add `data-tour-name="..."` alongside `data-tour-code="..."` on each radio. All other surfaces (banner, hidden fields, textarea starter, dataLayer events) read from there — no duplicated maps in JS.

**Rules to follow:**
- `role="status" aria-live="polite"` on banner so screen readers announce the auto-fill
- Only pre-fill textarea when empty (`!messageEl.value.trim()`) — never clobber typed text
- Hide banner for "Not sure — help me choose" radio (no specific tour to confirm)
- Banner has "change tour ↑" link scrolling back to selector for switching
- Form submit handler must also include `tour_name` in dataLayer + hidden field sync as safety net

Verified pattern (2026-05-17, happytours.myvivatour.com). Programmatic test on each tour CTA: banner shown + textarea has starter + hidden fields populated, all 3/3 pass.

---

## "Not sure" helper panel — by-companion decision aid

The `"Not sure - help me choose"` radio is essential (captures browsers who refuse to commit), but an EMPTY "Not sure" state is a wasted opportunity. When picked it should display a **helper panel with 3 by-companion suggestions** — each pointing to one of the tours with a one-sentence "why":

```html
<div id="tourHelperPanel" class="tour-helper-panel"
     role="region" aria-label="Help me choose a tour">
  <p class="helper-intro">
    <strong>Not sure yet?</strong> Here's a quick guide based on who you're
    travelling with — tap any card to pick that tour:
  </p>
  <div class="helper-grid">
    <button type="button" class="helper-card" data-helper-tour="honeymoon">
      <span class="helper-card-emoji">💕</span>
      <strong class="helper-card-title">With your partner or spouse</strong>
      <p class="helper-card-why">Wake up on the UNESCO-listed Halong Bay cruise,
        then 3 quiet nights on Phu Quoc Island. Built for two.</p>
      <span class="helper-card-pick">Pick Honeymoon · VHM10 →</span>
    </button>
    <button type="button" class="helper-card" data-helper-tour="family">…</button>
    <button type="button" class="helper-card" data-helper-tour="luxury">…</button>
  </div>
  <p class="helper-closing">
    <strong>Still unsure?</strong> Just leave your details below — our travel
    experts will design a custom itinerary that fits your group, dates and
    budget. We'll handle the puzzle for you. 💬
  </p>
</div>
```

**Pattern rules** (validated 2026-05-17):

1. **One card per tour**, framed by **travel companion** ("with your partner", "with your family", "with friends/milestone"), NOT by tour features. Visitors who couldn't decide on features can usually decide on who they're going with.
2. **Each card has 3 parts**: emoji + title (who), one-paragraph "why this tour for that group", action label with tour code.
3. **Closing message redirects undecided visitors to leave details for sales** — "our travel experts will design a custom itinerary". Critical: don't dead-end indecisive visitors.
4. **Visibility wired through the same `syncTourPrefillUI` helper** as the prefill banner — `helperPanel.classList.toggle('is-visible', radio.id === 'tour_notsure')`. Helper hides automatically when visitor picks any specific tour (via card OR direct radio).
5. **Helper card click MUST switch the radio + trigger syncTourPrefillUI**:

   ```js
   document.addEventListener('click', function(e) {
       const card = e.target.closest('.helper-card[data-helper-tour]');
       if (!card) return;
       e.preventDefault();
       const tourKey = card.getAttribute('data-helper-tour');
       const radio = document.getElementById('tour_' + tourKey);
       if (!radio) return;
       radio.checked = true;
       const { code, name } = syncTourPrefillUI(radio);
       window.dataLayer.push({ event: 'tour_helper_card_click', tour_interest: tourKey, tour_code: code, tour_name: name });
       const banner = document.getElementById('tourPrefillBanner');
       if (banner) banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
   });
   ```

6. **Visitor stays on the form** after picking — don't scroll up to the chosen tour section. Banner scrollIntoView centres the confirmation so they see "Vietnam Honeymoon Trip — 10 Days (VHM10)" auto-fill and can keep filling the form below.
7. **Track `tour_helper_card_click` event** with `tour_code` — measures which recommendation converts undecided visitors. High click-through rate on one card = strong intent signal; flat distribution = the by-companion framing isn't matching how visitors actually think about their trip.

CSS keeps the panel visually subtle (dashed border, faint orange tint background) — it's an aid, not the primary call-to-action. The radio cards above it remain the form's headline interaction.

---

## Backlink to canonical tour page

LP visitor who needs deeper detail (full inclusions list, hotel options, cancellation policy) should be one click away from the source tour page on the parent site. Don't try to mirror every detail on the LP — that ruins the trim-aggressive principle.

Place a dashed-underline secondary link below the "See full day-by-day itinerary" button in each tour CTA row:

```html
<a class="tour-source-link"
   href="https://myvivatour.com/tour/vietnam-honeymoon-trip-10-days/"
   target="_blank" rel="noopener"
   onclick="if(window.dataLayer){dataLayer.push({event:'tour_source_click', tour_code:'VHM10'});}"
   >View full tour details on myvivatour.com →</a>
```

```css
.tour-source-link {
    display: inline-block;
    margin-top: 0.45rem;
    font-size: 0.85rem;
    color: var(--text-light);
    text-decoration: none;
    border-bottom: 1px dashed var(--text-light);
    align-self: center;
}
.tour-source-link:hover {
    color: var(--accent);
    border-bottom-color: var(--accent);
}
```

The dashed underline says "secondary action, not the primary CTA". Color stays muted (`--text-light`) so it doesn't compete with the orange "Get My Quote" button — the LP's job is to capture the enquiry, the canonical link is just an out for the cautious researcher.

`tour_source_click` event in dataLayer lets you measure how often visitors leave the LP for canonical detail — high rate = LP isn't answering their questions, add more content (or specific FAQ rows about the gap).

---

## When source tour changes — refresh everything from the new source

When the user swaps the source tour (e.g. happytours honeymoon source changed from VBR12 12-day → VHM10 10-day), **don't selectively cherry-pick** — scrape the new source fresh and replace ALL of:

1. Cover image (the hero photo for both selector card AND tour section hero — they should be the same single image, sourced from the new tour page's featured image / og:image / first content image)
2. Tour title + duration in:
   - Selector card title + meta
   - Tour section h2 + subtitle
   - Compare table duration row
   - Sticky bar label (`TOUR_PRICES[id].label`)
   - Form radio label + value (with new tour code)
3. Day-by-day itinerary cards (full rewrite from source)
4. "Where you'll go" summary line
5. Meta-row chips (flights count, hotel grade, group size)
6. Compare table content for that tour's column — including any rows that highlight unique offers (e.g. removing "Sapa mountain experience" row if no tour has Sapa anymore, OR replacing with "Cu Chi Tunnels" if the new family tour has CuChi)
7. Schema.org JSON-LD `itineraryElement` if you mirror itinerary in structured data
8. Tour code badge in eyebrow + selector + compare + form + backlink
9. Backlink `href` to new tour permalink
10. Memory file (`plans/{date-slug}/tour-data-summary-for-*.md`) updated with new scrape

Use Firecrawl with `formats: ['json']` + JSON schema prompt asking for `{tourCode, coverImageUrl, duration, price, itinerary: [{day, title, description}], inclusions, destinations}` — this returns clean structured data that maps 1:1 to LP sections. Verified pattern (2026-05-17).

Source tour pages often store the cover as `wp-content/uploads/YYYY/MM/{timestamp}.avif` — fetch the `.avif`, convert to WebP with `magick {in}.avif -quality 80 -strip {out}.webp` (typical 60–120KB at 1920×743), upload to Supabase `landing-images/{tour-folder}/` with descriptive name like `honeymoon-vhm10-cover.webp` (the tour code in filename makes orphan cleanup easy when the source swaps again).

---

## Shared booking form with `tour_interest` radio

One form, three tours. Add a radio group as the FIRST field — visitor knows immediately the form serves all 3:

```html
<fieldset class="booking-tour-pick">
  <legend>Which tour interests you?</legend>
  <label>
    <input type="radio" name="tour_interest" value="honeymoon">
    <span>💕 Vietnam Honeymoon ($1,899 AUD)</span>
  </label>
  <label>
    <input type="radio" name="tour_interest" value="family">
    <span>👨‍👩‍👧 Vietnam Family Discovery ($1,699 AUD)</span>
  </label>
  <label>
    <input type="radio" name="tour_interest" value="luxury">
    <span>✨ Luxury Vietnam Cruise ($2,999 AUD)</span>
  </label>
  <label>
    <input type="radio" name="tour_interest" value="not-sure">
    <span>🤔 Help me decide</span>
  </label>
</fieldset>
```

**`not-sure` option is mandatory.** Don't force a commit when the visitor's whole reason for landing on a multi-tour LP is "I'm browsing". Push them into the form, capture lead, sales team triages.

`selectTourAndScroll(key)` flips the matching radio. Form submit handler pushes `tour_interest` into dataLayer + Web3Forms `subject` so sales email is pre-tagged ("New Honeymoon enquiry — ...").

---

## Host-based routing (`HOST_DEFAULTS`)

Multi-tour LP usually deserves its own subdomain (e.g. `happytours.myvivatour.com`), but you don't want to run a second Cloudflare Worker. Use the existing worker with a host-based default-path lookup in `build.js`:

```js
// build.js — worker fetch handler template
const HOST_DEFAULTS = {
  'happytours.myvivatour.com': '/happytours',
  // Add new hosts here as more subdomains are added
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let pathname = url.pathname.replace(/\/+$/, '') || '/';

    // If root path on a host-specific subdomain, rewrite to the subdomain's default page
    if (pathname === '/' && HOST_DEFAULTS[url.hostname]) {
      pathname = HOST_DEFAULTS[url.hostname];
    }
    // ...rest of routing unchanged
  },
};
```

Then in the Cloudflare dashboard, add the bare hostname (NOT a wildcard) as a Custom Domain on the same worker. CF rejects `*` patterns in the Custom Domains UI — use exactly `happytours.myvivatour.com`.

The reverse-route (`/happytours` path still works on the main domain) stays free for testing without DNS — useful for `escape.myvivatour.com/happytours` in QA links.

---

## scroll-margin-top fix (sticky nav covering anchor targets)

The selector cards jump to `#tour-honeymoon` etc. With a fixed `position: fixed` nav, the section heading lands UNDER the nav and the visitor sees mid-content instead of the section start. One line fixes it:

```css
section[id] { scroll-margin-top: 80px; }
```

`80px` ≈ nav height + a touch of breathing room. Adjust to match the actual sticky nav height. Applies to native `<a href="#x">` AND `element.scrollIntoView()` AND `smoothScroll()` helpers.

---

## Image quality gotcha — `height: auto` override

Hero images stored as 1920×743 carry `height="743"` HTML attribute (for CLS prevention). When you put them in a card that sizes them via CSS `aspect-ratio + width: 100%`, the HTML `height` attribute wins by default → image renders at full 743px tall (portrait crop, blown out of card).

```css
.tour-selector-img-wrap img {
  width: 100%;
  height: 100%;        /* MUST be explicit — otherwise HTML height="743" wins */
  object-fit: cover;
}
.tour-hero-img {
  width: 100%;
  height: auto;        /* Same fix for per-tour hero images inside .tour-section */
  aspect-ratio: 1920 / 743;
}
```

Burned 30 minutes on happytours debugging "why is my image rendering as a tall vertical crop" — answer was always the unset CSS height letting the HTML attr through.

---

## Mobile bloat patterns to fix (validated 2026-05-17)

After deploying happytours, mobile scroll was 19,433px (60% over 12k target). Five patterns drove it. Apply these PROACTIVELY on every multi-tour LP build — don't wait for the audit:

### 1. Why MyVivaTour cards stack single-column on mobile

`.why-mvt-grid { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) }` collapses to 1 col on 375px viewport. 6 cards × ~600px = 4,000px section. Force 2-col with denser cards:

```css
@media (max-width: 768px) {
  .why-mvt-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.6rem;
  }
  .why-mvt-card { padding: 1rem 0.6rem; }
  .why-mvt-card h3 { font-size: 0.92rem; margin-bottom: 0.4rem; }
  .why-mvt-card p  { font-size: 0.8rem; line-height: 1.4; }
  .why-mvt-icon    { width: 48px; height: 48px; font-size: 1.5rem; margin-bottom: 0.6rem; }
}
```

Same fix for `.highlights-grid` (the "Why Choose This Tour?" feature cards before booking). Saves ~3,000px combined.

### 2. Testimonials / TripAdvisor reviews stack vertically on mobile

6 review cards × ~580px tall = ~3,500px. Switch to **horizontal scroll-snap carousel** — visitor swipes through cards:

```css
@media (max-width: 768px) {
  .testimonials-grid,
  .ta-reviews-grid {
    display: flex;
    grid-template-columns: none;
    gap: 0.85rem;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 1rem;
    scrollbar-width: thin;
  }
  .testimonials-grid > *,
  .ta-reviews-grid > * {
    flex: 0 0 85%;            /* 85% width + 15% peek = clear "more cards" affordance */
    scroll-snap-align: start;
    min-width: 0;
  }
}
```

Featured (Aussie) card stays at index 0 so it's the first thing visible — swipe reveals the rest. Saves ~3,000px. No JS needed.

### 3. Hero price-badge wrapping 2 lines on mobile

`Packages from $1,699 AUD · All-Inclusive` wraps after "AUD" on 375px. Two fixes — pick one:

- **Shorten copy**: `From $1,699 AUD →` (single line, lets `→` invite scroll-to-selector)
- **Or smaller font + nowrap**: `font-size: 0.95rem; padding: 0.65rem 1.2rem; white-space: nowrap`

If using nowrap, do NOT add `max-width + text-overflow: ellipsis` — that'll silently cut off the price on narrow viewports. Choose copy that always fits at the chosen font size.

Bonus: make the pill an `<a>` linking to `#tour-selector` (or `#booking`). It already looks tappable.

### 4. Hide secondary floating buttons on mobile

Multi-tour LP has the smart sticky bar at the bottom — the floating back-to-top button + WhatsApp + chat widgets stack vertically on the right and compete for the right-thumb zone. Hide back-to-top on mobile:

```css
@media (max-width: 768px) {
  .back-to-top { display: none !important; }
}
```

Keep WhatsApp (single floating element is fine). Sticky bar already provides clear next-step navigation.

### 5. Per-tour CTA labels too long

Buttons like `Get My Vietnam Honeymoon Beach Escape Quote →` wrap to 2 lines on mobile and look cluttered. Shorten to one verb + tour name + arrow: `Get My Honeymoon Quote →`. The tour identity is already established by the section header above the button — no need to repeat full tour name.

---

## Trim aggressively for multi-tour LPs

Multi-tour LPs are inherently longer than single-tour. Cut sections that **repeat info already covered**:

| Section | Keep on single-tour LP? | Keep on multi-tour LP? |
|---|---|---|
| Hero | Yes | Yes |
| Tour Selector | N/A | **Yes — define feature** |
| Per-tour Itinerary | Yes (accordion, full) | Yes (compact 3-5 day list, no accordion) |
| Per-tour Highlights/Inclusions | Yes (dedicated section) | **No — collapse to pill row inside tour section** |
| Per-tour Pricing block | Yes | **No — covered by selector + compare** |
| Gallery | Yes | **No — tour heroes already showcase visuals** |
| Compare table | N/A | **Yes — decision aid** |
| Why MyVivaTour | Yes | Yes (shared) |
| Testimonials | Yes | Yes (shared) |
| FAQ | Yes | Yes (shared, add multi-tour FAQs: "can I mix tours?") |
| Highlights ("Why Choose This Tour?") | Yes | Yes (shared, one block — applies to all 3) |
| Booking form | Yes | Yes (one form, `tour_interest` radio) |

A surgical trim script template (worked for happytours):

```python
# trim-gallery-and-highlights-from-{tour}.py
from pathlib import Path

FILE = Path("pages/{tour}/index.html")
lines = FILE.read_text().split('\n')

def find_section_bounds(lines, opening_substring):
    start = next((i for i, l in enumerate(lines) if opening_substring in l), None)
    if start is None: return None, None
    depth = 1; i = start + 1
    while i < len(lines) and depth > 0:
        if '<section' in lines[i]: depth += 1
        if '</section>' in lines[i]: depth -= 1
        i += 1
    if start > 0 and lines[start - 1].strip().startswith('<!--'):
        start -= 1
    return start, i

# Delete from LATER to EARLIER to preserve indices
sections_to_trim = ['id="highlights"', '<section class="gallery section" id="gallery">']
bounds = [find_section_bounds(lines, s) for s in sections_to_trim]
bounds = sorted([b for b in bounds if b[0] is not None], key=lambda b: -b[0])
for start, end in bounds:
    del lines[start:end]

FILE.write_text('\n'.join(lines))
```

---

## QA checklist (verify before deploy)

- [ ] Click each selector card → smooth-scrolls to its tour section + nav doesn't cover the heading
- [ ] Scroll into each tour section on mobile → sticky bar shows correct price + label
- [ ] Sticky bar button → opens booking form WITH matching `tour_interest` radio pre-selected
- [ ] Compare table → both top + bottom swipe hints visible on mobile; table horizontally scrolls
- [ ] Each tour section's hero image renders panoramic (not portrait-cropped) on mobile
- [ ] Form submit fires `form_submit` with `tour_interest` param in dataLayer
- [ ] Total page height < 12,000px on mobile (check with Playwright `getBoundingClientRect().height`)
- [ ] All 3 tour heroes load — Supabase URLs return 200, not 403/404
- [ ] HOST_DEFAULTS entry added to `build.js` BEFORE `wrangler deploy`; CF Custom Domain bound to worker
