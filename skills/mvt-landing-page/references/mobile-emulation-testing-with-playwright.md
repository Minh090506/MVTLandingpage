# Mobile Testing Reference

Critical: visual mobile testing for landing pages must use **true mobile emulation**, not just resized desktop screenshots. Wrong tool = wasted debug time.

## ⚠️ Chrome headless `--screenshot --window-size` is NOT mobile emulation

**The trap:**

```bash
# WRONG: looks like mobile testing but isn't
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new \
  --window-size=375,667 \
  --screenshot=/tmp/iphone-se.png \
  http://localhost:8787/
```

What actually happens:
- `--window-size` sets the **OUTPUT IMAGE dimensions** only
- The underlying **layout viewport** stays at Chrome default (~800px desktop)
- `vw` units, media queries, `clamp()`, responsive images → ALL evaluate against ~800px, not 375px
- Result: H1 with `clamp(2.5rem, 8vw, 4.5rem)` renders at 64px (8vw of 800), then gets clipped into a 375px-wide image
- You see "H1 too big, fix doesn't work" → debug for hours → fix was correct all along

This bug burned ~30 min in escape page H1 mobile fix. Don't repeat.

## ✅ Use Playwright for true mobile rendering

```bash
# One-time setup
mkdir /tmp/pw-test && cd /tmp/pw-test
npm init -y
npm i playwright
```

```js
// /tmp/pw-test/test-mobile.mjs
import { chromium } from 'playwright';

const devices = [
  { name: 'iphone-se',   width: 375, height: 667 },
  { name: 'iphone-14',   width: 390, height: 844 },
  { name: 'galaxy-s8',   width: 360, height: 740 },
  { name: 'ipad-mini',   width: 768, height: 1024 },
];

const browser = await chromium.launch();

for (const d of devices) {
  const ctx = await browser.newContext({
    viewport: { width: d.width, height: d.height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
  });
  const page = await ctx.newPage();
  await page.goto('http://localhost:8787/', { waitUntil: 'networkidle' });
  await page.screenshot({
    path: `/tmp/escape-mobile-test/${d.name}.png`,
    fullPage: true   // captures entire scroll height
  });

  // Optional: log computed styles for debug
  const data = await page.evaluate(() => {
    const h1 = document.querySelector('.hero h1');
    const cs = window.getComputedStyle(h1);
    return {
      viewportWidth: window.innerWidth,
      h1FontSize: cs.fontSize,
      h1Width: h1.offsetWidth,
      h1OverflowsContainer: h1.scrollWidth > h1.clientWidth
    };
  });
  console.log(`${d.name}:`, JSON.stringify(data));
  await ctx.close();
}

await browser.close();
```

Run: `node test-mobile.mjs`

## When to use which tool

| Task | Tool |
|---|---|
| Quick desktop screenshot at fixed size | Chrome headless `--screenshot` |
| Desktop visual regression | Chrome headless OR Playwright |
| **Mobile/tablet layout verification** | **Playwright with `viewport + isMobile`** |
| Touch interactions, gestures | Playwright (`tap`, `swipe`) |
| Responsive breakpoint testing | Playwright with multiple viewport contexts |
| Performance metrics on mobile | Playwright + Chrome DevTools Protocol |
| Real device testing | BrowserStack / LambdaTest cloud |

## Key Playwright context options for mobile

```js
{
  viewport: { width: 375, height: 667 },  // CSS viewport — what `vw`, media queries see
  deviceScaleFactor: 2,                    // Retina = 2, regular = 1
  isMobile: true,                          // enables `pointer: coarse`, mobile UA hints
  hasTouch: true,                          // enables touch event simulation
  userAgent: '...iPhone...'                // for sites that sniff UA
}
```

`isMobile: true` is critical — without it, hover states, `:hover` media queries, and viewport meta interpretation are wrong.

## Quick debug checks for mobile bugs

When user reports "X looks broken on mobile":

1. **First** — verify with Playwright (NOT Chrome `--screenshot`)
2. Check viewport meta exists in `<head>`: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
3. Inspect computed styles via `page.evaluate(() => getComputedStyle(el))`
4. Look for `min-width` rules forcing horizontal scroll
5. Check if element has explicit pixel width > viewport width
6. Watch for `100vh` issues on iOS Safari (use `100dvh` or `min-height: 100vh`)
7. Check for fixed `font-size` that doesn't shrink (use `clamp()` with mobile-aware bounds)

## Common landing page mobile bugs (with fixes)

| Bug | Root cause | Fix |
|---|---|---|
| H1 overflows right edge | `clamp()` min too large for narrow viewports | Add mobile-specific clamp with smaller min: `clamp(1.85rem, 7.5vw, 2.5rem)` in `@media (max-width: 768px)` |
| Hero form clipped | `.hero { height: 100vh }` fixed | Mobile override: `min-height: auto; height: auto` |
| Right side cut off | Wide element (table, image) without `max-width: 100%` | Add `max-width: 100%; overflow-x: hidden` |
| Sticky bar covers content | Body has no bottom padding | Add `padding-bottom` matching sticky bar height on mobile |
| Floating buttons stack/collide | 3+ floating elements at bottom-right | Stagger vertical positions or hide one on small screens |
| Touch target too small | Button < 44×44px | Min-size CSS: `min-width: 44px; min-height: 44px` |
| Form fields overflow | Input default width or fixed pixel width | Add `width: 100%; box-sizing: border-box` to inputs |
| Horizontal scroll appears | Some element wider than viewport | `find` overflow culprit: `* { outline: 1px solid red; }` debug, or use Playwright `page.evaluate(() => document.body.scrollWidth)` |

## Computed style verification snippet

Use to confirm CSS rules apply on mobile viewport:

```js
await page.evaluate(() => {
  const targets = ['.hero h1', '.hero-content', '.hero-quick-form', '.risk-reversal-strip'];
  return targets.map(sel => {
    const el = document.querySelector(sel);
    if (!el) return { sel, error: 'not found' };
    const cs = window.getComputedStyle(el);
    return {
      sel,
      width: el.offsetWidth,
      height: el.offsetHeight,
      fontSize: cs.fontSize,
      padding: cs.padding,
      overflowX: cs.overflowX,
      display: cs.display,
      hasOverflow: el.scrollWidth > el.clientWidth
    };
  });
});
```

## Performance: Lighthouse mobile audit

For Core Web Vitals on mobile:

```bash
npx --yes lighthouse http://localhost:8787/ \
  --emulated-form-factor=mobile \
  --only-categories=performance,accessibility \
  --output=html \
  --output-path=/tmp/lighthouse-mobile.html \
  --view
```

Mobile Lighthouse uses 4G network throttling + 4× CPU slowdown — closer to real-world mobile experience than desktop audit.
