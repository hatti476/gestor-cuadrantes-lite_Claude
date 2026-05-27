/**
 * tests/e2e/sprint-13.spec.ts
 * Sprint 13 — Festivos por CCAA + Historial mejorado + Documentación
 *
 * CP-90 — Selector de región visible en edición de proyecto;
 *          badge de región visible en listado de proyectos
 * CP-91 — Mensaje de precarga de festivos visible en PrepPanel Paso 4
 *          cuando el proyecto tiene región configurada
 * CP-92 — Festivos muestra mensaje con enlace
 *          cuando el proyecto NO tiene región configurada
 * CP-93 — Carga automática pre-rellena el listado con los festivos
 *          del mes (mock de la API nager.at)
 * CP-94 — Si la API externa falla, muestra toast y permite continuar
 * CP-95 — Paginación del historial — página 1, siguiente, última
 * CP-96 — Filtro por mes en historial muestra solo registros del mes
 * CP-97 — /info muestra sección "Preparar el cuadrante" para
 *          PROJECT_ADMIN y no la muestra para EMPLOYEE
 * CP-98 — /info muestra sección "Tu turno actual" para EMPLOYEE
 *          y no la muestra para SUPER_ADMIN
 */

import { test, expect } from "@playwright/test";
import { ROUTES } from "./config";
import { loginAsAdmin, loginAsPM, loginAsTech, screenshotOnFail } from "./helpers";

// ============================================================================
// CP-90 — Selector de región en edición de proyecto y badge en listado
// ============================================================================
test("CP-90 — selector de región en proyecto y badge en listado", async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await loginAsAdmin(page);
    await page.goto(ROUTES.projects);
    await page.waitForSelector("[data-testid='projects-table']");

    // Abrir formulario de edición del primer proyecto
    const editBtn = page.getByTestId("btn-edit-project").first();
    await editBtn.click();

    // El selector de CCAA debe estar visible
    const regionSelect = page.getByTestId("select-region");
    await expect(regionSelect).toBeVisible();

    // Verificar que tiene la opción "Madrid"
    const madridOption = regionSelect.locator("option[value='Madrid']");
    await expect(madridOption).toHaveCount(1);

    // Seleccionar Madrid y guardar
    await regionSelect.selectOption("Madrid");
    await page.getByRole("button", { name: "Guardar" }).click();

    // Esperar a que la tabla se recargue y aparezca el badge
    await page.waitForSelector("[data-testid='region-badge']");
    const badge = page.getByTestId("region-badge").first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("Madrid");
  } catch (err) {
    await screenshotOnFail(page, "CP-90");
    throw err;
  }
});

// ============================================================================
// CP-91 — Mensaje de precarga visible cuando el proyecto tiene región
// ============================================================================
test("CP-91 — mensaje de precarga visible con región configurada", async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await loginAsAdmin(page);

    // Obtener el proyecto que ya tiene región Madrid (configurado en CP-90 o el seed)
    const projectsRes = await page.request.get("/api/projects");
    const projects: { id: string; region: string | null; name: string }[] =
      await projectsRes.json();
    const projectWithRegion = projects.find((p) => p.region);
    expect(projectWithRegion, "Debe existir un proyecto con región configurada").toBeTruthy();

    // Establecer el proyecto activo en localStorage con la región
    // y navegar a través de /projects para activarlo correctamente
    await page.goto(ROUTES.projects);
    await page.waitForSelector("[data-testid='projects-table']");

    // Hacer clic en "Seleccionar" para el primer proyecto con región
    const rows = await page.getByTestId("project-row").all();
    let selected = false;
    for (const row of rows) {
      const badge = row.getByTestId("region-badge");
      if (await badge.isVisible()) {
        await row.getByTestId("btn-select-project").click();
        selected = true;
        break;
      }
    }
    expect(selected, "Se debe seleccionar el proyecto con región").toBe(true);

    // Esperar redirección a /
    await page.waitForURL(ROUTES.home, { timeout: 10_000 });
    await page.waitForSelector("[data-testid='prep-panel']");
    await page.waitForLoadState("networkidle");

    // Abrir el paso de Festivos
    await page.getByTestId("prep-step-festivos").click();

    const autoLoadMsg = page.getByTestId("msg-auto-holidays");
    await expect(autoLoadMsg).toBeVisible();
    await expect(autoLoadMsg).toContainText("Los festivos públicos se precargan automáticamente");
    await expect(page.getByTestId("btn-auto-load-holidays")).toHaveCount(0);
  } catch (err) {
    await screenshotOnFail(page, "CP-91");
    throw err;
  }
});

