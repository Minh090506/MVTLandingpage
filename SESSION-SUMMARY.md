# SESSION SUMMARY — MVT Landing Page Project
> Cập nhật: 8/4/2026 | Dùng để paste vào session mới cho continuity

---

## 1. Dự án gì?
Hệ thống multi-landing-page cho công ty du lịch **myvivatour.com** (target thị trường Úc). Repo: https://github.com/Minh090506/MVTLandingpage

## 2. Kiến trúc hệ thống
- **Build pipeline:** `pages/*/index.html` → `build.js` → `worker.js` (embedded HTML + routing)
- **Hosting:** Cloudflare Workers (domain: escape.myvivatour.com)
- **Image CDN:** Supabase Storage (bucket: landing-images, project: tnwelgvypmhhksqwnfmr)
- **Form:** Web3Forms API (key: cf0ca620-d064-4640-9454-afb27d588f67)
- **CI/CD:** GitHub Actions → auto build + deploy khi push to main
- **Campaign Monitoring:** Google Ads Script → Google Sheet → HTML Dashboard (auto-fetch JSONP)

## 3. Landing pages hiện có
| Page | Path | Status |
|------|------|--------|
| Escape Australia 10-Day Vietnam | `/` (root) | ✅ Live, 146KB |
| Vietnam Honeymoon Package | `/honeymoon` | Placeholder |
| Vietnam Family Tour | `/family-tour` | Placeholder |
| Luxury Vietnam Cruise | `/luxury-cruise` | Placeholder |

## 4. Tracking IDs (ĐÃ CÓ ĐẦY ĐỦ — đã cài vào code + verified trên live site)
| Tracking | ID |
|---|---|
| GTM Container | `GTM-TPQWV864` |
| GA4 Measurement | `G-LKDCCNJMP3` (Stream: 14312720580) |
| Google Ads Conversion ID | `AW-17709107883` |
| Google Ads Conversion Label | `Wq0ECKXBmfsbEKuVrvxB` |
| Google Ads Customer ID (MCC) | `572-470-7852` (ocid: 7771865759) |
| Google Ads Account (thực tế) | `806-163-1566` (My Viva Tour, tiền tệ: VNĐ) |
| Facebook Pixel | `579298288600609` (Business: 623339086973908) |

## 5. GitHub Secrets (ĐÃ SET)
- `CLOUDFLARE_API_TOKEN` ✅
- `CLOUDFLARE_ACCOUNT_ID` ✅ (ff289b31351913173cd7d52c4396ed8e)
- `SUPABASE_URL` — chưa set
- `SUPABASE_SERVICE_KEY` — chưa set

## 6. ĐÃ HOÀN THÀNH

### 6A. Landing Page Development (Prompts 1-6) ✅
- ✅ Clone repo, tạo cấu trúc multi-page (pages/escape, honeymoon, family-tour, luxury-cruise)
- ✅ Tạo build.js bundler (auto-discover pages, generate routing, sitemap, robots.txt, 404)
- ✅ Tạo GitHub Actions workflow (.github/workflows/deploy.yml)
- ✅ Tạo script upload-to-supabase.js
- ✅ Phân tích SEO escape.myvivatour.com (report tại reports/seo-audit-escape-20260405.html)
- ✅ Thu thập tất cả tracking IDs (GTM, GA4, Google Ads, Facebook Pixel)
- ✅ **Prompt 1** — Cài tracking codes (GTM + GA4 + Google Ads + Facebook Pixel) vào escape page
- ✅ **Prompt 2** — Sync structured data + meta keywords từ worker.js.backup
- ✅ **Prompt 3** — Floating WhatsApp button + sticky CTA + exit-intent popup
- ✅ **Prompt 4** — Tối ưu form 2 bước + social proof + urgency
- ✅ **Prompt 5** — AI SEO nâng cao (AggregateRating, Review Schema, Speakable)
- ✅ **Prompt 6** — Build + commit + push + deploy thành công
- ✅ Deploy worker.js lên Cloudflare Workers

### 6B. Google Ads Setup ✅
- ✅ Tạo Google Ads Strategy document (Google-Ads-Strategy-MVT-Escape.docx)
- ✅ Tạo 6 prompts setup (GOOGLE-ADS-SETUP-PROMPTS.md) + 3 bản fixed (PROMPT-C/D/E-FIXED.md)

