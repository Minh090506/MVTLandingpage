# Landing page không gửi được dữ liệu về GA4 và Google Ads — sai container GTM

**Ngày:** 2026-08-12 · **Phát hiện khi:** làm T4 (cấu hình GTM) · **Mức độ:** chặn T4, T5a, T5b
**Trạng thái:** đã xác minh nhiều lớp, chờ Minh quyết hướng xử lý

> **Lưu ý sửa sai:** bản đầu của báo cáo này kết luận `G-2R0EJ2LBJ5` "không tồn tại". **Sai.**
> Kiểm tra trực tiếp trong GA4 admin cho thấy đó là property THẬT và đang thu dữ liệu. Xem §2.
> Phần kết luận về GTM và về hệ quả runtime thì không đổi — đã verify bằng đường độc lập.

---

## 1. Kết luận

`GTM-TPQWV864` — container ID nằm trong code cả 3 landing page, trong `CLAUDE.md` và
`docs/mvt-tracking-spec.md` — **không tồn tại**. Container GTM thật của MyVivaTour là
**`GTM-MGPWV94N`**, đang chạy trên trang chính `myvivatour.com`.

Hệ quả trên 3 landing page (`escape`, `happytours`, `dental`):

- **GTM chưa từng chạy.** Mọi `dataLayer.push` (`form_success`, `cta_click`, `whatsapp_click`,
  `scroll_depth`, `popup_submit`) đẩy vào hàng đợi rồi **nằm im**, không ai tiêu thụ.
- **GA4 không nhận được gì từ landing page** (property vẫn sống, nhưng nhận dữ liệu từ trang chính).
- **Google Ads conversion không được ghi nhận** — dù `AW-17709107883` hợp lệ. Lý do ở §4.
- **Facebook Pixel vẫn chạy bình thường** — thứ duy nhất còn sống trên landing page.

---

## 2. GA4: property CÓ THẬT — đính chính

Mở GA4 bằng `myvivatourvn@gmail.com`:

| Trường | Giá trị |
|---|---|
| Property | `Myvivatour.vn-t8` (`a334536706p499301826`) |
| Luồng | `Myvivatour.com` — `https://myvivatour.com`, mã luồng `11754046057` |
| **Mã đo lường** | **`G-2R0EJ2LBJ5`** — đọc từ DOM, khớp từng ký tự: `G·-·2·R·0·E·J·2·L·B·J·5` |
| Trạng thái | **"Đang nhận lưu lượng truy cập trong 48 giờ qua"** |

⇒ ID trong code **đúng**. Commit `5dfe5ee` (25/06) "unify GA4" là **hợp lệ**, không phải nguyên nhân hỏng.

### Vì sao tôi kết luận sai lúc đầu

Test `gtag/js?id=G-2R0EJ2LBJ5` trả **404 ổn định** (curl ×8, có và không có user-agent trình duyệt;
fetch trong browser cũng fail). Trong khi một ID **bịa hoàn toàn** (`G-ZZZZZZZZZZ`) lại trả **200**.
Tôi suy ra "Google chủ động từ chối riêng ID này ⇒ không tồn tại". **Suy luận đó sai.**

Lý do thật: endpoint `gtag/js?id=G-…` chỉ phục vụ khi measurement ID được cấu hình như một
**Google tag cài trực tiếp**. Property này triển khai GA4 **qua GTM**, nên không có bản gtag.js
phục vụ riêng cho ID đó — 404 ở đây nói về **cách cài đặt**, không nói về **sự tồn tại**.

**Bài học:** với GA4, mã trả về của `gtag/js` **không phải bằng chứng property tồn tại hay không**.
Chỉ GA4 admin mới trả lời được. Với GTM thì tín hiệu này đáng tin (xem §3).

---

## 3. GTM: `GTM-TPQWV864` không tồn tại, container thật là `GTM-MGPWV94N`

Với GTM, 404 là tín hiệu đáng tin vì ID bịa cũng 404 còn container thật thì 200:

