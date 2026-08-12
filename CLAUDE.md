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
│   ├── escape/index.html                       ← Homepage (10-Day Vietnam Tour, $2,099 AUD) ✅ Live
│   ├── happytours/index.html                   ← Vietnam Holiday Packages multi-tour ✅ Live
│   ├── dental-implants-vietnam/index.html      ← Dental implants (AUD 1,220 from) ✅ Live at implant.vietnamdentaltravel.com
│   ├── dental-implants-vietnam/images/         ← Source-of-truth dental images (synced to Supabase CDN)
│   ├── honeymoon/index.html                    ← 301 → happytours#tour-honeymoon
│   ├── family-tour/index.html                  ← 301 → happytours#tour-family
│   └── luxury-cruise/index.html                ← 301 → happytours#tour-luxury
├── build.js                       ← Bundler: pages/*/index.html → worker.js (PAGES_CONFIG + HOST_DEFAULTS)
├── worker.js                      ← AUTO-GENERATED (không sửa!) — unified for ALL subdomains
├── wrangler.toml                  ← CF Workers config — main worker "escape-myvivatour"
├── wrangler-dental.toml           ← Same worker.js deployed as "vietnamdentaltravel" bound to implant.vietnamdentaltravel.com
├── wrangler-dashboard.toml        ← Dashboard worker config
├── .github/workflows/deploy.yml   ← Main CI/CD: build worker.js → deploy all 3 workers; [upload-images] commit → trigger image upload
├── .github/workflows/deploy-dental.yml ← Dental-only fast path (triggers on pages/dental-implants-vietnam/**)
├── scripts/upload-to-supabase.js  ← Image uploader (auto-scans pages/*/images/ → landing-images/<page>/)
├── CLAUDE-CODE-PROMPTS.md         ← 6 prompts tối ưu (IDs đã điền sẵn)
├── SESSION-SUMMARY.md             ← Tóm tắt tiến độ dự án
└── SETUP-SECRETS.md               ← Hướng dẫn setup GitHub Secrets
```

**Page registration:** Mỗi page mới phải có entry trong `build.js → PAGES_CONFIG`. Subdomain custom phải thêm vào `HOST_DEFAULTS` (worker route host → default path).

## Tracking IDs (đã cài vào code ngày 5/4/2026)

| Tracking | ID | Ghi chú |
|---|---|---|
| GTM Container | `GTM-KRFGX69D` | Google Tag Manager |
| GA4 Measurement | `G-2R0EJ2LBJ5` | Property GA4 hợp nhất cho TẤT CẢ landing page (escape, happytours, dental). ID cũ `G-LKDCCNJMP3` đã ngừng dùng |
| Google Ads Conversion | `AW-17709107883` | Customer ID: 572-470-7852 |
| Google Ads Label | `Wq0ECKXBmfsbEKuVrvxB` | send_to: AW-17709107883/Wq0ECKXBmfsbEKuVrvxB |
| Facebook Pixel | `579298288600609` | Business ID: 623339086973908 |

## Tài liệu nền (đọc trước khi làm LP mới)

| Doc | Dùng khi |
|---|---|
| `docs/mvt-brand-guidelines.md` | Màu, logo, typography, giọng nói, quy tắc tiếng Anh Úc |
| `docs/mvt-tracking-spec.md` | Event taxonomy, conversion, attribution, schema `marketing_leads`, secrets Worker |
| `docs/mvt-content-playbook.md` | Công thức copy LP/blog, persona, brief, checklist xuất bản |
| `docs/mvt-landingpage-cicd-guide.md` | CI chạy gì, đọc lỗi validator, PR preview, bypass khẩn cấp |

**Lead pipeline:** form → `worker-modules/lead-attribution-client.js` (gắn UTM/gclid) → `POST /api/lead` → Supabase `marketing_leads` + Web3Forms. Handler ở `worker-modules/lead-ingest-handler.js`, `build.js` inline vào `worker.js`. Sửa `worker-modules/*` → phải `node build.js` lại.

**Trước khi commit:** `node scripts/validate-landing-pages.js` (CI cũng chạy, sẽ chặn merge nếu fail).

## Thông tin dùng chung cho mọi landing page

- **Web3Forms API Key:** `cf0ca620-d064-4640-9454-afb27d588f67`
  - Destination email được set TRONG Web3Forms dashboard (không phải HTML) — verify bằng submit test form
  - Payload best practice: include `from_name`, `replyto: <user-email>`, descriptive `subject` (kèm domain LP)
  - Submit test chỉ chạy từ browser/puppeteer (server-side curl bị Web3Forms chặn ở free plan)
- **WhatsApp:** `+84974036614` (link: `https://wa.me/84974036614`)
- **Supabase Storage:** project ref `tnwelgvypmhhksqwnfmr`, bucket `landing-images`, URL: `https://tnwelgvypmhhksqwnfmr.supabase.co/storage/v1/object/public/landing-images/`
  - Image path convention: `landing-images/<page-folder-name>/<file>.webp` (auto-detect bởi upload script)
  - **KHÔNG** dùng relative `images/foo.webp` trong HTML — Worker chỉ serve HTML, ảnh phải absolute URL trên Supabase
- **Domain chính:** myvivatour.com (CF zone)
- **Landing pages subdomains:**
  - `escape.myvivatour.com` → page `escape` (homepage on root)
  - `happytours.myvivatour.com` → page `happytours` (via HOST_DEFAULTS)
  - `implant.vietnamdentaltravel.com` → page `dental-implants-vietnam` (separate CF zone, custom_domain route)

## Khi tạo landing page MỚI

### Bước 1: Tạo folder + file
```bash
mkdir -p pages/<tên-tour>/images
```
Tạo `pages/<tên-tour>/index.html` — copy từ `pages/escape/index.html` làm template.

### Bước 2: Cập nhật build.js
Thêm vào `PAGES_CONFIG` trong `build.js`:
```javascript
'<tên-tour>': { path: '/<tên-tour>', name: '<Display Name>' },
```

Nếu LP có subdomain riêng (vd `<sub>.myvivatour.com` hoặc khác zone), thêm vào `HOST_DEFAULTS`:
```javascript
const HOST_DEFAULTS = {
  '<sub>.myvivatour.com': '/<tên-tour>',
};
```

Nếu zone khác (vd `vietnamdentaltravel.com`) → tạo `wrangler-<brand>.toml` với `main = "worker.js"`, `name = "<worker-name>"`, và `[[routes]] pattern = "<sub>.<domain>" custom_domain = true`. Thêm step deploy worker đó vào `.github/workflows/deploy.yml`.

**BẮT BUỘC với subdomain mới:** thêm host vào `LEAD_ALLOWED_HOSTS` trong `worker-modules/lead-ingest-handler.js`. Quên bước này → `/api/lead` trả 403, lead không vào DB (chỉ còn đường email, im lặng, rất khó phát hiện).

### Bước 3: Checklist nội dung bắt buộc cho mỗi landing page

**HEAD (SEO + Tracking) — PHẢI DÙNG KEYWORD DATABASE Ở CUỐI FILE:**
- [ ] `<title>` format: `[Duration] Vietnam [Type] from Australia $[Price] AUD | MyVivaTour [Year]`
- [ ] `<meta name="description">` 150-160 ký tự, có "holiday", giá, destinations, CTA
- [ ] `<meta name="keywords">` copy từ Meta Keywords Template, thay [PLACEHOLDERS]
- [ ] `<link rel="canonical">` trỏ tới URL chính thức
- [ ] Open Graph tags (og:title, og:description, og:image, og:url)
- [ ] Twitter Card tags
- [ ] Hreflang tags (en-AU primary)
- [ ] GTM script: `GTM-KRFGX69D`
- [ ] GA4 gtag: `G-2R0EJ2LBJ5`
- [ ] Facebook Pixel: `579298288600609`

**BODY (Content + Conversion):**
- [ ] GTM noscript ngay sau `<body>`
- [ ] Hero section: headline + giá + CTA button
- [ ] Tour itinerary chi tiết (day-by-day)
- [ ] Pricing packages (Base + upgrades) — nếu table có 4+ cols, thêm mobile-compact CSS + ẩn cột phụ
- [ ] Testimonials/Reviews (3+) — ưu tiên verbatim quotes từ Google Reviews (cao trust nhất)
- [ ] FAQ section (5-8 câu hỏi)
- [ ] Booking form (Web3Forms, key: `cf0ca620-d064-4640-9454-afb27d588f67`):
  - 2-step flow OK (4-5 fields/step max)
  - Country dropdown HOẶC State dropdown (AU-only target → State NSW/VIC/QLD/WA/SA/TAS/ACT/NT)
  - Free-form textarea "Your message *" với placeholder gợi ý cụ thể
  - Payload phải có `from_name`, `replyto: data.email`, subject kèm domain LP
- [ ] Floating WhatsApp button (góc phải dưới) — mobile `bottom: 80px`
- [ ] Sticky mobile CTA bar — `bottom: 0`
- [ ] Back-to-top button — mobile `bottom: 160px; width:44px; height:44px` (gap ≥ 20px so với WhatsApp)
- [ ] Verify 3 floating icons KHÔNG overlap (check bằng puppeteer scroll-mid screenshot)
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

### Bước 4: Upload ảnh lên Supabase (CDN)
HTML phải dùng absolute Supabase URLs, KHÔNG dùng `images/<file>` relative.

```bash
# Rewrite paths trong HTML (one-time):
SUPA='https://tnwelgvypmhhksqwnfmr.supabase.co/storage/v1/object/public/landing-images/<tên-tour>'
perl -i -pe "s|src=\"images/([^\"]+)\"|src=\"${SUPA}/\$1\"|g" pages/<tên-tour>/index.html
```

Commit với `[upload-images]` flag để GH Actions auto-upload từ `pages/<tên-tour>/images/`:
```bash
git commit -m "feat: add <tên-tour> landing page [upload-images]"
```

Verify ảnh lên thành công (sau khi workflow chạy):
```bash
for img in $(ls pages/<tên-tour>/images/); do
  http=$(curl -sI "https://tnwelgvypmhhksqwnfmr.supabase.co/storage/v1/object/public/landing-images/<tên-tour>/$img" -o /dev/null -w "%{http_code}")
  [ "$http" = "200" ] && echo "✓ $img" || echo "✗ $img → $http"
done
```

### Bước 5: Build + Deploy
```bash
node build.js
git push origin main
# GitHub Actions sẽ tự deploy (3 workers: main, dashboard, dental)
```

### Bước 6: Verify
- Kiểm tra routes: /, /<tên-tour>
- Kiểm tra sitemap.xml có URL mới
- Kiểm tra 404 page có link tới tour mới
- **Test form submission qua puppeteer** (`node test.js` với browser origin) → confirm Web3Forms trả 200 → check inbox `info@myvivatour.com`
- **Run audit script** `node scripts/puppeteer-landing-page-screenshot-and-audit.js <URL> /tmp/audit/ r1` → check `r1-summary.json`:
  - `layout.overflowing` rỗng trên mobile (390px viewport)
  - `seo.imgsMissingAlt` = 0
  - Tracking IDs đầy đủ
  - Console errors = [] (hoặc trace nguyên nhân)
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

## Pitfalls & Patterns (lessons learned)

Các bài học rút ra từ những lần build LP trước. Đọc kỹ trước khi bắt đầu LP mới hoặc fix bug để không lặp lại.

### Image hosting — KHÔNG dùng relative paths trong HTML (HOẶC CSS)
- CF Worker chỉ serve HTML route, KHÔNG serve image binaries.
- HTML `<img src="...">` phải absolute Supabase URL: `https://tnwelgvypmhhksqwnfmr.supabase.co/storage/v1/object/public/landing-images/<page>/<file>.webp`
- **CSS `background: url(...)` cũng phải absolute** — đây là gotcha thường bỏ sót khi rewrite `<img src>` qua sed/perl. Hero background `url('images/foo.webp')` sẽ fail silent (404 trong console, BG biến mất). Grep `url\(['"]?images/` để verify.
- Source-of-truth `.webp` giữ trong `pages/<page>/images/` để re-upload qua script.
- Upload qua: commit message có `[upload-images]` flag → trigger upload-images job trong `deploy.yml`.
- Hoặc manual: `gh workflow run deploy.yml --ref main` (event = workflow_dispatch cũng trigger upload).

### Nguồn ảnh/video — LẤY TỪ KHO CÔNG TY, không chế từ nguồn khác
Tất cả assets thật của MyVivaTour nằm trong Google Drive shared drive **Marketing** (mount: `~/Library/CloudStorage/GoogleDrive-<email>/Shared drives/Marketing/MY VIVA TOUR/`). **Cần Full Disk Access cho Terminal** (macOS TCC) — nếu `Operation not permitted` thì cấp FDA rồi restart Terminal.

- **Ảnh tĩnh cho LP (tour cards, banners, gallery) → BẮT BUỘC lấy từ kho ẢNH:** `MVT_Kho ảnh/Kho ảnh (theo địa điểm)/<Location>/WEBP/Banner Tours (1920x743)/<Loc>_N.webp`. Đây là ảnh đã curate, **1920×743 webp, có watermark logo MVT** (đồng bộ brand) — khớp luôn tỉ lệ cover của tour cards. Cũng có `Kho ảnh (theo Tours)/` (theo tour) và mỗi location còn `JPG/` + `WIC RS/`.
- **KHÔNG trích frame từ video** để làm ảnh tĩnh. Frame video chỉ chấp nhận cho **hero background video loop** (`.mp4`), KHÔNG cho `<img>` tĩnh. (Bài học: từng dùng frame Hạ Long/Mekong cho tour cards → phải thay lại bằng ảnh kho.)
- **Video cho hero loop → lấy từ kho VIDEO:** `MVT_Kho video/Kho video (theo địa điểm)/<Location>/`. Phần lớn là video dọc (điện thoại); chỉ vài clip landscape 16:9 (Hạ Long `DuThuyen .mp4`, `7158353349520.mp4`). Xem pipeline trong memory `hero-video-pipeline`.
- Quy trình: chọn từ kho → copy/encode webp vào `pages/<page>/images/` → commit `[upload-images]`. Ảnh "Banner Tours (1920x743)" đã là webp tối ưu nên copy thẳng được.
- **Lưu ý bucket Supabase:** `landing-images` có `allowed_mime_types` whitelist — đã thêm `video/mp4,video/webm` (ngoài image/jpeg|png|webp). Nếu thêm định dạng mới phải update whitelist, nếu không upload báo `✗ mime type ... not supported` nhưng CI vẫn xanh → file 404 trên CDN. Update bằng SQL: `update storage.buckets set allowed_mime_types = array[...] where id='landing-images'` (file_size_limit hiện 10MB).

### Hero background video (img-first, video-on-play)
Pattern dùng cho escape + happytours (chi tiết: memory `hero-video-pipeline`):
- Trong `.hero-parallax-layer`: `<img class="hero-bg-img">` (poster, fetchpriority=high — paint trước, giữ FCP) + `<video class="hero-bg-video" autoplay muted loop playsinline>` (opacity 0).
- `onplaying="this.parentElement.classList.add('hero-video-on')"` → CSS `.hero-video-on .hero-bg-img { opacity:0 }` (ẩn poster) + `.hero-video-on .hero-bg-video { opacity:0.6 }` (video thành nền chính). **Đừng để video opacity thấp chồng lên poster** — sẽ thấy ảnh, không thấy video (bug đã gặp ở mức 0.45).
- `.hero::after` scrim tối + headline `text-shadow` 2 lớp mềm (`0 1px 3px + 0 6px 20px rgba(0,0,0)`) giữ chữ trắng đọc được trên video sáng.
- `muted+playsinline` BẮT BUỘC cho mobile autoplay. `prefers-reduced-motion` → ẩn video (không fire `onplaying` → poster giữ nguyên, an toàn).
- Encode: `scripts/build-hero-loop.sh single|montage`. ffmpeg 1280×720 muted H.264 CRF 30 (~1-2MB/loop). `montage` cắt từ `0:00` mỗi clip → muốn đoạn giữa phải pre-extract `ffmpeg -ss <t> -t <d>` vào `/tmp` trước rồi montage temp. Footage Drive đa số dọc; landscape 16:9 hiếm.

### Subdomain routing — 3 cách
1. Cùng zone (myvivatour.com) → thêm vào `HOST_DEFAULTS` trong build.js. CF route đã có cho `*.myvivatour.com`.
2. Zone khác (vd vietnamdentaltravel.com) → cần `wrangler-<brand>.toml` riêng với `name = "<worker>"` + `[[routes]] custom_domain = true`. Worker này dùng CHUNG `worker.js` (set `main = "worker.js"`).
3. Workers.dev URL → fallback khi chưa có DNS.

Mỗi subdomain thêm mới phải: (a) `HOST_DEFAULTS['<sub>']` trong build.js, (b) DNS CNAME orange-cloud trên CF, (c) hoặc dedicated wrangler toml + workflow.

### Web3Forms form configuration
- Destination email được set TRONG Web3Forms dashboard, KHÔNG trong HTML — submit test entry rồi check inbox để verify.
- Payload phải có: `access_key`, `from_name`, `replyto: <user-email>`, `subject` kèm domain LP.
- Server-side curl (free plan) bị chặn — test phải qua browser/puppeteer với origin domain hợp lệ.
- Subdomain mới phải được whitelist trên Web3Forms dashboard nếu form fail với "origin not allowed".

### Mobile-specific UX pitfalls
- **Pricing tables với 4+ columns** → mobile bị overflow ngoài viewport. Phải:
  - Hide cột phụ trên mobile (e.g. `.col-usa, .col-uk { display: none }`)
  - Compact padding cells: `th, td { padding: 12px 8px; font-size: 0.85rem }`
  - Add scroll affordance: `.cost-table::after { content: '← scroll →' ... }`
- **Floating icons stacking** — WhatsApp + back-to-top + mobile-cta đều `position: fixed; bottom`. Phải tính bottom + height từng cái sao cho non-overlap:
  - WhatsApp mobile: `bottom: 80px` (push lên trên mobile-cta bar)
  - Back-to-top mobile: `bottom: 160px` + `width: 44px; height: 44px` (gap ≥ 20px với WhatsApp)
  - Mobile-cta: `bottom: 0; height: ~60px`
- **Page height** > 30,000px trên mobile = nguy cơ scroll fatigue. Cân nhắc accordion / split detail pages cho LP rất dài.

### Form best practices
- **Target geo cụ thể** (e.g. AU only) → dùng State dropdown (NSW/VIC/QLD/WA/SA/TAS/ACT/NT) thay vì Country dropdown, để có dữ liệu region cho follow-up.
- **Free-form input bắt buộc** — luôn có 1 textarea "Your message" với placeholder gợi ý cụ thể (situation, anxieties, travel prefs) thay vì label generic.
- **2-step form** OK với 4-5 fields per step. Hơn nữa → 3-step hoặc accordion.

### CI/CD & secrets pitfalls
- **`gh secret list` chỉ show name + timestamp**, KHÔNG show value. Để verify JWT secret đúng (e.g. SUPABASE_SERVICE_KEY) → decode payload qua jwt.io hoặc base64 decode + check `ref` match project URL.
- **Trailing newline khi paste qua `nano`** sẽ phá JWT signature. Dùng `read -s SB_KEY && printf "%s" "$SB_KEY" | gh secret set ...` thay vì file-based.
- **`@supabase/supabase-js` cần Node ≥ 22** (native WebSocket). `actions/setup-node@v4` với `node-version: '22'` trong workflow.
- **deploy.yml `paths:` trigger** — workflow chỉ chạy khi files trong paths thay đổi. Nếu chỉ sửa `scripts/*` hoặc `.github/*`, push KHÔNG trigger → dùng `gh workflow run deploy.yml --ref main` để manual dispatch.
- **`[upload-images]` flag trong commit message** sẽ trigger image upload job (cùng với workflow_dispatch).

### Git hygiene — KHÔNG commit audit artifacts
- **`git add -A` mù sẽ nuốt screenshot audit** — full-page mobile PNG có thể 20MB+/file (trang ~23.000px). Từng suýt commit 460MB. `.gitignore` đã chặn:
  - `plans/reports/**/screenshots/` (screenshot audit, regenerable)
  - `release-manifest.json` (artifact ClaudeKit, không phải source)
  - `pages/escape/index-v2.html` (draft, không đăng ký trong build.js)
- GitHub hard-reject file >100MB. Trước khi commit/push hàng loạt: `find . -size +5M` để soi file nặng; muốn lưu screenshot lâu dài → Git LFS hoặc Drive, đừng commit thẳng.
- Supabase upload là upsert (ghi đè cùng path) → sau khi thay ảnh, verify byte-size served khớp file mới (không stale CDN): `curl -sI <url> | grep -i content-length`.

### Script gotchas
- **JSDoc block comment `/** ... */` + glob `pages/*/images/`** → `*/` đóng comment sớm → SyntaxError. Dùng `//` line comments cho headers có chứa glob/path.
- **CommonJS `require` ở root** khi script chạy từ `/tmp` sẽ không tìm thấy `node_modules` của repo → đặt script trong project root. (Hook `scout-block` chặn mọi lệnh bash chứa chuỗi `node_modules` → đừng grep/ls path đó.)
- **ffmpeg homebrew thiếu `libwebp`** → encode webp fail `Unknown encoder 'libwebp'`. Trích frame ra `.png` bằng ffmpeg rồi convert sang webp bằng `cwebp -q 82 in.png -o out.webp` (hoặc `magick`).
- **Convert/crop ảnh kho → webp giữ tỉ lệ 1920×743** (khớp cover banner). Cover-crop landscape cho frame dọc: `scale=1280:800:force_original_aspect_ratio=increase,crop=...`.

