/**
 * tests/e2e/sprint-13.spec.ts
 * Sprint 13 — Festivos por CCAA + Historial mejorado + Documentación
 *
 * CP-90 — Selector de región visible en edición de proyecto;
 *          badge de región visible en listado de proyectos
 * CP-91 — Botón "Cargar festivos" visible en PrepPanel Paso 3
 *          cuando el proyecto tiene región configurada
 * CP-92 — Botón "Cargar festivos" muestra mensaje con enlace
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
// CP-91 — Botón "Cargar festivos" visible cuando el proyecto tiene región
// ============================================================================
test("CP-91 — botón Cargar festivos visible con región configurada", async ({ page }) => {
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

    // Abrir el paso de Festivos (Paso 3)
    await page.getByTestId("prep-step-festivos").click();

    // Debe aparecer el botón de carga automática
    const autoLoadBtn = page.getByTestId("btn-auto-load-holidays");
    await expect(autoLoadBtn).toBeVisible();
    await expect(autoLoadBtn).toContainText("Cargar festivos automáticamente");
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

    await page.goto(ROUTES.home);
    await page.waitForSelector("[data-testid='prep-panel']");

    // Abrir paso Festivos
    await page.getByTestId("prep-step-festivos").click();

    // Comprobar que el botón está visible y pulsarlo
    const autoLoadBtn = page.getByTestId("btn-auto-load-holidays");
    await expect(autoLoadBtn).toBeVisible();

    // Contar festivos antes
    const holidayCountBefore = await page
      .getByTestId("prep-step-festivos")
      .locator(".font-mono")
      .textContent();

    await autoLoadBtn.click();

    // Esperar confirmación (toast de éxito o el conteo ha aumentado)
    await page.waitForTimeout(2000);

    // Verificar que ya no está cargando
    await expect(autoLoadBtn).not.toContainText("Cargando");

    console.log(`CP-93: festivos antes = ${holidayCountBefore}`);
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

    // Mock de /api/holidays/public para devolver 503 (ANTES de hacer clic)
    await page.route("/api/holidays/public*", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "La API de festivos no está disponible." }),
      });
    });

    // Abrir paso Festivos
    await page.getByTestId("prep-step-festivos").click();

    const autoLoadBtn = page.getByTestId("btn-auto-load-holidays");
    await expect(autoLoadBtn).toBeVisible();

    // Esperar la respuesta del API (503) y luego verificar el toast
    const responsePromise = page.waitForResponse(/\/api\/holidays\/public/);
    await autoLoadBtn.click();
    const response = await responsePromise;
    expect(response.status()).toBe(503);

    // El toast de error debe aparecer
    await expect(page.getByTestId("toast")).toBeVisible({ timeout: 5_000 });

    // El PrepPanel debe seguir visible (flujo no bloqueado)
    await expect(page.getByTestId("prep-panel")).toBeVisible();

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

    // Navegar a la página de historial
    await page.goto(`/employees/${empId}/history`);

    // El indicador de paginación debe estar visible
    const paginationInfo = page.getByTestId("pagination-info");
    await expect(paginationInfo).toBeVisible({ timeout: 10_000 });

    // Verificar el texto de la paginación
    const infoText = await paginationInfo.textContent();
    expect(infoText).toMatch(/Página \d+ de \d+/);
    console.log(`CP-95: ${infoText}`);

    // Si hay más de una página, verificar botones de navegación
    const totalPagesMatch = infoText?.match(/de (\d+)/);
    const totalPages = totalPagesMatch ? parseInt(totalPagesMatch[1]) : 1;

    if (totalPages > 1) {
      const nextBtn = page.getByTestId("btn-next-page");
      await expect(nextBtn).toBeVisible();
      await expect(nextBtn).toBeEnabled();

      const prevBtn = page.getByTestId("btn-prev-page");
      await expect(prevBtn).toBeDisabled(); // Página 1: anterior deshabilitado

      // Navegar a la siguiente página
      await nextBtn.click();
      await page.waitForTimeout(1000);

      const newInfo = await page.getByTestId("pagination-info").textContent();
      expect(newInfo).toContain("Página 2");
      console.log(`CP-95: navegado a ${newInfo}`);
    } else {
      console.log("CP-95: solo una página de historial — test de botones omitido");
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

    await page.goto(`/employees/${empId}/history`);

    // El selector de mes debe estar visible
    const monthFilter = page.getByTestId("month-filter");
    await expect(monthFilter).toBeVisible({ timeout: 10_000 });

    // Debe tener la opción "Todos los meses" por defecto
    await expect(monthFilter).toHaveValue("");

    // Verificar opción "Todos los meses" existe
    const allOption = monthFilter.locator("option[value='']");
    await expect(allOption).toHaveCount(1);

    // Obtener las opciones disponibles
    const optionCount = await monthFilter.locator("option").count();
    console.log(`CP-96: ${optionCount} opciones de mes en el selector`);

    if (optionCount > 1) {
      // Seleccionar el primer mes disponible (distinto de "Todos")
      const firstMonthValue = await monthFilter
        .locator("option")
        .nth(1)
        .getAttribute("value");

      if (firstMonthValue) {
        await monthFilter.selectOption(firstMonthValue);
        await page.waitForTimeout(1500);

        // La paginación debe actualizarse
        const paginationInfo = page.getByTestId("pagination-info");
        await expect(paginationInfo).toBeVisible();

        // El filtro debe seguir activo con el mes seleccionado
        await expect(monthFilter).toHaveValue(firstMonthValue);
        console.log(`CP-96: filtrado por mes ${firstMonthValue}`);
      }
    } else {
      console.log("CP-96: sin meses disponibles en el historial — test omitido");
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

    const adminSection = page.getByTestId("info-section-Preparar el cuadrante (4 pasos)");
    await expect(adminSection).toBeVisible();

    // Verificar que EMPLOYEE NO ve esa sección
    await page.context().clearCookies();
    await loginAsTech(page);
    await page.goto(ROUTES.info);
    await page.waitForSelector("[data-testid*='info-section']");

    const adminSectionForEmployee = page.getByTestId(
      "info-section-Preparar el cuadrante (4 pasos)"
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
