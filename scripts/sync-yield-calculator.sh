#!/usr/bin/env bash
# Copies the standalone yield and profit calculator
# (https://github.com/vivian4fb/oxyniti-yield-calc) into
# wwwroot/yield-calculator/, served as-is at https://www.oxyniti.com/yield-calculator/.
#
# The calculator is plain HTML/CSS/JS with its own model tests and a Python
# oracle; it is copied rather than ported to Razor so those tests keep
# covering exactly the code that ships. Never hand-edit the copied files --
# change the calculator repo, then re-run this script with the new commit.
#
# Usage:
#   scripts/sync-yield-calculator.sh [<commit-sha>]   (default: the pinned REF below)
#
# After copying, three site-specific patches are applied to index.html (each
# must match exactly once, or the script fails rather than ship a half-patched
# page):
#   1. <base href="/yield-calculator/"> -- every asset path in the page is
#      relative, so without it a visit to /yield-calculator (no trailing
#      slash) would resolve css/, js/ and data/ against the site root.
#   2. <link rel="canonical"> to the oxyniti.com URL, so search engines index
#      this copy rather than the GitHub Pages one.
#   3. The header logo links back to the oxyniti.com homepage.
set -euo pipefail

REPO_URL="https://github.com/vivian4fb/oxyniti-yield-calc.git"
REF="${1:-e1e154ebe6a6fbc65b553613b5dfbf4667ce7efe}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/wwwroot/yield-calculator"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

git clone --quiet "$REPO_URL" "$TMP/calc"
git -C "$TMP/calc" checkout --quiet "$REF"
SHA="$(git -C "$TMP/calc" rev-parse HEAD)"

rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$TMP/calc/site/." "$DEST/"
# The calculator's own README documents its GitHub Pages deployment; it is
# not part of the page and should not be served from oxyniti.com.
rm -f "$DEST/README.md"

INDEX="$DEST/index.html"

patch_once() {
    local needle="$1" replacement="$2" label="$3"
    local count
    count="$(grep -cF -- "$needle" "$INDEX" || true)"
    if [ "$count" != "1" ]; then
        echo "error: patch '$label' expected 1 match for: $needle (found $count)" >&2
        exit 1
    fi
    NEEDLE="$needle" REPLACEMENT="$replacement" perl -0pi -e 's/\Q$ENV{NEEDLE}\E/$ENV{REPLACEMENT}/' "$INDEX"
}

patch_once '<meta charset="utf-8" />' \
    '<meta charset="utf-8" />
<base href="/yield-calculator/" />' \
    "base href"

patch_once '<link rel="icon" type="image/svg+xml" href="assets/favicon.svg" />' \
    '<link rel="canonical" href="https://www.oxyniti.com/yield-calculator/" />
<link rel="icon" type="image/svg+xml" href="assets/favicon.svg" />' \
    "canonical"

patch_once '<img src="assets/logo-mark.svg" alt="" width="38" height="38" />' \
    '<a href="/" aria-label="Oxyniti home"><img src="assets/logo-mark.svg" alt="" width="38" height="38" /></a>' \
    "logo home link"

printf 'Source: %s\nCommit: %s\nSynced by scripts/sync-yield-calculator.sh -- do not edit files here by hand.\n' \
    "$REPO_URL" "$SHA" > "$DEST/SOURCE.txt"

echo "Synced $REPO_URL@$SHA into wwwroot/yield-calculator/"
