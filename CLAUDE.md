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

**HEAD (SEO + Tracking):**
- [ ] `<title>` chứa tour name + giá + "MyVivaTour"
- [ ] `<meta name="description">` dài 150-160 ký tự, có giá + destinations
- [ ] `<meta name="keywords">` 20+ keywords liên quan
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

### 📋 Việc tiếp theo
- Setup GTM tags (GA4, Ads Conversion, FB Pixel)
- Tạo Google Ads Search campaign
- Xây dựng 3 landing pages còn lại (honeymoon, family-tour, luxury-cruise)
- Set GitHub secrets: SUPABASE_URL + SUPABASE_SERVICE_KEY

## Quy tắc khi code

1. **Luôn dùng tiếng Anh** cho nội dung landing page (target Australian market)
2. **Giá AUD** — luôn hiển thị $ AUD
3. **Mobile-first** — test responsive trước khi deploy
4. **Performance** — images phải optimize (WebP, lazy loading), CSS/JS inline trong HTML
5. **Accessibility** — alt text cho images, proper heading hierarchy, ARIA labels
6. **SEO** — mỗi page phải có unique title, description, canonical URL
7. **Conversion tracking** — mọi CTA + form submit phải fire dataLayer events
