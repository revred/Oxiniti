// Staff-only demo log (Pages/MyDemos.razor + Services/StaffDemoService.cs).
// Signs in by planting a fake token in localStorage the way
// Maker.RampEdge's AuthenticationService stores a real one, and answers
// /api/demo/* from this file -- nothing here reaches the live Maker API.
import { test, expect } from "@playwright/test";

const BOOT_TIMEOUT = 45_000;

function fakeJwt(email) {
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ email, sub: "test-user", iat: now, exp: now + 3600 })}.c2ln`;
}

async function signIn(page, { staff }) {
    const token = fakeJwt("staff@example.com");
    await page.addInitScript(([token, staff]) => {
        localStorage.setItem("maker_access_token", token);
        localStorage.setItem("maker_refresh_token", "refresh");
        localStorage.setItem("is_maker_user", staff ? "true" : "false");
    }, [token, staff]);
}

const savedDemos = () => ({
    demos: [
        {
            barID: 101,
            demoDateUtc: "2026-10-05T12:00:00Z",
            place: "Lalgudi",
            district: "Trichy",
            state: "Tamil Nadu",
            latitude: 11,
            longitude: 79,
            farmerName: "Murugan",
            farmerPhone: "+91 98765 43210",
            species: "Tilapia / GIFT",
            pondSize: "1 – 3 acres",
            productUsed: "Oxyniti nano-bubble unit",
            doBefore: 3,
            doAfter: 7,
            outcome: "Interested",
            notes: 'Farmer wants a quote.\n\n[[oxyniti:{"by":"Fazil","lat":10.8705,"lng":78.8211,"doBefore":3.2,"doAfter":6.8}]]',
            videoUrl: "https://youtube.com/watch?v=demo",
            photos: [],
            givenBy: "staff@example.com",
        },
        {
            barID: 102,
            demoDateUtc: "2026-09-20T12:00:00Z",
            place: "Bhimavaram",
            district: "West Godavari",
            state: "Andhra Pradesh",
            latitude: 0,
            longitude: 0,
            farmerName: "",
            farmerPhone: "",
            species: "Vannamei shrimp",
            pondSize: "",
            productUsed: "",
            doBefore: 0,
            doAfter: 0,
            outcome: "Ordered",
            notes: "",
            videoUrl: "string",
            photos: [],
            givenBy: "staff@example.com",
        },
    ],
});

async function mockDemoApi(page) {
    const calls = [];
    await page.route("**/api/demo/**", async (route) => {
        const req = route.request();
        const name = new URL(req.url()).pathname.split("/").pop();
        calls.push({ name, body: req.postDataJSON(), auth: req.headers()["authorization"] });
        if (name === "GetDemos") return route.fulfill({ json: savedDemos() });
        if (name === "DeleteDemo") return route.fulfill({ status: 204, body: "" });
        return route.fulfill({ json: {} });
    });
    return calls;
}

test("signed-out visitors are sent to the login page", async ({ page }) => {
    await page.goto("/my-demos");
    await expect(page).toHaveURL(/\/login$/, { timeout: BOOT_TIMEOUT });
});

test("a customer login sees the staff-only notice and never calls the demo API", async ({ page }) => {
    await signIn(page, { staff: false });
    const calls = await mockDemoApi(page);
    await page.goto("/my-demos");
    await expect(page.getByTestId("demos-not-staff")).toBeVisible({ timeout: BOOT_TIMEOUT });
    expect(calls).toEqual([]);
    await expect(page.locator('a[href="/my-demos"]')).toHaveCount(0);
});

test("staff see every demo with who gave it and the exact DO readings", async ({ page }) => {
    await signIn(page, { staff: true });
    const calls = await mockDemoApi(page);
    await page.goto("/my-demos");

    const cards = page.getByTestId("demo-card");
    await expect(cards).toHaveCount(2, { timeout: BOOT_TIMEOUT });
    expect(calls[0].name).toBe("GetDemos");
    expect(calls[0].auth).toMatch(/^Bearer /);

    await expect(page.getByTestId("demos-stats")).toContainText("2");
    const first = cards.first();
    await expect(first.locator(".demo-title")).toHaveText("Lalgudi");
    await expect(first).toContainText("Trichy, Tamil Nadu");
    await expect(first).toContainText("3.2");
    await expect(first).toContainText("6.8");
    await expect(first).toContainText("Farmer wants a quote.");
    await expect(first).not.toContainText("[[oxyniti:");
    await expect(first.getByTestId("demo-given-by")).toContainText("Fazil");
    // A demo with no trailer falls back to the login that saved it.
    await expect(cards.nth(1).getByTestId("demo-given-by")).toContainText("staff@example.com");
    // The server's 0 means "not recorded", not 0 mg/L.
    await expect(cards.nth(1)).not.toContainText("mg/L");

    // Only real web links get a Video tile; the API's "string" placeholder does not.
    await expect(first.locator(".video-tile")).toHaveCount(1);
    await expect(cards.nth(1).locator(".video-tile")).toHaveCount(0);

    // Only the first demo has a location (the second was saved as 0, 0).
    await expect(page.getByTestId("demos-map-count")).toContainText("1 of 2 demos pinned");
    await expect(page.locator(".oxy-pin")).toHaveCount(1);

    await page.getByTestId("demos-filter-by").selectOption("Fazil");
    await expect(cards).toHaveCount(1);
    await expect(page.getByTestId("demos-map-count")).toContainText("1 of 1 demos pinned");
});

test("staff can add a demo; the name and exact readings are sent", async ({ page }) => {
    await signIn(page, { staff: true });
    const calls = await mockDemoApi(page);
    await page.goto("/my-demos");
    await expect(page.getByTestId("demo-card")).toHaveCount(2, { timeout: BOOT_TIMEOUT });

    await page.getByTestId("demos-add").click();
    const form = page.locator("#demo-visit-form");
    await expect(form).toBeVisible();

    // Name is required.
    await form.locator("#demo-place").fill("Musiri");
    await form.locator('button[type="submit"]').click();
    await expect(page.getByTestId("demo-form-error")).toContainText("your name");

    await form.locator("#demo-given-by").fill("Fazil");
    await form.locator("#demo-district").fill("Trichy");
    await form.locator("#demo-do-before").fill("4.5");
    await form.locator("#demo-do-after").fill("7.25");
    await form.locator("#demo-outcome").selectOption("Ordered");
    await form.locator("#demo-notes").fill("Two ponds.");
    await form.locator('button[type="submit"]').click();

    await expect(form).toBeHidden();
    const add = calls.find((c) => c.name === "AddDemo");
    expect(add.body.place).toBe("Musiri");
    expect(add.body.doBefore).toBe(5); // the API only takes whole numbers today...
    expect(add.body.doAfter).toBe(7);
    expect(add.body.notes).toContain("Two ponds.");
    expect(add.body.notes).toContain('"by":"Fazil"'); // ...so the exact values ride in the notes trailer
    expect(add.body.notes).toContain('"doBefore":4.5');
    expect(add.body.notes).toContain('"doAfter":7.25');
    expect(calls.filter((c) => c.name === "GetDemos").length).toBe(2);

    // The name is remembered for next time.
    await page.getByTestId("demos-add").click();
    await expect(page.locator("#demo-given-by")).toHaveValue("Fazil");
});

test("staff can delete a demo after confirming", async ({ page }) => {
    await signIn(page, { staff: true });
    const calls = await mockDemoApi(page);
    await page.goto("/my-demos");
    const first = page.getByTestId("demo-card").first();
    await expect(first).toBeVisible({ timeout: BOOT_TIMEOUT });

    await first.getByRole("button", { name: "Delete" }).click();
    expect(calls.some((c) => c.name === "DeleteDemo")).toBe(false);
    await first.getByRole("button", { name: "Yes, delete" }).click();
    await expect.poll(() => calls.find((c) => c.name === "DeleteDemo")?.body).toEqual({ demoBarID: 101 });
});

test("the yield-calculator promo never covers the staff demo log", async ({ page }) => {
    await signIn(page, { staff: true });
    await mockDemoApi(page);
    await page.goto("/my-demos");
    await expect(page.getByTestId("demo-card").first()).toBeVisible({ timeout: BOOT_TIMEOUT });
    await page.waitForTimeout(4000); // the promo opens about a second after a page loads
    await expect(page.locator("#yield-promo")).not.toHaveAttribute("data-state", "open");
});

test("tapping the map fills village, district and state separately, never over typed text", async ({ page }) => {
    await signIn(page, { staff: true });
    await mockDemoApi(page);
    await page.route("**/nominatim.openstreetmap.org/**", (route) => route.fulfill({
        json: { address: { city: "Tiruchirappalli", county: "Tiruchchirāppalli", state_district: "Tiruchirappalli District", state: "Tamil Nadu" } },
    }));
    await page.goto("/my-demos");
    await expect(page.getByTestId("demo-card").first()).toBeVisible({ timeout: BOOT_TIMEOUT });

    await page.getByTestId("demos-add").click();
    const form = page.locator("#demo-visit-form");
    await form.locator(".demo-picker-map").click({ position: { x: 120, y: 120 } });
    await expect(form.locator("#demo-place")).toHaveValue("Tiruchirappalli");
    await expect(form.locator("#demo-district")).toHaveValue("Tiruchirappalli");
    await expect(form.locator("#demo-state")).toHaveValue("Tamil Nadu");

    // A box typed by hand survives the next tap; the others follow the pin.
    await form.locator("#demo-state").fill("Kerala");
    await form.locator(".demo-picker-map").click({ position: { x: 200, y: 140 } });
    await page.waitForTimeout(1500);
    await expect(form.locator("#demo-state")).toHaveValue("Kerala");
});
