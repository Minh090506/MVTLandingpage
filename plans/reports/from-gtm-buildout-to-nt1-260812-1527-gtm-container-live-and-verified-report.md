# GTM container live + verified — Prompt 9 & 10

**Ngày:** 2026-08-12 · **Repo:** MVTLandingpage · **Container:** `GTM-KRFGX69D` (account `myvivatour`, workspace 2)
**Kết quả:** tracking Google **sống thật lần đầu**. Ads nhận conversion lần đầu kể từ 25/06.

---

## 1. Prompt 9 — merge PR #3

- Merge commit **`9b9bcf0`** (squash, Minh uỷ quyền agent bấm). `gh pr view 3` → `state=MERGED`.
- CI fail duy nhất trước merge đúng là lỗi thoáng qua: GitHub API **500** ở step *Comment preview URL on PR*
  (`GET /issues/3/comments` → `fetch failed`). Preview worker `mvt-preview-pr-3` đã deploy xong trước đó.
  Validator landing page **pass**.
- Deploy run trên `main`: `Build & Deploy MVT Landing Pages` + `Deploy VietnamDentalTravel` **success**.
- Curl 3 host → cả 3 trả `GTM-KRFGX69D` + `gtag/js?id=AW-17709107883`, **0 lần** `GTM-TPQWV864`.
- Đối chứng ID bịa (bài học chuỗi phiên): `gtm.js?id=GTM-KRFGX69D` → **200** · `GTM-ZZZZZZZZ` → **404** ·
  `gtag/js?id=AW-17709107883` → **200**.

## 2. Prompt 10 — dựng + publish container

**Đã dựng (16 thay đổi):**
- 5 Data Layer Variable: `form_id` · `cta_text` · `percent_scrolled` · `popup_id` · `tour_id`
- 1 Google tag → `G-2R0EJ2LBJ5`, trigger **Initialization – All Pages**
- 5 Custom Event trigger + 5 GA4 Event tag:

| Trigger | GA4 event | Param |
|---|---|---|
| `form_success` | `generate_lead` | `form_id` |
| `cta_click` | `cta_click` | `cta_text` |
| `whatsapp_click` | `contact` | `method` = `whatsapp` (hằng) |
| `scroll_depth` | `scroll_depth` | `percent_scrolled` |
| `popup_submit` | `popup_submit` | `popup_id`, `form_id` |

**Publish:** Phiên bản **2** — `v1 - GA4 base tracking (5 events)`, 16:08 12/08/2026,
6 thẻ · 5 trigger · 10 biến.

**GA4 admin:** đăng ký 4 custom dimension (scope Event): `form_id` · `cta_text` · `percent_scrolled` · `tour_id`.
Property `Myvivatour.vn-t8` = `a334536706p499301826`.

## 3. Bằng chứng verify

Verify **không dựa vào UI Tag Assistant** (xem §5) mà đọc thẳng request GA4 gửi đi trên production escape,
Preview mode, mỗi hành động đúng **một** hit:

| Hit → `G-2R0EJ2LBJ5` | Param |
|---|---|
| `page_view` | — |
| `cta_click` ×3 | `cta_text` = "Get My Free Vietnam Quote →" / "Get My Free Quote ↓" / "Book Now" |
| `scroll_depth` ×4 | `percent_scrolled` = 25 / 50 / 75 / 90 |
| `contact` ×1 | `method` = `whatsapp` |
| `generate_lead` ×1 | `form_id` = `bookingForm` |

Kèm theo (1 submit form thật, Minh duyệt):
- **Google Ads conversion bắn thật**: `googleadservices.com/pagead/conversion/17709107883`.
- `api.web3forms.com/submit` OK → email về `info@myvivatour.com`.
- Lead vào DB: 1 row `QA Preview 260812`, `utm_source=qa` · `utm_campaign=qa-260812` · `gclid=QA123` ·
  `ip_country=VN` (server gán). **Row giữ lại** cho Minh đối chiếu ở Prompt 4.

**Sau Publish**, container công khai `gtm.js?id=GTM-KRFGX69D` (357 KB, không auth preview) chứa đủ
`G-2R0EJ2LBJ5` và cả 5 tên event + 5 tên param. Load production **không** tham số preview →
`page_view` + `cta_click` đều gửi đi (2 request `/g/collect`).

## 4. Còn nợ

