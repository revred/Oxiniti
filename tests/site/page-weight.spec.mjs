// Home page download weight. The hero video's poster used to be the .jpg copy
// of the hero picture while the <img> on top showed the .avif (two downloads
// of the same frame), and the 350 KB nanobubble-vs-hair.png downloaded on
// load although it sits far down the page. Now the poster reuses the .avif
// and the illustration is a 92 KB lazy-loaded WebP. (Chrome starts lazy images
// 1250-2500 px before they scroll into view, so it may still arrive before
// the visitor gets there -- just later and far smaller.)
import { test, expect } from "@playwright/test";

const BOOT_TIMEOUT = 90_000;

test("the home page fetches the hero picture once and the illustration as a lazy WebP", async ({ page }) => {
    const requested = [];
    page.on("request", (req) => requested.push(new URL(req.url()).pathname));

    await page.goto("/");
    await expect(page.locator("#technology")).toBeAttached({ timeout: BOOT_TIMEOUT });
    await page.waitForLoadState("networkidle");

    expect(requested).not.toContain("/images/hero-poster-wide.jpg");
    expect(requested.filter((p) => p === "/images/hero-poster-wide.avif").length).toBeLessThanOrEqual(1);

    const illustration = page.locator("#technology img");
    await expect(illustration).toHaveAttribute("loading", "lazy");
    await illustration.scrollIntoViewIfNeeded();
    await expect.poll(() => illustration.evaluate((img) => img.complete && img.naturalWidth)).toBeGreaterThan(0);
    expect(requested).toContain("/images/nanobubble-vs-hair.webp");
    expect(requested).not.toContain("/images/nanobubble-vs-hair.png");
});
