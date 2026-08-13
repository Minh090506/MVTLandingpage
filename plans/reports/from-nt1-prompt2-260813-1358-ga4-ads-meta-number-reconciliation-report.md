# Prompt 2 — Đối chiếu số trong giao diện: GA4 · Google Ads · Meta

**Phiên:** NT1 260813-1358 · **HEAD** `97866b6` · Tài khoản Google `myvivatourvn@gmail.com` (authuser=2)
**Cách đo:** đọc thẳng giao diện + đối chiếu bằng payload `/g/collect` thật trên production. **0 form submit.**

## TL;DR

| Đích | Kết luận | Bằng chứng |
|---|---|---|
| GA4 Realtime | ✅ CÓ | `cta_click` · `scroll_depth` · `tour_card_click` · `popup_shown` — thấy trong cửa sổ 30 phút, có cả traffic khách thật |
| GA4 báo cáo 28 ngày | ✅ CÓ | `cta_click` 9 · `contact` 8 · `scroll_depth` 47 · `generate_lead` **1** · 5 event `tour_*` mỗi cái **1** |
| GA4 Key event | ✅ CÓ | `generate_lead` nằm ở tab "Sự kiện chính" (cùng 4 key event của website chính) |
| Google Ads | ❌ **KHÔNG** | `MVT Landing Form Submit` = **0,00** chuyển đổi, trạng thái *Lượt chuyển đổi đang chờ*, "không được ghi lại trong 7 ngày qua" |
| Meta | ⚠️ **KHÔNG XÁC MINH ĐƯỢC** | Pixel `579298288600609` **không tồn tại trong bất kỳ business portfolio nào Minh truy cập được** (search "No results") |

---

## 1. GA4 (property `Myvivatour.vn-t8`, `a334536706p499301826`)

**Realtime (30 phút):** 5 người dùng, 10 tên event. Có `scroll_depth` 4, `cta_click` 1, `tour_card_click` 1 — phát sinh từ **khách thật**, không phải phiên QA (phiên verify Prompt 1 lúc 12:45 đã ngoài cửa sổ 30 phút).

**Báo cáo Sự kiện, 16/7–12/8 (28 ngày, tổng 23.388 event / 2.752 người dùng):**

| Event | Số lượng | Người dùng |
|---|---|---|
| scroll_depth | 47 | 9 |
| cta_click | 9 | 4 |
| contact | 8 | 3 |
| generate_lead | 1 | 1 |
| tour_card_click / tour_cta_click / tour_helper_card_click / tour_itinerary_open / tour_source_click | 1 mỗi cái | 1 |

Lưu ý múi giờ: 5 event `tour_*` chỉ mới dựng tag 13/8 12:45 ICT nhưng đã nằm trong phạm vi kết thúc 12/8 ⇒ **property GA4 chạy múi giờ lệch sau ICT**. Đọc số theo ngày phải nhớ điều này.

### Phát hiện + đã giải: `popup_shown` vắng mặt trong danh sách 18 tên event

Admin → Sự kiện gần đây (28 ngày) liệt kê **18 tên**, có đủ `tour_*` nhưng **không có `popup_shown`**. Nghi tag hỏng.
**Bác bỏ bằng bằng chứng tầng thấp:** kích hoạt exit-intent thật trên `happytours.myvivatour.com` (dispatch `mouseleave` clientY<0, viewport 1920, **không submit form**) →
- `dataLayer` nhận đúng 1 push `popup_shown` + `popup_id:exit_popup` + `form_id:exitForm`;
- `performance.getEntriesByType('resource')` cho request `analytics.google.com/g/collect` với **`en=popup_shown`, `ep.popup_id=exit_popup`, `ep.form_id=exitForm`, `tid=G-2R0EJ2LBJ5`**;
- GA4 **Realtime hiện `popup_shown` = 1** trong ~1 phút.

⇒ Tag đúng, dữ liệu tới đích. Chỉ là **GA4 chậm đăng ký TÊN event mới** vào danh sách 28 ngày. Hệ quả thực tế: `popup_shown` **chưa dùng được trong báo cáo/segment** cho tới khi tên xuất hiện. Không phải bug, nhưng đừng lấy danh sách tên event làm oracle cho "event có tới GA4 không".

---

## 2. Google Ads (MCC `572-470-7852` Myvivatour)

**Cấu trúc thật** (khác giả định trong handoff):
- `572-470-7852` là **tài khoản quản lý (MCC)**. Tài khoản chi tiền là con: **`806-163-1566` My Viva Tour**.
- Múi giờ tài khoản: **GMT+07:00** ⇒ lead QA 12/08 16:0x ICT nằm đúng trong phạm vi 30 ngày đang xem.
- 30 ngày (14/7–12/8): 41.425 hiển thị · chi **132.224.738 ₫** · **59,98 chuyển đổi**.
- **Chỉ 1 chiến dịch đang chạy: `AU_10May`** (Search, ngân sách 4,5 tr₫/ngày, *Bị giới hạn theo ngân sách*).

**Hành động chuyển đổi — toàn tài khoản chỉ có 2:**

| Tên | Nguồn | Tối ưu hoá | Chuyển đổi 30 ngày | Trạng thái |
|---|---|---|---|---|
| **MVT Landing Form Submit** (tạo 19/2/2026, cửa sổ 90 ngày, nguồn dữ liệu = thẻ Google "My Viva Tour") | Trang web (gtag) | **Chính** | **0,00** | *Lượt chuyển đổi đang chờ* — "không ghi lại trong 7 ngày qua" |
| Lượt gửi biểu mẫu khách hàng tiềm năng (**Sự kiện GA4 `form_submit`**) | **Trang web (Google Analytics GA4)** | **Chính** | 0,00 | *Đang chờ* |

