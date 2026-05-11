import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./tests/screenshots",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { outputFolder: "tests/report", open: "never" }]],

  // Reset + seed la BD de tests antes de cada suite completa
  globalSetup: "./tests/e2e/global-setup.ts",

  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3001",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  // Servidor de tests en puerto 3001 con BD aislada (test.db)
  // NO interfiere con el servidor de desarrollo en puerto 3000
  webServer: {
    command: "next dev -p 3001",
    url: "http://localhost:3001",
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      DATABASE_URL: "file:./test.db",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
