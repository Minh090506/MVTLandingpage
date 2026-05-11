# Phase 02 — TripAdvisor Stat Count-Up (Rating, Reviews, Rank)

**Priority:** P1
**Status:** Pending
**Owner:** main session
**Est. effort:** 20 min implementation + 5 min QA
**Depends on:** Phase 01 (uses same IntersectionObserver pattern)

## Context

Page displays 3 high-impact trust numbers as static text:
- `5.0` (rating) — line 2584 + 3091 in `pages/escape/index.html`
- `230 Reviews` — line 2585 + 3092
- `#47 of 852` Hanoi tour operators — line 3093

These are the strongest social-proof signals for AU 50+ price-sensitive segment. A count-up animation makes them feel **earned** instead of claimed.

## Requirements

### Functional
1. When TripAdvisor badge enters viewport, numbers animate from 0 → target:
   - `5.0` → 0.0 → 5.0 (1 decimal)
   - `230` → 0 → 230 (integer)
   - `#47` → 0 → 47 (integer, prefix `#` stays)
   - `852` → 0 → 852 (integer)
2. Hero strong tag `<strong>5.0</strong>` (line 2584) also animates.
3. Duration: 1200ms, eased (`easeOutCubic`).
4. Animate ONCE per number; never re-trigger.
5. Reduced-motion: skip animation, show final value immediately.
6. No layout shift (CLS=0) — width reserved via `tabular-nums` font-feature OR fixed `min-width`.

### Non-Functional
- Use `requestAnimationFrame` only (no `setInterval`).
- ≤ 1KB minified JS.
- No font reflow — apply `font-variant-numeric: tabular-nums` on counter elements.

## Architecture

```
1. Wrap each target number in <span class="count-up" data-target="230" data-decimals="0">230</span>
2. Hero badge & TA badge use same span markup.
3. On IO intersect (threshold 0.3) → start rAF loop, update textContent each frame.
4. Use easing easeOutCubic: t * (2 - t) variant for 1d.
```

## Related Code Files

**Modify:**
- `pages/escape/index.html` — wrap 5 numbers, add ~40 lines JS, ~5 lines CSS

**Auto-regenerate:** `worker.js`

## Implementation Steps

1. **CSS** (insert near reveal styles):
   ```css
   .count-up {
     font-variant-numeric: tabular-nums;
     display: inline-block;
   }
   ```

2. **HTML — wrap numbers** (5 locations):
   - Line 2584: `<strong><span class="count-up" data-target="5.0" data-decimals="1">5.0</span></strong>`
   - Line 2585: `· <span class="count-up" data-target="230" data-decimals="0">230</span> Reviews on TripAdvisor`
   - Line 3091: `<strong><span class="count-up" data-target="5.0" data-decimals="1">5.0</span> / 5</strong>`
   - Line 3092: `Based on <span class="count-up" data-target="230" data-decimals="0">230</span> verified reviews`
   - Line 3093: `🏅 Top 6% of Hanoi Tour Operators (#<span class="count-up" data-target="47" data-decimals="0">47</span> of <span class="count-up" data-target="852" data-decimals="0">852</span>)`

3. **JS — add setupCountUp() and call from init**:
   ```js
   function setupCountUp() {
     const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
     const els = document.querySelectorAll('.count-up');
     if (prefersReduced) {
       els.forEach(el => { el.textContent = formatNum(parseFloat(el.dataset.target), parseInt(el.dataset.decimals||'0',10)); });
       return;
     }
     const obs = new IntersectionObserver((entries) => {
       entries.forEach(entry => {
         if (!entry.isIntersecting) return;
         animateCount(entry.target);
         obs.unobserve(entry.target);
       });
     }, { threshold: 0.3 });
     els.forEach(el => obs.observe(el));
   }
   function animateCount(el) {
     const target = parseFloat(el.dataset.target);
     const decimals = parseInt(el.dataset.decimals || '0', 10);
     const duration = 1200;
     const start = performance.now();
     function frame(now) {
       const t = Math.min((now - start) / duration, 1);
       const eased = 1 - Math.pow(1 - t, 3);  // easeOutCubic
       el.textContent = formatNum(target * eased, decimals);
       if (t < 1) requestAnimationFrame(frame);
       else el.textContent = formatNum(target, decimals);
     }
     requestAnimationFrame(frame);
   }
   function formatNum(n, d) { return d > 0 ? n.toFixed(d) : Math.round(n).toString(); }
   ```

4. **Call from existing init/DOMContentLoaded block** alongside `setupIntersectionObserver()`.

5. **Build:** `node build.js`.

## Todo List

- [ ] Add `.count-up` CSS + tabular-nums
- [ ] Wrap 5 number spans across hero + TA badge
- [ ] Add `setupCountUp` + `animateCount` + `formatNum` JS
- [ ] Call `setupCountUp()` from init
- [ ] Run `node build.js`
- [ ] Local test: scroll past hero → 5.0/230 ticks up; scroll to TA badge → 5.0/230/47/852 tick
- [ ] Test reduced-motion → numbers show final immediately
- [ ] Verify no CLS via Chrome DevTools Performance trace

## Success Criteria

- All 5 counters animate smoothly 0→target on first viewport entry.
- Width does not shift during count (CLS=0).
- Reduced motion ON → no animation, final values shown.
- No console errors.
- Lighthouse Perf unchanged (within ±1 pt).

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| CLS bump from variable-width digits | Med | `tabular-nums` font feature |
| `5.0` displays as `0.0` momentarily on slow scroll before IO triggers | Low | Initial textContent stays as `5.0` (HTML literal); animation starts from current value? No — we want count effect. Trade-off: 0.0 visible for ≤200ms is fine; alternative is `min-width` + `visibility:hidden` until trigger but that hurts UX more |
| Number not in viewport on page load (TA badge is below fold) → fine | — | IO handles it |
| Hero `<strong>5.0</strong>` is above fold → animates on page load, may compete with hero entrance | Low | Acceptable — 1.2s duration is short; user attention on hero CTA anyway |

## Security Considerations
None — pure presentation.

## Next
→ Phase 03 (hero parallax) once Phase 02 verified.
