# MVT — Content Development Playbook

Cách sản xuất nội dung cho MyVivaTour / VietnamDentalTravel: viết cái gì, viết thế nào, đo bằng gì.

**Quan hệ với tài liệu khác** — playbook này là lớp *thực thi*. Lớp *chiến lược* và *dữ liệu* nằm ở:

| Tài liệu | Ở đâu | Chứa gì |
|---|---|---|
| Topical Map MVT | Drive `Marketing/Topical Map MVT.docx` | Pillar/cluster cho VN-TH-KH-LA, chiến lược AI search |
| Schema markup | Drive `Marketing/Schema markup.docx` | Mẫu structured data |
| SEO keyword DB | `CLAUDE.md` §SEO Keywords + `SEO-KEYWORD-REPORT.md` | 4 tier keyword, phân tích 10 đối thủ |
| Brand voice | `docs/mvt-brand-guidelines.md` | Giọng, ngôn ngữ Úc, màu, logo |
| Đo lường | `docs/mvt-tracking-spec.md` | Event, conversion, attribution |

---

## 1. Viết cho ai

Thị trường chính: **Úc** (rồi Mỹ, NZ, Anh). Ba chân dung chi phối gần hết nội dung:

| Persona | Là ai | Lo gì | Nội dung ăn |
|---|---|---|---|
| **Cặp đôi nghỉ hưu** (55–70) | Có thời gian, có tiền, ngại rắc rối | Sức khoẻ, đi bộ nhiều không, đồ ăn lạ, ai lo giấy tờ | Lịch trình từng ngày, mức vận động, tất cả đã bao gồm gì |
| **Gia đình có con** (35–50) | Nghỉ học kỳ, ngân sách chặt | Trẻ có chán không, an toàn, phòng ngủ thế nào | Hoạt động theo độ tuổi, cấu hình phòng, thời gian di chuyển |
| **Khách nha khoa** (45–70) | Cần implant/răng sứ, giá Úc quá cao | Chất lượng có thật không, hỏng thì sao, mất bao lâu | Bằng cấp bác sĩ, ảnh trước–sau, bảo hành, timeline điều trị |

Viết cho **một** persona mỗi trang. Trang cố nói với cả ba sẽ không thuyết phục được ai.

---

## 2. Kiến trúc nội dung

Mô hình **pillar → cluster** (chi tiết đầy đủ ở Topical Map trên Drive):

```
Pillar: "Vietnam Travel Guide"           ← trang trụ, dài, bao quát
   ├── Cluster: "Ha Long Bay cruise guide"
   ├── Cluster: "Vietnam visa for Australians"
   ├── Cluster: "Best time to visit Vietnam"
   └── ...  mỗi cluster trỏ ngược ≥1 link về pillar
                    │
                    └──► Landing page tour  ← nơi chốt tiền
```

Pillar hiện có trong chiến lược: Vietnam · Thailand · Cambodia · Laos · Southeast Asia Combo · Luxury Indochina · Adventure SEA · Vietnam Travel Agent.

**Quy tắc liên kết**: cluster → pillar (bắt buộc, anchor giàu ngữ nghĩa) · cluster ↔ cluster cùng cụm · nội dung thông tin → landing page tour ở cuối bài, đúng một CTA rõ ràng.

---

## 3. Bốn loại nội dung

| Loại | Mục đích | Đo bằng | Ví dụ |
|---|---|---|---|
| **Informational** | Kéo traffic đầu phễu, xây E-E-A-T | Organic sessions, trích dẫn trong AI Overview | "History of Angkor Wat" |
| **Transactional** | Chốt đơn | `form_success`, CPL | Landing page tour, trang khuyến mãi |
| **Comparison** | Gỡ nút thắt quyết định | Scroll depth, click sang trang tour | "Ha Long vs Lan Ha Bay" |
| **Practical guide** | Hữu dụng, dễ chia sẻ, hợp voice search | Backlink, lượt lưu, lead magnet | "Vietnam visa for Australians" |

Tỉ lệ đề xuất mỗi tháng: **4 informational/practical : 2 comparison : 1 transactional**. Chỉ đăng nội dung bán hàng thì không bao giờ xây được thẩm quyền chủ đề.

---

## 4. Công thức landing page tour

Thứ tự này phản ánh thứ tự câu hỏi trong đầu khách. Đảo thứ tự là mất chuyển đổi.