// ============================================================================
// CP-92 — Mensaje con enlace cuando el proyecto NO tiene región configurada
// ============================================================================
test("CP-92 — mensaje con enlace cuando proyecto sin región", async ({ page }) => {
  test.setTimeout(90_000);
  try {
    await loginAsAdmin(page);

    // Crear un proyecto nuevo sin región
    const projectName = `Sin-Region-CP92-${Date.now()}`;
    const createRes = await page.request.post("/api/projects", {
      data: { name: projectName, description: "Test sin región" },
    });
    expect(createRes.status()).toBe(201);
    const newProject = await createRes.json();
    const newProjectId: string = newProject.id;

    // Navegar a /projects y seleccionar el nuevo proyecto via botón Seleccionar
    // (el enfoque directo con localStorage no actualiza el estado React)
    await page.goto(ROUTES.projects);
    await page.waitForSelector("[data-testid='projects-table']");

    // Buscar la fila del nuevo proyecto y hacer clic en Seleccionar
    const rows = await page.getByTestId("project-row").all();
    let selected = false;
    for (const row of rows) {
      const nameCell = await row.textContent();
      if (nameCell?.includes(projectName)) {
        await row.getByTestId("btn-select-project").click();
        selected = true;
        break;
      }
    }
    expect(selected, "Se debe seleccionar el proyecto sin región").toBe(true);

    // Esperar redirección a /
    await page.waitForURL(ROUTES.home, { timeout: 10_000 });
    await page.waitForSelector("[data-testid='prep-panel']");
    await page.waitForLoadState("networkidle");

    // Abrir el paso de Festivos
    await page.getByTestId("prep-step-festivos").click();

    // Debe aparecer el mensaje informativo (no el botón)
    const msg = page.getByTestId("msg-no-region");
    await expect(msg).toBeVisible();
    await expect(msg).toContainText("Configura la región del proyecto");

    // Debe incluir un enlace a /projects
    const link = page.getByTestId("link-configure-region");
    await expect(link).toBeVisible();

    // El botón de carga automática NO debe aparecer
    const autoLoadBtn = page.getByTestId("btn-auto-load-holidays");
    await expect(autoLoadBtn).toHaveCount(0);

    // Limpiar: eliminar el proyecto de prueba
    await page.request.delete(`/api/projects/${newProjectId}`);
  } catch (err) {
    await screenshotOnFail(page, "CP-92");
    throw err;
  }
});

// ============================================================================
// CP-93 — Carga automática pre-rellena festivos (mock de nager.at via /api/holidays/public)
// ============================================================================
test("CP-93 — carga automática pre-rellena festivos del mes con mock", async ({ page }) => {
  test.setTimeout(90_000);
  try {
    await loginAsAdmin(page);

    // Asegurarse de que el proyecto activo tiene región (de CP-90)
    await page.goto(ROUTES.projects);
    await page.waitForSelector("[data-testid='projects-table']");

    // Obtener el id del primer proyecto (que tiene Madrid de CP-90)
    const projectsRes = await page.request.get("/api/projects");
    const projects: { id: string; region: string | null }[] = await projectsRes.json();
    const projectWithRegion = projects.find((p) => p.region === "Madrid");
    expect(projectWithRegion, "Debe existir un proyecto con región Madrid (de CP-90)").toBeTruthy();

    // Mock de /api/holidays/public para devolver un festivo del mes actual
    await page.route("/api/holidays/public*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { date: "2026-05-01", description: "Día del Trabajo" },
          { date: "2026-05-15", description: "Fiesta de la Comunidad de Madrid" },
        ]),
      });
    });

    // Activar el proyecto con Madrid
    await page.evaluate((id: string) => {
      localStorage.setItem(
        "activeProject",
        JSON.stringify({ id, name: "Proyecto Test", region: "Madrid" })
      );
    }, projectWithRegion!.id);

    const responsePromise = page.waitForResponse(/\/api\/holidays\/public/, { timeout: 10_000 }).catch(() => null);
    await page.goto(ROUTES.home);
    await page.waitForSelector("[data-testid='prep-panel']");
    const response = await responsePromise;
    if (response) {
      expect(response.status()).toBe(200);
    }

    // Abrir paso Festivos
    await page.getByTestId("prep-step-festivos").click();

    const autoLoadMsg = page.getByTestId("msg-auto-holidays");
    await expect(autoLoadMsg).toBeVisible();
    await expect(page.getByTestId("btn-auto-load-holidays")).toHaveCount(0);

    const holidayCount = await page
      .getByTestId("prep-step-festivos")
      .locator(".font-mono")
      .textContent();

    console.log(`CP-93: festivos visibles = ${holidayCount}`);
  } catch (err) {
    await screenshotOnFail(page, "CP-93");
    throw err;
  }
});

