# Performance + Tracking Audit — Escape LP
**Date:** 2026-05-09 | **URL:** https://escape.myvivatour.com/ | **Stack:** CF Workers, all-inline HTML

---

## TL;DR
TTFB xuất sắc (163ms, CF edge SIN) và brotli compression hoạt động tốt. Vấn đề nghiêm trọng: hero là CSS background (không thể preload → LCP chậm ~3-5s), 19/23 ảnh thiếu `loading="lazy"`, `highlights-bg-blur.jpg` trả về 404, GA4 có thể bị double-fire qua cả direct gtag.js + GTM container. Cache Supabase images bị `no-cache`.

---

## Performance Score: 58/100
## Tracking Health Score: 78/100

---

## Core Web Vitals (estimated)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| LCP    | ~3.5–5s (est.) | <2.5s  | FAIL — hero is CSS background, no preload |
| CLS    | ~0.05–0.15 (est.) | <0.1   | RISK — 19 img missing width/height attrs |
| INP    | ~50–100ms (est.) | <200ms | PASS — inline JS minimal, no heavy frameworks |
| FCP    | ~0.8–1.2s (est.) | <1.8s  | PASS — CF edge fast, brotli active |
| TTFB   | **163ms avg** | <800ms | PASS — CF Workers edge (SIN datacenter) |

*LCP và CLS là estimated dựa trên code analysis, không có real-user data (cần CrUX/PageSpeed để xác nhận)*

---

## Network Diagnostics

```
DNS lookup:     3.8ms
TCP connect:    52ms
TLS handshake:  137ms (appconnect - pretransfer ≈ 0ms)
TTFB:          163ms (starttransfer)
Total load:    222ms (HTML only, no images)
HTML size:     148,003 bytes uncompressed
HTTP version:  HTTP/2 ✅
Brotli:        ACTIVE ✅ (content-encoding: br)
CF Cache:      public, max-age=3600 (1 hour) for HTML
```

---

## Tracking Validation Results

| Tag | Status | Notes |
|-----|--------|-------|
| GTM-TPQWV864 | LOADED | Inline snippet, `async` load ✅ |
| GA4 G-2R0EJ2LBJ5 | LOADED via gtag.js | `async` ✅ — but see duplicate risk below |
| Google Ads AW-17709107883 | CONFIGURED | `gtag('config', 'AW-17709107883')` line 21 ✅ |
| Ads Conversion `Wq0ECKXBmfsbEKuVrvxB` | FIRES ON SUCCESS | In all 3 form handlers ✅ (bookingForm, exitForm, heroQuickForm) |
| FB Pixel 579298288600609 | LOADED | fbq('init') + fbq('track', 'PageView') ✅ |
| FB `Lead` event | FIRES ON SUCCESS | In all 3 form handlers, guarded with `typeof fbq === 'function'` ✅ |
| DataLayer `form_submit` | FIRES | Before API call ✅ |
| DataLayer `form_success` | FIRES | After API success ✅ |
| DataLayer `form_error` | FIRES | On catch ✅ |
| DataLayer `cta_click` | FIRES | Event delegation on `.cta-button` ✅ |
| DataLayer `whatsapp_click` | FIRES | Event delegation on `a[href*="wa.me"]` ✅ |
| `form_start` event | MISSING | No `focus`/`input` listener to fire `form_start` |
| GA4 duplicate firing | RISK | gtag.js loaded directly AND GTM container also likely has GA4 tag → double PageView |

---

## Tracking Details

### Duplicate GA4 Risk (Critical)
- Line 15: `<script async src="...gtag/js?id=G-2R0EJ2LBJ5">` loads GA4 directly
- Line 20-21: `gtag('config', 'G-2R0EJ2LBJ5')` fires GA4 PageView
- GTM-TPQWV864 container almost certainly has a GA4 tag configured inside it
- Result: **GA4 PageView fires twice** per visit → inflated session count, distorted metrics
- Fix: Remove direct gtag.js if GA4 is managed via GTM. Or keep direct gtag.js but remove GA4 tag from GTM container.

### Form Submit Handler — Good
- `handleSubmit` (main booking form): proper async/await, try/catch ✅
- `handleExitSubmit` (exit intent popup): async/await ✅, `typeof gtag/fbq` guards ✅
- `handleHeroQuickSubmit` (hero inline form): async/await ✅
- All 3 forms fire: `form_submit` → [API call] → `form_success` + Google Ads conversion + FB Lead
- Google Ads conversion fires **only on success** (correct, not pre-fire) ✅

