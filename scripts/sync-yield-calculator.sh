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
# After copying, site-specific patches are applied to index.html (each must
# match exactly once, or the script fails rather than ship a half-patched
# page):
#   1. <base href="/yield-calculator/"> -- every asset path in the page is
#      relative, so without it a visit to /yield-calculator (no trailing
#      slash) would resolve css/, js/ and data/ against the site root.
#   2. <link rel="canonical"> to the oxyniti.com URL, so search engines index
#      this copy rather than the GitHub Pages one.
#   3. The header logo links back to the oxyniti.com homepage.
#   4. oxyniti.com look: scripts/yield-calculator/site-theme.css is loaded
#      after the calculator's stylesheet, and the Google Fonts request drops
#      Sora/Manrope (the theme uses the site's Helvetica/Arial stack) but
#      keeps the Tamil faces.
#   5. The calculator's footer is replaced by scripts/yield-calculator/
#      site-footer.html (a copy of the site footer), keeping the calculator's
#      data-sources list above it -- the ODbL boundary data requires it.
# The theme, footer script and QR loader glue are copied to
# wwwroot/yield-calculator/site/; edit them in scripts/yield-calculator/.
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

# Empty the folder rather than delete it: on Windows a running `dotnet run`
# holds the directory itself open, and removing it fails.
mkdir -p "$DEST"
find "$DEST" -mindepth 1 -delete
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

patch_once '<link rel="stylesheet" href="css/styles.css" />' \
    '<link rel="stylesheet" href="css/styles.css" />
<link rel="stylesheet" href="site/site-theme.css" />' \
    "site theme"

patch_once 'family=Sora:wght@600;700;800&family=Manrope:wght@400;600;700;800&family=Catamaran' \
    'family=Catamaran' \
    "drop unused fonts"

SITE_SRC="$ROOT/scripts/yield-calculator"
mkdir -p "$DEST/site"
cp "$SITE_SRC/site-theme.css" "$SITE_SRC/site-footer.js" "$DEST/site/"

# Swap the footer: lift the calculator's <ul id="data-sources"> into the
# site footer template, then replace the whole <footer class="site-footer">.
FOOTER_TEMPLATE="$SITE_SRC/site-footer.html" perl -0pi -e '
    my @footers = /<footer class="site-footer">/g;
    die "error: patch \"site footer\" expected 1 calculator footer, found " . scalar(@footers) . "\n" unless @footers == 1;
    my ($sources) = /(<ul id="data-sources">.*?<\/ul>)/s or die "error: patch \"site footer\" found no data-sources list\n";
    open(my $fh, "<", $ENV{FOOTER_TEMPLATE}) or die "error: cannot read $ENV{FOOTER_TEMPLATE}\n";
    local $/; my $footer = <$fh>; close $fh;
    $footer =~ s/\{\{DATA_SOURCES\}\}/$sources/ or die "error: footer template has no {{DATA_SOURCES}}\n";
    s/<footer class="site-footer">.*?<\/footer>\n?/$footer/s;
' "$INDEX"

printf 'Source: %s\nCommit: %s\nSynced by scripts/sync-yield-calculator.sh -- do not edit files here by hand.\n' \
    "$REPO_URL" "$SHA" > "$DEST/SOURCE.txt"

echo "Synced $REPO_URL@$SHA into wwwroot/yield-calculator/"
