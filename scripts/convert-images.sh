#!/usr/bin/env bash
# Generates size-capped, modern-format image variants for wwwroot/images so
# new images don't regress into the "1.3 MB PNG at icon size" problem fixed
# in https://github.com/revred/Oxiniti/issues/31.
#
# Requires: ffmpeg built with --enable-libwebp and --enable-libaom (or any
# AV1 still-image encoder registered as an ffmpeg -c:v).
#
# Usage:
#   scripts/convert-images.sh icon  <src.png>  <box-px>        <out-basename>
#   scripts/convert-images.sh photo <src.jpg>  <w1x>x<h1x>     <out-basename>
#
# icon mode  -> <out>.png (resized, optimized) + <out>.webp
#               Two formats only: ffmpeg's libaom-av1 AVIF muxer cannot
#               encode an alpha channel (verified while building this
#               script -- it silently falls back to opaque yuv420p), and
#               these icons rely on transparency over a gradient card
#               background. WebP fully supports alpha and is losslessly
#               close in size to AVIF for flat/line art, so PNG+WebP is the
#               correct pair here instead of a broken AVIF.
#
# photo mode -> <out>.jpg + <out>.webp + <out>.avif at 1x, and the same
#               three again as <out>@2x.* at 2x (for srcset). Use the box
#               argument as the CSS *displayed* width x height -- this
#               script does not go above 2x that per the issue's
#               acceptance criteria ("no image more than 2x its display
#               size").
#
# Examples:
#   scripts/convert-images.sh icon  wwwroot/images/efficiency-src.png 160 wwwroot/images/efficiency
#   scripts/convert-images.sh photo wwwroot/images/unit-pondside-src.jpg 560x315 wwwroot/images/unit-pondside
#
# After running, wire the result into markup as a <picture> with the modern
# source(s) first and the fallback <img> (with explicit width/height and
# loading="lazy" for anything below the fold) last -- see
# Pages/Components/FieldFootageSection.razor and CoreBenefits.razor for the
# established pattern in this repo.

set -euo pipefail

mode="${1:-}"
src="${2:-}"
size="${3:-}"
out="${4:-}"

if [[ -z "$mode" || -z "$src" || -z "$size" || -z "$out" ]]; then
  echo "Usage:" >&2
  echo "  $0 icon  <src.png> <box-px>    <out-basename>" >&2
  echo "  $0 photo <src.jpg> <w>x<h>     <out-basename>" >&2
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found on PATH" >&2
  exit 1
fi

case "$mode" in
  icon)
    box="$size"
    scale="scale=${box}:${box}:flags=lanczos"
    ffmpeg -y -i "$src" -vf "$scale" -frames:v 1 -compression_level 9 -update 1 "${out}.png"
    ffmpeg -y -i "$src" -vf "$scale" -c:v libwebp -lossless 0 -quality 90 -frames:v 1 -update 1 "${out}.webp"
    echo "Wrote ${out}.png + ${out}.webp (${box}x${box})"
    ;;

  photo)
    w1x="${size%x*}"
    h1x="${size#*x}"
    w2x=$((w1x * 2))
    h2x=$((h1x * 2))

    for suffix in "" "@2x"; do
      if [[ "$suffix" == "@2x" ]]; then w="$w2x"; h="$h2x"; else w="$w1x"; h="$h1x"; fi
      scale="scale=${w}:${h}:flags=lanczos"
      ffmpeg -y -i "$src" -vf "$scale" -q:v 4 -frames:v 1 -update 1 "${out}${suffix}.jpg"
      ffmpeg -y -i "$src" -vf "$scale" -c:v libwebp -lossless 0 -quality 80 -frames:v 1 -update 1 "${out}${suffix}.webp"
      ffmpeg -y -i "$src" -vf "$scale" -c:v libaom-av1 -still-picture 1 -crf 32 -b:v 0 -cpu-used 6 -frames:v 1 "${out}${suffix}.avif"
    done
    echo "Wrote ${out}.{jpg,webp,avif} (${w1x}x${h1x}) and ${out}@2x.{jpg,webp,avif} (${w2x}x${h2x})"
    ;;

  *)
    echo "Unknown mode '$mode' (expected 'icon' or 'photo')" >&2
    exit 1
    ;;
esac
