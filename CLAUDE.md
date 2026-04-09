# MVT Landing Page — Claude Code Instructions

## Dự án
Hệ thống multi-landing-page cho công ty du lịch **MyVivaTour** (myvivatour.com), target thị trường Úc.
Repo: https://github.com/Minh090506/MVTLandingpage

## Kiến trúc

```
pages/*/index.html  →  build.js  →  worker.js  →  Cloudflare Workers
                                                    (escape.myvivatour.com)
```

- **KHÔNG sửa worker.js trực tiếp** — file này auto-generated bởi `build.js`
- Sửa HTML trong `pages/<tên-tour>/index.html` → chạy `node build.js`
- Deploy: `npx wrangler deploy --name escape-myvivatour` hoặc push to main (GitHub Actions auto-deploy)

## Cấu trúc thư mục

```
MVTLandingpage/
├── pages/
│   ├── escape/index.html      ← Landing page chính (10-Day Vietnam Tour, $2,099 AUD) ✅ Live
│   ├── honeymoon/index.html   ← Vietnam Honeymoon 7-Day ($1,899 AUD) — placeholder
│   ├── family-tour/index.html ← Vietnam Family Tour 8-Day ($1,699 AUD) — placeholder
│   └── luxury-cruise/index.html ← Luxury Cruise 12-Day ($3,499 AUD) — placeholder
├── build.js                   ← Bundler: đọc pages/*/index.html → generate worker.js
├── worker.js                  ← AUTO-GENERATED (không sửa!)
├── worker.js.backup           ← Bản cũ có Schema.org + GTM (tham khảo)
├── wrangler.toml              ← CF Workers config
├── .github/workflows/deploy.yml ← CI/CD auto-deploy
├── scripts/upload-to-supabase.js ← Upload images lên Supabase Storage
├── CLAUDE-CODE-PROMPTS.md     ← 6 prompts tối ưu (IDs đã điền sẵn)
├── SESSION-SUMMARY.md         ← Tóm tắt tiến độ dự án
└── SETUP-SECRETS.md           ← Hướng dẫn setup GitHub Secrets
```

## Tracking IDs (đã cài vào code ngày 5/4/2026)

| Tracking | ID | Ghi chú |
|---|---|---|
| GTM Container | `GTM-TPQWV864` | Google Tag Manager |
| GA4 Measurement | `G-LKDCCNJMP3` | Stream: 14312720580, property cho escape.myvivatour.com |
| Google Ads Conversion | `AW-17709107883` | Customer ID: 572-470-7852 |
| Google Ads Label | `Wq0ECKXBmfsbEKuVrvxB` | send_to: AW-17709107883/Wq0ECKXBmfsbEKuVrvxB |
| Facebook Pixel | `579298288600609` | Business ID: 623339086973908 |

## Thông tin dùng chung cho mọi landing page

- **Web3Forms API Key:** `cf0ca620-d064-4640-9454-afb27d588f67`
- **WhatsApp:** `+84974036614` (link: `https://wa.me/84974036614`)
- **Supabase Storage:** bucket `landing-images`, URL: `https://tnwelgvypmhhksqwnfmr.supabase.co/storage/v1/object/public/landing-images/`
- **Domain chính:** myvivatour.com
- **Landing pages domain:** escape.myvivatour.com

## Khi tạo landing page MỚI

### Bước 1: Tạo folder + file
```bash
mkdir -p pages/<tên-tour>/images
```
Tạo `pages/<tên-tour>/index.html` — copy từ `pages/escape/index.html` làm template.

### Bước 2: Cập nhật build.js
Thêm vào `PAGES_CONFIG` trong `build.js`:
```javascript
'<tên-tour>': '/<tên-tour>'
```

### Bước 3: Checklist nội dung bắt buộc cho mỗi landing page

