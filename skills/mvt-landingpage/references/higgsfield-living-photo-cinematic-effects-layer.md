# Higgsfield Living-Photo & Cinematic Effects Layer (conversion LPs)

Premium motion layer for MVT conversion landing pages, built on **REAL company photos**
animated with Higgsfield image-to-video. Adds the internet-recognized "wow" patterns
(cinemagraph hero, living photo cards, ambient section motion) WITHOUT touching any
existing standard — CRO section order, tracking, Core Web Vitals, a11y all unchanged.

## Routing rule — which Higgsfield pipeline for which page (DECIDED 2026-07-17)

| Layer | Visual style | Pipeline | Skill |
|---|---|---|---|
| **Conversion LP** (sells a tour, has price + form) | Photoreal motion on REAL photos only | Living-photo (this file) | `mvt-landingpage` |
| Brand / education / heritage content | Stylized 3D diorama scroll-world | Diorama chain | `mvt-video-3d` + `scroll-world` |

> Anh Minh paused the diorama-on-conversion-LP direction (2026-07-17 15:06): stylized
> dioramas don't answer the $2,099 purchase question — that layer needs real photos,
> reviews, prices. Do NOT reintroduce diorama/stylized AI imagery into a conversion LP.
> AI here only ANIMATES real photography; it never invents the scene.

## Pattern catalog (recognized patterns → what implements them)

Grounded in 2026 landing-page trend research (Moburst, Figma trends, Lovable scrolling
patterns, sitesplaced "Best Landing Pages 2026", cinemagraph engagement studies):

| # | Recognized pattern | Implementation | Cost |
|---|---|---|---|
| 1 | Cinematic looping hero video (muted, autoplay, ~≤2MB) | Already standard (img-first + video-on-play, `build-hero-loop.sh` from real footage). Higgsfield only when NO landscape footage exists: animate the 1920×743 banner photo | 0 or 45–90 cr |
| 2 | **Cinemagraph / living photo** (subtle motion: water, smoke, fabric, light — 5–10× engagement vs static) | Higgsfield seedance image-to-video, `--start-image` = `--end-image` = the SAME real photo → perfect loop. THE core technique of this layer | 45 cr / 5s / image |
| 3 | Parallax depth layers | CSS/JS only — existing `.hero-parallax-layer` (0.3×, desktop-only). No AI needed | 0 |
| 4 | Scroll-driven reveals / storytelling | CSS/JS only — existing `.section-reveal` + stagger + count-up. No AI needed | 0 |
| 5 | Kinetic / editorial typography (accent word reveals) | CSS only (`clip-path`/`background-clip` word highlight in H2). Optional polish | 0 |
| 6 | Ambient section background motion (dark trust/highlights sections) | Living-photo loop at low opacity behind the existing dark overlay | 45 cr |

Patterns 3–5 are already covered by `scroll-animations-and-premium-polish-patterns.md`.
This file adds ONLY the Higgsfield-powered ones (1, 2, 6). Never stack more than one
moving element in the same viewport region — motion competes with the CTA.

## The perfect-loop recipe (core technique)

Seedance accepts both `--start-image` and `--end-image`. Passing the **same real photo
as both** frame-locks the loop: last frame ≈ first frame → seamless infinite loop, no
crossfade hack needed.

```bash
higgsfield generate create seedance_2_0 \
  --prompt "$(cat motion_prompt.txt)" \
  --start-image dest-halong.jpg --end-image dest-halong.jpg \
  --mode std --resolution 1080p --aspect_ratio 16:9 --duration 5 \
  --wait --timeout 15m --json
```

- Source photo MUST be from the company library (`Banner Tours (1920x743)` webp) or the
  photo already live on the LP (Supabase). Never a generated image.
- All CLI gotchas from `mvt-video-3d` SKILL.md apply verbatim: local file paths only
  (never job IDs), `--json` returns an ARRAY, `generate wait --timeout`, max 8
  concurrent seedance jobs, NSFW false-positives on "pool/bed/swim/waterfall" wording,
  create-fail = no credits lost. Run `higgsfield generate cost` FIRST — prices drift.
- Measured 2026-07-17: seedance_2_0 1080p 5s = **45 cr**, 10s = **90 cr**;
  `seedance_2_0_mini` ≈ ¼ (use as draft tier to approve motion direction cheaply,
  re-render keepers on standard).
- **Budget gate (mandatory):** estimate total BEFORE generating; > 70% of
  `higgsfield workspace list` balance → stop, ask user. Always get user approval of
  the shot list + cost before the first video credit is spent.

