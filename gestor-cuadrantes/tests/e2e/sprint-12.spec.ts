/**
 * tests/e2e/sprint-12.spec.ts
 * Sprint 12 — Aislamiento de proyectos en ShiftAssignment, preferencia Jornada,
 *             transferencia de bloque de noches por vacaciones, fila propia en grid
 *
 * CP-86 — Un nuevo proyecto no hereda asignaciones de proyectos anteriores
 *          (regresión de BUG-29: projectId en ShiftAssignment)
 * CP-87 — La preferencia "Jornada" aparece en el formulario y en la tabla de empleados
 * CP-88 — Bloque de noches se transfiere cuando el empleado tiene vacaciones en esos días
 *          (regresión: resolveNightBlocks en generateMonthSchedule)
 * CP-89 — La fila del usuario autenticado se resalta en el cuadrante (RF-19)
 */

import { test, expect } from "@playwright/test";
import { ROUTES } from "./config";
import { loginAsAdmin, screenshotOnFail } from "./helpers";

// ===========================================================================
// CP-86 — Nuevo proyecto no hereda asignaciones de proyectos anteriores
// ===========================================================================
test("CP-86 — nuevo proyecto no hereda asignaciones de proyectos anteriores", async ({
  page,
}) => {
  test.setTimeout(120_000);
  try {
    await loginAsAdmin(page);

    // ── Paso 1: obtener el proyecto sembrado con cuadrante de Mayo 2026
    const projectsResp = await page.request.get("/api/projects");
    expect(projectsResp.status()).toBe(200);
    const projects: { id: string }[] = await projectsResp.json();
    expect(projects.length).toBeGreaterThan(0);
    const existingProjectId: string = projects[0].id;

    // Verificar que el proyecto existente tiene turnos sembrados en Mayo 2026
    const existingResponse = await page.request.get(
      `/api/schedules?year=2026&month=5&projectId=${existingProjectId}`
    );
    expect(existingResponse.status()).toBe(200);
    const { assignments: existingAssignments } = await existingResponse.json();
    expect(existingAssignments.length).toBeGreaterThan(0);

    // ── Paso 2: crear un proyecto nuevo
    const newProjectName = `Proyecto-CP86-${Date.now()}`;
    const createResp = await page.request.post("/api/projects", {
      data: { name: newProjectName, description: "Test aislamiento BUG-29" },
    });
    expect(createResp.status()).toBe(201);
    const newProject = await createResp.json();
    const newProjectId: string = newProject.id;
    expect(newProjectId).toBeTruthy();

    // ── Paso 3: añadir al nuevo proyecto los mismos empleados del proyecto existente
    // Nota: POST /members actualiza Employee.projectId como side-effect →
    //       la limpieza debe restaurar los empleados al proyecto original
    const empResponse = await page.request.get("/api/employees");
    expect(empResponse.status()).toBe(200);
    const allEmployees: { id: string; user: { id: string } }[] = await empResponse.json();
    expect(allEmployees.length).toBeGreaterThan(0);

    for (const emp of allEmployees) {
      const addResp = await page.request.post(
        `/api/projects/${newProjectId}/members`,
        { data: { userId: emp.user.id, role: "EMPLOYEE" } }
      );
      expect([201, 409]).toContain(addResp.status());
    }

    // ── Paso 4 (ASSERTION PRINCIPAL): el cuadrante del nuevo proyecto
    //   para Mayo 2026 debe estar completamente vacío.
    //   Regresión de BUG-29: antes del fix devolvía las asignaciones del proyecto
    //   original porque filtraba por Employee.projectId (mutable).
    const newSchedResp = await page.request.get(
      `/api/schedules?year=2026&month=5&projectId=${newProjectId}`
    );
    expect(newSchedResp.status()).toBe(200);
    const { assignments: newAssignments } = await newSchedResp.json();
    expect(
      newAssignments,
      "El nuevo proyecto NO debe heredar asignaciones de proyectos anteriores"
    ).toHaveLength(0);

    // Verificar también para otros meses
    for (const month of [6, 7]) {
      const resp = await page.request.get(
        `/api/schedules?year=2026&month=${month}&projectId=${newProjectId}`
      );
      expect(resp.status()).toBe(200);
      const { assignments } = await resp.json();
      expect(assignments).toHaveLength(0);
    }

    // ── Limpieza: eliminar nuevo proyecto y restaurar employees al proyecto original
    await page.request.delete(`/api/projects/${newProjectId}`);
    // Restaurar Employee.projectId re-añadiendo empleados al proyecto original
    for (const emp of allEmployees) {
      await page.request.post(
        `/api/projects/${existingProjectId}/members`,
        { data: { userId: emp.user.id, role: "EMPLOYEE" } }
      );
    }
  } catch (e) {
    await screenshotOnFail(page, "CP-86");
    throw e;
  }
});

