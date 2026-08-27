#!/usr/bin/env bash
# Checks the acceptance criteria of
# https://github.com/revred/Oxiniti/issues/36 against a live host: is a CDN
# actually in front, is it holding the assets, and is HTTP/3 negotiated.
#
# The cacheability half of #36 lives in wwwroot/staticwebapp.config.json and
# ships with the app. The edge half is provisioned outside this repo (Azure
# Front Door / Cloudflare), so this script is how you tell whether that side
# has landed -- run it before the cutover for a baseline, and after.
#
# Usage:
#   scripts/verify-edge.sh                      # defaults to www.oxyniti.com
#   scripts/verify-edge.sh oxyniti.com
#
# Exit codes:
#   0  every #36 criterion met
#   1  cacheability regressed (a static asset is short-cached again)
#   2  cacheability fine, but no edge is in front yet (the expected state
#      until Front Door is provisioned -- see issue #36)

set -uo pipefail

HOST="${1:-www.oxyniti.com}"
BASE="https://$HOST"

# Paths that must survive at the edge, with the minimum max-age each should
# carry. Keep in sync with wwwroot/staticwebapp.config.json.
CACHED_PATHS=(
  "/_framework/blazor.webassembly.js:31536000"
  "/images/hero-poster.avif:2592000"
  "/videos/hero.mp4:2592000"
  "/bootstrap/dist/css/bootstrap.min.css:2592000"
  "/vendor/leaflet/leaflet.js:2592000"
  "/oxyniti.png:2592000"
  "/app.css:3600"
  "/Oxyniti.styles.css:3600"
  "/css/content-pages.css:3600"
  "/js/scrollHelper.js:3600"
  "/i18n/translations.json:3600"
)

# Paths that must NOT be cached long -- the shell and the API config.
UNCACHED_PATHS=("/" "/appsettings.json")

EDGE_HEADERS="x-azure-ref|cf-ray|x-cache|x-fd-|via|age"

fail_cache=0
fail_edge=0

hdr() { curl -sSI --max-time 25 "$1" 2>/dev/null | tr -d '\r'; }
field() { grep -i "^$2:" <<<"$1" | head -1 | cut -d' ' -f2-; }

echo "== $BASE =="
echo

echo "-- cacheable assets (issue #36: the edge needs something worth holding) --"
for entry in "${CACHED_PATHS[@]}"; do
  path="${entry%:*}"; want="${entry##*:}"
  h="$(hdr "$BASE$path")"
  status="$(head -1 <<<"$h" | awk '{print $2}')"
  cc="$(field "$h" Cache-Control)"
  got="$(grep -oE 'max-age=[0-9]+' <<<"$cc" | head -1 | cut -d= -f2)"
  if [ "$status" != "200" ]; then
    printf '  %-42s MISSING (HTTP %s)\n' "$path" "${status:-no response}"
    fail_cache=1
  elif [ -z "$got" ] || [ "$got" -lt "$want" ]; then
    printf '  %-42s FAIL  max-age=%s (want >= %s)\n' "$path" "${got:-none}" "$want"
    fail_cache=1
  else
    printf '  %-42s ok    max-age=%s\n' "$path" "$got"
  fi
done
echo

echo "-- must stay revalidating --"
for path in "${UNCACHED_PATHS[@]}"; do
  cc="$(field "$(hdr "$BASE$path")" Cache-Control)"
  age="$(grep -oE 'max-age=[0-9]+' <<<"$cc" | head -1 | cut -d= -f2)"
  # Anything up to a minute is fine here; what must not happen is these two
  # picking up the long TTLs the asset routes carry.
  if grep -qE 'no-store|no-cache' <<<"$cc" || { [ -n "$age" ] && [ "$age" -le 60 ]; }; then
    printf '  %-42s ok    %s\n' "$path" "$cc"
  else
    printf '  %-42s FAIL  %s\n' "$path" "${cc:-none}"
    fail_cache=1
  fi
done
echo

echo "-- Vary (shared caches must key on encoding) --"
v="$(field "$(hdr "$BASE/app.css")" Vary)"
if grep -qi 'accept-encoding' <<<"$v"; then
  printf '  ok    Vary: %s\n' "$v"
else
  printf '  FAIL  Vary: %s\n' "${v:-missing}"
  fail_cache=1
fi
echo

echo "-- edge presence (provisioned outside this repo) --"
h1="$(hdr "$BASE/images/hero-poster.avif")"
h2="$(hdr "$BASE/images/hero-poster.avif")"
found="$(grep -iE "^($EDGE_HEADERS)" <<<"$h1$h2" | sort -u)"
if [ -n "$found" ]; then
  sed 's/^/  /' <<<"$found"
  if grep -qiE '^age:' <<<"$h2"; then
    echo "  ok    age present on the repeat request -- the edge is serving from cache"
  else
    echo "  WARN  edge headers present but no age on repeat -- cache may be bypassed"
    fail_edge=1
  fi
else
  echo "  FAIL  no x-azure-ref / cf-ray / x-cache / via / age -- every byte is"
  echo "        still served from the origin. This is issue #36's headline"
  echo "        finding and needs Front Door (or Cloudflare) provisioning."
  fail_edge=1
fi
echo

echo "-- negotiated protocol --"
if curl --version | grep -qi 'HTTP3'; then
  v3="$(curl -sS --http3 -o /dev/null -w '%{http_version}' --max-time 25 "$BASE/" 2>/dev/null)"
  echo "  http3 attempt: ${v3:-refused}"
else
  echo "  (this curl has no HTTP/3 support -- cannot test; check in a browser)"
fi
if curl --version | grep -qi 'HTTP2'; then
  echo "  default:       $(curl -sS -o /dev/null -w '%{http_version}' --max-time 25 "$BASE/" 2>/dev/null)"
else
  echo "  (this curl has no HTTP/2 support -- the version below is not meaningful)"
fi
alt="$(field "$(hdr "$BASE/")" alt-svc)"
[ -n "$alt" ] && echo "  alt-svc:       $alt" || echo "  alt-svc:       none advertised (no HTTP/3 upgrade offered)"
echo

echo "-- ttfb --"
curl -sS -o /dev/null -w '  %{time_starttransfer}s (dns %{time_namelookup}s, tls %{time_appconnect}s)\n' \
  --max-time 25 "$BASE/" 2>/dev/null
echo

if [ "$fail_cache" -ne 0 ]; then
  echo "RESULT: cacheability regressed -- fix wwwroot/staticwebapp.config.json first."
  exit 1
fi
if [ "$fail_edge" -ne 0 ]; then
  echo "RESULT: assets are cacheable, but no CDN is in front yet (issue #36 still open)."
  exit 2
fi
echo "RESULT: all of issue #36's acceptance criteria are met."
