# Claude Code Prompts — MVT Landing Page Optimization

## Thông tin cần chuẩn bị TRƯỚC khi chạy

### ✅ Đã có đầy đủ:
1. **Google Tag Manager Container ID:** `GTM-TPQWV864`
2. **Google Analytics 4 Measurement ID:** `G-LKDCCNJMP3` (Stream ID: 14312720580, Property: escape.myvivatour.com)
3. **Google Ads Conversion ID:** `AW-17709107883`
4. **Google Ads Conversion Label:** `Wq0ECKXBmfsbEKuVrvxB`
5. **Google Ads Customer ID:** `572-470-7852`
6. **Facebook Pixel ID:** `579298288600609` (Business ID: 623339086973908)
7. **GitHub Secrets** (cho auto-deploy) — Xem file SETUP-SECRETS.md trong repo

### Chưa cần ngay (tuần 3+):
8. **Hotjar Site ID** — Tạo tại https://hotjar.com → Free plan → Copy Site ID
9. **Google Ads Remarketing Tag** — Tạo sau khi campaign đã chạy

---

## PROMPT 1: Cài tracking (GTM + GA4 + Google Ads + Facebook Pixel)
> **Chạy prompt này ĐẦU TIÊN** — Không có tracking = đốt tiền quảng cáo mù

```
Trong dự án MVTLandingpage, tôi cần cài đặt tracking cho landing page escape.

File cần sửa: pages/escape/index.html

Hãy thêm các tracking code sau vào đúng vị trí:

1. Google Tag Manager:
   - Container ID: GTM-TPQWV864
   - GTM script vào <head> (càng cao càng tốt, sau <meta charset>)
   - GTM noscript vào ngay sau <body>

2. Google Analytics 4 (qua GTM):
   - GA4 Measurement ID: G-LKDCCNJMP3
   - Config GA4 qua gtag.js (backup ngoài GTM)

3. Google Ads Conversion Tracking:
   - Conversion ID: AW-17709107883
   - Conversion Label: Wq0ECKXBmfsbEKuVrvxB
   - send_to value: AW-17709107883/Wq0ECKXBmfsbEKuVrvxB
   - Fire conversion event khi form submit thành công (trong hàm handleSubmit, sau khi nhận response ok)
   - Event name: "generate_lead"

4. Facebook Pixel:
   - Pixel ID: 579298288600609
   - Base pixel code vào <head>
   - Track PageView mặc định
   - Track "Lead" event khi form submit thành công (cùng chỗ với Google Ads conversion)

5. Thêm dataLayer events cho GTM:
   - Event "form_submit" khi user click Send Inquiry
   - Event "form_success" khi submit thành công
   - Event "form_error" khi submit thất bại
   - Event "cta_click" khi click bất kỳ CTA button nào
   - Event "whatsapp_click" khi click WhatsApp link

Sau khi sửa xong, chạy: node build.js để bundle vào worker.js
Không deploy — tôi sẽ review trước.
```

---

## PROMPT 2: Sync structured data + meta keywords từ worker.js cũ
> **Fix vấn đề desync** — pages/escape/index.html thiếu Schema.org và keywords

```
Trong dự án MVTLandingpage, file pages/escape/index.html đang THIẾU nhiều thứ so với worker.js.backup (bản cũ đang chạy trên production).

Hãy so sánh 2 file và sync các phần sau từ worker.js.backup vào pages/escape/index.html:

1. Meta keywords — worker.js.backup có 30+ keywords dài, index.html chỉ có 6 keywords ngắn. Copy TOÀN BỘ meta keywords từ worker.js.backup.

2. Schema.org JSON-LD — Kiểm tra xem pages/escape/index.html đã có 4 blocks JSON-LD chưa:
   - TravelAgency (Organization)
   - TouristTrip với Offer + Itinerary
   - FAQPage (8 Q&A)
   - BreadcrumbList
   Nếu thiếu block nào, copy từ worker.js.backup.

3. Meta description — So sánh và dùng bản dài hơn, có chứa giá tiền và destinations.

4. Geo meta tags — Đảm bảo có: geo.region=AU, geo.placename=Australia, target=all, audience=all

Giữ nguyên mọi thứ khác trong index.html. Chỉ BỔ SUNG, không xóa code có sẵn.

Sau khi sửa xong: node build.js
```

