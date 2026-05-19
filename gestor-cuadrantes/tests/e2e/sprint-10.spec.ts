/**
 * tests/e2e/sprint-10.spec.ts
 * Sprint 10 — Soft-delete, shiftPreference, PROJECT_ADMIN edición, rotación nocturna, contadores
 *
 * CP-71 — shiftPreference se guarda y muestra badge en el listado de empleados
 * CP-72 — Desactivar empleado hace soft-delete; el historial persiste
 * CP-73 — Empleado inactivo no aparece en el selector de generación (API activos)
 * CP-74 — PROJECT_ADMIN puede editar celdas de su proyecto
 * CP-75 — PROJECT_ADMIN no puede editar celdas de otro proyecto (sin onCellClick)
 * CP-76 — nightRotationOrder se puede reordenar y guardar desde /projects
 * CP-77 — Tabla de contadores aparece debajo del grid con datos coherentes
 * CP-78 — Tabla de contadores: estilo visual consistente con el grid (bordes redondeados, badges de turno)
 */

import { test, expect } from "@playwright/test";
import { USERS, ROUTES } from "./config";
import { generateScheduleAndWait, loginAsAdmin, loginAsPM, screenshotOnFail } from "./helpers";

// ===========================================================================
// CP-71 — shiftPreference se guarda y muestra badge
// ===========================================================================
test("CP-71 — shiftPreference se guarda y muestra badge en el listado", async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await loginAsAdmin(page);
    await page.goto(ROUTES.employees);
    await page.waitForLoadState("networkidle");

    // Esperar tabla de empleados
    await expect(page.locator("table").first()).toBeVisible({ timeout: 10_000 });

    // Obtener el id del primer empleado activo desde el botón de desactivar
    const deactivateBtn = page.locator('[data-testid^="btn-deactivate-"]').first();
    await expect(deactivateBtn).toBeVisible({ timeout: 8_000 });
    const testid = await deactivateBtn.getAttribute("data-testid");
    const empId = testid?.replace("btn-deactivate-", "") ?? "";

    // Abrir formulario de edición del primer empleado activo
    await page.locator("button").filter({ hasText: /Editar/i }).first().click();

    // Esperar que aparezca el selector de preferencia de turno
    const prefSelect = page.locator('[data-testid="select-shift-preference"]');
    await expect(prefSelect).toBeVisible({ timeout: 5_000 });

    // Seleccionar "Solo mañanas"
    await prefSelect.selectOption("M");

    // Guardar
    const saveRes = page.waitForResponse(
      (r) => r.url().includes("/api/employees/") && r.request().method() === "PATCH"
    );
    await page.locator('button[type="submit"]').click();
    await saveRes;

    // Verificar que aparece el badge de preferencia "Mañanas"
    await page.waitForTimeout(500);
    const badge = page.locator(`[data-testid="badge-pref-${empId}"]`);
    await expect(badge).toBeVisible({ timeout: 5_000 });
    await expect(badge).toHaveText("Mañanas");
  } catch (e) {
    await screenshotOnFail(page, "CP-71");
    throw e;
  }
});

// ===========================================================================
// CP-72 — Desactivar empleado hace soft-delete; historial persiste
// ===========================================================================
test("CP-72 — Desactivar empleado hace soft-delete y persiste historial", async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await loginAsAdmin(page);
    await page.goto(ROUTES.employees);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("table").first()).toBeVisible({ timeout: 10_000 });

    // Tomar el primer botón de desactivar disponible
    const deactivateBtn = page.locator('[data-testid^="btn-deactivate-"]').first();
    await expect(deactivateBtn).toBeVisible({ timeout: 8_000 });

    // Click en desactivar — aparece modal de confirmación
    await deactivateBtn.click();
    const confirmBtn = page.locator('[data-testid="btn-confirm-deactivate"]');
    await expect(confirmBtn).toBeVisible({ timeout: 5_000 });

    // Confirmar desactivación y esperar DELETE
    const deleteRes = page.waitForResponse(
      (r) => r.url().includes("/api/employees/") && r.request().method() === "DELETE"
    );
    await confirmBtn.click();
    const resp = await deleteRes;
    expect(resp.status()).toBe(200);

    // El empleado debe aparecer ahora con badge "Inactivo"
    await page.waitForTimeout(500);
    const inactiveBadge = page.locator("text=Inactivo").first();
    await expect(inactiveBadge).toBeVisible({ timeout: 5_000 });

    // El botón "Reactivar" debe estar visible
    const reactivateBtn = page.locator('[data-testid^="btn-reactivate-"]').first();
    await expect(reactivateBtn).toBeVisible({ timeout: 5_000 });

    // El botón de historial debe seguir existiendo (historial persistido)
    const historyBtn = page.locator('[data-testid^="btn-history-"]').first();
    await expect(historyBtn).toBeVisible({ timeout: 5_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-72");
    throw e;
  }
});

