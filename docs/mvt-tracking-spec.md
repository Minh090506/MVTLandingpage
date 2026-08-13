# MVT Landing Page — Tracking Spec

Hợp đồng đo lường dùng chung cho mọi landing page MyVivaTour / VietnamDentalTravel.
Một tên event = một ý nghĩa, trên mọi trang. LP mới phải tuân theo file này.

---

## 1. Stack đo lường

```
Visitor (browser)
  │
  ├─► dataLayer ──► GTM (GTM-KRFGX69D) ──┬─► GA4        G-2R0EJ2LBJ5
  │                                       ├─► Google Ads AW-17709107883
  │                                       └─► Meta Pixel 579298288600609
  │
  ├─► gtag.js (id=AW-17709107883 only) ──► Google Ads conversion runtime
  │      (direct; form handlers call gtag('event','conversion',…))
  │
  └─► form submit (fetch wrap)
        ├─► POST api.web3forms.com  ──► info@myvivatour.com   (email — browser only)
        └─► POST /api/lead (fire-and-forget) ──► Supabase public.marketing_leads
                                                 (DB — best-effort; never blocks UX)
```

GA4/Ads/Meta trả lời **"bao nhiêu, từ kênh nào"**. Supabase trả lời **"ai, nói gì, chốt được không"**.
Email đi **từ trình duyệt** (Web3Forms free chặn server-side; Worker không có IP tĩnh).
`/api/lead` chỉ ghi DB (+ CRM optional). Hai đường độc lập — email fail/DB fail không kéo theo nhau về UX.

| ID | Giá trị | Ghi chú |
|---|---|---|
| GTM container | `GTM-KRFGX69D` | Account GTM **"myvivatour"** (container mới; thay ID mẫu `GTM-TPQWV864` không tồn tại) |
| GA4 measurement | `G-2R0EJ2LBJ5` | Gửi **qua GTM**, không qua gtag trực tiếp trên LP |
| Google Ads | `AW-17709107883` | gtag trực tiếp **chỉ phục vụ Ads**; loader phải `gtag/js?id=AW-…` vì ID GA4 không có bản gtag.js phục vụ |
| Ads conversion label | `Wq0ECKXBmfsbEKuVrvxB` | |
| Meta Pixel | `579298288600609` | |

**Loader rule:** LP load `gtag/js?id=AW-17709107883` + `gtag('config','AW-17709107883')` only. Do **not** load or `config` GA4 via direct gtag (404 + double-count risk). GA4 hits come from GTM tags in container `GTM-KRFGX69D`.

---

## 2. Event taxonomy

Mọi event đẩy vào `window.dataLayer` dưới dạng `{ event: '<tên>', ...params }`.

### 2.1 Bắt buộc trên mọi LP

| Event | Bắn khi | Params | Ai bắn |
|---|---|---|---|
| `form_success` | Lead gửi thành công | `form_id` | Page |
| `form_error` | Gửi thất bại | `form_id`, `error_type` (`http_<mã>` \| `network`) | Page |
| `cta_click` | Click nút/link CTA (không phải tour card — xem ghi chú) | `cta_text` (gộp whitespace, ≤100 ký tự), `cta_id` | Shared* |
| `whatsapp_click` | Click link WhatsApp | `link_url`, `cta_text` (happytours đã bắn; shared client cũng có) | Shared* |
| `phone_click` | Click `tel:` | `link_url` | Shared |
| `email_click` | Click `mailto:` | `link_url` | Shared |
| `scroll_depth` | Cuộn qua 25/50/75/90% | `percent_scrolled` | Shared |

\* `cta_click` và `whatsapp_click`: trang tự instrument (escape, happytours) thì đặt `window.MVT_PAGE_TRACKS_CLICKS = true` trong `<head>` để shared client không bắn trùng.

**happytours page rules (đã ship):**
- `cta_click` **không** bắn khi click tour-selector card (card đã có `tour_card_click` / `tour_cta_click`).
- `cta_text` gộp whitespace + cắt ≤100 ký tự (GA4 cắt param ở 100).
- `whatsapp_click` mang thêm `cta_text`.

