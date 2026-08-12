# QA NT2 → NT1 — happytours + dental: xác minh event GA4 trên production

**Ngày:** 2026-08-12 · **Repo:** MVTLandingpage (`main`, HEAD `9b9bcf0`) · **Vai:** NT2-A (QA, read-only)
**Trang test:** `happytours.myvivatour.com` · `implant.vietnamdentaltravel.com`
**Query dùng:** `?utm_source=qa&utm_campaign=qa-260812b&gclid=QA123`
**Measurement ID kiểm chứng:** `G-2R0EJ2LBJ5` · **Container:** `GTM-KRFGX69D`

> **Không sửa file code nào.** Chỉ ghi report này.
> **Không submit form nào.** Ngoài kỷ luật thao tác, harness còn chặn cứng ở tầng network:
> `page.setRequestInterception` abort mọi request tới `api.web3forms.com`, `/api/lead`,
> `googleadservices.com/pagead/conversion`; cộng thêm capture-listener `preventDefault` cho
> `click`+`submit`, `window.confirm = () => false`, `window.open = () => null`.
> Kết quả `blockedRequests` = **rỗng** ở cả 4 lượt chạy ⇒ **không có** request lead nào bị phát sinh rồi chặn —
> tức trang chưa từng cố gửi lead. Không email, không conversion Ads.

---

## 1. Oracle — 2 lớp bằng chứng, assert theo DELTA

Đúng như yêu cầu, **đếm số request `/g/collect` không được dùng làm bằng chứng**. Mỗi hành động được chấm bằng 2 lớp độc lập:

**Lớp (a) — dataLayer.** Đọc `window.dataLayer` sau mỗi hành động, so **delta** với snapshot trước đó.
GTM vẫn append message vào chính mảng đó nên đọc mảng là nguồn tin cậy (không bị GTM ghi đè `push` như khi hook thủ công).

**Lớp (b) — CDP `Network.requestWillBeSent`.** Bắt cả `request.url` **lẫn `request.postData`** của mọi request khớp
`/g/collect`, rồi **parse event name (`en`) + param (`ep.*`/`epn.*`) từ payload**, kèm `tid` để chứng minh đúng property,
và `Network.responseReceived` để lấy HTTP status. Baseline chốt ngay sau `page_view`; mọi assert là delta.

**Phát hiện quan trọng về phương pháp (ảnh hưởng mọi lần QA sau):** ngoài Preview mode, GA4 **gộp lô và gửi POST**.
Trong log dưới đây, event thứ 2 trở đi **không có `en=` trên URL** — chỉ có trong POST body (`fromPostBody: true`),
và **hit thường trễ 1 nhịp** (event của bước N xuất hiện ở cửa sổ quan sát bước N+1). Ai chỉ đọc URL query
hoặc chỉ đếm request sẽ kết luận sai là "tag không nổ".

**Redact:** report chỉ giữ allowlist — tên event, param nghiệp vụ (`cta_text`/`percent_scrolled`/`method`/`tour_*`/`form_id`),
host, HTTP status, số lần, cờ `tid` khớp/không. Không có query string thô, không `cid`/`sid`/`_p`/`gclid`/referrer ở đây.

---

## 2. Ma trận PASS/FAIL — case × trang × viewport

Ký hiệu: **DL** = lớp dataLayer · **GA4** = lớp network `/g/collect` (đã parse payload).

### happytours.myvivatour.com

