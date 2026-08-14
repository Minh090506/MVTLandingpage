# Phase 00 pre-flight (Prompt Z1) — đo trong Ads UI, read-only

**Phiên:** 260813-1840 · **Tài khoản:** `806-163-1566 My Viva Tour` (con của MCC `572-470-7852`), đăng nhập `myvivatourvn@gmail.com` (`authuser=2`)
**Phạm vi báo cáo:** 14/7–12/8/2026 (30 ngày qua) · **0 thay đổi ghi vào tài khoản.**

---

## 0. Kết luận trước tiên

**Tiền đề của plan sai một chỗ lớn:** tài khoản **đã có sẵn campaign trỏ vào LP escape** —
`MVT - Escape - High Intent` (ID `23734444078`), dựng **7/4/2026**, ngân sách **900.000 ₫/ngày**,
**đang tạm dừng**, chưa từng chi 1 đồng (0 hiển thị / 0 nhấp trong 30 ngày).

Nó **không** ở trạng thái bật được ngay: 4 cài đặt hiện tại chống lại chính mục tiêu đo conversion
(chi tiết §3). Việc thật của phase 01–05 vì vậy đổi hình: **sửa + bật cái có sẵn cho escape**, chỉ
dựng mới cho happytours + dental.

---

## 1. Số đo thật (thay các dải prior trong phase 04)

| Chỉ số (`AU_10May`, 30 ngày) | Giá trị |
|---|---|
| Chi phí | 132.224.73x ₫ |
| Lần nhấp | 3.038 |
| **CPC trung bình** | **43.524 ₫** (≈ AUD 2,5 @ ~17.500 ₫/AUD) |
| Lượt chuyển đổi | 59,98 |
| **Chi phí / chuyển đổi** | **2.204.340 ₫** (≈ AUD 126) |
| Tỷ lệ chuyển đổi | 1,97% |
| Giá trị chuyển đổi | 0,00 (không gán giá trị) |
| Trạng thái | **Bị giới hạn theo ngân sách** (4.500.000 ₫/ngày) |

⚠️ 59,98 conv này là của các action `TechSol - *` đo **website chính**, gồm cả click WhatsApp —
**không so sánh 1:1 với 1 lead form thật trên LP**. Dùng CPC làm neo thì được; dùng cost/conv làm
target CPA cho LP thì phải trừ hao.

**Toàn cảnh 3 campaign trong `806-163-1566`:**

| Campaign | Ngân sách/ngày | Trạng thái | 30 ngày |
|---|---|---|---|
| `MVT - Escape - High Intent` | 900.000 ₫ | Bị tạm dừng | 0 chi, 0 nhấp |
| `AU_5Feb2026` | 3.000.000 ₫ | Bị tạm dừng + **hầu hết quảng cáo bị từ chối** | 0 chi, 0 nhấp |
| `AU_10May` | 4.500.000 ₫ | Đang chạy, bị giới hạn ngân sách | như bảng trên |

---

## 2. Checklist phase 00 — trạng thái

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| **A1** tài khoản chi tiền | ✅ `806-163-1566`, MCC chỉ là quản lý | account switcher |
| **A2** auto-tagging (CHẶN) | ✅ **BẬT** — "Tự động gắn thẻ: Có" | Quản trị → Cài đặt tài khoản |
| **A3** múi giờ + tiền tệ | ✅ (GMT+07:00) Giờ Đông Dương · VND | cùng trang |
| **A4** conversion cross-account | ⏸️ chưa đọc được (xem C1) | — |
| **B1** từ khoá `AU_10May` | ⏸️ chưa export | — |
| **B2** CPC/clicks/cost-per-conv | ✅ §1 | bảng campaign |
| **B3** cấu hình goal của `AU_10May` | ⏸️ chưa đọc | — |
| **C1** liệt kê mọi conversion action | 🔴 **KHÔNG ĐỌC ĐƯỢC** | §4 |
| **C2** `MVT Landing Form Submit` Count=One? (CHẶN) | 🔴 **KHÔNG ĐỌC ĐƯỢC** | §4 |
| **C3** action GA4 vẫn Phụ | ⏸️ chưa xác nhận lại | — |
| **D1–D3** tag Ads trong GTM | ⏸️ chưa làm | — |
| **E1–E3** GA4 stream / exploration / liên kết | ⏸️ chưa làm | — |

---

