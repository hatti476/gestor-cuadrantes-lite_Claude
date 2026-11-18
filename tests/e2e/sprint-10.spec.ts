/**
 * tests/e2e/sprint-10.spec.ts
 * Sprint 10 — Soft-delete, shiftPreference, TECNICO edición, rotación nocturna, contadores
 *
 * CP-71 — shiftPreference se guarda y persiste (TECNICO desechable)
 * CP-72 — Desactivar empleado hace soft-delete, conserva historial y bloquea el login
 * CP-73 — Empleado inactivo no aparece en la API de empleados activos
 * CP-75 — TECH (TECNICO) no puede editar celdas del cuadrante
 * CP-77 — Tabla de contadores aparece debajo del grid con datos coherentes
 * CP-78 — Tabla de contadores: estilo visual consistente con el grid (bordes redondeados, badges de turno)
 * CP-78 — Tabla de contadores: estilo visual consistente con el grid (bordes redondeados, badges de turno)
 */

import { test, expect, Page } from "@playwright/test";
import { USERS, ROUTES } from "./config";
import {
  createDisposableTecnico,
  deleteUserByEmail,
  generateScheduleAndWait,
  loginAsAdmin,
  screenshotOnFail,
  waitForGridOrUnpublished,
} from "./helpers";
import { loginAs as loginAsRole } from "./helpers/auth-utils";
import { waitForGenerationComplete, waitForScheduleGrid } from "./helpers/wait-utils";

// CP-71/72/73 trabajan sobre un TECNICO desechable: modificar los sembrados
// (tecnico1 es el usuario TECNICO de los demás specs) rompía otros tests de la
// misma ejecución, porque la BD solo se resiembra al empezar (SPEC-010).

async function openUserEditor(page: Page, email: string): Promise<void> {
  await page.goto("/admin");
  await expect(page.locator("table").first()).toBeVisible({ timeout: 10_000 });
  await page.getByPlaceholder("Buscar por nombre o email…").fill(email);
  const row = page.locator("table tbody tr").filter({ hasText: email });
  await expect(row).toHaveCount(1);
  await row.getByRole("button", { name: /^Editar$/ }).click();
}

async function deactivateFromEditor(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Desactivar usuario" }).click();
  const patchRes = page.waitForResponse(
    (r) => r.url().includes("/api/admin/users/") && r.request().method() === "PATCH"
  );
  await page.getByRole("button", { name: /^Sí$/ }).click();
  expect((await patchRes).status()).toBe(200);
}

// ===========================================================================
// CP-71 — shiftPreference se guarda y persiste
// ===========================================================================
test("CP-71 — shiftPreference se guarda y persiste al reabrir la edición", async ({ page }) => {
  test.setTimeout(60_000);
  await loginAsAdmin(page);
  // Inactivo desde el principio: no entra en la rotación de otros specs
  const tech = await createDisposableTecnico(page, { inactive: true });
  try {
    await openUserEditor(page, tech.email);
    const prefSelect = page.locator('select:has(option[value="J"])');
    await expect(prefSelect).toHaveValue("");
    await prefSelect.selectOption("M");

    const saveRes = page.waitForResponse(
      (r) => r.url().includes("/api/admin/users/") && r.request().method() === "PATCH"
    );
    await page.getByRole("button", { name: /^Guardar$/ }).click();
    expect((await saveRes).status()).toBe(200);

    await openUserEditor(page, tech.email);
    await expect(page.locator('select:has(option[value="J"])')).toHaveValue("M");
  } catch (e) {
    await screenshotOnFail(page, "CP-71");
    throw e;
  } finally {
    await deleteUserByEmail(page, tech.email);
  }
});

// ===========================================================================
// CP-72 — Desactivar empleado hace soft-delete; historial persiste; no puede entrar
// ===========================================================================
test("CP-72 — Desactivar empleado hace soft-delete, conserva historial y bloquea el login", async ({ page }) => {
  test.setTimeout(60_000);
  await loginAsAdmin(page);
  const tech = await createDisposableTecnico(page);
  try {
    await openUserEditor(page, tech.email);
    await deactivateFromEditor(page);

    const row = page.locator("table tbody tr").filter({ hasText: tech.email });
    await expect(row.getByText("Inactivo")).toBeVisible({ timeout: 5_000 });

    // Soft-delete: el empleado y su historial siguen accesibles
    const history = await page.request.get(`/api/employees/${tech.employeeId}/history`);
    expect(history.status()).toBe(200);

    // H-12: un empleado desactivado no puede iniciar sesión
    await page.context().clearCookies();
    await page.goto(ROUTES.login);
    await page.getByLabel("Email").fill(tech.email);
    await page.getByLabel("Contraseña").fill(tech.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Email o contraseña incorrectos")).toBeVisible({ timeout: 10_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-72");
    throw e;
  } finally {
    await page.context().clearCookies();
    await loginAsAdmin(page);
    await deleteUserByEmail(page, tech.email);
  }
});

// ===========================================================================
// CP-73 — Empleado inactivo no aparece en la API de activos
// ===========================================================================
test("CP-73 — Empleado inactivo no aparece en la lista de empleados activos", async ({ page }) => {
  test.setTimeout(60_000);
  await loginAsAdmin(page);
  const tech = await createDisposableTecnico(page);
  try {
    const names = async (): Promise<string[]> =>
      ((await (await page.request.get("/api/employees")).json()) as { name: string }[]).map((e) => e.name);
    expect(await names()).toContain(tech.name);

    await openUserEditor(page, tech.email);
    await deactivateFromEditor(page);

    expect(await names()).not.toContain(tech.name);
  } catch (e) {
    await screenshotOnFail(page, "CP-73");
    throw e;
  } finally {
    await deleteUserByEmail(page, tech.email);
  }
});

