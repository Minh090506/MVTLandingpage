# MVT Landing Page — Tracking Spec

Hợp đồng đo lường dùng chung cho mọi landing page MyVivaTour / VietnamDentalTravel.
Một tên event = một ý nghĩa, trên mọi trang. LP mới phải tuân theo file này.

---

## 1. Stack đo lường

```
Visitor (browser)
  │
  ├─► dataLayer ──► GTM (GTM-TPQWV864) ──┬─► GA4        G-2R0EJ2LBJ5
  │                                       ├─► Google Ads AW-17709107883
  │                                       └─► Meta Pixel 579298288600609
  │
  └─► form submit (fetch wrap)
        ├─► POST api.web3forms.com  ──► info@myvivatour.com   (email — browser only)
        └─► POST /api/lead (fire-and-forget) ──► Supabase public.marketing_leads
                                                 (DB — best-effort; never blocks UX)
```

GA4/Ads/Meta trả lời **"bao nhiêu, từ kênh nào"**. Supabase trả lời **"ai, nói gì, chốt được không"**.
Email đi **từ trình duyệt** (Web3Forms free chặn server-side; Worker không có IP tĩnh).
`/api/lead` chỉ ghi DB (+ CRM optional). Hai đường độc lập — email fail/DB fail không kéo theo nhau về UX.

| ID | Giá trị |
|---|---|
| GTM container | `GTM-TPQWV864` |
| GA4 measurement | `G-2R0EJ2LBJ5` |
| Google Ads | `AW-17709107883` |
| Ads conversion label | `Wq0ECKXBmfsbEKuVrvxB` |
| Meta Pixel | `579298288600609` |

---

## 2. Event taxonomy

Mọi event đẩy vào `window.dataLayer` dưới dạng `{ event: '<tên>', ...params }`.

### 2.1 Bắt buộc trên mọi LP

| Event | Bắn khi | Params | Ai bắn |
|---|---|---|---|
| `form_success` | Lead gửi thành công | `form_id` | Page |
| `form_error` | Gửi thất bại | `form_id`, `error_type` (`http_<mã>` \| `network`) | Page |
| `cta_click` | Click nút/link CTA | `cta_text`, `cta_id` | Shared* |
| `whatsapp_click` | Click link WhatsApp | `link_url`, `cta_text` | Shared* |
| `phone_click` | Click `tel:` | `link_url` | Shared |
| `email_click` | Click `mailto:` | `link_url` | Shared |
| `scroll_depth` | Cuộn qua 25/50/75/90% | `percent_scrolled` | Shared |

\* `cta_click` và `whatsapp_click`: trang tự instrument (escape, happytours) thì đặt `window.MVT_PAGE_TRACKS_CLICKS = true` trong `<head>` để shared client không bắn trùng.

### 2.2 Tuỳ trang

| Event | Bắn khi | Params | Đang có ở |
|---|---|---|---|
| `popup_shown` | Exit-intent popup hiện | `popup_id` | escape, happytours |
| `popup_submit` | Submit form trong popup | `popup_id`, `form_id` | escape, happytours, dental |
| `video_play` | Video hero/section chạy | `video_id` | escape, happytours |
| `tour_card_click` | Click card tour | `tour_id` | happytours |
| `tour_cta_click` | Click CTA trong card tour | `tour_id` | happytours |
| `tour_itinerary_open` | Mở accordion lịch trình | `tour_id` | happytours |
| `tour_source_click` | Click sang trang tour gốc | `tour_id` | happytours |
| `tour_helper_card_click` | Click card gợi ý | `tour_id` | happytours |

> **Hợp nhất 260812:** dental dùng `popup_submit` (không còn `exit_popup_submit`). GTM chỉ cần **một** trigger `popup_submit` cho mọi LP. Nếu GTM còn trigger cũ `exit_popup_submit` → gỡ sau khi deploy.

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
1. Merge attribution + chuẩn hoá `full_name` / `form_id` vào payload.
2. **POST Web3Forms** (request gốc, body đã merge) — response **trả về cho trang**.
3. **POST `/api/lead`** fire-and-forget cùng payload — lỗi/chậm/timeout **không** ảnh hưởng UX.

Truy cập trong page: `window.mvtAttribution()`.

---

## 5. Lead payload → `public.marketing_leads`

`/api/lead` nhận JSON. Cột riêng cho các trường dưới; **mọi thứ khách gửi được giữ nguyên trong `raw` (jsonb)** để không mất dữ liệu khi form đổi.

| Nhóm | Cột |
|---|---|
| Nguồn | `landing_page`, `page_host`, `page_path`, `form_id` |
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

Mỗi event ở §2 cần một **Custom Event trigger** trùng tên, gắn vào một **GA4 Event tag**. Tối thiểu:

1. Trigger `form_success` → GA4 event `generate_lead` (param: `form_id`) → đánh dấu **Key event** trong GA4.
2. Trigger `cta_click` → GA4 event `cta_click` (param: `cta_text`).
3. Trigger `whatsapp_click` → GA4 event `contact` (param: `method = whatsapp`).
4. Trigger `scroll_depth` → GA4 event `scroll_depth` (param: `percent_scrolled`).
5. Trigger `popup_submit` → GA4 event phù hợp (param: `popup_id` / `form_id`) — **một trigger cho mọi LP**.
6. **KHÔNG** import `generate_lead` từ GA4 sang Google Ads (chốt 260812 — xem §3). Ads chỉ nhận conversion trực tiếp qua `gtag`. Nếu trong Ads đã lỡ tạo import từ GA4 thì **gỡ hoặc để "Secondary" và không tính vào bidding** — hai nguồn cùng đếm một lead là đếm đôi.

Đăng ký `form_id`, `cta_text`, `percent_scrolled`, `tour_id` làm **custom dimension** trong GA4, nếu không param sẽ không hiện trong report.

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

**Rate limit thật** (CF WAF / rate limiting rules trên `/api/lead`) là **việc người** — code chỉ giới hạn size/keys.

---

## 8. Thêm landing page mới cần gì

Nhận **tự động** (không phải làm gì): attribution capture, dual-send Web3Forms + `/api/lead`, `phone_click`, `email_click`, `scroll_depth`, và cả `cta_click` + `whatsapp_click` nếu trang không tự instrument.

Phải **tự làm**:
- [ ] 5 tracking ID trong `<head>` (CI sẽ chặn nếu thiếu)
- [ ] `form_success` + `form_error` trong handler submit (check `res.ok` + `data.success`, có `catch`, chặn double-submit)
- [ ] Khối `gtag conversion` + `fbq('track','Lead')` ở §3
- [ ] Popup dùng event `popup_submit` (không tên riêng)
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

1. Endpoint nhận lead của mvt-saas chưa xác định → `MVT_CRM_LEAD_URL` để trống, `crm_synced_at` sẽ null cho tới khi có. (Đang dò qua MCP `operator.myvivatour.com` — T6.)
2. Rate limit Cloudflare cho `/api/lead` — việc người, chưa bật.
