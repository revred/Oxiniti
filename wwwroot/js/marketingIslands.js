// Issue #63: the marketing routes (home, about, technology,
// aquaculture-oxygenation, ras-oxygenation, products, faqs, contact,
// privacy, terms, sitemap) are prerendered at build time
// (tools/Prerender) and shipped WITHOUT the Blazor WASM runtime -- see that
// tool's own comment for why. Everything on those pages that used to be a
// Blazor @onclick/@oninput/@bind handler is wired here instead, in plain JS,
// against the exact same DOM the Razor components already render (ids/names
// added alongside this file for the handful of elements that needed a
// stable hook -- see FreeDemoSection.razor, ProfitCalculatorSection.razor,
// Layout/MainLayout.razor).
//
// Everything below is either a direct call into a JS module the app
// *already* ships (scrollHelper.js, tankBubbles.js, testimonialTranslate.js,
// mapLoader.js/mapHelper.js, qrLoader.js/qrHelper.js, droneStage.js,
// lazyBackgroundVideo.js -- none of them have ever depended on a live
// Blazor circuit, only on JS interop calling into them) or a small,
// deliberately-scoped port of a Razor @code block's own logic (the profit
// calculator's arithmetic, the free-demo form's localStorage write). Nothing
// here talks to the not-yet-deployed Oxyniti backend
// (Services/DemoAccountService.cs) -- every call it would make already
// no-ops today (OxynitiApi:BaseAddress is unset in appsettings.json), so
// this island reproduces today's actual fallback behaviour rather than a
// call that would never succeed anyway. If that backend ships, this file
// needs a matching fetch() added -- it will NOT pick that up automatically.
//
// App routes (/cart, /account, /checkout, /login, /product/{slug}, etc.)
// still boot the real Blazor app and never load this file.
(function () {
    "use strict";

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    function init() {
        initLanguageSelect();
        initNavScrollSpy();
        initProfitCalcScrollButtons();
        initScrollToQueryParam();
        initTankBubbles();
        initTestimonialHoverTranslate();
        initWhatsAppQrCodes();
        initProfitCalculator();
        initFreeDemoForm();
        initVideos();
        initOxyNanoClickToPlay();
    }

    // ---- Language switcher -------------------------------------------------
    // Mirrors Services/LocalizedRoutes.cs -- keep in sync (also duplicated,
    // with the same rationale, in tools/StaticSiteMeta/Program.cs).
    var READY_LOCALES = {
        about: ["ta", "te", "kn", "ml", "hi", "bn"],
        contact: ["ta", "te", "kn", "ml", "hi", "bn"],
    };

    function currentSlug() {
        var path = location.pathname.replace(/^\/+|\/+$/g, "");
        var segments = path.length ? path.split("/") : [];
        var locales = ["ta", "te", "kn", "ml", "hi", "bn"];
        if (segments.length && locales.indexOf(segments[0]) !== -1) {
            segments = segments.slice(1);
        }
        return segments.join("/");
    }

    // Mirrors LocalizationService.BuildLocalizedPath.
    function buildLocalizedPath(slug, code) {
        if (code === "en") return "/" + slug;
        return "/" + code + (slug.length === 0 ? "" : "/" + slug);
    }

    function initLanguageSelect() {
        var select = document.getElementById("language-select");
        if (!select) return;

        var slug = currentSlug();

        select.addEventListener("change", function () {
            var code = select.value;
            if (!code) return;

            var ready = code === "en" || (READY_LOCALES[slug] || []).indexOf(code) !== -1;
            if (ready) {
                location.href = buildLocalizedPath(slug, code);
                return;
            }

            // No prerendered page exists for this locale+slug combination yet
            // (Services/LocalizedRoutes.cs isn't "ready" for it either) --
            // same outcome the live Blazor app gives today: stay on the
            // English page rather than send the visitor to a 404.
            select.value = "en";
        });
    }

    // ---- Nav scroll-spy + same-page section links --------------------------
    function initNavScrollSpy() {
        if (typeof window.oxynitiScroll === "undefined") return;

        if (document.querySelectorAll(".nav-link[data-section]").length) {
            window.oxynitiScroll.initScrollSpy();
        }

        document.querySelectorAll(".nav-link[data-section]").forEach(function (a) {
            a.addEventListener("click", function (e) {
                var isHome = location.pathname === "/" || location.pathname === "";
                var section = a.getAttribute("data-section");

                if (isHome) {
                    e.preventDefault();
                    window.oxynitiScroll.setUrlQuietly("/?scrollTo=" + section);
                    window.oxynitiScroll.toId(section);
                }
                // Not on the homepage: leave the real href ("/#section") alone
                // -- a normal navigation to "/" then a native anchor jump,
                // same end result without needing JS at all.
            });
        });
    }

    function initScrollToQueryParam() {
        if (typeof window.oxynitiScroll === "undefined") return;

        var params = new URLSearchParams(location.search);
        var target = params.get("scrollTo");
        if (target) {
            setTimeout(function () {
                window.oxynitiScroll.toId(target);
            }, 150);
        }
    }

    // ---- Profit-calculator scroll buttons (header + floating) --------------
    function initProfitCalcScrollButtons() {
        var buttons = document.querySelectorAll(".profit-btn, .floating-btn-profit");
        if (!buttons.length) return;

        buttons.forEach(function (btn) {
            btn.addEventListener("click", function (e) {
                var isHome = location.pathname === "/" || location.pathname === "";
                if (isHome && typeof window.oxynitiScroll !== "undefined") {
                    e.preventDefault();
                    window.oxynitiScroll.toId("profit-calculator");
                } else if (!document.getElementById("profit-calculator")) {
                    // Only relevant off the homepage, where the calculator
                    // doesn't exist on the page at all yet.
                    e.preventDefault();
                    location.href = "/?scrollTo=profit-calculator";
                }
            });
        });
    }

    // ---- Tank bubble decoration (Technology section) ------------------------
    function initTankBubbles() {
        if (document.querySelector(".tank.regular .tank-bubble-layer") && window.oxynitiTankBubbles) {
            window.oxynitiTankBubbles.start();
        }
    }

    // ---- Testimonial hover-translate ----------------------------------------
    function initTestimonialHoverTranslate() {
        if (document.querySelector(".testimonials-section") && window.testimonialHoverTranslate) {
            window.testimonialHoverTranslate.init(".testimonials-section");
        }
    }

    // ---- WhatsApp group QR code(s) -------------------------------------------
    function initWhatsAppQrCodes() {
        var elements = document.querySelectorAll(".wa-group-qr-code[id]");
        if (!elements.length) return;

        import("./qrLoader.js").then(function (qrLoader) {
            elements.forEach(function (el) {
                qrLoader.whenVisible(el.id).then(function () {
                    return qrLoader.ensureLoaded();
                }).then(function () {
                    // Matches SiteContact.WhatsAppGroupLink (C#) -- kept in
                    // sync by hand, same as everything else this file ports.
                    window.oxynitiQr.render(el.id, "https://chat.whatsapp.com/IlHfPXCNWk3LQa1LYPqceu?s=sw&p=i&mlu=4");
                }).catch(function (err) {
                    console.error("[marketingIslands] Error loading WhatsApp QR code:", err);
                });
            });
        });
    }

    // ---- Profit calculator (ports ProfitCalculatorSection.razor's @code) ----
    function initProfitCalculator() {
        var acresInput = document.getElementById("calc-acres");
        var priceInput = document.getElementById("calc-price");
        if (!acresInput || !priceInput) return;

        var acresLabel = document.getElementById("calc-acres-label");
        var priceLabel = document.getElementById("calc-price-label");
        var kgOut = document.getElementById("calc-kg");
        var revenueOut = document.getElementById("calc-revenue");

        var BASE_YIELD_KG_PER_ACRE = 2500;
        var UPLIFT_LOW = 0.20;
        var UPLIFT_HIGH = 0.30;

        function fmtInr(n) {
            return "₹" + Math.round(n).toLocaleString("en-IN");
        }

        function render() {
            var acres = parseFloat(acresInput.value);
            var pricePerKg = parseInt(priceInput.value, 10);

            var lowKg = acres * BASE_YIELD_KG_PER_ACRE * UPLIFT_LOW;
            var highKg = acres * BASE_YIELD_KG_PER_ACRE * UPLIFT_HIGH;
            var lowRevenue = lowKg * pricePerKg;
            var highRevenue = highKg * pricePerKg;

            if (acresLabel) {
                var acreWord = acres === 1 ? "acre" : "acres";
                acresLabel.textContent = trimTrailingZero(acres) + " " + acreWord;
            }
            if (priceLabel) {
                priceLabel.textContent = fmtInr(pricePerKg) + "/kg";
            }
            if (kgOut) {
                kgOut.textContent = "+" + Math.round(lowKg).toLocaleString("en-IN") + " – " + Math.round(highKg).toLocaleString("en-IN") + " kg / year";
            }
            if (revenueOut) {
                revenueOut.textContent = fmtInr(lowRevenue) + " – " + fmtInr(highRevenue);
            }
        }

        function trimTrailingZero(n) {
            return n % 1 === 0 ? n.toFixed(0) : n.toFixed(1);
        }

        acresInput.addEventListener("input", render);
        priceInput.addEventListener("input", render);
    }

    // ---- Free-demo form (ports FreeDemoSection.razor's @code) ---------------
    function initFreeDemoForm() {
        var form = document.getElementById("free-demo-form");
        if (!form) return;

        initDemoMapPicker(form);

        form.addEventListener("submit", function (e) {
            e.preventDefault();

            var name = fieldValue(form, "name");
            var phone = fieldValue(form, "phone");
            var place = fieldValue(form, "place");

            if (!name || !phone || !place) {
                showFormStatus(form, "Please fill this mandatory field.");
                return;
            }

            var location_ = readPickedMapLocation();

            // Matches Services/DemoBooking.cs's shape exactly -- Pages/MyDemos.razor
            // reads this same localStorage key back through Services/DemoService.cs.
            var booking = {
                Id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())).replace(/-/g, ""),
                Name: name,
                Phone: phone,
                Place: place,
                Size: fieldValue(form, "size") || "½ – 1 acre",
                Species: fieldValue(form, "species") || "Tilapia / GIFT",
                Latitude: location_ ? location_[0] : null,
                Longitude: location_ ? location_[1] : null,
                CreatedAtUtc: new Date().toISOString(),
            };

            try {
                var existingJson = window.localStorage.getItem("oxyniti_demos");
                var existing = existingJson ? JSON.parse(existingJson) : [];
                existing.push(booking);
                window.localStorage.setItem("oxyniti_demos", JSON.stringify(existing));
            } catch (err) {
                console.error("[marketingIslands] Error saving demo booking:", err);
            }

            // Services/DemoAccountService.cs's own fallback message for an
            // unconfigured OxynitiApi:BaseAddress -- which is this app's
            // actual state today (see this file's header comment).
            showFormStatus(form, "Demo request received! We'll contact you shortly.");
            form.reset();
        });
    }

    function fieldValue(form, name) {
        var el = form.querySelector('[data-field="' + name + '"]');
        return el ? el.value.trim() : "";
    }

    function showFormStatus(form, message) {
        var status = form.querySelector(".form-status");
        if (!status) {
            status = document.createElement("p");
            status.className = "form-status";
            var note = form.querySelector('[data-field="note"]');
            if (note) {
                form.insertBefore(status, note);
            } else {
                form.appendChild(status);
            }
        }
        status.textContent = message;
    }

    var _demoMapId = null;

    function initDemoMapPicker(form) {
        var mapEl = form.querySelector("[data-demo-map]");
        if (!mapEl || !mapEl.id) return;
        _demoMapId = mapEl.id;

        import("./mapLoader.js").then(function (mapLoader) {
            return mapLoader.whenVisible(mapEl.id).then(function () {
                return mapLoader.ensureLoaded();
            });
        }).then(function () {
            window.oxynitiMap.initPicker(mapEl.id, null, null);
        }).catch(function (err) {
            console.error("[marketingIslands] Error loading the demo location map:", err);
        });
    }

    function readPickedMapLocation() {
        if (!_demoMapId || !window.oxynitiMap) return null;
        try {
            return window.oxynitiMap.getPickerLocation(_demoMapId);
        } catch (err) {
            console.error("[marketingIslands] Error reading picked map location:", err);
            return null;
        }
    }

    // ---- Lazy background video attach ----------------------------------------
    // Dispatches on data-video-init, set alongside this file on each
    // component's <video> tag: "lazy-eager" (Hero -- attaches immediately),
    // "lazy" (below-the-fold background loops), "drone-stage" (the sky-view
    // canvas-backdrop treatment, its own module).
    function initVideos() {
        var droneVideo = document.querySelector('[data-video-init="drone-stage"]');
        if (droneVideo) {
            var canvas = droneVideo.closest(".drone-stage");
            canvas = canvas ? canvas.querySelector(".drone-stage-backdrop") : null;
            import("./droneStage.js").then(function (droneStage) {
                droneStage.init(droneVideo, canvas);
            }).catch(function (err) {
                console.error("[marketingIslands] Error starting drone stage video:", err);
            });
        }

        var lazyVideos = document.querySelectorAll(
            '[data-video-init="lazy-eager"], [data-video-init="lazy"]'
        );
        if (!lazyVideos.length) return;

        import("./lazyBackgroundVideo.js").then(function (lazyBackgroundVideo) {
            lazyVideos.forEach(function (video) {
                var eager = video.getAttribute("data-video-init") === "lazy-eager";
                var poster = eager ? video.parentElement.querySelector("img.hero-poster") : null;
                lazyBackgroundVideo.init(video, poster, {
                    eager: eager,
                    respectNarrowViewport: !eager,
                    deferUntilPosterPaint: eager,
                });
            });
        }).catch(function (err) {
            console.error("[marketingIslands] Error attaching background video(s):", err);
        });
    }

    // ---- OXY-Nano Series click-to-play ---------------------------------------
    function initOxyNanoClickToPlay() {
        var button = document.querySelector(".oxy-video-play");
        if (!button) return;

        button.addEventListener("click", function () {
            var frame = button.closest(".oxy-video-frame");
            if (!frame) return;

            var video = document.createElement("video");
            video.controls = true;
            video.autoplay = true;
            video.playsInline = true;
            video.preload = "auto";
            video.poster = "/images/oxy-nano-poster.webp";
            video.setAttribute("aria-label", button.getAttribute("aria-label") || "OXY-Nano Series product video");

            var source = document.createElement("source");
            // The Tamil variant (Services/LocalizationService) only ever
            // applies on a locale-prefixed page; the homepage isn't
            // prerendered per-locale (see tools/StaticSiteMeta's route
            // table), so this island only ever needs the English source.
            source.src = "/videos/oxy-nano-series.mp4";
            source.type = "video/mp4";
            video.appendChild(source);
            video.appendChild(document.createTextNode("Your browser does not support the video tag."));

            frame.replaceChild(video, button);
            video.play().catch(function () {
                // Autoplay may be blocked; controls are already visible.
            });
        });
    }
})();