| Case | Desktop 1440×900 | Mobile 390×844 |
|---|---|---|
| `page_view` (baseline) | **PASS** — 1 hit, `tid` khớp, status 204 | **PASS** — 1 hit, `tid` khớp, 204 |
| `cta_click` (có `cta_text`) | **PASS** — DL ×1 `cta_text="Get Quote"`; GA4 `cta_click` ×1, param khớp | **PASS** — DL ×1 `cta_text="Choose My Vietnam Holiday →"`; GA4 `cta_click` ×1, param khớp |
| `whatsapp_click` → GA4 `contact` | **PASS** — DL ×1; GA4 `contact` ×1 `method=whatsapp` | **PASS** — DL ×1; GA4 `contact` ×1 `method=whatsapp` |
| `scroll_depth` 25/50/75/90 | **PASS** — DL ×4 đủ 4 mốc, mỗi mốc 1 lần; GA4 ×4 `percent_scrolled` 25/50/75/90 | **PASS** — DL ×4; GA4 ×4 |
| Popup hiển thị | **PASS ở DL / FAIL ở GA4** — popup hiện thật (`exitOverlay` visible), DL `popup_shown` ×1; **GA4 0 hit** | **N/A** — popup gate `innerWidth < 769`, đúng thiết kế desktop-only |
| `tour_card_click` | **PASS ở DL / FAIL ở GA4** — DL ×1; GA4 0 | **PASS ở DL / FAIL ở GA4** |
| `tour_cta_click` | **PASS ở DL / FAIL ở GA4** — DL ×1; GA4 0 | **PASS ở DL / FAIL ở GA4** |
| `tour_itinerary_open` | **PASS ở DL / FAIL ở GA4** — DL ×1 `tour_id="tour-honeymoon-itinerary"`; GA4 0 | **PASS ở DL / FAIL ở GA4** |
| `tour_source_click` | **PASS ở DL / FAIL ở GA4** — DL ×1; GA4 0 | **PASS ở DL / FAIL ở GA4** |
| `tour_helper_card_click` | **PASS ở DL / FAIL ở GA4** — DL ×1; GA4 0 | **PASS ở DL / FAIL ở GA4** |

### implant.vietnamdentaltravel.com

| Case | Desktop 1440×900 | Mobile 390×844 |
|---|---|---|
| `page_view` (baseline) | **PASS** — 1 hit, `tid` khớp, 204 | **PASS** |
| `cta_click` (có `cta_text`) | **PASS** — DL ×1 `cta_text="Free Consultation"`, `cta_id=""`; GA4 `cta_click` ×1 | **PASS** — DL ×1 `cta_text="Get Your Exact Quote — It's Free"`; GA4 `cta_click` ×1 |
| `whatsapp_click` → GA4 `contact` | **PASS** — DL ×1 (có cả `cta_text="WhatsApp 24/7"`); GA4 `contact` ×1 `method=whatsapp` | **PASS** — DL ×1; GA4 `contact` ×1 |
| `scroll_depth` 25/50/75/90 | **PASS** — DL ×4; GA4 ×4 | **PASS** — DL ×4; GA4 ×4 |
| Popup hiển thị | **FAIL** — popup **hiện thật** sau >45s dwell + mouseleave, nhưng **DL 0 event** và **GA4 0 hit** | **N/A** — gate `innerWidth > 768`, đúng thiết kế |

Mọi hit GA4 ghi nhận đều `tid` = `G-2R0EJ2LBJ5`, HTTP **204**, host `analytics.google.com`.
`consoleErrors` = `[]` ở cả 4 lượt.

### Attribution (đối chiếu theo constraint #4)
Cả 4 lượt: `window.mvtAttribution()` trả `utm_source=qa` · `utm_campaign=qa-260812b` · `gclid` có mặt và đúng giá trị QA.
Attribution client hoạt động đúng trên cả 2 subdomain.

### Layout (yêu cầu viewport)

| | happytours desktop | happytours mobile | dental desktop | dental mobile |
|---|---|---|---|---|
| Horizontal scroll | **không** | **không** | **không** | **không** |
| Floating control overlap | **không** (back-to-top 754–804, WhatsApp 812–868) | **không** | **không** (back-to-top 750–800, WhatsApp 810–870) | **không** (back-to-top 640–684, WhatsApp 704–764, sticky CTA 770–844 — gap ≥ 20px cả hai khe) |

---

## 3. Bug / lệch spec ghi nhận (KHÔNG sửa — theo constraint #2)

### B1 — dental: popup exit-intent hiện nhưng không bắn event nào (mất dữ liệu thật)
Popup `#exitPopup` hiển thị đúng (đã chứng minh bằng máy: sau >45s dwell + mouseleave `clientY<0`, computed style
`display != none`, height > 0), nhưng **không có `dataLayer.push` nào cho lúc popup hiện**.
Trong `pages/dental-implants-vietnam/index.html` chỉ có `popup_submit` (dòng 2717), **không có `popup_shown`**.
⇒ Không đo được tỉ lệ popup hiện → submit trên trang dental. **Mức: trung bình.** Spec §2.2 liệt `popup_shown` cho escape+happytours,
nên đây có thể là chủ ý — nhưng hệ quả đo lường thì vẫn là lỗ hổng, cần NT1 quyết.