### Motion prompt template

```
Cinemagraph, photorealistic living photo. The scene is this exact photograph —
do not change composition, colors, subjects, or add ANY new people, objects or text.
Camera locked (or: imperceptible slow push-in, under 3%).
Only these elements move, subtly and continuously: <MOTION VOCABULARY>.
Everything else stays perfectly still. Natural speed, gentle, loopable.
In the final second the frame settles to exactly match the end image.
No text, no letters, no logos, no watermarks.
```

Motion vocabulary by subject (subtle = premium; big motion = cheap):

| Subject | Move ONLY |
|---|---|
| Ha Long Bay / cruise | water shimmer + ripples, boats ANCHORED bobbing gently (never traveling), clouds creep |
| Hoi An lanterns | lantern glow pulse + gentle sway, river reflections |
| Mekong Delta | palm fronds sway, water ripples around sampan, light dapple |
| Hanoi street / cyclo | leaves flutter, steam from street food, soft light shift |
| Temple / incense | incense smoke curl (classic cinemagraph), flag flutter |
| Rice fields / countryside | wind waves through crops, clouds |

Avoid animating faces/people walking (uncanny + NSFW-filter bait). If people are in
frame, keep them still ("people remain motionless") and move environment only.

### Gotchas measured on the first escape draft run (2026-07-17, seedance_2_0_mini)

