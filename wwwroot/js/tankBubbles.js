window.oxynitiTankBubbles = (function () {
    let regInterval = null;
    let nanoInterval = null;
    let observer = null;
    let styleInjected = false;

    function injectKeyframes() {
        if (styleInjected) return;
        styleInjected = true;
        const style = document.createElement("style");
        style.textContent = `
            @keyframes ox-rise-burst {
                0% { transform: translateY(0); opacity: 0 }
                8% { opacity: 1 }
                86% { opacity: 1 }
                100% { transform: translateY(-320px); opacity: 0 }
            }
            @keyframes ox-rise-hang {
                0% { transform: translateY(0) translateX(0); opacity: 0 }
                12% { opacity: 1 }
                50% { transform: translateY(-130px) translateX(8px) }
                100% { transform: translateY(-235px) translateX(-6px); opacity: 0.85 }
            }
        `;
        document.head.appendChild(style);
    }

    function make(layer, opts) {
        const b = document.createElement("span");
        const size = opts.min + Math.random() * (opts.max - opts.min);
        b.style.cssText = `
            position:absolute; border-radius:50%;
            left:${8 + Math.random() * 84}%;
            bottom:-${size}px;
            width:${size}px; height:${size}px;
            border:1px solid rgba(255,255,255,${opts.alpha});
            background:radial-gradient(circle at 32% 30%, rgba(255,255,255,${opts.alpha * 0.85}), rgba(255,255,255,0.05));
            animation:${opts.anim} ${opts.dur + Math.random() * opts.durVar}s linear forwards;
        `;
        layer.appendChild(b);
        b.addEventListener("animationend", () => b.remove());
    }

    function start() {
        stop(); // guard against being started twice

        const reg = document.querySelector(".tank.regular .tank-bubble-layer");
        const nano = document.querySelector(".tank.nano .tank-bubble-layer");
        if (!reg || !nano) return;

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reducedMotion) return;

        injectKeyframes();

        let visible = false;
        observer = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
        observer.observe(reg.closest(".tanks"));

        regInterval = setInterval(() => {
            if (!visible) return;
            make(reg, { min: 14, max: 30, alpha: 0.45, anim: "ox-rise-burst", dur: 1.6, durVar: 0.8 });
        }, 380);

        nanoInterval = setInterval(() => {
            if (!visible) return;
            for (let i = 0; i < 4; i++) {
                make(nano, { min: 2, max: 4.5, alpha: 0.8, anim: "ox-rise-hang", dur: 6, durVar: 5 });
            }
        }, 300);
    }

    function stop() {
        if (regInterval) clearInterval(regInterval);
        if (nanoInterval) clearInterval(nanoInterval);
        if (observer) observer.disconnect();
        regInterval = null;
        nanoInterval = null;
        observer = null;
        document.querySelectorAll(".tank-bubble-layer span").forEach(b => b.remove());
    }

    return { start, stop };
})();
