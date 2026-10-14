// Product type list (Pages/ProductsByFilter.razor, /products/type/{slug}).
// tools/Prerender also ships this page as static HTML, so it has to work
// without Blazor: each product is a real link, and anything that can't be
// frozen (more than one page, a failed load) is marked
// data-prerender-incomplete so the build skips it. This file checks the app
// rendering those pieces; the products come from this file, never the live API.
import { test, expect } from "@playwright/test";

const BOOT_TIMEOUT = 90_000;

const product = (slug, name) => ({ slug, name, friendlyID: slug, barID: 1, description: "", asset: { url: "/images/oxyniti.png" }, price: 0 });

async function answerProducts(page, { totalPages = 1, fail = false } = {}) {
    await page.route("**/api/public/ProductsBySlug**", (route) => fail
        ? route.fulfill({ status: 500, body: "" })
        : route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                products: [product("gen-1-5-hp", "Generator 1.5 HP"), product("gen-4-hp", "Generator 4 HP")],
                totalPages,
            }),
        }));
}

async function closePromo(page) {
    const close = page.locator("#yield-promo [data-yp-dismiss]").first();
    if (await close.isVisible()) await close.click();
}

test("each product is a real link to its page, with Contact us still separate", async ({ page }) => {
    await answerProducts(page);
    await page.goto("/products/type/Nano-Bubble%20Generator");

    const rows = page.locator("[data-product-row]");
    await expect(rows).toHaveCount(2, { timeout: BOOT_TIMEOUT });
    await expect(rows.first().locator('a[href="/product/gen-1-5-hp"]')).toBeVisible();
    await expect(page).toHaveTitle("Nano-Bubble Generator | Oxyniti");

    // A single page of products: no pager, and nothing that stops the static capture.
    await expect(page.locator(".pagination")).toHaveCount(0);
    await expect(page.locator("[data-prerender-incomplete]")).toHaveCount(0);

    await closePromo(page);
    const contact = rows.first().locator('a[href="/contact"]');
    await contact.scrollIntoViewIfNeeded();
    await expect.poll(async () => {
        const box = await contact.boundingBox();
        return page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest("a")?.getAttribute("href"), [box.x + box.width / 2, box.y + box.height / 2]);
    }).toBe("/contact");

    // Tapping anywhere on the row (here, the picture) opens the product.
    await rows.first().locator("img").click({ force: true });
    await expect(page).toHaveURL(/\/product\/gen-1-5-hp$/);
});

test("more than one page shows the pager and keeps the page out of the static build", async ({ page }) => {
    await answerProducts(page, { totalPages: 3 });
    await page.goto("/products/type/Nano-Bubble%20Generator");
    await expect(page.locator("[data-product-row]")).toHaveCount(2, { timeout: BOOT_TIMEOUT });
    await expect(page.locator(".pagination .page-item")).toHaveCount(3);
    await expect(page.locator('[data-prerender-incomplete="multi-page"]')).toHaveCount(1);
});

test("a failed load is never frozen into the static build as 'no products'", async ({ page }) => {
    await answerProducts(page, { fail: true });
    await page.goto("/products/type/Nano-Bubble%20Generator");
    await expect(page.locator('[data-prerender-incomplete="load-failed"]')).toBeVisible({ timeout: BOOT_TIMEOUT });
});
