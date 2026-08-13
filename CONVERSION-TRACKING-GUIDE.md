# Hướng dẫn thiết lập Conversion Tracking — escape.myvivatour.com

## Tổng quan hiện trạng

**Đã cài trong code HTML (on-page):** ✅
- GTM Container: `GTM-KRFGX69D` (account `myvivatour` · account ID `6256769444` · container ID `261027424`)
- GA4 Measurement: `G-2R0EJ2LBJ5` — **gửi qua GTM** (không load/config GA4 bằng gtag trực tiếp trên LP)
- Google Ads: `AW-17709107883` — on-page `gtag/js` loader dùng ID này
- Facebook Pixel: `531880273071891`
- DataLayer events: `form_submit`, `form_success`, `form_error`, `cta_click`, `whatsapp_click`, `popup_shown`, `popup_submit`
- Google Ads conversion fire khi form success: `AW-17709107883/Wq0ECKXBmfsbEKuVrvxB`
- Facebook `fbq('track', 'Lead')` khi form success

**Cần thiết lập trên các nền tảng (server-side):** ⏳
1. Google Tag Manager — Tạo tags trong GTM container
2. Google Ads — Verify conversion action
3. GA4 — Mark conversions
4. Facebook Events Manager — Verify pixel

---

## PHẦN 1: GOOGLE TAG MANAGER (tagmanager.google.com)

### Bước 1.1: Đăng nhập GTM
1. Mở Chrome, vào `https://tagmanager.google.com`
2. Đăng nhập bằng tài khoản Google quản lý GTM
3. Click vào container `GTM-KRFGX69D` (account myvivatour)

### Bước 1.2: Tạo Variables (Biến)
Vào menu **Variables** > **New** (User-Defined Variables):

**Variable 1: DLV - form_id**
- Name: `DLV - form_id`
- Type: `Data Layer Variable`
- Data Layer Variable Name: `form_id`
- Save

**Variable 2: DLV - tour_name**
- Name: `DLV - tour_name`
- Type: `Data Layer Variable`
- Data Layer Variable Name: `tour_name`
- Save

**Variable 3: DLV - cta_text**
- Name: `DLV - cta_text`
- Type: `Data Layer Variable`
- Data Layer Variable Name: `cta_text`
- Save

**Variable 4: DLV - error_message**
- Name: `DLV - error_message`
- Type: `Data Layer Variable`
- Data Layer Variable Name: `error_message`
- Save

### Bước 1.3: Tạo Triggers

**Trigger 1: Form Submit**
- Name: `CE - Form Submit`
- Type: `Custom Event`
- Event name: `form_submit`
- Save

**Trigger 2: Form Success**
- Name: `CE - Form Success`
- Type: `Custom Event`
- Event name: `form_success`
- Save

**Trigger 3: Form Error**
- Name: `CE - Form Error`
- Type: `Custom Event`
- Event name: `form_error`
- Save

**Trigger 4: CTA Click**
- Name: `CE - CTA Click`
- Type: `Custom Event`
- Event name: `cta_click`
- Save

**Trigger 5: WhatsApp Click**
- Name: `CE - WhatsApp Click`
- Type: `Custom Event`
- Event name: `whatsapp_click`
- Save

**Trigger 6: Popup Shown**
- Name: `CE - Popup Shown`
- Type: `Custom Event`
- Event name: `popup_shown`
- Save

**Trigger 7: Popup Submit**
- Name: `CE - Popup Submit`
- Type: `Custom Event`
- Event name: `popup_submit`
- Save

### Bước 1.4: Tạo Tags

#### TAG 1: GA4 Configuration (nếu chưa có)
- Name: `GA4 - Config`
- Type: `Google Analytics: GA4 Configuration`
- Measurement ID: `G-2R0EJ2LBJ5`
- Trigger: `All Pages`
- Save

