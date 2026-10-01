// Starts the yield calculator on /yield-calculator (Pages/YieldCalculator.razor).
// Imported by that page once Blazor has rendered it, and by marketingIslands.js
// on the prerendered static copy -- whichever runs first boots it, once.
//
// The calculator's files under /yield-calculator/ are the upstream calculator,
// unchanged (scripts/sync-yield-calculator.sh). Its classic scripts expect to be
// parsed with the page: ui.js starts from a DOMContentLoaded listener, which has
// long fired by the time a Blazor page renders. So this loads the stylesheets,
// then the scripts in their original order, catches the DOMContentLoaded
// listener ui.js registers, and calls it directly. Before that it lays the
// site's visitor wording (yieldCalculatorCopy.js) over the calculator's strings.
import { COPY, tidyText } from "./yieldCalculatorCopy.js";

const BASE = "/yield-calculator/";

const STYLES = [
    "vendor/leaflet/leaflet.css",
    "css/styles.scoped.css",
    "site/site-theme.css",
];

const SCRIPTS = [
    "vendor/leaflet/leaflet.js",
    "data/species.data.js",
    "data/climate.data.js",
    "data/hotspots.data.js",
    "data/tn_districts.data.js",
    "data/products.data.js",
    "data/economics.data.js",
    "data/coefficients.data.js",
    "js/i18n.js",
    "js/charts.js",
    "js/map.js",
    "js/model.js",
    "js/leads.config.js",
    "js/leads.js",
    "js/ui.js",
];