### 2.2 Tuỳ trang

| Event | Bắn khi | Params | Đang có ở |
|---|---|---|---|
| `popup_shown` | Exit-intent popup hiện (1 lần / lượt tải) | cả 3 LP: `popup_id: 'exit_popup'`; escape + happytours kèm `form_id: 'exitForm'` + `popup_type: 'exit_intent'` (param song song); dental không có `form_id` trên `popup_shown` | escape, happytours, **dental** |
| `popup_submit` | Submit form trong popup | cả 3 LP: `popup_id: 'exit_popup'`; escape + happytours kèm `form_id: 'exitForm'` + `popup_type: 'exit_intent'` (param song song); dental kèm `form_id: 'exitPopup'` | escape, happytours, dental |
| `video_play` | Video hero/section chạy | `video_id` | escape, happytours |
| `tour_card_click` | Click card tour | `tour_id` (+ `tour_interest` song song) | happytours |
| `tour_cta_click` | Click CTA trong card tour | `tour_id` (+ `tour_interest` / `tour_code` / `tour_name` song song) | happytours |
| `tour_itinerary_open` | Mở accordion lịch trình | `tour_id` | happytours |
| `tour_source_click` | Click sang trang tour gốc | `tour_id` (+ `tour_code` song song) | happytours |
| `tour_helper_card_click` | Click card gợi ý | `tour_id` (+ `tour_interest` / `tour_code` / `tour_name` song song) | happytours |

> **Hợp nhất 260812:** dental dùng `popup_submit` (không còn `exit_popup_submit`). GTM chỉ cần **một** trigger `popup_submit` cho mọi LP. Nếu GTM còn trigger cũ `exit_popup_submit` → gỡ sau khi deploy.

> **tour_***: mọi event tour trên happytours **đã có `tour_id`** (mã máy: `VHM10` / `V7` / `VLU10` / …). Form booking vẫn gửi field cũ `tour_interest` / `tour_code` / `tour_name`; dataLayer push **song song** các key đó khi có — GA4 custom dimension chính là `tour_id`.

### 2.3 Quy ước đặt tên

`snake_case` · động từ ở thì hiện tại (`cta_click`, không `clicked_cta`) · danh từ trước hành động (`form_success`, không `success_form`) · không nhét giá trị vào tên event (`tour_card_click` + `tour_id`, không `tour_card_click_halong`).

---

## 3. Conversion

Cả 3 LP bắn cùng một conversion khi lead thành công:

```javascript
window.dataLayer.push({ event: 'form_success', form_id: '<id>' });
gtag('event', 'conversion', { send_to: 'AW-17709107883/Wq0ECKXBmfsbEKuVrvxB' });
if (typeof fbq === 'function') fbq('track', 'Lead');
```

Một lead = một conversion. Popup và form chính dùng **chung** label — phân biệt bằng `form_id`, không tạo label riêng (nếu không Ads sẽ đếm trùng khi khách submit cả hai).

> **Chốt 260812 (Minh) — nguồn conversion của Google Ads:** `gtag` trực tiếp (khối trên) là **Primary và là nguồn DUY NHẤT**. **KHÔNG import `generate_lead` từ GA4 sang Ads**, kể cả dạng phụ. Lý do: một lead chỉ được đi vào Ads qua đúng một đường, không có đường thứ hai để đếm đôi. GA4 vẫn giữ `generate_lead` làm Key event để xem báo cáo và attribution — chỉ là không đẩy sang Ads.

---

## 4. Attribution + dual-send

Xử lý bởi `worker-modules/lead-attribution-client.js`, inject tự động vào mọi trang bởi `build.js`.

**Tham số bắt**: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `gclid`, `fbclid`, `msclkid`.

