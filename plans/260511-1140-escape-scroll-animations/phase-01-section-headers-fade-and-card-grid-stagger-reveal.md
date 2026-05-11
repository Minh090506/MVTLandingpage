# Phase 01 — Section Headers Fade-In + Card Grid Stagger Reveal

**Priority:** P0 (foundation — must ship first)
**Status:** Pending
**Owner:** main session
**Est. effort:** 25 min implementation + 10 min QA

## Context

Existing code already has:
- IntersectionObserver in `setupIntersectionObserver()` (line ~3925, pages/escape/index.html)
- `.visible` class applied to `.highlight-card, .destination-card, .upgrade-card, .testimonial-card, .gallery-item, .blog-card`
- Each card class has `opacity:0; transform:translateY(20px)` base + `.visible { opacity:1; transform:translateY(0) }`

**Gap:**
- `.section h2`, `.section-subtitle`, `.section p` do NOT fade in (abrupt appear).
- Cards in same grid all become visible at once (no stagger) — visually flat.

## Requirements

### Functional
1. Every `.section` heading block (h2 + paragraph immediately after) fades in + slides up 20px when section enters viewport (threshold 0.15).
2. Cards inside `.highlights-grid`, `.destination-grid`, `.gallery-grid`, `.testimonials-grid`, `.blog-grid` reveal with **80ms stagger** between siblings.
3. Each reveal: `cubic-bezier(0.22, 0.61, 0.36, 1)`, 600ms duration.
4. Reveals fire ONCE per element (no re-trigger on scroll-up).
5. If `prefers-reduced-motion: reduce` → ALL reveals instant (`opacity:1` immediately, no transform).

### Non-Functional
- Use `transform` + `opacity` only (GPU-accelerated, no layout reflow).
- `will-change: opacity, transform` ONLY during animation (added on observe, removed on transitionend).
- No new IntersectionObserver instance — extend the existing one.
- No CSS animation library.
- Total added JS ≤ 1KB minified.

## Architecture