### B2 — nhóm `tour_*` và `popup_shown` chưa có tag GTM ⇒ không hề tới GA4
Đã xác nhận bằng network: cả 5 event `tour_*` và `popup_shown` bắn **đúng** vào dataLayer nhưng **0 hit `/g/collect`**.
Container hiện chỉ có 5 tag (`form_success`/`cta_click`/`whatsapp_click`/`scroll_depth`/`popup_submit`).
**Ghi nhận, không tự dựng tag** theo yêu cầu assignment.

### B3 — happytours: nhóm `tour_*` dùng `tour_interest`/`tour_code`, spec đòi `tour_id` (hiện trạng, NT2-B đang sửa)
Đo được trên production đúng như assignment mô tả:
- `tour_card_click` → `tour_interest` (index.html:5480)
- `tour_cta_click` → `tour_interest` + `tour_code` + `tour_name` (index.html:5454)
- `tour_helper_card_click` → `tour_interest` + `tour_code` + `tour_name` (index.html:5444)
- `tour_source_click` → `tour_code` (index.html:3831/3936/4029)
- `tour_itinerary_open` → **`tour_id`** (index.html:5473) — cái duy nhất đã đúng spec
Spec `docs/mvt-tracking-spec.md:67-71` đòi `tour_id` cho cả 5. **Chỉ ghi nhận hiện trạng, không sửa.**

### B4 — happytours: click tour card bắn kèm `cta_click` với `cta_text` ~300 ký tự
Một cú click vào tour card sinh **2** event: `tour_card_click` (đúng) **và** `cta_click` với `cta_text` là **toàn bộ text của card**
(emoji + tên tour + mô tả + giá + "See itinerary →"). Đã xác nhận chuỗi này đi thật lên GA4 trong POST body.
GA4 giới hạn giá trị param **100 ký tự** ⇒ giá trị bị cắt cụt, làm rác báo cáo `cta_click` và loãng mọi so sánh CTA khác.
Nguyên nhân: listener `e.target.closest('.cta-button, [onclick*="smoothScroll"]')` (index.html:5371) khớp cả wrapper của card.
**Mức: trung bình** (không mất lead, nhưng hỏng chất lượng dữ liệu `cta_click`).

### B5 — happytours: `whatsapp_click` thiếu `cta_text`
Page tự bắn `{ event: 'whatsapp_click', link_url }` (index.html:5378), spec §2.1 đòi `link_url` **+ `cta_text`**.
Dental (đi qua shared `worker-modules/tracking-client.js`) có đủ cả hai. **Mức: thấp** — tag GTM `contact` đặt
`method=whatsapp` bằng hằng số nên GA4 vẫn nhận đúng; chỉ lệch hợp đồng dataLayer.

### B6 — happytours: `popup_shown`/`popup_submit` dùng `popup_type`, spec + tag GTM đòi `popup_id`
Đo được `popup_shown` với `popup_type: "exit_intent"` (index.html:5592). `popup_submit` cũng vậy (index.html:5624) —
**không có `popup_id`, không có `form_id`**. Tag GTM `popup_submit` map param từ biến `popup_id` + `form_id`
⇒ nếu khách submit popup trên happytours, GA4 nhận `popup_submit` với **param rỗng**.
Dental làm đúng: `popup_id: 'exit_popup', form_id: 'exitPopup'` (index.html:2717).
**Chưa test được đường submit** (bị cấm submit form) — đây là suy luận từ code + hợp đồng tag, cần NT1 xác nhận.
**Mức: trung bình** — chạm đường conversion.

### B7 — happytours mobile: không có back-to-top và cũng không có sticky CTA bar
Trên mobile, control cố định duy nhất là WhatsApp float (+ navbar). CSS ẩn `.back-to-top { display: none !important }`
với comment *"sticky bottom bar already provides clear next-step on mobile"* (index.html:2339-2341),
**nhưng trong DOM happytours không tồn tại phần tử sticky/mobile-cta nào** — grep `mobile-cta|sticky-cta|stickyCta` trả 0 kết quả.
Dental thì có đủ 3 (`.mobile-cta.visible` 390×74 ở đáy). ⇒ happytours mobile mất cả hai lối "quay lại CTA".
Đối chiếu checklist `CLAUDE.md` ("Sticky mobile CTA bar", "Back-to-top") thì happytours mobile **không đạt**.
**Mức: trung bình (UX/conversion, không phải tracking).**