1. **`generate_lead` chưa đánh dấu Key event.** GA4 chỉ cho star event đã nằm trong danh sách sự kiện,
   mà event vừa bắn cần tới ~24h mới xuất hiện. Quay lại: Admin → Sự kiện → tab *Sự kiện chính* → star.
   Không có đường tạo key event theo tên trong UI hiện tại (đã thử `admin/keyevents/*` → redirect về Home).
2. **Lead payload thiếu `form_id`.** Cột `form_id` trong `marketing_leads` = `null`, `raw` cũng không có
   (18 key, không key nào là `form_id`). GA4 có vì page tự push `form_id:'bookingForm'` vào dataLayer,
   nhưng payload `/api/lead` không mang. Trái với `docs/mvt-tracking-spec.md` §4 ("chuẩn hoá `full_name`/`form_id`
   vào payload"). Không chặn gì — lead vẫn vào đủ, chỉ mất khả năng phân biệt form chính vs popup trong DB.
3. Chưa Preview `happytours` và `dental` (chỉ verify escape). Container dùng chung nên rủi ro thấp;
   để Prompt 3 quét nốt.
4. Tab Chrome còn mở (Tag Assistant ×2, GA4, escape) — extension treo lúc dọn, đóng tay.

## 5. Bẫy gặp phải — đáng ghi nhớ

1. **Cửa sổ site do Tag Assistant tự mở KHÔNG nằm trong nhóm tab agent điều khiển được** ⇒ agent không
   thao tác được. Cách đi: tự mở tab riêng với `?gtm_auth=<...>&gtm_preview=env-19&gtm_cookies_win=x&gtm_debug=1`
   (lấy `gtm_auth`/`gtm_preview` từ URL tab Tag Assistant), rồi bấm **Open Tag Assistant** trên badge nổi trong trang.
2. **Tag Assistant đòi "bật miền" trước khi stream event.** Banner *"Miền không xác định — bạn chưa bật miền
   myvivatour.com để gỡ lỗi"* → phải bấm **Bật**. Chưa bật thì tag nổ nhưng UI trắng trơn, rất dễ tưởng tag hỏng.
3. **Đừng tin UI Tag Assistant làm bằng chứng duy nhất.** Kênh debug đứt vài lần trong phiên. Bằng chứng
   chắc hơn: đọc `performance.getEntriesByType('resource')` lọc `/g/collect`, bóc `en` + `ep.*`/`epn.*` từ query.
   Đây là thứ GA4 **thực sự nhận**, không phải thứ UI nói.
4. **Ngoài Preview, GA4 gộp lô và gửi POST** ⇒ event thứ 2 trở đi không còn `en=` trên URL. Đếm số request
   `/g/collect` thay vì tìm `en` mới kết luận được. Trong Preview thì không gộp, nên mỗi event một GET.
5. **Form escape gọi `confirm()` sau khi submit thành công** (rủ mở WhatsApp). Dialog này **đóng băng toàn bộ
   automation**. Phải `window.confirm = () => false` trước khi bấm submit.
6. **`javascript_tool` bị chặn nếu output chứa URL đầy đủ có query string** (`[BLOCKED: Cookie/query string data]`).
   Phải bóc tách param thành object rồi mới trả về.
7. **GA4 combobox "Thông số sự kiện" nhận cả text tự do** — không cần chờ event xuất hiện mới đăng ký được
   custom dimension (đăng ký `tour_id` dù chưa từng bắn).
8. Panel GA4 "Tạo phương diện tuỳ chỉnh" đôi khi mở chậm → chuỗi thao tác batch gõ nhầm vào ô tìm kiếm toàn cục.
   Chèn `wait` ≥5s sau khi bấm nút tạo.

## Câu hỏi chưa giải quyết

1. `form_id` thiếu trong lead payload — sửa `worker-modules/lead-attribution-client.js` để merge `form_id`
   từ dataLayer/form element vào payload? (Cần `node build.js` lại + deploy.)
2. GA4 property có sẵn 4 key event của website chính (`close_convert_lead`, `form_submit`, `purchase`,
   `qualify_lead`) và đang nhận traffic `Myvivatour.com`. Landing page giờ dùng chung property — có cần
   tách stream/property riêng cho LP để báo cáo không lẫn không?
3. Thấy hit tới `AW-16765482840` (ngoài `AW-17709107883`) từ liên kết GA4 ↔ Ads. Tài khoản Ads thứ hai này
   là của ai, có cần gỡ liên kết không?