#### TAG 2: GA4 - Form Submit Event
- Name: `GA4 - Form Submit`
- Type: `Google Analytics: GA4 Event`
- Configuration Tag: chọn `GA4 - Config`
- Event Name: `generate_lead`
- Event Parameters:
  - `form_id` = `{{DLV - form_id}}`
- Trigger: `CE - Form Success`
- Save

#### TAG 3: GA4 - CTA Click Event
- Name: `GA4 - CTA Click`
- Type: `Google Analytics: GA4 Event`
- Configuration Tag: chọn `GA4 - Config`
- Event Name: `cta_click`
- Event Parameters:
  - `cta_text` = `{{DLV - cta_text}}`
- Trigger: `CE - CTA Click`
- Save

#### TAG 4: GA4 - WhatsApp Click Event
- Name: `GA4 - WhatsApp Click`
- Type: `Google Analytics: GA4 Event`
- Configuration Tag: chọn `GA4 - Config`
- Event Name: `whatsapp_click`
- Trigger: `CE - WhatsApp Click`
- Save

#### TAG 5: Google Ads Conversion - Form Success
- Name: `Ads - Form Conversion`
- Type: `Google Ads Conversion Tracking`
- Conversion ID: `17709107883`
- Conversion Label: `Wq0ECKXBmfsbEKuVrvxB`
- Conversion Value: `2099` (hoặc để dynamic nếu có nhiều tour)
- Currency Code: `AUD`
- Trigger: `CE - Form Success`
- Save

> **Lưu ý:** Tag này là backup — code on-page đã fire conversion trực tiếp qua gtag. Có cả 2 sẽ đảm bảo không miss conversion nào. Nếu thấy duplicate, có thể disable tag này.

#### TAG 6: Google Ads Remarketing
- Name: `Ads - Remarketing`
- Type: `Google Ads Remarketing`
- Conversion ID: `17709107883`
- Trigger: `All Pages`
- Save

#### TAG 7: Facebook Pixel - PageView (nếu muốn quản lý qua GTM)
> **Lưu ý:** FB Pixel đã cài trực tiếp trong HTML nên tag này OPTIONAL. Chỉ cần nếu muốn tập trung quản lý tất cả qua GTM.

- Name: `FB - PageView`
- Type: `Custom HTML`
- HTML:
```html
<script>
  fbq('track', 'PageView');
</script>
```
- Trigger: `All Pages`
- Advanced: check "Once per page"
- Save

#### TAG 8: Facebook Pixel - Lead (backup)
- Name: `FB - Lead`
- Type: `Custom HTML`
- HTML:
```html
<script>
  fbq('track', 'Lead');
</script>
```
- Trigger: `CE - Form Success`
- Save

### Bước 1.5: Preview & Publish

1. Click nút **Preview** (góc trên phải)
2. Nhập URL: `https://escape.myvivatour.com`
3. Click **Connect** — GTM Debug panel sẽ mở
4. Test các action:
   - Load trang → kiểm tra GA4 Config, Ads Remarketing fire
   - Submit form → kiểm tra Form Success trigger + GA4 Lead + Ads Conversion fire
   - Click CTA button → kiểm tra CTA Click event
   - Click WhatsApp → kiểm tra WhatsApp Click event
5. Nếu tất cả OK → quay lại GTM, click **Submit** > **Publish**

---

## PHẦN 2: GOOGLE ADS (ads.google.com)

### Bước 2.1: Verify Conversion Action

1. Mở `https://ads.google.com`
2. Đăng nhập vào account Customer ID: `572-470-7852`
3. Menu trái: **Goals** > **Conversions** > **Summary**
4. Tìm conversion action có Label `Wq0ECKXBmfsbEKuVrvxB`
   - Nếu đã có: kiểm tra status = **Recording conversions** hoặc **No recent conversions** (chưa có data)
   - Nếu chưa có: tạo mới (xem bước 2.2)

### Bước 2.2: Tạo Conversion Action (nếu chưa có)