**HEAD (SEO + Tracking) — PHẢI DÙNG KEYWORD DATABASE Ở CUỐI FILE:**
- [ ] `<title>` format: `[Duration] Vietnam [Type] from Australia $[Price] AUD | MyVivaTour [Year]`
- [ ] `<meta name="description">` 150-160 ký tự, có "holiday", giá, destinations, CTA
- [ ] `<meta name="keywords">` copy từ Meta Keywords Template, thay [PLACEHOLDERS]
- [ ] `<link rel="canonical">` trỏ tới URL chính thức
- [ ] Open Graph tags (og:title, og:description, og:image, og:url)
- [ ] Twitter Card tags
- [ ] Hreflang tags (en-AU primary)
- [ ] GTM script: `GTM-TPQWV864`
- [ ] GA4 gtag: `G-LKDCCNJMP3`
- [ ] Facebook Pixel: `579298288600609`

**BODY (Content + Conversion):**
- [ ] GTM noscript ngay sau `<body>`
- [ ] Hero section: headline + giá + CTA button
- [ ] Tour itinerary chi tiết (day-by-day)
- [ ] Pricing packages (Base + upgrades)
- [ ] Testimonials/Reviews (3+)
- [ ] FAQ section (5-8 câu hỏi)
- [ ] Booking form (Web3Forms, key: `cf0ca620-d064-4640-9454-afb27d588f67`)
- [ ] Floating WhatsApp button (góc phải dưới)
- [ ] Sticky mobile CTA bar
- [ ] Back-to-top button
- [ ] Google Ads conversion tracking trong form submit handler:
  ```javascript
  gtag('event', 'conversion', {
    'send_to': 'AW-17709107883/Wq0ECKXBmfsbEKuVrvxB'
  });
  fbq('track', 'Lead');
  ```

**SCHEMA.ORG (JSON-LD):**
- [ ] TravelAgency (Organization)
- [ ] TouristTrip with Offer + Itinerary
- [ ] FAQPage
- [ ] BreadcrumbList
- [ ] AggregateRating (nếu có reviews)

### Bước 4: Build + Deploy
```bash
node build.js
git add -A
git commit -m "feat: add <tên-tour> landing page"
git push origin main
# GitHub Actions sẽ tự deploy
```

### Bước 5: Verify
- Kiểm tra routes: /, /<tên-tour>
- Kiểm tra sitemap.xml có URL mới
- Kiểm tra 404 page có link tới tour mới
- Test form submission
- Verify tracking trong GTM Preview mode

## Tiến độ (cập nhật ngày 5/4/2026)

### ✅ Đã hoàn thành
- Cấu trúc multi-page + build pipeline + CI/CD
- Thu thập tất cả tracking IDs
- Deploy escape page lên CF Workers
- GitHub Secrets: CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID

### ⏳ Đang thực hiện (chạy Claude Code prompts trong CLAUDE-CODE-PROMPTS.md)
- Prompt 1: Cài tracking codes vào escape page
- Prompt 2: Sync structured data từ worker.js.backup
- Prompt 5: AI SEO nâng cao
- Prompt 3: Floating elements (WhatsApp, CTA, popup)
- Prompt 4: Tối ưu form + social proof
- Prompt 6: Build + deploy

### ✅ Đã hoàn thành (9/4/2026)
- SEO keyword research: phân tích 10 đối thủ, tạo keyword database
- Tối ưu escape page SEO (title, meta, keywords, OG tags)
- Tạo SEO-KEYWORD-REPORT.md

### 📋 Việc tiếp theo
- Push code lên GitHub (xoá .git lock files trước: `rm -f .git/*.lock .git/objects/maintenance.lock`)
- Setup GTM tags (GA4, Ads Conversion, FB Pixel)
- Cập nhật Google Ads keywords theo Campaign Setup section bên dưới
- Xây dựng 3 landing pages còn lại (honeymoon, family-tour, luxury-cruise)
- Set GitHub secrets: SUPABASE_URL + SUPABASE_SERVICE_KEY

## SEO Keywords Database (Competitor Research — 9/4/2026)

