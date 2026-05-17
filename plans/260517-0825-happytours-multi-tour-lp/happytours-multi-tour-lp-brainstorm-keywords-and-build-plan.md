# Happy Tours Multi-Tour Landing Page — Plan

**Target URL**: `happytours.myvivatour.com`
**Tours**: Honeymoon · Family · Luxury Cruise (3-in-1)
**Created**: 2026-05-17
**Skill used**: `mvt-landing-page`

---

## 1. Brainstorm — Architecture Decision

Three options considered:

| Option | Description | Pros | Cons |
|---|---|---|---|
| **A** | 1 page, 3 sections stitched flat | Simple, one URL | Diluted SEO, no per-tour focus |
| **B** | 1 page with sticky tour-selector tabs + deep sections per tour + shared booking | **Captures multi-intent search**, easy compare, single conversion path | Slightly longer build |
| **C** | 3 separate sub-pages with shared header | Best per-tour SEO | 3× maintenance, no compare flow, weaker for multi-intent search |

→ **Choosing B**. Reasons:
- AU 35-65 demo often arrives undecided ("I want a Vietnam tour" not "I want a honeymoon tour specifically")
- Compare table = strong CRO mechanic for indecisive buyers
- Single booking form with "Which tour?" radio = simpler funnel than 3 separate forms
- One ad-account URL for Google Ads multi-keyword targeting
- Future: easy to add 4th, 5th tour without rebuilding

---

## 2. Page Structure (final)

Following skill rules: **Trust Before Price + Value-Stack Before Form**.

```
1.  Hero
    "3 Ways to Discover Vietnam from Australia"
    Single CTA → scroll to tour selector
    Trust bar (TripAdvisor + 500+ AU travellers + Operating since 2015)

2.  Tour Selector Strip (sticky after hero)
    3 large visual cards — Honeymoon / Family / Luxury Cruise
    Click → smooth-scroll to that tour's section

3.  Tour Section: 💕 HONEYMOON — 7-day  ($1,899 AUD)
    - Hero image: Hội An lanterns + Phú Quốc sunset
    - 6 highlight pills (private cruise · 5-star · couples massage · candlelight dinner · …)
    - Day-plan snippet (collapsible accordion, 7 days)
    - Price card + "Quote for Honeymoon" CTA → booking form pre-selected

4.  Tour Section: 👨‍👩‍👧 FAMILY TOUR — 8-day  ($1,699 AUD)
    - Hero image: Halong Bay + Mekong + Hanoi Old Quarter
    - 6 highlight pills (kid-friendly meals · short drive days · pool time · cultural activities · …)
    - Day-plan snippet
    - Price card + CTA

5.  Tour Section: ✨ LUXURY CRUISE — 12-day  ($3,499 AUD)
    - Hero image: Cruise_HaLong premium cruise interior
    - 6 highlight pills (suite cabin · butler · all-inclusive drinks · specialty dining · …)
    - Day-plan snippet
    - Price card + CTA

6.  Compare All Table  (sticky tab strip pin here)
    3-column side-by-side:
    | Tour | Honeymoon | Family | Luxury Cruise |
    | Days | 7 | 8 | 12 |
    | From | $1,899 | $1,699 | $3,499 |
    | Hotels | 5-star | 4-star + kid-friendly | 5-star + cruise suite |
    | Best for | Couples | Families with kids 5-14 | Premium travellers |
    | Daily pace | Relaxed | Moderate | Indulgent |
    | Group size | Private/2 | 4-6 | 8-12 |

7.  Why MyVivaTour (shared trust)
    Same 6 cards as escape page (Personalised, Guides, All-Inclusive, 24/7, Hotels, Experiences)

8.  Video — One shared "10-day Vietnam Discovery" YouTube facade (id: 3ASbxKprZSc)
    + label "See Vietnam through our travellers' eyes"

9.  Testimonials — TripAdvisor block (same 6 reviewers used on escape)
    Featured Aussie = Emily & James from Australia (real customer photo from Drive)

10. Highlights ("Why Choose MyVivaTour Tours") + Bridge CTA → form

11. Booking Form
    - "Which tour are you interested in?" radio at top
        ( ) 💕 Honeymoon Package
        ( ) 👨‍👩‍👧 Family Tour
        ( ) ✨ Luxury Cruise
        ( ) 🤔 Not sure — help me choose
    - Name / Email / Phone / Departure City
    - Per-tour-specific chip variations shown via JS toggle (or all chips visible, optional)
    - Smart message placeholder
    - Submit → Web3Forms → sales email with tour interest flagged
    - Risk reversal strip below button

12. Footer
```

---

## 3. Keyword Strategy

Reference: SKILL.md keyword DB + competitor analysis from `SEO-KEYWORD-REPORT.md`.