```
┌───────────────────────────────────────────────────┐
│ setupIntersectionObserver() [existing — extend]    │
│ ┌───────────────────────────────────────────────┐ │
│ │ querySelectorAll selectors:                    │ │
│ │   + .section-reveal       ← NEW (headers)      │ │
│ │   + .stagger-item         ← NEW (grid cards)   │ │
│ │   + existing card classes                       │ │
│ └───────────────────────────────────────────────┘ │
│           ↓ on intersect                          │
│ ┌───────────────────────────────────────────────┐ │
│ │ if (parent.dataset.staggerGroup) {             │ │
│ │   delay = index-in-grid * 80ms                 │ │
│ │ } else { delay = 0 }                           │ │
│ │ requestAnimationFrame → add .visible           │ │
│ └───────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

## Related Code Files

**Modify:**
- `pages/escape/index.html` (CSS block ~line 200-2400, JS block ~line 3700-4000)

**Auto-regenerate:**
- `worker.js` (via `node build.js`)

## Implementation Steps

1. **CSS — add reusable reveal classes** (insert near existing `.highlight-card` styles, ~line 550):
   ```css
   .section-reveal {
     opacity: 0;
     transform: translateY(20px);
     transition: opacity 0.6s cubic-bezier(0.22,0.61,0.36,1),
                 transform 0.6s cubic-bezier(0.22,0.61,0.36,1);
     will-change: opacity, transform;
   }
   .section-reveal.visible {
     opacity: 1;
     transform: translateY(0);
   }
   .stagger-item {
     opacity: 0;
     transform: translateY(16px);
     transition: opacity 0.5s cubic-bezier(0.22,0.61,0.36,1),
                 transform 0.5s cubic-bezier(0.22,0.61,0.36,1);
   }
   .stagger-item.visible { opacity: 1; transform: translateY(0); }

   @media (prefers-reduced-motion: reduce) {
     .section-reveal, .stagger-item,
     .highlight-card, .destination-card, .upgrade-card,
     .testimonial-card, .gallery-item, .blog-card {
       opacity: 1 !important;
       transform: none !important;
       transition: none !important;
     }
   }
   ```

2. **HTML — annotate section headers** — add `class="section-reveal"` to:
   - `.highlights h2` + adjacent `p`
   - `.destinations h2` + adjacent `p`
   - `.itinerary h2` + adjacent `p`
   - `.video-section h2`
   - `.gallery h2`
   - `.why-myvivatour h2` + `p`
   - `.testimonials h2` + `p`
   - `.pricing h2` + `p`
   - `.faq h2`
   - `.booking h2`

   (Wrap consecutive header+subtitle in a single `<div class="section-reveal">` if both elements share fade timing.)

3. **HTML — annotate grid cards** — add `data-stagger-group` attribute to grid containers:
   ```html
   <div class="highlights-grid" data-stagger-group>
   <div class="destination-grid" data-stagger-group>
   <div class="gallery-grid" data-stagger-group>
   <div class="testimonials-grid" data-stagger-group>
   ```
   (Card child elements already have base opacity/transform CSS — no class change needed.)

4. **JS — extend setupIntersectionObserver** (replace existing function, ~line 3925):
   ```js
   function setupIntersectionObserver() {
     const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
     if (prefersReduced) {
       document.querySelectorAll('.section-reveal, .highlight-card, .destination-card, .upgrade-card, .testimonial-card, .gallery-item, .blog-card').forEach(el => el.classList.add('visible'));
       return;
     }
     const obs = new IntersectionObserver((entries) => {
       entries.forEach(entry => {
         if (!entry.isIntersecting) return;
         const el = entry.target;
         const parent = el.parentElement;
         const isStagger = parent && parent.hasAttribute('data-stagger-group');
         const delay = isStagger ? Array.prototype.indexOf.call(parent.children, el) * 80 : 0;
         setTimeout(() => {
           el.classList.add('visible');
           el.addEventListener('transitionend', () => { el.style.willChange = 'auto'; }, { once: true });
         }, delay);
         obs.unobserve(el);  // one-shot
       });
     }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

     document.querySelectorAll(
       '.section-reveal, .highlight-card, .destination-card, .upgrade-card, .testimonial-card, .gallery-item, .blog-card'
     ).forEach(el => obs.observe(el));
   }
   ```

5. **Build:** `node build.js` to regenerate `worker.js`.

## Todo List

- [ ] Add `.section-reveal` + `.stagger-item` CSS block + reduced-motion override
- [ ] Add `data-stagger-group` to 4 grid containers
- [ ] Annotate ~10 section header blocks with `.section-reveal`
- [ ] Replace `setupIntersectionObserver()` function
- [ ] Run `node build.js`
- [ ] Local smoke test (Chrome DevTools, Mobile emulation)
- [ ] Lighthouse mobile run — record score

## Success Criteria

- Visiting `https://escape.myvivatour.com` (after deploy), each section's header + grid cards reveal with smooth fade+slide on scroll.
- Cards in grid stagger 80ms each → eye flows left→right, top→bottom.
- macOS "Reduce motion" enabled (System Settings → Accessibility) → reveals disabled, content visible instantly.
- Lighthouse Perf ≥ 90, CLS unchanged (within ±0.01).
- No console errors.

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Section above-fold (Hero) wraps with `.section-reveal` → hidden on initial load | Med | Hero is NOT in the annotated list; only sections from `.highlights` downward |
| Stagger delay makes long grids feel slow on fast scroll | Low | Capped at 80ms × max 6 items = 480ms; user already past by then = card visible instantly via cap (no need to engineer cap, IO unobserves) |
| `transitionend` event misses on interrupted transitions → `will-change` stays | Low | Auto-cleaned on next GC; not a leak. Acceptable. |
| Cards in grids without `data-stagger-group` (e.g. upgrade-card) get no stagger | Intentional | Only listed 4 grids get stagger; others fade-in solo (still feels polished) |

## Security Considerations
None — pure DOM/CSS/IO API. No data, no user input.

## Next
→ Phase 02 (stat count-up) once Phase 01 verified live.
