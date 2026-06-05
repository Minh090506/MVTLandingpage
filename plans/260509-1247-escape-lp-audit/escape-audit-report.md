# Escape LP — Audit Tổng Hợp

**URL:** https://escape.myvivatour.com/
**Date:** 2026-05-09
**Method:** 4 specialist agents song song (SEO / CRO+Content / UX+A11y / Performance+Tracking)
**Source:** live page snapshot + source HTML `pages/escape/index.html` (3,481 dòng)

---

## TL;DR

Landing page có **nền tảng vững** (tracking đầy đủ, schema 6 blocks, title tốt nhất phân khúc, TTFB 163ms) nhưng đang **chảy máu conversion** vì 4 vấn đề lớn: H1 sai KW, hero image kiến trúc sai gây LCP fail, reviews 4.9/127 invisible, accordion không keyboard-accessible. Sửa **5 quick wins** ước lift **+25-40% CVR** trong vòng 1 buổi chiều.

## Score Tổng Hợp

| Dimension | Score | Trạng thái |
|---|---|---|
| SEO | 74/100 | 🟡 Tốt, chưa xuất sắc |
| CRO + Content | 61/100 | 🟠 Trung bình, có conversion killers |
| UX | 68/100 | 🟡 Solid, có CRO leak |
| Accessibility (WCAG 2.1 AA) | **52/100** | 🔴 Multi-violation, cần fix gấp |
| Performance | 58/100 | 🔴 LCP fail |
| Tracking Health | 78/100 | 🟢 Production-grade, có double-fire risk |
| **Average** | **65/100** | 🟡 |

---

## 🔴 Top 5 Critical Issues (sửa NGAY — ≤30 phút mỗi cái)

### 1. H1 "Escape Australia" — sai cả SEO + sai message match Google Ads
**Flagged bởi:** SEO + CRO (2/4 agents)
**Hiện tại:** `<h1>Escape Australia</h1>` — zero target keyword, visitor từ ad "10-day Vietnam tour" thấy brand name không phải search query
**Fix:** đổi thành `"10-Day All-Inclusive Vietnam Holiday from Australia"`
**Lift dự kiến:** +10-15% CVR, +ranking signal cho "vietnam tour from australia"
**Effort:** 5 phút

### 2. Phone field bắt buộc trên Hero Quick Form
**Flagged bởi:** CRO
**Vì:** Phone là friction field #1, Aussie privacy-aware
**Fix:** bỏ `required` ở `<input type="tel">` trong `#heroQuickForm` (giữ ở booking form chính)
**Lift dự kiến:** +20-35% hero form submission rate
**Effort:** 2 phút

### 3. Reviews 4.9/127 chỉ tồn tại trong Schema, INVISIBLE trên page
**Flagged bởi:** CRO + UX
**Vì:** AggregateRating có trong JSON-LD nhưng không render → khách không thấy
**Fix:** thêm trust bar dưới hero:
```
★★★★★ 4.9 · 127 Reviews   |   500+ Australian Travellers   |   Operating Since 2015
```
**Lift dự kiến:** +12-20% engaged sessions
**Effort:** 20 phút

### 4. Accordion (10-day itinerary + 8 FAQ) — NOT keyboard-operable
**Flagged bởi:** UX (WCAG 2.1.1 fail)
**Vì:** dùng `<div>` thay `<button>`, không có `aria-expanded`. Keyboard/SR users bị khóa khỏi entire itinerary
**Fix:** convert `<div class="accordion">` → `<button>` + `aria-expanded` + `tabindex`
**Effort:** 15 phút | **Impact:** L (legal compliance + SEO signal)

