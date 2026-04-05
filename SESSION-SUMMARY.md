# SESSION SUMMARY — MVT Landing Page Project
> Ngày: 5/4/2026 | Dùng để paste vào session mới cho continuity

---

## 1. Dự án gì?
Hệ thống multi-landing-page cho công ty du lịch **myvivatour.com** (target thị trường Úc). Repo: https://github.com/Minh090506/MVTLandingpage

## 2. Kiến trúc hệ thống
- **Build pipeline:** `pages/*/index.html` → `build.js` → `worker.js` (embedded HTML + routing)
- **Hosting:** Cloudflare Workers (domain: escape.myvivatour.com)
- **Image CDN:** Supabase Storage (bucket: landing-images, project: tnwelgvypmhhksqwnfmr)
- **Form:** Web3Forms API (key: cf0ca620-d064-4640-9454-afb27d588f67)
- **CI/CD:** GitHub Actions → auto build + deploy khi push to main

## 3. Landing pages hiện có
| Page | Path | Status |
|------|------|--------|
| Escape Australia 10-Day Vietnam | `/` (root) | ✅ Live, 146KB |
| Vietnam Honeymoon Package | `/honeymoon` | Placeholder |
| Vietnam Family Tour | `/family-tour` | Placeholder |
| Luxury Vietnam Cruise | `/luxury-cruise` | Placeholder |

## 4. Tracking IDs (ĐÃ CÓ ĐẦY ĐỦ)
| Tracking | ID |
|---|---|
| GTM Container | `GTM-TPQWV864` |
| GA4 Measurement | `G-LKDCCNJMP3` (Stream: 14312720580) |
| Google Ads Conversion ID | `AW-17709107883` |
| Google Ads Conversion Label | `Wq0ECKXBmfsbEKuVrvxB` |
| Google Ads Customer ID | `572-470-7852` (MCC ocid: 7771865759) |
| Facebook Pixel | `579298288600609` (Business: 623339086973908) |

## 5. GitHub Secrets (ĐÃ SET)
- `CLOUDFLARE_API_TOKEN` ✅
- `CLOUDFLARE_ACCOUNT_ID` ✅ (ff289b31351913173cd7d52c4396ed8e)
- `SUPABASE_URL` — chưa set
- `SUPABASE_SERVICE_KEY` — chưa set

## 6. Đã làm xong
- ✅ Clone repo, tạo cấu trúc multi-page (pages/escape, honeymoon, family-tour, luxury-cruise)
- ✅ Tạo build.js bundler (auto-discover pages, generate routing, sitemap, robots.txt, 404)
- ✅ Tạo GitHub Actions workflow (.github/workflows/deploy.yml)
- ✅ Tạo script upload-to-supabase.js
- ✅ Phân tích SEO escape.myvivatour.com (report tại reports/seo-audit-escape-20260405.html)
- ✅ Tạo 6 Claude Code prompts (CLAUDE-CODE-PROMPTS.md) — IDs đã điền sẵn
- ✅ Thu thập tất cả tracking IDs (GTM, GA4, Google Ads, Facebook Pixel)
- ✅ Deploy worker.js lên Cloudflare Workers (v: 67bf2dad-56b5-4ee6-a22c-4a0400e50639)
- ✅ Claude Code đã chạy Prompt 6 (build + push + deploy thành công)

## 7. CẦN LÀM TIẾP (theo thứ tự ưu tiên)

### A. Chạy Claude Code prompts (trong Terminal):
```bash
cd ~/Projects/MVTLandingpage
claude --dangerously-skip-permissions
```
Các prompts cần chạy (copy từ CLAUDE-CODE-PROMPTS.md):
1. **Prompt 1** — Cài tracking (GTM + GA4 + Google Ads + Facebook Pixel) ⚠️ QUAN TRỌNG NHẤT
2. **Prompt 2** — Sync structured data + meta keywords từ worker.js.backup
3. **Prompt 5** — AI SEO nâng cao (AggregateRating, Review Schema, Speakable)
4. **Prompt 3** — Floating WhatsApp button + sticky CTA + exit-intent popup
5. **Prompt 4** — Tối ưu form 2 bước + social proof + urgency
6. **Prompt 6** — Build + commit + push + deploy (chạy SAU mỗi prompt trên)

### B. Setup Google Ads campaign:
- Tạo conversion action trong GTM dùng AW-17709107883/Wq0ECKXBmfsbEKuVrvxB
- Tạo GA4 tag trong GTM dùng G-LKDCCNJMP3
- Setup Google Ads Search campaign targeting "Vietnam tour from Australia"
- Chiến lược 6 campaigns đã outline trong SEO audit report

### C. Thiết lập GTM tags:
Trong Google Tag Manager (GTM-TPQWV864), tạo:
- Tag: GA4 Configuration (G-LKDCCNJMP3)
- Tag: Google Ads Conversion (AW-17709107883/Wq0ECKXBmfsbEKuVrvxB)
- Tag: Facebook Pixel (579298288600609)
- Triggers: Form Submit, Page View, CTA Click

### D. Hoàn thiện landing pages còn lại:
- Xây dựng nội dung cho honeymoon, family-tour, luxury-cruise
- Tối ưu SEO riêng cho từng trang
- Kết nối với myvivatour.com (internal linking)

### E. GitHub Secrets còn thiếu:
- SUPABASE_URL: https://tnwelgvypmhhksqwnfmr.supabase.co
- SUPABASE_SERVICE_KEY: lấy từ Supabase Dashboard → Settings → API

## 8. Files quan trọng
| File | Mô tả |
|------|--------|
| `pages/escape/index.html` | Landing page chính (source) |
| `build.js` | Bundler: pages → worker.js |
| `worker.js` | Generated output (deploy to CF Workers) |
| `worker.js.backup` | Bản cũ có đầy đủ Schema + GTM (tham khảo) |
| `CLAUDE-CODE-PROMPTS.md` | 6 prompts với IDs đã điền sẵn |
| `reports/seo-audit-escape-20260405.html` | SEO audit chi tiết + Google Ads strategy |
| `.github/workflows/deploy.yml` | CI/CD workflow |
| `wrangler.toml` | CF Workers config |
| `SETUP-SECRETS.md` | Hướng dẫn setup GitHub Secrets |

## 9. Lưu ý kỹ thuật
- `worker.js` là AUTO-GENERATED — **KHÔNG sửa trực tiếp**, sửa files trong `pages/*/` rồi chạy `node build.js`
- `worker.js.backup` chứa structured data + GTM code mà `pages/escape/index.html` ĐANG THIẾU — Prompt 2 sẽ fix
- GA4 property mới tạo cho escape.myvivatour.com, property cũ là cho vietnamdentaltravel.com (khác site)
- Web3Forms access key dùng chung: cf0ca620-d064-4640-9454-afb27d588f67
- WhatsApp: +84974036614