1. Click **+ New conversion action**
2. Chọn **Website**
3. Nhập domain: `escape.myvivatour.com` > Scan
4. Chọn **Add a conversion action manually**
5. Điền:
   - Category: `Submit lead form`
   - Conversion name: `Booking Form Submit - Escape Tour`
   - Value: `Use the same value for each conversion` → `2099` AUD
   - Count: `One` (mỗi user chỉ đếm 1 lần)
   - Click-through conversion window: `30 days`
   - View-through conversion window: `1 day`
   - Attribution model: `Data-driven` (hoặc `Last click`)
6. Save → Copy Conversion ID và Label
7. **QUAN TRỌNG:** So sánh Conversion ID và Label mới tạo với code đã cài:
   - Code hiện tại: `AW-17709107883/Wq0ECKXBmfsbEKuVrvxB`
   - Nếu khác → cần cập nhật code HTML

### Bước 2.3: Link Google Ads với GA4

1. Trong Google Ads: **Tools & Settings** > **Linked accounts**
2. Tìm **Google Analytics (GA4)** > click **Details**
3. Tìm property `G-2R0EJ2LBJ5` > click **Link**
4. Confirm

---

## PHẦN 3: GOOGLE ANALYTICS 4 (analytics.google.com)

### Bước 3.1: Verify Data Stream

1. Mở `https://analytics.google.com`
2. Vào property có Measurement ID `G-2R0EJ2LBJ5`
3. **Admin** (gear icon) > **Data Streams**
4. Click vào web stream (ID: 14312720580)
5. Confirm:
   - Stream URL = `escape.myvivatour.com`
   - Enhanced measurement = ON
   - Measurement ID = `G-2R0EJ2LBJ5`

### Bước 3.2: Mark Conversions

1. Vào **Admin** > **Events** (dưới Data display)
2. Chờ events xuất hiện (có thể mất 24-48h sau khi có traffic):
   - `generate_lead` — đánh dấu ★ Mark as conversion
   - `form_submit` — optional
   - `cta_click` — optional
   - `whatsapp_click` — optional
3. Hoặc tạo conversion thủ công: **Admin** > **Conversions** > **New conversion event**
   - Event name: `generate_lead`
   - Save

### Bước 3.3: Link GA4 với Google Ads

1. **Admin** > **Google Ads Links** (dưới Product links)
2. Click **Link**
3. Chọn Google Ads account `572-470-7852`
4. Enable: Auto-tagging, Personalized advertising
5. Link

### Bước 3.4: Enable Google Signals

1. **Admin** > **Data Settings** > **Data Collection**
2. Turn ON **Google signals data collection**
3. Acknowledge the policy

---

## PHẦN 4: FACEBOOK (business.facebook.com)

### Bước 4.1: Verify Pixel

1. Mở `https://business.facebook.com`
2. Business ID: `527344946945892`
3. Menu: **Events Manager**
4. Chọn Pixel ID: `531880273071891`
5. Kiểm tra tab **Overview**:
   - Nếu thấy `PageView` events → Pixel đang hoạt động ✅
   - Nếu không thấy → cần debug (xem bước 4.3)

### Bước 4.2: Setup Conversions

1. Trong Events Manager, click **Custom Conversions** (menu trái)
2. Click **Create Custom Conversion**
3. Điền:
   - Name: `Booking Form Submit`
   - Data source: Pixel `531880273071891`
   - Rule: Event = `Lead`
   - Category: `Lead`
   - Value: `2099` AUD
4. Create

### Bước 4.3: Test Events (nếu cần debug)

1. Trong Events Manager, click tab **Test Events**
2. Nhập URL: `https://escape.myvivatour.com`
3. Click **Open Website** — trang sẽ mở trong tab mới
4. Thực hiện actions trên trang:
   - Load trang → phải thấy `PageView` event
   - Submit form → phải thấy `Lead` event
5. Quay lại Events Manager kiểm tra events hiện trong Test Events tab

### Bước 4.4: Verify Domain (cho Aggregated Event Measurement)

