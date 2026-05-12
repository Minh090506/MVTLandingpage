# Brand Asset Preparation — Transparent Logos & Image Hygiene

> **When to read this:** Before placing ANY logo/icon/badge image on the landing page navbar, footer, or over any background that isn't pure opaque white.

## The White-Box Halo Trap (lesson learned 2026-05-12)

JPG format has **no alpha channel**. A logo exported as JPG with a white background has those white pixels permanently baked in. On the LP navbar:

```
nav { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); }
```

…the navbar is **semi-transparent** and picks up tint from whatever sits behind it (typically the hero image — sepia/cruise tones). The JPG logo's white pixels stay bright `#fff`. Result: a visible rectangular halo around the logo, color mismatch, looks amateur.

**Worst on:** mobile (where navbar tint is more visible due to limited width), over dark hero photos, on scrolled state when navbar is over body content.

### Symptoms reported by user
- "logo màu trắng còn nền thì nâu đậm" (white logo on dark brown bg)
- Visible rectangle around logo
- Color mismatch in header

## Mandatory Rule

**Every logo/icon placed inside `<nav>`, badges placed over images, or any element over a semi-transparent parent MUST have a true alpha channel.** No JPGs in those positions, ever.

## Workflow: JPG → Inline Transparent PNG

Use this exact recipe when starting a new landing page or when fixing an existing one.

### 1. Convert with ImageMagick

```bash
# Source: original logo JPG (any size)
# Output: transparent PNG sized for 2x retina at 65px nav height
magick /path/to/logo.jpg \
  -trim +repage \                          # crop transparent margins
  -bordercolor white -border 10 \          # ensure safe fuzz on edges
  -fuzz 8% -transparent white \            # remove white pixels (8% tolerance for JPG compression edges)
  -resize x200 \                            # 200px tall = 2x retina for 65-100px display
  -strip \                                  # remove EXIF
  -define png:compression-level=9 \
  -colors 16 \                              # palette PNG for max compression (works because logos use ≤16 colors)
  /tmp/logo-transparent.png
```

**Typical output sizes:**
- 562×200 px, 16-color palette PNG: **~5.8 KB raw**
- Base64-encoded: **~7.7 KB**

### 2. Decide: Inline base64 OR Supabase upload?

| Size after compression | Recommendation |
|---|---|
| ≤ 10 KB | **Inline as base64 data URI** in the `<img src>` |
| 10–30 KB | Inline if it's above-the-fold critical (logo, hero badge) |
| > 30 KB | Upload to Supabase, reference by URL |

Inlining saves an HTTP request and eliminates DNS/TLS overhead — meaningful for LCP on mobile 3G.

### 3. Generate the data URI

```bash
B64=$(base64 -i /tmp/logo-transparent.png | tr -d '\n')
echo "data:image/png;base64,${B64}"
```

### 4. Replace in HTML

In `pages/<tour>/index.html`, find the nav `<img>` tag:

```html
<!-- BEFORE -->
<img src="https://tnwelgvypmhhksqwnfmr.supabase.co/.../logo-XXX.jpg" alt="MyVivaTour" ...>

<!-- AFTER -->
<img src="data:image/png;base64,iVBORw0KGgo..." alt="MyVivaTour" ...>
```

### 5. Keep JPG for non-visual references

These can stay as JPG because they don't render visually:
- `<link rel="apple-touch-icon" href="...">` (iOS adds its own bg)
- JSON-LD `"logo": "..."` (schema.org metadata, not rendered)
- Open Graph `og:image` (social platforms re-process)

## Validation Checklist (run before shipping)

Take Playwright screenshots at 3 states:

```bash
# /tmp/screenshot-header.js — see references/mobile-emulation-testing-with-playwright.md
node /tmp/screenshot-header.js
```

| State | What to check |
|---|---|
| **Top** (scroll=0, navbar over hero) | No visible rectangle around logo. Orange pixels vivid, not muddy. |
| **Scrolled** (scroll=400, navbar over body white) | Logo blends seamlessly with `nav.scrolled` solid white bg. |
| **Mobile** (390×844 viewport) | No halo. Hamburger menu icon also passes same check if it's an image. |

If you still see a halo → check the PNG was actually saved with alpha channel (`file logo-transparent.png` should say `8-bit/color RGBA`).

## Anti-Patterns (don't do these)

| Anti-pattern | Why bad |
|---|---|
| `mix-blend-mode: multiply` on the `<img>` | Half-fix only. Doesn't compose with `backdrop-filter` on parent. Leaves subtle artifact. |
| Making navbar fully opaque (`rgba(...,1)`) just to hide halo | Kills the premium backdrop-blur effect. Treats symptom, not cause. |
| Uploading JPG to Supabase and hoping for the best | The halo travels with the asset everywhere. Fix at source. |
| `background-color: white` on `.logo img` | Adds a literal white rectangle — defeats the purpose. |
| Server-side white-key on every page load | Wasted compute. Process once at build time. |

## Bonus: Other Images That Need Transparency

Apply the same rule to:
- TripAdvisor badges (their official PNGs are transparent — keep them)
- "Travellers' Choice 2026" award badge
- Payment provider logos in footer
- Award/certification badges anywhere they overlap colored backgrounds

For background photos (hero, destination cards, gallery), JPG is FINE — they're full-bleed and there's no halo issue.

## Navbar CSS Recipe (compatible with transparent logos)

```css
nav {
    position: fixed;
    top: 0;
    width: 100%;
    /* 0.95 alpha + blur = premium glass effect.
       Works because logo PNG is now transparent — no halo to worry about. */
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    z-index: 1000;
    border-bottom: 1px solid var(--border);
    transition: all 0.3s ease;
}

nav.scrolled {
    background: #ffffff;           /* solid when past hero — sharper, more authoritative */
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}
```

## One-Line Summary

> Logos on semi-transparent navbars MUST be true-alpha PNG (or SVG). Convert JPG once with ImageMagick + 8% fuzz, inline as base64 if ≤10KB, verify with 3-state screenshot.
