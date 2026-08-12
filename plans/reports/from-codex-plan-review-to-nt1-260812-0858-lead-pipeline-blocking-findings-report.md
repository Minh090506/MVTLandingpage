# Plan-review chặn drain — lead pipeline có lỗi kiến trúc phải chốt lại

**Ngày:** 260812 · **Cổng:** NT1 Stage 2 plan-review (Codex `sol`, effort high) · **Verdict Codex:** FAIL (9 chặn + 1 nhỏ)
**NT1 tự verify lại:** 4 finding nặng nhất — **cả 4 đều CONFIRMED bằng bằng chứng chạy được**, không phải lo ngại trừu tượng.

---

## F1 — 🔴 CHẶN DEPLOY: Web3Forms **chặn** gọi từ server → deploy sẽ giết luồng email lead

Bằng chứng trực tiếp (probe bằng access_key vô hiệu → không gửi mail thật, không side effect):

```
POST https://api.web3forms.com/submit   (từ server, không phải browser)
→ HTTP 403
{"success":false,"message":"This method is not allowed. Use our API in client side
  or contact support with server IP address (Pro plan is required)"}
```

`forwardLeadToEmail()` (`worker-modules/lead-ingest-handler.js:148`) gọi Web3Forms **từ Cloudflare Worker** = server-side ⇒ **luôn 403**. Test 24/24 không bắt được vì nó stub `fetch` (`scripts/test-lead-ingest-handler.mjs:31`), tức chỉ kiểm logic ta tự viết, không kiểm dịch vụ thật.

**Chuỗi hỏng sau khi deploy + set secrets:**

| Bước | Diễn biến |
|---|---|
| 1 | Form submit → client intercept `fetch` → đổi hướng sang `/api/lead` (`lead-attribution-client.js:127`) |
| 2 | Worker: ghi Supabase **OK** · gửi Web3Forms **403 → false** |
| 3 | Handler trả **200** (fail-open: chỉ báo lỗi khi **cả hai** fail — `lead-ingest-handler.js:105`) |
| 4 | Client thấy `res.ok` ⇒ **KHÔNG fallback** (`lead-attribution-client.js:139`) |
| **Kết** | **Email về `info@myvivatour.com` NGỪNG HẲN.** Lead vào DB, mọi thứ trả 200, không có tín hiệu lỗi nào. |

**Nghịch lý phải biết:** hệ thống **chạy đúng hơn khi CHƯA set secrets** — lúc đó DB fail + email fail → 502 → client fallback gửi thẳng Web3Forms từ browser → email vẫn về. Set secrets xong mới là lúc email chết. Nên "set secrets rồi deploy" theo thứ tự cũ chính là bước kích hoạt lỗi.

**Quyết định §3 handoff "chặn `fetch` tới Web3Forms thay vì sửa 6 handler" dựng trên tiền đề sai** (tưởng Worker forward được). Đây là bằng chứng mới ⇒ đủ điều kiện mở lại quyết định, không phải "bàn lại cho vui".

Ba đường xử lý — **cần Minh chọn**:

| | Cách | Được | Mất |
|---|---|---|---|
| **A** | Client gửi **song song**: vẫn POST Web3Forms như hiện tại (email), đồng thời POST `/api/lead` (DB). Bỏ phần chặn fetch. | Email giữ nguyên đường đang chạy tốt · DB vẫn đầy · không tốn tiền | Sửa `lead-attribution-client.js` + bỏ `forwardLeadToEmail` khỏi worker; 2 request/lead |
| **B** | Đổi kênh email của Worker sang provider cho phép server-side (Resend / MailChannels / SES) | 1 đường duy nhất, sạch kiến trúc · Worker toàn quyền | Thêm provider + domain verify (SPF/DKIM) + secret mới; nhiều việc nhất |
| **C** | Nâng Web3Forms lên **Pro** | Không đụng code | **Tốn tiền định kỳ** — cổng ngân sách của Minh |

> NT1 nghiêng về **A**: nhỏ nhất, giữ nguyên đường email đang chạy thật, không phát sinh chi phí, và vẫn đạt trọn mục tiêu "lead vào DB đo được".

---

## F2 — 🔴 `/api/lead` cho client ghi đè trường tin cậy của email (cần vá trước khi mở public)

`const row = { raw: body }` (`lead-ingest-handler.js:86`) — `raw` là **toàn bộ body client gửi**. Payload email lại spread `...row.raw` **SAU** các trường server (`lead-ingest-handler.js:155-161`):

```js
access_key: accessKey,  subject: …,  from_name: …,  replyto: …,
...row.raw,          // ← client thắng tất cả những dòng trên
```

