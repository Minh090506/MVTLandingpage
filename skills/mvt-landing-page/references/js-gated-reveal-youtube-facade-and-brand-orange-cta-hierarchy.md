# Render Resilience + CTA Color Hierarchy

Patterns shipped to `escape.myvivatour.com` on **2026-05-16** (commits `08418aa` + `73581c9`) after a visual audit revealed three classes of failure mode that all looked fine in code review but broke in production screenshots:

1. **"Blank section" failure** — scroll-reveal cards started at `opacity: 0` and depended on `IntersectionObserver`. If JS was slow, throttled, or failed, the cards stayed invisible.
2. **"Huge empty box" failure** — the YouTube `<iframe loading="lazy">` left a ~600px white rectangle between sections until the iframe initialised, killing scroll momentum.
3. **"Competing CTAs" failure** — the nav "Book Now" was the same gold as the hero CTA, splitting visual attention. Worse, gold on a tinted hero photo had weak contrast — the price + CTA didn't pop.

Each is solved with a small, isolated change. Together they push the page from "looks decent" to "looks intentional."

## Pattern 1 — Visible-by-default scroll reveal (html.js gate)

### The trap

```css
/* Common but fragile */
.section-reveal {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s, transform 0.6s;
}
.section-reveal.visible {
    opacity: 1;
    transform: translateY(0);
}
```

This works when JS runs fast and `IntersectionObserver` fires on time. It breaks when:

- A slow CPU delays the observer callback
- JS is blocked by an extension or CSP
- A static-snapshot tool (Lighthouse, Playwright `fullPage`, search crawler) captures before observer fires
- Reduced-motion logic disables the observer but forgets to remove the hidden state

In all these cases, the user sees a **blank section** where there should be content. Conversion impact: scroll past, never see the value prop, bounce.

### The fix

Gate the hidden state behind a `js` class on `<html>`, set synchronously in `<head>` **before any CSS renders**:

```html
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- MUST be first script in <head> — runs synchronously before paint -->
  <script>document.documentElement.classList.add('js');</script>
  ...
</head>
```

```css
/* Default: content visible. Animation transitions apply but element starts at final state. */
.section-reveal {
    transition: opacity 0.6s cubic-bezier(0.22,0.61,0.36,1),
                transform 0.6s cubic-bezier(0.22,0.61,0.36,1);
}
/* Hidden state ONLY when JS has loaded (observer will fire to reveal) */
html.js .section-reveal:not(.visible) {
    opacity: 0;
    transform: translateY(20px);
}
.section-reveal.visible {
    opacity: 1;
    transform: translateY(0);
}
```

Apply to every card class that has a stagger/reveal animation: `.highlight-card`, `.destination-card`, `.gallery-item`, `.upgrade-card`, `.testimonial-card`, `.blog-card`. Pattern is identical:

```css
.highlight-card { /* normal styles */ }
html.js .highlight-card:not(.visible) { opacity: 0; transform: translateY(20px); }
```

### Why an inline script (not deferred)

The inline `<script>` MUST run before any element renders, otherwise the `opacity: 0` baseline applies briefly (FOUC of *invisible* content). Inline blocking scripts cost ~0ms parse time when they're 50 bytes — negligible. Never put this in a deferred external file.

### How to verify

```bash
# Disable JS in Chrome DevTools → reload → all sections must be visible
# Or: curl + grep — content must be present in raw HTML, not just in observer callbacks
```

## Pattern 2 — YouTube facade (poster + click-to-load)

### The trap

```html
<iframe src="https://www.youtube.com/embed/VID?rel=0&modestbranding=1"
        loading="lazy" allow="..." allowfullscreen></iframe>
```

`loading="lazy"` does NOT mean "show a placeholder until the user scrolls near." It means "delay network fetch until near viewport." The empty iframe box still occupies its aspect-ratio space — which is ~506px tall at 900px wide. While the user is scrolling past the video section, they see a **large white rectangle** for several hundred milliseconds. On slow connections, it stays empty for seconds.

### The fix — facade pattern

Render a static `<div>` styled as the video, with the YouTube poster image as its background. Click loads the real iframe.

```html
<div class="video-container">
    <div class="video-facade"
         role="button"
         tabindex="0"
         aria-label="Play 10-day Vietnam tour video"
         data-youtube-id="3ASbxKprZSc"
         style="background-image:url('https://i.ytimg.com/vi/3ASbxKprZSc/maxresdefault.jpg');">
        <div class="video-facade-play" aria-hidden="true"></div>
        <div class="video-facade-label">▶ Watch the 10-day journey · 2 min</div>
    </div>
</div>
```