function loadStyle(href) {
    return new Promise((resolve, reject) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = BASE + href;
        link.onload = resolve;
        link.onerror = () => reject(new Error(`Failed to load ${link.href}`));
        document.head.appendChild(link);
    });
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = BASE + src;
        script.async = false;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load ${script.src}`));
        document.body.appendChild(script);
    });
}

function hasCopy(key) {
    return Object.prototype.hasOwnProperty.call(COPY, key);
}

// ui.js, leads.js and charts.js all read strings through window.OxyI18n.t,
// and ui.js paints the static labels through window.OxyI18n.applyTranslations
// -- so wrapping those two covers every string the calculator shows.
// setLang() repaints through i18n.js's own internal copy, hence the
// oxy:langchange hook.
function applySiteCopy() {
    const i18n = window.OxyI18n;
    if (!i18n) throw new Error("[yield-calculator] i18n.js did not define window.OxyI18n");

    const t = i18n.t;
    i18n.t = (key, fallback) => (hasCopy(key) ? COPY[key] : t(key, fallback));

    const paint = (root) => {
        (root || document).querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.getAttribute("data-i18n");
            if (hasCopy(key)) el.textContent = COPY[key];
        });
    };
    const applyTranslations = i18n.applyTranslations;
    i18n.applyTranslations = (root) => {
        applyTranslations(root);
        paint(root);
    };
    document.addEventListener("oxy:langchange", () => paint(document));
}

// Text the calculator draws from its data (option labels, the species panel,
// map popups) is tidied as it appears. tidyText is idempotent, so the
// observer's own edits settle after one pass.
//
// Result figures ("10–20 kg per crop  ·  25–50 kg per year") read better as
// two lines than as one that wraps mid-range; the separator becomes a line
// break there (site-theme.css renders it with white-space: pre-line).
function tidyNode(node) {
    let tidy = tidyText(node.nodeValue);
    if (node.parentElement && node.parentElement.classList.contains("band-value")) {
        tidy = tidy.replace(/\s+·\s+/g, "\n");
    }
    if (tidy !== node.nodeValue) node.nodeValue = tidy;
}

function tidyTree(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) tidyNode(node);
    const withTitles = root.nodeType === Node.ELEMENT_NODE
        ? [root, ...root.querySelectorAll("[title]")]
        : [];
    withTitles.forEach((el) => {
        const title = el.getAttribute && el.getAttribute("title");
        if (title) {
            const tidy = tidyText(title);
            if (tidy !== title) el.setAttribute("title", tidy);
        }
    });
}

function watchAndTidy(root) {
    tidyTree(root);
    new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.type === "characterData") {
                tidyNode(m.target);
            } else if (m.type === "attributes") {
                tidyTree(m.target);
            } else {
                m.addedNodes.forEach((n) => {
                    if (n.nodeType === Node.TEXT_NODE) {
                        tidyNode(n);
                    } else if (n.nodeType === Node.ELEMENT_NODE) {
                        tidyTree(n);
                    }
                });
            }
        }
    }).observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["title"] });
}

// Desktop: the estimate card is sticky (site-theme.css). When it is taller
// than the space under the header, a fixed `top` would pin its bottom --
// and the report button -- off screen, so the top is pulled up until the
// card's bottom sits just inside the viewport; scrolling back up still
// reveals its top as the column scrolls.
function pinResultsCard() {
    const card = document.getElementById("results-card");
    if (!card) return;
    const place = () => {
        if (!window.matchMedia("(min-width: 901px)").matches) { card.style.top = ""; return; }
        const header = document.querySelector(".site-header");
        const below = (header ? header.getBoundingClientRect().height : 88) + 20;
        card.style.top = Math.min(below, window.innerHeight - card.offsetHeight - 16) + "px";
    };
    new ResizeObserver(place).observe(card);
    window.addEventListener("resize", place);
    place();
}

// Phones (site-theme.css shows it at <= 900px): a bottom bar with the
// per-year harvest range and the report button, on while the estimate card
// is still below the screen -- i.e. while the visitor is on the map or the
// inputs -- and off once the card itself is in view, or the form is open.
function mountMobileBar(root) {
    const harvest = document.getElementById("res-harvest");
    const card = document.getElementById("results-card");
    const cta = document.getElementById("cta-report");
    const dialog = document.getElementById("lead-dialog");
    if (!harvest || !card || !cta) return;

    const t = (key, fallback) => (window.OxyI18n ? window.OxyI18n.t(key, fallback) : fallback);
    const bar = document.createElement("div");
    bar.className = "yc-mbar";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", t("results.h3", "Your estimate"));
    bar.innerHTML = '<div><span class="yc-mbar-lbl"></span><span class="yc-mbar-val"></span></div>'
        + '<button type="button" class="yc-mbar-btn"></button>';
    const label = bar.querySelector(".yc-mbar-lbl");
    const value = bar.querySelector(".yc-mbar-val");
    const button = bar.querySelector(".yc-mbar-btn");
    root.appendChild(bar);

    const syncText = () => {
        const tamil = window.OxyI18n && window.OxyI18n.getLang() === "ta";
        label.textContent = tamil ? t("roi.harv", "Extra harvest") : "Extra harvest";
        button.textContent = cta.textContent.trim() || t("results.cta_report", "Get my pond report");
        // "10 kg–20 kg per crop\n25 kg–50 kg per year" (see tidyNode): show the
        // per-year line, shortened to fit one line of a phone bar.
        const lines = harvest.textContent.split("\n").map((s) => s.trim()).filter(Boolean);
        value.textContent = lines.length
            ? lines[lines.length - 1].replace(/ kg–/, "–").replace(/ per year$/, " / year")
            : "—";
    };
    syncText();
    new MutationObserver(syncText).observe(harvest, { childList: true, characterData: true, subtree: true });
    new MutationObserver(syncText).observe(cta, { childList: true, characterData: true, subtree: true });
    document.addEventListener("oxy:langchange", syncText);

    button.addEventListener("click", () => cta.click());

    let queued = false;
    const place = () => {
        queued = false;
        const phone = window.matchMedia("(max-width: 900px)").matches;
        const cardBelow = card.getBoundingClientRect().top > window.innerHeight - 40;
        const on = phone && cardBelow && !(dialog && dialog.open);
        bar.classList.toggle("is-on", on);
        document.body.classList.toggle("yc-mbar-on", on);
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(place); } };
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    if (dialog) new MutationObserver(queue).observe(dialog, { attributes: true, attributeFilter: ["open"] });
    place();
}

export async function boot() {
    const root = document.getElementById("yc-root");
    // tools/Prerender sets __oxyPrerender: the captured HTML must be the
    // untouched markup, or the static page would boot on top of a map and
    // results the capture already drew.
    if (!root || root.dataset.booted || window.__oxyPrerender) return;
    root.dataset.booted = "1";
    try {
        await start(root);
    } finally {
        // app.css keeps the markup hidden behind a loader until now, so the
        // visitor never sees it before its stylesheets and scripts arrive.
        // Revealed on failure too, so a broken start never leaves a blank page.
        root.dataset.ready = "1";
    }
}

async function start(root) {

    // Parked by the sync script so tools/Prerender does not read these live
    // regions as a page that is still loading.
    root.querySelectorAll("[data-yc-role]").forEach((el) => {
        el.setAttribute("role", el.dataset.ycRole);
        el.removeAttribute("data-yc-role");
    });

    // The calculator's own language picker is hidden; follow the site's.
    try {
        window.localStorage.setItem("oxy_lang", document.documentElement.lang === "ta" ? "ta" : "en");
    } catch { /* storage blocked: the calculator falls back to English */ }

    // Leaflet measures the map container when it starts, so the styles that
    // size it must be in place first.
    await Promise.all(STYLES.map(loadStyle));

    let onReady = null;
    const addEventListener = document.addEventListener;
    document.addEventListener = function (type, listener, options) {
        if (type === "DOMContentLoaded") { onReady = listener; return; }
        return addEventListener.call(this, type, listener, options);
    };
    try {
        for (const src of SCRIPTS) {
            await loadScript(src);
        }
    } finally {
        document.addEventListener = addEventListener;
    }

    if (typeof onReady !== "function") {
        throw new Error("[yield-calculator] ui.js registered no DOMContentLoaded start-up");
    }
    applySiteCopy();
    onReady.call(document, new Event("DOMContentLoaded"));
    watchAndTidy(root);
    pinResultsCard();
    mountMobileBar(root);
}

boot().catch((err) => console.error("[yield-calculator] start-up failed:", err));