### Tier 1 — Title + H1 + meta description (umbrella keywords)

- **Primary H1**: "Vietnam Tour Packages from Australia — Honeymoon, Family & Luxury Cruise"
- **Title tag**: "Vietnam Holiday Packages from Australia 2026 | Honeymoon · Family · Luxury Cruise | MyVivaTour"
- **Meta description**: "Discover 3 ways to experience Vietnam — romantic honeymoon, family adventure, or luxury cruise. All-inclusive from Australia, prices from $1,699 AUD. Book your 2026 Vietnam holiday with trusted Aussie tour operator. ★ 5.0 / 230+ reviews."

### Tier 2 — Section H2 (per-tour focus)

- Honeymoon: "Vietnam Honeymoon Package from Australia — 7 Days of Romance"
- Family: "Vietnam Family Tour from Australia — 8 Days for Memories"
- Luxury Cruise: "Luxury Vietnam Cruise from Australia — 12 Days of Indulgence"

### Tier 3 — Body copy / FAQ / long-tail

Honeymoon-specific:
- `vietnam honeymoon package from australia`
- `romantic vietnam tour for couples`
- `vietnam honeymoon halong bay cruise`
- `private vietnam honeymoon tour`
- `best honeymoon destination southeast asia 2026`

Family-specific:
- `vietnam family tour from australia`
- `vietnam tour for families with kids`
- `kid-friendly vietnam holiday`
- `vietnam family holiday package 2026`
- `multi-generation vietnam tour`

Luxury cruise-specific:
- `luxury vietnam cruise tour`
- `5-star halong bay cruise`
- `vietnam luxury holiday package`
- `private luxury vietnam tour`
- `premium vietnam cruise from australia`

Shared:
- `vietnam tour packages from australia 2026`
- `all inclusive vietnam holiday`
- `vietnam tour with flights included`
- `ha long bay tour`, `hoi an`, `hanoi`, `mekong delta` (Tier 2 destinations from SKILL.md)

### Australian English compliance
- Use "holiday" never "vacation"
- Use "travellers" never "travelers"
- Include "from Australia" + year (2026) in title

---

## 4. Resource Inventory (verified in Drive)

**Image source**: `~/Library/CloudStorage/GoogleDrive-nguyenducminh85bk@gmail.com/Shared drives/Marketing/MY VIVA TOUR/MVT_Kho ảnh/`

### Per-tour hero candidates

| Tour | Hero source | Filename pattern |
|---|---|---|
| Honeymoon | Hội An (lantern romance) + Phú Quốc (beach sunset) | `HoiAn_*.webp`, `PhuQuoc_*.webp` |
| Family | Hà Nội Old Quarter + Mekong boat ride | `HaNoi_*.webp`, `Mekong_*.webp` |
| Luxury Cruise | Hạ Long premium cruise interior | `Cruise_HaLong_1..21.webp` (21 photos!) |

### Customer photos (gold for testimonials)

- `Emily and James from Australia.jpg` → **Honeymoon featured**
- `Wei Ling and Jason from Singapore 1.jpg` → Honeymoon supporting
- `The Tan Family from Malaysia.jpg` → **Family featured**
- `The Sharma Family from India.jpg` → Family supporting

### Videos available

- `AUV10_dọc.MOV` / `AUV10_ngang.MOV` — 10-day tour (already on YouTube as `3ASbxKprZSc`)
- `VT15 dọc.mp4` — possibly 15-day variant — not yet uploaded to YouTube
- YouTube channel `@myvivatour` — channel ID `UCIzYX2K95C-HAabwYSdkYuQ`

**Decision**: reuse the existing YouTube video `3ASbxKprZSc` (10-day journey teaser) in section 8 — it visually showcases destinations all 3 tours visit. If a per-tour video is needed later, upload `VT15` + new luxury cruise reel to YouTube.

---

## 5. Tracking + Conversion

Same tracking stack as escape page (already proven working):

- GTM: `GTM-TPQWV864`
- GA4: `G-LKDCCNJMP3`
- Google Ads: `AW-17709107883/Wq0ECKXBmfsbEKuVrvxB`
- Facebook Pixel: `579298288600609`

**New dataLayer params for multi-tour LP**:
- `tour_interest`: "honeymoon" | "family" | "luxury_cruise" | "not_sure" — from form radio
- `selector_clicked`: which tour card the visitor clicked first in the selector strip
- Existing: `departure_city`, `interests`, `interest_count`

This enables GA4 segmentation: which tour pulls best by ad source, AU city, season.

---

## 6. Build Phases

### Phase A — Tour Data Acquisition (≈ 25 min)

Scrape `myvivatour.com` for actual tour pages of the 3 tours. Use Firecrawl with `proxy: 'stealth'`.