| ID | Vai trò | Kết quả |
|---|---|---|
| `GTM-MGPWV94N` | **container thật**, đang chạy trên `myvivatour.com` | ✅ 200 / 470.428 bytes |
| `GTM-K695QPXW` | container thật (Vietnamdentaltravel) | ✅ 200 / 350.869 bytes |
| `GTM-ZZZZZZZ` | **bịa hoàn toàn** | ❌ fail |
| **`GTM-TPQWV864`** | **đang dùng trong 3 landing page** | ❌ **fail — y hệt ID bịa** |

`GTM-MGPWV94N` tìm ra bằng cách xem trang chính `myvivatour.com` nạp thẻ gì — nó nạp
`GTM-MGPWV94N` **và** `gtag/js?id=G-2R0EJ2LBJ5`. Cái sau cũng 404 trên trang chính (vô hại, thừa),
nhưng GA4 vẫn có dữ liệu vì **GTM container mới là thứ gửi hit đi**. Đó là mảnh ghép cuối cùng.

Lưu ý: `GTM-MGPWV94N` **không nằm trong** GTM account của `myvivatourvn@gmail.com`
(tài khoản đó chỉ có account "myvivatour" **rỗng** và account "Vietnamdentaltravel" chứa `GTM-K695QPXW`).
⇒ Cần xác định ai đang giữ quyền trên container đó.

---

## 4. Bằng chứng runtime trên production — phần này không đổi

Chạy trên `https://escape.myvivatour.com/`:

```
window.google_tag_manager   → ABSENT          (container GTM chưa bao giờ khởi tạo)
window.google_tag_data      → undefined       (loader gtag.js chưa bao giờ nạp)
window.gaGlobal             → undefined       (GA chưa khởi tạo)
window.fbq                  → function, có callMethod  → Facebook Pixel SỐNG
window.dataLayer.length     → 4               (có event, nhưng không ai đọc)
```

Network khi tải trang: **không có** request nào tới `google-analytics.com/g/collect`. Chỉ có:

```
GET googletagmanager.com/gtm.js?id=GTM-TPQWV864   → 503
GET googletagmanager.com/gtag/js?id=G-2R0EJ2LBJ5  → 503
```

### Vì sao Google Ads cũng chết dù `AW-17709107883` hợp lệ

Trang định nghĩa `gtag` **bằng tay**:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-2R0EJ2LBJ5"></script>   <!-- khong nap duoc -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}     <!-- gtag chi la ham day vao mang -->
  gtag('config', 'G-2R0EJ2LBJ5');
  gtag('config', 'AW-17709107883');
