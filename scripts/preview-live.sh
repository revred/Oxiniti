#!/usr/bin/env bash
# Builds the site the way the live deploy does and serves it locally, so a
# refresh behaves like oxyniti.com: marketing pages arrive prerendered (header,
# menu, hero, footer all in the HTML) instead of the logo-only pre-boot shell
# that `dotnet run` / `dotnet watch` shows while Blazor WASM boots.
#
# Mirrors the build steps of .github/workflows/azure-static-web-apps-deploy.yml
# (publish -> StaticSiteMeta -> Prerender -> StaticProductPages), then serves
# the output with the same fallback rule as wwwroot/staticwebapp.config.json:
# a real file wins, a folder serves its index.html, and any other route boots
# the app via /app-shell.html.
#
# No hot reload: re-run after each change. Day-to-day editing still uses
# `dotnet watch`; use this to check what visitors actually see.
#
# Usage:
#   scripts/preview-live.sh [--port 5190] [--skip-build] [--skip-products]
#     --skip-build      serve the last build again without rebuilding
#     --skip-products   skip StaticProductPages (it calls the live catalogue API)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT=5190
SKIP_BUILD=0
SKIP_PRODUCTS=0

while [ $# -gt 0 ]; do
    case "$1" in
        --port) PORT="$2"; shift 2 ;;
        --skip-build) SKIP_BUILD=1; shift ;;
        --skip-products) SKIP_PRODUCTS=1; shift ;;
        *) echo "Unknown option: $1" >&2; exit 2 ;;
    esac
done

PUBLISH="$ROOT/bin/Release/publish"
WWWROOT="$PUBLISH/wwwroot"
ROUTES="$ROOT/bin/Release/prerender-routes.json"

if [ "$SKIP_BUILD" -eq 0 ]; then
    echo "==> Publishing (Release)"
    rm -rf "$PUBLISH"
    dotnet publish "$ROOT/Oxyniti.csproj" -c Release -o "$PUBLISH" -nologo -v q

    echo "==> Generating sitemap.xml + prerender route list"
    dotnet run --project "$ROOT/tools/StaticSiteMeta/StaticSiteMeta.csproj" -c Release -- \
        --wwwroot "$WWWROOT" --repo-root "$ROOT" --routes-out "$ROUTES"

    echo "==> Prerendering marketing routes"
    dotnet build "$ROOT/tools/Prerender/Prerender.csproj" -c Release -nologo -v q
    dotnet run --project "$ROOT/tools/Prerender/Prerender.csproj" -c Release --no-build -- \
        --wwwroot "$WWWROOT" --routes "$ROUTES"

    if [ "$SKIP_PRODUCTS" -eq 0 ]; then
        echo "==> Generating static product pages"
        dotnet run --project "$ROOT/tools/StaticProductPages/StaticProductPages.csproj" -c Release -- \
            --wwwroot "$WWWROOT"
    fi
fi

if [ ! -f "$WWWROOT/app-shell.html" ]; then
    echo "No prerendered build at $WWWROOT -- run without --skip-build first." >&2
    exit 1
fi

echo "==> Serving $WWWROOT at http://localhost:$PORT  (Ctrl+C to stop)"
exec python -I - "$WWWROOT" "$PORT" <<'PY'
import http.server, os, sys

root, port = sys.argv[1], int(sys.argv[2])

# Same list as navigationFallback.exclude in staticwebapp.config.json: these
# 404 when missing instead of falling back to the app shell.
EXCLUDE_PREFIXES = ("/_framework/", "/images/", "/videos/", "/js/", "/css/", "/vendor/",
                    "/i18n/", "/bootstrap/", "/yield-calculator/")
EXCLUDE_FILES = {"/favicon.ico", "/robots.txt", "/sitemap.xml", "/llms.txt", "/app.css",
                 "/Oxyniti.styles.css", "/appsettings.json", "/oxyniti.png", "/icon-192.png"}

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      ".wasm": "application/wasm", ".avif": "image/avif", ".webp": "image/webp",
                      ".webm": "video/webm", ".mp4": "video/mp4", ".json": "application/json",
                      ".js": "text/javascript", ".svg": "image/svg+xml", ".woff2": "font/woff2"}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=root, **kwargs)

    def send_head(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        local = self.translate_path(path)
        if os.path.isfile(local) or os.path.isfile(os.path.join(local, "index.html")):
            return super().send_head()
        if path in EXCLUDE_FILES or path.startswith(EXCLUDE_PREFIXES):
            return super().send_head()  # plain 404
        self.path = "/app-shell.html"
        return super().send_head()

    def end_headers(self):
        # Always fetch fresh while previewing, so a rebuild shows on refresh.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
PY
