# SEO Audit — Escape LP (escape.myvivatour.com)

**Audit date:** 2026-05-09
**Page audited:** https://escape.myvivatour.com/
**Target market:** Australia (en-AU)
**Product:** 10-Day Vietnam Tour, $2,099 AUD

---

## TL;DR

Strong technical foundation (6 JSON-LD blocks, full meta/OG/Twitter/hreflang, GTM+GA4+Ads+Pixel firing, 1965 body words, 8 FAQs, sitemap+robots OK). Two **critical content/SEO bugs** kill the page: **H1 = "Escape Australia"** (no Vietnam keyword!) and **JPG-only images with zero `width/height`/`fetchpriority`/WebP** (LCP risk + zero CLS reservation). Quickest 5x ROI = rewrite H1, convert hero to WebP+preload, fix Breadcrumb (only 1 item), and add internal links to /honeymoon /family-tour /luxury-cruise.

## Score: **74 / 100**

| Category | Score | Notes |
|---|---|---|
| Technical SEO | 80 | schema dense, but image perf weak |
| On-page SEO | 70 | H1 wastes primary KW, dest alts thin |
| Content SEO | 78 | 1965 words solid, but no Sapa/Hue/Phu Quoc topical depth |
| Off-page / E-E-A-T | 60 | No Trustpilot, no ABN/ATAS, no author bio |
| Competitive | 65 | missing Qantas Points, money-back, "fly free" hooks |

---

## ✅ Đã ổn (top 5)

1. **Title tag**: "10-Day Vietnam Tour from Australia $2,099 AUD All-Inclusive | MyVivaTour 2026" — 80 chars, contains all 4 mandatory tokens (duration, geo, price, year). Best-in-class vs all 10 competitors.
2. **JSON-LD coverage** — 6 blocks: TravelAgency, TouristTrip + AggregateRating(4.9, 127) + 3 Reviews, FAQPage (8 Q&A), BreadcrumbList, WebPage+Speakable, ItemList for package comparison. Most competitors have 1-2 blocks max.
3. **Meta description** (319 chars in keywords + a clean 220-char description) — has price, destinations, "holiday", CTA, brand. 
4. **OG/Twitter/hreflang** all present + en-AU + x-default + locale=en_AU + canonical. Geo meta (geo.region=AU) reinforced.
5. **Tracking stack complete** — GTM-TPQWV864, GA4 G-LKDCCNJMP3, Ads AW-17709107883, FB Pixel 579298288600609 — fires PageView at load. Sitemap+robots OK.

## ⚠️ Cần cải thiện (Medium severity)

1. **Vacation slip-up** — body uses "vacation" once (American English). Replace with "holiday" everywhere (CLAUDE.md rule).
2. **Destination image alts too thin** — `alt="Hanoi"`, `alt="Hoi An"`, `alt="Mekong Delta"` waste ranking opportunity. Should be `alt="Hanoi Old Quarter — Day 4 of 10-Day Vietnam Tour from Australia"` etc.
3. **Image format** — 44 `.jpg` references, **0 .webp**. Hero alone is ~150KB+ JPG. Convert to WebP/AVIF → 30-50% LCP improvement.
4. **No `width`/`height` on `<img>`** — only 1 of 23 images has dims set. Causes CLS. Add explicit `width=` `height=` to all 22 remaining images.
5. **Year freshness** — body has 10× "2026", **0× "2027"**. AU tour competitors (Intrepid, Inspiring Vacations) use "2026/2027" → catches both query variants. Add 2027 mentions in title alt-line, FAQ, and pricing.

## 🔴 Critical issues (sửa ngay)

### C1. **H1 = "Escape Australia" wastes #1 ranking signal**
**Severity: CRITICAL.** H1 is the strongest on-page signal Google reads. Currently it contains zero target keywords — not "Vietnam", not "tour", not "10-day", not "from Australia". Google will rank competitors who put "Vietnam Tours from Australia" in H1.

Fix → `<h1>10-Day Vietnam Tour from Australia — All-Inclusive Holiday Package 2026</h1>`
Move "Escape Australia" to subtitle or eyebrow text.

### C2. **Hero image not preloaded, JPG, no fetchpriority**
LCP element is the hero `background-image: url('hero-halong-cruise.jpg')` (CSS) — Google PageSpeed cannot prioritize, slow LCP. No `<link rel="preload" as="image">`, no WebP fallback, no `fetchpriority="high"`.

