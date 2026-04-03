# Chiến dịch Google Ads — escape.myvivatour.com

## Tổng quan

| Hạng mục | Chi tiết |
|---|---|
| Landing page | https://escape.myvivatour.com |
| Sản phẩm | Tour Vietnam 10 ngày cho khách Úc |
| Mục tiêu | Thu lead (form submit + WhatsApp click) |
| Ngân sách | $500 – $2,000/tháng |
| Nền tảng | Google Ads |

---

## PHẦN 1: CHUẨN BỊ TRƯỚC KHI CHẠY ADS

### 1.1. Cài đặt Tracking (BẮT BUỘC)

Landing page hiện tại **chưa có tracking nào**. Cần cài trước khi chi tiền:

**Google Tag Manager (GTM):**
- Tạo tài khoản GTM tại https://tagmanager.google.com
- Lấy Container ID (dạng GTM-XXXXXXX)
- Thêm GTM snippet vào `<head>` và `<body>` của worker.js

**Google Analytics 4 (GA4):**
- Tạo GA4 property tại https://analytics.google.com
- Lấy Measurement ID (dạng G-XXXXXXXXXX)
- Cài GA4 qua GTM (không hardcode, dễ quản lý hơn)

**Google Ads Conversion Tracking:**
- Trong Google Ads → Tools → Conversions, tạo 2 conversion actions:
  1. **Form Submit** — khi user gửi form liên hệ thành công
  2. **WhatsApp Click** — khi user click nút WhatsApp
- Cài conversion tag qua GTM

**Các event cần track:**

| Event | Trigger | Loại |
|---|---|---|
| `form_submit` | Form Web3Forms gửi thành công | Primary conversion |
| `whatsapp_click` | Click nút WhatsApp | Primary conversion |
| `scroll_50` | Cuộn 50% trang | Observation |
| `scroll_90` | Cuộn 90% trang | Observation |
| `cta_click` | Click nút "Book Now" / "Enquire" | Observation |
| `gallery_view` | Mở lightbox xem ảnh | Observation |

### 1.2. Thiết lập Landing Page cho Conversion

Kiểm tra và tối ưu trước khi chạy:

- [ ] **Page speed**: Kiểm tra tại PageSpeed Insights, mục tiêu > 90 mobile
- [ ] **Form hoạt động tốt**: Test form submit, nhận email đúng
- [ ] **WhatsApp link đúng**: Click mở chat WhatsApp ngay
- [ ] **Mobile-friendly**: Kiểm tra trên nhiều device
- [ ] **CTA rõ ràng**: Nút Book Now nổi bật, dễ thấy
- [ ] **Trust signals**: Reviews, logos, chứng nhận

---

## PHẦN 2: CẤU TRÚC CHIẾN DỊCH GOOGLE ADS

### 2.1. Đề xuất cấu trúc Campaign

Với ngân sách $500-$2,000/tháng, nên bắt đầu đơn giản rồi mở rộng:

#### Giai đoạn 1 — Tuần 1-4 (Test & Learn): $500-800/tháng

**Campaign 1: Search — High Intent Keywords**
- Loại: Search Campaign
- Bidding: Maximize Conversions (sau khi có 15+ conversions, chuyển sang Target CPA)
- Budget: $20-30/ngày

**Ad Group 1 — Vietnam Tour from Australia**
```
Keywords:
- "vietnam tour from australia" [exact]
- "vietnam tour package australian" [phrase]
- "10 day vietnam tour" [exact]
- "vietnam holiday package" [phrase]
- vietnam tour booking [broad]
```

**Ad Group 2 — Vietnam Travel Deals**
```
Keywords:
- "vietnam travel deals" [phrase]
- "cheap vietnam tour" [phrase]
- "vietnam group tour" [phrase]
- "best vietnam tour operator" [phrase]
- affordable vietnam holiday [broad]
```

**Ad Group 3 — Specific Destinations**
```
Keywords:
- "hanoi to ho chi minh tour" [phrase]
- "ha long bay tour package" [phrase]
- "vietnam north to south tour" [phrase]
- "hoi an da nang tour" [phrase]
```

**Negative Keywords (thêm ngay từ đầu):**
```
- visa
- embassy
- DIY
- backpacking
- free
- volunteer
- war
- history documentary
- flights only
- hotels only
```

#### Giai đoạn 2 — Tháng 2-3: Scale lên $1,000-2,000/tháng

**Campaign 2: Performance Max**
- Sử dụng asset groups với ảnh đẹp từ landing page
- Để Google tối ưu hiển thị trên Search, Display, YouTube, Discover
- Budget: $15-25/ngày

**Campaign 3: Remarketing (Display)**
- Target người đã visit landing page nhưng chưa submit form
- Budget: $5-10/ngày
- Cần cài Google Ads remarketing tag qua GTM

### 2.2. Mẫu Ad Copy

**Responsive Search Ad — Ad Group 1:**

