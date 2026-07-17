---
name: mvt-landingpage
description: "Build premium landing pages for MyVivaTour tour packages, deployed via Cloudflare Workers with images on Supabase Storage. Use this skill whenever the user asks to create a landing page, tour page, product page, or marketing page for myvivatour.com — including any subdomain like escape.myvivatour.com, 10days.myvivatour.com, etc. Also trigger when the user mentions 'landing page' together with 'tour', 'travel', 'vivatour', or 'cloudflare worker'. This skill covers the entire workflow: scraping tour data, designing the page, optimizing images, hosting on Supabase, generating the Cloudflare Worker, and deploying."
---

# MVT Landing Page Builder

Build premium, high-converting landing pages for MyVivaTour tour packages. Each page is a single-file HTML deployed via Cloudflare Workers, with images hosted on Supabase Storage.

## When to Use

This skill covers the end-to-end workflow of creating a tour landing page for myvivatour.com subdomains. The output is a production-ready landing page that loads fast, looks premium, and converts visitors into inquiries.

## Architecture Overview

The landing page follows a **single-file deployment model**:
- One `index.html` file (~90KB) with all CSS and JS inline
- Images hosted externally on Supabase Storage (public CDN)
- Served via Cloudflare Worker that embeds the HTML as a template literal
- Custom subdomain on myvivatour.com (e.g., `escape.myvivatour.com`)

This architecture is chosen because Cloudflare Workers are fast (edge-deployed globally), free for low traffic, and the user already has the DNS setup on myvivatour.com.

## Complete Workflow (follow these steps in order)

### Phase 1: Gather Tour Data

> **SOURCE OF TRUTH — NON-NEGOTIABLE.** The corresponding tour page on `myvivatour.com/tour/<slug>/` is the single source of truth for every landing page. ALWAYS pull price, itinerary (day-by-day), number of days/nights, and included/excluded services from that page — never invent, carry over stale values, or trust the LP's own prior content. This prevents info drift between the LP and the real tour. Each LP tour must record its source URL (in the plan-folder memory file and in `~/.claude/.../memory/happytours-tour-source-urls.md` for the multi-tour LP). When re-checking or updating an existing LP, re-fetch the source tour first and reconcile every field. If the site "from" price is in USD and the LP shows AUD, keep the user-confirmed AUD figure but verify duration/itinerary/inclusions against the source.

1. **Scrape tour info** from the `myvivatour.com/tour/<slug>/` product page. WebFetch is blocked (403) for myvivatour.com — use Firecrawl MCP (`firecrawl_scrape`), or fall back to `curl -A "<browser User-Agent>"` (a real browser UA returns HTTP 200; the plain bot UA is blocked).
   - Extract: tour name, tour ID, duration (days/nights), price, was-price, inclusions, exclusions, day-by-day itinerary, domestic-flight count, upgrade options
   - Confirm whether **international airfare** is included: land-only tours run "Day 1 <city> Arrival → final day <city> Departure" and do NOT include international flights — state this clearly on the LP (domestic Vietnam flights may still be included)
   - Use JSON format with schema for structured extraction

2. **Scrape design reference** from an existing landing page (e.g., `10days.myvivatour.com`) using Firecrawl with `branding` format to get colors, fonts, spacing.

3. **Collect images from the company asset library FIRST** (real photos only — no AI, no video-frame extraction for static images). Google Drive shared drive Marketing, mounted at `~/Library/CloudStorage/GoogleDrive-<email>/Shared drives/Marketing/MY VIVA TOUR/`:
   ```
   MVT_Kho ảnh/Kho ảnh (theo địa điểm)/{Location}/WEBP/Banner Tours (1920x743)/{Loc}_N.webp   ← curated, watermarked, already-optimized WebP
   MVT_Kho video/Kho video (theo địa điểm)/{Location}/                                        ← hero-loop footage (mostly portrait; landscape 16:9 is rare)
   ```
   Terminal needs macOS Full Disk Access to read the mount (`Operation not permitted` → grant FDA, restart Terminal). Fallbacks: og:image from the canonical tour page, or `wp-content/uploads/YYYY/MM/` destination shots. Only ask the user for images when the library has no match.

### Phase 2: Build the Landing Page

4. **Optimize images** — **WebP is the default format** (repo standard). Company photo library "Banner Tours (1920x743)" images are already optimized WebP — copy straight. For conversions use `cwebp -q 82 in.png -o out.webp` (homebrew ffmpeg lacks libwebp — extract frame to `.png` with ffmpeg first, then cwebp/magick). Target specs:
   - Hero banner: 1920x743, ~250KB
   - Destination cards: 600x400, ~50-80KB
   - Gallery images: 800x600, ~80-165KB
   - Itinerary banners: 1200x465, ~120-190KB
   - Tour map: 800x800, ~95KB
   - Save into `pages/{tour-slug}/images/` (source of truth, synced to CDN) with consistent naming:
     - `hero-{subject}.webp`, `dest-{city}.webp`, `gallery-{subject}.webp`
     - `itin-{city}.webp`, `tour-map-{tourID}.webp`

5. **Create `index.html`** — a single-file HTML with inline CSS and JS. Use the design system below and include all sections in order. Refer to:
   - `references/design-system.md` for CSS variables, component styles, and section templates
   - `references/tripadvisor-integration.md` for the TripAdvisor reviews integration (scraping, schema, build pipeline, n8n auto-rotation)
   - `references/mobile-emulation-testing-with-playwright.md` for mobile/responsive testing — **DO NOT use Chrome `--screenshot --window-size` for mobile verification** (sets window only, viewport stays desktop). Always use Playwright with `viewport + isMobile: true + deviceScaleFactor: 2` context
   - `references/multi-tour-landing-page-with-smart-sticky-bar-and-preview-cards.md` for **multi-tour LPs** (2–4 tours sharing one URL, e.g. happytours.myvivatour.com bundling Honeymoon + Family + Luxury). Covers selector cards with preview images, per-tour color theming, IntersectionObserver-driven sticky bar price-sync, compare table with top+bottom swipe hints, shared booking form with `tour_interest` radio, host-based routing (`HOST_DEFAULTS`), scroll-margin-top fix, aggressive section trimming
   - `references/higgsfield-living-photo-cinematic-effects-layer.md` for the **optional premium motion layer** — Higgsfield image-to-video on REAL company photos (cinemagraph "living photo" cards, ambient section motion, hero-loop fallback when footage is missing). Includes routing rule (photoreal-on-real-photos ONLY for conversion LPs; diorama = brand/edu via `mvt-video-3d`), perfect-loop recipe (`--start-image` = `--end-image` = same photo), budget gates, and the escape theme spec

### Phase 3: Host Images on Supabase (canonical: repo CI pipeline)

> The bucket `landing-images` (project `tnwelgvypmhhksqwnfmr`) already exists and is public. Path convention: `landing-images/{page-folder-name}/{file}.webp`. Bucket has an `allowed_mime_types` whitelist (jpeg/png/webp + mp4/webm) — adding a new format requires a SQL update or upload silently 404s on CDN while CI stays green.

6. **Place optimized `.webp` files in `pages/{tour-slug}/images/`** — this folder is the source of truth; `scripts/upload-to-supabase.js` auto-scans it.

