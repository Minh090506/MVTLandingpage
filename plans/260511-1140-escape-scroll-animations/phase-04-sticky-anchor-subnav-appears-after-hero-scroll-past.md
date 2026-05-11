# Phase 04 — Sticky Anchor Sub-Nav (Appears After Hero Scroll Past)

**Priority:** P2
**Status:** Pending
**Owner:** main session
**Est. effort:** 30 min implementation + 15 min QA (desktop + tablet)
**Depends on:** None

## Context

Long landing page (~12 sections, ~6000px tall). After user scrolls past hero, there's no quick way to jump to **Pricing** or **Booking** without scrolling 4-5 screens. A sticky sub-nav appearing after hero solves this — improves UX, signals premium feel, increases booking CVR.

**Constraints from existing UI:**
- Mobile already has `.mobile-book-bar` (line ~2123) — bottom bar with "Book Now" CTA.
- Desktop has NO persistent nav. Logo + WhatsApp float, but no anchors.

→ **Sub-nav scope: desktop + tablet only** (≥768px). Mobile keeps existing bottom bar; don't double up.

## Requirements

### Functional
1. Sticky nav appears (slide down from top) when user scrolls **past hero bottom** (using IntersectionObserver on `.hero` sentinel).
2. Nav contains 5 anchor links: `Highlights`, `Itinerary`, `Reviews`, `Pricing`, `Book Now` (last is primary CTA button).
3. Clicking anchor smooth-scrolls to section with offset (-80px to account for sticky nav height).
4. Nav hides when user scrolls back into hero area.
5. Nav height ~56px, semi-transparent white bg with backdrop-blur.
6. Hidden on mobile (<768px) — no DOM render needed (CSS `display:none`).
7. Reduced-motion → no slide-down transition; nav just appears/disappears.

### Non-Functional
- Pure CSS for slide animation (transform translateY).
- Backdrop-filter: `blur(12px)` (Safari + Chromium support).
- z-index BELOW WhatsApp float (which is 9999) and lightbox (10000+), ABOVE content.
- ≤ 50 CSS lines + 20 JS lines.

## Architecture

```
.hero (sentinel)
  ↓ IntersectionObserver (root: viewport, rootMargin: -100% 0px 0px 0px)
  ↓ entry.isIntersecting === false → nav SHOW
  ↓ entry.isIntersecting === true  → nav HIDE
.sticky-subnav
  ├── .subnav-brand (logo text)
  ├── .subnav-links (5 anchors)
  └── .subnav-cta (Book Now button)
```

**Why this IO approach:** detects "user has scrolled past hero" without scroll listener — cheaper, no jank.

## Related Code Files

**Modify:**
- `pages/escape/index.html` — new DOM element after `<body>` start, ~50 CSS lines, ~20 JS lines

**Auto-regenerate:** `worker.js`

## Implementation Steps

1. **HTML** — insert after GTM noscript:
   ```html
   <nav class="sticky-subnav" aria-label="Page navigation">
     <div class="subnav-inner">
       <a href="#top" class="subnav-brand">MyVivaTour</a>
       <div class="subnav-links">
         <a href="#highlights">Highlights</a>
         <a href="#itinerary">Itinerary</a>
         <a href="#testimonials">Reviews</a>
         <a href="#pricing">Pricing</a>
       </div>
       <a href="#booking" class="subnav-cta">Book Now</a>
     </div>
   </nav>
   ```

