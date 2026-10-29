// Plays a YouTube video in a popup on the page instead of sending the visitor
// off to youtube.com. Any link with data-yt-embed="<video id>" opens it; add
// data-yt-vertical for Shorts (9:16). The link keeps its normal YouTube href,
// so a ctrl/middle click (or a page where this script fails) still goes there.
//
// The player is only created on click and removed on close, so the page
// downloads nothing from YouTube until the visitor asks for the video, and
// closing it stops the sound.
//
// Plain JS with no Blazor dependency, so it runs the same on the prerendered
// marketing pages (which ship without the Blazor runtime) as on the app routes.
(function () {
    "use strict";

    var overlay = null;
    var opener = null;

    function open(link) {
        var id = link.getAttribute("data-yt-embed");
        if (!id) return false;

        close();
        opener = link;

        overlay = document.createElement("div");
        overlay.className = "yt-lightbox";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", link.getAttribute("aria-label") || link.textContent.trim() || "Video");

        var frame = document.createElement("div");
        frame.className = "yt-lightbox-frame" + (link.hasAttribute("data-yt-vertical") ? " is-vertical" : "");

        var player = document.createElement("iframe");
        player.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) +
            "?autoplay=1&rel=0&playsinline=1";
        player.title = overlay.getAttribute("aria-label");
        // clipboard-write lets the player's own "Copy link" work; web-share its Share button.
        // "fullscreen" here covers the old allowfullscreen attribute (setting both warns).
        player.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write; web-share";

        var closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "yt-lightbox-close";
        closeBtn.setAttribute("aria-label", "Close video");
        closeBtn.innerHTML = "&times;";
        closeBtn.addEventListener("click", close);

        frame.appendChild(player);
        frame.appendChild(closeBtn);
        overlay.appendChild(frame);

        // A click on the dark backdrop (not the video) closes it.
        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) close();
        });

        document.body.appendChild(overlay);
        document.documentElement.classList.add("yt-lightbox-open");
        closeBtn.focus();
        return true;
    }

    function close() {
        if (!overlay) return;
        overlay.remove();
        overlay = null;
        document.documentElement.classList.remove("yt-lightbox-open");
        if (opener) opener.focus();
        opener = null;
    }

    document.addEventListener("click", function (e) {
        // Let ctrl/cmd/shift/middle clicks open YouTube in a new tab as usual.
        if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        var link = e.target.closest ? e.target.closest("a[data-yt-embed]") : null;
        if (link && open(link)) e.preventDefault();
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") close();
    });
})();
