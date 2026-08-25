let stripePromise = null;
let stripe = null;
let embeddedCheckout = null;

/*
 * Stripe.js is ~1 MB and is only needed on the pages that actually take a
 * payment, so it is fetched here on first use instead of site-wide from
 * index.html.
 */
function loadStripe() {
    stripePromise ??= new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://js.stripe.com/v3/";
        script.onload = resolve;
        script.onerror = () => reject(new Error("Failed to load js.stripe.com"));
        document.head.appendChild(script);
    });

    return stripePromise;
}

export async function mountEmbeddedCheckout(stripePublicKey, clientSecret, containerSelector = "#checkout-container") {
    await loadStripe();

    if (embeddedCheckout) {
        try { await embeddedCheckout.destroy(); } catch (_) { }
        embeddedCheckout = null;
    }

    if (!stripe) {
        stripe = Stripe(stripePublicKey);
    }

    const el = document.querySelector(containerSelector);
    if (!el) throw new Error(`Container ${containerSelector} not found`);
    el.innerHTML = "";

    embeddedCheckout = await stripe.initEmbeddedCheckout({ clientSecret });
    await embeddedCheckout.mount(containerSelector);
    return true;
}

export function dispose() {
    if (embeddedCheckout) {
        try { embeddedCheckout.destroy(); } catch (_) { }
        embeddedCheckout = null;
    }
}
