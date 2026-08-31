import { init as initLazyVideo } from "./lazyBackgroundVideo.js";

const BACKDROP_WIDTH = 160;
const BACKDROP_HEIGHT = 90;
const MIN_FRAME_INTERVAL_MS = 80;

function drawCover(context, video, targetWidth, targetHeight) {
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) {
        return false;
    }

    const sourceRatio = video.videoWidth / video.videoHeight;
    const targetRatio = targetWidth / targetHeight;

    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = video.videoWidth;
    let sourceHeight = video.videoHeight;

    if (sourceRatio > targetRatio) {
        sourceWidth = video.videoHeight * targetRatio;
        sourceX = (video.videoWidth - sourceWidth) / 2;
    } else {
        sourceHeight = video.videoWidth / targetRatio;
        sourceY = (video.videoHeight - sourceHeight) / 2;
    }

    context.drawImage(
        video,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        targetWidth,
        targetHeight
    );

    return true;
}

export function init(video, backdropCanvas) {
    if (!video || !backdropCanvas) {
        throw new Error("The drone video and backdrop canvas are required.");
    }

    const lazyController = initLazyVideo(video, null, { eager: false });
    const context = backdropCanvas.getContext("2d", {
        alpha: false,
        desynchronized: true
    });

    if (!context) {
        return {
            dispose() {
                lazyController.dispose();
            }
        };
    }

    backdropCanvas.width = BACKDROP_WIDTH;
    backdropCanvas.height = BACKDROP_HEIGHT;

    let disposed = false;
    let videoFrameRequest = 0;
    let animationFrameRequest = 0;
    let lastDrawTime = 0;

    const drawBackdrop = (timestamp = performance.now()) => {
        if (disposed || timestamp - lastDrawTime < MIN_FRAME_INTERVAL_MS) {
            return;
        }

        if (drawCover(context, video, BACKDROP_WIDTH, BACKDROP_HEIGHT)) {
            lastDrawTime = timestamp;
            backdropCanvas.classList.add("is-active");
        }
    };

    const stopFrameLoop = () => {
        if (videoFrameRequest && typeof video.cancelVideoFrameCallback === "function") {
            video.cancelVideoFrameCallback(videoFrameRequest);
        }

        if (animationFrameRequest) {
            cancelAnimationFrame(animationFrameRequest);
        }

        videoFrameRequest = 0;
        animationFrameRequest = 0;
    };

    const scheduleFrame = () => {
        if (disposed || video.paused || video.ended) {
            return;
        }

        if (typeof video.requestVideoFrameCallback === "function") {
            videoFrameRequest = video.requestVideoFrameCallback((timestamp) => {
                drawBackdrop(timestamp);
                scheduleFrame();
            });
            return;
        }

        animationFrameRequest = requestAnimationFrame((timestamp) => {
            drawBackdrop(timestamp);
            scheduleFrame();
        });
    };

    const onPlaying = () => {
        stopFrameLoop();
        drawBackdrop();
        scheduleFrame();
    };

    const onLoadedData = () => drawBackdrop();
    const onStopped = () => stopFrameLoop();

    video.addEventListener("playing", onPlaying);
    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("pause", onStopped);
    video.addEventListener("ended", onStopped);

    return {
        dispose() {
            disposed = true;
            stopFrameLoop();
            video.removeEventListener("playing", onPlaying);
            video.removeEventListener("loadeddata", onLoadedData);
            video.removeEventListener("pause", onStopped);
            video.removeEventListener("ended", onStopped);
            lazyController.dispose();
        }
    };
}
