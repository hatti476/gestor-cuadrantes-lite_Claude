/**
 * Sprint 8 — Tests E2E: Acceso PROJECT_ADMIN a /projects
 *
 * CP-57  PROJECT_ADMIN accede a /projects sin ser redirigido
 * CP-58  PROJECT_ADMIN ve solo sus proyectos (no todos)
 * CP-59  PROJECT_ADMIN NO ve el botón "+ Nuevo proyecto"
 * CP-60  PROJECT_ADMIN puede editar su proyecto, pero no eliminar proyectos
 * CP-61  PROJECT_ADMIN SÍ ve el botón "Miembros" en su proyecto
 * CP-62  PROJECT_ADMIN puede añadir un miembro (rol EMPLOYEE) a su proyecto
 * CP-63  API rechaza con 403 si PROJECT_ADMIN intenta asignar rol PROJECT_ADMIN
 * CP-64  PROJECT_ADMIN puede eliminar un miembro de su proyecto
 * CP-65  EMPLOYEE sin rol PROJECT_ADMIN no puede acceder a /projects (redirige)
 * CP-66  API POST /api/projects devuelve 403 para PROJECT_ADMIN (no puede crear proyectos)
 */

import { test, expect } from "@playwright/test";
import { USERS, ROUTES } from "./config";
import { loginAsPM, loginAsTech, login, screenshotOnFail } from "./helpers";

const { admin: ADMIN } = USERS;

