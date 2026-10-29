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
    // A guest stays on the sign-in form.
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
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
    // Signed in, so /login has nothing to offer and sends the visitor home.
    await expect(page).toHaveURL(/\/$/);
    expect(await page.evaluate(() => localStorage.getItem("maker_access_token"))).toBe(fresh);
});

test("a signed-in visitor opening /login is sent home, with no refresh call", async ({ page }) => {
    let refreshed = false;
    await page.route("**/api/public/authentication/refresh-token", (route) => {
        refreshed = true;
        return route.fulfill({ status: 401, body: "" });
    });
    await plantSession(page, fakeJwt("farmer@example.com", 3600));

    await page.goto("/login");
    await expect(page).toHaveURL(/\/$/, { timeout: BOOT_TIMEOUT });
    await expect(page.locator(".header-actions .user-avatar")).toHaveText("F");
    expect(refreshed).toBe(false);
});

// Idle on a staff page. The access token runs out an hour after sign-in; the next
// demo-log call used to send it anyway (StaffDemoService never renewed it),
// got a 401 and bounced to /login while the header still showed the account
// initial. page.clock moves the browser's time -- and .NET's DateTime.UtcNow
// with it -- past the token's expiry without the test actually waiting.
async function idleOnMyDemos(page, refreshReply) {
    await page.clock.install();
    const stale = fakeJwt("oxyniti@example.com", 60 * 60);
    const fresh = fakeJwt("oxyniti@example.com", 120 * 60);
    let idle = false;
    const calls = [];
    await page.route("**/api/public/authentication/refresh-token", (route) => refreshReply(route, fresh));
    await page.route("**/api/demo/**", (route) => {
        const req = route.request();
        const name = new URL(req.url()).pathname.split("/").pop();
        const auth = req.headers()["authorization"];
        calls.push({ name, auth });
        // The server only refuses the old token once it has actually expired.
        if (idle && auth === `Bearer ${stale}`) return route.fulfill({ status: 401, body: "" });
        if (name === "GetDemos")
            return route.fulfill({ json: { demos: [{ barID: 101, demoDateUtc: "2026-10-05T12:00:00Z", place: "Lalgudi", state: "Tamil Nadu", photos: [] }] } });
        return route.fulfill({ status: 204, body: "" });
    });
    await page.addInitScript(([token]) => {
        localStorage.setItem("maker_access_token", token);
        localStorage.setItem("maker_refresh_token", "refresh");
        localStorage.setItem("is_maker_user", "true");
    }, [stale]);

    await page.goto("/my-demos");
    const card = page.getByTestId("demo-card").first();
    await expect(card).toBeVisible({ timeout: BOOT_TIMEOUT });

    await page.clock.fastForward("01:01:00");
    idle = true;
    await card.getByRole("button", { name: "Delete" }).click();
    await card.getByRole("button", { name: "Yes, delete" }).click();
    return { calls, fresh };
}

test("staff idle past the token's expiry stay signed in when the session renews", async ({ page }) => {
    const { calls, fresh } = await idleOnMyDemos(page, (route, fresh) => route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ token: fresh, refreshToken: "refresh-2", isMakerAI: true }),
    }));

    await expect.poll(() => calls.find((c) => c.name === "DeleteDemo")?.auth).toBe(`Bearer ${fresh}`);
    await expect(page).toHaveURL(/\/my-demos$/);
    await expect(page.locator(".header-actions .user-avatar")).toHaveText("O");
});

test("staff idle past the token's expiry land on /login signed out when it can't renew", async ({ page }) => {
    await idleOnMyDemos(page, (route) => route.fulfill({ status: 401, body: "" }));

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator(".header-actions .login-avatar")).toBeVisible();
    await expect(page.locator(".header-actions .user-avatar")).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("maker_access_token"))).toBeNull();
});
