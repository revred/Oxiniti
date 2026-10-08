// The yield-calculator promo card (Pages/Components/YieldPromo.razor,
// wwwroot/js/yieldPromo.js): opens a second into a page without any
// scrolling, comes back a minute after each close, stops once they have been to the calculator,
// and never shows on the calculator itself. page.clock skips the waits.
import { test, expect } from "@playwright/test";

const BOOT_TIMEOUT = 45_000;

async function openHome(page) {
    await page.clock.install();
    await page.goto("/");
    const card = page.locator("#yield-promo");
    await expect(card).toBeAttached({ timeout: BOOT_TIMEOUT });
    return card;
}

async function scrollTo(page, fraction) {
    await page.evaluate((f) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), fraction);
}

test("opens straight away on the home page, without scrolling, and links to the calculator", async ({ page }) => {
    const card = await openHome(page);

    await page.clock.fastForward("00:06");
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(card).toHaveAttribute("data-state", "open");
    await expect(card).toBeVisible();
    await expect(card.locator("a.yp-cta")).toHaveAttribute("href", "/yield-calculator");
    // Away from the calculator the floating calculator button is still there.
    await expect(page.locator(".floating-btn-profit")).toBeAttached();
    expect(await page.locator(".floating-btn-profit").evaluate((el) => getComputedStyle(el).display)).not.toBe("none");

    // Fully on screen, at desktop and phone width alike, once it has slid in.
    await page.clock.runFor(1000);
    await page.waitForTimeout(800);
    const box = await card.boundingBox();
    const vp = page.viewportSize();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
    expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
});

test("closing it is only for now: it comes back every minute, scrolling or not", async ({ page }) => {
    const card = await openHome(page);
    await page.clock.fastForward("00:06");
    await expect(card).toHaveAttribute("data-state", "open");

    // Stop the page clock: from here only runFor() moves it, so a slow
    // machine can't let a real minute slip by between two steps.
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));

    for (let shown = 1; shown <= 4; shown++) {
        await expect(card).toHaveAttribute("data-state", "open");
        await card.locator(".yp-close").click();
        await expect(card).toBeHidden();

        // Not back before the minute is up, however far they scroll.
        await page.evaluate(() => window.scrollBy(0, 400));
        await page.clock.runFor("00:50");
        await expect(card).not.toHaveAttribute("data-state", "open");

        // Back after the minute, without any more scrolling.
        await page.clock.runFor("00:12");
    }

    await expect(card).toHaveAttribute("data-state", "open");
    expect((await page.evaluate(() => window.oxyYieldPromo.state())).shows).toBe(5);
});

test("after going to the calculator from it, it stays away", async ({ page }) => {
    const card = await openHome(page);
    await page.clock.fastForward("00:06");
    await expect(card).toHaveAttribute("data-state", "open");
    await page.evaluate(() => document.querySelector("#yield-promo .yp-cta").addEventListener("click", (e) => e.preventDefault()));
    await card.locator(".yp-cta").click();
    await expect(card).toBeHidden();

    await page.clock.fastForward("01:05");
    await scrollTo(page, 0.9);
    await page.waitForTimeout(300);
    await expect(card).not.toHaveAttribute("data-state", "open");
});

test("a visit in a new browser session shows it again, even after going to the calculator before", async ({ page }) => {
    // Each test is a new browser session. An old one-day flag left by an
    // earlier version of the card (localStorage) must not hide it either.
    await page.addInitScript(() => {
        try { localStorage.setItem("oxy.yieldPromo.visitedUntil", String(Date.now() + 864e5)); } catch (e) { /* ignore */ }
    });
    await page.goto("/");
    await expect(page.locator("#yield-promo")).toHaveAttribute("data-state", "open", { timeout: BOOT_TIMEOUT });
});

test("never opens on the calculator page", async ({ page }) => {
    await page.clock.install();
    await page.goto("/yield-calculator");
    await expect(page.locator("#yc-root[data-booted]")).toBeAttached({ timeout: BOOT_TIMEOUT });
    await page.clock.fastForward("00:30");
    await scrollTo(page, 0.6);
    await page.waitForTimeout(500);
    await expect(page.locator("#yield-promo")).not.toHaveAttribute("data-state", "open");
});