---

## PROMPT 3: Thêm floating CTA + WhatsApp button + exit-intent popup
> **Tăng conversion ngay lập tức** — Thêm nhiều touchpoints để capture leads

```
Trong dự án MVTLandingpage, sửa file pages/escape/index.html để thêm 3 conversion elements:

1. FLOATING WhatsApp Button (góc phải dưới):
   - Hiển thị icon WhatsApp (dùng SVG hoặc emoji 💬)
   - Link: https://wa.me/84974036614?text=Hi%20MyVivaTour!%20I%27m%20interested%20in%20the%20Escape%20Australia%20tour.
   - Luôn hiển thị, z-index cao, animation pulse nhẹ
   - Trên mobile: cách bottom 1rem, cách right 1rem
   - Khi hover hiện tooltip "Chat with us on WhatsApp"
   - Style: màu xanh WhatsApp #25D366, border-radius tròn, box-shadow

2. FLOATING "Book Now" CTA bar (sticky bottom trên mobile):
   - Chỉ hiện trên mobile (max-width: 768px)
   - Hiện khi scroll xuống quá hero section
   - Background gradient dark, text: "From $2,099 AUD" + button "Book Now →"
   - Click smooth-scroll tới #booking form
   - Padding: 0.75rem, z-index cao hơn WhatsApp button
   - Ẩn khi user scroll tới #booking section (đã thấy form rồi)

3. EXIT-INTENT Popup (chỉ desktop):
   - Trigger khi mouse di chuyển ra khỏi viewport (mouseleave trên document)
   - Chỉ hiện 1 lần per session (dùng sessionStorage)
   - Content:
     Heading: "Wait! Don't Miss Out"
     Subtext: "Get our FREE Vietnam Travel Guide + Exclusive $100 OFF your booking"
     Form: Chỉ 2 fields — Name + Email
     Button: "Get My Free Guide"
     Submit tới Web3Forms (cùng access key: cf0ca620-d064-4640-9454-afb27d588f67)
     Subject: "Lead Magnet - Vietnam Travel Guide"
   - Style: Modal overlay, white card center, close X button
   - Animation: fadeIn 0.3s

Đảm bảo:
- Không conflict với back-to-top button
- WhatsApp button cách back-to-top button ít nhất 60px
- Responsive trên tất cả screen sizes
- Track events qua dataLayer cho GTM (popup_shown, popup_submit, whatsapp_click)

Sau khi sửa: node build.js
```

---

## PROMPT 4: Tối ưu form chính + thêm social proof
> **Giảm friction, tăng trust** — Form hiện có 5 required fields, quá nhiều

```
Trong dự án MVTLandingpage, tối ưu booking form trong pages/escape/index.html:

1. GIẢM FORM FIELDS — Chia làm 2 bước:
   Bước 1 (hiện mặc định):
   - Full Name (required)
   - Email (required)
   - Phone (required)
   - Button: "Get Free Quote →"

   Bước 2 (hiện sau khi bước 1 validate OK, dùng JS show/hide):
   - Number of Travelers
   - Preferred Travel Date
   - Message
   - Button: "Send Inquiry →"

   Animation: slide-down smooth khi hiện bước 2.
   Form vẫn submit tất cả fields cùng lúc tới Web3Forms.

2. THÊM SOCIAL PROOF gần form:
   Ngay trên form, thêm 1 dòng:
   "⭐⭐⭐⭐⭐ Trusted by 500+ Australian travelers"
   Kèm 3 avatar tròn nhỏ (dùng placeholder images hoặc initials) chồng nhau kiểu stack

3. THÊM CTA BUTTONS giữa trang:
   Sau section "Transparent Pricing" — thêm button "Start Planning Your Trip →" (scroll to #booking)
   Sau section "What Our Guests Say" — thêm button "Book Your Vietnam Adventure →" (scroll to #booking)
   Sau section "FAQ" — thêm button "Ready to Go? Get Your Free Quote →" (scroll to #booking)
   Style giống hero CTA button, centered.

4. THÊM URGENCY ELEMENT trên pricing card:
   Trên "Base Package" card, thêm badge: "🔥 Most Popular — 12 booked this week"
   Dưới giá, thêm: "✓ Price guaranteed until [tháng sau]" (tự tính bằng JS)

Sau khi sửa: node build.js
```