2. **CSS**:
   ```css
   .sticky-subnav {
     position: fixed;
     top: 0; left: 0; right: 0;
     height: 56px;
     background: rgba(255,255,255,0.92);
     backdrop-filter: blur(12px);
     -webkit-backdrop-filter: blur(12px);
     border-bottom: 1px solid rgba(0,0,0,0.06);
     transform: translateY(-100%);
     transition: transform 0.35s cubic-bezier(0.22,0.61,0.36,1);
     z-index: 900;
     display: none;  /* hidden until JS enables for desktop */
   }
   @media (min-width: 768px) {
     .sticky-subnav { display: block; }
   }
   .sticky-subnav.visible { transform: translateY(0); }
   .subnav-inner {
     max-width: 1200px; margin: 0 auto;
     display: flex; align-items: center; justify-content: space-between;
     gap: 2rem; padding: 0 1.5rem; height: 100%;
   }
   .subnav-brand { font-weight: 700; color: #1e293b; text-decoration: none; font-size: 1.05rem; }
   .subnav-links { display: flex; gap: 1.75rem; }
   .subnav-links a {
     color: #475569; text-decoration: none; font-size: 0.92rem; font-weight: 500;
     padding: 0.4rem 0.2rem; border-bottom: 2px solid transparent;
     transition: color 0.2s, border-color 0.2s;
   }
   .subnav-links a:hover { color: #1e293b; border-bottom-color: #f59e0b; }
   .subnav-cta {
     background: #f59e0b; color: white; padding: 0.55rem 1.25rem;
     border-radius: 8px; font-weight: 600; font-size: 0.92rem; text-decoration: none;
     transition: background 0.2s, transform 0.15s;
   }
   .subnav-cta:hover { background: #d97706; transform: translateY(-1px); }
   @media (prefers-reduced-motion: reduce) {
     .sticky-subnav { transition: none; }
   }
   ```

3. **JS** — add `setupStickySubnav()`:
   ```js
   function setupStickySubnav() {
     if (window.innerWidth < 768) return;
     const nav = document.querySelector('.sticky-subnav');
     const hero = document.querySelector('.hero');
     if (!nav || !hero) return;
     const obs = new IntersectionObserver(([entry]) => {
       nav.classList.toggle('visible', !entry.isIntersecting);
     }, { rootMargin: '0px 0px -90% 0px' });
     obs.observe(hero);
     // Smooth scroll offset
     nav.querySelectorAll('a[href^="#"]').forEach(a => {
       a.addEventListener('click', (e) => {
         const id = a.getAttribute('href').slice(1);
         if (!id) return;
         const target = document.getElementById(id);
         if (!target) return;
         e.preventDefault();
         const y = target.getBoundingClientRect().top + window.scrollY - 70;
         window.scrollTo({ top: y, behavior: 'smooth' });
       });
     });
   }
   ```

4. **Add anchor IDs if missing**: confirm `#highlights`, `#itinerary`, `#testimonials`, `#pricing`, `#booking` exist (Phase 01 recon confirms all present except `#testimonials` — check & add).

5. **Call** `setupStickySubnav()` from init.

6. **Build:** `node build.js`.

## Todo List

- [ ] Insert `.sticky-subnav` DOM after GTM noscript
- [ ] Verify/add `id="testimonials"` on `.testimonials.section`
- [ ] Add 50 lines of subnav CSS
- [ ] Add `setupStickySubnav()` JS + call from init
- [ ] Run `node build.js`
- [ ] Desktop test: nav slides in after hero, smooth-scroll on anchor click
- [ ] Tablet test (iPad emulation): nav visible
- [ ] Mobile test (iPhone emulation <768px): nav HIDDEN, bottom bar still works
- [ ] Reduced-motion: nav appears but no transition
- [ ] z-index test: lightbox opens above nav, WhatsApp float above nav

## Success Criteria

- Desktop: scroll past hero → nav slides down within ~350ms.
- Scroll back to top → nav slides out.
- Click "Pricing" → smooth scroll to pricing section, offset accounts for nav height.
- Mobile: nav never appears; bottom book bar still functional.
- Lighthouse: Performance unchanged, Accessibility ≥ 95 (nav has `aria-label`).
- No console errors.

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| backdrop-filter not supported on old browsers (Safari ≤8) | Very low (audience uses modern browsers) | Fallback: `background: rgba(255,255,255,0.96)` (already semi-transparent without blur) |
| z-index conflict with WhatsApp float / lightbox | Med | Subnav z-index 900; WhatsApp 9999; lightbox 10000 → safe |
| Sticky nav covers up section anchors during scroll (e.g. "Pricing" header hidden) | High if no offset | Smooth-scroll JS subtracts 70px offset |
| Resize crossing 768px boundary leaves nav in wrong state | Low | Acceptable — refresh fixes; rare event |
| Hero-section IO `rootMargin -90%` triggers slightly before/after hero exit | Low | Adjust margin during QA; not a correctness issue |

## Security Considerations
None — internal anchor navigation only.

## Next
→ Phase 05 (full performance audit + final QA).
