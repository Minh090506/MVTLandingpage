#!/usr/bin/env bash
#
# build-hero-loop.sh — turn raw travel footage into a web-optimized, muted,
# looping hero background video.
#
# Encodes to 1280x720 H.264 (yuv420p, +faststart for instant streaming start),
# strips audio (muted autoplay needs no audio track), and uses a high CRF because
# the clip renders at ~0.45 opacity behind text — visual detail is not critical,
# small file size is. Target: ~1-2 MB for a ~10-12s loop.
#
# Output is written into pages/<page>/images/ so the existing [upload-images] CI
# job uploads it to Supabase (landing-images/<page>/<file>.mp4). Raw source files
# stay in Google Drive and are never committed to the repo.
#
# Usage:
#   Single clip (trim from optional start offset):
#     scripts/build-hero-loop.sh single OUT.mp4 DURATION INPUT.mp4 [START]
#
#   Montage (equal slice of each input, hard-cut and concatenated):
#     scripts/build-hero-loop.sh montage OUT.mp4 SECS_PER_CLIP INPUT1.mp4 INPUT2.mp4 ...
#
# Examples:
#   scripts/build-hero-loop.sh single pages/escape/images/hero-halong-loop.mp4 12 "/path/Du Thuyen .mp4" 2
#   scripts/build-hero-loop.sh montage pages/happytours/images/hero-vietnam-montage.mp4 4 \
#       "/path/halong.mp4" "/path/hoian.mp4" "/path/danang.mp4"

set -euo pipefail

# 1280x720 cover-crop + normalize fps/sar so clips from different cameras concat cleanly
COVER="scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=30,setsar=1"
ENC=(-c:v libx264 -profile:v high -pix_fmt yuv420p -crf 30 -preset slow -movflags +faststart -an)

mode="${1:-}"
out="${2:-}"
[ -z "$mode" ] || [ -z "$out" ] && { echo "Usage: see header of $0"; exit 1; }
mkdir -p "$(dirname "$out")"

case "$mode" in
  single)
    dur="${3:?DURATION required}"; input="${4:?INPUT required}"; start="${5:-0}"
    ffmpeg -y -ss "$start" -i "$input" -t "$dur" -vf "$COVER" "${ENC[@]}" "$out"
    ;;

  montage)
    secs="${3:?SECS_PER_CLIP required}"; shift 3
    inputs=("$@")
    [ "${#inputs[@]}" -lt 2 ] && { echo "montage needs >= 2 inputs"; exit 1; }

    # Build a filter_complex that trims each input to SECS, cover-crops it, and
    # concatenates the segments end-to-end into one stream.
    args=(); filt=""; labels=""
    for i in "${!inputs[@]}"; do
      args+=(-i "${inputs[$i]}")
      filt+="[${i}:v]trim=0:${secs},setpts=PTS-STARTPTS,${COVER}[v${i}];"
      labels+="[v${i}]"
    done
    filt+="${labels}concat=n=${#inputs[@]}:v=1:a=0[out]"
    ffmpeg -y "${args[@]}" -filter_complex "$filt" -map "[out]" "${ENC[@]}" "$out"
    ;;

  *)
    echo "Unknown mode: $mode (expected 'single' or 'montage')"; exit 1;;
esac

size=$(du -h "$out" | cut -f1)
echo "✓ $out  (${size})"
echo "  Next: commit with [upload-images] flag, or run scripts/upload-to-supabase.js"
