/**
 * Proyecto "warmup" de Playwright (ver playwright.config.ts → projects).
 *
 * SPEC-013 Parte B: bajo Turbopack, la PRIMERA visita a cada ruta tras
 * levantar `next dev` dispara su compilación en frío. En Next 16.4.6 ese
 * coste pasó a ser lo bastante alto como para que el primer login/navegación
 * de la suite supere el timeout de 30s, resultando en tests intermitentes —
 * hasta ahora absorbidos por los reintentos de CI (retries: 2), pero no en
 * ejecuciones locales (retries: 0).
 *
 * Este proyecto se ejecuta una sola vez, antes que el resto (projects:
 * chromium → dependencies: ["warmup"]), y fuerza la compilación de las
 * rutas que los specs reales visitan nada más empezar — así los tests
 * reales nunca pagan el coste de la primera compilación.
 *
 * Reutiliza `login()` de helpers.ts (que ya reintenta ante el síntoma
 * conocido) en vez de duplicar esa lógica — ver su comentario para el
 * detalle del problema.
 */

import { test } from "@playwright/test";
import { USERS, ROUTES } from "./config";
import { login } from "./helpers";

test("warmup — precompila las rutas clave antes de la suite real", async ({ page }) => {
  test.setTimeout(150_000);

  await login(page, USERS.admin.email, USERS.admin.password);

  for (const path of [ROUTES.employees, ROUTES.holidays, ROUTES.info, "/multi-month"]) {
    await page.goto(path, { timeout: 20_000, waitUntil: "commit" }).catch(() => undefined);
  }
});
