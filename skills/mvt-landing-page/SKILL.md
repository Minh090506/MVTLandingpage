---
name: mvt-landing-page
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

1. **Scrape tour info** from myvivatour.com product page using Firecrawl MCP (`firecrawl_scrape`). WebFetch is blocked for myvivatour.com domain — always use Firecrawl.
   - Extract: tour name, tour ID, duration, price (AUD), was-price, inclusions, exclusions, itinerary, upgrade options
   - Use JSON format with schema for structured extraction

2. **Scrape design reference** from an existing landing page (e.g., `10days.myvivatour.com`) using Firecrawl with `branding` format to get colors, fonts, spacing.

3. **Collect images** from user's local folder. Ask user to place images in the workspace folder. Typical structure:
   ```
   images/
   ├── {CityName}/
   │   ├── Banner Tours (1920x743)/
   │   └── WIC RS/
   └── tour-map.jpg
   ```

### Phase 2: Build the Landing Page

4. **Optimize images** using Python Pillow. Target specs:
   - Hero banner: 1920x743, JPEG quality 82, ~250KB
   - Destination cards: 600x400, JPEG quality 82, ~50-80KB
   - Gallery images: 800x600, JPEG quality 82, ~80-165KB
   - Itinerary banners: 1200x465, JPEG quality 82, ~120-190KB
   - Tour map: 800x800, JPEG quality 82, ~95KB
   - Save all to `upload-ready/` folder with consistent naming:
     - `hero-{subject}.jpg`, `dest-{city}.jpg`, `gallery-{subject}.jpg`
     - `itin-{city}.jpg`, `tour-map-{tourID}.jpg`

5. **Create `index.html`** — a single-file HTML with inline CSS and JS. Use the design system below and include all sections in order. Refer to:
   - `references/design-system.md` for CSS variables, component styles, and section templates
   - `references/tripadvisor-integration.md` for the TripAdvisor reviews integration (scraping, schema, build pipeline, n8n auto-rotation)

### Phase 3: Host Images on Supabase

6. **Create Supabase Storage bucket** via Supabase MCP:
   ```sql
   INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
   VALUES ('landing-images', 'landing-images', true, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
   ON CONFLICT (id) DO NOTHING;
   ```
   Then create RLS policies for public read and upload access.

7. **Get current anon key** — always call `get_publishable_keys` because the key changes after project restore. Never hardcode old keys.

8. **Deploy upload Edge Function** on Supabase (name: `upload-image`, verify_jwt: false) that accepts POST with `{filename, data}` (base64) and uploads to storage using service_role key. This avoids anon key auth issues.

9. **Upload images** — create `auto-upload.html` with all images base64-encoded inline, JS that POSTs each to the Edge Function. Open via Finder (`Cmd+Down` on selected file) to trigger auto-upload in browser. Or if Chrome MCP is available, use that.

10. **Update image URLs** in `index.html` — replace placeholder URLs with Supabase Storage public URLs:
    ```
    https://{project}.supabase.co/storage/v1/object/public/landing-images/{folder}/{filename}
    ```
    Use `replace_all` in Edit tool for batch replacement.

### Phase 4: Deploy to Cloudflare

11. **Generate `worker.js`** using Python script that:
    - Reads `index.html`
    - Escapes backticks and `${}` for JS template literal
    - Wraps in Cloudflare Worker fetch handler
    - Saves as `worker.js` (~90KB)

12. **Deploy the worker** — if Chrome MCP is available, navigate to Cloudflare Dashboard and deploy. If Chrome MCP is disconnected:
    - Open `worker.js` in Chrome via Finder (so content is ready in a tab)
    - Write detailed step-by-step instructions for the user to copy into Chrome Claude extension
    - Include: navigate to dash.cloudflare.com, create worker, paste code, add custom domain

### Phase 5: Verify

13. **Test the live page** — use Firecrawl to scrape the deployed URL and verify images load (HTTP 200), form works, all sections render correctly.

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

### Page Sections (in order)

