# Post-Deploy: Supabase Image Upload Required

**Status:** ⚠️ Required before LP renders correctly

## What was done in Phase 02
- 22 relative image references in `pages/dental-implants-vietnam/index.html` rewritten from `images/xxx.webp` → `https://tnwelgvypmhhksqwnfmr.supabase.co/storage/v1/object/public/landing-images/dental-implants-vietnam/xxx.webp`
- The 35 source `.webp` files are still in `pages/dental-implants-vietnam/images/` (kept as source-of-truth, not deleted)

## What user must do manually

Set Supabase service credentials, then run the project's upload script:

```bash
export SUPABASE_URL=https://tnwelgvypmhhksqwnfmr.supabase.co
export SUPABASE_SERVICE_KEY=<service-role-key-from-vault>

node scripts/upload-to-supabase.js
```

The script (per its header doc) automatically scans `pages/*/images/` and uploads to `landing-images/<folder>/`. So `pages/dental-implants-vietnam/images/*.webp` will land at `landing-images/dental-implants-vietnam/*.webp` — matching the URLs already baked into `worker.js`.

## Verification after upload
```bash
# Test one URL is publicly reachable
curl -I "https://tnwelgvypmhhksqwnfmr.supabase.co/storage/v1/object/public/landing-images/dental-implants-vietnam/hero-banner.webp"
# Expect HTTP 200, content-type image/webp
```

Then open `https://implant.vietnamdentaltravel.com/` (or the deployed URL) — images should load.

## Why not just put images on the Worker?
- Cloudflare Workers don't serve binary assets from the script bundle efficiently (each Worker invocation reads the bundle into memory)
- The project's existing escape/happytours pages already use Supabase Storage as the CDN — same pattern, same bucket
- Supabase Storage is free for the volume here (~2 MB total for 35 images) and CDN-cached globally

## Files referenced (22 unique paths)
- `csvc-dental-chair.webp`, `csvc-equipment-2.webp`, `csvc-equipment.webp`, `csvc-sterilization-2.webp`, `csvc-sterilization.webp`, `csvc-treatment-room-2.webp`, `csvc-treatment-room.webp`, `csvc-waiting-room-2.webp`, `csvc-waiting-room.webp`
- `doctor-team.webp`
- `implant-allon6-model.webp`, `implant-components.webp`, `implant-model-3d.webp`
- `logo-color.webp`
- `real-patient-1.webp` ... `real-patient-6.webp`
- (Plus hero-banner.webp loaded via CSS `background-image`)

All 35 source files present in `pages/dental-implants-vietnam/images/` — ready to upload.
