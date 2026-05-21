# Phase 02 — Build Integration: Worker Config + Routing

**Priority:** P0 — blocks deploy
**Status:** pending
**Depends on:** Phase 01
**Est:** 20–30 min

## Goal
Register the dental LP in `build.js` so it bundles into the main `worker.js`, and add host-based default routing so `implant.vietnamdentaltravel.com/*` serves the dental page directly. Remove the obsolete standalone `worker-dental.js` (Apr 15 leftover).

## Files to modify
- `build.js` — add PAGES_CONFIG entry + HOST_DEFAULTS entry
- `worker-dental.js` — delete (obsolete; unified into main worker.js)
- `wrangler.toml` — verify no separate dental worker config (audit; leave if not present)

## Edits

### A. `build.js` — add to PAGES_CONFIG (line ~119)

Folder structure mismatch: existing nested path is `pages/vietnamdentaltravel/dental-implants-vietnam/` (depth 2), but `readPageHTML(folderName)` expects depth 1 at `pages/<folder>/index.html`.

**Two options:**

**Option A (RECOMMENDED): Flatten folder** — move `pages/vietnamdentaltravel/dental-implants-vietnam/` → `pages/dental-implants-vietnam/`. Single-level folders match existing pattern (escape, happytours).
- Pros: zero build.js logic changes, follows existing convention
- Cons: drops the nested `vietnamdentaltravel/` namespace folder (acceptable — brand identity lives in HTML content, not folder path)

**Option B: Extend build.js** to support nested paths via PAGES_CONFIG explicit `htmlPath`.
- Pros: keeps current folder
- Cons: extra build.js complexity, deviates from convention

→ **Pick Option A**.

### Steps for Option A

1. `git mv pages/vietnamdentaltravel/dental-implants-vietnam pages/dental-implants-vietnam` (preserves images subfolder)
2. Remove empty `pages/vietnamdentaltravel/` parent directory if empty
3. Add to `build.js` `PAGES_CONFIG`:

```javascript
'dental-implants-vietnam': {
  path: '/dental-implants-vietnam',
  name: 'Dental Implants Vietnam — VietnamDentalTravel'
},
```

4. Add to `build.js` `HOST_DEFAULTS` (around line 294 in fetch handler template string):

```javascript
const HOST_DEFAULTS = {
  'happytours.myvivatour.com': '/happytours',
  'implant.vietnamdentaltravel.com': '/dental-implants-vietnam',
};
```

5. Run `node build.js` — verify output `worker.js` includes `PAGE_DENTAL_IMPLANTS_VIETNAM` constant + new route.

### B. Cleanup
- Delete `worker-dental.js` (no longer needed)
- Delete `build-dental.js` if present (was the generator for the standalone worker)
- Verify `wrangler.toml` doesn't reference a separate dental worker name

### C. Verify image paths
After flatten, all `<img src="images/...">` in the HTML stay valid (images subfolder moves with the index.html). But `worker.js` only serves HTML — image URLs need to resolve from somewhere.

**Decision:** Images are referenced as `images/xxx.webp` in HTML (relative). The CF Worker only serves HTML routes, not image assets. Two paths:
- **Quick fix:** Rewrite `<img src="images/...">` → absolute URL on Supabase Storage (existing pattern in escape page) OR keep references and add image handling to worker.js
- **Recommended:** Upload all 36 images to Supabase (`landing-images/dental-implants-vietnam/`) per existing project pattern (`scripts/upload-to-supabase.js`), then rewrite `<img src>` paths in HTML to absolute Supabase URLs.

This is a **deferred sub-task** — Phase 01 keeps relative paths, Phase 02 runs the upload + rewrite. Add as a checklist item below.

### D. Image upload + path rewrite (sub-step)
- [ ] Run `node scripts/upload-to-supabase.js pages/dental-implants-vietnam/images/` (or equivalent — verify script flags)
- [ ] Confirm 36 webp files uploaded to `landing-images/dental-implants-vietnam/`
- [ ] `sed` or `Edit` all `images/xxx.webp` → `https://tnwelgvypmhhksqwnfmr.supabase.co/storage/v1/object/public/landing-images/dental-implants-vietnam/xxx.webp` in `index.html`
- [ ] Re-run `node build.js`
- [ ] Spot-check rendered page locally (`npx wrangler dev`) — images load

## Success criteria
- [ ] `pages/dental-implants-vietnam/index.html` exists (moved from nested location)
- [ ] `worker-dental.js` and `build-dental.js` deleted
- [ ] `build.js` PAGES_CONFIG includes the dental entry
- [ ] `HOST_DEFAULTS` includes `implant.vietnamdentaltravel.com` → `/dental-implants-vietnam`
- [ ] `node build.js` exits 0; `worker.js` contains `PAGE_DENTAL_IMPLANTS_VIETNAM` substring
- [ ] All 36 dental images live on Supabase, HTML references updated
- [ ] `npx wrangler dev` serves the page at both `/dental-implants-vietnam` and (with Host header override) at `implant.vietnamdentaltravel.com/`

## Risks
- Moving the folder breaks any external link bookmarks → low risk (page not yet public)
- Supabase upload fails for some images → re-run upload, keep relative paths as fallback
- `worker.js` exceeds free CF size limit when adding 100+ KB of dental HTML → unlikely (escape+happytours+dental < 700KB); monitor
