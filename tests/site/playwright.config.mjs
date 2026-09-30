// Browser smoke tests for the site (tests/site/README.md). Starts the Blazor
// dev server on its own port unless one is already listening there.
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.OXY_TEST_PORT || 5199);
const BASE_URL = process.env.OXY_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
    testDir: ".",
    timeout: 60_000,
    expect: { timeout: 15_000 },
    retries: process.env.CI ? 1 : 0,
    reporter: [["list"]],
    use: { baseURL: BASE_URL, trace: "retain-on-failure" },
    projects: [
        { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1600, height: 900 } } },
        { name: "phone", use: { ...devices["Pixel 7"] } },
    ],
    webServer: process.env.OXY_BASE_URL ? undefined : {
        command: `dotnet run --project ../../Oxyniti.csproj --urls ${BASE_URL}`,
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 180_000,
    },
});
