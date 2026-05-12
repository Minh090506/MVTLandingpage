# Scroll Animations & Premium Polish Patterns

> **When to read this:** Adding scroll-reveal, count-up, parallax, or any motion polish to a landing page. These patterns shipped to escape.myvivatour.com on 2026-05-11.

## Performance Budget (non-negotiable)

| Constraint | Target | Verification |
|---|---|---|
| Lighthouse Performance (mobile) | ≥ 90 | `npx lighthouse <url> --preset=mobile` |
| CLS (Cumulative Layout Shift) | ≤ 0.05 | Lighthouse mobile trace |
| Added JS across ALL effects | ≤ 5 KB minified | Bundle size diff |
| Animation properties | ONLY `opacity` + `transform` | Code review |
| Scroll listener strategy | rAF coalescing + passive OR IntersectionObserver | No raw scroll handlers |
| `prefers-reduced-motion: reduce` | Disables EVERY added effect | Test on macOS Accessibility |

## Audience Tuning

MVT target: **AU 35-65, $2,099+ AUD tours.** Older travellers are motion-sensitive. Therefore:

- **Subtle only** — fade-in 20px, never bounce/rotate/scale-from-zero
- **No mouse-follow, no scroll-jacking, no full-page parallax**
- **Parallax intensity capped** — max 60px translate, only on hero
- **Mobile <768px: parallax disabled** (touch perf + motion sickness)
- **Stagger delay 80ms max** per child — fast scrollers shouldn't wait

## The Five Effects (proven recipe)

### Effect 1: Section Header Fade-In + Slide Up

**Where:** every `.section h2` and its sibling `.section-subtitle` paragraph.

```css
.section-reveal {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s cubic-bezier(0.22,0.61,0.36,1),
                transform 0.6s cubic-bezier(0.22,0.61,0.36,1);
}
.section-reveal.visible { opacity: 1; transform: translateY(0); }
```

```html
<h2 class="text-center section-reveal">Why Choose This Tour?</h2>
<p class="text-center opacity-75 mb-5 section-reveal">Everything you need...</p>
```

### Effect 2: Card Grid Stagger Reveal

**Where:** `.highlights-grid`, `.destination-grid`, `.gallery-grid`, `.testimonials-grid`. Each child card delays 80ms × index.

```html
<div class="highlights-grid" data-stagger-group>
  <div class="highlight-card">...</div>   <!-- delay 0ms -->
  <div class="highlight-card">...</div>   <!-- delay 80ms -->
  <div class="highlight-card">...</div>   <!-- delay 160ms -->
</div>
```

The IO function reads `parent.hasAttribute('data-stagger-group')` and calculates `delay = childIndex * 80`.

### Effect 3: Stat Count-Up (TripAdvisor badge, hero rating)

**Where:** any number that's social proof (`5.0` rating, `230` reviews, `#47` rank).

```html
<strong><span class="count-up" data-target="5.0" data-decimals="1">5.0</span></strong>
· <span class="count-up" data-target="230" data-decimals="0">230</span> Reviews
```

```css
.count-up {
    font-variant-numeric: tabular-nums;  /* PIN width → CLS=0 */
    display: inline-block;
}
```

- Duration: **1.2s** (faster = more confident, tested vs 1.5s)
- Easing: **easeOutCubic** `1 - Math.pow(1 - t, 3)`
- Trigger: IO threshold 0.3, one-shot via `obs.unobserve`
- Use `requestAnimationFrame` (never `setInterval`)

### Effect 4: Hero Background Subtle Parallax

**Where:** the `<img class="hero-bg-img">` element. Wrap in a layer to preserve existing `zoomIn` keyframe:

```html
<section class="hero">
    <div class="hero-parallax-layer">
        <img class="hero-bg-img" ...>
    </div>
    ...
</section>
```

```css
.hero-parallax-layer {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    will-change: transform;
}
@media (max-width: 767px) {
    .hero-parallax-layer { will-change: auto; }  /* drop will-change on mobile */
}
```

- Translate at **0.3x scroll**, max **60px** (cinematic, not nausea-inducing)
- Desktop-only: `if (window.innerWidth < 768) return;` early exit
- rAF coalescing with `pending` flag — coalesces 60fps from scroll spam
- Passive listener: `{ passive: true }` for touch perf

### Effect 5: Active Nav-Link Indicator