Phân tích 10 đối thủ: Intrepid Travel, TripADeal, Wendy Wu Tours, G Adventures, Inspiring Vacations, Unique Tours, Vietnam Escape Tours, Flight Centre, APT Touring, Trafalgar. Báo cáo đầy đủ: `SEO-KEYWORD-REPORT.md`.

### QUY TẮC BẮT BUỘC khi viết title/meta/keywords:
- Luôn dùng **"holiday"** (tiếng Anh Úc), KHÔNG dùng "vacation" (tiếng Mỹ)
- Luôn có **năm** (2026, 2027) trong title → freshness signal
- Luôn có **"from Australia"** → geo-qualification
- Luôn có **giá AUD** trong title tag
- Format title: `[Duration] Vietnam [Tour Type] from Australia $[Price] AUD | MyVivaTour [Year]`
- Meta description: 150-160 ký tự, phải có giá, destinations, "holiday", và CTA

### Tier 1: Primary Keywords (BẮT BUỘC trong mọi landing page)
Dùng trong title, H1, meta description, và đoạn đầu tiên:
- `Vietnam tour from Australia`
- `Vietnam holiday package`
- `Vietnam tours [year]`
- `[X] day Vietnam tour`
- `all inclusive Vietnam tour`
- `Vietnam tour package Australia`

### Tier 2: Destination Keywords (dùng trong H2 và itinerary)
- `Ha Long Bay tour` / `Halong Bay cruise`
- `Ho Chi Minh City tour` / `Saigon tour`
- `Hanoi tour`
- `Hoi An tour`
- `Mekong Delta tour`
- `Cu Chi Tunnels tour`
- `Hue Imperial City tour`
- `Sapa trekking`
- `Ninh Binh tour`
- `Phu Quoc island`

### Tier 3: Long-tail Keywords (meta keywords, FAQ, body copy)
- `vietnam tour packages from australia [year]`
- `[X] day vietnam tour with flights`
- `all inclusive vietnam holiday from australia`
- `guided vietnam tour with meals included`
- `small group vietnam tour from australia`
- `vietnam and cambodia tour`
- `luxury vietnam tour`
- `vietnam family tour`
- `vietnam honeymoon package`
- `vietnam food tour` / `vietnam adventure tour` / `vietnam cruise tour`
- `vietnam solo travel tour`
- `best vietnam tour operator`
- `cheap vietnam tour from australia`
- `vietnam tour with flights included`

### Tier 4: FAQ Keywords (cho FAQ section → rich snippets)
- `how much does a vietnam tour cost from australia`
- `best time to visit vietnam`
- `do i need a visa to visit vietnam from australia`
- `is vietnam safe for australian tourists`
- `vietnam currency exchange AUD`

### Meta Keywords Template (copy & thay thế [PLACEHOLDERS])
```
Vietnam tour from Australia, Vietnam holiday package, Vietnam tours [YEAR], [DURATION] Vietnam tour, all inclusive Vietnam tour, Vietnam tour package Australia, Ha Long Bay tour, Hanoi tour, Ho Chi Minh City tour, Hoi An tour, Mekong Delta tour, Vietnam guided tour, small group Vietnam tour, Vietnam travel deal, cheap Vietnam tour Australia, budget Vietnam holiday, luxury Vietnam tour, Vietnam flights included, Vietnam hotel package, Vietnamese food tour, Vietnam culture tour, Southeast Asia tour from Australia, Vietnam adventure tour, Vietnam sightseeing, book Vietnam tour online, best Vietnam tour operator, affordable Vietnam holiday, Vietnam family tour, Vietnam honeymoon package, MyVivaTour, Vietnam holiday [YEAR], Vietnam travel package, Vietnam group tour, Ha Long Bay cruise, Cu Chi Tunnels tour, Vietnam all inclusive holiday, Australian Vietnam tour, Saigon tour, Vietnam beach holiday, Hue Imperial City tour, Vietnam and Cambodia tour, Vietnam tour with meals included, guided Vietnam holiday, Vietnam tour deals [YEAR], best time visit Vietnam, Vietnam tour operator Australia, [TOUR-SPECIFIC-KEYWORD]
```