Headlines (tối đa 15):
1. Vietnam Tours From Australia
2. 10-Day Vietnam Adventure
3. Escape to Vietnam Today
4. All-Inclusive Vietnam Tour
5. From $XXX Per Person *(điền giá thực)*
6. Hanoi to Ho Chi Minh City
7. Ha Long Bay & Hoi An
8. Local Expert Guides
9. Small Group Tours
10. Book Now — Limited Spots

Descriptions (tối đa 4):
1. Explore Vietnam in 10 days — from Ha Long Bay to the Mekong Delta. All-inclusive package with local guides. Enquire now!
2. Trusted by Australian travellers. Handcrafted itinerary, authentic experiences, hassle-free booking. Get a free quote today.
3. Visit Hanoi, Ha Long Bay, Hoi An, Ho Chi Minh & more. Flights, hotels, meals & activities included. Book your spot!
4. Small group tours designed for Australians. Local expertise since [năm]. WhatsApp us for instant response.

**Ad Extensions cần thêm:**
- Sitelink: Itinerary, Pricing, Reviews, Contact Us
- Callout: 24/7 Support, Local Guides, Flexible Dates
- Call extension: Số WhatsApp hoặc hotline
- Image extension: Ảnh đẹp từ tour
- Price extension: Hiển thị giá tour

---

## PHẦN 3: ĐO LƯỜNG HIỆU QUẢ

### 3.1. KPIs chính cần theo dõi

| Metric | Mục tiêu ban đầu | Tốt | Rất tốt |
|---|---|---|---|
| **Cost per Lead (CPL)** | < $30 | < $20 | < $15 |
| **Click-Through Rate (CTR)** | > 3% | > 5% | > 8% |
| **Conversion Rate (CVR)** | > 2% | > 4% | > 6% |
| **Quality Score** | > 6 | > 7 | > 9 |
| **Impression Share** | > 30% | > 50% | > 70% |

### 3.2. Cách tính ROI

```
Chi phí trung bình/lead (CPL):     $20
Tỷ lệ lead → booking:             10% (1 trên 10 leads)
Chi phí để có 1 booking:           $200
Doanh thu trung bình/booking:      $1,500+ (tour 10 ngày)
ROI:                               ~650%
```

→ Nếu CPL < $30 và close rate > 5%, chiến dịch có lãi.

### 3.3. Dashboard theo dõi

Thiết lập Looker Studio (miễn phí) kết nối GA4 + Google Ads để theo dõi:

- Số leads theo ngày/tuần/tháng
- CPL trend theo thời gian
- Top keywords mang lại leads
- Device breakdown (mobile vs desktop)
- Geo breakdown (thành phố nào ở Úc)
- Landing page engagement (bounce rate, time on page)

### 3.4. Lịch review & tối ưu

| Thời điểm | Hành động |
|---|---|
| Hàng ngày | Check spend, pause keywords CPL > $50 |
| Hàng tuần | Review search terms report, thêm negative keywords |
| 2 tuần/lần | A/B test ad copy, điều chỉnh bid |
| Hàng tháng | Review tổng thể, quyết định scale up/down |
| 3 tháng | Đánh giá toàn bộ, cân nhắc thêm campaign mới |

---

## PHẦN 4: TIMELINE TRIỂN KHAI

### Tuần 1: Setup (chưa tốn tiền ads)
- [ ] Tạo tài khoản Google Ads (nếu chưa có)
- [ ] Cài GTM + GA4 + Conversion tracking vào landing page
- [ ] Verify domain, set up billing
- [ ] Tạo remarketing audience

### Tuần 2: Launch
- [ ] Tạo Search Campaign với 3 ad groups
- [ ] Viết ad copy + extensions
- [ ] Set budget $20/ngày
- [ ] Bật campaign, monitor hàng ngày

### Tuần 3-4: Optimize
- [ ] Review search terms, thêm negative keywords
- [ ] Pause keywords không hiệu quả
- [ ] Test ad copy mới
- [ ] Điều chỉnh bid theo performance

### Tháng 2: Scale
- [ ] Tăng budget nếu CPL tốt
- [ ] Thêm Performance Max campaign
- [ ] Bật Remarketing campaign
- [ ] Expand keyword list

---

## PHẦN 5: TIPS QUAN TRỌNG

1. **Đừng vội scale**: Chạy tối thiểu 2 tuần với budget nhỏ trước khi tăng. Google cần thời gian học.

2. **Search Terms Report là vàng**: Review hàng tuần để tìm keywords mới tốt và thêm negative keywords xấu.

3. **Landing page speed matters**: Google sẽ charge CPC cao hơn nếu page load chậm. Mục tiêu < 3 giây trên mobile.

4. **Đừng quên remarketing**: 97% visitors không convert lần đầu. Remarketing giúp đưa họ quay lại.

5. **Test liên tục**: Luôn chạy ít nhất 2 ad variations để Google tối ưu.

6. **Theo dõi competitor**: Dùng Auction Insights trong Google Ads để biết ai đang cạnh tranh cùng keywords.

7. **Seasonal trends**: Tour Vietnam có mùa cao điểm (tháng 10-4). Tăng budget trong mùa cao, giảm trong mùa thấp.

---

*Tài liệu tạo: 03/04/2026*
*Cập nhật khi có data thực tế từ chiến dịch*
