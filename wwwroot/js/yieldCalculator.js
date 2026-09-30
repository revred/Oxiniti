// Starts the yield calculator on /yield-calculator (Pages/YieldCalculator.razor).
// Imported by that page once Blazor has rendered it, and by marketingIslands.js
// on the prerendered static copy -- whichever runs first boots it, once.
//
// The calculator's files under /yield-calculator/ are the upstream calculator,
// unchanged (scripts/sync-yield-calculator.sh). Its classic scripts expect to be
// parsed with the page: ui.js starts from a DOMContentLoaded listener, which has
// long fired by the time a Blazor page renders. So this loads the stylesheets,
// then the scripts in their original order, catches the DOMContentLoaded
// listener ui.js registers, and calls it directly.
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

export async function boot() {
    const root = document.getElementById("yc-root");
    // tools/Prerender sets __oxyPrerender: the captured HTML must be the
    // untouched markup, or the static page would boot on top of a map and
    // results the capture already drew.
    if (!root || root.dataset.booted || window.__oxyPrerender) return;
    root.dataset.booted = "1";

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

    let start = null;
    const addEventListener = document.addEventListener;
    document.addEventListener = function (type, listener, options) {
        if (type === "DOMContentLoaded") { start = listener; return; }
        return addEventListener.call(this, type, listener, options);
    };
    try {
        for (const src of SCRIPTS) {
            await loadScript(src);
        }
    } finally {
        document.addEventListener = addEventListener;
    }

    if (typeof start !== "function") {
        throw new Error("[yield-calculator] ui.js registered no DOMContentLoaded start-up");
    }
    start.call(document, new Event("DOMContentLoaded"));
}

boot().catch((err) => console.error("[yield-calculator] start-up failed:", err));