---

## PROMPT 5: Bổ sung AI SEO — Schema.org nâng cao
> **Tối ưu cho AI search** — Để ChatGPT/Gemini/Perplexity recommend tour

```
Trong dự án MVTLandingpage, bổ sung structured data nâng cao vào pages/escape/index.html:

1. THÊM AggregateRating Schema vào TouristTrip block:
   "aggregateRating": {
     "@type": "AggregateRating",
     "ratingValue": "4.9",
     "bestRating": "5",
     "ratingCount": "127",
     "reviewCount": "89"
   }

2. THÊM Review Schema (3 reviews riêng lẻ):
   Dựa trên 3 Facebook reviews đang hiển thị:
   - Mohit Jain: 5 sao, group 11 người, Hanoi/Sapa/Ha Long Bay
   - Ma Luisa Camacho: 5 sao, 5 seniors, "perfect 10 score"
   - Nemi Narvaez Esangga: 5 sao, group 5 người, 18 ngày

3. THÊM Organization Schema mở rộng:
   - "areaServed": {"@type": "Country", "name": "Australia"}
   - "hasOfferCatalog" listing all tour packages
   - "knowsAbout": ["Vietnam Tourism", "Southeast Asia Travel", "Ha Long Bay", "Hoi An", "Mekong Delta"]
   - "award": "TripAdvisor Certificate of Excellence" (nếu có)

4. THÊM WebPage Schema:
   "@type": "WebPage"
   "speakable": chỉ định hero text và pricing section cho voice search

5. THÊM bảng so sánh packages dưới dạng HTML table + ItemList Schema:
   | Package | Price | Hotels | Cruise | Guide |
   | Base | $2,099 | 3-4 Star | Standard | Group |
   | Super 4-Star | $2,389 | 4 Star | Standard | Group |
   | Luxury 5-Star | $2,779 | 5 Star | 5-Star | Group |
   | Private | $2,369 | 3-4 Star | Standard | Private |

   Đặt bảng này trong section Pricing, dưới upgrade cards.

Sau khi sửa: node build.js
```

---

## PROMPT 6: Deploy worker.js mới + verify
> **Đưa tất cả changes lên production**

```
Trong dự án MVTLandingpage:

1. Chạy node build.js — verify output OK
2. Git add tất cả files đã thay đổi
3. Git commit với message: "feat: add tracking, optimize conversion, enhance AI SEO"
4. Git push origin main

Sau đó verify:
- Kiểm tra worker.js có routing đúng: /, /honeymoon, /family-tour, /luxury-cruise
- Kiểm tra sitemap.xml và robots.txt được generate
- Kiểm tra 404 page hoạt động
- List tất cả routes và page sizes

Nếu GitHub Actions đã setup (có CLOUDFLARE_API_TOKEN secret), nó sẽ tự deploy.
Nếu chưa, chạy: npx wrangler deploy --name escape-myvivatour
```

---

## Thứ tự chạy prompts

1. ✅ Đã có đủ IDs: GTM-TPQWV864, G-LKDCCNJMP3, AW-17709107883/Wq0ECKXBmfsbEKuVrvxB, FB Pixel 579298288600609
2. ▶️ Prompt 1 — Cài tracking (COPY NGUYÊN PROMPT — IDs đã điền sẵn)
3. ▶️ Prompt 2 — Sync structured data
4. ▶️ Prompt 5 — AI SEO (có thể gộp với Prompt 2)
5. ▶️ Prompt 3 — Floating elements
6. ▶️ Prompt 4 — Form optimization
7. ▶️ Prompt 6 — Deploy

Mỗi prompt nên chạy riêng, review kết quả, rồi chạy prompt tiếp theo.
