# GTM buildout → NT1 · 260813-1131 · 6 tag `tour_*`/`popup_shown` lên production + vá `tour_id` lệch

**Phiên:** Claude for Chrome · **Handoff:** `/Users/minhhome/plans/handoffs/260813-1120-mvt-gtm-tags-and-human-gates-handoff.md` Prompt 1
**Kết quả:** Prompt 1 đóng · phát sinh 1 bug data-quality, đã ship trong cùng phiên.

---

## 1. Đã làm

### GTM `GTM-KRFGX69D` — publish **Phiên bản 3**
"v2 - tour_* (5 events) + popup_shown" · 12:45 13/08/2026 · **12 thẻ · 11 trigger · 10 biến**.

Dựng mới 6 Custom Event trigger + 6 GA4 Event tag (Measurement ID `G-2R0EJ2LBJ5` gõ thẳng, khớp 6 tag nền có sẵn):

| Tag | Trigger | Param |
|---|---|---|
| `tour_card_click` | `CE - tour_card_click` | `tour_id` = `{{DLV - tour_id}}` |
| `tour_cta_click` | `CE - tour_cta_click` | `tour_id` |
| `tour_itinerary_open` | `CE - tour_itinerary_open` | `tour_id` |
| `tour_source_click` | `CE - tour_source_click` | `tour_id` |
| `tour_helper_card_click` | `CE - tour_helper_card_click` | `tour_id` |
| `popup_shown` | `CE - popup_shown` | `popup_id` + `form_id` (optional — dental không gửi `form_id`) |

5 DLV đã có sẵn, không tạo lại.

### GA4 property `a334536706p499301826`
- `popup_id` → custom dimension scope Event (tổng **5**: `form_id`, `cta_text`, `percent_scrolled`, `tour_id`, `popup_id`).
- `generate_lead` → **Sự kiện chính**. Sau mốc ~24h, GA4 đã liệt kê event ở tab "Sự kiện gần đây" ⇒ bật bằng ngôi sao, không phải mò `admin/keyevents/*` (đường đó vẫn redirect Home).

---

## 2. Nghiệm thu

Oracle: parse payload `/g/collect` (`performance.getEntriesByType('resource')` + `read_network_requests`), **không** đọc UI Tag Assistant.

Trong Preview, mỗi hành động **đúng 1 hit**:

| Event | Payload |
|---|---|
| `tour_card_click` | `en=tour_card_click&ep.tour_id=VHM10` |
| `tour_cta_click` | `ep.tour_id=VHM10` |
| `tour_itinerary_open` | `ep.tour_id=tour-honeymoon-itinerary` ← **bug, xem §3** |
| `tour_source_click` | `ep.tour_id=VHM10` |
| `tour_helper_card_click` | `ep.tour_id=VHM10` |
| `popup_shown` happytours | `ep.popup_id=exit_popup&ep.form_id=exitForm` |
| `popup_shown` escape | `ep.popup_id=exit_popup&ep.form_id=exitForm` |

Ngoài Preview (tab thường): `tour_card_click` `ep.tour_id=VHM10` · sau khi ship fix, `tour_itinerary_open` `ep.tour_id=VHM10`.

`dataLayer` đếm đúng 1 lần/event, không nhân đôi. **0 form submit thật.**

---

## 3. Bug phát sinh — `tour_id` vỡ đôi (đã ship)

`happytours/index.html:5487` push `tour_id: contentId` = **id phần tử DOM**, trong khi 4 event tour kia push mã tour. GA4 sẽ có 2 hệ giá trị trong cùng một chiều ⇒ không gộp báo cáo được. Chỉ lộ ra khi nhìn **giá trị** param, không lộ khi chỉ đếm event.

Sửa: tách `tourCodeFor(tourKey)` đọc `data-tour-code` của radio làm nguồn duy nhất; `toggleTourItinerary()` nhận thêm `tourKey`; `trackTourCardClick()` dùng lại helper (bỏ lookup trùng). 3 call site `onclick` truyền thêm key.

escape + dental **không có** pattern này (grep `tour_itinerary_open|toggleTourItinerary` = rỗng).

Verify: build 2 lần chỉ lệch dòng `Generated:` · validator PASS 6 page 0 lỗi 58/58 URL Supabase · 2 suite lead pass · `worker.js` còn **0** lần `tour_id: contentId`, 3 call site đủ 3 tham số · PR #7 → `97866b6` · CI 2/2 xanh · deploy success · production `ep.tour_id=VHM10`.

---

## 4. Đính chính handoff

**Gotcha C sai một nửa.** Tab Tag Assistant do nút **Xem trước** của GTM mở **nằm trong** nhóm tab agent điều khiển được (chỉ cửa sổ site do chính Tag Assistant bung ra là ngoài tầm). Đường đi chạy được:

1. Đóng panel chi tiết tag rồi mới bấm **Xem trước** — panel mở sẽ che nút.
2. Đọc `gtm_auth` / `gtm_preview` ngay trên URL tab Tag Assistant.
3. Nhập URL LP → **Kết nối**.
4. Mở LP ở tab riêng với `?gtm_debug=1`.
5. Badge nổi báo *"Tag Assistant Not Connected"* → bấm **Open Tag Assistant** → **Connected**.

`?gtm_auth=…&gtm_preview=…` một mình **không đủ**: snippet GTM của trang không đọc param đó, `gtm.js` vẫn nạp bản published.

---

## 5. Bài học

1. **Nhìn giá trị param, đừng chỉ đếm event.** 6/6 tag nổ đúng 1 lần vẫn giấu được một chiều dữ liệu hỏng.
2. **`ref` click của extension "thành công" mà không chạm gì.** Phần tử ẩn (panel chưa `is-visible`) hoặc toạ độ trôi sau reveal animation → tool trả OK, `dataLayer` rỗng. Oracle là **trạng thái sau click** (`aria-expanded`, `radio.checked`, `dataLayer`), không phải exit code. Vòng chắc: screenshot → toạ độ thật → click pixel.
3. **Tab mở trước deploy giữ HTML cũ.** Verify ngay sau deploy không cache-bust ⇒ thấy hành vi cũ, dễ kết luận nhầm "fix không ăn" trong khi `curl` cùng lúc trả bản mới.
4. **Custom dimension đăng ký ngay; Key event phải chờ.** Qua ~24h thì `generate_lead` tự xuất hiện trong danh sách — khớp dự đoán của handoff trước.

---

## 6. Còn lại

- **Prompt 2** đối chiếu số GA4 Realtime / Google Ads / Meta — giờ ưu tiên cao nhất, đã có dữ liệu từ 12:45 13/08.
- **Prompt 3** cấp `Zone → Workers Routes → Edit` cho token CI.
- **Prompt 5** PNG logo full-color dọc sạch.
- Backlog cũ chưa đụng: back-to-top happytours mobile · gap desktop >768px · CRM mvt-saas · hostname `googlead`/`googlelead`.

## Câu hỏi mở

1. `tour_itinerary_open` giờ gửi thêm `tour_interest` (key `honeymoon`/`family`/`luxury`) cho đồng bộ với 4 event kia — có muốn đăng ký `tour_interest` làm custom dimension thứ 6 không, hay `tour_id` là đủ?
2. Property GA4 vẫn dùng chung với website chính (4 key event của bên đó + `generate_lead` mới của LP nằm cùng danh sách). Tách property riêng hay lọc bằng `page_host`? — câu hỏi cũ, Prompt 2 sẽ hỏi lại.
