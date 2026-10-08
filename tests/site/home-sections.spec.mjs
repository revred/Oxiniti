// Home page section links (/?scrollTo=<id>, from the top bar's Results,
// Technology, ... links). Home.razor scrolls to the section once Blazor has
// rendered; until then the page is wwwroot/index.html's short pre-boot shell.
import { test, expect } from "@playwright/test";

test("refreshing a section link does not park the loading page on its FAQ", async ({ page }) => {
    await page.goto("/?scrollTo=results");
    await expect.poll(() => page.evaluate(() => document.getElementById("results")?.getBoundingClientRect().top ?? 1e9), { timeout: 45_000 }).toBeLessThan(300);

    // Record, from the first script on the reloaded page, whether the
    // pre-boot shell's FAQ ever comes into view before the app replaces it.
    await page.addInitScript(() => {
        window.__shellFaqSeen = false;
        const check = () => {
            const faq = document.querySelector(".static-shell-faq");
            if (faq && faq.getBoundingClientRect().top < innerHeight && faq.getBoundingClientRect().bottom > 0) window.__shellFaqSeen = true;
        };
        addEventListener("scroll", check, { passive: true });
        const tick = () => { check(); if (!document.querySelector("#results")) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
    });
    await page.reload();

    const results = page.locator("#results");
    await expect.poll(() => results.evaluate((el) => Math.round(el.getBoundingClientRect().top)), { timeout: 45_000 }).toBeLessThan(300);
    expect(await results.evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
    expect(await page.evaluate(() => window.__shellFaqSeen)).toBe(false);
});

test("a section link from another page reaches the home section without a navigation error", async ({ page }) => {
    const errors = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
    await page.goto("/technology");
    const results = page.locator('.nav-link[data-section="results"]').first();
    await expect(results).toBeAttached({ timeout: 45_000 });
    await results.dispatchEvent("click");
    await expect(page).toHaveURL(/\/\?scrollTo=results$/);
    await expect.poll(() => page.evaluate(() => document.getElementById("results")?.getBoundingClientRect().top ?? 1e9)).toBeLessThan(300);
    expect(errors.filter((e) => /Navigation failed|not contained by the base URI/.test(e))).toEqual([]);
});

test("search lives on /search, linked from the footer, not in the header", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer.site-footer a[href='/search']")).toBeAttached({ timeout: 45_000 });
    await expect(page.locator("header .search-input")).toHaveCount(0);

    await page.goto("/search");
    const box = page.locator(".search-page-box .search-input");
    await expect(box).toBeVisible({ timeout: 45_000 });
    await box.fill("oxygen");
    await box.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=oxygen$/);
    await expect(box).toHaveValue("oxygen");
});

// Flags any moment the pre-boot shell's FAQ is on screen during a load.
function watchShellFaq(page) {
    return page.addInitScript(() => {
        window.__shellFaqSeen = false;
        const check = () => {
            const faq = document.querySelector(".static-shell-faq");
            if (faq && faq.getBoundingClientRect().top < innerHeight && faq.getBoundingClientRect().bottom > 0) window.__shellFaqSeen = true;
        };
        addEventListener("scroll", check, { passive: true });
        const tick = () => { check(); if (document.querySelector(".static-shell")) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
    });
}

test("refreshing halfway down the home page returns there, never via the shell's FAQ", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#results")).toBeAttached({ timeout: 45_000 });
    await page.evaluate(() => scrollTo(0, 2500));
    await page.waitForTimeout(300);
    const before = await page.evaluate(() => Math.round(scrollY));
    expect(before).toBeGreaterThan(2000);

    await watchShellFaq(page);
    await page.reload();
    await expect.poll(() => page.evaluate(() => Math.round(scrollY)), { timeout: 45_000 }).toBeGreaterThan(before - 60);
    await page.waitForTimeout(800);
    expect(Math.abs(await page.evaluate(() => scrollY) - before)).toBeLessThan(60);
    expect(await page.evaluate(() => window.__shellFaqSeen)).toBe(false);

    // A fresh visit to the same address starts at the top.
    await page.goto("/");
    await expect(page.locator("#results")).toBeAttached({ timeout: 45_000 });
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => scrollY)).toBeLessThan(5);
});
