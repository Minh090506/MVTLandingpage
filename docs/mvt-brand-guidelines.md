# MyVivaTour — Brand Guidelines (cơ bản)

Nguồn: `Brand_Fact_Sheet_MyVivaTour_VietnamDentalTravel.docx` (Drive Marketing, 2025-10-15) · logo SVG gốc (`MVT_Kho ảnh/Logo/SVG`) · CSS đang chạy trên `escape` + `happytours` + `dental-implants-vietnam` · myvivatour.com.

Guide này là **nguồn chuẩn** cho mọi landing page, ad creative, social post. Khi LP mới lệch khỏi đây → sửa LP, không sửa guide.

---

## 1. Kiến trúc thương hiệu

```
CÔNG TY TNHH MYVIVATOUR
├── MyVivaTour  (master brand)         myvivatour.com
│   ├── escape.myvivatour.com          LP tour 10 ngày
│   └── happytours.myvivatour.com      LP multi-tour
└── VietnamDentalTravel  (sub-brand)   vietnamdentaltravel.com
    └── implant.vietnamdentaltravel.com
```

VietnamDentalTravel là **brand riêng của MyVivaTour**, có bộ màu riêng (§4.3). Không trộn palette hai brand trên cùng một trang. Chân trang của VDT nên ghi "a brand of MyVivaTour" để chuyển uy tín.

---

## 2. Thông tin pháp lý & liên hệ (dùng cho footer, schema.org, GBP)

| Trường | Giá trị |
|---|---|
| Tên pháp lý | CÔNG TY TNHH MYVIVATOUR |
| Thành lập | 16/11/2024 |
| Founders | Duc Minh; Ly Nguyen |
| Trụ sở | 69A Hoàng Văn Thái, Thanh Xuân, Hà Nội, Việt Nam |
| Điện thoại / WhatsApp | +84 974 036 614 → `https://wa.me/84974036614` |
| Email | info@ · booking@ · accountant@myvivatour.com |
| Ngành | Inbound Travel & Tours (Vietnam & Southeast Asia) |

