// Account profile (Pages/Account.razor). The Maker API cannot store a profile
// yet, so Save keeps it in this browser per login email and the form opens
// filled in next time. Signs in with a fake token the way my-demos.spec.mjs does.
import { test, expect } from "@playwright/test";

const BOOT_TIMEOUT = 45_000;

function fakeJwt(email) {
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ email, sub: "test-user", iat: now, exp: now + 3600 })}.c2ln`;
}

async function signIn(page, email) {
    await page.addInitScript((token) => {
        localStorage.setItem("maker_access_token", token);
        localStorage.setItem("maker_refresh_token", "refresh");
        localStorage.setItem("is_maker_user", "false");
    }, fakeJwt(email));
}

test("the WhatsApp number can be typed and no longer claims to be the login", async ({ page }) => {
    await signIn(page, "farmer@example.com");
    await page.goto("/account");
    const whatsapp = page.locator("#profile-whatsapp");
    await expect(whatsapp).toBeEditable({ timeout: BOOT_TIMEOUT });
    await expect(page.locator(".account-page")).not.toContainText("used to login");
    await expect(page.locator(".verified-badge")).toHaveCount(0);
    await expect(page.locator("input[disabled]")).toHaveValue("farmer@example.com");
});

test("saved details fill the form next time, for that login only", async ({ page }) => {
    await signIn(page, "farmer@example.com");
    await page.goto("/account");
    await expect(page.locator("#profile-name")).toBeVisible({ timeout: BOOT_TIMEOUT });

    // Every box marked * is needed.
    await page.locator("#profile-name").fill("Murugan");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByTestId("profile-status")).toContainText("marked *");

    await page.locator("#profile-whatsapp").fill("98765 43210");
    await page.locator("#profile-place").fill("Lalgudi");
    await page.locator("#profile-state").fill("Tamil Nadu");
    await page.locator("#profile-pond-location").fill("Near the bus stand");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByTestId("profile-status")).toContainText("filled in next time");

    await page.reload();
    await expect(page.locator("#profile-name")).toHaveValue("Murugan", { timeout: BOOT_TIMEOUT });
    await expect(page.locator("#profile-whatsapp")).toHaveValue("98765 43210");
    await expect(page.locator("#profile-place")).toHaveValue("Lalgudi");
    await expect(page.locator("#profile-state")).toHaveValue("Tamil Nadu");
    await expect(page.locator("#profile-pond-location")).toHaveValue("Near the bus stand");

    // Another login on the same device starts empty.
    await page.addInitScript((token) => localStorage.setItem("maker_access_token", token), fakeJwt("other@example.com"));
    await page.reload();
    await expect(page.locator("#profile-name")).toHaveValue("", { timeout: BOOT_TIMEOUT });
    await expect(page.locator("input[disabled]")).toHaveValue("other@example.com");
});
