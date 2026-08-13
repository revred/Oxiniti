window.oxynitiScroll = {
    toId: function (id) {
        const scrollNow = () => {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        };

        scrollNow();

        // Re-assert the target a couple of times shortly after: on first
        // load, media (hero video, section images) can still be finishing
        // layout for a few hundred ms after this runs, which shifts every
        // section below it and silently undoes the scroll. Calling
        // scrollIntoView again once things have settled corrects for that
        // instead of leaving the page stuck wherever it happened to land.
        setTimeout(scrollNow, 400);
        setTimeout(scrollNow, 900);
    },

    setUrlQuietly: function (url) {
        // Updates the address bar without going through Blazor's router —
        // NavigationManager.NavigateTo() resets scroll to the top on every
        // call (even with replace:true), which fights our own smooth-scroll
        // to a section. history.replaceState bypasses that entirely.
        window.history.replaceState(null, "", url);
    },

    clearActive: function () {
        document.querySelectorAll(".nav-link[data-section]").forEach(a => {
            a.classList.remove("active");
        });
    },

    initScrollSpy: function () {
        const sections = [...document.querySelectorAll("section[id], div[id]")];
        const navAnchors = [...document.querySelectorAll(".nav-link[data-section]")];

        if (!sections.length || !navAnchors.length) return;

        // Track which sections are currently intersecting explicitly, and
        // recompute the active link from that set on every callback — not
        // just when a section becomes visible. The previous version only
        // ever reacted to a section *entering* the observed band and did
        // nothing when one *left* it, so a section that briefly intersected
        // during initial layout (before media finished loading and pushed
        // it back out of view) stayed marked active forever, alongside
        // whatever the real current section was.
        const intersecting = new Set();

        const applyActive = () => {
            const activeSection = sections
                .filter(s => intersecting.has(s.id))
                .sort((a, b) => a.offsetTop - b.offsetTop)[0];

            const activeId = activeSection ? activeSection.id : null;

            navAnchors.forEach(a => {
                a.classList.toggle("active", a.getAttribute("data-section") === activeId);
            });
        };

        const spy = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    intersecting.add(e.target.id);
                } else {
                    intersecting.delete(e.target.id);
                }
            });
            applyActive();
        }, { rootMargin: "-40% 0px -55% 0px" });

        sections.forEach(s => spy.observe(s));
    }
};