### Missing: `form_start` dataLayer event
No listener fires when user first interacts with any form field. GTM cannot track "form abandonment" without this.

---

## Checked — OK

1. **TTFB 163ms** — CF Workers edge (Singapore datacenter). Excellent for AU users (closest edge).
2. **HTTP/2** — Active ✅
3. **Brotli compression** — Active (`content-encoding: br` confirmed) ✅
4. **Security headers** — `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` ✅
5. **All 3 form submit handlers** — Google Ads conversion + FB Lead fires correctly on success only ✅
6. **Schema.org** — 6 JSON-LD blocks: TravelAgency, TouristTrip, FAQPage, BreadcrumbList, Review, etc. ✅
7. **Canonical + hreflang** — Set correctly ✅
8. **YouTube iframe** — `loading="lazy"` + `aspect-ratio: 16/9` (no CLS from iframe) ✅
9. **Exit intent popup** — Tracking fires correctly ✅
10. **IntersectionObserver** — `setupIntersectionObserver()` used for scroll animations (not raw scroll events) ✅

---

## Performance Issues (Medium)

1. **Google Fonts render-blocking** — `<link rel="stylesheet">` for Google Fonts (Playfair Display + Plus Jakarta Sans) blocks render. `display=swap` parameter present in URL but no `font-display` override in CSS. FOUC risk.
   
2. **19/23 images missing `loading="lazy"`** — Only 4 images have lazy: YouTube iframe, 3 review images. Dest cards (6), gallery (9), tour-map, why-trust-banner, logo all load eagerly. Wastes bandwidth for below-fold images.

3. **No explicit width/height on 21 images** — Only logo-myvivatour (line 1982) and why-trust-banner have `width:100%`. No `width`/`height` HTML attributes → browser cannot reserve space before image loads → CLS.

4. **Supabase image cache: `no-cache`** — All Supabase-hosted images return `Cache-Control: no-cache`. Every pageview revalidates all 23 images. Should be `public, max-age=31536000, immutable` for assets that don't change. Adds 23 extra round-trips per user.

5. **Missing preconnect for tracking domains** — No preconnect for:
   - `https://www.googletagmanager.com` (GTM + gtag.js)
   - `https://connect.facebook.net` (FB Pixel)
   These are loaded before fonts but no preconnect hints → adds ~50-100ms per domain.

---

## Critical Issues

### 1. Hero Image is CSS Background — LCP Killer
```css
/* line 293 */
.hero::before {
    background: url('...hero-halong-cruise.jpg') center/cover;
}
```
- CSS background images **cannot be preloaded** with `<link rel="preload">` effectively — browser doesn't discover them until CSSOM is built
- No `<img>` tag with `fetchpriority="high"` for hero
- Hero image (255KB JPEG) is the LCP candidate — it will load after CSS is parsed, not during HTML parsing
- **Estimated LCP impact: +1.5–3s** on mobile 4G

### 2. highlights-bg-blur.jpg — 404 Error
```
GET https://tnwelgvypmhhksqwnfmr.supabase.co/.../highlights-bg-blur.jpg
Response: {"statusCode":"404","error":"not_found","message":"Object not found"}
```
- Used as inline style on `<section class="highlights">` (line 2042)
- Browser makes request, gets JSON 404 → no image displayed → section background is pure dark overlay
- Minor visual but generates a network error on every pageload
- Fix: delete the inline style background URL or upload the correct image

### 3. Hero Image Not WebP — 250KB JPEG
- `hero-halong-cruise.jpg`: 255,651 bytes (JPEG)
- No WebP alternative, no `<picture>` srcset
- WebP would reduce to ~80-100KB (-60%), AVIF to ~50-60KB (-80%)
- Same for `why-trust-banner.jpg` (228KB), `logo-myvivatour-full.jpg` (112KB)

### 4. Potential GA4 Double-Fire
- Direct gtag.js **AND** GTM container both likely send GA4 PageView → sessions counted twice
- Must verify in GTM → GA4 tag config, then remove one

---

## Top 5 Priority Actions