7. **Use absolute Supabase URLs in HTML** — the Worker serves HTML only, never image binaries. NEVER use relative `images/foo.webp` in `<img src>` **or CSS `background: url(...)`** (the CSS case is the classic silent miss — grep `url\(['"]?images/` to verify):
    ```
    https://tnwelgvypmhhksqwnfmr.supabase.co/storage/v1/object/public/landing-images/{page}/{filename}
    ```

8. **Upload via CI**: commit with `[upload-images]` flag in the message → GitHub Actions runs the upload job. Or manual dispatch: `gh workflow run deploy.yml --ref main`. Supabase upload is upsert (same path overwrites) — after replacing an image, verify served `content-length` matches the new file.

9. **Verify every image URL returns 200**:
    ```bash
    for img in $(ls pages/{page}/images/); do
      curl -sI "https://tnwelgvypmhhksqwnfmr.supabase.co/storage/v1/object/public/landing-images/{page}/$img" \
        -o /dev/null -w "%{http_code}" | grep -q 200 || echo "FAIL: $img"
    done
    ```

10. **Fallback (only when working OUTSIDE this repo/CI)**: create bucket via Supabase MCP SQL insert, deploy an `upload-image` Edge Function (verify_jwt: false, service_role key), and upload via a local `auto-upload.html` with base64-inlined images opened in the browser. Always call `get_publishable_keys` for the current anon key — it changes after project restore.

### Phase 4: Build & Deploy (canonical: build.js + GitHub Actions)

11. **Register the page** in `build.js`:
    - Add to `PAGES_CONFIG`: `'{tour-slug}': { path: '/{tour-slug}', name: 'Display Name' }`
    - If the LP gets its own subdomain, add to `HOST_DEFAULTS` (see Multi-Page Build Pipeline section)
    - Different zone (e.g. vietnamdentaltravel.com) → dedicated `wrangler-<brand>.toml` with `main = "worker.js"` + `[[routes]] custom_domain = true`, plus a deploy step in `.github/workflows/deploy.yml`

12. **Build + deploy**: `node build.js` (regenerates `worker.js` — NEVER edit it directly) → `git push origin main` → GitHub Actions deploys all workers. Manual: `npx wrangler deploy --name escape-myvivatour`. Note: `deploy.yml` has `paths:` triggers — changes only under `scripts/` or `.github/` don't trigger it; use `gh workflow run deploy.yml --ref main`.

13. **Fallback (outside this repo)**: generate a standalone worker with `scripts/gen_worker.py` (escapes backticks/`${}`, wraps in fetch handler) and paste into the Cloudflare dashboard manually — write step-by-step instructions for the user if Chrome MCP is unavailable.

### Phase 5: Verify

14. **Test the live page** — verify routes (`/`, `/{tour-slug}`), sitemap.xml contains the new URL, form submits (must be via browser/puppeteer — Web3Forms blocks server-side curl on free plan; confirm 200 + check inbox `info@myvivatour.com`).

15. **Run the audit script** and check gates:
    ```bash
    node scripts/puppeteer-landing-page-screenshot-and-audit.js <URL> /tmp/lp-audit/ r1
    ```
    - `layout.hasHorizontalScroll` = false (the REAL mobile gate — ignore `overflowing` entries that live inside intentional `overflow-x:auto` containers)
    - `tracking.*` all 5 IDs present · `consoleErrors` = [] · `perf.fcp` < 2500ms mobile
    - `seo.imgsMissingAlt`: `1` is usually the decorative hero `alt=""` false positive — verify by grepping for `<img` lacking `alt=` entirely
    - Reveal-animation artifact: `.section-reveal` sections screenshot as blank if auto-scroll outruns IntersectionObserver — scroll stepwise (~200px / 60ms) before capturing

## Design System

### Colors (CSS Variables)
```css
:root {
    --primary: #D4AF37;    /* Luxury gold */
    --dark: #111827;        /* Deep charcoal */
    --light: #F8FAFC;       /* Off-white background */
    --text-dark: #1F2937;   /* Body text */
    --text-light: #6B7280;  /* Secondary text */
    --border: #E5E7EB;      /* Borders */
    --success: #10B981;     /* Success/CTA green */
}
```

### Typography
- **Headings**: Playfair Display (Google Fonts) — elegant serif for luxury feel
- **Body**: Plus Jakarta Sans (Google Fonts) — clean modern sans-serif
- Responsive sizing: `clamp(2.5rem, 8vw, 4.5rem)` for H1, `clamp(2rem, 5vw, 3.5rem)` for H2

### Page Sections (in order — TRUST BEFORE PRICE, VALUE-STACK BEFORE FORM)

> **CRO rule v1 (shipped 2026-05-11):** Trust signals must appear BEFORE price reveal. Old order put Pricing right after Gallery → sticker shock killed 50+ demo conversion. Build trust via Why Us + Testimonials, then reveal price.
>
> **CRO rule v2 (shipped 2026-05-16):** "Why Choose This Tour?" (highlights/value-stack) must sit **directly before booking form**, NOT right after hero. Reason: value-stack adjacent to commit moment > value-stack as background info. The hero must be a single CTA (no inline form) — splitting intent between hero form + main form leaks ~15-25% conversions.