Target URLs (to verify exist):
- `https://myvivatour.com/tour/vietnam-honeymoon-package/` (or similar)
- `https://myvivatour.com/tour/vietnam-family-tour/`
- `https://myvivatour.com/tour/luxury-vietnam-cruise/`

Extract: real itineraries, inclusions, real pricing, upgrade options. If pages don't exist with these exact slugs, search myvivatour.com and adapt.

Fallback pricing baselines (from CLAUDE.md):
- Honeymoon: $1,899 AUD 7-day
- Family: $1,699 AUD 8-day
- Luxury Cruise: $3,499 AUD 12-day

### Phase B — Image Pipeline (≈ 30 min)

1. From Drive, hand-pick ~30 images total (10 per tour × 3 = 30):
   - 3 hero banners (1920×800)
   - 6 destination/tour highlights (1200×800)
   - 9 gallery thumbnails (800×600)
   - 3-6 customer photos (cropped to portrait 600×800)

2. Run through Python Pillow optimizer (already exists from escape build) to:
   - Resize to LP dimensions
   - Convert to WebP @ quality 82
   - Save to `pages/happytours/images/` and `upload-ready/`

3. Upload to Supabase Storage bucket `landing-images` (folder: `happytours/`) via existing `auto-upload.html` workflow

4. Get public URLs

### Phase C — HTML Build (≈ 45 min)

1. Copy `pages/escape/index.html` as starting template
2. Adapt structure per Section 2 above:
   - Replace hero block with multi-tour selector
   - Add 3 tour deep sections
   - Add compare table
   - Modify booking form (add tour radio, conditional chips)
3. Apply all skill patterns:
   - Orange-red CTA gradient (`--accent-grad`)
   - `html.js` synchronous gate for scroll-reveal
   - YouTube facade for video
   - Chips + departure city + smart placeholder in form
   - Outlined nav "Book Now"
   - Trust-before-price section order
4. Update H1, title, meta keywords/description per Section 3
5. JSON-LD schema: 3 × `TouristTrip` + 1 × `TravelAgency` + `FAQPage` + `BreadcrumbList`

### Phase D — Build Pipeline Update (≈ 10 min)

1. Edit `build.js` PAGES_CONFIG:
   ```js
   'happytours': { path: '/happytours-internal', name: 'Vietnam Holiday Packages — Multi-Tour' }
   ```
   (Internal path; happytours subdomain serves THIS via custom domain mapping)

2. Run `node build.js` → regenerates `worker.js`
3. Verify no duplicate IDs / broken refs

### Phase E — Deploy (≈ 5 min)

1. Commit + push to main → GitHub Actions auto-deploys
2. Verify code in `worker.js` is live on edge

### Phase F — Custom Domain Setup (≈ 15 min — REQUIRES USER ACTION)

Cannot be fully automated from sandbox. Steps:

1. In Cloudflare Dashboard → Workers & Pages → `escape-myvivatour` worker → Settings → Triggers
2. Add Custom Domain → `happytours.myvivatour.com` (bare hostname, NO wildcards per skill rule)
3. CF auto-creates the DNS proxy CNAME if `myvivatour.com` is on CF DNS
4. Wait ~30 seconds for SSL cert provisioning
5. Test `https://happytours.myvivatour.com/` returns the new LP

Em sẽ write step-by-step instructions cho anh paste vào CF dashboard.

### Phase G — Verification (≈ 15 min)

- Lighthouse mobile + desktop: targets LCP <2.5s, CLS <0.1, INP <200ms
- Mobile emulation via Playwright (iPhone 13 + Samsung S22) — check hero CTA above fold
- TripAdvisor reviews load correctly
- Form submission dry-run → check Web3Forms email arrives with `tour_interest` field
- Google Ads conversion fires (GTM Preview mode)

**Total estimated time**: 2h 25min hands-on + Phase F user action

---

## 7. Risks + Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Real tour data missing for one of 3 tours | Medium | Medium | Fall back to baseline pricing from CLAUDE.md + generic itineraries based on destination patterns |
| Drive image filenames don't match expected pattern | Low | Low | Em sẽ browse before optimizing, adapt |
| Page becomes too long (>20k px) due to 3 tours | High | Medium | Use accordion for day-by-day, compress hero per tour, sticky tab selector reduces perceived length |
| Compare table awkward on mobile | High | Medium | Stack table vertically with tour-name headers; or convert to swipeable cards |
| `happytours` subdomain DNS not pre-configured | Medium | Blocker | Phase F has explicit instructions; if blocked, deploy to `/happytours` path on escape worker as backup |
| Hero video same for all 3 tours feels generic | Medium | Low | Add per-section short photo carousel; upgrade to per-tour video in v2 |

---

## 8. Success Criteria

