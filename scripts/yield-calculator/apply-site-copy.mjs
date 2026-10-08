// Bakes the site's visitor wording into the generated calculator markup, so the
// prerendered /yield-calculator page (what crawlers and first paint see) never
// carries the calculator's developer text. yieldCalculator.js applies the same
// COPY at runtime for the strings ui.js draws itself.
//
//   node scripts/yield-calculator/apply-site-copy.mjs <Pages/YieldCalculatorMarkup.g.cs>
//
// Fails loudly when anything it expects is missing, so a calculator update that
// renames a key or rewrites a source line is caught at sync time.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [, , file] = process.argv;
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "../..");
const { COPY } = await import(pathToFileURL(path.join(root, "wwwroot/js/yieldCalculatorCopy.js")).href);

let html = fs.readFileSync(file, "utf8");
const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function replaceOnce(pattern, replacement, what) {
    const matches = html.match(new RegExp(pattern.source, pattern.flags.replace("g", "") + "g"));
    if (!matches || matches.length !== 1) {
        throw new Error(`apply-site-copy: expected 1 match for ${what}, found ${matches ? matches.length : 0}`);
    }
    html = html.replace(pattern, replacement);
}

// 1. Site wording for every key the markup carries as plain text. Keys only
//    ui.js draws (warnings, banners, ...) are not in the markup; skip those.
//    A key can label several elements (both "Advanced" override hints).
for (const [key, text] of Object.entries(COPY)) {
    const pattern = new RegExp(`(<(\\w+)[^>]*\\sdata-i18n="${reEscape(key)}"[^>]*>)([^<]*)(</\\2>)`, "g");
    html = html.replace(pattern, (_, open, _tag, _old, close) => open + escape(text) + close);
}

// 2. Left out of the public page (see site-theme.css for the same list).
for (const [pattern, what] of [
    [/<p class="sensitivity-note"/, "sensitivity note"],
    [/<p data-i18n="method.sub"/, "method.sub"],
    [/<section id="season-section"/, "season section"],
    [/<section id="station-compare-section"/, "station comparison"],
    [/<section id="waterfall-section"/, "waterfall section"],
    [/<section id="assumptions-section"/, "assumptions section"],
]) {
    replaceOnce(pattern, (m) => m + " hidden", what);
}

// 3. Compact results card: the "+18%, not a guarantee" note moves out of
//    the card to small print under both cards, so the card is short enough
//    to stay pinned beside the inputs on a 125%-scaled laptop screen.
{
    const noteRe = /\s*<p class="ceiling-note" data-i18n="results.ceiling_note">[^<]*<\/p>/;
    const note = html.match(noteRe);
    if (!note) throw new Error("apply-site-copy: no ceiling note in the results card");
    html = html.replace(noteRe, "");
    replaceOnce(
        /(<button id="cta-report"[^\n]*\n\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/,
        (m) => m + "\n      " + note[0].trim().replace('class="ceiling-note"', 'class="ceiling-note yc-smallprint"'),
        "end of the calculator grid",
    );
}

// 4. Group headings in the long input card, before the first field of each
//    group. English only, like the rest of the site-side wording.
for (const [firstInput, heading] of [
    ["in-district", "Location &amp; species"],
    ["in-area_acre", "Pond details"],
    ["in-price_inr_kg", "Prices &amp; power"],
    ["in-unit_model", "Equipment"],
]) {
    const at = html.indexOf(`id="${firstInput}"`);
    if (at === -1) throw new Error(`apply-site-copy: no #${firstInput} for the "${heading}" group heading`);
    const field = html.lastIndexOf('<div class="field">', at);
    if (field === -1) throw new Error(`apply-site-copy: no field wrapper before #${firstInput}`);
    html = html.slice(0, field) + `<p class="yc-group">${heading}</p>\n          ` + html.slice(field);
}

// 5. Data sources: keep every source and link (the ODbL boundary data needs
//    its attribution), drop the model's status labels and internal pointers.
for (const [from, to] of [
    [", boundaryID IND-ADM2-76128533, under <strong>ODbL 1.0</strong>: attribution and share-alike apply to the boundary data.", ", licensed under <strong>ODbL 1.0</strong>."],
    ["Climate normals —", "Weather averages —"],
    [" — 2015 vintage, status ASSUMED.", "."],
    ['; whether an aerator qualifies as an "input" is NOT_FOUND, so the options are labelled UNTESTED.', "."],
    ["Uplift evidence —", "Research on oxygen and fish growth —"],
    [" Full list with statuses in the project README.", ""],
]) {
    replaceOnce(new RegExp(reEscape(from)), to, `data source text "${from.slice(0, 40)}..."`);
}

fs.writeFileSync(file, html);