**Mô hình**: first-touch có ghi đè theo click quảng cáo.
- Lưu ở `localStorage['mvt_attribution']`, hạn **90 ngày** (khớp cửa sổ Google Ads).
- Khách vào lại **trực tiếp/organic** → giữ nguyên nguồn cũ ⇒ lead vẫn được ghi công cho quảng cáo ban đầu.
- Khách vào lại bằng **click quảng cáo mới** → ghi đè, và `gclid` cũ bị xoá (không gán nhầm click cũ cho campaign mới).
- localStorage bị chặn (chế độ riêng tư) → degrade về attribution của riêng lượt xem này, trang vẫn chạy bình thường.

**Dual-send khi form POST Web3Forms** (fetch wrap):
1. Merge attribution UTM/click-IDs + chuẩn hoá alias `name` → `full_name`, `formId` → `form_id` **nếu body đã có**.
2. **POST Web3Forms** (request gốc, body đã merge) — response **trả về cho trang**.
3. **POST `/api/lead`** fire-and-forget cùng payload — lỗi/chậm/timeout **không** ảnh hưởng UX.

Truy cập trong page: `window.mvtAttribution()`.

### `form_id` — trang sở hữu, shared client **không** tự biết form nào

`worker-modules/lead-attribution-client.js` chỉ thấy body JSON của request Web3Forms. Nó **không** đọc DOM, **không** suy ra form đang submit, chỉ:
- merge attribution keys;
- rename `formId` → `form_id` nếu body dùng camelCase.