```css
.video-container {
    max-width: 900px;
    margin: 0 auto;
    aspect-ratio: 16 / 9;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
}
.video-facade {
    position: relative;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}
.video-facade::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 100%);
}
.video-facade-play {
    position: relative;
    width: 84px;
    height: 84px;
    border-radius: 50%;
    background: var(--accent-grad);
    box-shadow: 0 12px 36px var(--accent-glow), 0 0 0 8px rgba(255,255,255,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.25s ease;
}
.video-facade:hover .video-facade-play {
    transform: scale(1.08);
}
.video-facade-play::after {
    content: '';
    width: 0; height: 0;
    border-left: 22px solid #fff;
    border-top: 14px solid transparent;
    border-bottom: 14px solid transparent;
    margin-left: 6px;
}
.video-facade-label {
    position: absolute;
    bottom: 1.25rem;
    left: 50%;
    transform: translateX(-50%);
    color: #fff;
    font-weight: 600;
    font-size: 0.95rem;
    text-shadow: 0 2px 8px rgba(0,0,0,0.6);
    white-space: nowrap;
}
```

```js
document.querySelectorAll('.video-facade').forEach(function(facade) {
    const load = function() {
        const id = facade.getAttribute('data-youtube-id');
        if (!id) return;
        const iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        iframe.setAttribute('allowfullscreen', '');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        facade.replaceWith(iframe);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'video_play', video_id: id });
    };
    facade.addEventListener('click', load);
    facade.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); load(); }
    });
});
```

### Wins

- **Visual**: no blank box ever. The poster image looks more polished than YouTube's own embed wrapper anyway.
- **Performance**: skips ~500KB of YouTube iframe weight on initial page load. Only loads when user actually wants the video.
- **Analytics**: fires a `video_play` dataLayer event on activation — gives an intent signal you don't get from passive iframe embeds.
- **Accessibility**: `role="button"` + `tabindex="0"` + Enter/Space keyboard handler keeps it usable without a mouse.

### Poster URLs

YouTube CDN provides 4 sizes — use `maxresdefault.jpg` first, fall back to `hqdefault.jpg` if a video doesn't have a maxres:

| URL | Size |
|---|---|
| `https://i.ytimg.com/vi/{ID}/maxresdefault.jpg` | 1280×720 (preferred) |
| `https://i.ytimg.com/vi/{ID}/sddefault.jpg` | 640×480 |
| `https://i.ytimg.com/vi/{ID}/hqdefault.jpg` | 480×360 (always exists) |
| `https://i.ytimg.com/vi/{ID}/mqdefault.jpg` | 320×180 |

## Pattern 3 — CTA color hierarchy: brand orange for primary, gold demoted to accent

### The problem

Original page used `--primary: #D4AF37` (gold) for:
- Hero "Get a Quote" CTA
- Hero price badge
- Mobile sticky bar "Book Now" button + price text
- Nav "Book Now" pill (solid gold)
- Booking form submit button

Two failure modes:

1. **Weak contrast on hero**: gold on a tinted-photo hero is barely 3.2:1 — the price/CTA blends into the background rather than commanding attention. AU 35-65 audience at $2,099 AUD won't squint to find the action.
2. **Competing CTAs**: solid-gold nav "Book Now" pulled visual focus away from the single-CTA hero pattern. Two big gold buttons in the same viewport = neither wins.

### The fix — three-color token system

Introduce a separate `--accent` for primary actions, keep `--primary` (gold) for decorative work (TripAdvisor stars, hover, dividers, brand accents):

```css
:root {
    --primary: #D4AF37;        /* Brand gold — decorative ONLY now (stars, accents, dividers) */
    --primary-text: #A8842A;   /* Darker gold for body text on white */
    --accent: #E8622A;         /* Orange-red — matches logo, used for ALL primary CTAs + price */
    --accent-dark: #C84F1D;    /* Hover */
    --accent-grad: linear-gradient(135deg, #FF6B35 0%, #E8622A 100%);
    --accent-glow: rgba(232, 98, 42, 0.45);
}
```

The `--accent` value should **come from the logo** (sample the dominant brand color). MVT logo is `#E8622A` — using it for CTAs ties the visual hierarchy back to brand identity.

### Apply to primary actions