## 3. 🔴 Cài đặt của campaign escape có sẵn — 4 điểm phải sửa TRƯỚC khi bật

Đọc từ panel "Cài đặt chiến dịch" (mở xem rồi đóng bằng X, **không bấm Lưu**).

| # | Cài đặt hiện tại | Vì sao hỏng |
|---|---|---|
| 1 | **"Mở rộng URL cuối cùng" BẬT** (Final URL expansion, thuộc gói AI Max) | Google được quyền đổi trang đích sang trang khác nó cho là hợp hơn. Rơi vào `/honeymoon`·`/family-tour`·`/luxury-cruise` là **301 dựng `Location` từ chuỗi tĩnh, không mang `url.search`** ⇒ **mất `gclid` im lặng**, conversion về 0 y như hiện trạng đang đi sửa. Đây đúng cái bẫy plan §Constraints cảnh báo, hoá ra đã live sẵn |
| 2 | **Mục tiêu chuyển đổi = mặc định tài khoản** ("Khách hàng tiềm năng qua tin nhắn, Lượt gửi biểu mẫu KHTN và **4 mục tiêu khác**") | Trái tiêu chí nghiệm thu #2 của plan (goal cấp campaign = **chỉ** `MVT Landing Form Submit`). Đang mở, Smart Bidding sẽ tối ưu theo cả click WhatsApp/cuộc gọi của bộ action `TechSol - *` |
| 3 | **Đặt giá thầu = "Tối đa hoá giá trị lượt chuyển đổi"** | Tài khoản **không gán giá trị** cho conversion (cột Giá trị = 0,00) và campaign này có **0 lịch sử**. Tối đa hoá một đại lượng luôn bằng 0 ⇒ phân phối mù |
| 4 | **"Lượt tìm kiếm theo thương hiệu": hiển thị cho mọi cụm liên quan** | Không loại brand ⇒ tự cạnh tranh đấu giá với `AU_10May` (đang *bị giới hạn ngân sách*), trái mặc định plan (negative brand terms) |

**Đúng sẵn, giữ nguyên:** Mạng = **chỉ Google Search** · Vị trí = **Úc (quốc gia)** · Ngôn ngữ = Tiếng Anh ·
Từ khoá khớp mở rộng = **Tắt** · Final URL của quảng cáo = **`https://escape.myvivatour.com/`** (root
chuẩn, mở thật ra trang đúng — không dính 301) · 3 nhóm quảng cáo có từ khoá thật khớp template
`CLAUDE.md` (`[vietnam tour packages from australia 2026]`, `[small group vietnam tour from australia]`,
`"mekong delta tour"`, `"hoi an tour package"`, `"hanoi to ho chi minh tour"`).

**Chất lượng quảng cáo:** chỉ **1 quảng cáo đang bật**, độ mạnh **"Kém"**, và một số từ khoá exact bị
gắn *"Lượng tìm kiếm thấp"*.

---

## 4. 🔴 Chặn kỹ thuật — không đọc được danh sách conversion action

Trang **Mục tiêu → Lượt chuyển đổi → Tóm tắt** treo spinner vô hạn ở **cả hai** tài khoản
(`806-163-1566` và MCC `572-470-7852`). Đã thử **5 đường**: URL trực tiếp `/aw/conversions` ×3 · đi qua
menu trái · tab mới hoàn toàn. Chờ tới ~40s mỗi lần. `/aw/conversions/summary` trả **404** (không phải
route hợp lệ).

⇒ **C1 + C2 chưa đóng.** C2 là mục CHẶN: popup và form chính **chia chung** label
`AW-17709107883/Wq0ECKXBmfsbEKuVrvxB`, nên nếu Count = **Every** thì 1 khách gửi cả 2 form = 2
conversion và Smart Bidding sẽ đuổi theo bản sao.