### Audit workflow (sau mỗi major change)
Chạy:
```bash
mkdir -p /tmp/lp-audit-<round>
node scripts/puppeteer-landing-page-screenshot-and-audit.js <URL> /tmp/lp-audit-<round>/ <tag>
```
Output: mobile+desktop fold + fullpage screenshots, `<tag>-summary.json` với SEO/perf/tracking/layout metrics.

Check trong summary:
- `layout.hasHorizontalScroll` = false ← **gate thật** cho mobile, không phải `overflowing`
- `layout.overflowing` — bỏ qua nếu phần tử nằm trong khung `overflow-x:auto` (bảng giá/compare scroll ngang có chủ đích vẫn bị liệt kê nhưng KHÔNG vỡ trang). Chỉ lo khi `hasHorizontalScroll=true`.
- `seo.imgsMissingAlt` — `1` thường là **false positive**: ảnh nền hero `alt=""` (decorative + `aria-hidden`) là chuẩn accessibility, không cần alt. Verify bằng grep `<img` thiếu `alt=` (khác `alt=""`).
- `tracking.*` đầy đủ 5 IDs
- `consoleErrors` = [] (hoặc trace nguyên nhân)
- `perf.fcp` < 2500ms mobile

**Reveal-animation artifact khi screenshot:** phần tử `.section-reveal` start `opacity:0`, fade-in qua IntersectionObserver. Auto-scroll nhanh + chụp ngay → vùng hiện mờ/trống (chưa fire) → tưởng lỗi layout. Verify bằng scroll chậm từng bước (`scrollTo` mỗi ~200px, chờ ~60ms) cho IO fire, rồi mới chụp. Không phải bug — user thật scroll chậm vẫn thấy.

### Verify image URLs sau upload
```bash
for img in $(ls pages/<page>/images/); do
  curl -sI "https://tnwelgvypmhhksqwnfmr.supabase.co/storage/v1/object/public/landing-images/<page>/$img" -o /dev/null -w "%{http_code}" | grep -q 200 || echo "FAIL: $img"
done
```
