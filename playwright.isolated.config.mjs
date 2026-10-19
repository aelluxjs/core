import { defineConfig, devices } from "@playwright/test";

// Used only for low-impact regression runs. The local server is started and
// stopped explicitly so an interrupted runner cannot leave Playwright's
// webServer supervisor alive.
export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "*.spec.mjs",
  timeout: 30_000,
  expect: { timeout: 20_000 },
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  reporter: "list",
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } }
  ]
});
