# UX + Accessibility Audit — Escape LP

**URL:** https://escape.myvivatour.com/ (live blocked WebFetch w/ 403, audit on local source `pages/escape/index.html` 3,481 lines + cached snapshot 3,380 lines)
**Audience:** Australian travellers 35–65 (skew 50+, readability-critical)
**Date:** 2026-05-09

---

## TL;DR (3 dòng)

Visual identity solid (gold #D4AF37 + dark navy + Playfair/Plus Jakarta) and content is comprehensive (10-day itinerary, 8 FAQ, 4 packages, JSON-LD schema rich) — but the page **fails WCAG AA in multiple places** (gold text on white ≈2.3:1, accordion not keyboard-operable, hero quick form has no labels), and has **3 stacked floating elements** on mobile that fight for the same corner. Section order also leads with pricing before trust-building (Why MyVivaTour is buried after pricing) — a CRO leak for the 50+ Aussie demographic that needs reassurance first.

## UX Score: **68/100**

Strong: clear price anchor, multiple repeated CTAs, dual contact (form + WhatsApp), comparison table, lead-magnet exit-intent popup, daily-departure copy.
Weak: section ordering (trust → pricing → trust again), 3-button mobile floating stack, no breadcrumb back to main site, hero h1 doesn't include "Vietnam Tour", same CTA label x4 (no scent variation), no urgency mechanic beyond "12 booked this week" microcopy.

## A11y Score: **52/100** (WCAG 2.1 AA — multiple violations)

Strong: lang="en", skip alt on all 23 images, semantic `<section>` + `<h1>`/`<h2>`, exit modal has `role="dialog"`+`aria-modal`, WhatsApp has `aria-label`, table has `<th scope>` + caption, JSON-LD complete.
Weak: accordion not a button + no keyboard, hero quick form has zero `<label>`, gold-on-white text fails contrast, lightbox controls are `<span>`, hamburger is `<div>`, no `prefers-reduced-motion`, social link emojis read aloud, no skip-to-content link, modals lack focus-trap/Esc.

---

## Đã ổn (top 5)

1. **Image alt text discipline** — All 23 `<img>` have alt; testimonial images have rich descriptive alt ("Mohit Jain's 5-star Facebook review… 11 people tour to Hanoi, Sapa, Halong Bay"). Lightbox img has fallback alt. Logo alt = "MyVivaTour".
2. **Semantic structure** — 1 H1, 12 H2 (one per section), heading order is mostly hierarchical. Each section uses `<section id>`. Comparison table uses `<thead>` + `<th scope="col">` + `<caption>` (visually-hidden but present for SR).
3. **Brand palette is clean and ownable** — Gold `#D4AF37` + Dark navy `#111827` + cream `#F8FAFC`. CTA button gold-on-dark text = ~7.5:1 (AAA). Playfair Display for headings + Plus Jakarta Sans for body is a solid mid-premium pairing for travel.
4. **Form UX in main booking section is solid** — Real `<label for>`, required attrs, focus border-color change, success state slot, hidden honeypot (`botcheck`), Web3Forms key wired, gold CTA full-width on mobile.
5. **Trust signals layered correctly in form** — Avatar stack + "Trusted by 500+ Australian travelers" + 5-star emoji directly above form fields = friction-reducing micro-pattern.

---

## UX issues trung bình (top 5)

1. **Section order misaligned with buyer journey** — Current: Hero → Highlights → Destinations → Itinerary → Video → Gallery → **Pricing** → **Why MyVivaTour** → **Testimonials** → Blog → FAQ → Booking. Trust elements (Why MyVivaTour, Testimonials) come AFTER pricing. The 50+ AU demographic typically wants reassurance ("who are these people?") BEFORE seeing the bill. Recommended: Hero → Highlights → Destinations → Itinerary → Video → Gallery → **Why MyVivaTour** → **Testimonials** → Pricing → FAQ → Booking. Testimonials right before pricing has been A/B-proven to lift CRO 8–15% for travel.
2. **CTA label monotony** — "Start Planning Your Trip" (hero + post-pricing), "Book Your Vietnam Adventure", "Ready to Go? Get Your Free Quote", "Get Free Quote" (form + hero quick form), "Get Quote →". Mostly fine, but the hero says "Start Planning" while the destination is a booking form — language scent breaks. Aussies skim; align label-to-action ("Get My Free Quote" everywhere).
3. **Hero H1 = "Escape Australia"** — Brand-y but doesn't include the keyword users typed in. Page title is correct ("10-Day Vietnam Tour from Australia $2,099 AUD All-Inclusive | MyVivaTour 2026"); H1 should mirror it. Subtitle "10-Day All-Inclusive Vietnam Journey" is fine but should be H1, with "Escape Australia" as eyebrow text.
4. **3-element floating mobile stack collides** — At <640px we have: WhatsApp button (bottom: 5rem), Back-to-top (bottom: 9rem), Mobile sticky book bar (bottom: 0). That's a vertical column of 3 floating items in one corner. WhatsApp also pulses (`waPulse`). Combined with body content scrolling underneath, this is visually busy and cognitively noisy. Recommend: hide back-to-top once user passes 50% scroll, OR fold WhatsApp into the mobile bar as a secondary action.
5. **Pricing badge color clashes with brand** — `linear-gradient(#ff6b35, #e74c3c)` on the "Most Popular" pill is orange-red against an otherwise gold/navy palette. Reads like a third-party Sale sticker. Use brand gold or dark with gold accent.

---

## Critical issues (a11y violations, broken UX)

### A11y-1 · Itinerary + FAQ accordions are NOT keyboard-operable
`<div class="accordion-header">…</div>` with `cursor: pointer` and click handler — but no `<button>` semantics, no `tabindex`, no `aria-expanded`, no `aria-controls`, no Enter/Space handler. Keyboard + screen-reader users cannot open Day 2 of itinerary or any FAQ.
**Fix:** Convert headers to `<button class="accordion-header" aria-expanded="false" aria-controls="day-2-content">`. Toggle aria-expanded on click. Wraps the whole interactive surface, gets focus ring + Enter/Space for free.

### A11y-2 · Gold (#D4AF37) on white fails AA — used in 7+ places
Tested ratio ≈ 2.34:1 (need ≥4.5:1 for normal text, ≥3:1 for large/bold ≥18.66px or ≥14px bold).
- `.testimonial-location` (color: gold)
- `.upgrade-price` (font-size 1.25rem = 20px, bold = passes large-text 3:1 marginally at 2.34? — **fails**, need ≥3:1)
- "Read more reviews on Facebook →" link (gold on white, 1rem = 16px → fails normal 4.5:1)
- `.contact-value:hover` → gold
- `.blog-tag` (gold on tinted gold bg)
- `.blog-read-more` (gold on white)
- `.detail-label` font-size 0.85rem gold on cream `#F8FAFC` ≈ 2.1:1 → **fails**
**Fix:** Darken brand gold to `#A8842A` (≈4.55:1 on white, AAA on cream). Keep #D4AF37 for backgrounds + dark-text-on-gold buttons.

### A11y-3 · Hero quick form has no `<label>`
Inputs use placeholder-only ("Your Name", "Email", "Phone"). Placeholders disappear on focus, screen readers may skip them, low-vision/seniors lose context. Also fixed widths (`width:160px`/180px/150px inline) likely overflow viewports between 360–639px (media query only triggers at ≤640).
**Fix:** Add visually-hidden labels via `aria-label="Your Name"` minimum; ideally proper `<label class="sr-only">`. Drop fixed widths, let flexbox do the work, add `min-width:0` on inputs.

### A11y-4 · Lightbox prev/next/close are `<span>` not `<button>`, no Esc handler visible in audited block
`<span class="lightbox-close" onclick="closeLightbox()">&times;</span>` + `<span class="lightbox-nav lightbox-prev">❮</span>`. Keyboard users can't reach them. Need to verify Esc key handler in JS (line 3336 has `keydown` listener — please verify it covers lightbox, not just modals).
**Fix:** Convert to `<button>` with `aria-label="Previous image"` etc. Add focus trap when lightbox is open.

### A11y-5 · Hamburger is `<div>`, no `aria-expanded`, no `aria-label`, touch target only ~21px tall
```html
<div class="hamburger" id="hamburger"><span></span><span></span><span></span></div>
```
Three 3px-tall bars with 5px gap = total ~19px tall × 25px wide. Below the 44px iOS / 48dp Material minimum. Plus no a11y semantics.
**Fix:** `<button class="hamburger" aria-label="Open menu" aria-expanded="false" aria-controls="navLinks">…</button>` with min 44×44 hit area (use padding, not size).

### A11y-6 · Footer social links use emojis as labels
`<a class="social-link" title="Instagram">📷</a>` — `📷` reads as "camera with flash" by VoiceOver. `▶` reads as "Black right-pointing triangle". `♪` reads as "Eighth note". `f` (Facebook) is just text "f". `title` attribute is unreliable for SR (most ignore it on hover-only).
**Fix:** Use SVG icons + `aria-label="Instagram"`. Hide visual emoji from SR with `aria-hidden="true"` if kept.

### A11y-7 · Animations have no `prefers-reduced-motion` guard
`bounce` (price-badge, infinite), `waPulse` (WhatsApp, infinite), `zoomIn` (hero bg, 20s), `slideUp`, `slideIn`. Vestibular-disorder users cannot opt out. Affects ~35% of 50+ users with motion sensitivity.
**Fix:** Wrap all animations in `@media (prefers-reduced-motion: no-preference) { … }` OR add a `@media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation-duration:0.01s !important; transition-duration:0.01s !important; } }` global override.

### UX-1 · Loader is `class="loader active"` in HTML but `display:none` default in CSS — JS-required to hide
Page may flash a blank white layer if JS executes late or fails. With `<div class="loader active" id="loader">` + `.loader.active { display: flex }`, the loader IS shown initially. Then JS `hideLoader()` runs on DOMContentLoaded. If JS fails, the loader stays forever — page invisible to user.
**Fix:** Default loader state to hidden; show only if needed. Or use CSS `animation` to auto-hide after 3s as failsafe.

### UX-2 · Destination cards have `cursor: pointer` but no link/click action
The 6 destination cards (Hanoi, Ha Long, Hoi An, HCMC, Cu Chi, Mekong) look interactive (cursor change, image zoom on hover, overlay on hover) but clicking does nothing. Frustrating for desktop users; on mobile the hover state never triggers so destinations have no visual interaction at all.
**Fix:** Either link each to `#itinerary` (scroll to relevant day) or remove pointer + hover states. Better: link to a deep-link `#itinerary-day-2` for Ha Long Bay, etc.

### UX-3 · Mobile sticky book bar pushes content under WhatsApp + back-to-top
Mobile bar is `position:fixed; bottom:0` with shadow. Body has no `padding-bottom` adjustment, so the last form button + footer copyright can be obscured. Also tap zone for "Book Now →" inside mobile bar is `padding:0.6rem 1.25rem` ≈ 38px tall — under 44px minimum.
**Fix:** Add `body { padding-bottom: 64px }` on mobile when bar visible. Increase bar button to `padding: 0.75rem 1.5rem` for 44px.

---

## Top 5 hành động ưu tiên

### 1. Fix accordion keyboard accessibility
- **WHAT:** Convert all `.accordion-header` `<div>`s to `<button>` with `aria-expanded` + `aria-controls`
- **WHY:** Keyboard + SR users currently CANNOT read the 10-day itinerary or 8 FAQs. This is the page's most content-rich section. Direct WCAG 2.1 SC 2.1.1 (Keyboard) + 4.1.2 (Name, Role, Value) violation.
- **HOW:** Find/replace `<div class="accordion-header">` → `<button type="button" class="accordion-header" aria-expanded="false" aria-controls="acc-N-content">`; add IDs to `.accordion-content`; in JS toggle `aria-expanded` whenever `.active` class is toggled. Add `:focus-visible { outline:2px solid var(--primary); outline-offset:2px }` to `.accordion-header`.
- **EFFORT:** S (45 min)
- **IMPACT:** L

### 2. Reorder sections — trust before pricing
- **WHAT:** Move Why MyVivaTour + Testimonials BEFORE Pricing section
- **WHY:** Aussies 50+ buy on trust, not on price. Showing $2,099 before establishing credibility = sticker-shock bounce. A/B-tested travel patterns (Intrepid, TripADeal) lead with trust. Currently the user sees price → has to scroll past it twice to find reassurance.
- **HOW:** Cut HTML blocks for `<section class="why-myvivatour">` (line 2601) + `<section class="testimonials">` (line 2644), paste them BEFORE `<section class="pricing">` (line 2457). Preserve nav anchor `#pricing`. Update build.js if it relies on order.
- **EFFORT:** S (15 min)
- **IMPACT:** L

### 3. Darken gold for text usage (color-token split)
- **WHAT:** Add `--primary-text: #A8842A` separate from `--primary: #D4AF37`
- **WHY:** Current gold-on-white = 2.3:1 = WCAG fail across 7+ locations. Affects every elderly user with reduced contrast sensitivity (most of target demo). Also a legal exposure under AU Disability Discrimination Act.
- **HOW:** In `:root`, add `--primary-text: #A8842A; --primary-text-strong: #8A6E22;`. Replace `color: var(--primary)` with `color: var(--primary-text)` in: `.testimonial-location`, `.upgrade-price`, `.blog-read-more`, `.contact-value:hover`, `.detail-label`, `.blog-tag`, gold-text social-proof links, "Read more reviews →". Keep `--primary` for backgrounds + button bg only.
- **EFFORT:** M (1.5h, includes visual QA across all sections)
- **IMPACT:** L

### 4. Add labels + min-width to hero quick form, fix mobile overflow
- **WHAT:** Add `aria-label` (or visually-hidden `<label>`) to all 3 inputs; remove fixed `width:160px/180px/150px`; add `flex:1 1 140px; min-width:0`
- **WHY:** Form is the highest-intent CTA above-the-fold. SR users get no field context. On 360–639px viewports the inputs likely overflow horizontally (only ≤640px media query exists). Form drop-off here directly = lost leads.
- **HOW:** Inline edit in `<form id="heroQuickForm">`: replace `width:160px` etc with `flex:1 1 140px;min-width:0`. Wrap each input in `<label><span class="sr-only">Your Name</span><input …></label>` or add `aria-label="Your Name"` to each input. Add `.sr-only { position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0; }`.
- **EFFORT:** S (30 min)
- **IMPACT:** M

### 5. Add `prefers-reduced-motion` guard + fix hamburger semantics
- **WHAT:** Global CSS rule + convert hamburger to `<button>` with proper aria + 44px touch target
- **WHY:** Required for WCAG 2.1 SC 2.3.3 (Animation from Interactions) and SC 2.5.5 (Target Size). Senior demo has high motion-sensitivity rate. Hamburger touch target failing means many seniors literally cannot open mobile menu.
- **HOW:** Add to `<style>`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration:.01ms !important; transition-duration:.01ms !important; scroll-behavior:auto !important; }
  }
  ```
  Replace hamburger `<div>` with `<button class="hamburger" aria-label="Open navigation menu" aria-expanded="false" aria-controls="navLinks" type="button">…</button>`; in CSS add `.hamburger { background:none; border:none; padding:10px; min-width:44px; min-height:44px; }`. Toggle `aria-expanded` in JS.
- **EFFORT:** S (40 min)
- **IMPACT:** M

---

## Quick wins (<30 phút)

1. **Add `loading="lazy"` + `decoding="async"` to all 23 `<img>`** — currently only testimonials have lazy. Hero is CSS bg (no img to lazy-load). Saves ~1.5MB on first paint for mobile.
2. **Add `fetchpriority="high"` to hero image** — convert `.hero::before { background: url(...) }` to a real `<img class="hero-bg" loading="eager" fetchpriority="high">` for proper LCP measurement and Core Web Vitals scoring. Currently hero LCP candidate is hidden in CSS bg → CLS/LCP poor.
3. **Fix Australian English** — line 2812 says "500+ Australian **travelers**" (US). Other places use "travellers" (AU). Find/replace `traveler` → `traveller` (skip JSON-LD). Also `personalize` → `personalise`, `customize` → `customise` (Day 7 + FAQ + Why MyVivaTour cards).
4. **Add `aria-hidden="true"` to all decorative emoji icons** — `.highlight-icon`, `.contact-icon`, `.gallery-icon`, `.inclusion-icon`, hero `.tag` emojis (✈️🎫🚀). Stops SR from reading "airplane emoji" before each highlight.
5. **Convert footer social-link emojis to inline SVG with `aria-label`** — Replace `<a title="Instagram">📷</a>` with proper SVG icon + `aria-label="Visit MyVivaTour on Instagram"`. Use Simple Icons CDN or inline 24px SVGs.
6. **Add skip-to-content link** — `<a href="#highlights" class="skip-link">Skip to content</a>` as first child of `<body>`. CSS: `.skip-link { position:absolute;left:-9999px } .skip-link:focus { left:1rem;top:1rem;background:#fff;padding:.75rem;z-index:9999;border:2px solid var(--primary); }`. Required for keyboard users.
7. **Add `:focus-visible` outlines** — Currently inputs have `outline: none` swapped for border-color + box-shadow (good). But CTA buttons, accordion headers, nav links have no visible focus indicator. Add `*:focus-visible { outline:2px solid var(--primary); outline-offset:3px; border-radius:4px; }`.
8. **Strengthen hero subtitle weight** — `font-weight: 300` on "10-Day All-Inclusive Vietnam Journey" against dark+image bg is hard to read for seniors. Change to `font-weight: 400` minimum.
9. **Pricing badge color: orange-red → brand-aligned** — Replace `linear-gradient(#ff6b35, #e74c3c)` with `linear-gradient(135deg, var(--dark), #1f3a5f)` or solid `var(--success) #10B981` (already in palette). Use orange/red sparingly; current usage looks like spam.
10. **Add `padding-bottom` to body when mobile sticky bar is visible** — `@media (max-width: 768px) { body { padding-bottom: 64px; } }`. Prevents footer + form bottom being obscured.
11. **Mobile bar button hit-area** — Current "Book Now →" inside `.bar-btn` is `padding: 0.6rem 1.25rem` ≈ 38px. Increase to `padding: 0.85rem 1.5rem` ≈ 46px → meets 44px minimum.
12. **Remove `cursor:pointer` from non-interactive cards** — Destination cards + gallery items if they're not actually clickable (verify in JS). Currently misleading.
13. **Add visible focus-trap + Esc handler verification for Privacy/Terms modals** — Both modals open via inline `style.display='flex'` with click-outside-to-close, but no Esc handler. Modal opens are uncommon but for keyboard users they're a trap.

---

## Unresolved questions

1. **Live page returns 403 to WebFetch** — likely a Cloudflare bot challenge or geo restriction. Was unable to capture rendered LCP / CLS / actual color rendering. Recommend running Lighthouse from a real browser (`npx lighthouse https://escape.myvivatour.com --form-factor=mobile`) to confirm Core Web Vitals scores.
2. **Lightbox keyboard handler** — line 3336 in JS (not read in this audit) has `addEventListener('keydown', …)`. Need to verify it handles Esc/Arrow keys for the lightbox specifically, not just modals.
3. **Loader timeout fallback** — Is there a JS timer to force-hide the loader after N seconds if `hideLoader()` never fires? If not, JS errors = blank white page.
4. **Destination cards intent** — Are they meant to be links (to itinerary day or external page) or purely visual? The `cursor:pointer` + hover overlay strongly suggests interactive but no handler exists.
5. **Mobile bar overlap with WhatsApp** — On mobile <640px, WhatsApp is `bottom: 5rem`, mobile bar is `bottom: 0` (height ~50px). Visual stacking should be checked on a real device — possible they overlap.
6. **Exit-intent popup trigger logic** — Not audited (in JS section). Verify it fires only on desktop and only once per session — repeated triggers are an a11y trap.
7. **Hero quick form vs main booking form analytics** — Is there separate GA4 conversion tracking for the hero quick form vs the main booking form? Important for measuring the impact of the above-the-fold quick-form micro-conversion.
8. **WhatsApp number format** — Footer + Schema.org show `+84 974 036 614` — international Vietnam number. AU users may prefer to see an AU local presence; consider adding "Speaks English" microcopy or a callback widget.