1. **Hero** — Full-viewport `<img class="hero-bg-img" fetchpriority="high">` (NOT CSS bg — see "Performance" below), trust bar with TripAdvisor link, headline, price badge, CTA, hero quick form (3 fields)
2. **Highlights** — 4 feature cards (flights, guides, meals, all-inclusive) with gold accent icons
3. **Destinations** — 6-card grid with overlay text, hover zoom effect
4. **Itinerary** — `<button class="accordion-header" aria-expanded>` pattern (NOT `<div>` — keyboard a11y) with day headers, content, meals/accommodation details
5. **Video** — YouTube embed with proper attributes (`allow`, `referrerpolicy`, `frameborder`, `allowfullscreen`)
6. **Gallery** — 8-image grid with lightbox modal (arrow key navigation, ESC close)
7. **Pricing** — Main price card (was/now) + 4 upgrade option cards
8. **Why MyVivaTour** — Trust section with 6 feature cards on gradient background
9. **Testimonials** — TripAdvisor badge (rating + Travellers' Choice + ranking) + 6 native review cards (see TripAdvisor Integration section). Featured card pinned for any Aussie reviewer (`isAustralian: true` in JSON) with green border + 🇦🇺 corner badge
10. **FAQ** — Button-based accordion with common questions
11. **Booking Form** — Web3Forms integration. 2-column layout: left = form card (elevated), right = "Get in Touch" panel (matching elevated style with SVG icons + mini testimonial). **Risk reversal strip placed BELOW submit button** as post-CTA reassurance (3 vertical rows with top border separator)
12. **Footer** — Company info, quick links, contact details

### Key JavaScript Features

- **Accordion**: Single-open pattern (closing previous when new opens)
- **Gallery Lightbox**: Click to open, arrow keys to navigate, ESC to close
- **Scroll Animations**: Intersection Observer (threshold 0.1) adding `.visible` class
- **Sticky Nav**: Adds shadow on scroll, mobile hamburger menu
- **Form**: Web3Forms API → email delivery, with WhatsApp prompt on success
- **Back to Top**: Shows after 300px scroll

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

## Worker.js Generation Script

```python
import re, os

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

escaped = html.replace('\\', '\\\\')
escaped = escaped.replace('`', '\\`')
escaped = re.sub(r'\$\{', '\\${', escaped)

worker_js = 'const HTML_CONTENT = `' + escaped + '`;\n\n'
worker_js += '''export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/favicon.ico") {
      return new Response(null, { status: 204 });
    }
    return new Response(HTML_CONTENT, {
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};
'''

with open('worker.js', 'w', encoding='utf-8') as f:
    f.write(worker_js)
```

Save this as `gen_worker.py` in the workspace and run it after every HTML change.

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
| wrangler install blocked | Sandbox npm restrictions | Generate worker.js manually with Python script |
| Sandbox can't reach Supabase | Network egress blocked | Use Edge Function + browser-based upload |

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

### Color tokens (split for contrast)

```css
:root {
    --primary: #D4AF37;        /* Gold for backgrounds, borders, decorative */
    --primary-text: #A8842A;   /* Darker gold for text on white (WCAG AA pass) */
    --dark: #111827;
    --light: #F8FAFC;
    --text-dark: #1F2937;
    --text-light: #6B7280;
    --border: #E5E7EB;
    --success: #10B981;
}
```

NEVER use `color: var(--primary)` for text on white. Always `var(--primary-text)`.

---

## Conversion Optimization Patterns (validated on escape page)

Apply these to every LP. Order matters.

### Hero must include

- **Message-match H1**: contains primary keyword from Google Ads (`"10-Day All-Inclusive Vietnam Holiday from Australia"` not brand-y `"Escape Australia"`). Critical for Quality Score + bounce rate.
- **Trust bar dưới H1**: 3 pills horizontal — TripAdvisor link + traveller count + tenure
- **Hero quick form** (3 fields, phone OPTIONAL): Name, Email, Phone (no `required`). Lift +20-35% form CVR vs required phone.
- **Daily Departure tag** for urgency without being spammy

### Form section structure

Layout: 2 columns 1fr/1fr inside max-width 900px container.

**Left panel (form):**
- Header row: `<h3>` + social proof avatars on same line (flex space-between)
- Subtle `<hr>` divider between header and form fields
- Form fields (Name, Email, Phone, Message)
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
- GA4: `G-LKDCCNJMP3`
- Google Ads conversion: `AW-17709107883/Wq0ECKXBmfsbEKuVrvxB`
- Facebook Pixel: `579298288600609`
- Required dataLayer events: `page_view`, `form_start`, `form_submit`, `form_success`, `cta_click`, `whatsapp_click`

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