Không kết luận gì về nguyên nhân treo (đúng bài học "loại trừ ở một tầng không chứng minh kết luận ở
tầng đó"). Cách đi tiếp: thử lại sau vài giờ / trình duyệt khác; nếu vẫn treo thì đọc gián tiếp qua
cột "Hành động chuyển đổi" trong báo cáo campaign.

---

## 5. Rủi ro mới phát hiện, chưa có trong plan

| # | Rủi ro | Mức |
|---|---|---|
| R-A | **"Tự động áp dụng đề xuất" đang BẬT ở cấp tài khoản** ("dùng xoá từ khoá thừa và **6 loại đề xuất khác**") ⇒ Google được tự sửa campaign LP sau khi bật, gồm cả loại đề xuất đụng ngân sách/từ khoá | Cao — làm hỏng tính lặp lại của mọi phép đo |
| R-B | `AU_5Feb2026` **hầu hết quảng cáo bị từ chối** và vẫn giữ ngân sách 3.000.000 ₫/ngày ở trạng thái tạm dừng | Trung bình — bật nhầm là chi tiền cho campaign hỏng |
| R-C | Campaign escape bật **AI Max + tuỳ chỉnh văn bản** ⇒ Google viết lại tiêu đề/mô tả quảng cáo | Trung bình — nội dung quảng cáo lệch copy đã duyệt |

---

## 6. Đề xuất đổi hình phase 01–05

1. **Escape:** không dựng mới. Sửa 4 điểm §3 trên campaign `23734444078` rồi bật.
2. **Happytours + dental:** dựng mới, **nhân bản cấu hình đã sửa** của escape (đỡ lệch chuẩn).
3. Xử lý R-A (tắt tự động áp dụng) **trước** khi bật bất cứ campaign nào — nếu không thì mọi con số
   Minh duyệt đều có thể bị Google sửa sau lưng.
4. Đóng C1/C2 trước khi bật (phase 03).

---

---

## 7. Thao tác đã thực hiện sau khi Minh duyệt số (cùng phiên)

**Minh chốt:** sửa+bật campaign escape có sẵn · ngân sách **escape 900.000 · happytours 1.500.000 ·
dental 500.000 ₫/ngày** (tiền thêm) · giá thầu **Tối đa hoá lượt nhấp + trần CPC 50.000 ₫** · tắt
auto-apply trước · bật cả 3.

### 7.1 🔴 Tắt "Tự động áp dụng đề xuất" — LÀM RỒI NHƯNG KHÔNG ĂN

Đã bỏ tick đủ **7/7** loại đang bật (6 nhóm "Duy trì quảng cáo" + 1 nhóm "Phát triển hoạt động kinh
doanh" = *Tối đa hoá số lần nhấp*). UI xác nhận từng bước: bộ đếm chạy 7 → 6 → 5 → 3 → **0/7 + 0/14**,
kèm banner *"Bạn đã chọn 0 loại đề xuất sẽ tự động áp dụng"*.

**Nạp lại trang thì về nguyên trạng `6/7 + 1/14`.** ⇒ thay đổi **không persist**. Nguyên nhân chưa xác
định (không suy đoán): có thể cài đặt do MCC `572-470-7852` quản, có thể cần quyền cao hơn, có thể lỗi
UI. Không thử lại vòng nữa để tránh đào sâu vô ích.

**Hệ quả:** R-A vẫn sống. Bật campaign LP lúc này = Google vẫn được tự sửa từ khoá/quảng cáo/giá thầu.

### 7.2 Chưa động tới

Campaign escape **chưa sửa gì** (4 điểm §3 còn nguyên), 2 campaign happytours/dental **chưa dựng**.
Lý do dừng: (a) chặn 7.1 chưa gỡ; (b) **C2 vẫn chưa đọc được** — trang conversion còn treo.
Trạng thái tài khoản sau phiên = **giống hệt trước phiên**, trừ 7.1 đã bị revert.

## Câu hỏi chưa giải quyết

1. **Mọi con số tiền** — 3 ngân sách/ngày, trần Max CPC, target CPA, trần chi tháng, ngày review.
   Neo đã có: CPC thật 43.524 ₫; ngân sách escape có sẵn 900.000 ₫/ngày (ai đặt, có còn hợp ý không?).
2. Campaign escape do ai dựng 7/4/2026 và vì sao chưa từng bật? (Nhật ký thay đổi chưa đọc.)
3. `AU_5Feb2026` — xoá, sửa quảng cáo bị từ chối, hay để nguyên tạm dừng?
4. Tắt "tự động áp dụng đề xuất" cấp tài khoản — Minh duyệt không? (chạm cài đặt tài khoản đang chi tiền)
5. Giữ hay tắt AI Max / tuỳ chỉnh văn bản trên campaign escape? (Tắt "Mở rộng URL cuối cùng" là bắt buộc;
   hai cái còn lại là lựa chọn.)
