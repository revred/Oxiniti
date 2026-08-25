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

    video.muted = true;
    video.playsInline = true;

    let attached = false;

    /*
     * Swap the real sources in from data-src and start playback.
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

    if (eager) {
        attach();
        return {
            dispose() {
                // Nothing to tear down for the eager path.
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
        }
    };
}