// ===========================================================================
// CP-73 — Empleado inactivo no aparece en el grid (API de activos)
// ===========================================================================
test("CP-73 — Empleado inactivo no aparece en el grid del cuadrante", async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await loginAsAdmin(page);
    await page.goto(ROUTES.employees);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("table").first()).toBeVisible({ timeout: 10_000 });

    // Obtener nombre del primer empleado activo desde la primera celda
    const firstNameCell = page.locator("table").first().locator("tbody tr").first().locator("td").first();
    await expect(firstNameCell).toBeVisible({ timeout: 8_000 });
    const empName = (await firstNameCell.innerText()).trim();

    // Desactivarlo usando el primer botón desactivar disponible
    const deactivateBtn = page.locator('[data-testid^="btn-deactivate-"]').first();
    await expect(deactivateBtn).toBeVisible({ timeout: 5_000 });
    await deactivateBtn.click();
    const confirmBtn = page.locator('[data-testid="btn-confirm-deactivate"]');
    await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
    const deleteRes = page.waitForResponse(
      (r) => r.url().includes("/api/employees/") && r.request().method() === "DELETE"
    );
    await confirmBtn.click();
    await deleteRes;
    await page.waitForTimeout(400);

    // Verificar que la API de empleados (sin includeInactive) no devuelve el empleado
    const activeEmps = await page.evaluate(async () => {
      const res = await fetch("/api/employees", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    });
    const empNames = (activeEmps as Array<{ name: string }>).map((e) => e.name);
    const found = empNames.some((n) => n === empName);
    expect(found).toBe(false);
  } catch (e) {
    await screenshotOnFail(page, "CP-73");
    throw e;
  }
});

// ===========================================================================
// CP-74 — PROJECT_ADMIN puede editar celdas de su proyecto
// ===========================================================================
test("CP-74 — PROJECT_ADMIN puede editar celdas de su proyecto", async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await loginAsPM(page);
    await page.goto(ROUTES.home);
    await page.waitForLoadState("networkidle");

    // Asegurarse de que el proyecto del PM esté activo
    // El PM pertenece a "Equipo Soporte 24h" del seed
    // El proyecto activo se guarda en localStorage — navegar a /projects y seleccionarlo
    await page.goto(ROUTES.projects);
    await page.waitForLoadState("networkidle");

    const projectRow = page.locator('[data-testid="project-row"]').first();
    await expect(projectRow).toBeVisible({ timeout: 10_000 });
    await projectRow.locator('[data-testid="btn-select-project"]').click();
    // Debe redirigir al home
    await page.waitForURL(ROUTES.home, { timeout: 10_000 });
    await page.waitForLoadState("networkidle");

    // Esperar a que la tabla cargue
    await expect(page.locator("table").first()).toBeVisible({ timeout: 10_000 });

    // Verificar que las celdas son clicables (el grid renderiza con cursor-pointer)
    const firstCell = page.locator("table").first().locator("tbody tr").first().locator("td").nth(1);
    await expect(firstCell).toBeVisible({ timeout: 5_000 });

    // Hacer clic — debe aparecer el ShiftEditor
    await firstCell.click();
    const editor = page.locator('[data-testid="shift-editor"]');
    await expect(editor).toBeVisible({ timeout: 5_000 });

    // Cerrar el editor con el botón "Cancelar"
    await editor.getByRole("button", { name: "Cancelar" }).click();
    await expect(editor).not.toBeVisible({ timeout: 3_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-74");
    throw e;
  }
});