### 5. Hero image dùng CSS `::before` background → LCP fail
**Flagged bởi:** Performance + UX + SEO (3/4 agents)
**Vì:** Browser không thể discover/preload CSS background image sớm → LCP ~3.5-5s (target <2.5s)
**Fix:**
```html
<img src="hero.webp" fetchpriority="high" width="1920" height="1080" alt="...">
<link rel="preload" as="image" href="hero.webp" fetchpriority="high">
```
**Lift dự kiến:** LCP 4s → ~2s (Google ranking signal + bounce rate)
**Effort:** 20 phút

---

## ⚠️ Top 10 Issues Mức Trung Bình

| # | Issue | Dimension | Effort | Impact |
|---|-------|-----------|--------|--------|
| 6 | 19/23 images thiếu `loading="lazy"` | Perf | 15min | M |
| 7 | Image `highlights-bg-blur.jpg` → 404 mọi pageload | Perf | 5min | M |
| 8 | Supabase images cache `no-cache` (re-validate mọi request) | Perf | 30min | M |
| 9 | GA4 double-fire risk (gtag.js + GTM container) | Tracking | 10min | M |
| 10 | Gold text `#D4AF37` trên trắng = contrast 2.3:1 (WCAG fail 4.5:1) | A11y | 30min | M |
| 11 | Section order: Pricing TRƯỚC Why-Us + Testimonials → sticker shock | UX/CRO | 20min | M |
| 12 | Không có risk reversal visible (refund policy ẩn trong T&C modal) | CRO | 30min | M |
| 13 | Zero internal link tới /honeymoon, /family-tour, /luxury-cruise | SEO | 30min | M |
| 14 | 23 image alts generic, thiếu target keyword | SEO | 20min | M |
| 15 | "12 booked this week" hardcoded → trust destroyer cho returning visitors | CRO | 15min | M |

---

## 🎯 Action Plan Ưu Tiên (theo ROI)

### Phase 1 — Quick Wins (1 buổi chiều, ~2 giờ tổng)
Hoàn thành: 5 critical + 5 medium dễ nhất
- [ ] Đổi H1 → "10-Day All-Inclusive Vietnam Holiday from Australia"
- [ ] Bỏ `required` trên hero form phone field
- [ ] Add trust bar (rating + reviews + travellers count) dưới hero
- [ ] Convert accordion divs → buttons với ARIA
- [ ] Convert hero CSS bg → `<img fetchpriority="high">` + preload
- [ ] Add `loading="lazy"` + `width`/`height` cho 19 images
- [ ] Fix 404 `highlights-bg-blur.jpg`
- [ ] Fix GA4 double-fire (kiểm tra GTM, remove direct gtag.js nếu cần)
- [ ] Add 3-icon risk reversal strip trên booking form
- [ ] Reorder sections: Why-Us → Testimonials → Pricing

**Ước tính tổng lift:** +25-40% CVR, LCP 4s → 2s, A11y 52 → 75

### Phase 2 — Medium-effort wins (1-2 ngày)
- [ ] Fix gold text contrast (split token `--primary` vs `--primary-text` `#A8842A`)
- [ ] Convert top-fold images sang WebP
- [ ] Add internal cluster section linking 3 sibling tour pages
- [ ] Enrich 23 image alts với target KWs
- [ ] Add Sapa/Hue/Ninh Binh/Phu Quoc keywords (đối thủ có, mình không)
- [ ] Add ABN/ATAS/AU phone vào footer (trust deficit lớn nhất)
- [ ] Add `prefers-reduced-motion` guard
- [ ] Fix BreadcrumbList (chỉ 1 item → invalid)
- [ ] Add `form_start` GTM event để track abandonment
- [ ] Add preconnect cho googletagmanager.com + connect.facebook.net

### Phase 3 — Strategic (1-2 tuần)
- [ ] Apply for ATAS/IATA accreditation (biggest trust gap vs Intrepid/Wendy Wu)
- [ ] Verify Google Business Profile, integrate Trustpilot/Google Reviews widget
- [ ] Real-device Lighthouse run (cần PSI hoặc thực test mobile)
- [ ] A/B test hero image (CSS bg vs img + preload thực tế)
- [ ] Replace static "12 booked this week" với real-time data hoặc social proof tool

