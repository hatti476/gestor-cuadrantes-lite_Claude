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

// `workers: 1` (no 2): con un solo servidor seguía fallando TODO el login en
// CI. La traza mostró el click en "Entrar" completándose al instante pero
// sin respuesta del servidor en 30s, y el mismo bloqueo persistía durante
// los 25 min siguientes del job — no es lentitud puntual, es contención real.
// El login usa `bcrypt.compare` (bcryptjs, implementación pura en JS, coste
// 12) en app/api/auth/[...nextauth]/route.ts: con 2 workers cada uno
// arrancando su propio Chromium, ese cómputo compite por las 2 vCPUs
// compartidas del runner de GitHub contra 2 navegadores a la vez. Serializar
// a 1 worker elimina esa contención sin tocar el coste de bcrypt (bajarlo
// sería una regresión de seguridad, no un fix de infraestructura).
export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./tests/screenshots",
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 2,
  timeout: 45_000,
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
