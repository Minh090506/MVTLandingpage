# Hero Video — Session Handoff (resume sau khi restart Terminal)

**Date:** 2026-06-05 09:32 · **Branch:** main · **Lý do dừng:** chờ cấp Full Disk Access cho Terminal → cần restart app.

## Mục tiêu
Thêm hero background video (footage thật từ Google Drive) vào `escape` + `happytours` để tăng độ chuyên nghiệp/conversion.

## ✅ ĐÃ LÀM (code xong, không cần asset — đã regression-safe)
- `pages/escape/index.html`: thêm CSS `.hero-bg-video` + `<video autoplay muted loop playsinline>` chồng lên poster img. Src: `landing-images/escape/hero-halong-loop.mp4`.
- `pages/happytours/index.html`: tương tự. Src: `landing-images/happytours/hero-vietnam-montage.mp4`.
- Pattern: img paint trước (FCP an toàn) → video fade-in khi `onplaying` (opacity 0→0.45). `prefers-reduced-motion` ẩn video. URL .mp4 hiện 404 → chỉ hiện poster = giống y như cũ, **0 regression**.
- `scripts/build-hero-loop.sh` (mới, chmod +x): ffmpeg → 1280x720 muted H.264 loop. Mode `single` + `montage`.
- `scripts/upload-to-supabase.js`: thêm `.mp4`/`.webm` vào extension set + MIME map.
- `node build.js` đã chạy → `worker.js` rebuilt, verify `hero-bg-video` x8, 2 src .mp4 OK.
- Memories: `marketing-asset-library-google-drive`, `hero-video-pipeline` (+ MEMORY.md index).

**Chưa commit gì** — toàn bộ thay đổi đang ở working tree.

## ⏳ CẦN LÀM session sau (sau khi user nói "granted")
1. **Verify FDA OK:** `ls "~/Library/CloudStorage/GoogleDrive-nguyenducminh85bk@gmail.com/Shared drives/Marketing/MY VIVA TOUR"` — nếu hết "Operation not permitted" là xong.
2. **Chọn clip:** browse `MVT_Kho video/Kho video (theo địa điểm)/`:
   - Escape (Ha Long cruise): folder `Ha Long Bay` — candidate `Du Thuyen .mp4`, `ha long.mp4`, `Ha Long_2.mp4`. ffprobe chọn clip landscape, mượt, ~10-15s.
   - Happytours (montage): ghép 3 clip từ `Ha Long Bay` + `Hoi An` + (`Da Nang` hoặc `Mekong Delta`), ~4s/clip.
3. **Encode:**
   - `scripts/build-hero-loop.sh single pages/escape/images/hero-halong-loop.mp4 12 "<drive>/Ha Long Bay/<clip>.mp4" <start>`
   - `scripts/build-hero-loop.sh montage pages/happytours/images/hero-vietnam-montage.mp4 4 "<halong>" "<hoian>" "<danang>"`
4. **Verify size** ~1-2MB/clip; xem thử local nếu cần.
5. **Confirm với user** rồi commit `[upload-images]` → CI upload Supabase → live. (Đừng push prod khi chưa confirm.)
6. **Sau deploy:** verify URL 200 + chạy puppeteer audit (FCP mobile <2500ms, no console error).

## Gotchas (đã ghi memory)
- CLI bị macOS TCC chặn đọc CloudStorage tới khi cấp **Full Disk Access** → **phải restart Terminal app** mới có hiệu lực. `dangerouslyDisableSandbox` KHÔNG bypass được (đây là quyền OS, không phải sandbox Claude).
- Drive MCP `download_file_content` trả base64 vào context → KHÔNG dùng cho video nhiều MB.
- Không có Supabase key local → upload chạy qua CI (`[upload-images]` flag), không upload trực tiếp từ máy.
- Veo 3.1 KHÔNG cần cho 2 hero này (Drive đã có footage thật, tốt hơn). Chỉ dùng nếu sau này thiếu footage 1 địa điểm.

## Câu để mở lại session sau
> "granted — tiếp tục làm hero video cho escape + happytours theo handoff `plans/reports/hero-video-session-handoff-260605-0932-...`"

## Unresolved
- Chưa biết clip Hoi An / Da Nang / Mekong cụ thể nào đẹp nhất (cần ffprobe sau khi có FDA).
- Có muốn thêm `hero-vietnam-montage.jpg` poster riêng cho happytours không, hay giữ poster Ha Long chung (hiện đang dùng chung).
