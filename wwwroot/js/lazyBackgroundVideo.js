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

export function init(video, options) {
    if (!video) {
        throw new Error("Background video element was not found.");
    }

    const eager = options?.eager === true;
    const respectNarrowViewport = options?.respectNarrowViewport !== false;
    const deferToWindowLoad = options?.deferToWindowLoad === true;

    video.muted = true;
    video.playsInline = true;

    let attached = false;
    let windowLoadListener = null;

    const onPlaying = () => video.classList.add("is-visible");
    video.addEventListener("playing", onPlaying);

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

        if (deferToWindowLoad && document.readyState !== "complete") {
            /*
             * Hold off on fetching the (much larger) video until the page
             * has finished its initial load, so the poster image is what
             * paints first and becomes the LCP candidate.
             */
            windowLoadListener = () => swapInSources();
            window.addEventListener("load", windowLoadListener, { once: true });
            return;
        }

        swapInSources();
    };

    if (eager) {
        attach();
        return {
            dispose() {
                video.removeEventListener("playing", onPlaying);
                if (windowLoadListener) {
                    window.removeEventListener("load", windowLoadListener);
                }
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