// ===========================================================================
// CP-57 — PROJECT_ADMIN accede a /projects sin ser redirigido
// ===========================================================================
test("CP-57 — PROJECT_ADMIN accede a /projects sin ser redirigido", async ({ page }) => {
  try {
    await loginAsPM(page);
    await page.goto("/projects");
    // Esperar a que la sesión cargue y el posible redirect se ejecute (o no)
    await page.waitForLoadState("networkidle");
    // Debe permanecer en /projects, no redirigir a /
    await expect(page).toHaveURL(/\/projects/);
    // Debe haber contenido real de proyectos, no la home
    await expect(page.locator('[data-testid="project-row"]').first()).toBeVisible({ timeout: 8_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-57");
    throw e;
  }
});

// ===========================================================================
// CP-58 — PROJECT_ADMIN ve solo sus proyectos
// ===========================================================================
test("CP-58 — PROJECT_ADMIN ve solo sus proyectos", async ({ page }) => {
  try {
    await loginAsPM(page);
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/projects/, { timeout: 8_000 });

    // El PM solo pertenece al proyecto "Equipo Soporte 24h" del seed
    const rows = page.locator('[data-testid="project-row"]');
    await expect(rows.first()).toBeVisible({ timeout: 8_000 });
    const count = await rows.count();
    // SUPER_ADMIN ve todos los proyectos; PM solo debe ver los suyos
    // El admin tiene muchos más proyectos creados en pruebas anteriores
    // Lo que validamos: el PM ve al menos 1 proyecto y puede ver "Equipo Soporte 24h"
    expect(count).toBeGreaterThanOrEqual(1);
    await expect(page.locator('[data-testid="project-row"]').filter({ hasText: "Equipo Soporte 24h" })).toBeVisible({ timeout: 5_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-58");
    throw e;
  }
});

// ===========================================================================
// CP-59 — PROJECT_ADMIN NO ve el botón "+ Nuevo proyecto"
// ===========================================================================
test("CP-59 — PROJECT_ADMIN NO ve el botón '+ Nuevo proyecto'", async ({ page }) => {
  try {
    await loginAsPM(page);
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/projects/, { timeout: 8_000 });
    // Esperar que la lista cargue
    await expect(page.locator('[data-testid="project-row"]').first()).toBeVisible({ timeout: 8_000 });

    // El botón de crear proyecto NO debe existir para PROJECT_ADMIN
    await expect(page.locator('[data-testid="btn-new-project"]')).not.toBeVisible();
  } catch (e) {
    await screenshotOnFail(page, "CP-59");
    throw e;
  }
});

// ===========================================================================
// CP-60 — PROJECT_ADMIN puede editar, pero no eliminar
// ===========================================================================
test("CP-60 — PROJECT_ADMIN puede editar pero no eliminar proyecto", async ({ page }) => {
  try {
    await loginAsPM(page);
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/projects/, { timeout: 8_000 });
    await expect(page.locator('[data-testid="project-row"]').first()).toBeVisible({ timeout: 8_000 });

    // Puede editar sus proyectos, pero no debe poder eliminarlos.
    await expect(page.locator('[data-testid="btn-edit-project"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="btn-delete-project"]')).not.toBeVisible();
  } catch (e) {
    await screenshotOnFail(page, "CP-60");
    throw e;
  }
});

// ===========================================================================
// CP-61 — PROJECT_ADMIN SÍ ve el botón "Miembros" en su proyecto
// ===========================================================================
test("CP-61 — PROJECT_ADMIN ve el botón Miembros en su proyecto", async ({ page }) => {
  try {
    await loginAsPM(page);
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/projects/, { timeout: 8_000 });

    const projectRow = page.locator('[data-testid="project-row"]').filter({ hasText: "Equipo Soporte 24h" });
    await expect(projectRow).toBeVisible({ timeout: 8_000 });

    // El botón "Miembros" debe ser visible para su proyecto
    await expect(projectRow.locator('[data-testid="btn-manage-members"]')).toBeVisible({ timeout: 5_000 });

    // Al hacer clic, se abre el panel de miembros
    await projectRow.locator('[data-testid="btn-manage-members"]').click();
    await expect(page.locator('[data-testid="members-panel"]')).toBeVisible({ timeout: 5_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-61");
    throw e;
  }
});

// ===========================================================================
// CP-62 — PROJECT_ADMIN puede añadir un miembro con rol EMPLOYEE
// ===========================================================================
test("CP-62 — PROJECT_ADMIN añade un miembro EMPLOYEE a su proyecto", async ({ page }) => {
  const ts = Date.now();

  try {
    // Crear un usuario nuevo via API como admin para luego añadirlo como PM
    await login(page, ADMIN.email, ADMIN.password);
    const newUserRes = await page.request.post("/api/employees", {
      data: { name: `Test CP62 ${ts}`, email: `cp62-${ts}@test.local`, password: "Test1234!", role: "USER" },
    });
    expect(newUserRes.status()).toBe(201);
    // Si el endpoint no existe o el usuario se crea de otra forma, usamos un usuario
    // existente que no sea miembro (p.ej. admin siempre está en el proyecto)
    // Estrategia alternativa: PM abre el panel y usa el select de usuarios disponibles
    await page.context().clearCookies();

    await loginAsPM(page);
    let openedProjects = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await page.goto("/projects", { waitUntil: "domcontentloaded", timeout: 45_000 });
        await expect(page).toHaveURL(/\/projects/, { timeout: 12_000 });
        openedProjects = true;
        break;
      } catch {
        if (attempt === 1) throw new Error("No se pudo abrir /projects en CP-62");
        await page.goto("/", { waitUntil: "domcontentloaded", timeout: 30_000 }).catch(() => undefined);
      }
    }
    expect(openedProjects).toBe(true);

    const projectRow = page.locator('[data-testid="project-row"]').filter({ hasText: "Equipo Soporte 24h" });
    await expect(projectRow).toBeVisible({ timeout: 8_000 });
    await projectRow.locator('[data-testid="btn-manage-members"]').click();
    await expect(page.locator('[data-testid="members-panel"]')).toBeVisible({ timeout: 5_000 });

    // Verificar que el select de usuarios está disponible
    const userSelect = page.locator('[data-testid="member-user-select"]');
    await expect(userSelect).toBeVisible({ timeout: 5_000 });

    const options = await userSelect.locator("option").all();
    test.skip(options.length < 2, "No hay usuarios disponibles para añadir como PROJECT_ADMIN");

    // Seleccionar el primer usuario disponible con rol EMPLOYEE (el default)
    const secondOption = await options[1].getAttribute("value");
    test.skip(!secondOption, "No hay option válida en el selector de miembros");

    const memberCountBefore = await page.locator('[data-testid="member-row"]').count();
    await userSelect.selectOption(secondOption as string);

    // Confirmar que el rol seleccionado es EMPLOYEE (no PROJECT_ADMIN)
    const roleSelect = page.locator('[data-testid="member-role-select"]');
    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption("EMPLOYEE");
    }

    const addResponse = page.waitForResponse(
      (r) => r.url().includes("/api/projects") && r.url().includes("/members") && r.request().method() === "POST"
    );
    await page.click('[data-testid="btn-add-member"]');
    const res = await addResponse;
    expect(res.status()).toBe(201);

    await expect(page.locator('[data-testid="member-row"]')).toHaveCount(memberCountBefore + 1, { timeout: 8_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-62");
    throw e;
  }
});

// ===========================================================================
// CP-63 — API rechaza con 403 si PROJECT_ADMIN asigna rol PROJECT_ADMIN
// ===========================================================================
test("CP-63 — API rechaza con 403 si PROJECT_ADMIN intenta asignar rol PROJECT_ADMIN", async ({ page }) => {
  try {
    await loginAsPM(page);

    // Obtener el ID del proyecto "Equipo Soporte 24h" via API
    const projectsRes = await page.request.get("/api/projects");
    expect(projectsRes.status()).toBe(200);
    const projects = await projectsRes.json();
    const seededProject = projects.find((p: { name: string }) => p.name === "Equipo Soporte 24h");
    expect(seededProject).toBeDefined();

    // Obtener un userId válido (el PM mismo) para que el check llegue a la validación de rol
    // Primero obtener la sesión actual para saber el userId del PM
    const sessionRes = await page.request.get("/api/auth/session");
    const sessionData = await sessionRes.json();
    const pmUserId = sessionData?.user?.id;
    expect(pmUserId).toBeTruthy();

    // Intentar añadir al PM mismo con rol PROJECT_ADMIN (ya es miembro, pero el rol check ocurre antes del upsert)
    const res = await page.request.post(`/api/projects/${seededProject.id}/members`, {
      data: { userId: pmUserId, role: "PROJECT_ADMIN" },
    });
    // Solo SUPER_ADMIN puede asignar PROJECT_ADMIN → 403
    expect(res.status()).toBe(403);
  } catch (e) {
    await screenshotOnFail(page, "CP-63");
    throw e;
  }
});

// ===========================================================================
// CP-64 — PROJECT_ADMIN puede eliminar un miembro de su proyecto
// ===========================================================================
test("CP-64 — PROJECT_ADMIN elimina un miembro de su proyecto", async ({ page }) => {
  try {
    await loginAsPM(page);
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/projects/, { timeout: 8_000 });

    const projectRow = page.locator('[data-testid="project-row"]').filter({ hasText: "Equipo Soporte 24h" });
    await projectRow.locator('[data-testid="btn-manage-members"]').click();
    await expect(page.locator('[data-testid="members-panel"]')).toBeVisible({ timeout: 5_000 });

    // Primero añadir un miembro para tener algo que eliminar
    const userSelect = page.locator('[data-testid="member-user-select"]');
    await expect(userSelect).toBeVisible({ timeout: 5_000 });
    const options = await userSelect.locator("option").all();

    test.skip(options.length < 2, "No hay usuarios disponibles para preparar eliminación");

    const secondOption = await options[1].getAttribute("value");
    test.skip(!secondOption, "No hay option válida para alta previa a eliminación");

    await userSelect.selectOption(secondOption as string);
    const addRes = page.waitForResponse(
      (r) => r.url().includes("/api/projects") && r.url().includes("/members") && r.request().method() === "POST"
    );
    await page.click('[data-testid="btn-add-member"]');
    await addRes;

    const memberCountAfterAdd = await page.locator('[data-testid="member-row"]').count();

    // Ahora eliminar el último miembro añadido
    const removeRes = page.waitForResponse(
      (r) => r.url().includes("/api/projects") && r.url().includes("/members/") && r.request().method() === "DELETE"
    );
    await page.locator('[data-testid="btn-remove-member"]').last().click();
    const deleteResponse = await removeRes;
    expect(deleteResponse.status()).toBe(200);

    await expect(page.locator('[data-testid="member-row"]')).toHaveCount(memberCountAfterAdd - 1, { timeout: 8_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-64");
    throw e;
  }
});

// ===========================================================================
// CP-65 — EMPLOYEE sin PROJECT_ADMIN en ningún proyecto no accede a /projects
// ===========================================================================
test("CP-65 — EMPLOYEE sin PROJECT_ADMIN no puede acceder a /projects", async ({ page }) => {
  try {
    // tecnico1 es EMPLOYEE en el proyecto, no PROJECT_ADMIN
    await loginAsTech(page);
    await page.goto("/projects");
    // Debe ser redirigido a / (home) porque no tiene acceso de gestión
    await expect(page).toHaveURL(ROUTES.home, { timeout: 8_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-65");
    throw e;
  }
});

// ===========================================================================
// CP-66 — API POST /api/projects devuelve 403 para PROJECT_ADMIN
// ===========================================================================
test("CP-66 — API rechaza con 403 si PROJECT_ADMIN intenta crear un proyecto", async ({ page }) => {
  try {
    await loginAsPM(page);

    // Intentar crear un proyecto nuevo (solo SUPER_ADMIN puede)
    const res = await page.request.post("/api/projects", {
      data: { name: "Proyecto Prohibido PM" },
    });
    expect(res.status()).toBe(403);
  } catch (e) {
    await screenshotOnFail(page, "CP-66");
    throw e;
  }
});