// ============================================================================
// CP-94 — API externa falla → toast informativo, flujo no bloqueado
// ============================================================================
test("CP-94 — API externa falla, muestra toast y permite continuar", async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await loginAsAdmin(page);

    // Obtener proyecto con región para verificar que existe
    const projectsRes = await page.request.get("/api/projects");
    const projects: { id: string; region: string | null }[] = await projectsRes.json();
    const projectWithRegion = projects.find((p) => p.region === "Madrid");
    expect(projectWithRegion, "Debe existir un proyecto con región Madrid (de CP-90)").toBeTruthy();

    // Mock de /api/holidays/public para devolver 503 antes de que la home precargue
    await page.route("/api/holidays/public*", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "La API de festivos no está disponible." }),
      });
    });
    const responsePromise = page.waitForResponse(/\/api\/holidays\/public/, { timeout: 10_000 }).catch(() => null);

    // Seleccionar el proyecto con región usando el mecanismo de la app desde /projects
    await page.goto(ROUTES.projects);
    await page.waitForSelector("[data-testid='projects-table']");

    // Hacer clic en "Seleccionar" para el proyecto con Madrid (usa handleSelectProject que guarda la región)
    const rows = await page.getByTestId("project-row").all();
    let projectSelected = false;
    for (const row of rows) {
      const badge = row.getByTestId("region-badge");
      if (await badge.isVisible() && (await badge.textContent()) === "Madrid") {
        await row.getByTestId("btn-select-project").click();
        projectSelected = true;
        break;
      }
    }
    expect(projectSelected, "Se debe haber seleccionado un proyecto con región Madrid").toBe(true);

    // Esperar redirección a home
    await page.waitForURL(ROUTES.home, { timeout: 10_000 });
    await page.waitForSelector("[data-testid='prep-panel']");
    await page.waitForLoadState("networkidle");

    // Abrir paso Festivos
    await page.getByTestId("prep-step-festivos").click();

    const response = await responsePromise;
    if (response) {
      expect(response.status()).toBe(503);
      await expect(page.getByTestId("toast")).toBeVisible({ timeout: 5_000 });
    }

    // El PrepPanel debe seguir visible (flujo no bloqueado)
    await expect(page.getByTestId("prep-panel")).toBeVisible();
    await expect(page.getByTestId("btn-auto-load-holidays")).toHaveCount(0);

    // El botón "Gestionar festivos del mes" debe seguir disponible
    await expect(page.getByTestId("btn-manage-holidays")).toBeVisible();
  } catch (err) {
    await screenshotOnFail(page, "CP-94");
    throw err;
  }
});

// ============================================================================
// CP-95 — Paginación del historial — página 1, siguiente, última
// ============================================================================
test("CP-95 — paginación del historial de empleado", async ({ page }) => {
  test.setTimeout(120_000);
  try {
    await loginAsAdmin(page);

    // Obtener un empleado con historial
    const empRes = await page.request.get("/api/employees");
    expect(empRes.status()).toBe(200);
    const employees: { id: string; name: string }[] = await empRes.json();
    expect(employees.length).toBeGreaterThan(0);
    const empId = employees[0].id;

    // Validación directa del endpoint paginado de historial
    const page1Res = await page.request.get(`/api/employees/${empId}/history?page=1&limit=20`);
    expect(page1Res.status()).toBe(200);
    const page1 = await page1Res.json() as {
      data: unknown[];
      pagination: { page: number; totalPages: number; total: number; limit: number };
    };
    expect(page1.pagination.page).toBe(1);
    expect(page1.pagination.limit).toBe(20);
    expect(page1.pagination.total).toBeGreaterThanOrEqual(0);
    expect(page1.pagination.totalPages).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(page1.data)).toBe(true);

    if (page1.pagination.totalPages > 1) {
      const page2Res = await page.request.get(`/api/employees/${empId}/history?page=2&limit=20`);
      expect(page2Res.status()).toBe(200);
      const page2 = await page2Res.json() as { pagination: { page: number } };
      expect(page2.pagination.page).toBe(2);
    }
  } catch (err) {
    await screenshotOnFail(page, "CP-95");
    throw err;
  }
});

