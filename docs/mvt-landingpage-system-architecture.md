# MVT Landing Page — System Architecture

**Last Updated:** 2026-05-24
**Purpose:** Single source of truth for how HTML pages become production worker.js deployments across multiple subdomains.

## High-level flow

```
pages/<page>/index.html            (hand-written HTML, CSS/JS inline)
        │
        ▼
   node build.js                   (Node script — no deps at build time)
        │   - reads PAGES_CONFIG entries
        │   - injects TripAdvisor JSON data into pages with marker
        │   - generates 404 + sitemap + robots handlers
        │   - emits host-based default routing (HOST_DEFAULTS)
        ▼
   worker.js                       (single file, ~564 KB, AUTO-GENERATED)
        │
        ▼
   3× wrangler deploys             (escape-myvivatour, vietnamdentaltravel, mvt-dashboard)
        │
        ▼
  Cloudflare Workers Edge
        │
        ▼
  Routes (zone-bound):
    escape.myvivatour.com/*          → escape-myvivatour worker → / (escape page)
    happytours.myvivatour.com/*      → escape-myvivatour worker → /happytours (host-default)
    implant.vietnamdentaltravel.com/* → vietnamdentaltravel worker (same worker.js) → /dental-implants-vietnam
    googlead.myvivatour.com/*        → mvt-dashboard worker (route set manually in CF dashboard,
                                        NOT declared in wrangler-dashboard.toml — see that file's
                                        header comment for why)
```

## Repository layout

```
MVTLandingpage/
├── pages/                                          # Source HTML for each LP
│   ├── escape/index.html                           # Homepage on escape.myvivatour.com
│   ├── happytours/index.html
│   ├── dental-implants-vietnam/
│   │   ├── index.html                              # Page HTML (refs Supabase image URLs)
│   │   └── images/*.webp                           # Source-of-truth binaries (synced to Supabase)
│   └── (honeymoon, family-tour, luxury-cruise → 301 redirects, no HTML)
├── data/
│   └── tripadvisor-reviews.json                    # Injected into pages with TA-REVIEWS-START marker
├── build.js                                        # Page bundler (~400 lines)
├── worker.js                                       # GENERATED — do not edit
├── wrangler.toml                                   # Main worker config (escape-myvivatour)
├── wrangler-dental.toml                            # Same worker.js, different name + custom_domain route
├── wrangler-dashboard.toml                         # Dashboard worker (mvt-dashboard)
├── dashboard.html, build-dashboard.js              # Dashboard-specific build (separate from LPs)
├── scripts/
│   ├── upload-to-supabase.js                       # Image upload to landing-images bucket
│   └── puppeteer-landing-page-screenshot-and-audit.js  # Headless audit tool
└── .github/workflows/
    ├── deploy.yml                                  # Build + deploy 3 workers + optional image upload
    └── deploy-dental.yml                           # Fast path for dental-only edits
```

## Routing logic (worker.js fetch handler)

Generated code follows this priority order:

1. **Favicon** (`/favicon.ico`) → 204 No Content
2. **Sitemap** (`/sitemap.xml`) → generated from ROUTES map
3. **Robots** (`/robots.txt`) → generated
4. **301 redirects** (`REDIRECTS` map) — used for placeholder paths consolidating onto happytours anchors
5. **Host-based default** — if `pathname === '/'` AND `HOST_DEFAULTS[hostname]` exists, rewrite path to that subdomain's page
6. **Direct route match** — lookup `ROUTES[pathname]`, serve corresponding page constant
7. **Fallback** — 404 page with links to all live pages

## Cross-zone subdomain pattern

`vietnamdentaltravel.com` is a separate Cloudflare zone from `myvivatour.com`. To serve a page on `implant.vietnamdentaltravel.com`:

1. Create `wrangler-dental.toml`:
   ```toml
   name = "vietnamdentaltravel"
   main = "worker.js"                # Same worker.js as escape-myvivatour
   compatibility_date = "2024-01-01"
   workers_dev = true

   [[routes]]
   pattern = "implant.vietnamdentaltravel.com"
   custom_domain = true
   ```

2. Deploy via `wrangler deploy -c wrangler-dental.toml` — Cloudflare auto-creates the DNS record and binds the route.

3. Add to `HOST_DEFAULTS` in build.js so root `/` on the subdomain serves the dental page:
   ```javascript
   const HOST_DEFAULTS = {
     'happytours.myvivatour.com': '/happytours',
     'implant.vietnamdentaltravel.com': '/dental-implants-vietnam',
   };
   ```

