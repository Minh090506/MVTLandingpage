# MVT Landing Page — Project Overview

**Last Updated:** 2026-05-24
**Status:** 3 LPs live in production
**Repo:** https://github.com/Minh090506/MVTLandingpage

## What this project is

A multi-landing-page system for **MyVivaTour** (tour operator) and sibling brand **VietnamDentalTravel** (dental tourism). All landing pages are bundled into a single Cloudflare Worker via a Node.js build step. Each page can be served on a brand-specific subdomain.

Target market: **Australia** (English content, AUD pricing, Aussie spelling).

## Live landing pages

| Page | URL | Topic | Price anchor |
|---|---|---|---|
| `escape` | https://escape.myvivatour.com/ | 10-Day Vietnam Tour | $2,099 AUD |
| `happytours` | https://happytours.myvivatour.com/ | Multi-tour packages hub | — |
| `dental-implants-vietnam` | https://implant.vietnamdentaltravel.com/ | Dental implants in Hanoi | AUD 1,220 from |

Plus 3 placeholder routes (`/honeymoon`, `/family-tour`, `/luxury-cruise`) that 301-redirect to `happytours#tour-*` anchors.

## Why a single repo for two brands

- **One worker.js** serves all subdomains via host-header routing (`HOST_DEFAULTS` map in `build.js`).
- **One Supabase bucket** (`landing-images`) stores all assets under per-page subfolders.
- **One CI/CD** (`deploy.yml`) builds + deploys to multiple worker names (escape-myvivatour, vietnamdentaltravel, mvt-dashboard).
- Brands are namespaced by HTML content, not by separate codebases.

## Brand voice

| Brand | Tone | Lead message |
|---|---|---|
| MyVivaTour | Adventurous, value-focused, Australian-friendly | "Authentic Vietnam holidays with hotels, meals, and English-speaking guides included." |
| VietnamDentalTravel | Trust-first, expert-led, family-warm | "Not just care. Family-level support." |

## Conversion stack (shared across all pages)

- **Form provider:** Web3Forms (key `cf0ca620-d064-4640-9454-afb27d588f67`, destination `info@myvivatour.com` — verify in Web3Forms dashboard).
- **WhatsApp:** `+84 974 036 614` (https://wa.me/84974036614).
- **Tracking:** GTM `GTM-TPQWV864`, GA4 `G-2R0EJ2LBJ5`, Google Ads `AW-17709107883`/`Wq0ECKXBmfsbEKuVrvxB`, Facebook Pixel `579298288600609`.
- **TripAdvisor reviews** are injected at build time from `data/tripadvisor-reviews.json` into pages that have `<!-- TA-REVIEWS-START -->` markers (currently used by `escape`).

## Why this architecture

| Need | Choice | Rationale |
|---|---|---|
| Edge serving | Cloudflare Workers | Free tier covers traffic, global PoPs, sub-100ms TTFB worldwide |
| Image CDN | Supabase Storage | Free tier, already in MyVivaTour stack, public bucket needs no auth |
| Form handling | Web3Forms | No backend, free tier covers volume, simple `access_key` model |
| Build step | Plain Node.js script (`build.js`) | No framework lock-in, single file readable in 1 minute, no node_modules needed at runtime |
| Page authoring | Hand-written HTML in `pages/<page>/index.html` | Per-page total control over markup, SEO, schema — no template framework to fight |

Trade-offs:
- ⚠️ No CSS/JS bundling — each page is self-contained (CSS/JS inline), duplicates across pages
- ⚠️ Image binaries NOT served by Worker — must use absolute Supabase URLs in HTML
- ⚠️ Worker size budget 1MB (CF free) → currently ~564KB with 3 pages; ~3 more pages fits comfortably

## Tracking IDs reference

| System | ID | Where to find |
|---|---|---|
| GTM | `GTM-TPQWV864` | Google Tag Manager |
| GA4 | `G-2R0EJ2LBJ5` | Property hợp nhất cho tất cả landing page |
| Google Ads | `AW-17709107883` | Customer 572-470-7852 |
| Ads conversion label | `Wq0ECKXBmfsbEKuVrvxB` | send_to: `AW-17709107883/Wq0ECKXBmfsbEKuVrvxB` |
| Facebook Pixel | `579298288600609` | Business 623339086973908 |

## Status & roadmap

### ✅ Complete
- 3 pages live with full conversion stack (form, WhatsApp, tracking)
- Supabase image upload pipeline via `[upload-images]` commit flag
- Subdomain routing for both myvivatour.com and vietnamdentaltravel.com zones
- Lessons learned codified in [CLAUDE.md → Pitfalls & Patterns](/CLAUDE.md)

### 🔲 Possible next steps
- Add `Dentist` + `LocalBusiness` Schema.org types for richer dental LocalSEO
- Split `dental-implants-vietnam` long page (43k px mobile) into hub + sub-pages
- Replace `pages/<page>/images/` git-tracked binaries with `.gitignore`d source folder (Supabase is source of truth)
- Bundle shared CSS/JS into worker.js to reduce per-page duplication

## Unresolved questions
- Form destination email for Web3Forms — needs anh confirm via inbox check (test submission sent).
- Domain ownership for `.au` TLD (e.g. `dentalvietnam.com.au`) — currently using `.com` subdomains only.
