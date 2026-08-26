/*
 * Leaflet + mapHelper.js are ~150 KB combined and only needed on the pages
 * that actually render a map, so they are fetched here on first use instead
 * of site-wide from index.html.
 */
let readyPromise = null;

function loadStyle(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
    });
}

export function ensureLoaded() {
    readyPromise ??= (async () => {
        loadStyle("/vendor/leaflet/leaflet.css");

        if (!window.L) {
            await loadScript("/vendor/leaflet/leaflet.js");
        }

        if (!window.oxynitiMap) {
            await loadScript("/js/mapHelper.js");
        }
    })();

    return readyPromise;
}

/*
 * Resolves once the element scrolls near the viewport, so a map embedded
 * below the fold (e.g. the homepage demo form) never triggers Leaflet /
 * OpenStreetMap tile requests on page load.
 */
export function whenVisible(elementId) {
    return new Promise((resolve) => {
        const el = document.getElementById(elementId);
        if (!el) {
            resolve();
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            if (entries.some(e => e.isIntersecting)) {
                observer.disconnect();
                resolve();
            }
        }, { rootMargin: "200px" });

        observer.observe(el);
    });
}