- [ ] Live at `https://happytours.myvivatour.com/` with valid SSL
- [ ] 3 tours each have hero image + 6 highlights + price card + dedicated CTA
- [ ] Compare table renders correctly on desktop + mobile
- [ ] Booking form sends sales email with `tour_interest` flag visible
- [ ] Lighthouse mobile: LCP <2.5s, CLS <0.1, accessibility ≥90
- [ ] No console errors
- [ ] All `--accent` orange CTAs render correctly
- [ ] Sticky mobile bottom bar shows on scroll
- [ ] TripAdvisor section displays featured Aussie reviewer
- [ ] Tracking: GTM Preview shows `page_view`, `tour_card_click`, `form_submit` with all params

---

## 9. Files That Will Be Created / Modified

```
pages/happytours/
├── index.html                          (NEW — main HTML file, ~3500 lines)
└── images/                              (NEW — local optimised copies, fallback)

upload-ready/happytours/                 (NEW — pre-upload optimised set)

build.js                                 (MODIFY — add 'happytours' to PAGES_CONFIG)

worker.js                                (AUTO-GENERATED by build.js)

plans/260517-0825-happytours-multi-tour-lp/
├── plan.md                              (THIS FILE)
├── keyword-research.md                  (extracted Tier 1/2/3 with search volume estimates)
├── image-inventory.csv                  (Drive file → LP slot mapping, generated in Phase B)
└── cloudflare-custom-domain-setup.md    (Phase F user instructions)
```

---

## 10. Self-Review (per "review plan" request)

**Strong points of this plan:**
- Architecture choice B is conversion-optimised, not just SEO-optimised
- Reuses 90% of escape page proven patterns → low risk
- Image inventory verified BEFORE building (no surprise asset gaps)
- Keyword strategy targets both umbrella + per-tour intent
- Tracking captures tour interest = future audience segmentation gold
- Phases have realistic time estimates; longest single block is 45 min

**Weak points / things to watch:**

1. **Phase F requires user action** — em không có CF API token local. If anh setup token, em có thể automate via `wrangler` after the build.
2. **Compare table on mobile** is the trickiest layout. Plan calls for stacked cards but exact UX needs to be designed in code; might need 1-2 iteration rounds.
3. **Day-plan accordions for 3 tours** will be long. Considering only showing "highlight days" (e.g. days 1, 4, 7 for honeymoon) — full itinerary linkable on click rather than always-visible.
4. **No competitor scan for multi-tour pages specifically** — competitors (Intrepid, TripADeal) mostly do single-tour LPs. Multi-tour pattern is more like an e-commerce category page. Em đề xuất add a quick 15-min scan of Wendy Wu Tours + Inspiring Vacations category pages in Phase A (they do multi-tour layouts well).
5. **Sticky tour selector** — UX needs decision: stay sticky after passing tour 3? Or hide after compare table? Decision: hide once user reaches "Why MyVivaTour" — no longer relevant.

**Decisions baked in (won't ask unless anh override):**
- Subdomain stays exactly `happytours.myvivatour.com` (not `tours.`, `experiences.`, etc.)
- Compare table renders as horizontal scroll on mobile (alternative would be vertical stack — em can switch)
- Tour selector cards click → scroll, NOT tab-switch (scrolling preserves SEO + linear reading)
- One shared video (escape video id), not 3 per-tour videos
- Honeymoon goes first in tour order (highest emotional appeal → primes the rest)

---

## 11. Open Questions for User

1. **Pricing confirmation** — em dùng baseline từ CLAUDE.md ($1,899 / $1,699 / $3,499 AUD). Anh có giá chính thức mới hơn không? (Em sẽ scrape myvivatour.com nhưng nếu anh có sheet pricing thì chắc chắn hơn.)

2. **Tour itinerary source** — anh muốn em:
   - (a) Tự scrape từ existing tour pages trên myvivatour.com
   - (b) Anh paste itinerary text vào để em format
   - (c) Em viết generic itinerary dựa trên destination + duration (sẽ note "indicative" trên page)

3. **Phase F (custom domain)** — anh muốn:
   - (a) Em viết hướng dẫn step-by-step → anh click trong CF dashboard
   - (b) Anh setup CLOUDFLARE_API_TOKEN trong env để em deploy hoàn toàn
   - (c) Deploy tạm path `/happytours` trên escape worker để test, custom domain làm sau

4. **Compare table mobile layout** — preview anh muốn:
   - (a) Horizontal scroll (swipe ngang)
   - (b) Vertical stack (3 cards trên-dưới-trên-dưới)
   - (c) Tab switcher (chọn 1 trong 3 để hiển thị)

5. **Honeymoon goes first** trong order — OK chứ hay anh muốn Family/Luxury trước?