Fix → Add `<link rel="preload" as="image" href="hero-halong-cruise.webp" fetchpriority="high">` in `<head>`. Convert to WebP. Expected LCP gain: 1-2 sec on mobile.

### C3. **BreadcrumbList only has 1 item**
```json
"itemListElement": [{"@type":"ListItem","position":1,"name":"Home","item":"..."}]
```
Single-item breadcrumb is invalid for rich-snippet eligibility. Either remove or expand: Home → Vietnam Tours → 10-Day Vietnam Tour.

### C4. **Zero internal links to sibling tour pages**
Sitemap exposes `/honeymoon`, `/family-tour`, `/luxury-cruise` (priority 0.8) but `escape/index.html` has **0 outbound links** to them. Wastes link equity, kills topical cluster signal.

Fix → Add "Other Vietnam Tours You'll Love" section near footer with 3 cards linking to sibling pages.

### C5. **No NAP / business identity / ATAS / ABN**
For AU travel market, missing **ATAS accreditation, ABN, IATA, physical address** = trust deficit. TripADeal, Wendy Wu, Intrepid all show these. Schema `TravelAgency` has no `address`, no `taxID`, no `accreditation`.

Fix → Add ABN + ATAS number (if applicable) to footer + TravelAgency schema. If not yet ATAS-accredited, add real Vietnam HQ address with `PostalAddress` schema.

---

## 🎯 Top 5 hành động ưu tiên (ROI-ordered)

### 1. Rewrite H1 + Hero subtitle (C1)
- **WHAT:** Change `<h1>Escape Australia</h1>` → `<h1>10-Day Vietnam Tour from Australia — All-Inclusive Holiday Package 2026</h1>`. Move "Escape Australia" to a smaller eyebrow `<span class="eyebrow">Escape Australia · Vietnam Holiday Series</span>` above H1.
- **WHY:** H1 is the second-strongest ranking signal after `<title>`. Zero target keywords in H1 = leaving Tier-1 KW points on the table. Direct competitors (Vietnam Escape Tours, Wendy Wu) put primary KW in H1.
- **HOW:** Edit `pages/escape/index.html` line 1981. Run `node build.js`. Deploy.
- **EFFORT:** S (5 min)
- **IMPACT:** L