### 6C. Google Ads Campaign 1: "MVT - Escape - High Intent" — ✅ PUBLISHED & RUNNING
- Campaign type: Search
- Budget: 800,000₫/ngày (~$50 AUD)
- Bidding: Maximize Clicks, max CPC 80,000₫
- Targeting: Australia (Presence only)
- Keywords: 10 phrase match keywords (vietnam tour from australia, vietnam holiday package, v.v.)
- Negative keywords: 15 (cheap, free, backpacker, DIY, v.v.)
- Ad: Responsive Search Ad — 15 headlines + 4 descriptions
- Networks: Search only (đã bỏ Display Network & Search Partners)
- Status: **ĐÃ XUẤT BẢN VÀ ĐANG CHẠY** (từ 7/4/2026)

### 6D. Google Ads Extensions (Prompt E) — ✅ ĐỦ CẢ 4 LOẠI
- Sitelinks: 11 cái (View Full Itinerary, See Pricing, Read Reviews, Get Free Quote, v.v.)
- Callouts: 12 cái (All-Inclusive from $2,099, Flights Included, Daily Departures, v.v.)
- Structured Snippets: 7 cái (Destinations, Amenities + trùng lặp cần dọn)
- Price Extensions: 1 asset, 4 packages (Base $2,099, Super 4-Star $2,389, v.v.)

### 6E. Campaign Monitoring Pipeline — ✅ HOÀN THÀNH (8/4/2026)

**Google Ads Script "MVT Dashboard Export":**
- ✅ Script tạo trong Google Ads account 806-163-1566
- ✅ Chạy thành công: 8 giây, 4 logs OK
- ✅ Export 3 tabs: DailyData (33 rows), Summary (45 rows), LandingPages (45 rows)
- ✅ Schedule: Daily 8:00 AM
- ✅ OAuth authorization hoàn thành
- **Fix quan trọng:** Thêm `campaign.status` vào SELECT của `exportLandingPages` (Google Ads API yêu cầu field trong WHERE phải có trong SELECT)

**Google Sheet:**
- ID: `1n-sXenl1sTZooMLJKDqj2xSkiJwde6B8vxqfHV8cFLY`
- URL: https://docs.google.com/spreadsheets/d/1n-sXenl1sTZooMLJKDqj2xSkiJwde6B8vxqfHV8cFLY/edit
- Sharing: **"Bất kỳ ai có đường liên kết — Người xem"** (public read)
- 3 tabs: DailyData, Summary, LandingPages
- Owner: myvivatourvn@gmail.com

