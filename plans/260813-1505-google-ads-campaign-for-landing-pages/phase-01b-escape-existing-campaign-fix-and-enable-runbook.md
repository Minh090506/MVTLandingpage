# Phase 01b — Runbook: sửa + bật campaign escape có sẵn

**Priority:** P1 · **Status:** ready to execute · **Thay thế:** phần "dựng mới cho escape" của phase 01
**Căn cứ:** Minh duyệt 260814-0839 ("bật 1 campaign vào 1 LP tuần này") + số tiền đã chốt 260813-1615

## Vì sao escape, không phải happytours

Campaign `MVT - Escape - High Intent` (ID `23734444078`) đã tồn tại từ 7/4/2026, đang tạm dừng, chưa
từng chi. Đã đúng sẵn: Mạng = chỉ Google Search · Vị trí = Úc · Ngôn ngữ = English · Khớp mở rộng = Tắt ·
Final URL = `https://escape.myvivatour.com/` (root, không dính 301) · 3 nhóm quảng cáo có từ khoá thật
khớp template `CLAUDE.md`. Dựng happytours từ đầu = thêm nửa ngày để có cùng một phép thử.

## Kỳ vọng thực tế — đọc trước khi bật

| | |
|---|---|
| Ngân sách | 900.000 ₫/ngày |
| CPC thật đo được (`AU_10May`, 30 ngày) | 43.524 ₫ |
| ⇒ Click/ngày ước tính | **~20** (trần CPC 50.000 ₫ ⇒ sàn ~18) |
| 14 ngày | **~290 click · ~12,6 triệu ₫** (≈ AUD 720) |
| Lead kỳ vọng | **2–6 lead**, không hơn |

Con số lead đó suy từ tỷ lệ 1,97% của `AU_10May` — mà tỷ lệ đó **đã bị thổi** vì đếm cả click WhatsApp,
nên form thật sẽ thấp hơn. **Đừng kỳ vọng có đủ dữ liệu để kết luận "LP tốt hay xấu" sau 14 ngày.**
Mục tiêu của đợt này chỉ là: **chứng minh ống chạy end-to-end** — click → LP → form → row trong
`marketing_leads` **có `gclid`**. Đó là tất cả.

Muốn rẻ hơn: hạ còn 450.000 ₫/ngày (~10 click/ngày) vẫn đạt mục tiêu trên trong 14 ngày (~140 click,
~6,3 triệu ₫). Quyết định của Minh.

---

## BƯỚC 0 — Các chặn phải xử trước (đừng bỏ qua)

### 0.1 ✅ ĐÃ ĐÓNG 260814 — Count = Một

Đo trực tiếp trong UI: `MVT Landing Form Submit` → **Số lượt = Một (One)**, cửa sổ 90 ngày, Tối ưu hoá
= **Chính**. ⇒ Popup và form chính chia chung label **không** gây đếm đôi. Trang conversion hôm 13/8
treo chỉ là lỗi tạm thời, nay tải bình thường.

Đóng luôn C1: đã liệt kê đủ **20 action** của `806-163-1566` và **2 action** của MCC.

### 0.3 🔴 CHẶN MỚI — action conversion nằm SAI TÀI KHOẢN

**Đo 260814:** `MVT Landing Form Submit` (`AW-17709107883/Wq0ECKXBmfsbEKuVrvxB`) được định nghĩa trong
**MCC `572-470-7852`**, KHÔNG có trong tài khoản chi tiền `806-163-1566` (đã rà đủ 20/20 action, bỏ
filter trạng thái, hiện cả mục đã xoá).

Grep code xác nhận cả 3 LP **chỉ** bắn đúng label này, không bắn action nào của tài khoản con
(`escape` ×2, `happytours` ×2, `dental` ×1) ⇒ loại phương án "dùng action sẵn có, khỏi sửa code".

⇒ Campaign escape nằm trong tài khoản con **không chọn được** action này làm mục tiêu cấp campaign.
Bật nguyên trạng = cột Conversions vẫn 0, đúng cái bug đang đi sửa.

