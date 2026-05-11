# Plan: Escape LP — Professional Scroll Animations

**Date:** 2026-05-11
**Branch:** main (single-repo, no worktree)
**Target page:** `pages/escape/index.html` → `worker.js` (auto-built)
**Goal:** Add premium, fast scroll-reveal animations to justify $2,099 AUD price perception — without hurting Lighthouse or 50+ AU UX.

## Non-Negotiable Constraints

| # | Constraint | Verification |
|---|---|---|
| C1 | Lighthouse Performance ≥ 90 (mobile) | Run before+after, compare |
| C2 | CLS ≤ 0.05, LCP ≤ 2.5s on 4G | Lighthouse mobile trace |
| C3 | No JS framework, no animation library | Bundle stays inlined HTML |
| C4 | Added JS ≤ 2KB minified | Manual diff check |
| C5 | Animations use ONLY `opacity` + `transform` (GPU) | Code review |
| C6 | `prefers-reduced-motion: reduce` disables ALL added effects | Manual OS test |
| C7 | No effect blocks `<main>` interaction during load | Smoke test |
| C8 | Mobile 3G perceived smoothness (60fps) | Chrome DevTools throttle |

## Animation Inventory (target effects)

| Effect | Where | Why | Effort |
|---|---|---|---|
| Section header fade+slide-up | `.section > h2, p.section-subtitle` | Polish, currently abrupt | S |
| Stagger card reveal (80ms delay) | `.highlights-grid`, `.destination-grid`, `.gallery-grid`, `.testimonials-grid` | Guide eye flow | S |
| Stat count-up | "5.0", "230 Reviews", "#47" | Reinforce social proof | M |
| Hero bg parallax (0.3x scroll) | `.hero-bg-img` | Cinematic, brand luxury | S |
| Sticky anchor sub-nav | New element, appears after hero | UX — quick jump to Pricing/Booking | M |

## Phases (sequential, each shippable)

| Phase | Description | LoC est. | Status |
|---|---|---|---|
| 01 | Section reveals + card stagger (extends existing IO) | +60 CSS, +30 JS | ⏳ Pending |
| 02 | Stat count-up (Hero + TripAdvisor badge) | +40 JS | ⏳ Pending |
| 03 | Hero parallax (passive scroll + rAF throttle) | +25 JS, +5 CSS | ⏳ Pending |
| 04 | Sticky sub-nav (anchor jumps to Pricing/Booking) | +50 CSS, +20 JS, +1 DOM | ⏳ Pending |
| 05 | Performance audit + QA (Lighthouse, reduced-motion, 3G mobile) | 0 | ⏳ Pending |

## Build Pipeline Reminder
After ALL changes: `node build.js` → commit → push (GH Actions auto-deploys via wrangler).

## Out of Scope (explicit)
- Lottie / Framer Motion / GSAP — too heavy
- Page-transition animations (no SPA)
- Full-page parallax / mouse-follow (motion sickness 50+ demo)
- Scroll-jacking / locked scroll
- Animations on Booking form fields (would feel slow)

## Open Questions
1. Sticky sub-nav: hide on mobile (<768px) to preserve viewport? **Default: YES.**
2. Stat count-up duration: 1.2s or 1.5s? **Default: 1.2s (faster = more confident).**
3. Should reveals trigger on scroll-up too? **Default: NO (one-shot only, prevents jank on quick scrolling).**