</script>
```

`gtag(...)` **không ném lỗi** vì page tự định nghĩa nó — chỉ nhét vào `dataLayer`. Thứ thật sự gửi hit
là loader `gtag/js`, mà loader đó không nạp được ⇒ `gtag('event','conversion',{send_to:'AW-…'})`
trong form handler **chỉ đẩy vào mảng rồi thôi**.

Đây là kiểu hỏng nguy hiểm nhất: **không có lỗi đỏ trong console**, code trông đúng, test unit vẫn xanh.

---

## 5. Truy vết nguồn gốc — vì sao GTM account trống mà code vẫn có ID

Câu hỏi của Minh: Ads chạy nhiều năm bằng `myvivatourvn@gmail.com`, sao GTM account rỗng?

**Điểm dễ nhầm:** Google Ads **không cần GTM**. Ads chạy bằng thẻ `gtag` đặt thẳng trên site.
GTM là sản phẩm riêng, tuỳ chọn. "Chạy Ads lâu năm" và "GTM account rỗng" cùng đúng được.

Lịch sử git:

| Ngày | Commit | Sự kiện |
|---|---|---|
| **03/04/2026** | `7ab40ff` initial commit | `worker.js` **đã có sẵn** snippet GTM với `GTM-TPQWV864`. Trong file **KHÔNG có** GA4, Ads, FB Pixel — grep cả 3 đều đếm **0** |
| **05/04/2026** | `696f67f` "add tracking" | Đưa vào 3 ID thật: `G-LKDCCNJMP3` (GA4 cũ), `AW-17709107883`, FB `579298288600609`. GTM thì **dùng lại cái nằm sẵn**, không lấy mới |
| **25/06/2026** | `5dfe5ee` "unify GA4" | `G-LKDCCNJMP3` → `G-2R0EJ2LBJ5`. **Hợp lệ** — cả hai ID đều có thật |

**Thứ tự này là lời giải.** Ngày 5/4 là hôm đi thu thập ID thật, và GTM là cái **duy nhất không phải
đi thu thập** vì đã nằm sẵn trong HTML từ commit đầu. Không ai vào GTM lấy container ⇒ GTM account
rỗng là đúng, và ID trong code là **ID mẫu của boilerplate**, chưa bao giờ được thay.

Sau đó `CLAUDE.md` xếp nó vào bảng *"Tracking IDs (đã cài vào code ngày 5/4/2026)"* **ngồi cùng 3 ID
thật** ⇒ thừa hưởng độ tin cậy của chúng. `CLAUDE-CODE-PROMPTS.md` còn ghi *"✅ Đã có đủ IDs:
GTM-TPQWV864, …"*. Chưa ai từng mở container đó ra kiểm tra.

**Mốc hỏng:** GTM hỏng **từ đầu (03/04)**. Trước 25/06, GA4 và Ads vẫn chạy được qua đường gtag trực
tiếp với `G-LKDCCNJMP3` (ID này có bản gtag.js phục vụ trực tiếp). Từ 25/06, ID mới không có bản
gtag.js phục vụ trực tiếp ⇒ **mất cả GA4 lẫn Ads conversion trên landing page**.

⇒ Dự kiến trong dữ liệu: GA4 (lưu lượng từ landing page) và Ads conversion **đứt quanh 25/06/2026**,
trong khi click/chi phí Ads vẫn chạy. Minh kiểm chứng được ngay trong tài khoản.

---

## 6. Hệ quả với kế hoạch đang chạy

| Task | Ảnh hưởng |
|---|---|
| T4 (cấu hình + Publish GTM) | **Tiền đề sai** — không cấu hình được container không tồn tại. Phải chốt dùng container nào trước |
| T5a / T5b (QA GA4 / Ads) | Chặn theo |
| `scripts/gtm-setup-wizard.sh` | Nội dung đúng, nhưng ID hardcode `GTM-TPQWV864` phải thay |
| `CLAUDE.md`, `docs/mvt-tracking-spec.md`, `AGENTS.md` | Đang ghi container ID sai như thể đã cài xong |
| Ngân sách Ads từ 25/06 | Conversion không được ghi ⇒ bidding tự động chạy mù suốt giai đoạn đó |

---

## 7. Hướng xử lý (chờ Minh quyết)

**Phương án A — dùng chung container thật `GTM-MGPWV94N` (đang chạy trên trang chính).**
Thay ID trong 3 landing page → deploy → dựng trigger/tag trong container đó.
Ưu: GA4 đã cấu hình sẵn trong container, một chỗ quản lý tất cả.
Nhược: cần quyền Edit trên container — hiện **không nằm** trong tài khoản `myvivatourvn@gmail.com`.

**Phương án B — tạo container mới trong GTM account "myvivatour" (đang rỗng).**
Ưu: Minh toàn quyền, tách bạch landing page với website chính.
Nhược: phải tự cấu hình lại GA4 tag; hai container cùng gửi về một property cần đặt tên event nhất quán.

**Dental** có thể cân nhắc dùng luôn `GTM-K695QPXW` (đã có sẵn, đúng thương hiệu, Minh có quyền).

Chưa tạo gì trong cả A lẫn B — tạo container là dựng tài sản trên tài khoản doanh nghiệp, cần Minh quyết.

---

## Câu hỏi mở

1. **Ai đang giữ quyền trên `GTM-MGPWV94N`?** Container này chạy trên `myvivatour.com` nhưng không
   thuộc GTM account của `myvivatourvn@gmail.com`. Nhiều khả năng thuộc đơn vị làm website chính.
2. Chọn phương án A hay B ở §7? Dental gộp chung hay tách `GTM-K695QPXW`?
3. Ads chạy mù conversion từ 25/06 — có cần đánh giá lại hiệu quả/ngân sách giai đoạn đó không?
4. Trang chính `myvivatour.com` nạp `gtag/js?id=G-2R0EJ2LBJ5` (404, vô hại nhưng thừa) song song với
   GTM. Có nên dọn không? Ngoài phạm vi repo này.
