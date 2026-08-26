export function init(video) {
    if (!video) {
        throw new Error("OXY-Nano video element was not found.");
    }

    /*
     * Reload the video after the language changes while it is playing.
     *
     * The <source> element has already been replaced
     * by Blazor when this function is called.
     */
    const reload = () => {
        video.pause();

        // Load the newly selected source.
        video.load();

        video.play().catch(() => {
            // Browser may block autoplay after a language switch.
        });
    };

    /*
     * Cleanup when the Blazor component is removed.
     */
    const dispose = () => {
        video.pause();
    };

    /*
     * Return the functions that Blazor can call.
     */
    return {
        reload,
        dispose
    };
}