⇒ Ai POST thẳng `/api/lead` với `access_key` / `replyto` / `subject` của riêng họ là chiếm được payload gửi mail. Cộng thêm: endpoint public, **không rate limit, không captcha, không giới hạn kích thước body**, và `raw` là jsonb nhận mọi thứ ⇒ vừa là đường spam vừa là đường bơm phình DB.

Chốt chặn: đặt trường server **sau** `...row.raw`, allowlist trường được forward, giới hạn body size + số key, thêm rate limit. (Nếu chọn phương án **A** ở F1 thì worker không gửi mail nữa → phần ghi đè email hết đường khai thác, nhưng rate limit + giới hạn body **vẫn cần**.)

---

## F3 — 🟠 T6 không thể đạt acceptance với code hiện tại

Acceptance T6 nói "lead mới có `crm_synced_at` khác null". Nhưng `pushLeadToCrm()` (`lead-ingest-handler.js:174`) **chỉ POST rồi log** — không hề ghi ngược `crm_synced_at` / `crm_ref` / `crm_error`. Mà cũng không ghi được: insert Supabase dùng `Prefer: return=minimal` (`lead-ingest-handler.js:123`) nên **không có row id trả về** để update.

⇒ T6 cần đổi `return=representation` + viết đường write-back, chưa kể phía mvt-saas còn chưa có endpoint. Xác nhận T6 là plan **riêng**, phụ thuộc câu hỏi CRM endpoint.

---

## F4 — 🟠 Chưa chốt `popup_submit` vs `exit_popup_submit` là nợ chặn T4

Handoff để mục này ở "Phụ" nên chưa ai hỏi. Nhưng T4 phải tạo trigger GTM ⇒ không chốt thì phải làm 2 trigger rồi sau này sửa lại lần nữa. Phải quyết **trước** khi đụng GTM.

---

## Các finding còn lại (đã nhận, đưa vào roadmap, không cần Minh quyết ngay)

| # | Nội dung | Xử lý |
|---|---|---|
| F5 | T4 acceptance chỉ tới GTM **Preview** — Preview không phải live, phải **Publish** container mới có dữ liệu thật | Thêm bước publish + lưu version ID + kiểm tra incognito vào T4 |
| F6 | T5 submit thật lên production tạo email/GA4/Ads/Meta **không xoá lại được** (DELETE chỉ dọn được Supabase) | Tách **T5a AUTO** (browser/network/dataLayer/DB) và **T5b NGƯỜI** (inbox/GA4/Ads/Meta); xin phép Minh trước khi bắn conversion thật |
| F7 | Form dental: submit coi mọi response là thành công, không check status, không chặn double-click | Ghi nhận là bug thật, **không sửa trong phiên này** (ngoài scope, code đang chạy) — đưa vào backlog |
| F8 | Deploy 3 worker tuần tự, dental còn fast-path riêng, không có lock chung → fail giữa chừng để prod đa version | Serialize + smoke từng worker trong T3 |
| F9 | `.harness/**` chưa quyết có commit hay không | **Không commit** — thêm vào `.gitignore` ở T3 |

---

## Roadmap sửa sau review

```
T0  (MỚI, chặn tất cả)  Chốt phương án email F1 (A/B/C) + popup taxonomy F4      → Minh
T1  ✅ xong 3/4 quyết định (gold · Ads Primary · logo -06); còn CRM endpoint → gộp vào T6
T2  Set secrets — GIỮ, nhưng KHÔNG còn là "làm trước rồi deploy ngay"; deploy chỉ sau khi F1 vá xong
T2b (MỚI) Vá F1 + F2 trong worker/client, build + test lại
T3  Commit allowlist + PR + preview + smoke từng worker + merge   (merge = cổng Minh)
T4  GTM: chốt popup taxonomy → workspace → Preview → PUBLISH → verify incognito
T5a QA tự động (browser/dataLayer/DB)  ·  T5b QA người (inbox/GA4/Ads/Meta)
T6  CRM push — plan RIÊNG, phụ thuộc endpoint mvt-saas + write-back F3
```

---

## Câu hỏi chưa giải quyết

1. **F1 — chọn A, B hay C?** Chặn toàn bộ đường deploy, cần trả lời trước tiên.
2. **F4 — `exit_popup_submit` (dental) và `popup_submit` (escape/happytours) gộp làm một hay giữ hai tên?** Gộp thì phải sửa code + GTM cùng lúc.
3. F7 (bug form dental) sửa luôn trong đợt này hay để backlog riêng?