| # | Section | Phải trả lời | Ghi chú |
|---|---|---|---|
| 1 | Hero | Đi đâu, mấy ngày, bao nhiêu AUD | Giá **hiện ngay màn đầu**. Giấu giá = giết niềm tin |
| 2 | Trust bar | Vì sao tin được | 5 USP chính thức (xem brand guide §3) |
| 3 | Có gì trong giá | Tôi trả tiền cho cái gì | Liệt kê song song **Included / Not included** — cột "not included" tăng tin, không giảm |
| 4 | Lịch trình từng ngày | Ngày nào làm gì | Có mức vận động, thời gian di chuyển, bữa ăn |
| 5 | Bảng giá | Nâng cấp hết bao nhiêu | ≤3 cột trên mobile (xem `CLAUDE.md` §Mobile pitfalls) |
| 6 | Social proof | Người thật đã đi chưa | Trích **nguyên văn** Google/TripAdvisor review. Không viết lại cho "mượt" |
| 7 | FAQ | Mấy chuyện tôi ngại hỏi | 5–8 câu, mỗi câu mở đầu bằng 1 câu trả lời trực tiếp <25 từ (để AI trích) |
| 8 | Form | Bước tiếp theo | ≤5 field/bước; luôn có textarea tự do |
| 9 | Backup liên hệ | Nếu tôi chưa muốn điền form | WhatsApp nổi + sticky CTA mobile |

### Copy nguyên tắc

- **Con số thắng tính từ.** "11 bữa ăn đã bao gồm" > "ẩm thực tuyệt vời".
- **Nêu thẳng phản đối rồi trả lời.** "Lo đi bộ nhiều? Ngày dài nhất khoảng 4km, đường bằng."
- **Một CTA mỗi màn hình.** Nhiều lựa chọn = không chọn gì.
- **Ngôn ngữ Úc, giá kèm AUD, năm trong title** (brand guide §3).
- Không dùng: "unforgettable", "hidden gem", "nestled", "immerse yourself", "bucket list". Đối thủ nào cũng viết vậy.

---

## 5. Công thức bài blog

```
H1        Bám sát cụm keyword mục tiêu, không nhồi
Lead      2–3 câu trả lời NGAY câu hỏi của tiêu đề  ← đoạn được AI trích
Body      H2 theo từng câu hỏi phụ; đoạn ngắn; bảng khi so sánh
Kinh nghiệm thật  ≥1 chi tiết chỉ người từng đến mới biết (E-E-A-T)
FAQ       3–5 câu hỏi ngữ tự nhiên + FAQPage schema
CTA       Một link tới landing page tour liên quan
Link nội bộ  ≥1 về pillar, 1–2 sang cluster cùng cụm
```

Độ dài: cluster 1.200–1.800 từ · pillar 2.500–4.000 từ. **Độ dài không phải mục tiêu** — trả lời hết câu hỏi rồi dừng.

### Tối ưu cho AI search (AEO/GEO)

Trả lời trước, giải thích sau · dùng câu hỏi thật làm H2 · một fact một câu (dễ trích) · nêu rõ tác giả + kinh nghiệm · số liệu phải có nguồn/ngày · cập nhật pillar mỗi quý (AI Overview ưu tiên nội dung mới).

---

## 6. Schema theo loại trang

| Trang | Schema bắt buộc |
|---|---|
| Landing page tour | `TravelAgency` + `TouristTrip` (có `Offer`, itinerary) + `FAQPage` + `BreadcrumbList` + `AggregateRating` nếu có review |
| Blog | `BlogPosting` (có `author`, `datePublished`, `dateModified`) + `FAQPage` |
| Trang điểm đến | `TouristDestination` + `FAQPage` |
| VietnamDentalTravel | `MedicalBusiness` + `Dentist` + `FAQPage` |

Mẫu chi tiết: `Marketing/Schema markup.docx` trên Drive.

---

## 7. Quy trình biên tập

```
Brief ──► Draft ──► Kiểm chứng thực tế ──► Duyệt brand ──► Publish ──► Đo sau 30 ngày
```

### Mẫu brief (điền trước khi viết một chữ nào)