### Bảng đối thủ (tham khảo giá & positioning)

| Đối thủ | Giá (AUD) | USP chính |
|---------|-----------|-----------|
| Intrepid Travel | $1,336–$4,223 | Local leaders, food experiences, 15K+ Trustpilot |
| TripADeal | $1,999–$4,199 | Qantas Points, flights included, flexible payments |
| Wendy Wu Tours | $860–$21,980 | Fly FREE, AU #1 specialist, fully inclusive |
| G Adventures | $1,356–$10,149 | Sustainable travel, 4.8/5 Trustpilot |
| Inspiring Vacations | $1,995–$4,394 | Premium small groups, women-only option |
| Unique Tours | USD $780–$1,990 | Money Back Guarantee, 2,200+ TripAdvisor |
| Vietnam Escape Tours | USD $251–$998 | Budget, tailored for Australians |

**MyVivaTour positioning:** Mid-premium, all-inclusive value. Compete trên "all-inclusive" + "local expertise" + "small group".

## Google Ads Campaign Setup (cho mỗi tour)

### Account: Customer ID `572-470-7852`

**Campaign 1: Brand + Core (Exact/Phrase Match, bid cao nhất)**
- `"vietnam tour from australia"`, `"vietnam holiday package"`, `"vietnam tours [year]"`, `"[duration] vietnam tour"`, `"all inclusive vietnam tour"`

**Campaign 2: Destination (Phrase Match)**
- `"ha long bay tour package"`, `"hanoi ho chi minh tour"`, `"hoi an tour package"`, `"mekong delta tour"`, `"vietnam tour hanoi to ho chi minh"`

**Campaign 3: Long-tail High-Intent (Exact Match)**
- `[vietnam tour packages from australia [year]]`, `[[duration] vietnam tour with flights]`, `[all inclusive vietnam holiday from australia]`, `[guided vietnam tour with meals included]`, `[small group vietnam tour from australia]`

**Campaign 4: Competitor (Phrase Match, bid thấp nhất)**
- `"intrepid vietnam tour alternative"`, `"tripadeal vietnam"`, `"wendy wu tours vietnam"`, `"cheap vietnam tour with flights"`

**Negative Keywords (thêm vào TẤT CẢ campaigns):**
```
free, DIY, backpacker, visa application, embassy, volunteer, teach english, work in vietnam, immigration, one way, booking.com, hostel, airbnb
```

**Ad Copy Template:**
```
Headline 1: "[Duration] Vietnam Tour — $[Price] AUD"
Headline 2: "All-Inclusive From Australia"
Headline 3: "Hotels, Meals & Guides Included"
Desc 1: "Explore Hanoi, Ha Long Bay, Hoi An, Ho Chi Minh City & Mekong Delta. Book your [year] Vietnam holiday today!"
Desc 2: "Trusted Australian tour operator. Small group tours with expert local guides. WhatsApp support available."
Display Path: /vietnam-tour/[duration]
```

## Quy tắc khi code

1. **Luôn dùng tiếng Anh** cho nội dung landing page (target Australian market)
2. **Giá AUD** — luôn hiển thị $ AUD
3. **Mobile-first** — test responsive trước khi deploy
4. **Performance** — images phải optimize (WebP, lazy loading), CSS/JS inline trong HTML
5. **Accessibility** — alt text cho images, proper heading hierarchy, ARIA labels
6. **SEO** — mỗi page phải có unique title, description, canonical URL — **DÙNG KEYWORD DATABASE Ở TRÊN**
7. **Conversion tracking** — mọi CTA + form submit phải fire dataLayer events
8. **Google Ads** — khi tạo landing page mới, luôn setup 4 campaigns theo template ở trên
