/**
 * Proyecto "warmup" de Playwright (ver playwright.config.ts → projects).
 *
 * SPEC-013 Parte B: bajo Turbopack, la PRIMERA visita a cada ruta tras
 * levantar `next dev` dispara su compilación en frío. En Next 16.4.6 ese
 * coste pasó a ser lo bastante alto como para que el primer login/navegación
 * de la suite supere el timeout de 30s (page.waitForURL en helpers.ts),
 * resultando en tests intermitentes — hasta ahora absorbidos por los
 * reintentos de CI (retries: 2), pero no en ejecuciones locales (retries: 0).
 *
 * Este proyecto se ejecuta una sola vez, antes que el resto (projects:
 * chromium → dependencies: ["warmup"]), y fuerza la compilación de las
 * rutas que los specs reales visitan nada más empezar — así los tests
 * reales nunca pagan el coste de la primera compilación.
 *
 * IMPORTANTE: no es un problema de timeout corto. El primer login tras
 * levantar el servidor aterriza una sola vez en "/login?callbackUrl=%2F"
 * (el proxy no ve el token recién creado, probablemente por una condición de
 * carrera con la compilación en frío de proxy.ts) y ya no vuelve a navegar
 * — esperar más no ayuda, hay que reintentar el login. El segundo intento,
 * con el proxy ya compilado, siempre funciona.
 */

import { test } from "@playwright/test";
import { USERS, ROUTES } from "./config";

const WARM_TIMEOUT = 20_000;

async function attemptLogin(page: import("@playwright/test").Page, email: string, password: string): Promise<boolean> {
  await page.goto(ROUTES.login, { timeout: WARM_TIMEOUT });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  try {
    await page.waitForURL((url) => url.pathname === "/", { timeout: WARM_TIMEOUT, waitUntil: "commit" });
    return true;
  } catch {
    return false;
  }
}

async function warmLogin(page: import("@playwright/test").Page, email: string, password: string) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (await attemptLogin(page, email, password)) return;
  }
  throw new Error(`warmup: no se consiguió iniciar sesión como ${email} tras 3 intentos`);
}

test("warmup — precompila las rutas clave antes de la suite real", async ({ page }) => {
  test.setTimeout(120_000);

  await warmLogin(page, USERS.admin.email, USERS.admin.password);

  for (const path of [ROUTES.employees, ROUTES.holidays, ROUTES.info, "/multi-month"]) {
    await page.goto(path, { timeout: WARM_TIMEOUT, waitUntil: "commit" }).catch(() => undefined);
  }
});