**KHÔNG dùng cross-account conversion tracking (CACT).** Công tắc CACT áp cho **cả tài khoản**
(Client *hoặc* Manager, không dùng được cả hai). Bật lên thì `806-163-1566` **mất toàn bộ 6 action**
đang nuôi `AU_10May` (~60 conv/30 ngày, 4,5 triệu ₫/ngày), campaign đó rơi về goal mặc định của MCC —
vốn đang 0 conversion. Đổi cái đang chạy lấy cái chưa chạy = lỗ.

**✅ ĐÃ LÀM 260814:** action `MVT LP Form Submit` đã tạo trong `806-163-1566` — Chính · Count **Một** ·
90 ngày · giá trị cố định 1 ₫. `send_to` mới = **`AW-16765482840/MLW2CNnjnuEcENjus7o-`**
(`AW-16765482840` = ID của chính tài khoản con — cũng là ID từng treo ở câu hỏi #4 báo cáo đối chiếu).
Code `pages/escape/index.html` đã thêm `gtag('config','AW-16765482840')` + bắn label mới ở **cả 2** chỗ
(`bookingForm` và `exitForm`), giữ nguyên label MCC. `node build.js` + validator **PASS**.
**Còn lại: deploy + submit form thật để xác nhận action ghi nhận.**

**Cách đúng — tạo action mới trong tài khoản con:**
1. `806-163-1566` → Mục tiêu → Lượt chuyển đổi → **+ Tạo hành động chuyển đổi** → Trang web → thiết
   lập thủ công. Đặt: Tối ưu hoá **Chính** · Số lượt **Một** · cửa sổ **90 ngày**.
2. Lấy `send_to` mới (AW id của tài khoản con + label mới).
3. `pages/escape/index.html`: **thêm** `gtag('event','conversion',{send_to:'<label mới>'})` cạnh lệnh
   cũ. **Giữ nguyên label MCC** — tài khoản con không đếm action của MCC nên không đếm đôi.
4. `node build.js` → deploy → submit form thật → xác nhận action mới đã ghi nhận.
5. Chỉ sửa **escape** tuần này. happytours + dental để sau, khi dựng campaign riêng.

**"Lượt chuyển đổi đang chờ"** (trạng thái hiện tại của action MCC) = *chưa ghi conversion nào trong
7 ngày gần đây*. Nó **không** chứng minh tag đã bắn, cũng không chứng minh tag hỏng — đừng đọc thành
"tag chạy tốt". Muốn biết tag bắn thật: Tag Assistant, hoặc bắt request
`googleadservices.com/pagead/conversion` lúc submit.

### 0.2 "Tự động áp dụng đề xuất" — tắt hoặc chấp nhận có điều kiện

Hôm 13/8 bỏ tick đủ 7/7, UI xác nhận `0/7`, **nạp lại trang thì về `6/7`** — không lưu.

Thử theo thứ tự, dừng ngay khi được:
1. **Từ MCC:** đăng nhập `572-470-7852` → **Quản trị → Cài đặt → Đề xuất** (cấp manager). Cài đặt cấp
   MCC có thể đang ghi đè xuống tài khoản con.
2. **Kiểm quyền:** `myvivatourvn@gmail.com` có phải **Quản trị (Admin)** trên `806-163-1566` không?
   Quyền Chuẩn (Standard) không sửa được một số cài đặt cấp tài khoản.
3. **Nếu cả hai hỏng:** vẫn bật campaign, nhưng **bắt buộc** kèm nghi thức bù:
   - Mỗi thứ Hai mở **Công cụ → Nhật ký thay đổi**, lọc 7 ngày, soi mọi dòng có tác nhân là hệ thống.
   - Bất kỳ thay đổi nào Google tự làm lên từ khoá / giá thầu / ngân sách → hoàn tác + ghi vào sổ quyết định.
   - Không có nghi thức này thì mọi số đo sau 2 tuần đều không diễn giải được.

---

## BƯỚC 1 — Sửa 4 điểm hỏng của campaign (KHÔNG bật vội)

Vào `806-163-1566` → Chiến dịch → `MVT - Escape - High Intent` → **Cài đặt**.

### 1.1 🔴 TẮT "Mở rộng URL cuối cùng" (Final URL expansion) — QUAN TRỌNG NHẤT

**Cài đặt bổ sung → Mở rộng URL cuối cùng → BỎ TICK.**

Vì sao đây là điểm chết người: bật thì Google được tự đổi trang đích. Rơi vào `/honeymoon`,
`/family-tour` hoặc `/luxury-cruise` là **301 dựng `Location` từ chuỗi tĩnh, không mang `url.search`**
⇒ `gclid` bị vứt im lặng ⇒ conversion về 0 đúng y hệt cái bug đang đi sửa. Không tắt cái này thì cả
đợt test vô nghĩa.

### 1.2 Mục tiêu chuyển đổi → chỉ 1 action

**Cài đặt → Mục tiêu chuyển đổi → "Chọn mục tiêu cho chiến dịch này"** (bỏ mặc định tài khoản)
→ chỉ tick **action mới tạo ở bước 0.3**.

⚠️ **Không phải `MVT Landing Form Submit`** — action đó ở MCC, không chọn được từ đây (xem 0.3).

Bỏ hết `TechSol - *` (đo website chính, gồm click WhatsApp). **Đặc biệt phải bỏ** action nhập từ GA4
`Lượt gửi biểu mẫu KHTN (form_submit)` — trong tài khoản con nó đang để **Chính** và đếm **Mỗi**,
lại đo form của **cả website chính**, không riêng escape. Để nguyên = campaign tối ưu theo form của
trang khác.

### 1.3 Đặt giá thầu → Tối đa hoá lượt nhấp + trần CPC

**Cài đặt → Giá thầu → "Tối đa hoá số lần nhấp"** → tick **"Đặt giá thầu CPC tối đa"** = **50.000 ₫**.

Đang là "Tối đa hoá giá trị lượt chuyển đổi" — sai, vì tài khoản không gán giá trị cho conversion
(cột Giá trị = 0,00) và campaign này có 0 lịch sử. Tối đa hoá một đại lượng luôn bằng 0 = phân phối mù.

### 1.4 Loại trừ tìm kiếm thương hiệu

**Cài đặt → Lượt tìm kiếm theo thương hiệu** → **không** để "hiển thị cho mọi cụm liên quan".
Thêm danh sách loại trừ thương hiệu (`my viva tour`, `myvivatour`).

Không làm: campaign này tự cạnh tranh đấu giá với `AU_10May` (đang *bị giới hạn ngân sách*) — tự mình
đẩy giá của chính mình.

### 1.5 Cân nhắc: AI Max / tuỳ chỉnh văn bản

Campaign đang bật tuỳ chỉnh văn bản ⇒ Google tự viết lại tiêu đề/mô tả. **Đề xuất tắt** trong đợt test,
để nội dung quảng cáo đúng bản đã duyệt và kết quả quy được về nội dung mình viết. (Tuỳ chọn, không bắt buộc.)

---

## BƯỚC 2 — Gắn UTM để nối được sổ cái với tiền

**Cài đặt → Cài đặt bổ sung → Hậu tố URL cuối cùng (Final URL suffix)**, dán:

```
utm_source=google&utm_medium=cpc&utm_campaign=lp_escape_search_au&utm_content={creative}&utm_term={keyword}
```

Vì sao bước này đáng giá nhất trong cả runbook: auto-tagging chỉ cho `gclid` — muốn biết lead đến từ
campaign nào phải gọi Ads API. Có `utm_campaign` thì **query thẳng Postgres** là ra, không cần tích hợp gì:

```sql
select utm_campaign, count(*) from public.marketing_leads
where page_host = 'escape.myvivatour.com' and gclid is not null
group by utm_campaign;
```

Đây chính là chỗ trục "phân bổ vốn" nối vào trục "hiệu quả" mà không phải xây backend.

⚠️ **Kiểm sau khi lưu:** mở `https://escape.myvivatour.com/?utm_source=google&utm_medium=cpc&utm_campaign=lp_escape_search_au&gclid=TEST123`
→ gửi form thật → xác nhận row trong `marketing_leads` có đủ `gclid` + `utm_campaign`.
**Không pass bước này thì đừng bật campaign** — bật lên cũng không đo được gì.

---

## BƯỚC 3 — Kiểm trước khi bật (checklist, tick đủ mới bật)

- [ ] 1.1 Mở rộng URL cuối cùng = **TẮT** ← chặn cứng
- [ ] 1.2 Mục tiêu chuyển đổi cấp campaign = **chỉ** `MVT Landing Form Submit`
- [ ] 1.3 Giá thầu = Tối đa hoá lượt nhấp, trần CPC 50.000 ₫
- [ ] 1.4 Loại trừ brand đã thêm
- [ ] 2 Final URL suffix đã lưu, **và** test `?gclid=TEST123` đã ra row đủ `gclid` + `utm_campaign`
- [ ] 0.1 Count = Một (hoặc đã ghi nhận "chưa đọc được, số có thể ×2")
- [ ] 0.2 Auto-apply đã tắt (hoặc đã cam kết nghi thức soi Nhật ký thay đổi thứ Hai hàng tuần)
- [ ] Ngân sách = 900.000 ₫/ngày (hoặc 450.000 nếu Minh hạ)
- [ ] Ít nhất **2** quảng cáo trong mỗi nhóm (hiện chỉ 1, độ mạnh "Kém")
- [ ] Từ khoá "Lượng tìm kiếm thấp" đã tạm dừng (không tiêu tiền nhưng làm loãng báo cáo)
- [ ] Negative keywords theo `CLAUDE.md` đã thêm: `free, DIY, backpacker, visa application, embassy,
      volunteer, teach english, work in vietnam, immigration, one way, booking.com, hostel, airbnb`
- [ ] `AU_10May` **không bị đụng vào** — ghi lại spend/ngày + thị phần hiển thị 7 ngày trước để đối chiếu

## BƯỚC 4 — Bật

Chiến dịch → chọn `MVT - Escape - High Intent` → **Bật (Enabled)**. Ghi lại ngày giờ bật.

## BƯỚC 5 — Kiểm sau khi bật

| Mốc | Kiểm | Hỏng thì làm gì |
|---|---|---|
| **+2 giờ** | Ads có Hiển thị > 0 | 0 hiển thị = quảng cáo bị từ chối hoặc bid quá thấp — soi tab Quảng cáo |
| **+24 giờ** | Click > 0 · GA4 lọc host `escape` thấy phiên có `gclid` | Có click nhưng GA4 0 phiên ⇒ **mất gclid** ⇒ kiểm lại 1.1 ngay |
| **+48 giờ** | Chi tiêu ≈ ngân sách, `AU_10May` không đổi (±10%) | `AU_10May` tụt ⇒ đang tự cạnh tranh ⇒ siết loại trừ brand |
| **+7 ngày** | ≥1 row `marketing_leads` có `gclid` non-null | 0 row mà >100 click ⇒ **dừng chi**, sửa ống, KHÔNG "tối ưu nội dung LP" |
| **+7 ngày** | 0 lỗi 429 trên `/api/lead` | có 429 ⇒ flag, **không** nới rate limit |
| **Thứ Hai hàng tuần** | Nhật ký thay đổi: Google có tự sửa gì không | có ⇒ hoàn tác + ghi sổ |

## Điều kiện DỪNG (tự động, không cần bàn)

- Chi > 5 triệu ₫ mà **0 click** → tắt, xem lại quảng cáo bị từ chối.
- >150 click mà **0 row** trong `marketing_leads` → tắt, ống hỏng ở đâu đó.
- `AU_10May` tụt >20% thị phần hiển thị → tắt escape, xem lại loại trừ brand.
- Hết 14 ngày → tắt, ngồi đọc số, quyết bước sau. **Không tự gia hạn.**

## Rollback

Tạm dừng campaign. Mọi cài đặt conversion đều ở cấp campaign nên tạm dừng khôi phục nguyên trạng
trước khi bật, không ảnh hưởng `AU_10May` hay mục tiêu cấp tài khoản.

## Câu hỏi chưa giải quyết

1. Ngân sách giữ 900.000 hay hạ 450.000 ₫/ngày? (900k = ~12,6 triệu ₫ cho 14 ngày)
2. Ai thao tác trong Ads UI — Minh tự làm, hay agent điều khiển trình duyệt (cần đăng nhập `authuser=2`)?
3. Tắt AI Max/tuỳ chỉnh văn bản (1.5) — có hay không? Không bắt buộc.
4. `AU_5Feb2026` (tạm dừng, quảng cáo bị từ chối, vẫn giữ ngân sách 3 triệu ₫/ngày) — xử lý sao?