### 2. Convert hero + top-fold images to WebP, preload, add dimensions (C2 + perf)
- **WHAT:** Convert `hero-halong-cruise.jpg`, `dest-hanoi.jpg`, `dest-halong.jpg`, `dest-hoian.jpg`, `dest-hcmc.jpg`, `dest-mekong.jpg` → `.webp`. Add `<link rel="preload" as="image" href=".../hero-halong-cruise.webp" fetchpriority="high">`. Add explicit `width="X" height="Y"` to all 23 images.
- **WHY:** LCP currently > 2.5s probable (Cloudflare doesn't auto-WebP for `<img src>`). CLS from no-dimension images reduces Core Web Vitals score. Both are direct ranking factors.
- **HOW:** Use `cwebp -q 82` on source JPGs in `pages/escape/images/`. Update HTML `<img src>` paths. Use `<picture>` with `<source type="image/webp">` + fallback `<img>` for older browsers.
- **EFFORT:** M (1-2 hrs)
- **IMPACT:** L

### 3. Add internal cluster — sibling tour links (C4)
- **WHAT:** Insert new `<section>` before footer: "Discover More Vietnam Holidays" with 3 cards → `/honeymoon`, `/family-tour`, `/luxury-cruise`. Each card has descriptive anchor text e.g. "Vietnam Honeymoon Package · 7 Days · From $1,899 AUD".
- **WHY:** Topical cluster signal + link equity flow. Sitemap declares siblings exist (priority 0.8) but escape page links to none — wasted hub-and-spoke architecture.
- **HOW:** Add HTML block, 6 lines of CSS, link with descriptive `title=` attrs. Add reciprocal links from sibling pages back to escape.
- **EFFORT:** S (30 min)
- **IMPACT:** M

### 4. Enrich destination/gallery alt text with target keywords (on-page)
- **WHAT:** Replace generic alts (`alt="Hanoi"`, `alt="Halong Bay"`) with descriptive AU-targeted alts:
  - `alt="Hanoi Old Quarter cyclo tour — Vietnam 10-day holiday package"`
  - `alt="Ha Long Bay UNESCO cruise — included in $2,099 Vietnam tour from Australia"`
  - `alt="Hoi An lantern night — included in MyVivaTour Vietnam holiday"`
  - `alt="Mekong Delta coconut boat — Day 9 Vietnam tour itinerary"`
- **WHY:** Image search traffic (Google Images is huge for "ha long bay tour" searches). Also feeds context to main ranking. 23 images × 0 keyword density currently.
- **HOW:** Edit `pages/escape/index.html` lines 2042-2391. Build + deploy.
- **EFFORT:** S (20 min)
- **IMPACT:** M

### 5. Fix BreadcrumbList + add ABN/ATAS trust block (C3 + C5)
- **WHAT:**
  (a) Expand BreadcrumbList to 2-3 items: Home → Vietnam Tours → 10-Day Vietnam Tour.
  (b) Add to footer: "ABN: [number] · ATAS Accredited [if applicable] · IATA Member [if applicable] · Vietnam HQ: [address]". Add corresponding `PostalAddress` + `accreditation` to TravelAgency schema.
- **WHY:** (a) Rich-snippet eligibility unlocks breadcrumb display in SERPs (visual + CTR boost). (b) AU travel buyers compare ATAS/ABN before booking — current zero presence vs Wendy Wu/TripADeal hurts conversion.
- **HOW:** Edit JSON-LD block at line 1858 + add footer trust strip. If ATAS not yet obtained, apply at atas.com.au — high-value certification for AU travel agencies.
- **EFFORT:** S (15 min) for breadcrumb + footer; M (weeks) for ATAS application
- **IMPACT:** M

---

## Detailed findings (reference)

### Tracking & infrastructure
- ✅ GTM-TPQWV864, GA4 G-LKDCCNJMP3, Ads AW-17709107883, FB Pixel 579298288600609 all present
- ✅ Robots.txt OK (Cloudflare managed, allows search, blocks AI scrapers — fine)
- ✅ Sitemap.xml lists 4 URLs, points to escape.myvivatour.com
- ⚠️ Robots.txt blocks ClaudeBot, GPTBot, Google-Extended → AI-search visibility (ChatGPT, Perplexity, Gemini SGE) **disabled**. Reconsider for brand discovery; AI-search traffic is rising fast in AU.

### Title/meta
- Title: 80 chars, perfect token coverage
- Meta description: ~225 chars (a bit long, Google may truncate at ~160). Trim to 158 chars max.
- Meta keywords: 1690+ chars — **excessive**, Google ignores meta keywords. Reduce to 25 KWs max or remove entirely. (Bing still uses it minimally.)
- Canonical, hreflang en-AU + x-default ✅

### Heading structure
- 1× H1 ✅ (but wastes keyword — see C1)
- 12× H2 ✅ good
- H3s well-distributed (highlight cards, FAQ, pricing) ✅

### Schema.org
- TravelAgency, TouristTrip (with offer + aggregateRating 4.9/127 + 3 Reviews + 10-step itinerary), FAQPage (8 Q&A), BreadcrumbList, WebPage+Speakable, ItemList = **6 blocks**. Excellent coverage.
- ⚠️ AggregateRating ratingCount=127 + reviewCount=89 — make sure these are **defensible numbers** (Google penalizes fake review counts). Document the source.
- ⚠️ Breadcrumb has only 1 item → invalid

### Content (1965 body words)
- ✅ Beats budget competitors (Vietnam Escape Tours ~800 words)
- ⚠️ Below premium AU competitors: Wendy Wu 2500+, Intrepid 3000+, Inspiring Vacations 2200+
- **Topical gaps vs competitors:**
  - **Sapa** (only 2 mentions, in review alt only) — major Vietnam KW
  - **Hue** (1 mention) — Imperial City KW used by 3+ competitors
  - **Phu Quoc, Ninh Binh, Tam Coc** — zero mentions
  - **Vietnam visa for Australians** — covered in 1 FAQ; expand to dedicated 200-word section (rich for long-tail)
  - **Best time to visit Vietnam by month** — competitors have month-by-month tables; you have 1 sentence
- Keyword density (case-insensitive): "vietnam tour" 16, "vietnam holiday" 5, "Hanoi" 31, "Hoi An" 25, "Ho Chi Minh" 19, "Ha Long" 15, "Mekong" 13, "Cu Chi" 6, "all inclusive" 15, "from Australia" 7. Good for primary; thin for Sapa/Hue.

### Images
- 23 `<img>` total (per task), 22 with non-empty alt, 0 empty alt ✅
- 0 WebP, 44 JPG references → perf opportunity
- 4 `loading="lazy"` (only on testimonial review imgs); should be on **all below-fold images** including destination, gallery, why-trust. Hero stays eager + preloaded.
- 0 `fetchpriority` attrs — add `fetchpriority="high"` on hero
- 1 of 23 images has explicit `width=`/`height=` → CLS risk

### Internal linking
- 35 in-page anchor links (good for UX)
- 5 same-domain absolute links (mostly canonical/og)
- **0 links to /honeymoon, /family-tour, /luxury-cruise** ← C4
- 1 outbound dofollow to `myvivatour.com/blogs/...` (good — sends authority back to root domain)
- Footer social links missing `rel="noopener noreferrer"` — minor

### Performance signals (static analysis)
- HTML 148 KB raw, 28 KB gzipped — acceptable
- Inline CSS large but cached in HTML (Cloudflare cache: max-age=3600 ✅)
- Google Fonts: Playfair Display + Plus Jakarta Sans both 400/500/600/700 = 8 weights → **trim to 4** (heading 700 + body 400/600). Saves ~50-100KB font payload.
- No JS bundle, no third-party tag manager beyond GTM ✅

### Off-page / E-E-A-T
- ✅ AggregateRating in schema + 3 visible reviews on page
- ✅ Founded 2015 declared in TravelAgency schema
- ✅ Author "Rachel Pham" in 1 blog card (good Author signal)
- ❌ No "About the team" / founder bio / company photo
- ❌ No Trustpilot embed (vs Intrepid 15K+, Inspiring Vacations Excellent rating)
- ❌ No TripAdvisor badge
- ❌ No ABN, ATAS, IATA, physical address
- ❌ No press mentions, awards, "Featured in" logos
- ❌ Author of blog story not linked to LinkedIn / bio page

### Competitive gap (vs Intrepid, TripADeal, Wendy Wu)

| Feature | Intrepid | TripADeal | Wendy Wu | **MyVivaTour** |
|---|---|---|---|---|
| Trustpilot/TripAdvisor visible | ✅ 15K+ | ✅ trusted | ✅ award | ❌ Facebook only |
| Qantas Points | ❌ | ✅ | ❌ | ❌ |
| "Fly Free" / "Flights Included" hook | partial | ✅ | ✅ FREE | ✅ Included (good) |
| Money-back guarantee | ❌ | ✅ flex pay | partial | ❌ |
| ATAS / ABN displayed | ✅ | ✅ | ✅ | ❌ |
| Founder/Team bio page | ✅ | ✅ | ✅ | ❌ |
| AU phone number | ✅ | ✅ | ✅ 1300 | ❌ (only +84 Vietnam) |
| Dedicated Vietnam blog hub | ✅ | partial | ✅ | partial (1 link) |
| Year-pair (2026/2027) | ✅ | ✅ | ✅ | ❌ 2026 only |
| Sapa, Hue dedicated sections | ✅ | ✅ | ✅ | ❌ |

**Highest-impact missing items**: AU phone number, Trustpilot/TripAdvisor proof, 2026/2027 dual-year, Sapa+Hue topical sections.

### Keywords coverage vs CLAUDE.md database

| Tier | Coverage |
|---|---|
| Tier 1 Primary (6 KWs) | 6/6 ✅ all in title/meta/H2 |
| Tier 2 Destination (10 KWs) | 6/10 — missing Sapa, Hue, Ninh Binh, Phu Quoc as topical sections |
| Tier 3 Long-tail (15 KWs) | ~10/15 in meta keywords; only 4-5 used in body |
| Tier 4 FAQ (5 KWs) | 4/5 (missing "vietnam currency exchange AUD") |

---

## Unresolved questions

1. Is MyVivaTour ATAS-accredited? Has an Australian ABN? If yes → must display. If no → consider applying (high-value AU travel cert).
2. Are AggregateRating numbers (127 ratings, 89 reviews) **verifiable from Facebook**? Google penalizes manufactured rating counts.
3. Is there a planned Australian phone number (1300/1800)? Current `+84` Vietnam-only number reduces AU buyer trust.
4. Will sibling tour pages (`/honeymoon`, `/family-tour`, `/luxury-cruise`) actually launch soon? If 6+ months out, sitemap entries may trigger soft-404 issues.
5. Does the Cloudflare Worker support `image-resizing` / `polish=lossy` for auto-WebP? If yes, lighter fix than manual conversion.
6. Author "Rachel Pham" — is there an author page / LinkedIn for E-E-A-T signal?
7. Should robots.txt allow ClaudeBot / GPTBot / Google-Extended for AI-search visibility (vs default Cloudflare block)?
