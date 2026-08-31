#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="${1:-$ROOT/media-source/drone_enhanced.mp4}"

if [[ ! -f "$SOURCE" ]]; then
    SOURCE="$ROOT/wwwroot/videos/drone_enhanced.mp4"
fi

if [[ ! -f "$SOURCE" ]]; then
    echo "Enhanced drone master not found." >&2
    exit 1
fi

VIDEO_DIR="$ROOT/wwwroot/videos"
IMAGE_DIR="$ROOT/wwwroot/images"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT
mkdir -p "$VIDEO_DIR" "$IMAGE_DIR"

# Desktop: protect the useful 16:10 centre, then synthesize only the outer
# 15% on each side from the same source frame. The extensions are mirrored,
# softened, motion-matched, blended with a low-frequency background and
# feathered into the untouched pond footage. Because the same deterministic
# transform is applied to every frame, water and aeration motion remain
# temporally coherent instead of exhibiting generative-video flicker.
DESKTOP_FILTER=$(cat <<'FILTER'
[0:v]split=2[bgsrc][fgsrc];
[bgsrc]scale=400:-2:flags=area,crop=400:160:0:(ih-160)*0.45,gblur=sigma=4:steps=1,scale=1600:640:flags=bicubic,eq=saturation=0.9:brightness=-0.04[bg];
[fgsrc]crop=iw:trunc(iw/1.6/2)*2:0:(ih-oh)*0.35,scale=1120:640:flags=lanczos,split=4[fgl][fgc][fgr][fgo];
[fgl]crop=160:640:0:0,hflip,scale=240:640:flags=lanczos,gblur=sigma=5:steps=1[left];
[fgr]crop=160:640:960:0,hflip,scale=240:640:flags=lanczos,gblur=sigma=5:steps=1[right];
[left][fgc][right]hstack=inputs=3[mir];
[mir][bg]blend=all_expr='B+(A-B)*if(lt(X,240),0.67,if(lt(X,340),0.67*(340-X)/100,if(lt(X,1260),0,if(lt(X,1360),0.67*(X-1260)/100,0.67))))'[base];
[fgo]format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='255*clip(min(X/72,(W-1-X)/72),0,1)'[fg_a];
[base][fg_a]overlay=x=240:y=0:format=auto:shortest=1,setsar=1,format=yuv420p[outv];
[outv]split=3[desktop_av1][desktop_vp9][desktop_h264]
FILTER
)
DESKTOP_FILTER="$(printf '%s' "$DESKTOP_FILTER" | tr '\n' ' ')"

ffmpeg -hide_banner -loglevel error -y \
    -i "$SOURCE" \
    -filter_complex "$DESKTOP_FILTER" \
    -map '[desktop_av1]' -an \
        -c:v libsvtav1 -preset 8 -crf 37 -g 60 -pix_fmt yuv420p \
        -svtav1-params 'tune=0' \
        -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
        "$WORK_DIR/drone-hero-v2-desktop-av1.webm" \
    -map '[desktop_vp9]' -an \
        -c:v libvpx-vp9 -b:v 0 -crf 36 -deadline good -cpu-used 4 \
        -row-mt 1 -tile-columns 2 -frame-parallel 1 -g 60 \
        -auto-alt-ref 1 -lag-in-frames 25 -pix_fmt yuv420p \
        -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
        "$WORK_DIR/drone-hero-v2-desktop-vp9.webm" \
    -map '[desktop_h264]' -an \
        -c:v libx264 -preset slow -crf 26 -profile:v high -level 4.1 \
        -pix_fmt yuv420p -g 60 -keyint_min 60 -sc_threshold 0 \
        -x264-params 'aq-mode=3:aq-strength=0.9:deblock=-1,-1' \
        -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
        -movflags +faststart \
        "$WORK_DIR/drone-hero-v2-desktop.mp4"

# Mobile: no generated extension is needed. Use a real 4:3 crop and 24 fps;
# on a small screen this saves about 25% without visible motion damage.
MOBILE_FILTER=$(cat <<'FILTER'
[0:v]crop=iw:trunc(iw/(4/3)/2)*2:0:(ih-oh)*0.36,scale=720:540:flags=lanczos,setsar=1,format=yuv420p,fps=24000/1001,split=3[mobile_av1][mobile_vp9][mobile_h264]
FILTER
)
MOBILE_FILTER="$(printf '%s' "$MOBILE_FILTER" | tr '\n' ' ')"

ffmpeg -hide_banner -loglevel error -y \
    -i "$SOURCE" \
    -filter_complex "$MOBILE_FILTER" \
    -map '[mobile_av1]' -an \
        -c:v libsvtav1 -preset 8 -crf 39 -g 48 -pix_fmt yuv420p \
        -svtav1-params 'tune=0' \
        -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
        "$WORK_DIR/drone-hero-v2-mobile-av1.webm" \
    -map '[mobile_vp9]' -an \
        -c:v libvpx-vp9 -b:v 0 -crf 38 -deadline good -cpu-used 4 \
        -row-mt 1 -tile-columns 1 -frame-parallel 1 -g 48 \
        -auto-alt-ref 1 -lag-in-frames 25 -pix_fmt yuv420p \
        -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
        "$WORK_DIR/drone-hero-v2-mobile-vp9.webm" \
    -map '[mobile_h264]' -an \
        -c:v libx264 -preset slow -crf 27 -profile:v high -level 3.1 \
        -pix_fmt yuv420p -g 48 -keyint_min 48 -sc_threshold 0 \
        -x264-params 'aq-mode=3:aq-strength=0.9:deblock=-1,-1' \
        -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
        -movflags +faststart \
        "$WORK_DIR/drone-hero-v2-mobile.mp4"