1. Vào **Business Settings** > **Brand Safety** > **Domains**
2. Click **Add** > nhập `escape.myvivatour.com`
3. Chọn phương thức verify:
   - **DNS TXT record** (recommended) — thêm record vào Cloudflare DNS
   - Hoặc **HTML meta tag** — thêm vào `<head>` của landing page
4. Verify domain
5. Sau khi verify: vào **Events Manager** > **Aggregated Event Measurement** > **Configure Web Events**
6. Thêm domain `escape.myvivatour.com`
7. Prioritize events (thứ tự ưu tiên cao → thấp):
   1. `Lead` (form submit)
   2. `PageView`

---

## PHẦN 5: TESTING & VERIFICATION CHECKLIST

### Test 1: GTM Preview Mode
- [ ] Mở GTM Preview với URL `https://escape.myvivatour.com`
- [ ] Page load: GA4 Config tag fires
- [ ] Page load: Ads Remarketing tag fires
- [ ] Form submit success: GA4 Form Submit tag fires
- [ ] Form submit success: Ads Conversion tag fires
- [ ] CTA click: GA4 CTA Click tag fires
- [ ] WhatsApp click: GA4 WhatsApp Click tag fires

### Test 2: Google Tag Assistant (Chrome Extension)
- [ ] Cài extension `Google Tag Assistant Legacy`
- [ ] Vào `escape.myvivatour.com`
- [ ] Verify: GTM, GA4, Google Ads tags detected
- [ ] Không có errors (only green/blue badges)

### Test 3: Facebook Pixel Helper (Chrome Extension)
- [ ] Cài extension `Meta Pixel Helper`
- [ ] Vào `escape.myvivatour.com`
- [ ] Verify: PageView event fires on load
- [ ] Submit form → verify Lead event fires
- [ ] Không có errors

### Test 4: GA4 Realtime Report
- [ ] Mở GA4 > Reports > Realtime
- [ ] Vào `escape.myvivatour.com` từ tab khác
- [ ] Verify: thấy active user
- [ ] Submit form → verify `generate_lead` event xuất hiện trong realtime

### Test 5: Google Ads Conversion Tag Diagnostics
- [ ] Google Ads > Goals > Conversions > Summary
- [ ] Click vào conversion action
- [ ] Tab **Diagnostics** → kiểm tra tag status
- [ ] Status phải là: "Recording conversions" hoặc "Tag found, no conversions yet"

---

## Tóm tắt theo thứ tự ưu tiên

| # | Việc | Nền tảng | Mức độ |
|---|------|----------|--------|
| 1 | Tạo GTM Variables, Triggers, Tags | tagmanager.google.com | ⚠️ Quan trọng nhất |
| 2 | Verify/Tạo Conversion Action | ads.google.com | ⚠️ Quan trọng |
| 3 | Mark conversions + Link Ads | analytics.google.com | ⚠️ Quan trọng |
| 4 | Verify Pixel + Custom Conversions | business.facebook.com | ⚠️ Quan trọng |
| 5 | GTM Preview test | tagmanager.google.com | 🧪 Test |
| 6 | Chrome extensions test | escape.myvivatour.com | 🧪 Test |
| 7 | Verify domain (iOS 14+) | business.facebook.com | 📋 Nên làm |

---

## IDs tham chiếu nhanh

```
GTM Container:          GTM-KRFGX69D
GTM account / container: 6256769444 / 261027424
GA4 Measurement ID:     G-2R0EJ2LBJ5  (via GTM tags only)
GA4 Stream ID:          14312720580
Google Ads Account:     572-470-7852
Google Ads Conversion:  AW-17709107883  (on-page gtag/js loader)
Google Ads Label:       Wq0ECKXBmfsbEKuVrvxB
Facebook Pixel:         531880273071891
Facebook Business ID:   527344946945892
Web3Forms Key:          cf0ca620-d064-4640-9454-afb27d588f67
```