```css
.cta-button {
    background: var(--accent-grad);
    color: #fff;
    box-shadow: 0 10px 30px var(--accent-glow);
}
.cta-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 42px var(--accent-glow);
    filter: brightness(1.05);
}
.price-badge {
    background: var(--accent-grad);
    color: #fff;
    box-shadow: 0 12px 32px var(--accent-glow);
}
.cta-button-hero {
    box-shadow: 0 12px 32px var(--accent-glow);
    animation: ctaPulse 2.4s ease-in-out infinite;
}
@keyframes ctaPulse {
    0%, 100% { box-shadow: 0 12px 32px var(--accent-glow); }
    50%      { box-shadow: 0 18px 48px rgba(232, 98, 42, 0.75); }
}
```

Mobile sticky bar must match — the user circled this specifically when asking for the colour change:

```css
.mobile-book-bar .bar-price span {
    color: #FF8A5C;  /* lighter orange tint for contrast on dark navy bar bg */
    font-weight: 800;
}
.mobile-book-bar .bar-btn {
    background: var(--accent-grad);
    color: #fff;
    border-radius: 999px;
    box-shadow: 0 6px 18px var(--accent-glow);
}
```

### Demote nav "Book Now" to outlined

The nav button must be visible (it's a wayfinding tool) but must NOT compete with the hero CTA. Solution: outlined-orange when at top, fills in on scroll:

```css
.cta-button-nav {
    background: transparent !important;
    color: var(--accent) !important;
    border: 2px solid var(--accent) !important;
    padding: 0.55rem 1.4rem !important;
    font-size: 0.92rem !important;
    box-shadow: none !important;
}
.cta-button-nav:hover {
    background: var(--accent) !important;
    color: #fff !important;
}
/* Once user scrolls past hero, nav goes solid — sticky bar replaces hero CTA as primary action */
nav.scrolled .cta-button-nav {
    background: var(--accent-grad) !important;
    color: #fff !important;
    border-color: transparent !important;
    box-shadow: 0 4px 14px var(--accent-glow) !important;
}
```

The `!important` is justified here because `.cta-button-nav` is a modifier on top of `.cta-button` — it has to override the base button's solid background.

### Where gold still lives

Don't strip gold entirely — it's still the brand's secondary colour and matches the TripAdvisor 5-star yellow palette. Keep gold for:

- TripAdvisor `★★★★★` stars
- Accordion `:focus-visible` outline
- Section dividers / accent borders on testimonial cards
- Hover states on outlined buttons (when not orange)
- "Travellers' Choice" badge accents
- Logo (it's untouchable anyway)

## Hardening checklist

Before shipping a new tour LP:

- [ ] `<script>document.documentElement.classList.add('js');</script>` is the **first** script in `<head>` (before any other content)
- [ ] All `opacity: 0` baseline states on reveal/stagger cards are gated with `html.js .{class}:not(.visible)`
- [ ] Disable JS in DevTools → reload → confirm ALL sections show content (no blank rectangles)
- [ ] Video embeds use facade pattern (poster + click-to-load), never `<iframe loading="lazy">` directly
- [ ] Poster image URL uses `i.ytimg.com/vi/{ID}/maxresdefault.jpg` (verify it exists by curling)
- [ ] `video_play` dataLayer event fires on facade activation (check GTM Preview)
- [ ] `--accent` token sampled from the brand logo (not arbitrarily picked)
- [ ] Hero CTA, price badge, sticky bar button, booking form CTA all use `var(--accent-grad)`
- [ ] Nav "Book Now" is outlined when `nav` lacks `.scrolled` class, fills in when scrolled
- [ ] Gold (`--primary`) is no longer applied to any primary action — only decorative accents
- [ ] Sticky mobile bar price text uses lighter tint (`#FF8A5C`) for contrast on dark navy bg

## How to verify the rendered result

After deploying:

```bash
# Curl + grep — confirms new tokens + pattern presence
curl -s https://escape.myvivatour.com/ | grep -c '\-\-accent\|video-facade\|html\.js\|cta-button-nav'
# expect: 30+

# Playwright screenshot disable JS to test render resilience
# (or just open in Chrome with JS disabled via DevTools → Settings → Debugger → Disable JS)
```

For visual verification, screenshot the page in 3 states:
1. **Hero (top of page, JS enabled)** — orange CTA + price badge should pop against the hero photo
2. **Hero (JS disabled)** — every card section below the hero should still be visible (just no fade-in)
3. **Mid-page scrolled** — nav "Book Now" should fill in to orange gradient; sticky bar should slide up on mobile

If any screenshot has a blank section or a gold primary CTA, ship is not ready.