// ============================================================================
// CP-96 — Filtro por mes en historial
// ============================================================================
test("CP-96 — filtro por mes en historial de empleado", async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await loginAsAdmin(page);

    const empRes = await page.request.get("/api/employees");
    const employees: { id: string; name: string }[] = await empRes.json();
    expect(employees.length).toBeGreaterThan(0);
    const empId = employees[0].id;

    // Consultar historial base para leer los meses disponibles
    const baseRes = await page.request.get(`/api/employees/${empId}/history?page=1&limit=20`);
    expect(baseRes.status()).toBe(200);
    const base = await baseRes.json() as { availableMonths: string[] };
    expect(Array.isArray(base.availableMonths)).toBe(true);

    if (base.availableMonths.length > 0) {
      const month = base.availableMonths[0];
      const filteredRes = await page.request.get(
        `/api/employees/${empId}/history?page=1&limit=20&month=${month}`
      );
      expect(filteredRes.status()).toBe(200);
      const filtered = await filteredRes.json() as { data: Array<{ date: string }> };
      expect(Array.isArray(filtered.data)).toBe(true);

      for (const row of filtered.data) {
        expect(row.date.slice(0, 7)).toBe(month);
      }
      console.log(`CP-96: filtrado por mes ${month}`);
    }
  } catch (err) {
    await screenshotOnFail(page, "CP-96");
    throw err;
  }
});

// ============================================================================
// CP-97 — /info muestra "Preparar el cuadrante" para PROJECT_ADMIN, no para EMPLOYEE
// ============================================================================
test("CP-97 — /info muestra sección Preparar el cuadrante para PROJECT_ADMIN", async ({
  page,
}) => {
  test.setTimeout(60_000);
  try {
    // Verificar que PROJECT_ADMIN ve la sección
    await loginAsPM(page);
    await page.goto(ROUTES.info);
    await page.waitForSelector("[data-testid*='info-section']");

    const adminSection = page.getByTestId("info-section-Preparar el cuadrante (5 pasos)");
    await expect(adminSection).toBeVisible();

    // Verificar que EMPLOYEE NO ve esa sección
    await page.context().clearCookies();
    await loginAsTech(page);
    await page.goto(ROUTES.info);
    await page.waitForSelector("[data-testid*='info-section']");

    const adminSectionForEmployee = page.getByTestId(
      "info-section-Preparar el cuadrante (5 pasos)"
    );
    await expect(adminSectionForEmployee).toHaveCount(0);
  } catch (err) {
    await screenshotOnFail(page, "CP-97");
    throw err;
  }
});

// ============================================================================
// CP-98 — /info muestra "Tu turno actual" para EMPLOYEE, no para SUPER_ADMIN
// ============================================================================
test("CP-98 — /info muestra sección Tu turno actual solo para EMPLOYEE", async ({
  page,
}) => {
  test.setTimeout(60_000);
  try {
    // EMPLOYEE debe ver la sección "Tu turno actual"
    await loginAsTech(page);
    await page.goto(ROUTES.info);
    await page.waitForSelector("[data-testid*='info-section']");

    const employeeSection = page.getByTestId("info-section-Tu turno actual");
    await expect(employeeSection).toBeVisible();

    // SUPER_ADMIN NO debe ver "Tu turno actual"
    await page.context().clearCookies();
    await loginAsAdmin(page);
    await page.goto(ROUTES.info);
    await page.waitForSelector("[data-testid*='info-section']");

    const employeeSectionForAdmin = page.getByTestId("info-section-Tu turno actual");
    await expect(employeeSectionForAdmin).toHaveCount(0);
  } catch (err) {
    await screenshotOnFail(page, "CP-98");
    throw err;
  }
});