Social chính thức: [Facebook](https://www.facebook.com/myvivatour) · [Instagram](https://www.instagram.com/myvivatourasia/) · [TikTok](https://www.tiktok.com/@myvivatour) · [TikTok Stories](https://www.tiktok.com/@myvivatourstories)
VDT: [Facebook](https://www.facebook.com/profile.php?id=61573180443697) · [Instagram](https://www.instagram.com/vietnamdentaltravel/) · [TikTok](https://www.tiktok.com/@vietnamdentaltravel) · [SmileTravel](https://www.tiktok.com/@smiletravelvietnam)

> YouTube / X / LinkedIn / Reddit / Podcast: Fact Sheet ghi "điền sau" — **chưa có**. Đừng bịa link trong footer hay schema.

---

## 3. Định vị & giọng nói

**Mô tả ngắn (dùng cho meta description, bio, schema `description`):**
> Inbound tour operator for English-speaking markets, crafting seamless, value-driven trips across Vietnam & Southeast Asia.

**5 USP chính thức** (lấy từ myvivatour.com — dùng lại nguyên trên LP để nhất quán):
Safe & Secure (fully insured) · Best Quality (expert local guides) · 24/7 Support · Best Price (no hidden fees) · Top-Rated.

**Positioning trên thị trường Úc:** mid-premium, all-inclusive value. Cạnh tranh bằng *all-inclusive* + *local expertise* + *small group* — không đua giá đáy.

### Giọng nói

| Là | Không phải |
|---|---|
| Ấm, như một người bạn địa phương | Chào hàng, cường điệu |
| Cụ thể, có số (ngày, giá AUD, tên điểm đến) | Chung chung ("amazing experience") |
| Trấn an, minh bạch chi phí | Giấu phí, chữ nhỏ |
| Chủ động ("We'll pick you up at…") | Bị động, quan liêu |

Câu mẫu đúng tông (từ myvivatour.com):
- "One team, 24/7 on hand — for a trip you'll never forget"
- "Your safety is our top priority with fully insured tours"
- "Real experiences from travellers who explored Southeast Asia with us"

### Quy tắc ngôn ngữ — BẮT BUỘC

- **Tiếng Anh Úc**: `holiday` (không `vacation`), `travelled`, `organised`, `centre`, `programme`.
- Giá luôn kèm đơn vị: `$2,099 AUD` — không bao giờ để `$2,099` trần.
- Ngày kiểu Úc: `15 March 2026`.
- Có **năm** trong title tag (tín hiệu freshness) và **"from Australia"** (geo-qualify).
- Xưng hô: `we` / `you`. Không `the company`, không ngôi thứ ba.

---

## 4. Màu

### 4.1 Màu lõi thương hiệu (trích trực tiếp từ logo SVG — không thương lượng)

| Token | Hex | Vai trò |
|---|---|---|
| `--mvt-orange` | `#E75524` | Màu chủ đạo. Nét chữ M, CTA chính |
| `--mvt-green` | `#8FC73E` | Vòng tròn logo. Accent, tick, badge "included" |
| `--mvt-grey` | `#696A6D` | Chữ descriptor "VIVA ASIA", text phụ |
| `--mvt-grey-light` | `#D2D2D1` | Đường kẻ, viền |

### 4.2 Palette landing page MyVivaTour (đang chạy trên escape + happytours — **hai trang đã trùng khớp 100%**)

| Token | Hex | Dùng cho |
|---|---|---|
| `--primary` | `#D4AF37` | Gold — badge premium, viền giá, icon |
| `--primary-text` | `#A8842A` | Gold đậm cho chữ trên nền sáng (gold gốc không đủ tương phản) |
| `--accent` | `#E8622A` | CTA chính. Lệch `#E75524` của logo ~1% — coi là on-brand |
| `--accent-dark` | `#C84F1D` | Hover / pressed |
| `--dark` | `#111827` | Nền section tối |
| `--text-dark` | `#1F2937` | Chữ chính |
| `--text-light` | `#6B7280` | Chữ phụ |
| `--light` | `#F8FAFC` | Nền section sáng |
| `--border` | `#E5E7EB` | Viền, divider |
| `--success` | `#10B981` | Xác nhận, tick |

Gold `#D4AF37` **không có trong logo** — đây là lớp "premium" riêng của LP.

> **Chốt 260812 (Minh):** gold là **màu landing page chính thức**. Mọi LP MyVivaTour sau này dùng đúng token này cho lớp premium (badge, viền giá, icon). Ranh giới không đổi: **cam `--accent` là màu nhận diện và là màu CTA** — gold không được lấn sang CTA. Bộ nhận diện gốc (logo, ấn phẩm in) vẫn chỉ cam/xanh/xám; gold sống ở tầng LP, không leo lên tầng brand.

### 4.3 Palette VietnamDentalTravel (khác hẳn — y tế, tin cậy)

| Token | Hex | | Token | Hex |
|---|---|---|---|---|
| `--primary-navy` | `#0A1628` | | `--accent-teal` | `#06B6D4` |
| `--secondary-navy` | `#1F2937` | | `--accent-coral` | `#E8604C` |
| `--dark-charcoal` | `#2D3E4F` | | `--accent-gold` | `#C8A97E` |
| `--off-white` | `#F8F9FA` | | `--success-green` | `#22C55E` |

### 4.4 Quy tắc tương phản

Chữ body phải đạt **WCAG AA (4.5:1)**. Cụ thể: không đặt `--primary` (#D4AF37) làm chữ trên nền trắng — dùng `--primary-text` (#A8842A). Chữ trắng trên ảnh hero phải có scrim tối + `text-shadow` hai lớp (`0 1px 3px` + `0 6px 20px` rgba đen) như escape/happytours đang làm.

---

## 5. Logo

### 5.1 Cấu trúc

Symbol: chữ **M** viết tay màu cam, nét bay lên thành **hình máy bay** ở góc phải trên, đặt trong **vòng tròn hở màu xanh lá**. Wordmark: "My Viva Tour" (sans geometric đậm) + descriptor "VIVA ASIA" (grey, giãn chữ, chữ hoa).

### 5.2 Bộ file — `Marketing/MY VIVA TOUR/MVT_Kho ảnh/Logo/`

| Lockup | File | Tỉ lệ | Dùng khi |
|---|---|---|---|
| **Ngang** | `Viva Tour 4-chot-01..05` | 461.77 × 197.37 (≈2.34:1) | Header web, email, ad banner, chữ ký |
| **Dọc** | `Viva Tour 4-chot-06..10` | 288.41 × 209.42 (≈1.38:1) | Avatar social, watermark video, đứng giữa, không gian hẹp |

Định dạng: `SVG/` (ưu tiên cho web) · `PNG/` (nền trong) · `AI/` (file gốc in ấn).

Mỗi lockup có 5 biến thể: full-color, và các bản đơn sắc (ví dụ `-08` là bản xanh lá đơn sắc).

> **Đã xử lý 260812 (Minh chốt: đổi tên, không xoá).** Lưới dựng hình dính ở **cả hai** bản `-06` (SVG *và* PNG — doc cũ chỉ ghi SVG). Trạng thái Drive hiện tại:
>
> | File | Vai trò |
> |---|---|
> | `SVG/Viva Tour 4-chot-06.svg` | ✅ **Bản sạch** — đã gỡ 23 phần tử guide (`.st6`/`.st7`, stroke `#D2D2D1`); giữ nguyên 5 path cam + 2 path xanh + 2 text. Dùng bản này. |
> | `SVG/Viva Tour 4-chot-06-construction.svg` | Artboard kỹ thuật gốc, còn lưới. Không xuất bản. |
> | `PNG/Viva Tour 4-chot-06-construction.png` | Bản raster cũ, còn lưới. Không xuất bản. |
>
> ⚠️ **Còn thiếu: PNG full-color dọc sạch.** `-06` là lockup dọc full-color **duy nhất** (`-07` là đơn sắc cam), nên sau khi đổi tên, slot PNG đang trống. Không tự render bù được — xem cảnh báo font ngay dưới. Cần designer xuất lại từ file AI trên máy **có cài Montserrat**.

> ⚠️ **Logo SVG phụ thuộc font.** Wordmark trong `-06` là **live text**, không outline — mở/render trên máy thiếu font sẽ ra chữ sai (đã kiểm chứng: render bằng `rsvg-convert` không có Montserrat cho ra wordmark fallback lệch hẳn). Khi giao file ra ngoài hoặc rasterize, phải outline chữ trước, hoặc đảm bảo máy đích có Montserrat.

### 5.3 Quy tắc dùng

- **Khoảng trống tối thiểu**: bằng đường kính vòng tròn xanh, tính từ mọi cạnh.
- **Kích thước tối thiểu**: ngang ≥ 140px, dọc ≥ 80px (dưới mức này máy bay và descriptor vỡ).
- **Trên nền ảnh**: dùng bản đơn sắc trắng, hoặc đặt logo full-color lên khối nền trắng/tối đặc.
- **Web**: luôn dùng SVG. PNG chỉ khi nền tảng không nhận SVG (Facebook, Google Business).
- **Alt text**: `MyVivaTour — Vietnam tour operator`.

### 5.4 Không được

Đổi màu symbol · xoay/nghiêng · thêm đổ bóng hay viền · kéo méo tỉ lệ · tách máy bay khỏi chữ M · đặt logo full-color lên nền cam hoặc xanh lá · dùng ảnh chụp lại logo thay vì file gốc.

---

## 6. Typography

| Vai trò | Font | Weight | Nguồn |
|---|---|---|---|
| Display (H1, H2, giá) | **Playfair Display** (serif) | 400 / 500 / 600 / 700 | Google Fonts |
| Body, UI, CTA | **Plus Jakarta Sans** (sans) | 400 / 500 / 600 / 700 | Google Fonts |
| Wordmark logo | **Montserrat** — Bold ("My Viva Tour") + Medium letterspacing 3 ("VIVA ASIA", `#696A6D`) | 500 / 700 | Google Fonts |

Cả hai font LP đã nạp sẵn trên escape + happytours.

**Font wordmark = Montserrat** (xác định 260812 từ khai báo `font-family` trong `SVG/Viva Tour 4-chot-06.svg`: `Montserrat-Bold`, `Montserrat-Medium`). Dù vậy quy tắc **không đổi: luôn dùng file logo, KHÔNG set lại chữ bằng font hệ thống** — biết tên font chỉ để (a) chỉnh kerning/khoảng chữ khi cần dựng lại, (b) cài đúng font trước khi mở/xuất file logo (xem cảnh báo font ở §5.2).

Nguyên tắc: serif cho cảm xúc (tiêu đề, tên điểm đến, giá), sans cho thông tin (đoạn văn, bảng, nút, form). Không dùng serif cho chữ < 16px. Không dùng font thứ ba.

---

## 7. Hình ảnh & video

Chi tiết vận hành nằm ở `CLAUDE.md` §"Nguồn ảnh/video". Tóm tắt bất biến:

- **Ảnh tĩnh LP bắt buộc lấy từ kho công ty**: `MVT_Kho ảnh/Kho ảnh (theo địa điểm)/<Location>/WEBP/Banner Tours (1920x743)/` — đã curate, có watermark MVT, đúng tỉ lệ card.
- **Không trích frame từ video làm ảnh tĩnh.** Frame video chỉ dùng cho hero video loop.
- **Video social/YouTube phải đóng logo MVT.**
- Ảnh AI / diorama 3D **cấm** trên landing page chuyển đổi — chỉ dùng cho creative thử nghiệm.
- Mọi ảnh trong HTML **và CSS `url()`** phải là URL Supabase tuyệt đối, không dùng đường dẫn tương đối.

Tông ảnh: người thật đang trải nghiệm > cảnh không người. Ánh sáng ấm, giờ vàng. Ưu tiên khách phương Tây trong khung hình cho thị trường Úc.

---

## 8. Khối token dán vào landing page mới

```css
:root {
  /* Brand core — từ logo, không đổi */
  --mvt-orange: #E75524;
  --mvt-green:  #8FC73E;
  --mvt-grey:   #696A6D;

  /* Landing page palette */
  --primary: #D4AF37;       --primary-text: #A8842A;
  --accent:  #E8622A;       --accent-dark:  #C84F1D;
  --dark:    #111827;       --light:        #F8FAFC;
  --text-dark: #1F2937;     --text-light:   #6B7280;
  --border:  #E5E7EB;       --success:      #10B981;
}
```

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap">
```

---

## 9. Checklist duyệt nhanh

- [ ] Logo đúng file gốc (SVG), đủ khoảng trống, không biến dạng
- [ ] CTA dùng `--accent`, không phải gold
- [ ] Chữ body đạt tương phản AA
- [ ] Tiếng Anh Úc; giá kèm `AUD`; title có năm + "from Australia"
- [ ] Ảnh từ kho công ty, URL Supabase tuyệt đối
- [ ] Footer: tên pháp lý, địa chỉ, phone, email, chỉ social **đã tồn tại**
- [ ] VDT không trộn palette MyVivaTour

---

## Câu hỏi chưa giải quyết

1. YouTube/X/LinkedIn của cả hai brand vẫn trống trong Fact Sheet — đã có kênh chưa, hay chưa mở?
