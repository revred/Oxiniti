// Home page "Request Free Pond Demo" form (Pages/Components/FreeDemoSection.razor).
// No backend stores demo requests yet, so the request only reaches the team
// through the pre-filled WhatsApp link the form shows after a valid submit.
// Like yield-calculator.spec.mjs, this reads the link and never opens it.
import { test, expect } from "@playwright/test";

test("a valid demo request offers a pre-filled WhatsApp message to the team", async ({ page }) => {
    await page.goto("/?scrollTo=free-demo");
    const form = page.locator("#free-demo-form");
    await expect(form).toBeVisible({ timeout: 45_000 });

    const waBlock = form.locator('[data-field="wa"]');
    await expect(waBlock).toBeHidden();

    await form.locator("#demo-name").fill("Murugan");
    await form.locator("#demo-phone").fill("+91 98765 43210");
    await form.locator("#demo-place").fill("Lalgudi, Trichy");
    await form.locator("#demo-size").selectOption({ index: 2 });
    // Focus + Enter rather than a click: the sticky header / yield promo card
    // can sit over the button on desktop, and moving focus fires the change
    // event Blazor's InputText binds on.
    await form.locator('button[type="submit"]').focus();
    await form.locator('button[type="submit"]').press("Enter");

    await expect(waBlock).toBeVisible();
    const href = await form.locator('[data-field="wa-link"]').getAttribute("href");
    const url = new URL(href);
    expect(url.origin + url.pathname).toBe("https://wa.me/919659727477");
    const text = url.searchParams.get("text");
    expect(text).toContain("free Oxyniti pond demo");
    expect(text).toContain("Name: Murugan");
    expect(text).toContain("Phone: +91 98765 43210");
    expect(text).toContain("Village / Town: Lalgudi, Trichy");
    expect(text).toContain("Pond size: 1 – 3 acres");
    expect(text).toContain("Species: Tilapia / GIFT");
    expect(text).not.toContain("Pond location");
});

test("an incomplete demo request does not offer the WhatsApp step", async ({ page }) => {
    await page.goto("/?scrollTo=free-demo");
    const form = page.locator("#free-demo-form");
    await expect(form).toBeVisible({ timeout: 45_000 });

    await form.locator("#demo-name").fill("Murugan");
    // Focus + Enter rather than a click: the sticky header / yield promo card
    // can sit over the button on desktop, and moving focus fires the change
    // event Blazor's InputText binds on.
    await form.locator('button[type="submit"]').focus();
    await form.locator('button[type="submit"]').press("Enter");

    await expect(form.locator('[data-field="wa"]')).toBeHidden();
});