# The 6.5 s frame has the boat and active oxygen plume in the strongest
# composition. The WebP paints first; JPEG remains a small compatibility
# fallback for the responsive <picture> element.
ffmpeg -hide_banner -loglevel error -y \
    -ss 6.5 -i "$WORK_DIR/drone-hero-v2-desktop.mp4" -frames:v 1 \
    -c:v libwebp -quality 78 -compression_level 6 \
    "$WORK_DIR/drone-hero-v2-poster-desktop.webp"
ffmpeg -hide_banner -loglevel error -y \
    -ss 6.5 -i "$WORK_DIR/drone-hero-v2-desktop.mp4" -frames:v 1 \
    -q:v 4 "$WORK_DIR/drone-hero-v2-poster-desktop.jpg"
ffmpeg -hide_banner -loglevel error -y \
    -ss 6.5 -i "$WORK_DIR/drone-hero-v2-mobile.mp4" -frames:v 1 \
    -c:v libwebp -quality 78 -compression_level 6 \
    "$WORK_DIR/drone-hero-v2-poster-mobile.webp"
ffmpeg -hide_banner -loglevel error -y \
    -ss 6.5 -i "$WORK_DIR/drone-hero-v2-mobile.mp4" -frames:v 1 \
    -q:v 4 "$WORK_DIR/drone-hero-v2-poster-mobile.jpg"

python3 - "$WORK_DIR" <<'PY'
import json
import pathlib
import subprocess
import sys

work = pathlib.Path(sys.argv[1])
expected = {
    "drone-hero-v2-desktop-av1.webm": ("av1", 1600, 640, 2_000_000),
    "drone-hero-v2-desktop-vp9.webm": ("vp9", 1600, 640, 2_600_000),
    "drone-hero-v2-desktop.mp4": ("h264", 1600, 640, 2_900_000),
    "drone-hero-v2-mobile-av1.webm": ("av1", 720, 540, 1_150_000),
    "drone-hero-v2-mobile-vp9.webm": ("vp9", 720, 540, 1_450_000),
    "drone-hero-v2-mobile.mp4": ("h264", 720, 540, 1_550_000),
}

for name, (codec, width, height, max_bytes) in expected.items():
    path = work / name
    if not path.exists():
        raise SystemExit(f"missing output: {name}")
    size = path.stat().st_size
    if size > max_bytes:
        raise SystemExit(f"{name} is {size} bytes; budget is {max_bytes}")

    probe = subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=codec_name,width,height:format=duration",
        "-of", "json", str(path),
    ], text=True)
    data = json.loads(probe)
    stream = data["streams"][0]
    duration = float(data["format"]["duration"])
    if stream["codec_name"] != codec:
        raise SystemExit(f"{name}: expected {codec}, got {stream['codec_name']}")
    if (stream["width"], stream["height"]) != (width, height):
        raise SystemExit(f"{name}: expected {width}x{height}, got {stream['width']}x{stream['height']}")
    if not 8.80 <= duration <= 9.05:
        raise SystemExit(f"{name}: unexpected duration {duration}")

    audio = subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", "a",
        "-show_entries", "stream=index", "-of", "csv=p=0", str(path),
    ], text=True).strip()
    if audio:
        raise SystemExit(f"{name}: audio stream must be removed")

for name in ("drone-hero-v2-desktop.mp4", "drone-hero-v2-mobile.mp4"):
    data = (work / name).read_bytes()
    moov = data.find(b"moov")
    mdat = data.find(b"mdat")
    if moov < 0 or mdat < 0 or moov > mdat:
        raise SystemExit(f"{name}: moov atom is not before mdat (fast start failed)")

for name in (
    "drone-hero-v2-poster-desktop.webp",
    "drone-hero-v2-poster-desktop.jpg",
    "drone-hero-v2-poster-mobile.webp",
    "drone-hero-v2-poster-mobile.jpg",
):
    size = (work / name).stat().st_size
    if size > 100_000:
        raise SystemExit(f"{name} is {size} bytes; poster budget is 100000")

print("Validated responsive drone hero assets:")
for path in sorted(work.glob("drone-hero-v2-*")):
    print(f"  {path.name}: {path.stat().st_size} bytes")
PY

install -m 0644 "$WORK_DIR"/drone-hero-v2-desktop-av1.webm "$VIDEO_DIR/"
install -m 0644 "$WORK_DIR"/drone-hero-v2-desktop-vp9.webm "$VIDEO_DIR/"
install -m 0644 "$WORK_DIR"/drone-hero-v2-desktop.mp4 "$VIDEO_DIR/"
install -m 0644 "$WORK_DIR"/drone-hero-v2-mobile-av1.webm "$VIDEO_DIR/"
install -m 0644 "$WORK_DIR"/drone-hero-v2-mobile-vp9.webm "$VIDEO_DIR/"
install -m 0644 "$WORK_DIR"/drone-hero-v2-mobile.mp4 "$VIDEO_DIR/"
install -m 0644 "$WORK_DIR"/drone-hero-v2-poster-desktop.webp "$IMAGE_DIR/"
install -m 0644 "$WORK_DIR"/drone-hero-v2-poster-desktop.jpg "$IMAGE_DIR/"
install -m 0644 "$WORK_DIR"/drone-hero-v2-poster-mobile.webp "$IMAGE_DIR/"
install -m 0644 "$WORK_DIR"/drone-hero-v2-poster-mobile.jpg "$IMAGE_DIR/"

# These 480x500 encodes were made from the wrong derivative and must never be
# selected again after the enhanced-master variants exist.
rm -f "$VIDEO_DIR/drone.mp4" "$VIDEO_DIR/drone.webm"
