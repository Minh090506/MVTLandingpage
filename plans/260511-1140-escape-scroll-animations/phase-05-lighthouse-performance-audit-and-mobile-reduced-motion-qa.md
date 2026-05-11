# Phase 05 — Lighthouse Performance Audit + Mobile + Reduced-Motion QA

**Priority:** P0 (gate — ship only after this passes)
**Status:** Pending
**Owner:** main session
**Est. effort:** 30 min
**Depends on:** Phases 01–04 complete & deployed to preview/live

## Goal

Verify all animations meet non-negotiable constraints from `plan.md` BEFORE declaring ship-ready. Catch regressions before they hit AU customers.

## Pre-Audit Checklist

- [ ] All 4 implementation phases merged to main + deployed (worker.js current)
- [ ] Live URL: https://escape.myvivatour.com confirmed serving latest
- [ ] Baseline Lighthouse score captured BEFORE changes (from git history or `lighthouse` CLI on previous deploy)

## Audit Matrix

### 1. Lighthouse Mobile (Required)

Run: `npx lighthouse https://escape.myvivatour.com --preset=mobile --view --output=html --output-path=./plans/260511-1140-escape-scroll-animations/lighthouse-mobile.html`

| Metric | Target | Acceptable Drop from Baseline |
|---|---|---|
| Performance | ≥ 90 | ≤ -3 pts |
| LCP | ≤ 2.5s | ≤ +200ms |
| CLS | ≤ 0.05 | ≤ +0.02 |
| TBT | ≤ 200ms | ≤ +50ms |
| Accessibility | ≥ 95 | unchanged |
| Best Practices | ≥ 95 | unchanged |
| SEO | ≥ 95 | unchanged |

### 2. Chrome DevTools Performance Trace (Required)

- 4G throttle + 4x CPU slowdown
- Record: page load → scroll to bottom → scroll back up
- Inspect:
  - [ ] No long tasks > 50ms during scroll
  - [ ] No `Forced reflow` warnings
  - [ ] No `Layout` work during scroll (only Compositor)
  - [ ] FPS meter ≥ 50fps avg during scroll
  - [ ] Memory: no leak (heap stable after 3 scroll passes)

### 3. Reduced Motion (Required)

- macOS: System Settings → Accessibility → Display → Reduce motion ON
- iOS Safari: Settings → Accessibility → Motion → Reduce Motion ON
- Verify all of:
  - [ ] Section headers visible without fade
  - [ ] Card grids visible without stagger
  - [ ] Count-up numbers show final value immediately
  - [ ] Hero parallax disabled (bg static on scroll)
  - [ ] Sticky subnav appears without slide-down transition
  - [ ] Hero `zoomIn` keyframe disabled (existing behavior preserved)

### 4. Real Device Testing (Required)

| Device | Browser | Check |
|---|---|---|
| iPhone 12+ (iOS 15+) | Safari | Scroll smoothness, no parallax, count-up triggers, bottom-bar still works, no subnav |
| Samsung Galaxy mid-range | Chrome | Same as above |
| iPad | Safari | Subnav appears (≥768px), parallax desktop-equiv |
| MacBook (1280×800) | Chrome | All effects active, smooth scroll, subnav anchor jumps |
| MacBook | Safari | Backdrop-blur renders, animations smooth |

### 5. Bundle Size Check

```bash
# Compare worker.js size before/after
git diff main~5 main -- worker.js | wc -l
```
- [ ] Net added JS ≤ 5KB (across all 4 phases)
- [ ] No new external script tags added

### 6. Accessibility Spot-Check

- [ ] Keyboard tab order: subnav links reachable via Tab key
- [ ] Focus styles visible on subnav links
- [ ] Screen reader (VoiceOver) reads "Page navigation" landmark
- [ ] Color contrast on subnav text ≥ 4.5:1 (sub-nav greys vs white bg)

## Output Artifacts

Save to plan dir:
- `lighthouse-mobile.html` (Lighthouse report)
- `lighthouse-desktop.html`
- `performance-trace.json` (Chrome DevTools export — optional)
- `qa-results.md` (summary table, pass/fail per check)

## Rollback Criteria

**STOP and ROLLBACK** if ANY of:
- Lighthouse Perf drops below 85 mobile
- CLS exceeds 0.1
- Any phase introduces console errors
- Mobile scroll FPS drops below 40
- AU 50+ user testing (if available) reports motion sickness or dizziness

Rollback steps:
1. `git revert <phase-X-commit>`
2. `node build.js`
3. `git push`
4. Confirm previous behavior restored on live URL
5. Diagnose, fix, retry phase

## Todo List

- [ ] Run Lighthouse mobile (record JSON+HTML)
- [ ] Run Lighthouse desktop
- [ ] Chrome Performance trace (4x CPU, 4G)
- [ ] Reduced-motion test (macOS)
- [ ] Real device test: iOS Safari (physical or BrowserStack)
- [ ] Real device test: Android Chrome
- [ ] Tablet test (iPad Safari emulation)
- [ ] Bundle size diff (worker.js)
- [ ] Accessibility keyboard + VoiceOver check
- [ ] Write `qa-results.md` summary
- [ ] Sign off: ship-ready OR rollback

## Success Criteria

All checks in audit matrix pass within "Acceptable Drop" thresholds.
`qa-results.md` shows ≥ 95% pass rate, all P0 items GREEN.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Real device not available | BrowserStack free trial OR delay ship 24h until device access |
| Lighthouse score volatile (network variance) | Run 3 times, take median |
| Reduced-motion preference doesn't propagate in DevTools emulation | Test on actual OS setting, not emulation |

## Security Considerations
None.

## Next
→ Tag commit, update `plan.md` status to ✅ Complete, journal entry.