Same `worker.js` artifact, two worker deployments, two custom domains. No code duplication.

## Image hosting model

Images do NOT live in the Worker. Worker handlers only serve text/html responses. All `<img src="...">` references in page HTML must use absolute Supabase Storage URLs:

```
https://tnwelgvypmhhksqwnfmr.supabase.co/storage/v1/object/public/landing-images/<page>/<file>.webp
```

Source `.webp` files in `pages/<page>/images/` are uploaded to the matching Supabase path by `scripts/upload-to-supabase.js`. The upload script auto-scans the `pages/` tree and maps folder names to bucket prefixes.

Trigger upload via:
- `git commit -m "... [upload-images]"` → CI/CD picks up the flag and runs the upload job
- OR `gh workflow run deploy.yml --ref main` (workflow_dispatch also triggers)
- OR locally with `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` env vars

## Form submission flow

```
User fills form
  → fetch POST https://api.web3forms.com/submit
    with payload { access_key, name, email, phone, state, treatment, message, timeline, referral, subject, from_name, replyto }
  → Web3Forms validates origin against allowed list
  → Web3Forms routes email to address registered in dashboard for that access_key
  → On success (200):
    - gtag('event', 'conversion', { send_to: 'AW-17709107883/Wq0ECKXBmfsbEKuVrvxB' })
    - fbq('track', 'Lead')
    - Show success state, hide form
  → On failure: alert with WhatsApp fallback
```

The destination email (`info@myvivatour.com`) is configured in the Web3Forms dashboard, NOT in HTML. Cannot be verified by reading the code — must submit a real test entry.

## CI/CD pipelines

### `deploy.yml` — Main workflow
**Triggers:** push to main on `pages/**`, `build.js`, `wrangler*.toml`, `dashboard.html`, `build-dashboard.js`, `.github/workflows/deploy.yml` OR `workflow_dispatch`.

**Steps:**
1. Checkout + setup Node 20
2. `node build.js` → emit worker.js
3. Deploy escape-myvivatour worker
4. `node build-dashboard.js` → emit dashboard-worker.js
5. Deploy mvt-dashboard worker
6. Deploy vietnamdentaltravel worker (same worker.js, different toml)
7. Write deployment summary
8. **Conditional job** `upload-images`: if commit message contains `[upload-images]` OR triggered via workflow_dispatch — runs `scripts/upload-to-supabase.js` on Node 22 (required by @supabase/supabase-js for native WebSocket)

### `deploy-dental.yml` — Fast path
**Triggers:** push to main on `pages/dental-implants-vietnam/**` OR `wrangler-dental.toml`.

Runs build.js + dental worker deploy only. Skips dashboard for faster iteration on dental LP.

## Schema.org coverage (per page)

Standard 4 types embedded in HTML head:
- `MedicalBusiness` / `TravelAgency` (Organization)
- `Product` / `TouristTrip` with Offer
- `FAQPage` (rich snippets)
- `BreadcrumbList`

Page-specific additions:
- Dental LP: could add `Dentist` + `LocalBusiness` (not yet added — see project-overview "Possible next steps")
- Tour LPs: could add `TouristTrip.itinerary` with day-by-day breakdown

## Where things live (quick reference)

| Concern | File / Location |
|---|---|
| Add new LP | `pages/<name>/index.html` + entry in `build.js` PAGES_CONFIG |
| Change subdomain routing | `HOST_DEFAULTS` in `build.js` |
| Cross-zone subdomain | New `wrangler-<brand>.toml` + add deploy step to `deploy.yml` |
| Tracking IDs | Already wired in HTML; if changing, search/replace across all pages |
| Form destination email | Web3Forms dashboard (NOT in repo) |
| Image upload secrets | GitHub Secrets `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` |
| Cloudflare API token | GitHub Secret `CLOUDFLARE_API_TOKEN` |
| TripAdvisor reviews data | `data/tripadvisor-reviews.json` (injected by build.js) |

## Performance budget (current)

| Metric | Target | Current (dental LP) |
|---|---|---|
| FCP mobile | < 2.5s | ~2s |
| Worker.js size | < 1 MB (CF free) | 564 KB |
| Cache-Control | `max-age=3600` (1h HTML) | ✓ Set in worker.js |
| Image format | WebP | ✓ All 35 dental images |
| Lazy-load images | `loading="lazy"` | ✓ Below-fold imgs tagged |