// ===========================================================================
// CP-87 — Preferencia "Jornada" disponible en formulario y tabla de empleados
// ===========================================================================
test("CP-87 — preferencia Jornada aparece en formulario y tabla de empleados", async ({
  page,
}) => {
  test.setTimeout(60_000);
  let originalPreference: string | null = null;

  try {
    await loginAsAdmin(page);
    await page.goto(ROUTES.employees);
    await page.waitForLoadState("networkidle");

    // Hacer clic en el botón "Editar" del primer empleado activo
    const editBtn = page.getByRole("button", { name: "Editar" }).first();
    await expect(editBtn).toBeVisible({ timeout: 10_000 });

    const editLink = page.getByRole("button", { name: "Editar" }).first();
    await editLink.click();

    // El select de preferencia debe contener la opción "Jornada (L-V 9:00–18:00)"
    const prefSelect = page.locator('[data-testid="select-shift-preference"]');
    await expect(prefSelect).toBeVisible({ timeout: 5_000 });
    await expect(prefSelect.locator('option[value="J"]')).toHaveCount(1);

    // Guardar la preferencia original para restaurarla en cleanup
    originalPreference = await prefSelect.inputValue();

    // Seleccionar "Jornada" y guardar
    await prefSelect.selectOption("J");
    await expect(prefSelect).toHaveValue("J");

    const saveBtn = page.getByRole("button", { name: /guardar cambios/i });
    await saveBtn.click();

    // El modal debe cerrarse (el botón desaparece)
    await expect(saveBtn).not.toBeVisible({ timeout: 10_000 });

    // El badge "Jornada" debe aparecer en la tabla
    const jornaBadge = page.locator("table tbody").locator("text=Jornada").first();
    await expect(jornaBadge).toBeVisible({ timeout: 5_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-87");
    throw e;
  } finally {
    // Restaurar la preferencia original del empleado
    if (originalPreference !== undefined) {
      const editBtn2 = page.getByRole("button", { name: "Editar" }).first();
      if (await editBtn2.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await editBtn2.click();
        const prefSelect2 = page.locator('[data-testid="select-shift-preference"]');
        if (await prefSelect2.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await prefSelect2.selectOption(originalPreference ?? "");
          const saveBtn2 = page.getByRole("button", { name: /guardar cambios/i });
          if (await saveBtn2.isVisible({ timeout: 2_000 }).catch(() => false)) {
            await saveBtn2.click();
          }
        }
      }
    }
  }
});

// ===========================================================================
// CP-88 — Bloque de noches se transfiere cuando el empleado tiene vacaciones
// ===========================================================================
test("CP-88 — bloque de noches se transfiere al empleado con más tiempo sin noches", async ({
  page,
}) => {
  test.setTimeout(300_000);
  try {
    await loginAsAdmin(page);

    // ── Obtener el proyecto sembrado y verificar que tiene empleados ─────────
    const projectsResp = await page.request.get("/api/projects");
    expect(projectsResp.status()).toBe(200);
    const projects: { id: string }[] = await projectsResp.json();
    expect(projects.length).toBeGreaterThan(0);
    const projectId = projects[0].id;

    // Usar GET /api/employees (todos) y filtrar por projectId en cliente
    // para no depender de Employee.projectId que puede cambiar entre tests
    const empCheck = await page.request.get("/api/employees");
    expect(empCheck.status()).toBe(200);
    const allEmp: { id: string; projectId: string | null }[] = await empCheck.json();
    const projectEmployees = allEmp.filter((e) => e.projectId === projectId);
    expect(
      projectEmployees.length,
      "El proyecto sembrado debe tener empleados"
    ).toBeGreaterThan(0);

    // ── Usar Febrero 2027 (mes lejano, no usado por otros tests) ─────────────
    const year = 2027;
    const month = 2;

    // ── Paso 1: generar cuadrante limpio para identificar qué técnico tiene noches
    const gen1 = await page.request.post("/api/schedules/generate", {
      data: { year, month, projectId },
    });
    expect(gen1.status()).toBe(200);

    const sched1Resp = await page.request.get(
      `/api/schedules?year=${year}&month=${month}&projectId=${projectId}`
    );
    expect(sched1Resp.status()).toBe(200);
    const { assignments: assignments1 } = await sched1Resp.json();

    type Assignment = { id: string; employeeId: string; date: string; shiftType: string };

    // Agrupar N/NF por empleado y elegir el que tiene más días de noche
    // (asegura que el bloque es completo dentro del mes)
    const nightCountByEmp = new Map<string, string[]>();
    for (const a of assignments1 as Assignment[]) {
      if (a.shiftType !== "N" && a.shiftType !== "NF") continue;
      const acc = nightCountByEmp.get(a.employeeId) ?? [];
      acc.push(a.date.slice(0, 10));
      nightCountByEmp.set(a.employeeId, acc);
    }

    // Elegir el empleado con el bloque más completo (≥7 días)
    let nightEmpId: string | undefined;
    let nightDays: string[] = [];
    for (const [empId, days] of nightCountByEmp) {
      if (days.length > nightDays.length) {
        nightEmpId = empId;
        nightDays = days;
      }
    }

    expect(nightEmpId, "Debe existir un técnico con bloque de noches completo en el mes").toBeTruthy();
    expect(nightDays.length).toBeGreaterThanOrEqual(7);

    // ── Paso 2: marcar los días N del empleado como vacaciones (locked)
    for (const dateStr of nightDays) {
      const patch = await page.request.post("/api/schedules", {
        data: { employeeId: nightEmpId, date: dateStr, shiftType: "V", projectId },
      });
      expect([200, 201]).toContain(patch.status());
    }

    // ── Paso 3: regenerar con las vacaciones marcadas
    const gen2 = await page.request.post("/api/schedules/generate", {
      data: { year, month, projectId },
    });
    expect(gen2.status()).toBe(200);

    const sched2Resp = await page.request.get(
      `/api/schedules?year=${year}&month=${month}&projectId=${projectId}`
    );
    expect(sched2Resp.status()).toBe(200);
    const { assignments: assignments2 } = await sched2Resp.json();

    // 4a. El empleado original NO tiene N en sus días de vacaciones
    const originalNights = (assignments2 as Assignment[]).filter(
      (a) =>
        a.employeeId === nightEmpId &&
        nightDays.includes(a.date.slice(0, 10)) &&
        (a.shiftType === "N" || a.shiftType === "NF")
    );
    expect(
      originalNights,
      "El técnico con vacaciones no debe aparecer como N en esos días"
    ).toHaveLength(0);

    // 4b. Cobertura nocturna continua: ≥7 N/NF en todo el mes
    const totalNights = (assignments2 as Assignment[]).filter(
      (a) => a.shiftType === "N" || a.shiftType === "NF"
    ).length;
    expect(
      totalNights,
      "Debe haber ≥7 turnos de noche (bloque transferido a otro técnico)"
    ).toBeGreaterThanOrEqual(7);

    // 4c. Las vacaciones del empleado original siguen presentes
    const vacDays = (assignments2 as Assignment[]).filter(
      (a) =>
        a.employeeId === nightEmpId &&
        nightDays.includes(a.date.slice(0, 10)) &&
        a.shiftType === "V"
    );
    expect(vacDays.length).toBe(nightDays.length);

    // ── Limpieza: borrar todas las asignaciones de Feb 2027 en lotes paralelos
    const allIds = (assignments2 as Assignment[]).map((a) => a.id);
    const BATCH = 10;
    for (let i = 0; i < allIds.length; i += BATCH) {
      await Promise.all(
        allIds.slice(i, i + BATCH).map((id) =>
          page.request.delete(`/api/schedules?id=${id}`)
        )
      );
    }
  } catch (e) {
    await screenshotOnFail(page, "CP-88");
    throw e;
  }
});

// ===========================================================================
// CP-89 — La fila del usuario autenticado se resalta en el cuadrante (RF-19)
// ===========================================================================
test("CP-89 — la fila del usuario autenticado aparece resaltada en el grid", async ({
  page,
}) => {
  test.setTimeout(90_000);
  let newProjectId: string | null = null;
  let originalProjectId: string | null = null;
  let adminUserId: string | null = null;

  try {
    await loginAsAdmin(page);

    // ── Obtener el userId del admin desde la sesión activa
    const sessionResp = await page.request.get("/api/auth/session");
    const sessionData: { user: { id: string } } = await sessionResp.json();
    adminUserId = sessionData.user.id;
    expect(adminUserId).toBeTruthy();

    // ── Encontrar el Employee del admin (incluyendo inactivos para robustez)
    const empResp = await page.request.get("/api/employees?includeInactive=true");
    const allEmp: { id: string; name: string; userId: string; projectId: string | null; active: boolean }[] =
      await empResp.json();
    const adminEmp = allEmp.find((e) => e.userId === adminUserId);
    expect(adminEmp, "El admin debe tener un Employee asociado").toBeTruthy();

    originalProjectId = adminEmp!.projectId;

    // Reactivar si estuviera desactivado (robustez ante estado de suite completa)
    if (!adminEmp!.active) {
      await page.request.patch(`/api/employees/${adminEmp!.id}`, {
        data: { active: true },
      });
    }

    // ── Crear un proyecto exclusivo para CP-89 (aislamiento total)
    const projectName = `CP89-${Date.now()}`;
    const createResp = await page.request.post("/api/projects", {
      data: { name: projectName, description: "Test RF-19 CP-89" },
    });
    expect(createResp.status()).toBe(201);
    const newProject: { id: string; name: string } = await createResp.json();
    newProjectId = newProject.id;

    // ── Añadir admin a este proyecto (también actualiza Employee.projectId)
    const addResp = await page.request.post(
      `/api/projects/${newProjectId}/members`,
      { data: { userId: adminUserId, role: "EMPLOYEE" } }
    );
    expect([200, 201]).toContain(addResp.status());

    // Verificar que el empleado aparece en el nuevo proyecto
    const verifyResp = await page.request.get(
      `/api/employees?projectId=${newProjectId}`
    );
    const projectEmps: { id: string; userId: string }[] = await verifyResp.json();
    expect(
      projectEmps.some((e) => e.userId === adminUserId),
      "El Employee del admin debe estar en el nuevo proyecto"
    ).toBe(true);

    // ── Navegar a / con el nuevo proyecto como activo
    await page.evaluate(
      (proj) => localStorage.setItem("activeProject", JSON.stringify(proj)),
      newProject
    );
    await page.goto("/");

    // Esperar a que el empleado del admin aparezca en el grid
    // (el grid muestra empleados aunque no haya turnos generados)
    // Usamos el nombre real del employee (puede haber sido renombrado por otros tests)
    const adminEmpName = adminEmp!.name;
    await expect(
      page.locator("td").filter({ hasText: new RegExp(adminEmpName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).first()
    ).toBeVisible({ timeout: 15_000 });

    // ── ASSERTIONS: la fila del admin tiene data-testid="own-row"
    const ownRow = page.locator('[data-testid="own-row"]');
    await expect(ownRow).toBeVisible({ timeout: 10_000 });
    await expect(ownRow).toHaveCount(1);
    // El indicador ▶ aparece en la primera celda (nombre del empleado)
    await expect(ownRow.locator("td").first()).toContainText("▶");
    // La fila tiene fondo indigo
    await expect(ownRow).toHaveClass(/bg-indigo-50/);
  } catch (e) {
    await screenshotOnFail(page, "CP-89");
    throw e;
  } finally {
    // ── Limpieza: eliminar proyecto de prueba y restaurar Employee.projectId
    if (newProjectId) {
      await page.request.delete(`/api/projects/${newProjectId}`);
    }
    if (originalProjectId && adminUserId) {
      await page.request.post(`/api/projects/${originalProjectId}/members`, {
        data: { userId: adminUserId, role: "EMPLOYEE" },
      });
    }
  }



});