1. **Hero** — Full-viewport `<img class="hero-bg-img" fetchpriority="high">` (NOT CSS bg), trust bar with TripAdvisor link, headline, price badge, **SINGLE pulsing CTA** scrolling to `#booking` + reassurance line. **NO inline hero form** (see "Single-CTA Hero" pattern in Conversion section)
   - **Optional hero background video** (img-first, video-on-play — used on escape + happytours): keep the poster `<img class="hero-bg-img">` for FCP, add `<video class="hero-bg-video" autoplay muted loop playsinline>` at opacity 0; `onplaying` adds `hero-video-on` class → poster fades to 0, video to ~0.6 (never leave low-opacity video OVER the poster — you'll see the photo, not the video). `muted+playsinline` mandatory for mobile autoplay; `prefers-reduced-motion` hides video (poster stays — safe). Dark scrim `.hero::after` + 2-layer text-shadow keeps white copy readable. Encode: `scripts/build-hero-loop.sh single|montage` (ffmpeg 1280×720 H.264 CRF 30, ~1-2MB). Source clips ONLY from the company video library (see project CLAUDE.md §Nguồn ảnh/video); never use video frames as static `<img>` content.
2. **Destinations** — 6-card grid with overlay text, hover zoom effect
3. **Itinerary** — `<button class="accordion-header" aria-expanded>` pattern (NOT `<div>` — keyboard a11y) with day headers, content, meals/accommodation details
4. **Video** — **YouTube facade pattern, NOT bare `<iframe loading="lazy">`**. Render a poster `<div>` with `i.ytimg.com/vi/{ID}/maxresdefault.jpg` as background + orange play button. Click handler swaps the div for the real iframe with `autoplay=1`. Eliminates the ~600px blank box that bare lazy iframes create during scroll, saves ~500KB initial weight, fires `video_play` dataLayer event on activation. Full pattern in `references/js-gated-reveal-youtube-facade-and-brand-orange-cta-hierarchy.md`
5. **Gallery** — 8-image grid with lightbox modal (arrow key navigation, ESC close)
6. **Why MyVivaTour** — Trust section with 6 feature cards on gradient background (MOVED above Pricing)
7. **Testimonials** — TripAdvisor badge (rating + Travellers' Choice + ranking) + 6 native review cards (see TripAdvisor Integration section). Featured card pinned for any Aussie reviewer (`isAustralian: true` in JSON) with green border + 🇦🇺 corner badge
8. **Pricing** — Main price card (was/now) + 4 upgrade option cards (REVEAL HERE, after trust)
9. **FAQ** — Button-based accordion with common questions
10. **Highlights ("Why Choose This Tour?")** — 6 feature cards (flights, hotel, meals, guides, transfers, upgrades) on dark photo overlay. Placed RIGHT BEFORE booking form for trust-at-commit moment. **Includes bridge CTA** "Get My Free Quote ↓" + reassurance line at bottom — chains momentum straight into the form below
11. **Booking Form** — Web3Forms integration. 2-column layout: left = form card (elevated, with chips + departure city + smart placeholder — see `references/smart-booking-form-chips-and-bridge-cta.md`), right = "Get in Touch" panel (matching elevated style with SVG icons + mini testimonial). **Risk reversal strip placed BELOW submit button** as post-CTA reassurance (3 vertical rows with top border separator)
12. **Footer** — Company info, quick links, contact details

### Key JavaScript Features

- **Accordion**: Single-open pattern (closing previous when new opens)
- **Gallery Lightbox**: Click to open, arrow keys to navigate, ESC to close
- **Scroll Animations** (5 effects, shipped 2026-05-11; render-resilience added 2026-05-16) — see `references/scroll-animations-and-premium-polish-patterns.md` + `references/js-gated-reveal-youtube-facade-and-brand-orange-cta-hierarchy.md`:
  - Section header fade+slide-up (`.section-reveal`)
  - Card grid stagger (80ms delay per child via `data-stagger-group`)
  - Stat count-up for TripAdvisor numbers (1.2s easeOutCubic, `tabular-nums` → CLS=0)
  - Hero bg subtle parallax (`.hero-parallax-layer`, 0.3x scroll, desktop-only)
  - Active nav-link indicator (no new DOM — extends existing `nav#navbar`)
  - **All effects respect `prefers-reduced-motion: reduce`**
  - **CRITICAL (2026-05-16):** all `opacity: 0` baseline states MUST be gated behind `html.js` class set via inline `<script>` in `<head>` BEFORE any CSS renders. Otherwise slow CPUs, JS failures, or static snapshot tools (Lighthouse, Playwright fullPage, crawlers) see blank sections.
- **YouTube facade** (shipped 2026-05-16) — `.video-facade` div with poster bg + orange play button. Click handler swaps to real iframe with autoplay. See render-resilience reference.
- **Sticky Nav**: `position: fixed` + backdrop-filter blur. `nav.scrolled` switches to solid white bg + box-shadow after first scroll
- **Form**: Web3Forms API → email delivery, with WhatsApp prompt on success
- **Back to Top**: Shows after 300px scroll
- **Living-photo cards (optional premium motion layer)** — cinemagraph loops generated by Higgsfield image-to-video from the page's REAL photos, wired as poster-`<img>`-first + lazy `<video muted loop playsinline preload="none">` with IntersectionObserver play/pause, Save-Data + `prefers-reduced-motion` opt-outs. Max 2–3 per page; never on a conversion element's viewport region. Full recipe, prompts, budget gates + escape theme spec in `references/higgsfield-living-photo-cinematic-effects-layer.md`

### Premium Motion Layer routing (Higgsfield — decided 2026-07-17)

| Page type | Allowed AI motion | Pipeline |
|---|---|---|
| Conversion LP (price + booking form) | Photoreal animation of REAL photos only (living photos, ambient loops) | This skill + `references/higgsfield-living-photo-cinematic-effects-layer.md` |
| Brand / education / heritage content | Stylized 3D diorama scroll-world | `mvt-video-3d` + `scroll-world` skills |

Stylized/diorama imagery is BANNED on conversion LPs (user decision 2026-07-17: it doesn't answer the purchase question). AI may only animate real photography there — never invent scenes. Every Higgsfield spend needs a cost estimate + user approval BEFORE the first credit (run `higgsfield generate cost`; stop and ask if estimate > 70% balance).

### Brand Asset Preparation (CRITICAL — read before placing any logo)

See `references/brand-asset-preparation-transparent-logos-and-images.md`.

**TL;DR:** Logo on a semi-transparent navbar MUST be true-alpha PNG (or SVG). JPGs with baked-in white bg cause visible halo on tinted navbar backdrops (lesson learned 2026-05-12, escape page). Workflow:

```bash
# Convert JPG → transparent PNG → inline base64 (single-step prep)
magick logo.jpg -trim +repage -bordercolor white -border 10 \
  -fuzz 8% -transparent white -resize x200 -strip \
  -define png:compression-level=9 -colors 16 logo.png
base64 -i logo.png | tr -d '\n'   # paste output as data:image/png;base64,...
```

Inline if ≤10 KB base64 (saves an HTTP request, improves LCP). Apply to nav logo, badges, payment provider icons — anywhere an asset overlaps a non-opaque background.

## Integration Details

### Web3Forms (form-to-email)
- API endpoint: `https://api.web3forms.com/submit`
- Access key provided by user (unique per form destination)
- Hidden fields: `access_key`, `subject`, `from_name`, `botcheck` (honeypot)
- Success: show confirmation + offer WhatsApp contact
- Error: fallback to mailto + WhatsApp

### WhatsApp Integration
- Phone: user-provided (format: country code without +, e.g., 84974036614)
- Pre-filled message with inquiry details
- Link format: `https://wa.me/{phone}?text={encoded_message}`

### YouTube Embed (important attributes)
```html
<iframe src="https://www.youtube.com/embed/{VIDEO_ID}?rel=0&modestbranding=1"
  title="..." frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen loading="lazy">
</iframe>
```
Missing `allow` or `referrerpolicy` causes Error 153 on YouTube embeds.

## SEO / GEO / AEO Checklist (every LP, no exceptions)

Three layers, one pass. SEO = rank in Google; AEO = win the answer box / voice / AI-assistant citation; GEO = get quoted by generative engines (ChatGPT, Perplexity, Google AI Overviews).

### SEO (classic on-page)

- **Title format (MANDATORY)**: `[Duration] Vietnam [Type] from Australia $[Price] AUD | MyVivaTour [Year]` — always "holiday" (AU English, never "vacation"), always the year, always "from Australia", always AUD price. Keyword database + competitor table live in project `CLAUDE.md` §SEO Keywords Database.
- **Meta description 150–160 chars** — price, destinations, "holiday", CTA. Over 160 = truncated in SERP.
- **Canonical** to the official subdomain URL. **Hreflang** `en-au` + `x-default`.
- **OG + Twitter Card tags** — og:image must be THIS page's hero (absolute Supabase URL).
- **One H1, message-matched to Google Ads keyword** (`"10-Day All-Inclusive Vietnam Holiday from Australia"`, not brand-y taglines). H2s use Tier-2 destination keywords.
- Descriptive `alt` with target keyword on content images; decorative images `alt=""` + `aria-hidden="true"`.

### Schema.org JSON-LD stack (all required)

| Schema | Notes |
|---|---|
| `TravelAgency` | Include `sameAs` (TripAdvisor, socials), `ContactPoint`, `award` |
| `TouristTrip` | With `Offer` (AUD price) + full `Itinerary` as `ItemList` of day stops |
| `FAQPage` | Mirror the visible FAQ exactly — never schema-only questions |
| `BreadcrumbList` | |
| `AggregateRating` | Numbers must match live TripAdvisor snapshot + `url` to TA listing |
| `WebPage` + `SpeakableSpecification` | `speakable` cssSelector → H1 + hero summary paragraph |

Validate with Google Rich Results Test after deploy.

### AEO (answer engine optimization)

- **FAQ section = 5–8 real questions in the user's words**, drawn from Tier-4 FAQ keywords ("how much does a vietnam tour cost from australia", "is vietnam safe for australian tourists"...). First sentence of each answer must stand alone as a complete 40–60-word answer (that's what gets lifted into answer boxes / voice).
- **Question-format H2/H3s** where natural ("What's Included in the Price?") — headings are the #1 answer-extraction anchor.
- **Speakable schema** on H1 + hero summary (see table above).
- Key facts (price, duration, inclusions) stated in **plain extractable sentences near the top**, not only inside styled cards/tables.

### GEO (generative engine optimization)

- **Entity-rich first paragraph**: name the operator, the product, duration, price, and destinations in the first ~50 words of body copy — generative engines quote openings.
- **Stable, citable numbers**: one consistent price/duration/inclusion set across visible copy, schema, and OG tags. Contradictions kill AI citations.
- **Third-party verifiability**: TripAdvisor rating + link (real profile URLs) — generative engines weight externally-corroborated claims.
- **robots.txt must allow AI crawlers** (current worker serves allow-all `User-agent: *` — keep it; never block GPTBot/ClaudeBot/PerplexityBot/Google-Extended on an LP that wants AI-referral traffic).
- **`/llms.txt`**: serve a short markdown index (brand, tours, prices, contact, canonical URLs) from the worker alongside sitemap/robots. Generate per llmstxt.org spec (`llms` skill can help).

---

## Worker.js Generation Script (fallback only)

Canonical builds go through `build.js` (see Multi-Page Build Pipeline below). For one-off work outside this repo, use `scripts/gen_worker.py` — it reads `index.html`, escapes backticks + `${}` for the template literal, wraps in a Worker fetch handler, and writes `worker.js`. Run it after every HTML change.

## Common Issues & Solutions

| Issue | Cause | Fix |
|-------|-------|-----|
| YouTube Error 153 | Missing iframe attributes | Add `allow`, `referrerpolicy`, `frameborder` |
| Supabase 403 on upload | Anon key changed after project restore | Call `get_publishable_keys` for current key |
| Form only opens mailto | No email API integration | Use Web3Forms API with proper access key |
| Images not loading | Wrong URL pattern | Verify Supabase bucket is public, check URL format |
| Accordion items unstyled | Broken HTML nesting (e.g., `</section>` instead of `</div>`) | Validate HTML structure, check closing tags |
| Accordion not keyboard-accessible | Used `<div>` for header | Convert to `<button>` + `aria-expanded`. WCAG fail otherwise |
| Hero LCP > 4s | CSS `background-image` for hero | Convert to `<img fetchpriority="high">` + `<link rel="preload">` |
| Gold text low contrast | Used `var(--primary)` for text on white | Use `var(--primary-text)` (darker gold) — see token split |
| Dark rectangle in testimonial | `<blockquote>`+`<footer>`+`<cite>` UA defaults | Use flat `<div>`+`<p>`+`<span>` with explicit `background: transparent` |
| Trust bar wraps to 5+ lines | 3-col layout in narrow form panel | Convert to vertical 3-row, place BELOW submit button (post-CTA reassurance) |
| Wildcard route deploy fail | Cloudflare Custom Domain rejects `*` patterns | Use bare hostname only: `googlelead.myvivatour.com` not `googlelead.myvivatour.com/*` |
| TripAdvisor 403 on WebFetch | Cloudflare bot detection | Use Firecrawl with `proxy: 'stealth'` + `waitFor: 12000` |
| TA Firecrawl JSON returns empty | TA SPA renders after extraction | Use `formats: ["markdown"]` + manual regex parse |
| GA4 sessions counted 2× | Both gtag.js direct + GTM container fire GA4 | Pick one path (recommend GTM only) |
| Phone field hurts CVR | Required field on hero quick form | Remove `required` attr (+20-35% form CVR) |
| H1 doesn't match Google Ads | Brand-y H1 like "Escape Australia" | Rewrite with primary keyword: "10-Day All-Inclusive Vietnam Holiday from Australia" |
| H1 overflows mobile right edge | `clamp()` min too large for narrow viewports | Mobile media query: `clamp(1.85rem, 7.5vw, 2.5rem)` for `.hero h1` + `overflow-wrap: break-word` |
| Mobile fix appears not working | Used Chrome headless `--screenshot --window-size=375,667` | That sets window only, layout viewport stays ~800px. Use Playwright with `viewport + isMobile: true` instead — see `references/mobile-emulation-testing-with-playwright.md` |
| Logo halo / rectangle visible around logo on navbar | JPG logo with baked-in white bg over semi-transparent navbar | Convert JPG → transparent PNG, inline as base64 — see `references/brand-asset-preparation-transparent-logos-and-images.md` |
| Pricing seen too early → bounce on 50+ AU demo | Old section order: Pricing right after Gallery (sticker shock) | Reorder: Why Us + Testimonials BEFORE Pricing — trust before price |
| Scroll animations feel cheap/gimmicky | Used bouncy/scale-from-zero effects, no reduced-motion guard | Subtle only: fade+20px slide, 80ms stagger cap, respect `prefers-reduced-motion` — see `references/scroll-animations-and-premium-polish-patterns.md` |
| Count-up shifts layout (CLS spike) | Variable-width digits | Add `font-variant-numeric: tabular-nums` on `.count-up` |
| Parallax causes motion sickness on mobile | Hero parallax enabled on mobile | Disable parallax for `window.innerWidth < 768` — desktop-only |
| Hero too tall on mobile | Fixed `height: 100vh` clips form | Mobile override: `min-height: auto; height: auto` so hero grows to fit content |
| Hero form + main form leaks attention | Visitors fill 3-field hero form then disengage from main form (split intent) | Remove inline hero form entirely. Keep ONE pulsing CTA scrolling to `#booking`. The full booking form below captures higher-quality leads via chips |
| Highlights ("Why Choose This Tour?") wasted as background info | Section placed right after hero (visitor still warming up) | Move highlights to sit directly before booking form + add bridge CTA. Value-stack at commit moment > value-stack early |
| Generic textarea placeholder leaves field blank | `"Tell us about your dream Vietnam holiday..."` is too open | Use structured `Example: ...` placeholder showing exactly what info is useful (travel month, headcount, departure city, special requests) — see smart-form reference |
| GA4 reports show `[object Object]` for custom params | Pushed JS array directly into dataLayer | Convert array → comma-string before push: `interests: chips.join(', ')`. Arrays serialize badly in GA4 |
| Sales email cluttered with `interest_x: on` lines | Per-chip name attributes sent individually via Web3Forms | Strip `name=` from chip inputs, aggregate checked values into ONE hidden `interests_summary` field at submit time. Email shows clean comma-list |
| Chips tap area too small on mobile | Default chip padding ~32px tall | Set `min-height: 44px` + `box-sizing: border-box` on chip labels (WCAG 2.1 AA + Apple HIG) |
| Section appears empty in screenshots / on slow CPUs | `opacity: 0` baseline + IntersectionObserver — observer doesn't fire in time | Gate hidden state with `html.js` class set via inline `<script>` in `<head>`. CSS: `html.js .card:not(.visible) { opacity: 0; ... }`. See render-resilience reference |
| Huge blank rectangle where video should be | `<iframe loading="lazy">` — `loading="lazy"` only delays fetch, doesn't show a placeholder | YouTube facade pattern: `<div>` with `i.ytimg.com/vi/{ID}/maxresdefault.jpg` background + orange play button + click handler to load real iframe. Saves ~500KB, fires `video_play` event |
| Hero CTA + price disappear on tinted hero photo | Gold (`#D4AF37`) is ~3.2:1 contrast — weak against most photo backdrops | Use brand orange-red sampled from logo for ALL primary actions (`--accent-grad`). Gold demoted to decorative only (stars, dividers, hover) |
| Nav "Book Now" competes with hero CTA | Both solid gold = neither wins; eye doesn't know where to look | Nav uses outlined-orange variant (`cta-button-nav`) at top, fills in to orange gradient only when `nav.scrolled` |
| Generic ✓ icons in feature cards look cheap | Default checkmark + no visual differentiation | Use branded emoji icons inside circular tinted bg (🎯 🗣️ 💰 ⏰ 🏨 🌏) — each card gets its own meaning, hover lifts the card |
| wrangler install blocked | Sandbox npm restrictions | Generate worker.js manually with Python script |
| Sandbox can't reach Supabase | Network egress blocked | Use Edge Function + browser-based upload |
| Selector card image renders as tall portrait crop on mobile | HTML `height="743"` attribute overrides CSS `aspect-ratio` | Always set explicit `height: 100%` (or `height: auto`) in CSS on images inside aspect-ratio wrappers — see multi-tour reference |
| Sticky mobile bar shows stale price after scrolling past selector | Bar hard-coded one price, never updates as visitor moves through 3 tour sections | IntersectionObserver tracks active `#tour-{key}` section, swaps `priceEl.textContent` + button label. Reset to default after scrolling past all 3 — see multi-tour reference |
| Sticky bar CTA opens booking form but no tour pre-selected | Button only scrolls, doesn't flip the `tour_interest` radio | `selectTourAndScroll(key)` helper: (1) set radio, (2) scrollIntoView, (3) optional focus. Without (1) visitor has to re-pick the tour they were just reading about |
| Section heading hidden behind sticky nav after anchor click | Fixed nav covers top of section | `section[id] { scroll-margin-top: 80px; }` — applies to native `#id` links, `scrollIntoView`, and `smoothScroll()` helpers |
| Compare table on mobile reads only col 1, visitor doesn't discover scroll | Only ONE swipe hint, below the table — visitor's eye hits cols first | Add `.compare-scroll-hint-top` ABOVE the table (white italic on dark navy) — primes the gesture before columns are read |
| Multi-tour LP feels visually monotonous | All 3 tour sections look identical | Per-tour ambient color theme: rose/mint/emerald-gold backgrounds + heading colors. Keep CTAs brand-orange across all 3 (brand consistency) |
| Custom subdomain serves wrong default page | Worker `/` always serves the default LP from PAGES_CONFIG | Add `HOST_DEFAULTS = { 'happytours.myvivatour.com': '/happytours' }` to `build.js` worker template, rewrite pathname before route lookup |
| CF Custom Domain UI rejects wildcard | CF rejects `*.subdomain.com` patterns in Custom Domains | Use bare hostname `happytours.myvivatour.com` — no wildcard, no path suffix |
| Multi-tour LP scroll > 14,000px on mobile, high bounce | Trying to include every single-tour section (gallery + highlights + pricing × 3) | Trim: no per-tour Gallery, no per-tour Pricing block (selector + compare cover it), no per-tour Highlights (collapse to pill row). Target <12,000px |
| Compare table cells white-on-white, only "differentiator" cells visible | Parent `.compare-section { color: #fff }` cascades into the white-bg table; cells with explicit override (`--accent` price, green check) survive, prose cells inherit white | Explicit `.compare-table tbody td { color: var(--text-dark) }` — stops the cascade at the table boundary |
| Removed per-tour Price block but tour section now has no price → visitor loses commit-moment anchor | Over-trimmed: skill said "no per-tour pricing" but didn't distinguish full price-card vs concise price line | Add ONE compact price line above each CTA: `<span class="tour-cta-price">From <strong>$X AUD</strong> all-inclusive <span class="was">$Y</span></span>`. Single line, near CTA, not a duplicate price-card. Three "reveals" total (selector / compare / per-tour CTA) each with distinct purpose, not redundancy |
| Why-MVT / Highlights stack single-column on mobile (~4000px each) | Default grid `repeat(auto-fit, minmax(250px,1fr))` collapses below 500px viewport | Mobile media query: force `grid-template-columns: repeat(2,1fr)` + halve card padding + drop card font sizes ~15% — see multi-tour reference §"Mobile bloat patterns" |
| Testimonials stack vertically on mobile (~3500px) | Default `grid-template-columns: repeat(auto-fit, minmax(300px,1fr))` = 1 col on 375px | Switch to horizontal scroll-snap carousel on mobile (flex + `scroll-snap-type: x mandatory` + 85% card width for peek affordance). No JS needed |
| Hero price-badge text wraps 2 lines on mobile, eats 30% viewport | Long copy + non-nowrap pill | Shorten copy to `From $X AUD →` (single line) OR add `white-space: nowrap` + smaller font. Do NOT combine nowrap with `max-width + text-overflow: ellipsis` — it'll silently truncate the price |
| Itinerary image needed below tour hero, single image | Tour data summary already in plan, but no companion image picked | Use `og:image` from the original tour page, OR scan `wp-content/uploads/YYYY/MM/` for the tour's destination shots (`HaLong_*`, `HoiAn_*`, `PhuQuoc_*`). Resize to 1400px wide WebP q75 (~100-250KB). Place between `tour-hero-img` and `tour-info-card` with `aspect-ratio: 1400/700` + 1-line italic caption tying image to specific itinerary day |
| User asks "only 1 image per tour" but LP has 2 (hero + itinerary banner) | Earlier guidance suggested both hero + supporting banner | Single cover image per tour, used in BOTH selector card preview AND tour section hero (same Supabase URL). Remove the itinerary banner block. Source the cover from the canonical tour page's featured/og image — typically `wp-content/uploads/YYYY/MM/{timestamp}.avif` |
| Sales can't quickly look up enquiry against source tour catalogue | LP form sends human-readable label "Honeymoon (10 days $1,899)" only — no machine ID | Add tour code (VHM10/V7/VLU10) as `data-tour-code` attr on each radio. Hidden `tour_code` field auto-fills via `selectTourAndScroll()` + change listener. Form submit dataLayer event includes `tour_code`. Visible badge in eyebrow + selector + compare + form labels. Single source of truth = the radio's data-attr |
| Visitor clicks tour CTA, lands on form, doesn't realise it's pre-filled | Pre-select is invisible (radio checked + hidden field) — visitor anxiously re-picks the tour | Add visible `tour-prefill-banner` at top of form: `"✓ Pre-filled from your selection: <Tour Name> <CODE> [change tour ↑]"`. Pulses in via `prefillPulse` keyframe (respects reduced-motion). Pair with textarea starter prefill `"I'm interested in {name} ({code}) package. "` (only when textarea is empty — never clobber typed text). Hide banner for "Not sure" radio. See multi-tour reference §"Visible auto-fill confirmation" |
| "Not sure — help me choose" radio is empty / dead-end for undecided visitors | Just a radio with no payload = wasted opportunity to convert hesitation | Show a `tour-helper-panel` with 3 by-COMPANION decision cards (with partner / with family / with friends-milestone) — each one-sentence "why this tour for that group" + tour code + click switches the radio. Closing line "Still unsure? Leave details below — experts will design custom" so indecisive visitors aren't dead-ended. Wire visibility through same syncTourPrefillUI helper. dataLayer event tour_helper_card_click measures which recommendation converts. See multi-tour reference §"Not sure helper panel" |
| LP can't possibly mirror every tour detail (cancellation, full hotel list, etc.) | Trying to fit canonical info on LP bloats the page | Add `tour-source-link` as muted dashed-underline secondary link below each "See full itinerary" button → opens canonical tour page on parent site in new tab. Fires `tour_source_click` dataLayer event with tour_code (high rate = LP has content gaps to fill) |
| Diorama/stylized AI scenes proposed for a tour-selling LP | Diorama demos look impressive → tempting at conversion layer | BANNED there (user decision 2026-07-17) — stylized visuals don't answer the purchase question. Conversion LPs get photoreal living photos from REAL company photography; diorama goes to brand/edu content via `mvt-video-3d` |
| Living-photo loop "pops" at restart | Generated clip's last frame ≠ first frame | Pass the SAME source photo as both `--start-image` AND `--end-image` (frame-locked loop). QA: RMSE first-vs-last frame > ~40 → re-roll or ffmpeg `xfade` crossfade fallback |
| Living photo morphs faces / adds ghost people | Prompt let the model animate subjects | Prompt must pin composition: "people remain motionless", move environment only (water/smoke/light/foliage). Animating people = uncanny + NSFW-filter bait |
| Page feels like a carnival, CTA ignored | Too many moving tiles (all 6 dest cards + gallery animated) | Max 2–3 living photos per page, never adjacent to CTA/price/form viewport region. Restraint reads premium |
| Living photos tank mobile data/battery | Videos eager-loaded, play offscreen | `preload="none"` + IntersectionObserver play-in-viewport/pause-offscreen + skip entirely on `navigator.connection.saveData` and `prefers-reduced-motion` |
| Source tour swapped (e.g. honeymoon VBR12 → VHM10) — what to refresh? | Easy to update only what's obvious | Refresh ALL of: cover image (selector AND hero — same image), titles, duration, day-by-day, "where you'll go", meta-row, compare table column, sticky bar label, form radio value+code, backlink href, tour code badges everywhere, plan-folder memory file. Use Firecrawl JSON extraction to get the full structured tour data in one call — see multi-tour reference §"When source tour changes" |

## Chrome MCP Disconnect Fallback

When Chrome extension is unavailable for deployment:
1. Open the file that needs to be used (e.g., `worker.js`) in Chrome via Finder
2. Write clear step-by-step instructions for the user to paste into Chrome Claude extension
3. Instructions should include: exact URLs to navigate, what to click, what to paste, expected results

---

## TripAdvisor Integration (production pattern)

Real third-party reviews convert ~15-25% better than hardcoded testimonials. MyVivaTour has a verified TripAdvisor listing — always integrate this when building/updating any tour LP. **Native HTML cards beat embed widget** (faster, no external script, full control over design).

### Source data

- **Listing URL**: `https://www.tripadvisor.com/Attraction_Review-g293924-d29687552-Reviews-My_Viva_Tour-Hanoi.html`
- **Current snapshot** (manual baseline): 5.0/5 · 230 reviews · Travellers' Choice 2026 · #47 of 852 Hanoi Tour Operators (Top 6%)
- **Auto-refresh**: weekly via n8n workflow (see Auto-Rotation Pipeline below)

### Where to put TripAdvisor data on the page

| Location | Element | Content |
|---|---|---|
| Hero (above-the-fold) | `.hero-trust-bar` pill | `★★★★★ 5.0/5 · 230 Reviews on TripAdvisor` (link to TA listing) |
| Schema.org | `aggregateRating` JSON-LD | Match real numbers + `"url"` field pointing to TA + `"award"` field |
| Testimonials section header | `.tripadvisor-badge` | Logo + rating + reviews count + 🏆 Travellers' Choice badge + ranking pill |
| Testimonials section body | `.ta-reviews-grid` (6 cards) | Avatar + name + location + visited date + ★★★★★ + quote + "View on TripAdvisor" link |
| Right "Get in Touch" panel | `.info-testimonial` | Mini blockquote pinned with featured Aussie reviewer (50-word quote) |

### Critical implementation rules

1. **Featured card is ALWAYS the Australian reviewer** — pin them at position #1 with green border + `🇦🇺 Australian Reviewer` corner badge. Targets the Aussie audience directly.
2. **Use real reviewer profile URLs** — every "View on TripAdvisor" link must go to the actual reviewer's profile (TA verifies this, builds trust).
3. **Quote trimming**: max ~350 chars, end on sentence boundary (`.!?`). Never mid-word truncate.
4. **No `<blockquote>` + `<footer>` + `<cite>` chain** — UA defaults render dark gaps on dark backgrounds. Use flat `<div>` + `<p>` + `<span>` with explicit `background: transparent; padding: 0;` on children.
5. **Testimonial card structure** (avoid UA quirks):
   ```html
   <article class="ta-review-card featured">
     <div class="ta-review-header">
       <div class="ta-reviewer">
         <div class="ta-avatar">IM</div>
         <div><strong>Ingie Marcho</strong><small>📍 Melbourne, Australia · Visited March 2026</small></div>
       </div>
       <span class="ta-stars">★★★★★</span>
     </div>
     <blockquote class="ta-review-body"><q>...</q></blockquote>
     <a class="ta-review-source" href="https://www.tripadvisor.com/Profile/{slug}" target="_blank" rel="noopener">View on TripAdvisor →</a>
   </article>
   ```
6. **Brand colors**: TripAdvisor green `#00aa6c` for borders/links, gold `#D4AF37` accents. Don't recolor TA elements off-brand.
7. **Ranking phrasing**: Convert raw "#47 of 852" to user-friendly "Top X%" — punchier, scales well as ranking changes. Use body color (`#6B7280`), NOT link blue.
8. **Award badge sizing**: 🏆 Travellers' Choice ~30% smaller than rating text — supplementary info, not headline.

### When user reports content issues
- "TripAdvisor data outdated" → re-run scrape (manual or trigger n8n) → JSON updates → next deploy refreshes cards
- "Reviews look fake" → verify each card links to a real TA profile, check rating/count match TA listing
- "Australian reviewer changed" → JSON `isAustralian: true` flag controls featured pinning; only one card should have it

### How to scrape TA fresh

WebFetch is **blocked** by TripAdvisor (Cloudflare 403). Always use Firecrawl with stealth proxy:

```js
firecrawl_scrape({
  url: 'https://www.tripadvisor.com/Attraction_Review-g293924-d29687552-Reviews-My_Viva_Tour-Hanoi.html',
  formats: ['markdown'],
  proxy: 'stealth',
  waitFor: 12000,
  onlyMainContent: true,
  location: { country: 'US', languages: ['en'] }
})
```

Markdown returns ~75KB. Extract:
- Rating: regex `[0-9.]+\s+of\s+5\s+bubbles`
- Count: regex `\([0-9,]+\s+reviews\)`
- Award: search "Travelers' Choice" or "Travellers' Choice"
- Ranking: `#\d+ of \d+ in`
- Per review: name from `[Name](.../Profile/{slug})` markdown links, location from `2 contributions`-style next line, quote between blank lines, visited date from `Visited {Month} {Year}`

See `references/tripadvisor-integration.md` for full extraction script + JSON schema.

---

## Performance & Accessibility Standards

Every new LP must pass these baselines (audit results inform Phase 2 build):

### Core Web Vitals targets

| Metric | Target | How to achieve |
|---|---|---|
| LCP | < 2.5s | Hero image as `<img fetchpriority="high">` + `<link rel="preload" as="image">` in `<head>`. NEVER use CSS `background-image` for hero — browser can't preload |
| CLS | < 0.1 | All `<img>` tags must have explicit `width` + `height` attrs |
| INP | < 200ms | Defer non-critical JS, use `loading="lazy"` on below-the-fold images |
| TTFB | < 800ms | Cloudflare Workers edge handles this automatically |

### Required `<head>` performance hints

```html
<link rel="preload" as="image" href="{HERO_URL}" fetchpriority="high">
<link rel="preconnect" href="https://{supabase-project}.supabase.co" crossorigin>
<link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
<link rel="preconnect" href="https://connect.facebook.net" crossorigin>
<link rel="dns-prefetch" href="https://api.web3forms.com">
```

### Image optimization rules

- Hero (LCP candidate): no `loading="lazy"`, has `fetchpriority="high"` + `decoding="sync"` + `width`/`height`
- All other images: `loading="lazy"` + `decoding="async"`
- Convert to WebP where possible
- Format consistency: `dest-{city}.webp`, `gallery-{subject}.webp`, `itin-{day}.webp`

### Accessibility (WCAG 2.1 AA minimum)

| Element | Requirement |
|---|---|
| Accordion headers | `<button>` (NOT `<div>`) with `aria-expanded` toggled in JS. Add `:focus-visible` outline |
| Gold text on white | Use `--primary-text: #A8842A` (4.7:1 contrast) NOT `--primary: #D4AF37` (2.3:1 fail) |
| Images | Descriptive `alt` text with target keyword. Decorative images: `alt=""` + `aria-hidden="true"` |
| SVG icons | `aria-hidden="true"` if next to text label. Otherwise `aria-label` |
| Animations | Wrap in `@media (prefers-reduced-motion: reduce) { animation: none; }` |
| Touch targets | Min 44px × 44px on mobile (hamburger, sticky bar, floating buttons) |
| Form fields | `<label for="">` linked to every input. Required fields marked with `*` |

### Color tokens (split for contrast + CTA hierarchy)

> **Rule (shipped 2026-05-16):** Primary CTAs must use the **brand orange-red sampled from the logo**, NOT gold. Gold on a tinted-photo hero is ~3.2:1 contrast and disappears; orange-red commands attention and ties back to logo identity. Gold is demoted to decorative-only (stars, dividers, hover). Full rationale in `references/js-gated-reveal-youtube-facade-and-brand-orange-cta-hierarchy.md`.

```css
:root {
    --primary: #D4AF37;        /* Brand gold — DECORATIVE ONLY (stars, dividers, accent borders, hover) */
    --primary-text: #A8842A;   /* Darker gold for body text on white (WCAG AA pass) */
    --accent: #E8622A;         /* Brand orange-red (sampled from logo) — used for ALL primary CTAs + price */
    --accent-dark: #C84F1D;    /* Hover */
    --accent-grad: linear-gradient(135deg, #FF6B35 0%, #E8622A 100%); /* CTA gradient */
    --accent-glow: rgba(232, 98, 42, 0.45);
    --dark: #111827;
    --light: #F8FAFC;
    --text-dark: #1F2937;
    --text-light: #6B7280;
    --border: #E5E7EB;
    --success: #10B981;
}
```

NEVER use `color: var(--primary)` for text on white. Always `var(--primary-text)`.
NEVER use `var(--primary)` for primary action buttons or price badge. Always `var(--accent-grad)`.

**What gets which color:**
- `--accent-grad` → hero CTA, price badge, sticky mobile bar, booking form submit, bridge CTAs, video play button
- `--primary` → TripAdvisor stars, accordion focus outline, testimonial card border-left, decorative hover tints
- Nav "Book Now" pill → outlined orange (top of page), fills to orange gradient when `nav.scrolled`

---

## Conversion Optimization Patterns (validated on escape page)

Apply these to every LP. Order matters.

### Section Order: Trust Before Price + Value-Stack Before Form (mandatory)

```
Hero (single CTA) → Destinations → Itinerary → Video → Gallery
→ Why MyVivaTour → Testimonials → PRICING → FAQ
→ Highlights ("Why Choose This Tour?" + bridge CTA) → BOOKING FORM
```

Two non-negotiable rules:

1. **Pricing must NEVER appear before Why Us + Testimonials.** AU 35-65 demo at $2,099+ AUD = significant decision; sticker shock before trust kills conversion. Validated on escape page (commit `716d235`, 2026-05-11).
2. **Highlights ("Why Choose This Tour?") must sit directly before booking form** — not right after hero. Value-stack adjacent to commit moment outperforms value-stack as background info. Bridge CTA at end of highlights chains momentum into the form. Validated on escape page (commit `82c8e05`, 2026-05-16).

### Hero must include

- **Message-match H1**: contains primary keyword from Google Ads (`"10-Day All-Inclusive Vietnam Holiday from Australia"` not brand-y `"Escape Australia"`). Critical for Quality Score + bounce rate.
- **Trust bar dưới H1**: 3 pills horizontal — TripAdvisor link + traveller count + tenure
- **Single pulsing CTA** (NOT inline form): `<button class="cta-button cta-button-hero" onclick="smoothScroll('booking')">Get My Free Vietnam Quote →</button>` + reassurance line directly under (`🇦🇺 Free, no obligation · Reply within 2 hours · Trusted by 500+ Australian travellers`). Hick's law: 1 clear action beats 3 input fields. The full booking form below captures higher-quality data via chips + departure city anyway. **Color: orange-red gradient (`--accent-grad`) — pulses with orange glow** (`--accent-glow`). Gold pulse on tinted hero = invisible; orange pulse = unmissable.
- **Daily Departure tag** for urgency without being spammy

### Form section structure

Layout: 2 columns 1fr/1fr inside max-width 900px container. Full pattern + code recipes in `references/smart-booking-form-chips-and-bridge-cta.md`.

**Left panel (form) — fields in order:**
- Name * (required, `maxlength="100"`, `autocomplete="name"`)
- Email * (required, `maxlength="254"`, `autocomplete="email"`)
- Phone * (required — keeps it; high-ticket travel needs phone follow-up. `maxlength="20"`, `autocomplete="tel"`)
- **Departure City** (optional `<select>`) — 8 AU airports + "Other/Not sure". Enables accurate quote + future audience segmentation
- **"What matters most to you?" chip group** — 8 visually-hidden checkboxes styled as gold-pill chips (44px min touch target). Optional, low-friction. Aggregated into one hidden `interests_summary` field at submit → sales email shows clean comma-list like `"Best price, Honeymoon, Flights included"`
- **Message textarea** with structured `placeholder` (Example: prefix + fallback prompt) — see reference for exact copy. `rows="5"`, `maxlength="1000"`
- CTA button
- **Risk reversal strip BELOW button** (NOT above) — 3 vertical rows with top border separator. Format: `[icon] [bold title] — [short description]` on one line. Acts as post-CTA reassurance.

**Right panel (Get in Touch):**
- Matching elevated card style (background, padding, border, shadow) for visual balance
- Tagline under heading: `⏱ Response within 2 hours · Available 7 days a week` (in gold)
- 3 contact rows with **inline SVG icons** in 40×40 pill containers (NOT emoji 📱✉️🌐 — looks unprofessional)
- Mini testimonial blockquote — pin Aussie reviewer for direct social proof
- Fineprint at bottom (smaller, less prominent)

### Risk reversal copy (concise, parallel structure)

| Icon | Title | Description |
|---|---|---|
| 🔒 | Secure Booking | SSL-encrypted, no upfront payment |
| 🔄 | Full Refund 60+ Days | Full refund if cancelled 60+ days prior |
| 💬 | No Commitment | Get a personal quote first, zero pressure |

Keep all 3 descriptions ~40-50 chars to maintain visual balance.

### Tracking (must be on every LP)

- GTM container: `GTM-TPQWV864`
- GA4: `G-2R0EJ2LBJ5`
- Google Ads conversion: `AW-17709107883/Wq0ECKXBmfsbEKuVrvxB`
- Facebook Pixel: `579298288600609`
- Required dataLayer events: `page_view`, `form_start`, `form_submit`, `form_success`, `cta_click`, `whatsapp_click`
- **Form submit must include lead-segmentation params** (added 2026-05-16): `departure_city` (string), `interests` (comma-string, NOT array — GA4 renders arrays as `"[object Object]"`), `interest_count` (number). Enables building GA4 audiences like "Honeymoon interested" → import to Google Ads for retargeting.

Watch for **GA4 double-fire**: if both direct `gtag.js` script AND GTM container have GA4 tag → sessions counted 2×. Verify in GTM Preview mode.

---

## Auto-Rotation Pipeline (data-driven content updates)

Built for TripAdvisor reviews but extensible to any external content (Google Reviews, Trustpilot, etc.).

### Architecture

```
External source (TripAdvisor)
        ↓
n8n workflow (weekly cron)
        ↓
Firecrawl scrape + filter + format
        ↓
GitHub API: commit data/{source}-reviews.json to main
        ↓
GitHub Actions: deploy.yml triggers
        ↓
build.js reads JSON + injects into HTML at marker blocks
        ↓
worker.js generated → Cloudflare Workers → live
```

### Implementation files

| File | Purpose |
|---|---|
| `data/tripadvisor-reviews.json` | Single source of truth. Schema: `{rating, award, ranking, reviews[]}` |
| `build.js` (function `injectTripAdvisorData`) | Reads JSON + replaces `<!-- TA-REVIEWS-START -->...<!-- TA-REVIEWS-END -->` block + inline tokens like `<!--TA_COUNT-->230<!--/TA_COUNT-->` |
| `pages/{tour}/index.html` | Has marker comments at injection sites |
| `workflows/scrape-tripadvisor-reviews.json` | Importable n8n workflow |
| `workflows/README.md` | Setup instructions for credentials + activation |

### HTML marker pattern

```html
<!-- Anywhere in body: full block replacement -->
<!-- TA-REVIEWS-START — auto-injected by build.js from data/tripadvisor-reviews.json -->
<div class="ta-reviews-grid">...placeholder cards...</div>
<!-- TA-REVIEWS-END -->

<!-- Inline token replacement -->
<p>Showing 6 of <!--TA_COUNT-->230<!--/TA_COUNT--></p>
```

### When adding a new tour LP that needs auto-rotation

1. Add markers `<!-- TA-REVIEWS-START -->` + `<!-- TA-REVIEWS-END -->` around the reviews grid in the new `pages/{tour}/index.html`
2. `build.js` automatically detects the marker (via `if (content.includes('TA-REVIEWS-START'))`) and injects — no per-page config needed
3. JSON schema is shared across all tour LPs (only one source of truth)

### Filter logic (in n8n Code node "Pick 6 + Format JSON")

- Quality: 5-star only, text 80-600 chars
- Pick: 1 Australian reviewer (regex `australia|sydney|melbourne|brisbane|...`) → featured at index 0
- Then 5 most recent quality reviews
- Trim quote: 350 chars max, end on sentence boundary

### Safety features

- Diff detection in n8n: skip commit if data unchanged → no spam commits
- Graceful fallback: if JSON missing/malformed, page renders hardcoded fallback (no breakage)
- Bot-attributed commits: `chore(reviews): auto-update TripAdvisor reviews — {N} reviews`

### Trigger schedule

- Default: every Monday 09:00 (cron `0 9 * * 1`)
- Manual: execute workflow in n8n UI
- Alternative: GitHub Actions cron if no n8n available (see `workflows/README.md`)

---

## Multi-Page Build Pipeline (build.js)

This project uses **single-file output** strategy — `worker.js` contains ALL landing pages as inline HTML constants, routed by URL pathname.

### Adding a new tour page

1. Create `pages/{tour-slug}/index.html`
2. Add to `PAGES_CONFIG` in `build.js`:
   ```js
   '{tour-slug}': { path: '/{tour-slug}', name: 'Display Name' }
   ```
3. Run `node build.js` → regenerates `worker.js` (~150-180KB for 4 pages)
4. `git push origin main` → GitHub Actions auto-deploys

### Build pipeline order

```
pages/*/index.html
  → readPageHTML()
    → injectTripAdvisorData() (if marker found)
    → escapeTemplateLiteral() (escape backticks + ${})
  → worker.js with PAGE_{NAME} constants + ROUTES map
  → wrangler deploy
```

### Routes generated

- `/` → default page (escape, marked `isDefault: true`)
- `/{tour-slug}` → other tours
- `/sitemap.xml`, `/robots.txt` → auto-generated
- 404 for unmatched routes (with links to all tour pages)

DO NOT edit `worker.js` directly — it's auto-generated and overwritten by every `build.js` run.

### Multi-tour LP on its own subdomain

When a new tour LP deserves its own subdomain (e.g. `happytours.myvivatour.com` bundles 3 tours), add a `HOST_DEFAULTS` entry inside the worker template in `build.js` so root `/` on that hostname serves the right page:

```js
// build.js worker template
const HOST_DEFAULTS = {
  'happytours.myvivatour.com': '/happytours',
  // Add new hosts here as more subdomains are added
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let pathname = url.pathname.replace(/\/+$/, '') || '/';
    if (pathname === '/' && HOST_DEFAULTS[url.hostname]) {
      pathname = HOST_DEFAULTS[url.hostname];
    }
    // ...rest of routing unchanged
  },
};
```

Then in Cloudflare dashboard → Worker → Triggers → Custom Domains, add the bare hostname (`happytours.myvivatour.com`, no wildcard, no path). One worker now serves every subdomain. Full pattern + per-tour section guide in `references/multi-tour-landing-page-with-smart-sticky-bar-and-preview-cards.md`.