```markdown
Loại:            informational | transactional | comparison | practical
Persona:         retired couple | family | dental
Keyword chính:   
Keyword phụ:     
Ý định tìm kiếm: khách muốn LÀM gì sau khi đọc?
Pillar thuộc về: 
Link nội bộ ra:  
CTA:             trang nào?
Chứng cứ cần:    giá / lịch trình / review / bằng cấp bác sĩ — lấy từ đâu
Ảnh:             đường dẫn trong kho Drive (KHÔNG ảnh AI, KHÔNG frame video)
Đo bằng:         metric nào định nghĩa thành công
```

### Bước kiểm chứng — không được bỏ

Giá, ngày khởi hành, thời lượng, nội dung đã bao gồm: đối chiếu trang tour gốc trên myvivatour.com. **Nội dung sai giá là rủi ro pháp lý, không phải lỗi chính tả.** Review phải trích nguyên văn, có nguồn.

---

## 8. Ảnh & video

Bất biến (chi tiết ở `CLAUDE.md` §Nguồn ảnh/video và brand guide §7):

- Ảnh tĩnh **bắt buộc** lấy từ `MVT_Kho ảnh/Kho ảnh (theo địa điểm)/<Location>/WEBP/Banner Tours (1920x743)/`
- **Không** trích frame video làm ảnh tĩnh
- **Không** ảnh AI / diorama trên trang chuyển đổi
- Video social/YouTube **phải** đóng logo MVT
- Mọi ảnh dùng URL Supabase tuyệt đối (cả `<img src>` lẫn CSS `url()`)
- Alt text mô tả nội dung, không nhồi keyword

---

## 9. Checklist trước khi xuất bản

- [ ] Một persona, một ý định tìm kiếm
- [ ] Lead trả lời được câu hỏi của tiêu đề trong <25 từ
- [ ] Giá/ngày/inclusions đã đối chiếu nguồn gốc
- [ ] ≥1 chi tiết trải nghiệm thật
- [ ] Link nội bộ: ≥1 về pillar, 1–2 ngang cụm
- [ ] Đúng schema, validate bằng Rich Results Test
- [ ] Tiếng Anh Úc; giá kèm AUD; title có năm + "from Australia"
- [ ] Ảnh từ kho công ty, URL tuyệt đối, có alt
- [ ] Không có từ trong danh sách cấm §4
- [ ] Title 50–60 ký tự, meta description 150–160
- [ ] Mobile: không tràn ngang, LCP < 2,5s
- [ ] Nếu là LP: đủ tracking (CI sẽ chặn nếu thiếu)

---

## 10. Đo hiệu quả nội dung

| Loại | Metric chính | Ngưỡng xem lại |
|---|---|---|
| Informational | Organic sessions/tháng | <100 sau 90 ngày → viết lại hoặc gộp |
| Comparison | Click sang trang tour | <5% người đọc → CTA sai chỗ |
| Landing page | Lead / 1.000 phiên | <10 → xem lại giá, form, chứng cứ |
| Practical guide | Backlink + lượt tải | 0 backlink sau 6 tháng → chưa đủ khác biệt |

Truy vấn nguồn sự thật về lead:

```sql
-- Lead 30 ngày qua theo trang và campaign
select landing_page, coalesce(utm_campaign,'(organic/direct)') campaign,
       count(*) leads, count(*) filter (where gclid is not null) paid_clicks
from public.marketing_leads
where created_at > now() - interval '30 days'
group by 1,2 order by leads desc;
```

Ghép với chi phí Google Ads → CPL thật theo campaign. Đây là con số duy nhất quyết định tăng hay cắt ngân sách.

---

## 11. Nhịp sản xuất đề xuất

| Chu kỳ | Việc |
|---|---|
| Tuần | 1–2 bài cluster |
| Tháng | 1 bài comparison; rà số liệu §10 |
| Quý | Cập nhật 1 pillar; refresh giá/năm trên mọi LP |
| Năm | Đổi năm trong title toàn bộ trang; kiểm lại giá đối thủ |

---

## Câu hỏi chưa giải quyết

1. Blog hiện nằm trên myvivatour.com (WordPress?) — quy trình xuất bản có nằm ngoài repo này không? Playbook chưa nói được bước deploy cho blog.
2. Ai là tác giả đứng tên bài (cần cho E-E-A-T)? Chưa có author bio/schema `author` nào.
3. Topical Map và Schema doc trên Drive viết bằng tiếng Việt — có cần bản tiếng Anh cho cộng tác viên nước ngoài không?
4. Chưa có ngân sách/nhân sự nội dung → nhịp ở §11 là đề xuất, chưa phải cam kết.