**`form_id` phải có sẵn trong body do page gửi.** Cơ chế đã ship (verify trên prod qua PR #4):

| Page | Cơ chế |
|---|---|
| escape `#bookingForm`, `#exitForm` | hidden `<input name="form_id" value="…">` |
| happytours `#bookingForm`, `#exitForm` | hidden `<input name="form_id" value="…">` |
| dental `#bookingForm` | hidden `<input name="form_id" value="bookingForm">` |
| dental exit popup | object literal tường minh `form_id: 'exitPopup'` (không FormData) |

Trước khi có hidden input / key tường minh, cột `marketing_leads.form_id` **luôn null** dù schema đã có cột. LP mới bắt buộc copy pattern trên — **đừng** kỳ vọng shared client tự điền.

---

## 5. Lead payload → `public.marketing_leads`

`/api/lead` nhận JSON. Cột riêng cho các trường dưới; **mọi thứ khách gửi được giữ nguyên trong `raw` (jsonb)** để không mất dữ liệu khi form đổi.

| Nhóm | Cột |
|---|---|
| Nguồn | `landing_page`, `page_host`, `page_path`, `form_id` (**từ body page** — xem §4) |
| Liên hệ | `full_name`, `email`, `phone` |
| Nhu cầu | `state`, `country`, `travel_date`, `party_size`, `tour_interest`, `message` |
| Attribution | `utm_source/medium/campaign/term/content`, `gclid`, `fbclid`, `msclkid`, `referrer`, `landing_first_seen` |
| Client | `user_agent`, `ip_country` (từ header `CF-IPCountry`) |
| Giao hàng | `email_forwarded` (không còn set bởi worker — xem dưới), `crm_synced_at`, `crm_ref`, `crm_error` |
| Gốc | `raw` |

**Server luôn thắng client** ở `page_host`, `user_agent`, `ip_country` — client không tự khai được. Khi build object row: field client trước, field server gán **sau**.

**Chống rác**: honeypot `botcheck`/`_gotcha` → trả 200 nhưng không ghi · chặn host lạ · bắt buộc có email hoặc phone · giới hạn độ dài mọi trường · **max ~32 KB body / max 40 keys** → 413.

**`email_forwarded`**: worker **không** ghi cột này nữa. Email do browser → Web3Forms. Nghĩa lịch sử = "worker đã forward email"; row mới để DB default (false/null). **Không** dùng cột này để QA email — kiểm inbox `info@myvivatour.com`.

**Status `/api/lead`**: 200 nếu ghi DB OK · 502 nếu DB fail. Client **không** dùng status này để quyết success form (chỉ Web3Forms).

---

## 6. Việc phải làm trong GTM (chưa tự động hoá được)

Chạy `scripts/gtm-setup-wizard.sh` — wizard 13 bước dẫn qua GTM UI thay vì tự mò: 5 Custom Event trigger + 5 GA4 tag (khớp bảng dưới), đăng ký 4 custom dimension, gỡ trigger cũ `exit_popup_submit`, Preview QA, Publish, verify incognito. Có resume state, không cần chạy lại từ đầu nếu gián đoạn giữa chừng. Script tự dẫn thao tác, không đọc thay ở đây.

### 6.1 Tối thiểu (wizard / baseline)

Mỗi event dưới đây cần **Custom Event trigger** trùng tên + **GA4 Event tag**:

1. Trigger `form_success` → GA4 event `generate_lead` (param: `form_id`) → đánh dấu **Key event** trong GA4.
2. Trigger `cta_click` → GA4 event `cta_click` (param: `cta_text`).
3. Trigger `whatsapp_click` → GA4 event `contact` (param: `method = whatsapp`).
4. Trigger `scroll_depth` → GA4 event `scroll_depth` (param: `percent_scrolled`).
5. Trigger `popup_submit` → GA4 event phù hợp (param: `popup_id` / `form_id`) — **một trigger cho mọi LP**.
6. **KHÔNG** import `generate_lead` từ GA4 sang Google Ads (chốt 260812 — xem §3). Ads chỉ nhận conversion trực tiếp qua `gtag`. Nếu trong Ads đã lỡ tạo import từ GA4 thì **gỡ hoặc để "Secondary" và không tính vào bidding** — hai nguồn cùng đếm một lead là đếm đôi.

Đăng ký `form_id`, `cta_text`, `percent_scrolled`, `tour_id` làm **custom dimension** trong GA4, nếu không param sẽ không hiện trong report.

### 6.2 Trạng thái thật — tag **chưa có** (đã chốt dựng sau)

LP đã push các event sau vào `dataLayer`, nhưng **container GTM hiện chưa có tag** cho chúng ⇒ **dừng ở dataLayer, không tới GA4**:

| Nhóm dataLayer | Ghi chú |
|---|---|
| `tour_card_click`, `tour_cta_click`, `tour_itinerary_open`, `tour_source_click`, `tour_helper_card_click` | happytours; params gồm `tour_id` (+ song song `tour_interest` / `tour_code` / `tour_name` khi có) |
| `popup_shown` | Đã bắn trên escape + happytours + dental. Cả 3 LP đều có `popup_id: 'exit_popup'`; escape + happytours kèm `form_id: 'exitForm'` + `popup_type: 'exit_intent'` (param song song); dental không có `form_id` trên `popup_shown` |

**Chưa làm:** tạo trigger + GA4 tag cho nhóm `tour_*` và `popup_shown`. Sẽ dựng **cùng đợt** star `generate_lead` làm Key event (việc người / GTM UI — không phải code LP).

---

## 7. QA sau mỗi lần đổi tracking

1. GTM **Preview mode** trên URL thật → thao tác đủ: click CTA, click WhatsApp, cuộn hết trang, submit form. Xác nhận từng event nổ đúng một lần.
2. GA4 **Realtime** → thấy `generate_lead`.
3. Google Ads → conversion "recorded" (trễ tối đa 3 giờ).
4. Meta Events Manager → **Test Events** thấy `Lead`.
5. Supabase → row mới:
   ```sql
   select created_at, landing_page, form_id, email, utm_campaign, gclid
   from public.marketing_leads order by created_at desc limit 5;
   ```
   (Không phụ thuộc `email_forwarded`.)
6. Test với `?utm_source=test&utm_campaign=qa&gclid=QA123` → xác nhận 3 trường đó có trong row **và** trong email Web3Forms.
7. Kiểm tra hộp thư `info@myvivatour.com` → email vẫn về (đường browser Web3Forms).
8. Network tab: submit form → thấy **cả** `api.web3forms.com` **và** `/api/lead`; response trang theo Web3Forms.

Test form **phải chạy từ trình duyệt thật** (Web3Forms chặn curl server-side ở gói free).

**Rate limit thật** (CF WAF / rate limiting rules trên `/api/lead`) là **việc người** — code chỉ giới hạn size/keys. Ngưỡng đã chốt (Minh, 260812): **10 request/phút/IP**, action Block (→ 429), áp cho cả 2 zone (myvivatour.com + vietnamdentaltravel.com). Chạy `scripts/cloudflare-rate-limit-wizard.sh` để dựng rule + test bằng curl (không dùng Python — Cloudflare tự chặn `Python-urllib` bằng 403 trước khi vào rule).

---

## 8. Thêm landing page mới cần gì

Nhận **tự động** (không phải làm gì): attribution capture, dual-send Web3Forms + `/api/lead`, `phone_click`, `email_click`, `scroll_depth`, và cả `cta_click` + `whatsapp_click` nếu trang không tự instrument.

Phải **tự làm**:
- [ ] 5 tracking ID trong `<head>` (CI sẽ chặn nếu thiếu)
- [ ] `form_success` + `form_error` trong handler submit (check `res.ok` + `data.success`, có `catch`, chặn double-submit)
- [ ] **`form_id` trong body lead** — hidden input trên form HTML, hoặc key tường minh trong object literal nếu không dùng FormData (shared client **không** tự điền — §4)
- [ ] Khối `gtag conversion` + `fbq('track','Lead')` ở §3
- [ ] Popup dùng event `popup_submit` (không tên riêng); `popup_shown` với `popup_id` khi mở popup
- [ ] Nếu tự instrument click → đặt `window.MVT_PAGE_TRACKS_CLICKS = true`
- [ ] Đăng ký page trong `build.js → PAGES_CONFIG`
- [ ] Thêm host vào `LEAD_ALLOWED_HOSTS` (`worker-modules/lead-ingest-handler.js`) nếu là subdomain mới — **quên bước này thì `/api/lead` trả 403** (email browser vẫn chạy)

---

## 9. Secrets cần set trên Worker

```bash
npx wrangler secret put SUPABASE_URL          # https://tnwelgvypmhhksqwnfmr.supabase.co
npx wrangler secret put SUPABASE_SERVICE_KEY  # service_role JWT
# tuỳ chọn — bật đẩy lead sang mvt-saas
npx wrangler secret put MVT_CRM_LEAD_URL
npx wrangler secret put MVT_CRM_TOKEN
```

**Không cần `WEB3FORMS_KEY` trên Worker** — email do browser gửi với access key trong HTML.

Lặp lại với `-c wrangler-dental.toml` cho worker `vietnamdentaltravel`. **Secrets là per-worker** — set một worker không tự lan sang worker kia.

---

## Câu hỏi chưa giải quyết

1. **Endpoint nhận lead của mvt-saas: chưa tồn tại** (đã dò 260812 qua MCP `operator.myvivatour.com`). mvt-saas **có sẵn** hệ CRM lead — `get_company_leads` (lọc theo seller / trạng thái / nguồn / tháng / quá-hạn-follow-up), `get_crm_dashboard`, `get_campaign_funnel` (lead → đủ điều kiện → gắn chặt → booking → doanh thu) — nhưng trong 56 MCP tool **không có tool ghi nào** ngoài `approve_payment` / `reject_payment`. Không có `create_lead` / ingest.
   ⇒ Nối `/api/lead` sang CRM là **feature mới bên repo mvt-saas**, phải mở plan riêng. Phía repo này cũng còn nợ: `pushLeadToCrm()` mới chỉ POST rồi log, **không ghi** `crm_synced_at` / `crm_ref` / `crm_error`, và chưa ghi được vì insert Supabase dùng `Prefer: return=minimal` nên không có row id trả về. `MVT_CRM_LEAD_URL` để trống tới lúc đó; index `marketing_leads_crm_pending_idx` đã sẵn cho backfill.
2. Rate limit Cloudflare cho `/api/lead` — ngưỡng đã chốt (10 req/phút/IP, xem §7) và wizard `scripts/cloudflare-rate-limit-wizard.sh` đã có, nhưng việc bấm chạy để bật rule trên 2 zone vẫn là **việc người**, chưa xác nhận đã chạy.