### B8 — quan sát: GA4 enhanced measurement `scroll` chồng lên `scroll_depth`
Ngoài 4 hit `scroll_depth` của ta, GA4 tự bắn thêm 1 event tên `scroll` ở mốc 90% (kèm `percent_scrolled` do dính
biến dataLayer đang có sẵn). Không phải lỗi, nhưng khi đọc báo cáo phải nhớ **hai** event khác tên cùng nói về scroll,
kẻo đếm đôi engagement. Xảy ra trên cả 2 trang, cả 2 viewport.

---

## 4. Những gì KHÔNG kiểm (và vì sao)

- **Mọi luồng submit form** (`form_success`, `form_error`, `popup_submit`, conversion Ads, Web3Forms, `/api/lead`):
  cấm tuyệt đối theo constraint #1. Suất submit thật đã dùng cho escape phiên trước.
  ⇒ B6 chỉ là suy luận code-level, **chưa có bằng chứng máy**.
- **Tag Assistant / Preview UI**: không dùng, theo constraint #3. Toàn bộ kết luận lấy ở tầng network + dataLayer.
- **escape**: đã QA phiên trước, không làm lại.

---

## 5. Tái lập

Harness đặt ở scratchpad phiên (không commit vào repo, theo constraint "chỉ ghi `plans/reports/`"):
`ga4-event-verify.js` (chính, 4 tổ hợp trang × viewport) + `mobile-cta-and-floating-recheck.js` +
`happytours-mobile-cta-button-probe.js` (đo lại `cta_click` mobile happytours cho đúng phần tử).
Chạy từ repo root; resolve puppeteer bằng `require.resolve('puppeteer', { paths: [process.cwd()] })`
để tránh lỗi module khi script nằm ngoài repo.

Bẫy đã gặp, ghi lại cho lần sau:
1. Chọn phần tử CTA trên happytours phải cho phép `<button type="submit">` **nằm ngoài `<form>`** — hero CTA và các CTA
   giữa trang đều thuộc dạng này (click vô hại vì không có form để submit). Lọc mù `type !== 'submit'` sẽ không tìm ra CTA nào trên mobile.
2. `.cta-button-nav` của happytours có kích thước **0×0** trên mobile (nav CTA ẩn) — click nó không sinh event.
3. Chạy 3 instance puppeteer song song từng làm `setUserAgent` ném lỗi trong `NetworkManager`; chạy lại tuần tự thì sạch.
4. Dental gate popup ở **>45 giây** dwell thật (`pageLoadTime` chốt lúc parse script) — phải chờ thật, không bịa được thời gian.

---

## Câu hỏi chưa có lời giải (cần NT1 / Minh quyết)

1. **B1** — dental có chủ ý không bắn `popup_shown` không, hay là thiếu sót? Nếu cần đo, ai thêm (NT2-B đang mở file happytours, không mở dental).
2. **B6** — `popup_submit` của happytours gửi param rỗng lên GA4 là chấp nhận được hay phải sửa sang `popup_id`+`form_id` như dental? Đây là đường conversion nên tôi không tự kết luận.
3. **B4** — sửa selector `cta_click` của happytours để loại tour card (chặt hơn), hay chấp nhận `cta_text` bị cắt cụt? Ảnh hưởng dữ liệu lịch sử `cta_click`.
4. **B7** — happytours mobile thiếu cả back-to-top lẫn sticky CTA bar: bổ sung sticky bar (đúng comment CSS) hay bỏ `display:none` của back-to-top? Việc UX, ngoài phạm vi QA.
5. Nhóm `tour_*` có được dựng tag GTM không, và dựng **sau** khi NT2-B chuẩn hoá sang `tour_id` chứ? Nếu dựng trước sẽ phải sửa biến 2 lần.

---

**Status:** DONE
**Summary:** 4/4 tổ hợp trang × viewport đã QA headless trên production; `cta_click` · `whatsapp_click→contact` · `scroll_depth` 25/50/75/90 PASS đủ 2 lớp bằng chứng trên cả hai trang; nhóm `tour_*` + `popup_shown` đúng ở dataLayer nhưng chưa tới GA4 vì thiếu tag GTM.
**Concerns:** 8 phát hiện ghi ở §3 (nặng nhất: dental popup không bắn event nào; happytours `cta_click` bị nhiễm text tour card ~300 ký tự; happytours `popup_submit` sẽ gửi param rỗng). Không sửa file code nào, không submit form nào.