// ===========================================================================
// CP-74 — TECH (TECNICO) no puede editar celdas del cuadrante
// ===========================================================================
test("CP-75 — TECH (TECNICO) no puede editar celdas del cuadrante", async ({ page }) => {
  test.setTimeout(30_000);
  try {
    // Usar técnico (rol TECNICO) que no es TECNICO
    await page.goto(ROUTES.login);
    await page.getByLabel("Email").fill(USERS.tech.email);
    await page.getByLabel("Contraseña").fill(USERS.tech.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL(ROUTES.home, { timeout: 10_000 });
    await page.waitForLoadState("networkidle");

    // Mes sin publicar: el TECNICO no ve grid, así que no hay nada que editar
    if ((await waitForGridOrUnpublished(page)) === "unpublished") {
      await expect(page.locator('[data-testid="edit-palette"]')).toHaveCount(0);
      return;
    }

    // No debe haber paleta de edición (solo ADMIN) ni celdas con cursor-pointer
    await expect(page.locator('[data-testid="edit-palette"]')).toHaveCount(0);
    const firstCell = page.locator("table").first().locator("tbody tr").first().locator("td").nth(1);
    await expect(firstCell).toBeVisible({ timeout: 5_000 });
    await expect(firstCell).not.toHaveClass(/cursor-pointer/);

    // Hacer clic — el turno de la celda (o su ausencia) no debe cambiar
    const shiftBefore = await firstCell
      .locator('[data-testid^="shift-cell-"]')
      .getAttribute("data-testid")
      .catch(() => null);
    await firstCell.click();
    await page.waitForTimeout(600);
    const shiftAfter = await firstCell
      .locator('[data-testid^="shift-cell-"]')
      .getAttribute("data-testid")
      .catch(() => null);
    expect(shiftAfter).toBe(shiftBefore);
  } catch (e) {
    await screenshotOnFail(page, "CP-75");
    throw e;
  }
});

// ===========================================================================
// CP-75 — Tabla de contadores aparece debajo del grid con totales coherentes
// ===========================================================================
test("CP-77 — Tabla de contadores debajo del grid muestra totales correctos @smoke", async ({ page }) => {
  test.setTimeout(90_000);
  try {
    await loginAsRole(page, "admin");
    await page.goto(ROUTES.home);
    await page.waitForLoadState("networkidle");
    await waitForScheduleGrid(page);

    // Generar cuadrante para que haya datos
    await generateScheduleAndWait(page);
    await waitForGenerationComplete(page);

    // La tabla de contadores debe estar visible
    const countersTable = page.locator('[data-testid="counters-table"]');
    await expect(countersTable).toBeVisible({ timeout: 8_000 });

    // Usar el propio grid como fuente de verdad visual para evitar
    // desalineaciones puntuales entre estado cliente y API en caliente.
    const totalAssignments = await page.locator('[data-testid="schedule-grid"] [data-testid^="shift-cell-"]').count();
    expect(totalAssignments).toBeGreaterThan(0);

    // Sumar todos los contadores visibles en la tabla
    const counterCells = countersTable.locator("td[data-testid^='counter-']");
    const cellCount = await counterCells.count();
    expect(cellCount).toBeGreaterThan(0);

    // Calcular la suma de los valores mostrados
    let displayedTotal = 0;
    for (let i = 0; i < cellCount; i++) {
      const text = await counterCells.nth(i).innerText();
      displayedTotal += parseInt(text, 10) || 0;
    }

    // La suma de contadores debe coincidir con el número de asignaciones
    expect(displayedTotal).toBe(totalAssignments);
  } catch (e) {
    await screenshotOnFail(page, "CP-77");
    throw e;
  }
});

// ===========================================================================
// CP-78 — Tabla de contadores: estilo visual consistente con el grid
// ===========================================================================
test("CP-78 — Tabla de contadores tiene estilo visual consistente con el grid", async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await loginAsAdmin(page);
    await page.goto(ROUTES.home);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1_000);

    const countersTable = page.locator('[data-testid="counters-table"]');
    await expect(countersTable).toBeVisible({ timeout: 8_000 });

    // La tabla de contadores debe aparecer DESPUÉS del grid en el DOM
    const grid = page.locator('[data-testid="schedule-grid"]').first();
    const gridBox = await grid.boundingBox();
    const tableBox = await countersTable.boundingBox();
    expect(gridBox).not.toBeNull();
    expect(tableBox).not.toBeNull();
    // La tabla debe estar debajo del grid (mayor coordenada Y)
    expect(tableBox!.y).toBeGreaterThan(gridBox!.y);

    // La tabla NO debe estar más ancha que el viewport (no se extiende al infinito)
    const viewportWidth = page.viewportSize()?.width ?? 1280;
    expect(tableBox!.x + tableBox!.width).toBeLessThanOrEqual(viewportWidth + 20);

    // Las cabeceras de turno en la tabla deben tener color de fondo (mismo que ShiftCell)
    const firstShiftHeader = countersTable.locator("thead th").nth(1).locator("div").first();
    await expect(firstShiftHeader).toBeVisible();
    const bgColor = await firstShiftHeader.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );
    // El fondo no debe ser transparente ni blanco puro (debe tener color de turno)
    expect(bgColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(bgColor).not.toBe("rgb(255, 255, 255)");

    // La tabla de contadores y el grid no deben solaparse verticalmente
    const gridBottom = gridBox!.y + gridBox!.height;
    expect(tableBox!.y).toBeGreaterThanOrEqual(gridBottom - 4); // tolerancia 4px
  } catch (e) {
    await screenshotOnFail(page, "CP-78");
    throw e;
  }
});
