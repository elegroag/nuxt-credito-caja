import { defineConfig, devices } from "@playwright/test";
import type { NuxtDevServer } from "@nuxt/test-utils/playwright";

export default defineConfig<NuxtDevServer>({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "tests/e2e/reports" }],
    ["list"]
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] }
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 14"] }
    }
  ],
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: "ignore",
    stderr: "pipe"
  }
});