59,98 chuyển đổi kia đến từ các hành động của **tài khoản con** do bên thứ ba dựng (`TechSol - Form_BookNow 23885`, `TechSol - Whatsapp 1831`, `Whatsapp`, `Form_Contact`, `Email`) — đo website chính, không phải LP. Tab *Chẩn đoán* và *Các trang web* của `MVT Landing Form Submit` đều rỗng.

**Vì sao 0 — không phải lỗi tag:** Google Ads chỉ ghi chuyển đổi **quy được về một cú nhấp quảng cáo (gclid)**. Lead QA 12/08 là truy cập trực tiếp, và chiến dịch duy nhất đang chạy không dẫn traffic vào LP ⇒ hit `pagead/conversion/17709107883` có rời trình duyệt (đã verify 12/08) nhưng **không có gì để quy**. Muốn thấy số trong Ads thì phải có quảng cáo trỏ vào escape/happytours/dental.

**⚠️ Trái quyết định đã chốt:** chốt 260812 là *"gtag trực tiếp là nguồn conversion DUY NHẤT, KHÔNG import GA4 sang Ads"*. Thực tế **đang có** một hành động import từ GA4 (`form_submit`) đặt **Chính**. Hiện chưa gây đếm đôi (cả hai đều 0, và `form_submit` là event của website chính, không phải `generate_lead` của LP), nhưng khi LP có traffic quảng cáo thì đây là mầm đếm sai. **Chưa đụng — đây là tài sản quảng cáo đang chi tiền, cần Minh quyết.**

---

## 3. Meta (pixel trong code: `579298288600609`)

Tài khoản Facebook của Minh thấy **2 business portfolio**:

| Portfolio | business_id | Dataset | Event 28 ngày |
|---|---|---|---|
| My Viva Tour | 418874417982219 | `Dữ liệu của MyVivaTour_Minhnd` 3938692929709254 · `CRM_MVT_1505` 1874748743068161 | 0 · 0 |
| Myvivatour | 527344946945892 | **`Béo Nhỏn - myvivatour web Pixel` 531880273071891** · LeadInstandForm · Test1 | **10,9 N** · 0 · 0 |
| (tài khoản cá nhân) | act 4078957912658 | MyVivaTour Analytics · JaviBot · My Viva Tour · n8n-ads-analytics ×2 | 0 hết |

**Không portfolio nào chứa `579298288600609`.** Tìm theo ID trong ô "Search for a business asset" → **"No results"**. Truy thẳng URL dataset cũng bị đá về overview.

Đo tầng thấp trên `escape.myvivatour.com`: `fbq` là function, có nạp `connect.facebook.net/signals/config/579298288600609` và bắn `www.facebook.com/tr/?id=579298288600609&ev=PageView` ⇒ **code chạy đúng**. Nhưng **đối chứng ID bịa KHÔNG phân biệt được** (ID `999999999999999` cũng trả config ~8,6KB tương đương) ⇒ giống bài học GA4: với Meta, mã trả về của endpoint **không** chứng minh pixel tồn tại.

⇒ Không thể kết luận pixel sống hay chết từ trình duyệt. **Cần quyền vào pixel, hoặc chuyển LP sang pixel `531880273071891` mà website chính đang dùng.** Đây đúng dạng rủi ro đã từng đốt 4 tháng với `GTM-TPQWV864`.

---

## 4. Bằng chứng cho câu hỏi mở #1 (`AW-16765482840`)

Xác nhận vẫn đang xảy ra hôm nay: trên `happytours.myvivatour.com`, page_view sinh request `www.google.com/ccm/collect?...&tid=AW-16765482840&en=page_view` (kèm `ad.doubleclick.net/ccm/s/collect`). **Không có ID này trong source LP** ⇒ đến từ liên kết GA4↔Ads / Google signals, không phải code. Vẫn cần Minh xác nhận tài khoản đó của ai.

---

## 5. Câu hỏi chưa giải quyết (cần Minh)

1. **Hành động chuyển đổi import từ GA4 (`form_submit`) đang đặt Chính** — hạ xuống Phụ, gỡ hẳn, hay giữ? (trái chốt 260812; chạm tài khoản đang chi 132 tr₫/30 ngày)
2. **Không có chiến dịch nào trỏ vào 3 LP** ⇒ Ads sẽ mãi 0 conversion cho `MVT Landing Form Submit`. Có dựng campaign cho LP không, hay LP chỉ để chạy Meta/organic?
3. **Pixel `579298288600609` của ai?** Không nằm trong portfolio nào Minh thấy. Xin quyền, hay đổi LP sang `531880273071891`?
4. `AW-16765482840` là tài khoản nào — gỡ liên kết GA4↔Ads không?
5. **Property GA4 dùng chung với website chính** (`Myvivatour.vn-t8`, đã có 4 key event của bên kia; top trang 28 ngày toàn trang website chính) — tách property/stream riêng cho LP, hay giữ chung rồi lọc theo host?
6. Múi giờ property GA4 lệch sau ICT — có chỉnh về Asia/Ho_Chi_Minh không? (chỉnh sẽ tạo đứt gãy dữ liệu lịch sử)
