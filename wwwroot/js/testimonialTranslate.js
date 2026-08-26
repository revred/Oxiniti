// Testimonials are free text typed by whoever adds them in the MAK3R AI
// admin, in whatever language they wrote it in (e.g. Telugu, Tamil). Rather
// than forcing translation through the site-wide localization catalog, this
// shows the testimonial as-authored and, on hover, an on-the-fly English
// translation as a styled floating tooltip -- no CMS field, no API key.
window.testimonialHoverTranslate = window.testimonialHoverTranslate || (function () {
    const translationCache = new Map();
    let tooltipEl = null;
    let stylesInjected = false;

    // Anything outside Latin script + Latin extensions + general
    // punctuation/whitespace is treated as "needs translation". Cheap
    // heuristic, not real language ID -- good enough to catch Telugu,
    // Tamil, Hindi, etc. while leaving English/Latin-script testimonials
    // alone.
    const NON_LATIN_PATTERN = new RegExp(
        "[^\\u0000-\\u036F\\u2000-\\u206F\\u2E00-\\u2E7F\\s]"
    );

    function looksNonLatin(text) {
        return NON_LATIN_PATTERN.test(text);
    }

    // The tooltip is appended to <body>, outside the Blazor component tree,
    // so Blazor's scoped CSS (even with ::deep) can never reach it. It owns
    // its styling by injecting one <style> tag, once.
    function injectStyles() {
        if (stylesInjected) return;
        stylesInjected = true;
        const style = document.createElement("style");
        style.textContent = `
.tt-translate-tooltip {
    position: fixed;
    z-index: 9999;
    max-width: 300px;
    padding: 0.7rem 1rem;
    background: linear-gradient(160deg, #16283b 0%, #234a66 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.65rem;
    box-shadow: 0 14px 34px rgba(4, 12, 22, 0.35), 0 2px 8px rgba(4, 12, 22, 0.2);
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 0.16s ease, transform 0.16s ease;
    pointer-events: none;
}
.tt-translate-tooltip.tt-visible {
    opacity: 1;
    transform: translateY(0);
}
.tt-translate-tooltip .tt-label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #7fd0ff;
    margin-bottom: 0.35rem;
}
.tt-translate-tooltip .tt-body {
    color: #f4f8fb;
    font-size: 0.9rem;
    line-height: 1.5;
}
.tt-translate-tooltip .tt-arrow {
    position: absolute;
    width: 10px;
    height: 10px;
    background: #1c3852;
    transform: rotate(45deg);
    border-radius: 2px;
}
`;
        document.head.appendChild(style);
    }

    function ensureTooltip() {
        if (tooltipEl) return tooltipEl;
        tooltipEl = document.createElement("div");
        tooltipEl.className = "tt-translate-tooltip";
        tooltipEl.innerHTML =
            '<div class="tt-label">&#127760; English</div>' +
            '<div class="tt-body"></div>' +
            '<div class="tt-arrow"></div>';
        document.body.appendChild(tooltipEl);
        return tooltipEl;
    }

    function positionTooltip(anchorEl) {
        const tooltip = ensureTooltip();
        const arrow = tooltip.querySelector(".tt-arrow");
        const anchorRect = anchorEl.getBoundingClientRect();
        const tipRect = tooltip.getBoundingClientRect();

        let left = anchorRect.left + anchorRect.width / 2 - tipRect.width / 2;
        left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));

        let top = anchorRect.top - tipRect.height - 14;
        let arrowOnTop = false;
        if (top < 8) {
            top = anchorRect.bottom + 14;
            arrowOnTop = true;
        }

        tooltip.style.left = left + "px";
        tooltip.style.top = top + "px";

        const arrowLeft = Math.max(12, Math.min(
            anchorRect.left + anchorRect.width / 2 - left - 5,
            tipRect.width - 22
        ));
        arrow.style.left = arrowLeft + "px";
        if (arrowOnTop) {
            arrow.style.top = "-5px";
            arrow.style.bottom = "";
        } else {
            arrow.style.bottom = "-5px";
            arrow.style.top = "";
        }
    }

    function showTooltip(anchorEl, text) {
        injectStyles();
        const tooltip = ensureTooltip();
        tooltip.querySelector(".tt-body").textContent = text;
        tooltip.classList.remove("tt-visible");
        positionTooltip(anchorEl);
        // Reflow before adding the visible class so the fade/slide transition runs.
        void tooltip.offsetWidth;
        tooltip.classList.add("tt-visible");
    }

    function hideTooltip() {
        if (tooltipEl) tooltipEl.classList.remove("tt-visible");
    }

    async function fetchTranslation(text) {
        if (translationCache.has(text)) {
            return translationCache.get(text);
        }
        try {
            const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=" + encodeURIComponent(text);
            const response = await fetch(url);
            if (!response.ok) throw new Error("translate request failed: " + response.status);
            const data = await response.json();
            const translated = (data[0] || []).map(chunk => chunk[0]).join("");
            translationCache.set(text, translated);
            return translated;
        } catch (err) {
            console.warn("Testimonial hover translation unavailable:", err);
            translationCache.set(text, null);
            return null;
        }
    }

    function wireElement(el) {
        if (el.dataset.ttWired) return;
        el.dataset.ttWired = "true";

        const original = el.textContent.trim();
        if (!original || !looksNonLatin(original)) return;

        el.classList.add("testimonial-quote--translatable");

        let translated = null;
        let loading = false;

        el.addEventListener("mouseenter", async () => {
            if (translated) {
                showTooltip(el, translated);
                return;
            }
            if (loading) return;
            loading = true;
            translated = await fetchTranslation(original);
            loading = false;
            if (translated && el.matches(":hover")) {
                showTooltip(el, translated);
            }
        });

        el.addEventListener("mouseleave", hideTooltip);
    }

    function init(containerSelector) {
        const container = document.querySelector(containerSelector || ".testimonials-section");
        if (!container) return;
        container.querySelectorAll(".testimonial-quote").forEach(wireElement);
    }

    return { init };
})();
