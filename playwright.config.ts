import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests run against a running portal (npm run build && npm start), with a seeded admin.
 * E2E_BASE_URL defaults to http://localhost:3000. E2E_EMAIL and E2E_PASSWORD are the admin's sign-in.
 */
export default defineConfig({
  testDir: "tests",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
  },
});
