import { test, expect } from "@playwright/test";
import { USERS, ROUTES } from "./config";
import { login, screenshotOnFail } from "./helpers";

const { admin: ADMIN, tech: TECH } = USERS;

/** Alias para compatibilidad con los tests que usaban loginAs(page, email, pass) */
const loginAs = login;

// ─── CP-12 ───────────────────────────────────────────────────────────────────
test("CP-12 — Grid carga datos reales de BD", async ({ page }) => {
  try {
    await loginAs(page, ADMIN.email, ADMIN.password);
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Vista de ejemplo")).not.toBeVisible();
    // Debe haber al menos una fila de empleado
    const rows = page.locator("table tbody tr");
    expect(await rows.count()).toBeGreaterThan(0);
  } catch (e) {
    await screenshotOnFail(page, "CP-12");
    throw e;
  }
});

// ─── CP-13 ───────────────────────────────────────────────────────────────────
test("CP-13 — Mes sin datos muestra grid vacío", async ({ page }) => {
  try {
    await loginAs(page, ADMIN.email, ADMIN.password);
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // Pulsar btn-next-month para ir a Junio 2026 (sin seed)
    await page.locator('[data-testid="btn-next-month"]').click();
    await page.waitForTimeout(2_000);

    // Debe aparecer mensaje de sin turnos
    await expect(
      page.locator("text=Sin turnos asignados este mes")
    ).toBeVisible({ timeout: 8_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-13");
    throw e;
  }
});

// ─── CP-14 ───────────────────────────────────────────────────────────────────
test("CP-14 — Admin puede asignar un turno", async ({ page }) => {
  try {
    await loginAs(page, ADMIN.email, ADMIN.password);
    // Quedarse en Mayo 2026 (tiene empleados y celdas)
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // Hacer clic en la primera celda de día (columna 1 = día 1) del primer empleado
    const firstDayCell = page.locator("table tbody tr").first().locator("td").nth(1);
    await firstDayCell.click();

    // Debe aparecer el modal ShiftEditor
    await expect(page.locator('[data-testid="shift-editor"]')).toBeVisible({ timeout: 5_000 });

    // Seleccionar turno M
    await page.locator('[data-testid="shift-btn-M"]').click();

    // El modal debe cerrarse
    await expect(page.locator('[data-testid="shift-editor"]')).not.toBeVisible({ timeout: 5_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-14");
    throw e;
  }
});

// ─── CP-15 ───────────────────────────────────────────────────────────────────
test("CP-15 — Admin puede cambiar un turno existente", async ({ page }) => {
  try {
    await loginAs(page, ADMIN.email, ADMIN.password);
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // Clic en segunda celda de día del primer empleado (Mayo 2026, día 2)
    const secondDayCell = page.locator("table tbody tr").first().locator("td").nth(2);
    await secondDayCell.click();

    // Debe aparecer el modal
    await expect(page.locator('[data-testid="shift-editor"]')).toBeVisible({ timeout: 5_000 });

    // Seleccionar turno T (diferente)
    await page.locator('[data-testid="shift-btn-T"]').click();

    // Modal se cierra
    await expect(page.locator('[data-testid="shift-editor"]')).not.toBeVisible({ timeout: 5_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-15");
    throw e;
  }
});

// ─── CP-16 ───────────────────────────────────────────────────────────────────
test("CP-16 — Admin puede eliminar un turno", async ({ page }) => {
  try {
    await loginAs(page, ADMIN.email, ADMIN.password);
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // Primero asignar un turno para asegurarnos de que hay algo que borrar
    const targetCell = page.locator("table tbody tr").first().locator("td").nth(3);
    await targetCell.click();
    await expect(page.locator('[data-testid="shift-editor"]')).toBeVisible({ timeout: 5_000 });
    await page.locator('[data-testid="shift-btn-N"]').click();
    await expect(page.locator('[data-testid="shift-editor"]')).not.toBeVisible({ timeout: 5_000 });

    // Reabrir la misma celda (ahora tiene turno N) y limpiar
    await targetCell.click();
    await expect(page.locator('[data-testid="shift-editor"]')).toBeVisible({ timeout: 5_000 });
    await page.locator('[data-testid="shift-editor"]').getByText(/Limpiar celda/i).click();
    await expect(page.locator('[data-testid="shift-editor"]')).not.toBeVisible({ timeout: 5_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-16");
    throw e;
  }
});

// ─── CP-17 ───────────────────────────────────────────────────────────────────
test("CP-17 — Empleado no puede editar turnos", async ({ page }) => {
  try {
    await loginAs(page, TECH.email, TECH.password);
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // Intentar clic en una celda
    const firstDayCell = page.locator("table tbody tr").first().locator("td").nth(1);
    await firstDayCell.click();

    // El modal NO debe aparecer
    await expect(page.locator('[data-testid="shift-editor"]')).not.toBeVisible({ timeout: 3_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-17");
    throw e;
  }
});

// ─── CP-18 ───────────────────────────────────────────────────────────────────
test("CP-18 — API rechaza escritura sin rol SUPER_ADMIN", async ({ request }) => {
  // POST sin autenticación debe devolver 401 o 403
  const response = await request.post("/api/schedules", {
    data: {
      employeeId: "any-id",
      date: "2026-05-10T00:00:00.000Z",
      shiftType: "M",
    },
  });
  expect([401, 403]).toContain(response.status());
});

// ─── CP-19 ───────────────────────────────────────────────────────────────────
test("CP-19 — Listado de empleados visible para ADMIN", async ({ page }) => {
  try {
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto(ROUTES.employees);
    await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });

    // Al menos 1 fila de empleado
    const rows = page.locator("table tbody tr");
    expect(await rows.count()).toBeGreaterThan(0);

    // El admin debe aparecer en la tabla (buscar dentro de la tabla para evitar ambigüedad con el header)
    await expect(page.locator('table').getByText(ADMIN.email)).toBeVisible({ timeout: 5_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-19");
    throw e;
  }
});

// ─── CP-20 ───────────────────────────────────────────────────────────────────
test("CP-20 — Empleado no puede acceder a /employees", async ({ page }) => {
  try {
    await loginAs(page, TECH.email, TECH.password);
    await page.goto(ROUTES.employees);
    // Esperar el redirect cliente-side (router.replace("/")) hasta 8s
    await page.waitForURL((u) => !u.toString().includes("/employees"), { timeout: 8_000 }).catch(() => {});

    // Debe redirigir a / o mostrar acceso denegado
    const url = page.url();
    const isRedirected = !url.includes("/employees");
    const hasForbidden = await page.locator("text=403").isVisible().catch(() => false);
    const hasAccessDenied = await page.locator("text=Acceso denegado").isVisible().catch(() => false);
    expect(isRedirected || hasForbidden || hasAccessDenied).toBe(true);
  } catch (e) {
    await screenshotOnFail(page, "CP-20");
    throw e;
  }
});

// ─── CP-21 ───────────────────────────────────────────────────────────────────
test("CP-21 — Admin puede crear un empleado", async ({ page }) => {
  const timestamp = Date.now();
  const newEmail = `nuevo_${timestamp}@test.local`;
  const newName = `Test Employee ${timestamp}`;

  try {
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto(ROUTES.employees);
    await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });

    // Pulsar botón de crear
    await page.locator("button").filter({ hasText: /Nuevo empleado|Añadir|Crear/i }).click();

    // Rellenar formulario
    await expect(page.locator('input#emp-name')).toBeVisible({ timeout: 5_000 });
    await page.fill('input#emp-name', newName);
    await page.fill('input#emp-email', newEmail);
    await page.fill('input#emp-password', 'NuevoPass1!');

    await page.locator('button[type="submit"]').click();

    // El empleado debe aparecer en la tabla
    await expect(page.locator(`text=${newName}`)).toBeVisible({ timeout: 8_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-21");
    throw e;
  }
});

// ─── CP-22 ───────────────────────────────────────────────────────────────────
test("CP-22 — Admin puede editar un empleado", async ({ page }) => {
  const suffix = Date.now();
  const updatedName = `Tecnico Editado ${suffix}`;

  try {
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto(ROUTES.employees);
    await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });

    // Pulsar primer botón Editar
    await page.locator("button").filter({ hasText: /Editar/i }).first().click();

    // Modal de edición
    await expect(page.locator('input#emp-name')).toBeVisible({ timeout: 5_000 });
    await page.fill('input#emp-name', updatedName);
    await page.locator('button[type="submit"]').click();

    // El nombre actualizado debe aparecer en la tabla
    await expect(page.locator(`text=${updatedName}`)).toBeVisible({ timeout: 8_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-22");
    throw e;
  }
});