**Where:** existing `<nav id="navbar">`. **Do NOT add a separate sticky-subnav** — the existing nav is already `position: fixed`. DRY win.

```css
.nav-links a.is-active::after { width: 100%; }
.nav-links a.is-active { color: var(--primary-text); }
```

IO observes each section that has a nav-link `href` pointing to it. When section enters the 40-55% viewport band (`rootMargin: '-40% 0px -55% 0px'`), set `.is-active` on the link; remove from siblings.

## Reusable JS Block (drop-in)

Append to existing init alongside `setupAccordions()`, `setupGallery()`:

```js
setupCountUp();
setupHeroParallax();
setupActiveNavLink();
```

The full implementation lives in `pages/escape/index.html` (~line 4000+). When porting to a new LP, copy these 4 functions verbatim:
- `setupIntersectionObserver` (extended version with stagger)
- `setupCountUp` + `animateCount` + helper `format`
- `setupHeroParallax`
- `setupActiveNavLink`

## prefers-reduced-motion Master Override

Must wrap EVERY animated element class in one media query block:

```css
@media (prefers-reduced-motion: reduce) {
    .section-reveal,
    .highlight-card, .destination-card, .upgrade-card,
    .testimonial-card, .gallery-item, .blog-card {
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
    }
    .hero-parallax-layer { transform: none !important; }
}
```

JS-side guard at top of every setup function:

```js
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Reveal everything instantly, skip the IO/rAF machinery
    return;
}
```

## One-Shot vs Re-Trigger

**Always one-shot.** Call `observer.unobserve(entry.target)` immediately after firing. Reasons:
- Quick scroll-up shouldn't re-fade things in (looks janky)
- Once revealed, animation work is done — no need to keep observing
- Lower memory + less GC pressure on long pages

## CRO Section Order (Trust-Before-Price)

When building a new LP, place sections in THIS order. Tested on escape page, validated by audit:

```
1. Hero (price + CTA)
2. Highlights (Why Choose This Tour — features)
3. Destinations (cards)
4. Itinerary (day-by-day)
5. Video (visual engagement)
6. Gallery (visual proof)
7. Why MyVivaTour (trust signals about the COMPANY)
8. Testimonials (TripAdvisor + reviews)
9. Pricing (REVEAL HERE, after trust)
10. FAQ
11. Booking form
```

**Anti-pattern:** Pricing before Trust → sticker shock kills 50+ demo conversion.

## Build Pipeline Reminder

After ANY change to `pages/<tour>/index.html`:

```bash
node build.js          # regenerates worker.js
git add pages/<tour>/index.html worker.js
git commit -m "..."
git push origin main   # GitHub Actions auto-deploys via wrangler
```

Verify deploy:
```bash
gh run list --limit 1 --workflow=deploy.yml --json conclusion -q '.[0].conclusion'
# wait for: "success"
curl -s "https://escape.myvivatour.com/?cb=$(date +%s)" | grep -c 'section-reveal\|count-up'
# should be > 0
```

## QA Matrix (run before declaring done)

| Device | Browser | Check |
|---|---|---|
| MacBook 1280×800 | Chrome | All 5 effects active, smooth 60fps |
| MacBook | Safari | backdrop-filter renders, no console errors |
| iPhone (390×844) | Safari | NO parallax (mobile-disabled), bottom bar works |
| iPad (768×1024) | Safari | Parallax active (≥768px threshold) |
| macOS Reduce Motion ON | Chrome | All effects disabled, content visible |
| Chrome DevTools 4x CPU + 4G | — | Scroll FPS ≥ 50, no long tasks > 50ms |

## Known Trade-offs

| Effect | Risk | Mitigation |
|---|---|---|
| Count-up | `5.0` briefly shows `0.0` on slow scroll | Acceptable — ≤200ms; alternative `visibility:hidden` hurts UX more |
| Stagger | Long grids on fast scroll show all cards at once | IO unobserve handles it naturally — fast scroll past = card already in viewport when IO catches up = no stagger needed |
| Parallax | Stacking context with hero text | Wrap in `.hero-parallax-layer` (translates) — text stays in `.hero-content` (z-index 1+) |
| Active nav | Quick scroll between sections flickers indicator | `rootMargin` band 40-55% smooths this |

## One-Line Summary

> Five effects, all GPU-accelerated, all one-shot IO, all reduced-motion-aware, parallax desktop-only, count-up tabular-nums for CLS=0. Copy verbatim from escape page.
