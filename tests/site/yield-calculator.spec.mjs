// /yield-calculator: the site page around the synced calculator
// (scripts/sync-yield-calculator.sh). The calculator's model has its own tests
// upstream; these cover what the site adds -- the layout, the visitor wording,
// the report dialog and the WhatsApp hand-off.
import { test, expect } from "@playwright/test";

// The first loads after `dotnet run` starts can take 20s+ (a cold dev server).
const BOOT_TIMEOUT = 45_000;

async function openCalculator(page) {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
        if (msg.type() === "error" && msg.text().includes("[yield-calculator]")) errors.push(msg.text());
    });
    await page.goto("/yield-calculator");
    await expect(page.locator("#yc-root[data-booted]")).toBeAttached({ timeout: BOOT_TIMEOUT });
    await expect(page.locator("#res-harvest")).toContainText("kg");
    return errors;
}

test("renders inside the site layout with one header and one footer", async ({ page }) => {
    const errors = await openCalculator(page);
    await expect(page.locator("header.site-header")).toHaveCount(1);
    await expect(page.locator("footer.site-footer")).toHaveCount(1);
    // Reached from the header's calculator icon, not a text link in the menu.
    await expect(page.locator("header a.profit-btn[href='/yield-calculator']")).toBeVisible();
    await expect(page.locator(".nav-links a[href='/yield-calculator']")).toHaveCount(0);
    await expect(page.locator("#data-sources")).toBeAttached(); // ODbL attribution must stay on the page
    // White page background, like every other page (no tinted band under the header).
    await expect(page.locator("#yc-root")).toHaveCSS("background-color", "rgb(255, 255, 255)");
    expect(errors).toEqual([]);
});

test("the estimate follows the inputs; locked figures say they come in the report", async ({ page }) => {
    await openCalculator(page);
    const harvest = page.locator("#res-harvest");
    const before = await harvest.textContent();
    await page.locator("#in-area_acre").evaluate((el) => {
        el.value = "5";
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(harvest).not.toHaveText(before);
    await expect(page.locator("#res-profit")).toContainText("In your report");
});

test("the report dialog opens centred, with one scrollbar", async ({ page }) => {
    await openCalculator(page);
    await page.locator("#cta-report").click();
    const dialog = page.locator("#lead-dialog");
    await expect(dialog).toHaveJSProperty("open", true);

    const box = await dialog.boundingBox();
    const view = page.viewportSize();
    expect(Math.abs(box.x + box.width / 2 - view.width / 2)).toBeLessThan(4);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(view.height + 1);
    if (box.height < view.height - 40) {
        expect(Math.abs(box.y + box.height / 2 - view.height / 2)).toBeLessThan(4);
    }
    // Only the inner panel scrolls; the dialog itself must not.
    const dialogScrolls = await dialog.evaluate((el) => el.scrollHeight > el.clientHeight + 1);
    expect(dialogScrolls).toBe(false);

    // Side-by-side fields line up: labels and controls start at the same height.
    const misaligned = await dialog.evaluate((el) => {
        const top = (node) => Math.round(node.getBoundingClientRect().top);
        const out = [];
        el.querySelectorAll(".field-row").forEach((row) => {
            const fields = [...row.children].filter((f) => f.classList.contains("field"));
            if (fields.length < 2 || top(fields[0]) !== top(fields[1]) && fields[1].offsetTop > fields[0].offsetTop + 30) return; // wrapped (phone)
            ["label", "input, select"].forEach((sel) => {
                const tops = fields.map((f) => top(f.querySelector(sel)));
                if (Math.max(...tops) - Math.min(...tops) > 1) out.push(`${fields[0].querySelector("label").textContent} | ${fields[1].querySelector("label").textContent}: ${sel} ${tops}`);
            });
        });
        return out;
    });
    expect(misaligned).toEqual([]);
});

test("a completed request hands off to WhatsApp", async ({ page }) => {
    await openCalculator(page);
    await page.locator("#cta-report").click();
    await page.fill("#lead-name", "Test Farmer");
    await page.fill("#lead-phone", "9443012345");
    await page.fill("#lead-village", "Musiri");
    await page.selectOption("#lead-role", { index: 1 });
    await page.selectOption("#lead-ponds", { index: 1 });
    await page.check("#lead-consent");
    const question = await page.locator("#lead-challenge-q").textContent();
    const [, a, b] = question.match(/(\d+)\s*\+\s*(\d+)/);
    await page.fill("#lead-challenge", String(Number(a) + Number(b)));
    await page.waitForTimeout(4_200); // leads.config.js minTimeOnPageMs
    await page.locator("#lead-submit").click();

    const wa = page.locator("#lead-cta-whatsapp");
    await expect(wa).toBeVisible();
    await expect(wa).toHaveAttribute("href", /^https:\/\/wa\.me\/919659727477\?text=/);
});

test("map popups keep their close button inside the card, clear of the title", async ({ page }) => {
    await openCalculator(page);
    const popup = page.locator("#map .leaflet-popup");
    // Hotspots are SVG circle markers; district shapes are paths too, so try
    // markers until one opens a popup.
    const markers = page.locator("#map path.leaflet-interactive");
    const count = await markers.count();
    for (let i = count - 1; i >= 0 && !(await popup.count()); i--) {
        await markers.nth(i).dispatchEvent("click");
    }
    await expect(popup).toBeVisible();

    // On small screens Leaflet pans the map to fit the popup; measure once it
    // has stopped moving, and read every box in the same frame.
    const measure = () => popup.evaluate((p) => {
        const box = (sel) => p.querySelector(sel).getBoundingClientRect().toJSON();
        return { card: box(".leaflet-popup-content-wrapper"), close: box(".leaflet-popup-close-button"), content: box(".leaflet-popup-content") };
    });
    let boxes = await measure();
    await expect.poll(async () => {
        const next = await measure();
        const settled = JSON.stringify(next) === JSON.stringify(boxes);
        boxes = next;
        return settled;
    }, { intervals: [150] }).toBe(true);
    const { card, close, content } = boxes;

    expect(close.left).toBeGreaterThanOrEqual(card.left + 2);
    expect(close.top).toBeGreaterThanOrEqual(card.top + 2);
    expect(close.right).toBeLessThanOrEqual(card.right - 2);
    expect(content.right).toBeLessThanOrEqual(close.left + 1);
});

test("the header's calculator icon opens the calculator from another page", async ({ page }) => {
    const errors = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
    await page.goto("/products");
    const icon = page.locator("header a.profit-btn");
    await expect(icon).toBeVisible({ timeout: BOOT_TIMEOUT });
    await page.waitForFunction(() => window.Blazor !== undefined); // let Blazor own the link
    await icon.click();
    await expect(page).toHaveURL(/\/yield-calculator$/);
    await expect(page.locator("#yc-root[data-booted]")).toBeAttached({ timeout: BOOT_TIMEOUT });
    await expect(page.locator("#res-harvest")).toContainText("kg");
    expect(errors).toEqual([]);
});
