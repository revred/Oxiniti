// Product page (Pages/ProductDetails.razor, /product/{slug}). tools/Prerender
// ships this page as static HTML without Blazor, so every control on it has to
// work without an @onclick: thumbnails switch slides through Bootstrap's data
// API, and "Login/Register to Buy" and "You may also like" are real links. A
// page with a 3D model is marked data-prerender-incomplete so the build leaves
// it on the app (its viewer URL is signed and expires). This file checks the
// app rendering those pieces; the products come from this file, never the live API.
import { test, expect } from "@playwright/test";

const BOOT_TIMEOUT = 90_000;

const image = (url) => ({ url, path: null, is3DFile: false });

async function answerProduct(page, { assets }) {
    await page.route("**/api/public/ProductDetails**", (route) => route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
            slug: "gen-1-5-hp", name: "Generator 1.5 HP", friendlyID: "GEN15", barID: 1,
            description: "", assets, readMe: "**Pump & Motor**\n* Power Rating: 1.5 HP",
        }),
    }));
    await page.route("**/api/public/ProductsBySlug**", (route) => route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
            products: [{ slug: "gen-4-hp", name: "Generator 4 HP", friendlyID: "GEN4", barID: 2, description: "", asset: image("/oxyniti.png"), price: 0 }],
            totalPages: 1,
        }),
    }));
}

test("works without Blazor handlers: thumbnails, login and related products", async ({ page }) => {
    await answerProduct(page, { assets: [image("/oxyniti.png"), image("/icon-192.png")] });
    await page.goto("/product/gen-1-5-hp");

    const thumbs = page.locator(".thumb-box");
    await expect(thumbs).toHaveCount(2, { timeout: BOOT_TIMEOUT });
    await expect(thumbs.nth(1)).toHaveAttribute("data-bs-slide-to", "1");
    await expect(page.locator("[data-prerender-incomplete]")).toHaveCount(0);

    await expect(page.locator('a.btn-gradient[href="/login"]')).toBeVisible();
    await expect(page.locator('a.card[href="/product/gen-4-hp"]')).toBeVisible();

    await thumbs.nth(1).click();
    await expect(page.locator(".carousel-item").nth(1)).toHaveClass(/active/);
    await expect(thumbs.nth(1)).toHaveClass(/active/);
});

test("a page with a 3D model stays out of the static build", async ({ page }) => {
    await answerProduct(page, { assets: [image("/oxyniti.png"), { url: "/model.stl", path: null, is3DFile: true }] });
    await page.goto("/product/gen-1-5-hp");

    await expect(page.locator(".carousel-item.is-3d")).toHaveCount(1, { timeout: BOOT_TIMEOUT });
    await expect(page.locator("[data-prerender-incomplete]")).toHaveCount(1);
});
