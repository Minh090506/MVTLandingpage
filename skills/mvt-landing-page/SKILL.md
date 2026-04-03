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

5. **Create `index.html`** — a single-file HTML with inline CSS and JS. Use the design system below and include all sections in order. Refer to `references/design-system.md` for the full CSS variables, component styles, and section templates.

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

1. **Hero** — Full-viewport background image, gradient overlay, headline, price badge, CTA button
2. **Highlights** — 4 feature cards (flights, guides, meals, all-inclusive) with gold accent icons
3. **Destinations** — 6-card grid with overlay text, hover zoom effect
4. **Itinerary** — Accordion (single-open pattern) with day headers, content, meals/accommodation details, and optional itinerary banner images
5. **Video** — YouTube embed with proper attributes (`allow`, `referrerpolicy`, `frameborder`, `allowfullscreen`)
6. **Gallery** — 8-image grid with lightbox modal (arrow key navigation, ESC close)
7. **Pricing** — Main price card (was/now) + 4 upgrade option cards
8. **Why MyVivaTour** — Trust section with 6 feature cards on gradient background
9. **Testimonials** — 3 review cards with gold left border
10. **FAQ** — Accordion with common questions
11. **Booking Form** — Web3Forms integration + WhatsApp fallback
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
| wrangler install blocked | Sandbox npm restrictions | Generate worker.js manually with Python script |
| Sandbox can't reach Supabase | Network egress blocked | Use Edge Function + browser-based upload |

## Chrome MCP Disconnect Fallback

When Chrome extension is unavailable for deployment:
1. Open the file that needs to be used (e.g., `worker.js`) in Chrome via Finder
2. Write clear step-by-step instructions for the user to paste into Chrome Claude extension
3. Instructions should include: exact URLs to navigate, what to click, what to paste, expected results
