# SEO Audit: escape.myvivatour.com
**Date:** 2026-03-29 | **Score:** 52/100 (D+)

## Executive Summary
The site has good on-page content with proper meta tags and OG tags, but is severely lacking in technical SEO fundamentals. Missing JSON-LD schema, canonical URL, Twitter Cards, sitemap.xml, and having almost zero internal links are critical gaps that limit search visibility. The robots.txt is Cloudflare-managed and blocks all major AI crawlers.

## Quick Stats
| Metric | Value | Status |
|--------|-------|--------|
| HTTPS | Yes (Cloudflare) | ✅ |
| Language | `en` declared | ✅ |
| Internal Links | 1 (self-referencing) | ❌ |
| External Links | 2 (WhatsApp, mailto) | ⚠️ |
| Images | 18 total, 17 with alt | ⚠️ |
| Schema/JSON-LD | None | ❌ |

## Technical SEO Checklist

| Element | Status | Details |
|---------|--------|---------|
| Title Tag | ✅ | "Escape Australia - 10 Day Vietnam Tour \| MyVivaTour" — 52/60 chars, good keywords |
| Meta Description | ✅ | 147/160 chars, includes price + destinations + brand |
| Meta Keywords | ✅ | Present: "Vietnam tour, Escape Australia, MyVivaTour, Ha Long Bay, luxury travel, all-inclusive" |
| Meta Viewport | ✅ | `width=device-width, initial-scale=1.0` |
| H1 Tag | ✅ | 1 found: "Escape Australia" |
| Heading Hierarchy | ✅ | Clean: 1×H1, 9×H2, 16×H3, 1×H4 — proper nesting |
| URL Structure | ✅ | Clean root domain, no query params |
| Image Alt Tags | ⚠️ | 17/18 optimized — 1 image missing alt text |
| Canonical URL | ❌ | **Missing** — no `<link rel="canonical">` tag |
| Schema/JSON-LD | ❌ | **Missing** — no structured data at all |
| Open Graph | ✅ | og:title, og:description, og:image, og:url, og:type present |
| Twitter Cards | ❌ | **Missing** — no twitter:card, twitter:title, twitter:image |
| Robots Meta | ⚠️ | Not explicitly set (defaults to index,follow — OK but should be explicit) |
| Mobile Friendly | ✅ | Responsive CSS with media queries, viewport set |
| Page Speed | ⚠️ | Heavy inline CSS in `<head>`, images from external CDN (Supabase), no lazy loading detected |
| Internal Links | ❌ | Only 1 self-link — no navigation links, no footer links to other pages |
| External Links | ⚠️ | 2 only (WhatsApp + mailto) — no nofollow on outbound |
| HTTPS | ✅ | Secured via Cloudflare |
| HTML Lang | ✅ | `lang="en"` on `<html>` tag |
| Hreflang | ❌ | **Missing** — no alternate language tags |
| Favicon | ⚠️ | SVG inline favicon (data URI) — not a proper .ico/.png file |
| robots.txt | ⚠️ | Cloudflare-managed, blocks AI bots (ClaudeBot, GPTBot, etc.) — OK for AI but verify Google is allowed |
| Sitemap | ❌ | **Missing** — /sitemap.xml returns the HTML page, not XML sitemap |
| YouTube Embed | ⚠️ | iframe embed present — no lazy loading, affects LCP |

## Issues by Priority

### Critical
1. **No JSON-LD/Schema markup** — Search engines can't understand this is a TourPackage/Product. Missing TourPackage, FAQPage, Organization, BreadcrumbList schemas. This directly impacts rich snippet eligibility.
2. **No canonical URL** — Risk of duplicate content issues, especially if accessible via www/non-www or with query params.
3. **No sitemap.xml** — Search engines have no URL map for crawling. /sitemap.xml returns HTML instead of XML.
4. **Almost zero internal links** — Only 1 self-referencing link. No nav links, no footer links, no cross-page linking. Terrible for crawlability and link equity.

### High
5. **No Twitter Card tags** — Missing twitter:card, twitter:title, twitter:description, twitter:image. Shared links on X/Twitter will look poor.
6. **No hreflang tags** — If targeting Australian audience specifically, should declare `en-AU`. Also needed if other language versions exist.
7. **Favicon is inline SVG data URI** — Not a proper favicon file. Some browsers/bookmarks won't display it correctly. No apple-touch-icon.

### Medium
8. **1 image missing alt text** — One of 18 images has no alt attribute.
9. **No explicit robots meta tag** — Should add `<meta name="robots" content="index, follow">` explicitly.
10. **YouTube iframe not lazy-loaded** — Embedded video blocks rendering. Use `loading="lazy"` or facade pattern.
11. **Heavy inline CSS in `<head>`** — All styles are inlined (no external stylesheet). Increases HTML payload size, prevents CSS caching.
12. **No `preconnect` hints** — Images served from `tnwelgvypmhhksqwnfmr.supabase.co` — should add `<link rel="preconnect">` for faster loading.

### Low
13. **No `nofollow` on external links** — WhatsApp/mailto links don't need nofollow, but good practice for any future external links.
14. **Meta keywords tag** — Not harmful but Google ignores it. Low priority.
15. **No breadcrumb navigation** — Single-page site, minor issue.

## Recommendations

| # | Action | Priority | Effort | Impact |
|---|--------|----------|--------|--------|
| 1 | Add JSON-LD schemas: TourPackage, FAQPage, Organization | Critical | Medium | High — enables rich snippets in Google |
| 2 | Add `<link rel="canonical" href="https://escape.myvivatour.com/">` | Critical | Quick Win | High — prevents duplicate content |
| 3 | Create proper sitemap.xml and reference in robots.txt | Critical | Quick Win | High — improves crawlability |
| 4 | Add navigation links (even anchor links count) + footer with links | Critical | Medium | High — improves crawlability + UX |
| 5 | Add Twitter Card meta tags (card, title, description, image) | High | Quick Win | Medium — better social sharing |
| 6 | Add hreflang tag `<link rel="alternate" hreflang="en-au">` | High | Quick Win | Medium — geo-targeting signal |
| 7 | Add proper favicon.ico + apple-touch-icon | High | Quick Win | Low — branding/bookmarks |
| 8 | Fix missing alt text on 1 image | Medium | Quick Win | Low |
| 9 | Add `loading="lazy"` to below-fold images and YouTube iframe | Medium | Quick Win | Medium — improves LCP |
| 10 | Add `<link rel="preconnect" href="https://tnwelgvypmhhksqwnfmr.supabase.co">` | Medium | Quick Win | Medium — faster image loads |
| 11 | Extract CSS to external file for caching | Medium | Medium | Medium — reduces HTML size, enables caching |
| 12 | Add explicit `<meta name="robots" content="index, follow">` | Low | Quick Win | Low |

## Data Sources
- Firecrawl scrape: yes (markdown, HTML, rawHTML, links)
- robots.txt: yes (Cloudflare-managed)
- sitemap.xml: yes (missing — returns HTML)
- ReviewWeb API: no (key not available)