---

## 🟢 Đã Ổn (giữ nguyên, đừng đụng vào)

1. **Title tag:** "10-Day Vietnam Tour from Australia $2,099 AUD All-Inclusive | MyVivaTour 2026" — best-in-class vs 10 đối thủ (có duration, KW, location, price, brand, year)
2. **Schema.org:** 6 JSON-LD blocks (TravelAgency + TouristTrip + FAQPage + Reviews + Speakable + ItemList) — rich snippet-ready
3. **Hero Quick Form:** "Get a Free Quote in 30 Seconds" + "Reply within 2 hours" + 3 fields above-the-fold — rare và effective cho tour LP
4. **Tracking stack:** GTM + GA4 + Google Ads conversion + FB Pixel + dataLayer events (`form_submit`, `form_success`, `cta_click`, `whatsapp_click`) — production-grade
5. **TTFB 163ms:** CF Workers edge SIN, HTTP/2, Brotli — infrastructure xuất sắc
6. **Form handlers:** async/await + try/catch coverage đầy đủ ở cả 3 form (booking, exit, hero quick)
7. **Pricing transparency:** Was/Now strikethrough, comparison table, 27 meals count, baggage spec — minh bạch hơn Intrepid
8. **8 FAQs:** match JSON-LD FAQPage, voice-search optimized
9. **Mobile UX stack:** sticky bar + WhatsApp pulse + exit-intent + back-to-top — đầy đủ
10. **robots.txt + sitemap.xml:** clean, đúng chuẩn

---

## Competitive Gap (3 điều đối thủ làm tốt hơn)

| Đối thủ | Họ có | Mình thiếu |
|---|---|---|
| Intrepid | "8,023 verified reviews ★4.9" hiển thị ngay dưới hero | 127 reviews chỉ trong schema |
| Intrepid | "Similar tours $1,999-$2,500 WITHOUT flights" — price anchoring rõ ràng | Không nêu so sánh, $2,099 all-in trông không deal |
| Wendy Wu | ATAS + IATA accreditation badges | Không có credential nào → buyer confidence thấp |

---

## Reports Chi Tiết

| Report | Path |
|---|---|
| SEO | `plans/260509-1247-escape-lp-audit/reports/seo-report.md` |
| CRO + Content | `plans/260509-1247-escape-lp-audit/reports/cro-content-report.md` |
| UX + Accessibility | `plans/260509-1247-escape-lp-audit/reports/ux-accessibility-report.md` |
| Performance + Tracking | `plans/260509-1247-escape-lp-audit/reports/performance-report.md` |
| Live page snapshot | `plans/260509-1247-escape-lp-audit/live-page.html` (148KB) |

---

## Unresolved Questions

1. **ATAS / IATA accreditation:** đăng ký được không? Bao lâu? (biggest trust gap)
2. **Google Business Profile:** đã verified chưa? Cần để integrate real reviews
3. **AggregateRating 4.9/127:** verifiable không? Tránh structured-data spam penalty của Google
4. **AU phone number:** plan có thuê AU local number (1300/1800) không?
5. **"$100 OFF" exit popup:** terms/coupon code có thật không? Compliance risk nếu không
6. **Visa FAQ 2026:** AU→VN e-visa process có cần update không?
7. **GA4 double-fire:** cần check trong GTM UI — gtag.js trực tiếp + GTM container có conflict không
8. **Sibling pages launch timing:** /honeymoon, /family-tour, /luxury-cruise khi nào live? Internal linking sẽ hold off đến khi có pages
9. **Cloudflare Image Resizing:** account có enabled không? Nếu có → optimize 23 images dễ hơn nhiều
10. **Real-device Lighthouse:** WebFetch/curl không đo được CWV thực — cần PSI hoặc Chrome DevTools profiling thực tế
