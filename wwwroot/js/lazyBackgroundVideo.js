const REDUCED_DATA_QUERY = "(prefers-reduced-data: reduce)";
const NARROW_VIEWPORT_QUERY = "(max-width: 480px)";

function shouldStayPosterOnly(respectNarrowViewport) {
    if (!window.matchMedia) {
        return false;
    }

    if (window.matchMedia(REDUCED_DATA_QUERY).matches) {
        return true;
    }

    if (respectNarrowViewport && window.matchMedia(NARROW_VIEWPORT_QUERY).matches) {
        return true;
    }

    return false;
}

export function init(video, poster, options) {
    if (!video) {
        throw new Error("Background video element was not found.");
    }

    const eager = options?.eager === true;
    const respectNarrowViewport = options?.respectNarrowViewport !== false;
    const deferUntilPosterPaint = options?.deferUntilPosterPaint === true;

    video.muted = true;
    video.playsInline = true;

    let attached = false;

    const onPlaying = () => video.classList.add("is-visible");
    video.addEventListener("playing", onPlaying);

    /*
     * Resolves once the poster <img> has had its first chance to paint, so
     * the (much larger) video fetch never races it for LCP. By the time this
     * module runs, Blazor has already rendered the component -- the browser
     * 'load' event fires long before that (it only covers the static shell),
     * so it is useless as a gate here; the poster's own paint is the signal
     * that actually matters.
     */
    const waitForPosterPaint = () => {
        if (!poster) {
            return Promise.resolve();
        }
        if (poster.complete) {
            // Already decoded (e.g. served from disk cache) -- still yield
            // a couple of frames so the browser paints it before we start
            // the video download on the same thread.
            return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        }
        return new Promise((resolve) => {
            poster.addEventListener("load", resolve, { once: true });
            poster.addEventListener("error", resolve, { once: true });
        });
    };

    /*
     * Swap the real sources in from data-src and start playback.
     */
    const swapInSources = () => {
        video.querySelectorAll("source[data-src]").forEach((source) => {
            source.src = source.dataset.src;
            source.removeAttribute("data-src");
        });

        if (video.dataset.src) {
            video.src = video.dataset.src;
            video.removeAttribute("data-src");
        }

        video.load();
        video.play().catch(() => {
            // Browser may block autoplay; the poster stays visible.
        });
    };

    /*
     * Skipped entirely for reduced-data / narrow-viewport visitors,
     * who keep only the poster image.
     */
    const attach = () => {
        if (attached) {
            return;
        }
        attached = true;

        if (shouldStayPosterOnly(respectNarrowViewport)) {
            return;
        }

        if (deferUntilPosterPaint) {
            waitForPosterPaint().then(swapInSources);
            return;
        }

        swapInSources();
    };

    if (eager) {
        attach();
        return {
            dispose() {
                video.removeEventListener("playing", onPlaying);
            }
        };
    }

    /*
     * Below-fold loop: attach once the section approaches the viewport,
     * not only once it is already visible.
     */
    const observer = new IntersectionObserver(
        (entries) => {
            const entry = entries[0];
            if (entry && entry.isIntersecting) {
                attach();
                observer.disconnect();
            }
        },
        { rootMargin: "200px 0px", threshold: 0 }
    );

    observer.observe(video);

    return {
        dispose() {
            observer.disconnect();
            video.removeEventListener("playing", onPlaying);
        }
    };
}