- Mini 5s = **12.5 cr/clip** (`--generate-audio false` doesn't change price). 720p tier
  outputs ~1110px wide. Loop RMSE with start=end same photo: 16–21 — clean, no
  crossfade needed.
- `--aspect_ratio auto` snaps to the NEAREST supported ratio (3:2 photo → 4:3 canvas,
  1920×743 banner → 21:9), which reframes the shot. For finals, **pre-crop the source
  photo to the exact target AR yourself** (ffmpeg/magick center-crop, keep any watermark
  fully inside the crop) so poster↔video framing matches and nothing gets clipped.
- **Motion physics logic (user feedback 2026-07-17 — viewers catch this INSTANTLY)**:
  letting vehicles/boats "drift" makes the model move them too fast, sideways, or
  AGAINST the direction their bow/nose faces — reads as fake and kills trust. Rule:
  vehicles and vessels in a cinemagraph are **anchored/parked — bobbing or idling in
  place only, never traveling**. Prompt clauses that work: "boats are anchored, stay in
  place, only bobbing very gently; no boat travels, no boat moves sideways, no vessel
  moves against the direction it faces; no wakes appear". Reserve traveling motion for
  real footage. Also: don't force humans motionless in a scene where stillness looks
  unnatural (street scene with standing people read as frozen mannequins) — prefer
  photos without prominent people, or accept the scene isn't cinemagraph material.
- **Text morphs**: any lettering in frame (shop signs, baked-in MVT watermark) gets
  redrawn slightly garbled, and the model can hallucinate ghost text/icons in empty
  corners. Mitigations: add to prompt "keep all lettering, signage and the logo
  watermark pixel-identical to the photograph; do not add any text, icons or watermarks
  anywhere, especially in corners"; prefer source photos WITHOUT baked-in text; always
  eyeball first/mid/last frames at 100% around text regions before shipping; re-roll
  offenders (create-fail and rejected drafts cost nothing extra beyond the clip).

## Integration patterns (standards-preserving)

### A. Living destination card (generalizes the proven hero img-first pattern)

Poster `<img>` paints first (LCP/CLS safe), video fades in only after it actually plays:

```html
<div class="dest-card-media" style="aspect-ratio: 3/2">
  <img src="https://…/landing-images/{page}/dest-halong.jpg" alt="Ha Long Bay cruise …"
       loading="lazy" decoding="async" width="600" height="400">
  <video class="living-photo" muted loop playsinline preload="none" aria-hidden="true"
         data-src="https://…/landing-images/{page}/live-dest-halong.mp4"
         onplaying="this.parentElement.classList.add('lp-on')"></video>
</div>
```

```css
.dest-card-media { position: relative; overflow: hidden; }
.dest-card-media img, .dest-card-media .living-photo {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.living-photo { opacity: 0; transition: opacity .8s ease; }
.dest-card-media.lp-on .living-photo { opacity: 1; }
@media (prefers-reduced-motion: reduce) { .living-photo { display: none; } }
```

```js
// Lazy-load + play in viewport, pause offscreen (battery/data). Skip on Save-Data.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches
    && !(navigator.connection && navigator.connection.saveData)) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(()=>{}); }
    else v.pause();
  }), { rootMargin: '120px' });
  document.querySelectorAll('video.living-photo').forEach(v => io.observe(v));
}
```

### B. Ambient section background (Why-MVT / Highlights dark sections)

Same markup at section level, video behind the existing dark overlay at
`opacity: ~0.35` (`.lp-on` target). The overlay + text contrast tokens stay untouched —
copy readability is the existing standard, motion sits *under* it.

### C. Hero (only when real landscape footage is missing)

Existing hero pattern unchanged (`hero-bg-img` + `hero-bg-video` + `hero-video-on`).
Higgsfield just becomes an alternative SOURCE for the loop when the video library has
no usable 16:9 clip: animate the hero banner photo (10s, 90 cr), then encode through
`scripts/build-hero-loop.sh` as usual.

### Hard rules (unchanged standards — verify each)

- Poster `<img>` always present and always the LCP candidate; video `preload="none"`,
  never `fetchpriority`. Hero keeps `fetchpriority="high"` on the IMG only.
- `muted loop playsinline` mandatory (mobile autoplay); `aria-hidden="true"` +
  no alt-needed (video is decorative — the img carries the alt).
- `prefers-reduced-motion: reduce` → video hidden, poster stays. Save-Data → no load.
- Explicit `aspect-ratio` (or width/height) on the wrapper → CLS = 0.
- File budgets: hero loop ≤ 2MB target; card loop ≤ 1MB; anything > 10,000,000 bytes
  is REJECTED by the Supabase bucket. Verify with `ls -l` before `[upload-images]`.
- Max 2–3 living photos per page v1 (the featured cards), not all 6 — restraint reads
  premium, and total added weight stays < 3MB lazy-loaded.
- Audit gates unchanged: `hasHorizontalScroll=false`, consoleErrors=[], FCP < 2500ms,
  tracking 5 IDs. Living photos must not regress any of them (they load lazy + muted).

### Encode (autoplay loop — NOT scrub; normal GOP is fine)

```bash
ffmpeg -i raw.mp4 -an -vf "scale=960:-2" -c:v libx264 -preset slow -crf 26 \
  -pix_fmt yuv420p -movflags +faststart live-dest-{name}.mp4   # card: ~0.5–1MB
ffmpeg -i raw.mp4 -an -vf "scale=1280:-2" -c:v libx264 -preset slow -crf 25 \
  -pix_fmt yuv420p -movflags +faststart live-hero-{name}.mp4   # hero/ambient: ~1.5–2MB
```

Name convention: `live-{original-image-name}.mp4` in `pages/{page}/images/` →
`[upload-images]` → verify curl 200 BEFORE committing HTML (broken-media window rule).

### Loop QA

- RMSE first vs last frame (same trick as scroll-world seams): extract both with
  ffmpeg, compare; > ~40 → visible pop at loop point → re-roll or add 6-frame
  crossfade via ffmpeg `xfade` fallback.
- Watch 3 full loops: no drift, no morphing of still elements, no ghost people.
- On-page: DevTools Network confirms video only loads when card nears viewport;
  toggle reduced-motion → poster only.

## Escape LP theme spec ("Escape from Australia")

Theme narrative: **escape the everyday → golden Vietnam**. Motion mood = calm, warm,
golden-hour; slow water/light/smoke — mirrors the "relaxed all-inclusive holiday"
promise for the AU 35–65 demo. Never fast/energetic motion (reads as effort, not escape).

Source photos = the live escape assets (real photography, already on Supabase):

| Slot | Source photo | Motion | Dur | Cost |
|---|---|---|---|---|
| Dest card #1 (featured) | `dest-halong.jpg` | water shimmer, boat drift, clouds | 5s | 45 |
| Dest card #2 | `dest-hoian.jpg` | lantern glow pulse + sway, river reflection | 5s | 45 |
| Dest card #3 | `dest-mekong.jpg` | palm sway, ripples around sampan | 5s | 45 |
| Ambient bg — Why-MVT section | `why-trust-banner.jpg` | slow light shift, subtle foliage | 5s | 45 |
| Hero | — SKIP: real-footage `hero-halong-loop.mp4` already live | — | — | 0 |

Core pack: **135 cr** (3 cards) · Full pack: **180 cr** (~10% of current balance).
Draft pass on `seedance_2_0_mini` first (~45 cr total) to approve motion direction,
then re-render approved slots on standard. Hero and remaining cards (hanoi, hcmc)
stay static — restraint rule above.

Gallery/testimonial images stay static (grid of 8 moving tiles = carnival, not luxury).
