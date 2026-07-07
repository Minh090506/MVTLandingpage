# LP Review — UI + SEO/GEO/AEO đề xuất cải thiện (escape · happytours · dental)

Date: 2026-07-07. Nguồn: static analysis 3 file HTML + live puppeteer audit (`/tmp/lp-audit-r7/`) + build.js review. Tất cả đề xuất — CHƯA implement.

## Trạng thái live (đã verify)

| Metric | escape | happytours | dental |
|---|---|---|---|
| FCP mobile | 868ms ✅ | 872ms ✅ | 1012ms ✅ |
| hScroll mobile | false ✅ | false ✅ | false ✅ |
| Console errors | 0 ✅ | 0 ✅ | 0 ✅ |
| Tracking 5 IDs | đủ ✅ | đủ ✅ | đủ ✅ |
| Schema types | 18 loại (đủ stack + speakable) ✅ | 17 loại ✅ | 12 loại, thiếu speakable ⚠️ |
| Meta desc | 134 chars (hơi ngắn) | **175 chars — vượt 160, bị cắt SERP** ❌ | **168 chars — vượt** ❌ |
| Title theo format rule | thiếu "Holiday"+"from Australia" ⚠️ | thiếu "Holiday"+"from Australia" ⚠️ | OK |
| H1 message-match | ✅ | ✅ | ❌ "Your Dream Smile in Vietnam" (brandy) |

Nền tảng SEO cả 3 trang đã tốt (schema stack đầy đủ, canonical, hreflang en-au, OG/Twitter, tracking sạch). Đề xuất dưới là tối ưu tầng trên.

## P1 — quick wins (sửa vài dòng, impact rõ)

1. **happytours meta description 175→≤160 chars** — hiện bị Google cắt cụt, mất CTA.
2. **dental meta description 168→≤160 chars** — tương tự.
3. **dental H1** → message-match keyword: `"Dental Implants in Vietnam — Save up to 80% vs Australia"`. H1 hiện tại không chứa primary keyword nào → yếu cả SEO lẫn Google Ads Quality Score. Giữ "Your Dream Smile" làm subtitle/tagline.
4. **`/llms.txt` route trong build.js** (GEO) — worker đã serve sitemap/robots, thêm 1 generator nữa: markdown ngắn liệt kê brand, 3 LP, tour + giá AUD, contact, canonical URLs. Chi phí ~30 dòng code, phủ cả 3 domain.

## P2 — nên làm đợt tới

5. **Sitemap lọc theo host** — `generateSitemap()` hiện liệt kê MỌI route trên MỌI host: `implant.vietnamdentaltravel.com/sitemap.xml` đang quảng bá `/escape`, `/happytours`... dưới domain nha khoa (cross-domain duplicate signal). Lọc theo HOST_DEFAULTS: host riêng chỉ list page của nó; host mặc định list phần còn lại.
6. **Cross-host duplicate serving** — mọi page truy cập được từ mọi host qua pathname (vd `implant.../escape` serve trang tour). Canonical đang cứu, nhưng nên 301 về đúng subdomain khi host mismatch (thêm ~10 dòng trong fetch handler).
7. **Title format compliance** (đổi title cần sync Google Ads copy — xem unresolved):
   - escape: `10-Day Vietnam Holiday from Australia $2,099 AUD | MyVivaTour 2026`
   - happytours: `Vietnam Holiday Packages from Australia $676 AUD | MyVivaTour 2026`
8. **dental thêm speakable + WebPage schema** (AEO) — escape/happytours đã có, dental chưa.
9. **dental FAQ 6→8 câu** theo Tier-4 pattern ("how much do dental implants cost in vietnam vs australia", "is dental work in vietnam safe for australians", "how long do I need to stay", "what happens if implant fails after I return home"). Câu đầu mỗi answer phải standalone 40–60 từ (answer-box extraction).
10. **dental schema mở rộng**: thêm `MedicalProcedure` (implant placement) + `priceRange` trên MedicalBusiness; cân nhắc `Dentist` entity cho surgeon credentials (Hanoi Medical University — đang chỉ là text).
11. **dental hero trust pill** — escape/happytours có TripAdvisor pill ngay dưới H1; dental chưa có review pill above-fold (stats card "500+ patients" nằm dưới CTA). Nếu có Google Reviews/Trustpilot listing → thêm pill cùng pattern.

## P3 — cân nhắc

12. **escape meta desc 134→~155 chars** — còn chỗ nhét thêm long-tail ("small group", "2026 departures").
13. **happytours hero 2 CTA cạnh tranh** — price pill `From $676 AUD →` styled như button + CTA `Choose My Vietnam Holiday` bên dưới, hơi lệch rule single-CTA của skill. Cân nhắc price pill thành badge tĩnh (không mũi tên, không hover).
14. **happytours og:image dùng chung ảnh escape** — đúng vì hero dùng cùng asset, nhưng share card 2 LP giống hệt nhau; nếu muốn phân biệt → chọn cover honeymoon/family riêng cho og:image.
15. **dental preconnect hints = 0** — hero không có ảnh LCP nên không gấp, nhưng thêm preconnect googletagmanager + connect.facebook.net là free win.
16. **robots.txt AI-bot lines** — allow-all hiện tại đã đủ; thêm explicit GPTBot/ClaudeBot/PerplexityBot chỉ mang tính tín hiệu, không bắt buộc.

## GEO/AEO chung cả 3 trang (checklist mới trong skill)

- Entity-rich first paragraph: đoạn body đầu tiên phải nêu operator + product + duration + giá + destinations trong ~50 từ (generative engines trích đoạn mở).
- Số liệu nhất quán tuyệt đối giữa visible copy / schema / OG (giá, duration, inclusions) — mâu thuẫn giết AI citation.
- FAQ answers first-sentence-standalone 40–60 từ — cần rà lại cả 3 trang, đặc biệt dental.

## Skill mvt-landingpage — ĐÃ cải thiện (committed vào file, chưa git commit)

1. Phase 3–4 viết lại theo pipeline chuẩn `build.js` + GitHub Actions + `[upload-images]` (workflow Edge-Function/paste-dashboard cũ hạ xuống fallback) — trước đó SKILL.md chứa 2 hướng dẫn mâu thuẫn.
2. Image spec JPEG→WebP (khớp chuẩn repo, ghi chú cwebp/ffmpeg gotcha).
3. Thêm section mới **"SEO / GEO / AEO Checklist"** — title format, schema stack bắt buộc, AEO (FAQ 40-60 từ, question-headings, speakable), GEO (entity-rich intro, llms.txt, AI-crawler robots).
4. Thêm hero-video pattern (img-first, video-on-play) vào section Hero.
5. Phase 1 collect-images trỏ vào kho Drive Marketing công ty (FDA gotcha) thay vì "ask user".
6. Phase 5 verify thêm audit-script gates + false-positive notes.

## Unresolved questions

1. Em implement luôn nhóm P1 (meta desc ×2, dental H1, llms.txt) chứ? Cần `node build.js` + push → auto-deploy.
2. Đổi title (P2-7) ảnh hưởng message-match với Google Ads đang chạy — anh muốn đổi cả ad copy đồng bộ hay giữ title hiện tại?
3. Dental là brand riêng (V-Dental Travel) — hero CTA trắng hiện tại giữ palette riêng hay theo hệ orange? Em nghiêng giữ palette riêng, chỉ cần thêm trust pill.
4. Dental có listing Google Reviews/Trustpilot thật không? Không có thì bỏ đề xuất #11.
