/*
 * qrcode-generator + qrHelper.js are only needed on the pages that render a
 * QR code, so they are fetched here on first use instead of site-wide from
 * index.html.
 */
let readyPromise = null;

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
        if (!window.qrcode) {
            await loadScript("/vendor/qrcode-generator/qrcode.js");
        }

        if (!window.oxynitiQr) {
            await loadScript("/js/qrHelper.js");
        }
    })();

    return readyPromise;
}

/*
 * Resolves once the element scrolls near the viewport, so a QR code in the
 * footer (present on every page) never triggers a qrcode-generator request
 * on page load.
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