**Dashboard (dashboard.html):**
- Phiên bản: v4.0 — standalone HTML, mở trực tiếp trong Chrome
- Fetch: JSONP (bypass CORS, hoạt động cả từ file://)
- Charts: Chart.js CDN
- 6 tabs: Tổng Quan, Campaigns Chi Tiết, Landing Pages, Biểu Đồ, ROI, Raw Data
- Features per-campaign: Score /100, 8 KPI với benchmark, xu hướng 7 ngày, Impression Share breakdown, landing pages per campaign, gợi ý tối ưu chi tiết, chart 30 ngày riêng
- Benchmarks ngành Travel: CTR >5%, CPC <50K₫, Conv Rate >3%, CPA <800K₫

## 7. CẦN LÀM TIẾP (theo thứ tự ưu tiên)

### A. Verify Dashboard Data
- Mở dashboard.html trong Chrome, kiểm tra tất cả 6 tabs hiển thị data đúng
- Đặc biệt kiểm tra tab "Landing Pages" và "Campaigns Chi Tiết"

### B. Google Ads Campaign 2: "MVT - Escape - Destination" (Prompt D)
Chưa tạo. Dùng PROMPT-D-FIXED.md:
- Budget: 500,000₫/ngày
- Max CPC: 65,000₫
- Keywords: Ha Long Bay tour, Hoi An travel, destination-based
- Account: 806-163-1566

### C. Google Ads Audiences & Bid Adjustments (Prompt F)
Chưa làm. Nội dung:
- Observation audiences (In-Market: Travel to Southeast Asia, Affinity: Travel Buffs)
- Location bid adjustments (Sydney +20%, Melbourne +15%, Brisbane +10%)
- Device bid adjustments (Mobile -10%)
- Ad schedule bid adjustments

### D. Dọn dẹp Google Ads Assets
- Xóa structured snippet sai: "Destinations: Viet Nam, Thai Lan, Laos..." (tên quốc gia, không phải thành phố)
- Xóa các bản snippet trùng lặp (có 2-3 bản duplicate)
- Bật lại sitelink "Contact Us" (đang bị tạm dừng)

### E. GTM Tag Verification
- Chạy GTM Preview mode kiểm tra tất cả tags fire đúng
- Verify: GA4 pageview, Google Ads conversion on form submit, Facebook Pixel

### F. Hoàn thiện landing pages còn lại
- Xây dựng nội dung cho honeymoon, family-tour, luxury-cruise
- Tối ưu SEO riêng cho từng trang
- Kết nối với myvivatour.com (internal linking)

### G. GitHub Secrets còn thiếu
- SUPABASE_URL: https://tnwelgvypmhhksqwnfmr.supabase.co
- SUPABASE_SERVICE_KEY: lấy từ Supabase Dashboard → Settings → API

## 8. Files quan trọng
| File | Mô tả |
|------|--------|
| `pages/escape/index.html` | Landing page chính (source, đầy đủ tracking + SEO) |
| `build.js` | Bundler: pages → worker.js |
| `worker.js` | Generated output (deploy to CF Workers) — KHÔNG SỬA |
| `worker.js.backup` | Bản cũ có Schema + GTM (tham khảo) |
| `dashboard.html` | **Campaign Dashboard v4** — HTML standalone, JSONP fetch, Chart.js |
| `google-ads-script.js` | **Google Ads Script** — export 3 tabs (Daily, Summary, LandingPages) |
| `mvt-campaign-dashboard.jsx` | Dashboard React (version cũ, có thể không dùng) |
| `PROMPT-GOOGLE-ADS-SCRIPT.md` | Prompt paste script vào Google Ads |
| `CAMPAIGN-MONITORING-GUIDE.html` | Static HTML guide KPI benchmarks |
| `CLAUDE-CODE-PROMPTS.md` | 6 prompts landing page (ĐÃ CHẠY XONG HẾT) |
| `Google-Ads-Strategy-MVT-Escape.docx` | Chiến lược Google Ads 14 mục |
| `GOOGLE-ADS-SETUP-PROMPTS.md` | 6 prompts setup Google Ads (A-F) |
| `PROMPT-C-FIXED.md` | Campaign 1 prompt (ĐÃ XONG) |
| `PROMPT-D-FIXED.md` | Campaign 2: Destination (CHƯA LÀM) |
| `PROMPT-E-FIXED.md` | Ad Extensions (ĐÃ XONG) |
| `reports/seo-audit-escape-20260405.html` | SEO audit chi tiết |
| `.github/workflows/deploy.yml` | CI/CD workflow |
| `wrangler.toml` | CF Workers config |

## 9. Lưu ý kỹ thuật
- `worker.js` là AUTO-GENERATED — **KHÔNG sửa trực tiếp**, sửa files trong `pages/*/` rồi chạy `node build.js`
- Google Ads account thực tế: **806-163-1566** (My Viva Tour), tiền tệ **VNĐ** (KHÔNG phải AUD)
- MCC account: 572-470-7852 (dùng để quản lý, không tạo campaign ở đây)
- GA4 property cho escape.myvivatour.com (property cũ là vietnamdentaltravel.com — khác site)
- Web3Forms access key dùng chung: cf0ca620-d064-4640-9454-afb27d588f67
- WhatsApp: +84974036614
- Google Sheet ID: `1n-sXenl1sTZooMLJKDqj2xSkiJwde6B8vxqfHV8cFLY`
- Dashboard dùng JSONP (không phải fetch) để bypass CORS khi mở từ file://
- Google Ads Script fix: field trong WHERE phải có trong SELECT (campaign.status)
- Google Ads Scripts URL hay bị 404 — navigate thủ công: Google Ads → Công cụ → Thao tác hàng loạt → Tập lệnh

## 10. Lưu ý khi dùng Claude in Chrome cho Google Ads
- Chrome extension sidebar hoạt động tốt, nhưng MCP connection từ Cowork thường bị lỗi
- Google Ads UI rộng → hay gặp lỗi "screenshot too large" — bảo Claude ignore và tiếp tục
- Luôn chỉ rõ account 806-163-1566 và currency VNĐ trong prompt
- Thêm "TẠO MỚI" và step-by-step click instructions vào prompt để tránh Claude tìm kiếm thay vì tạo
- Quy đổi budget: $50 AUD ≈ 800,000₫, $30 AUD ≈ 500,000₫
- Google Ads Scripts direct URL thường 404 → navigate từ menu: Công cụ → Thao tác hàng loạt → Tập lệnh
