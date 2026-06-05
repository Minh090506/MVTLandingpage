# Dental LP — Live Audit + UX Improvements

**Date:** 2026-05-24
**URL:** https://implant.vietnamdentaltravel.com/
**Commits:** `4288536` (UX fixes after audit)

## Audit findings (round 1)

| Metric | Mobile (390px) | Desktop (1440px) |
|---|---|---|
| HTTP | 200 | 200 |
| Load | 1654ms | 1413ms |
| FCP | 812ms | 100ms |
| DOM nodes | 781 | 782 |
| H1 / H2s | 1 / 13 | 1 / 13 |
| Images (alt) | 30 / 0 missing | 30 / 0 missing |
| Schema types | 4 (MedicalBusiness, Product, FAQPage, BreadcrumbList) | same |
| Tracking firing | GTM + GA4 + Ads + FB Pixel + WhatsApp | same |
| Horizontal scroll | No | No |
| **Overflowing elements** | **16 (pricing table cells)** | 3 (hero SVG decoration — non-functional) |
| Console errors | 1× 404 (OG image) | 1× 404 (OG image) |

## Issues fixed

### 1. OG / Twitter image 404 → Fixed
- **Before:** `https://implant.vietnamdentaltravel.com/images/og-dental-implants-vietnam.jpg` → HTTP 404 (path doesn't exist on CF Worker)
- **After:** `https://tnwelgvypmhhksqwnfmr.supabase.co/.../hero-banner.webp` → HTTP 200
- **Impact:** Social share previews (FB, Twitter, LinkedIn) now render properly
- **Also fixed:** Product schema `image` field had same broken URL

### 2. Mobile pricing table overflow → Fixed
- **Before:** 16 cells overflowing viewport by ~51px on 390px mobile; pricing comparison unreadable
- **After:** 0 overflowing elements; compact mobile padding (12/8px vs 20px), smaller font (0.85rem vs 1rem), `← scroll →` hint at bottom
- **Impact:** Pricing table now fully visible without horizontal pinch-zoom

### 3. Form payload enriched
- Added `from_name: 'VietnamDentalTravel Booking'` — clearer sender label in inbox
- Added `replyto: <user-email>` — clicking Reply in inbox replies directly to lead (not Web3Forms)
- Updated subject to include domain: `New Dental Implant Inquiry — implant.vietnamdentaltravel.com`

## Form destination verification

Submitted live test via puppeteer (browser origin, Web3Forms accepted):
- **HTTP 200 from `api.web3forms.com/submit`**
- Test entry payload: name="TEST — Claude Code verify", email=`nguyenducminh85bk@gmail.com`, treatment="Single Implant"
- Live submission used PRE-fix code (subject was still old "Free Treatment Plan")

**ACTION REQUIRED for anh:**
Check inbox `info@myvivatour.com` for the test entry. If received → destination is correct, key routes properly. If NOT received → check Web3Forms dashboard (https://web3forms.com/dashboard, login to associated account) and verify the email for access key `cf0ca620-d064-4640-9454-afb27d588f67` is set to `info@myvivatour.com`.

## Audit round 2 (post-fix)
| Metric | Mobile | Desktop |
|---|---|---|
| Overflowing elements | **0** (was 16) | 0 |
| OG image | HTTP 200 (was 404) | 200 |
| Other metrics | unchanged | unchanged |

## Outstanding minor items (not fixed yet, low priority)
1. 1× generic console 404 still showing after fixes — likely stale Chrome cache from audit tool, didn't reproduce on direct curl of any HTML asset. Re-audit next session.
2. Mobile total page height: 43,082px — very long scroll. Consider above-the-fold trim or section accordion for v2.
3. Schema types: could add `Dentist` + explicit `LocalBusiness` for richer Google local SEO.
4. `images/` folder in repo is now redundant (all paths point to Supabase CDN). Can remove from git in cleanup commit OR keep as source-of-truth for re-upload.

## Unresolved questions
- Does inbox `info@myvivatour.com` show the test form submission? (anh confirm)
- Want to add `Dentist` / `LocalBusiness` schema in next iteration?
- Page very long on mobile (43k px) — split into hub + detail pages, or keep monolith?
