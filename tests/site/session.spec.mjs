// Leftover sessions (Layout/MainLayout.razor DropExpiredSessionAsync). An
// expired token in localStorage used to show the account avatar on every
// Blazor page while the prerendered home header showed the guest icon --
// clicking it opened /login with an "O" avatar on top. Plants tokens the way
// Maker.RampEdge's AuthenticationService stores them and answers the refresh
// call from this file; nothing here reaches the live Maker API.
import { test, expect } from "@playwright/test";

const BOOT_TIMEOUT = 90_000;

function fakeJwt(email, expiresInSeconds) {
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ email, sub: "test-user", iat: now - 7200, exp: now + expiresInSeconds })}.c2ln`;
}

async function plantSession(page, token) {
    await page.addInitScript((token) => {
        // Only on the first load: a sign-out that clears it must stick across reloads.
        if (sessionStorage.getItem("planted")) return;
        sessionStorage.setItem("planted", "1");
        localStorage.setItem("maker_access_token", token);
        localStorage.setItem("maker_refresh_token", "refresh");
        localStorage.setItem("is_maker_user", "true");
    }, token);
}

test("an expired session the server won't renew shows the guest icon on /login", async ({ page }) => {
    await page.route("**/api/public/authentication/refresh-token", (route) =>
        route.fulfill({ status: 401, body: "" }));
    await plantSession(page, fakeJwt("oxyniti@example.com", -3600));

    await page.goto("/login");
    await expect(page.locator(".header-actions .login-avatar")).toBeVisible({ timeout: BOOT_TIMEOUT });
    await expect(page.locator(".header-actions .user-avatar")).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("maker_access_token"))).toBeNull();
});

test("an expired session is renewed when the refresh token still works", async ({ page }) => {
    const fresh = fakeJwt("staff@example.com", 3600);
    await page.route("**/api/public/authentication/refresh-token", (route) =>
        route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ token: fresh, refreshToken: "refresh-2", isMakerAI: true }),
        }));
    await plantSession(page, fakeJwt("staff@example.com", -3600));

    await page.goto("/login");
    await expect(page.locator(".header-actions .user-avatar")).toHaveText("S", { timeout: BOOT_TIMEOUT });
    expect(await page.evaluate(() => localStorage.getItem("maker_access_token"))).toBe(fresh);
});

test("a live session still shows the account initial without a refresh call", async ({ page }) => {
    let refreshed = false;
    await page.route("**/api/public/authentication/refresh-token", (route) => {
        refreshed = true;
        return route.fulfill({ status: 401, body: "" });
    });
    await plantSession(page, fakeJwt("farmer@example.com", 3600));

    await page.goto("/login");
    await expect(page.locator(".header-actions .user-avatar")).toHaveText("F", { timeout: BOOT_TIMEOUT });
    expect(refreshed).toBe(false);
});