### Action 1: Convert Hero to `<img>` + fetchpriority
**WHAT:** Replace CSS background `.hero::before` with an actual `<img>` tag as first child of `.hero`  
**WHY:** Browser discovers `<img>` during HTML parsing and can start fetching immediately. CSS backgrounds are discovered late.  
**HOW:**
```html
<!-- Add inside <section class="hero"> as first child -->
<img src="...hero-halong-cruise.jpg" 
     alt="Ha Long Bay Vietnam cruise"
     fetchpriority="high"
     decoding="async"
     width="1920" height="1080"
     style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;">
```
Plus add `<link rel="preload" as="image" href="...hero-halong-cruise.jpg" fetchpriority="high">` in `<head>`.  
**EFFORT:** 20 min  
**EXPECTED IMPROVEMENT:** LCP -1.5–2.5s (estimated), from ~4s to ~1.5–2s

---

### Action 2: Convert Images to WebP + fix Supabase cache
**WHAT:** Convert hero + why-trust-banner + logo + top gallery images to WebP  
**WHY:** hero-halong-cruise.jpg (255KB) + why-trust-banner.jpg (228KB) = 483KB for 2 images alone. WebP = ~80-100KB each.  
**HOW:** 
- Use `cwebp` or Squoosh to convert, re-upload to Supabase
- Use `<picture>` tag with WebP + JPEG fallback
- Contact Supabase support or set Transform image via Supabase Image Transformation API to serve WebP  
**EFFORT:** 1-2h  
**EXPECTED IMPROVEMENT:** Total image payload -40-60% (~1MB → ~400KB for all images)

---

### Action 3: Fix GA4 Duplicate Firing
**WHAT:** Remove direct gtag.js if GTM manages GA4; or disable GA4 tag in GTM  
**WHY:** Double-counting sessions = wrong data for all GA4 reports, inflated conversion rates  
**HOW:**
1. Open GTM → Tags → find GA4 Configuration tag
2. If it exists: remove lines 14-22 from `index.html` (direct gtag.js + config calls)
3. Keep only GTM for all analytics
4. If GTM does NOT have GA4 tag: direct gtag.js is correct, no action needed  
**EFFORT:** 10 min  
**EXPECTED IMPROVEMENT:** Clean analytics data

---

### Action 4: Fix highlights-bg-blur.jpg 404 + Add lazy loading to 15 images
**WHAT:** Fix 404 image + add `loading="lazy"` to all below-fold images  
**WHY:** 404 generates console error + wasted request. Eager loading 15 below-fold images wastes bandwidth.  
**HOW:**
- For 404: either upload correct image to Supabase, or remove background URL from highlights section inline style
- For lazy: add `loading="lazy"` to all `<img>` tags except hero (if converted to img tag) and logo  
**EFFORT:** 15 min  
**EXPECTED IMPROVEMENT:** Reduced bandwidth -300-500KB on initial load, no console errors

---

### Action 5: Add preconnect for tracking domains + add form_start event
**WHAT:** Add preconnects + fix missing form_start tracking  
**WHY:** Saves 50-100ms per third-party domain. form_start enables form abandonment analysis in GTM.  
**HOW:**
```html
<!-- Add to <head> after existing preconnects -->
<link rel="preconnect" href="https://www.googletagmanager.com">
<link rel="preconnect" href="https://connect.facebook.net">
```
```js
// Add to each form's first field - fire once per form
document.getElementById('name').addEventListener('focus', function() {
    window.dataLayer.push({ event: 'form_start', form_id: 'bookingForm' });
}, { once: true });
```
**EFFORT:** 10 min  
**EXPECTED IMPROVEMENT:** FCP/LCP -50-100ms

---

## Quick Wins (<30 phút)

| Fix | File | Lines | Impact |
|-----|------|-------|--------|
| Add `<link rel="preload" as="image" href="hero-halong-cruise.jpg" fetchpriority="high">` in `<head>` | index.html | After line 83 | LCP -500ms-1s |
| Add `loading="lazy"` to 15 non-critical images | index.html | Multiple | Bandwidth -300KB |
| Remove/fix `highlights-bg-blur.jpg` 404 | index.html | Line 2042 | Console error gone |
| Add preconnect for googletagmanager.com + facebook.net | index.html | Head | FCP -100ms |
| Add `form_start` listener on first form field focus | index.html | ~line 3077 | Analytics completeness |
| Add `width` + `height` attributes to all img tags | index.html | Multiple | CLS improvement |

---

## Image Inventory (all 23)

