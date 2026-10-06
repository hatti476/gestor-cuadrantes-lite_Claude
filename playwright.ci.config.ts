import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

// CP-171: en CI la app ya corre contra prisma/test.db desde el paso "Start
// application" (`npm run start`, puerto 3000). El config por defecto
// (playwright.config.ts) levanta ADEMÁS su propio `next dev -p 3001`: dos
// servidores Next.js a la vez agotaban la CPU/memoria del runner y el login
// de los 30 tests fallaba por timeout (ver tests/e2e/known-failures.md).
//
// Igual que playwright.docker.config.ts para el contenedor Docker: sin
// webServer propio, y E2E_DATABASE_URL fijado para que globalSetup trunque
// y resiembre las tablas de ESA misma BD en lugar de borrar el fichero — el
// proceso de la app ya tiene el inode abierto y seguiría leyendo el fichero
// eliminado si globalSetup lo borrase.
process.env.E2E_DATABASE_URL = process.env.DATABASE_URL ?? "file:./test.db";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./tests/screenshots",
  fullyParallel: false,
  workers: 2,
  forbidOnly: true,
  retries: 2,
  reporter: [["list"], ["html", { outputFolder: "tests/report", open: "never" }]],

  globalSetup: "./tests/e2e/global-setup.ts",

  use: {
    baseURL: "http://localhost:3000", // servidor ya construido y arrancado por el workflow
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },

  // NO webServer — lo arranca el workflow con `npm run start` antes de este paso.

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
