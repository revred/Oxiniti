// Opens the yield-calculator promo card (Pages/Components/YieldPromo.razor).
// It is an advert, so closing it is "not right now", not "never": it comes
// back on the same page after a pause, and again on every page visited, until
// the visitor actually goes to the calculator.
//
//   Purely on a timer -- scrolling plays no part. First shown FIRST_MS after
//   the page opens; after each close, back REOPEN_MS (one minute) later, for
//   as long as the visitor stays on the page.
//
//   Going to the calculator from the card keeps it away for the rest of that
//   browser tab's session (sessionStorage); the next visit shows it again.
//   Never shown on the calculator itself, the sign-in / checkout flows, or
//   the staff-only demo log (/my-demos), where it would cover "Add demo".
//
// Plain JS with no Blazor dependency, so it runs the same on the prerendered
// marketing pages (which ship without the Blazor runtime) as on the app
// routes, where the card only appears once Blazor has rendered the layout --
// hence the card is looked up each time, never cached. In-app navigation
// changes the path without reloading this script; a new path counts as a new
// page.
(function () {
    "use strict";

    var STORE_KEY = "oxy.yieldPromo.visited";

    var FIRST_MS = 1000;

    var REOPEN_MS = 60000;

    var LOCALES = ["hi", "ta", "te", "kn", "ml", "bn"];

    var QUIET_PAGES = /^\/(yield-calculator|login|register|cart|checkout|checkout-return|payment|verify|email-verification|my-demos)(\/|$)/i;

    // Per-page state, reset whenever the path changes.
    var page = null;

    function syncPage() {
        if (page && page.path === location.pathname) return;
        page = { path: location.pathname, start: Date.now(), shows: 0, closedAt: 0 };
    }

    function read(key) {
        try { return window.sessionStorage.getItem(key); } catch (e) { return null; }
    }

    function write(key, value) {
        try { window.sessionStorage.setItem(key, value); } catch (e) { /* private mode: just don't remember */ }
    }

    function pagePath() {
        var parts = location.pathname.split("/");
        if (LOCALES.indexOf((parts[1] || "").toLowerCase()) !== -1) parts.splice(1, 1);
        return parts.join("/") || "/";
    }

    function card() {
        return document.getElementById("yield-promo");
    }

    // aria-hidden, not data-state: data-state lands a frame or two after
    // open() (for the slide-in), and a tick in between must not count as a
    // second showing.
    function isOpen() {
        var el = card();
        return !!el && el.getAttribute("aria-hidden") === "false";
    }

    function allowed() {
        if (read(STORE_KEY)) return false;
        return !QUIET_PAGES.test(pagePath());
    }

    function open() {
        var el = card();
        if (!el || isOpen()) return;

        syncPage();
        page.shows++;

        el.setAttribute("aria-hidden", "false");
        // A frame between un-hiding and opening so the slide-in transition runs.
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                el.setAttribute("data-state", "open");
                document.documentElement.setAttribute("data-yield-promo", "open");
            });
        });
    }

    function close() {
        var el = card();
        if (el) {
            el.removeAttribute("data-state");
            el.setAttribute("aria-hidden", "true");
        }
        document.documentElement.removeAttribute("data-yield-promo");

        syncPage();
        page.closedAt = Date.now();
    }

    // ---- Trigger: a once-a-second tick -------------------------------------

    function tick() {
        syncPage();
        if (isOpen() || !allowed()) return;

        var now = Date.now();
        var due = page.shows === 0 ? now - page.start >= FIRST_MS : now - page.closedAt >= REOPEN_MS;
        if (due) open();
    }

    setInterval(tick, 1000);

    // ---- Card controls (delegated: the card may be rendered after this runs) --

    document.addEventListener("click", function (e) {
        var target = e.target instanceof Element ? e.target : null;
        if (!target || !target.closest("#yield-promo")) return;

        if (target.closest("[data-yp-dismiss]")) {
            close();
        } else if (target.closest("[data-yp-go]")) {
            write(STORE_KEY, "1");
            close();
        }
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && isOpen()) close();
    });

    // For the site's own browser tests and for previewing the card by hand.
    window.oxyYieldPromo = {
        open: open,
        close: close,
        state: function () { syncPage(); return { shows: page.shows, closedAt: page.closedAt, now: Date.now() }; }
    };
})();
