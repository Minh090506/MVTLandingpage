# FIX report — T8 form_id + T8b tour_id + T8c QA bugs

**From:** fix NT2 (primary fixer)  
**To:** NT1 / conductor  
**Date:** 2026-08-12  
**Assignment:** `.harness/assignments/T8-form-id-and-tour-id.md`  
**Status:** DONE  
**FIXED:** YES

---

## Root cause (confirmed by scout, assignment diagnosis)

1. **T8 `form_id` null in DB**  
   `lead-attribution-client` monkey-patches `fetch` and forwards the **Web3Forms body** as-is to `/api/lead`. Client already maps `formId → form_id` but **no page put either key in the body**. GA4 still had `form_id` via separate `dataLayer.push`. Fix is page-side only — **did not touch** `worker-modules/lead-attribution-client.js`.

2. **T8b `tour_id` missing**  
   happytours `tour_*` events used `tour_interest` / `tour_code` / `tour_name` inconsistently; only `tour_itinerary_open` already pushed `tour_id`. Spec § tour_* requires `tour_id`.

3. **T8c QA**  
   - B6: happytours popup dataLayer missing `popup_id` + `form_id` (GTM maps those).  
   - B4: `.tour-selector-card` matches `[onclick*="smoothScroll"]` → dual `cta_click` + giant text.  
   - B5: `whatsapp_click` missing `cta_text`.  
   - B1: dental exit popup never pushed `popup_shown`.

---

## Changes

### T8 — `form_id` in lead payload

| File | Change |
|---|---|
| `pages/escape/index.html` | `#bookingForm` + `#exitForm` hidden `name="form_id"` |
| `pages/happytours/index.html` | same |
| `pages/dental-implants-vietnam/index.html` | `#bookingForm` hidden; exit popup object literal `form_id: 'exitPopup'` |

Values: `bookingForm` / `exitForm` / `exitPopup` — match existing dataLayer.

### T8b — `tour_id` on happytours `tour_*`

| Event | Change |
|---|---|
| `tour_source_click` (3 links) | add `tour_id: 'VHM10'\|'V7'\|'VLU10'` |
| `tour_helper_card_click` | add `tour_id: code` (from radio `data-tour-code`) |
| `tour_cta_click` | add `tour_id: code` |
| `tour_card_click` | map via `#tour_${tourKey}` `data-tour-code` (empty if missing / not sure) |
| `tour_itinerary_open` | **unchanged** (already had `tour_id`) |

Kept `tour_interest` / `tour_code` / `tour_name` everywhere they existed.

### T8c — QA bugs

| ID | Fix |
|---|---|
| B6 | happytours `popup_shown` + `popup_submit`: add `popup_id: 'exit_popup'`, `form_id: 'exitForm'`; keep `popup_type` |
| B4 | skip `cta_click` when `cta.closest('.tour-selector-card')`; cap all `cta_text` ≤100 chars + collapse whitespace via `mvtCtaText` |
| B5 | `whatsapp_click` adds `cta_text` via `mvtCtaText` |
| B1 | dental: push `{ event: 'popup_shown', popup_id: 'exit_popup' }` once when overlay shown (`exitShown` gate) |

### Tests + build

| File | Change |
|---|---|
| `scripts/test-lead-attribution-client.mjs` | +13 checks: form_id dual-send, sequential no-stale, formId normalise, static HTML contract for all 6 paths |
| `worker.js` | regenerated via `node build.js` only |

---

## Verification (fresh runs)

```
node scripts/test-lead-attribution-client.mjs  → 42/42 ok (was 29)
node scripts/test-lead-ingest-handler.mjs      → 32/32 ok
node scripts/validate-landing-pages.js         → PASS 6 page / 58 CDN
node build.js                                  → worker.js generated (idempotent rebuild ok)
```

**Not done (per constraints):** no commit/push/PR; no real form submit to prod; no GTM tag changes; no touch of `worker-modules/*` or `build.js` source.

---

## Blast radius / non-goals preserved

- Dual-send unchanged: Web3Forms = UX path; `/api/lead` fire-and-forget.
- dataLayer form_success / form_submit pushes not reworked (only popup params + tour_id + cta/whatsapp).
- Hero / nav `.cta-button` still fire `cta_click` (only tour-selector cards suppressed).
- Form reset keeps hidden `form_id` (browser resets to default attribute value).

---

## Unresolved

- None for this assignment. Escape `popup_shown` still only has `popup_type` (out of T8c scope — only happytours B6 was listed).
- Deploy/commit: NT1.
- GTM `tour_*` tags: deferred per Minh.

---

## Harness return summary

```
Status: DONE
Summary: T8 form_id on all 6 form paths; T8b tour_id on 5 tour_* events; T8c B6/B4/B5/B1 fixed. 42 attribution + 32 ingest + validate PASS.
Report: plans/reports/from-fix-nt2-to-nt1-260812-1635-form-id-payload-and-tour-id-schema.md
Concerns/Blockers: none
```
