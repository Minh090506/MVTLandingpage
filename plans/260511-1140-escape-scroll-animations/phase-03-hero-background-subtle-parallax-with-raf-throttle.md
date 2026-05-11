# Phase 03 — Hero Background Subtle Parallax with rAF Throttle

**Priority:** P2
**Status:** Pending
**Owner:** main session
**Est. effort:** 15 min implementation + 10 min QA (mobile critical)
**Depends on:** None (independent of Phase 01/02)

## Context

Hero section uses `.hero-bg-img` with a slow CSS `zoomIn` animation (line ~336). Adding **gentle parallax** (background translates at 0.3x scroll speed while hero is in view) creates cinematic depth WITHOUT inducing motion sickness common to full-page parallax.

**Critical:** Older AU travelers (target audience) are especially sensitive to motion. Parallax intensity MUST be subtle (max 60px translate) and ONLY on hero (above-fold).

## Requirements

### Functional
1. As user scrolls down within first ~700px (hero height), `.hero-bg-img` translates upward at 0.3x scroll rate (max -60px).
2. Translate stops when hero exits viewport (no jitter below).
3. Animation runs at 60fps (rAF, not scroll event handler).
4. Reduced-motion → parallax disabled, bg stays static.
5. Mobile (<768px) → parallax disabled (touch scroll perf + motion sickness).
6. Existing `zoomIn` keyframe animation preserved (separate transform layer).

### Non-Functional
- Use `transform: translate3d(0, Y, 0)` — GPU layer.
- One `scroll` event listener with `{passive: true}` + rAF guard.
- No `will-change` permanently (set on hero element only).
- ≤ 25 lines added JS.

## Architecture

```
Scroll event (passive)
  ↓
rAF queue check (if pending, skip)
  ↓
requestAnimationFrame(updateHeroParallax)
  ↓
Read scrollY (cached) → calculate translate
  ↓
Apply to .hero-bg-img wrapper element (not .hero-bg-img itself, to avoid conflicting with zoomIn animation)
```

**Conflict resolution with existing `zoomIn`:**
- `.hero-bg-img` already has `transform: scale(...)` from keyframe.
- Solution: wrap `.hero-bg-img` in a parent `<div class="hero-parallax-layer">` and translate THAT — keeps scale animation isolated.

## Related Code Files

**Modify:**
- `pages/escape/index.html`: wrap hero bg img + add CSS + JS

**Auto-regenerate:** `worker.js`

## Implementation Steps

1. **HTML** — wrap `.hero-bg-img`:
   ```html
   <div class="hero-parallax-layer">
     <img class="hero-bg-img" ...>
   </div>
   ```

2. **CSS**:
   ```css
   .hero-parallax-layer {
     position: absolute;
     inset: 0;
     z-index: 0;
     will-change: transform;
     pointer-events: none;
   }
   @media (max-width: 767px) {
     .hero-parallax-layer { will-change: auto; }
   }
   @media (prefers-reduced-motion: reduce) {
     .hero-parallax-layer { transform: none !important; }
   }
   ```

3. **JS** — add `setupHeroParallax()`:
   ```js
   function setupHeroParallax() {
     if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
     if (window.innerWidth < 768) return;
     const layer = document.querySelector('.hero-parallax-layer');
     if (!layer) return;
     const hero = document.querySelector('.hero');
     let pending = false;
     function update() {
       pending = false;
       const rect = hero.getBoundingClientRect();
       if (rect.bottom < 0 || rect.top > window.innerHeight) return;
       const scrolled = Math.max(0, -rect.top);
       const offset = Math.min(scrolled * 0.3, 60);
       layer.style.transform = `translate3d(0, ${-offset}px, 0)`;
     }
     window.addEventListener('scroll', () => {
       if (!pending) { pending = true; requestAnimationFrame(update); }
     }, { passive: true });
     update();  // initial position
   }
   ```

4. **Call** `setupHeroParallax()` from init alongside other setups.

5. **Build:** `node build.js`.

## Todo List

- [ ] Wrap `.hero-bg-img` in `.hero-parallax-layer` div
- [ ] Add CSS (3 rules: base, mobile disable, reduced-motion disable)
- [ ] Add `setupHeroParallax()` JS
- [ ] Call from init
- [ ] Run `node build.js`
- [ ] Desktop test: smooth 60fps parallax, max translate 60px, stops below fold
- [ ] Mobile test: NO parallax (DevTools throttle to mobile)
- [ ] Reduced-motion test: NO parallax
- [ ] Chrome Performance trace: confirm rAF used, no scroll jank

## Success Criteria

- Desktop scroll: hero bg moves at 0.3x scroll → feels like depth.
- Mobile: no parallax (verified via `window.innerWidth < 768` early return).
- Reduced-motion ON → no parallax.
- Performance trace: zero long tasks, scrollY reads coalesced via rAF.
- Existing `zoomIn` hero animation still plays (unaffected).

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Stacking context breaks (text becomes hidden behind bg) | Med | `.hero-parallax-layer` z-index:0 matches existing `.hero-bg-img` placement |
| Mobile Safari touch scroll jank | High if enabled on mobile | Mobile parallax DISABLED via `innerWidth < 768` early return |
| Window resize from desktop → mobile (or rotate) leaves parallax stuck | Low | Add `resize` listener that reads `innerWidth` and resets transform if mobile |
| Existing `zoomIn` keyframe transform conflicts | Low | Solved via wrapper div (parallax on parent, scale on child) |

## Security Considerations
None.

## Next
→ Phase 04 (sticky sub-nav).
