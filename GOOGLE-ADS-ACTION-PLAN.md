# KẾ HOẠCH HÀNH ĐỘNG CẢI TIẾN GOOGLE ADS - MYVIVATOUR

**Ngày tạo:** 16/04/2026  
**Dựa trên:** Báo cáo phân tích chiến dịch 15/04/2026 (90 ngày: 15/01 - 14/04/2026)  
**Tài khoản:** My Viva Tour (806-163-1566)

---

## TỔNG QUAN VẤN ĐỀ

Campaign **MVT - Escape - High Intent** có CTR 12.33% (xuất sắc) và CPC 32,021đ (thấp hơn 40% so với AU_10May), nhưng ghi nhận **0 conversion** do 3 vấn đề chính:

1. **Popup form thiếu conversion tracking** → Đã fix trong code ✅
2. **GTM cần cập nhật triggers** → Bạn cần làm thủ công (hướng dẫn bên dưới)
3. **2/3 nhóm quảng cáo không có RSA** → Cần tạo ad copy mới

---

## ĐÃ LÀM (Code changes - sẵn sàng deploy)

### ✅ Fix 1: Thêm Google Ads conversion vào popup form
- **File:** `pages/escape/index.html`
- Popup form "Wait! Don't Miss Out" giờ đã push cả `form_success` event VÀ `gtag('event', 'conversion', ...)` khi submit thành công
- Trước đó chỉ có `popup_submit` + `fbq('track', 'Lead')` → Google Ads không ghi nhận

### ✅ Fix 2: Thêm Quick Inquiry Form above-the-fold
- Form rút gọn (Name + Email + Phone) ngay trong Hero section
- Giảm friction: user không cần scroll xuống cuối trang mới thấy form
- Có đầy đủ tracking: `form_submit` → `form_success` → Google Ads conversion + FB Lead
- Trust signal: "Trusted by 500+ Australian travellers • Reply within 2 hours"
- Responsive: stack dọc trên mobile

### ✅ Fix 3: Build worker.js thành công
- `node build.js` → worker.js 157.8KB, sẵn sàng deploy

---

## CẦN LÀM THỦ CÔNG (trong Google Tag Manager + Google Ads)

### 🔴 ƯU TIÊN 1 — KHẨN CẤP: Fix GTM Triggers (Làm ngay hôm nay)

**Mục đích:** Đảm bảo popup form submit cũng fire conversion tags

**Bước 1:** Mở GTM → https://tagmanager.google.com → Container GTM-TPQWV864

**Bước 2:** Vào tag **"Google Ads - Form Conversion"**
- Click Edit
- Trong phần Triggering, thêm trigger **"CE - Popup Submit"** bên cạnh "CE - Form Success"
- Save

**Bước 3:** Làm tương tự cho các tags:
- **"GA4 - Event - Generate Lead"** → thêm trigger "CE - Popup Submit"  
- **"FB - Lead"** → thêm trigger "CE - Popup Submit"

**Bước 4:** Fix cảnh báo **"Tìm thấy một thẻ Google bị thiếu"**
- Click vào thanh cảnh báo → "Khắc phục"
- Thêm Google Tag với Conversion ID: `17709107883`

**Bước 5:** Test bằng Tag Assistant
- Click "Xem trước" trong GTM
- Kết nối với escape.myvivatour.com
- Submit form chính "Plan Your Escape" → xác nhận Google Ads Form Conversion tag fire
- Submit hero quick form → xác nhận tương tự
- Trigger exit-intent popup → submit → xác nhận tương tự
- Nếu OK → Click **"Gửi"** (Publish) để xuất bản

### 🔴 ƯU TIÊN 2 — CAO: Fix Bidding Strategy (Ngay khi fix tracking)

**Bước 1:** Vào Google Ads → Campaign "MVT - Escape - High Intent" → Settings

**Bước 2:** Chuyển bidding từ "Maximize Conversions" sang:
- **"Manual CPC"** với Enhanced CPC bật
- Hoặc **"Maximize Clicks"** với Max CPC limit = 35,000đ

**Bước 3:** Sau 2-4 tuần khi có 15-30 conversions, chuyển lại:
- **"Maximize Conversions"** hoặc **"Target CPA"** = 2,000,000đ

### 🟡 ƯU TIÊN 3 — CAO: Kích hoạt nhóm quảng cáo (1-2 ngày)

**Khuyến nghị: Gộp keywords vào "Nhóm quảng cáo 1"** (đơn giản nhất, hiệu quả nhất)

**Bước 1:** Vào nhóm **"Long-tail"** → Copy 5 từ khóa → Paste vào **"Nhóm quảng cáo 1"**

Chuyển Exact Match → Phrase Match cho keywords volume thấp:
| Cũ (Exact - 0 hiển thị) | Mới (Phrase) |
|---|---|
| [vietnam tour packages from australia 2026] | "vietnam tour packages from australia" |
| [small group vietnam tour from australia] | "small group vietnam tour from australia" |
| [guided vietnam tour with meals included] | "guided vietnam tour with meals" |
| [10 day vietnam tour with flights] | "10 day vietnam tour with flights" |
| [all inclusive vietnam holiday from australia] | Giữ nguyên (đã có hiển thị) |