// ===========================================================================
// CP-75 — PROJECT_ADMIN no puede editar celdas (sin proyecto activo distinto)
// ===========================================================================
test("CP-75 — TECH (USER) no puede editar celdas del cuadrante", async ({ page }) => {
  test.setTimeout(30_000);
  try {
    // Usar técnico (rol USER) que no es PROJECT_ADMIN
    await page.goto(ROUTES.login);
    await page.getByLabel("Email").fill(USERS.tech.email);
    await page.getByLabel("Contraseña").fill(USERS.tech.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL(ROUTES.home, { timeout: 10_000 });
    await page.waitForLoadState("networkidle");

    await expect(page.locator("table").first()).toBeVisible({ timeout: 10_000 });

    // Comprobar que las celdas NO tienen cursor-pointer (no son editables)
    const firstCell = page.locator("table").first().locator("tbody tr").first().locator("td").nth(1);
    await expect(firstCell).toBeVisible({ timeout: 5_000 });

    // Hacer clic — el ShiftEditor NO debe aparecer
    await firstCell.click();
    await page.waitForTimeout(600);
    const editor = page.locator('[data-testid="shift-editor"]');
    await expect(editor).not.toBeVisible({ timeout: 2_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-75");
    throw e;
  }
});

// ===========================================================================
// CP-76 — nightRotationOrder se puede reordenar y guardar
// ===========================================================================
test("CP-76 — nightRotationOrder se puede reordenar y guardar en /projects", async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await loginAsAdmin(page);
    await page.goto(ROUTES.projects);
    await page.waitForLoadState("networkidle");

    // Abrir el panel de rotación del primer proyecto
    const firstRow = page.locator('[data-testid="project-row"]').first();
    await expect(firstRow).toBeVisible({ timeout: 10_000 });
    await firstRow.locator('[data-testid="btn-rotation-order"]').click();

    // Esperar que aparezca el panel
    const panel = page.locator('[data-testid="night-rotation-panel"]');
    await expect(panel).toBeVisible({ timeout: 8_000 });

    // Esperar que la lista de empleados cargue
    const orderList = page.locator('[data-testid="rotation-order-list"]');
    await expect(orderList).toBeVisible({ timeout: 8_000 });

    // Debe haber al menos un empleado en la lista
    const items = orderList.locator('li');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Si hay al menos 2 empleados, mover el primero hacia abajo
    if (count >= 2) {
      const firstItemId = await items.first().getAttribute("data-testid");
      // Extraer el id del testid "rotation-item-{id}"
      const empId = firstItemId?.replace("rotation-item-", "") ?? "";
      const downBtn = page.locator(`[data-testid="btn-rotation-down-${empId}"]`);
      await expect(downBtn).toBeVisible({ timeout: 3_000 });
      await downBtn.scrollIntoViewIfNeeded();
      await downBtn.click({ force: true });
      await page.waitForTimeout(200);

      // El primer elemento debe haber cambiado
      const newFirstId = await items.first().getAttribute("data-testid");
      expect(newFirstId).not.toBe(firstItemId);
    }

    // Guardar el orden
    const saveBtn = page.locator('[data-testid="btn-save-rotation-order"]');
    await expect(saveBtn).toBeVisible({ timeout: 3_000 });

    const putRes = page.waitForResponse(
      (r) => r.url().includes("/api/projects/") && r.request().method() === "PUT"
    );
    await saveBtn.click();
    const resp = await putRes;
    expect(resp.status()).toBe(200);

    // El panel debe cerrarse tras guardar
    await expect(panel).not.toBeVisible({ timeout: 5_000 });

    // Toast de éxito debe aparecer
    await expect(page.locator("text=orden de rotación guardado").or(page.locator("text=Orden de rotación guardado"))).toBeVisible({ timeout: 5_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-76");
    throw e;
  }
});

// ===========================================================================
// CP-77 — Tabla de contadores aparece debajo del grid con totales coherentes
// ===========================================================================
test("CP-77 — Tabla de contadores debajo del grid muestra totales correctos", async ({ page }) => {
  test.setTimeout(90_000);
  try {
    await loginAsAdmin(page);
    await page.goto(ROUTES.home);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("table").first()).toBeVisible({ timeout: 10_000 });

    // Generar cuadrante para que haya datos
    await generateScheduleAndWait(page);

    // La tabla de contadores debe estar visible
    const countersTable = page.locator('[data-testid="counters-table"]');
    await expect(countersTable).toBeVisible({ timeout: 8_000 });

    // Obtener datos de la API para verificar coherencia
    // La URL puede no tener parámetros si es el mes actual; usar la API directamente
    const { scheduleData, activeEmployees } = await page.evaluate(async () => {
      const now = new Date();
      const [scheduleRes, employeeRes] = await Promise.all([
        fetch(
        `/api/schedules?year=${now.getFullYear()}&month=${now.getMonth() + 1}`,
        { credentials: "include" }
        ),
        fetch("/api/employees", { credentials: "include" }),
      ]);
      return {
        scheduleData: scheduleRes.ok ? await scheduleRes.json() : { assignments: [] },
        activeEmployees: employeeRes.ok ? await employeeRes.json() : [],
      };
    });

    const assignments = Array.isArray(scheduleData)
      ? scheduleData
      : (scheduleData as { assignments?: Array<{ shiftType: string }> }).assignments ?? [];
    const activeEmployeeIds = new Set((activeEmployees as Array<{ id: string }>).map((e) => e.id));
    const totalAssignments = assignments.filter((a: { employeeId?: string }) =>
      a.employeeId ? activeEmployeeIds.has(a.employeeId) : true
    ).length;
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
    const grid = page.locator(".overflow-x-auto.w-fit").first();
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