| Image | Size | Lazy? | Notes |
|-------|------|-------|-------|
| hero-halong-cruise.jpg (CSS bg) | 255KB | N/A | LCP candidate — not preloadable as CSS bg |
| why-trust-banner.jpg | 228KB | No | Large, eager, below fold |
| logo-myvivatour-full.jpg | 112KB | No | Logo, needed above fold ✅ |
| gallery-coconut-boat.jpg | 164KB | No | Gallery, needs lazy |
| gallery-hanoi-cyclo.jpg | 124KB | No | Gallery, needs lazy |
| gallery-hcmc-temple.jpg (×2) | 137KB | No | Used in dest + gallery (duplicate request!) |
| gallery-hanoi-street.jpg | 145KB | No | Gallery, needs lazy |
| gallery-hoian-sunset.jpg | 103KB | No | Gallery, needs lazy |
| gallery-halong-cruise.jpg | 104KB | No | Gallery, needs lazy |
| tour-map-auv10.jpg | 95KB | No | Needs lazy |
| gallery-halong-bay.jpg | 75KB | No | Needs lazy |
| gallery-hoian-street.jpg | 77KB | No | Needs lazy |
| gallery-mekong-lotus.jpg | 84KB | No | Needs lazy |
| dest-hoian.jpg | 82KB | No | Dest card, needs lazy |
| dest-halong.jpg | 68KB | No | Dest card, needs lazy |
| dest-hcmc.jpg | 65KB | No | Dest card, needs lazy |
| dest-mekong.jpg | ? | No | Dest card, needs lazy |
| dest-hanoi.jpg | 49KB | No | Dest card, needs lazy |
| review-ma-luisa-camacho.jpg | 66KB | Yes ✅ | OK |
| review-nemi-esangga.jpg | 63KB | Yes ✅ | OK |
| review-mohit-jain.jpg | 62KB | Yes ✅ | OK |
| highlights-bg-blur.jpg (CSS bg) | 404 | N/A | **Missing file — 404** |
| YouTube iframe | N/A | Yes ✅ | OK |

**Duplicate request bug:** `gallery-hcmc-temple.jpg` loaded twice — line 2112 (dest section) + line 2437 (gallery section).

---

## CF Worker Config Assessment

| Setting | Value | Assessment |
|---------|-------|-----------|
| Cache-Control HTML | `public, max-age=3600` | OK but short (1h). Could be longer for static LP. |
| Sitemap cache | `public, max-age=86400` | Good |
| CSP header | **MISSING** | Security risk — no Content-Security-Policy |
| HSTS | Via Cloudflare automatic | OK |
| Permissions-Policy | **MISSING** | Minor |
| ETag | None for HTML | CF handles this automatically |

**Missing CSP** is a security gap — XSS attacks not mitigated at header level. Low priority for a landing page but should be added.

---

## JS Health Assessment

- No render-blocking `<script>` without async/defer (all inline scripts are initialization code, unavoidable)
- GTM snippet is sync but tiny (standard, acceptable)
- All form handlers: proper async/await + try/catch ✅
- Event listeners use `addEventListener` (no inline event duplication) ✅
- IntersectionObserver for scroll animations (not `scroll` event listeners) ✅
- No obvious memory leaks — event listeners are on document (not individual elements that get removed) ✅
- `typeof fbq === 'function'` guard on all FB tracking calls ✅
- Main JS inline: ~20KB chars (uncompressed). After brotli: ~4-5KB. Acceptable.

---

## Unresolved Questions

1. **GTM container config**: Cannot verify without GTM UI access whether GA4 tag exists inside GTM-TPQWV864. This is the most critical unknown — if GA4 is in GTM, direct gtag.js is causing double-fires. Need GTM access to confirm.

2. **Real CrUX data**: LCP/CLS estimates are code-analysis based. Actual field data from Google Search Console → Core Web Vitals report or PageSpeed Insights (if sufficient traffic) would give real numbers.

3. **Supabase image cache headers**: Currently `no-cache` — Supabase Storage default. Cannot change without Supabase Pro plan (custom cache-control per bucket) or using Cloudflare as proxy in front of Supabase images. Is there budget for this?

4. **`highlights-bg-blur.jpg`**: What was the intended image? Needs to be re-uploaded or the section's inline background URL removed.

5. **hero-halong-cruise.jpg WebP**: Was WebP version created during original image upload? If yes, just update the URL. If no, needs conversion.