**Bước 2:** Vào nhóm **"Destination Keywords"** → Copy 5 từ khóa → Paste vào **"Nhóm quảng cáo 1"**
- "Mekong delta tour"
- "hoi an tour package"  
- "hanoi to ho chi minh tour"
- "ha long bay tour package"
- "cu chi tunnels tour"

**Bước 3:** Pause nhóm "Long-tail" và "Destination Keywords" (đã trống)

### 🟡 ƯU TIÊN 4 — TRUNG BÌNH: Cải thiện RSA cho "Nhóm quảng cáo 1" (hiện đánh giá "Kém")

**Thêm Headlines (tối thiểu 12-15):**

```
1. 10-Day Vietnam Tour — $2,099 AUD
2. All-Inclusive Vietnam Holiday
3. Flights Hotels Meals Included
4. From Sydney Melbourne Brisbane
5. Trusted by 500+ Australians
6. Book Your 2026 Vietnam Tour
7. Ha Long Bay Hoi An Mekong
8. Expert Local Guides Included
9. Small Group Vietnam Tour
10. Best Price Vietnam Tour AU
11. Return Flights From Australia
12. Premium Vietnam Holiday Deal
13. Vietnam Holiday From $2,099
14. Save $251 — Book Now
15. WhatsApp Support 24/7
```

**Thêm Descriptions (tối thiểu 4):**

```
1. Explore Hanoi, Ha Long Bay, Hoi An, Ho Chi Minh City & Mekong Delta. 10 days all-inclusive from Australia. Book today!
2. All-inclusive Vietnam holiday with return flights, premium hotels, daily meals & expert guides. Trusted Australian tour operator.
3. Small group Vietnam tours departing daily from Sydney, Melbourne, Brisbane, Adelaide & Perth. Get your free quote now!
4. Save $251 on your dream Vietnam holiday. Hotels, meals, domestic flights & guided tours included. WhatsApp us for details.
```

### 🟡 ƯU TIÊN 5 — TRUNG BÌNH: Tối ưu Keywords (1 tuần)

**Thêm keywords mới (Phrase Match):**
```
"Vietnam tour from australia all inclusive"
"10 day vietnam tour package"
"vietnam holiday package with flights from australia"
"cheap vietnam tour from sydney"
"cheap vietnam tour from melbourne"
"cheap vietnam tour from brisbane"
"vietnam tour 2026 australia"
"vietnam package deal from australia"
"vietnam tours for families"  ← CV rate 8.33% trên AU_10May!
```

**Pause keywords không hiệu quả:**
```
"Vietnam tour with meals included"     (0 hiển thị 90 ngày)
"vietnam tour with flights included"   (0 hiển thị 90 ngày)
[vietnam tour packages from australia 2026]  (Exact Match, 0 hiển thị)
```

### 🟢 ƯU TIÊN 6 — NHẸ: Dọn Conversion Actions

**Bước 1:** Vào Google Ads → Goals → Conversions

**Bước 2:** Tìm **"Dental_Form_contact"** → Edit → Chuyển từ "Hành động chính" → **"Hành động phụ"**

**Bước 3:** Tìm **"Dental_Whatsapp"** → Edit → Chuyển từ "Hành động chính" → **"Hành động phụ"**

**Bước 4:** Kiểm tra GA4 property liên kết:
- Vào GA4 Admin → Property Settings → Google Ads Linking
- Xác nhận GA4 property `a334536706p499301826` đã liên kết đúng với Google Ads `806-163-1566`
- Trong GA4, đảm bảo event `form_submit` được đánh dấu là **Key Event**

### 🟢 ƯU TIÊN 7 — SAU KHI ỔN ĐỊNH: Tăng ngân sách (2-3 tuần sau)

Khi đã có conversion data ổn định (15-30 conversions):
- Tăng ngân sách từ 1,710,475đ/ngày → **2,500,000 - 3,000,000đ/ngày**
- Escape CPC thấp hơn 40% → cùng budget mua được nhiều clicks hơn
- Mục tiêu CPA: **dưới 2,000,000đ** (so với 3,736,216đ của AU_10May)

---

## TIMELINE

| Tuần | Hành động | KPI mục tiêu |
|------|-----------|-------------|
| Tuần 1 (ngay) | Deploy code, fix GTM, fix bidding, gộp keywords | Conversion bắt đầu ghi nhận |
| Tuần 2 | Cải thiện RSA, thêm keywords mới | RSA "Kém" → "Tốt", thêm 10 keywords |
| Tuần 3 | Tích lũy data, dọn dental conversions | 10-15 conversions, CPA < 2.5M |
| Tuần 4 | Chuyển lại smart bidding, tăng budget | 15-20 conversions/tháng, CPA < 2M |

---

## DỰ KIẾN KẾT QUẢ SAU 30 NGÀY

| Chỉ số | Hiện tại | Mục tiêu | Thay đổi |
|--------|----------|----------|----------|
| Conversions/tháng | 0 | 15-20 | ∞ |
| CPA | N/A | < 2,000,000đ | Thấp hơn 46% so với AU_10May |
| CTR | 12.33% | 12-14% | Duy trì hoặc tăng |
| CPC | 32,021đ | 30,000-35,000đ | Duy trì |
| Nhóm QC hoạt động | 1/3 | 3/3 → 1/1 (gộp) | Tối ưu cấu trúc |
| Từ khóa active | ~15/35 | 25-30 | Tăng coverage |
