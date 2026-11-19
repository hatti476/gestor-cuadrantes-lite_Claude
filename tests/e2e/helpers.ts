/**
 * Helpers compartidos para todos los tests E2E.
 * Importar desde aqui - no duplicar en cada spec.
 */

import { expect, Page } from "@playwright/test";
import path from "path";
import fs from "fs";
import { USERS, ROUTES } from "./config";

/**
 * Un intento de login. Puede aterrizar en "/login?callbackUrl=%2F" sin volver
 * a navegar (no es lentitud: ver `login` más abajo) — en ese caso devuelve
 * false en vez de esperar el timeout completo.
 */
async function attemptLogin(page: Page, email: string, password: string): Promise<boolean> {
  await page.goto(ROUTES.login);

  // CRITICO: en modo dev React tarda ~2s en hidratar. Si hacemos click antes,
  // el navegador ejecuta el submit NATIVO del boton (GET /login?callbackUrl=/)
  // en lugar del onSubmit de React, y el login nunca ocurre.
  await page.waitForFunction(
    () => {
      const form = document.querySelector("form");
      if (!form) return false;
      const key = Object.keys(form).find((k) => k.startsWith("__reactProps"));
      if (!key) return false;
      return typeof (form as never as Record<string, { onSubmit?: unknown }>)[key].onSubmit === "function";
    },
    undefined,
    { timeout: 30_000 }
  );

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();

  try {
    await page.waitForURL((url) => url.pathname === "/", {
      timeout: 15_000,
      waitUntil: "commit",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Realiza el login con las credenciales indicadas y espera la redireccion a /.
 *
 * Bajo Turbopack (next dev), la primera petición autenticada a una ruta que
 * aún no se compiló puede aterrizar una sola vez en "/login?callbackUrl=%2F"
 * (el proxy no llega a ver el token recién creado) y ya no vuelve a navegar
 * — esperar más no ayuda, hay que reintentar el login. El segundo intento,
 * con la ruta ya compilada, siempre funciona. No ocurre contra una build de
 * producción (`next build` + `next start`), solo en desarrollo.
 */
export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    if (await attemptLogin(page, email, password)) return;
  }
  throw new Error(`login: no se consiguió iniciar sesión como ${email} tras 2 intentos`);
}

/** Login rapido como ADMIN. */
export async function loginAsAdmin(page: Page): Promise<void> {
  return login(page, USERS.admin.email, USERS.admin.password);
}

/** Login rapido como tecnico (TECNICO). */
export async function loginAsTech(page: Page): Promise<void> {
  return login(page, USERS.tech.email, USERS.tech.password);
}

/** Login rapido como VIEWER. */
export async function loginAsViewer(page: Page): Promise<void> {
  return login(page, USERS.viewer.email, USERS.viewer.password);
}

/**
 * Captura un screenshot al fallar un test.
 * Se guarda en tests/screenshots/<cpId>-fail.png
 */
export async function screenshotOnFail(page: Page, cpId: string): Promise<void> {
  const dir = path.join(process.cwd(), "tests/screenshots");
  fs.mkdirSync(dir, { recursive: true });
  try {
    await page.screenshot({
      path: path.join(dir, `${cpId}-fail.png`),
      fullPage: true,
    });
  } catch {
    // La pagina puede estar cerrada; ignoramos el error del screenshot.
  }
}

/**
 * Espera a que la vista mensual muestre el grid o el aviso de mes no publicado
 * (TECNICO/VIEWER solo ven meses publicados — CHANGELOG 2.3.0) y dice cuál.
 */
export async function waitForGridOrUnpublished(page: Page): Promise<"grid" | "unpublished"> {
  const grid = page.locator('[data-testid="schedule-grid"]');
  const unpublished = page.locator('[data-testid="unpublished-message"]');
  await expect(grid.or(unpublished)).toBeVisible({ timeout: 15_000 });
  return (await unpublished.isVisible()) ? "unpublished" : "grid";
}

/**
 * Borra (como ADMIN, vía API) el usuario con ese email si existe. Para tests que
 * crean empleados desde la UI: un TECNICO extra en la BD compartida entra en la
 * rotación y cambia el resultado de los specs que generan cuadrantes.
 */
export async function deleteUserByEmail(page: Page, email: string): Promise<void> {
  const res = await page.request.get("/api/admin/users");
  if (!res.ok()) return;
  const users: { id: string; email: string }[] = await res.json();
  const user = users.find((u) => u.email === email);
  if (user) await page.request.delete(`/api/admin/users/${user.id}`);
}

export interface DisposableTecnico {
  userId: string;
  employeeId: string;
  email: string;
  name: string;
  password: string;
}

/**
 * Crea (como ADMIN, vía API) un TECNICO desechable para tests que modifican
 * empleados, en vez de tocar los sembrados. Borrar con deleteUserByEmail en un
 * finally. Mientras esté activo entra en la rotación: desactivarlo cuanto antes
 * si el test no necesita que lo esté (opción `inactive`).
 */
export async function createDisposableTecnico(
  page: Page,
  opts: { inactive?: boolean } = {}
): Promise<DisposableTecnico> {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const tech = { email: `tecnico-tmp-${suffix}@cuadrantes.test`, name: `Técnico Tmp ${suffix}`, password: "Temporal1234!" };
  const res = await page.request.post("/api/admin/users", {
    data: { ...tech, globalRole: "TECNICO" },
  });
  expect(res.status()).toBe(201);
  const user: { id: string; employee: { id: string } } = await res.json();
  if (opts.inactive) {
    const patch = await page.request.patch(`/api/admin/users/${user.id}`, { data: { active: false } });
    expect(patch.status()).toBe(200);
  }
  return { ...tech, userId: user.id, employeeId: user.employee.id };
}

/**
 * Espera a que el boton "Generar cuadrante" este visible. Desde SPEC-012 el
 * panel de preparacion ya no tiene pasos clicables: el boton esta siempre
 * visible, no hace falta abrir ningun paso para revelarlo.
 */
export async function openGenerateStep(page: Page): Promise<void> {
  await expect(page.locator('[data-testid="btn-generate"]')).toBeVisible({ timeout: 5_000 });
}

/** Genera el mes actual, confirmando regeneracion cuando sea necesario. */
export async function generateScheduleAndWait(page: Page): Promise<void> {
  await openGenerateStep(page);

  const generateRes = page.waitForResponse(
    (r) => r.url().includes("/api/schedules/generate") && r.status() === 200,
    { timeout: 120_000 }
  );
  await page.locator('[data-testid="btn-generate"]').click();

  const confirmModal = page.locator('[data-testid="confirm-generate-modal"]');
  if (await confirmModal.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await page.locator('[data-testid="btn-confirm-generate"]').click();
  }

  await generateRes;
  await page
    .waitForResponse(
      (r) => r.url().includes("/api/schedules") && !r.url().includes("/generate") && r.status() === 200,
      { timeout: 30_000 }
    )
    .catch(() => undefined);
  await page.waitForTimeout(500);
}

/**
 * Selecciona `tool` en la paleta de edicion (SPEC-012) y lo pinta haciendo
 * clic sobre la primera celda editable que encuentra. Reintenta en varias
 * celdas para evitar clicks flaky en celdas bloqueadas/no interactivas.
 * Devuelve el data-testid de la celda pintada (p. ej. "cell-emp-1-2026-05-10").
 */
export async function paintCellWithPalette(page: Page, tool: string): Promise<string> {
  await page.locator(`[data-testid="palette-swatch-${tool}"]`).click();

  const cells = page.locator(
    'td[data-testid^="cell-"]:not([data-locked="true"]):not(:has([data-testid="shift-cell-V"])):not(:has([data-testid="shift-cell-B"]))'
  );
  const total = await cells.count();
  const limit = Math.min(total, 20);

  for (let i = 0; i < limit; i++) {
    const cell = cells.nth(i);
    if (!(await cell.isVisible().catch(() => false))) continue;
    const testId = await cell.getAttribute("data-testid");
    await cell.scrollIntoViewIfNeeded().catch(() => undefined);
    await cell.click({ timeout: 5_000 }).catch(() => undefined);
    if (await cell.locator(`[data-testid="shift-cell-${tool}"]`).isVisible({ timeout: 1_500 }).catch(() => false)) {
      return testId ?? "";
    }
  }

  throw new Error(`No se pudo pintar el turno ${tool} en ninguna celda editable`);
}