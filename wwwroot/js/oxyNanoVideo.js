export function init(video) {
    if (!video) {
        throw new Error("OXY-Nano video element was not found.");
    }

    // Required for reliable autoplay on browsers/mobile.
    video.muted = true;
    video.playsInline = true;

    let manuallyPaused = false;
    let autoPaused = false;
    let savedTime = 0;
    let isVideoVisible = false;

    /*
     * Remember the current video position continuously.
     */
    const handleTimeUpdate = () => {
        if (!video.paused && !video.ended) {
            savedTime = video.currentTime;
        }
    };

    /*
     * Detect whether the pause came from scrolling
     * or from the user pressing Pause.
     */
    const handlePause = () => {
        if (autoPaused) {
            autoPaused = false;
            return;
        }

        manuallyPaused = true;
        savedTime = video.currentTime;
    };

    /*
     * If the user presses Play manually,
     * allow automatic playback again.
     */
    const handlePlay = () => {
        manuallyPaused = false;
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("pause", handlePause);
    video.addEventListener("play", handlePlay);

    /*
     * Watch the video visibility.
     */
    const observer = new IntersectionObserver(
        (entries) => {
            const entry = entries[0];

            if (!entry) {
                return;
            }

            /*
             * VIDEO ENTERED VIEWPORT
             */
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {

                isVideoVisible = true;

                /*
                 * If the user manually paused the video,
                 * respect that choice.
                 */
                if (manuallyPaused) {
                    return;
                }

                /*
                 * Restore the exact position where the video
                 * was automatically paused.
                 */
                if (
                    savedTime > 0 &&
                    Math.abs(video.currentTime - savedTime) > 0.1
                ) {
                    try {
                        video.currentTime = savedTime;
                    }
                    catch {
                        // Ignore seek errors while metadata loads.
                    }
                }

                /*
                 * Start/resume the video.
                 */
                if (video.paused) {
                    video.play().catch(() => {
                        // Browser may block autoplay.
                    });
                }
            }

            /*
             * VIDEO LEFT VIEWPORT
             */
            else {

                isVideoVisible = false;

                /*
                 * Only pause if the video is currently playing.
                 */
                if (!video.paused && !video.ended) {

                    /*
                     * Save exact position BEFORE pausing.
                     */
                    savedTime = video.currentTime;

                    /*
                     * Mark this as an automatic pause.
                     */
                    autoPaused = true;

                    video.pause();
                }
            }
        },
        {
            threshold: [0, 0.5, 1]
        }
    );

    observer.observe(video);

    /*
     * Reload the video after the language changes.
     *
     * The <source> element has already been replaced
     * by Blazor when this function is called.
     */
    const reload = () => {

        /*
         * Reset the current position because this is now
         * a different language/video.
         */
        savedTime = 0;
        manuallyPaused = false;
        autoPaused = false;

        video.pause();

        /*
         * Load the newly selected source.
         */
        video.load();

        /*
         * Always start the newly selected language from 0:00.
         */
        video.currentTime = 0;

        /*
         * If the video is currently visible, start it.
         */
        if (isVideoVisible) {
            video.play().catch(() => {
                // Browser may block autoplay.
            });
        }
    };

    /*
     * Cleanup when the Blazor component is removed.
     */
    const dispose = () => {
        observer.disconnect();

        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("play", handlePlay);
    };

    /*
     * Return the functions that Blazor can call.
     */
    return {
        reload,
        dispose
    };
}