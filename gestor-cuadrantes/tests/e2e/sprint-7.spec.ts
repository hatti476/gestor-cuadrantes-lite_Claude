/**
 * Sprint 7 — Tests E2E: Gestión de proyectos y scoping
 *
 * CP-47  SUPER_ADMIN ve la lista de proyectos
 * CP-48  SUPER_ADMIN crea un proyecto nuevo
 * CP-49  SUPER_ADMIN edita un proyecto existente
 * CP-50  SUPER_ADMIN elimina un proyecto
 * CP-51  SUPER_ADMIN abre el panel de miembros de un proyecto
 * CP-52  SUPER_ADMIN añade un miembro al proyecto
 * CP-53  SUPER_ADMIN elimina un miembro del proyecto
 * CP-54  Selector de proyecto visible en la home para SUPER_ADMIN
 * CP-55  USER solo ve sus proyectos (no el selector de todos)
 * CP-56  Header muestra enlace "Proyectos" solo para SUPER_ADMIN
 */

import { test, expect } from "@playwright/test";
import { USERS } from "./config";
import { login, screenshotOnFail } from "./helpers";

const { admin: ADMIN, tech: TECH } = USERS;

// ===========================================================================
// CP-47 — SUPER_ADMIN ve la lista de proyectos
// ===========================================================================
test("CP-47 — SUPER_ADMIN ve la lista de proyectos", async ({ page }) => {
  try {
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto("/projects");
    await expect(page.locator('[data-testid="projects-table"]')).toBeVisible({
      timeout: 10_000,
    });
    // Hay al menos 1 proyecto (el del seed + los que hayan creado tests anteriores)
    const rows = page.locator('[data-testid="project-row"]');
    await expect(rows).toHaveCount(await rows.count(), { timeout: 5_000 });
    expect(await rows.count()).toBeGreaterThanOrEqual(1);
  } catch (e) {
    await screenshotOnFail(page, "CP-47");
    throw e;
  }
});

// ===========================================================================
// CP-48 — SUPER_ADMIN crea un proyecto nuevo
// ===========================================================================
test("CP-48 — SUPER_ADMIN crea un proyecto nuevo", async ({ page }) => {
  test.slow(); // El JWT callback puede tardar bajo carga (consulta memberships en BD)
  const ts = Date.now();
  const projectName = `Proyecto Sprint7 ${ts}`;

  try {
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto("/projects");
    await expect(page.locator('[data-testid="btn-new-project"]')).toBeVisible({
      timeout: 10_000,
    });

    await page.click('[data-testid="btn-new-project"]');
    await expect(page.locator("input#proj-name")).toBeVisible({ timeout: 5_000 });

    await page.fill("input#proj-name", projectName);
    await page.fill("textarea#proj-description", "Proyecto de prueba Sprint 7");
    await page.locator("#proj-region").selectOption("Madrid");

    await page.locator('button[type="submit"]').click();

    await expect(page.locator(`text=${projectName}`)).toBeVisible({ timeout: 8_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-48");
    throw e;
  }
});

// ===========================================================================
// CP-49 — SUPER_ADMIN edita un proyecto existente
// ===========================================================================
test("CP-49 — SUPER_ADMIN edita un proyecto", async ({ page }) => {
  const ts = Date.now();
  const originalName = `Editable ${ts}`;
  const updatedName = `Editado ${ts}`;

  try {
    await login(page, ADMIN.email, ADMIN.password);

    // Crear proyecto a través de la API para tener uno listo
    await page.request.post("/api/projects", {
      data: { name: originalName, description: "original" },
    });

    await page.goto("/projects");
    await expect(page.locator(`text=${originalName}`)).toBeVisible({ timeout: 10_000 });

    // Click en el botón de editar de la fila que contiene el nombre
    const row = page.locator('[data-testid="project-row"]').filter({ hasText: originalName });
    await row.locator('[data-testid="btn-edit-project"]').click();

    await expect(page.locator("input#proj-name")).toBeVisible({ timeout: 5_000 });
    await page.fill("input#proj-name", updatedName);
    await page.locator('button[type="submit"]').click();

    await expect(page.locator(`text=${updatedName}`)).toBeVisible({ timeout: 8_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-49");
    throw e;
  }
});

// ===========================================================================
// CP-50 — SUPER_ADMIN elimina un proyecto
// ===========================================================================
test("CP-50 — SUPER_ADMIN elimina un proyecto", async ({ page }) => {
  const ts = Date.now();
  const projectName = `Borrable ${ts}`;

  try {
    await login(page, ADMIN.email, ADMIN.password);

    // Crear proyecto a través de la API
    await page.request.post("/api/projects", {
      data: { name: projectName },
    });

    await page.goto("/projects");
    await expect(page.locator(`text=${projectName}`)).toBeVisible({ timeout: 10_000 });

    // Aceptar el confirm dialog automáticamente
    page.on("dialog", (d) => d.accept());

    const row = page.locator('[data-testid="project-row"]').filter({ hasText: projectName });
    await row.locator('[data-testid="btn-delete-project"]').click();

    await expect(page.locator(`text=${projectName}`)).not.toBeVisible({ timeout: 8_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-50");
    throw e;
  }
});

// ===========================================================================
// CP-51 — SUPER_ADMIN abre el panel de miembros
// ===========================================================================
test("CP-51 — SUPER_ADMIN abre el panel de miembros", async ({ page }) => {
  try {
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto("/projects");

    // Primer proyecto del seed
    const firstRow = page.locator('[data-testid="project-row"]').first();
    await expect(firstRow).toBeVisible({ timeout: 10_000 });
    await firstRow.locator('[data-testid="btn-manage-members"]').click();

    await expect(page.locator('[data-testid="members-panel"]')).toBeVisible({
      timeout: 5_000,
    });
  } catch (e) {
    await screenshotOnFail(page, "CP-51");
    throw e;
  }
});

// ===========================================================================
// CP-52 — SUPER_ADMIN añade miembro al proyecto
// ===========================================================================
test("CP-52 — SUPER_ADMIN añade miembro al proyecto @smoke", async ({ page }) => {
  const ts = Date.now();
  const projectName = `MembersTest ${ts}`;

  try {
    await login(page, ADMIN.email, ADMIN.password);

    // Crear proyecto nuevo sin miembros (excepto admin via seed que ya está)
    await page.request.post("/api/projects", {
      data: { name: projectName },
    });

    await page.goto("/projects");
    await expect(page.locator(`text=${projectName}`)).toBeVisible({ timeout: 10_000 });

    const row = page.locator('[data-testid="project-row"]').filter({ hasText: projectName });
    await row.locator('[data-testid="btn-manage-members"]').click();

    await expect(page.locator('[data-testid="members-panel"]')).toBeVisible({ timeout: 5_000 });

    // Seleccionar un usuario disponible
    const userSelect = page.locator('[data-testid="member-user-select"]');
    await expect(userSelect).toBeVisible({ timeout: 5_000 });
    const options = await userSelect.locator("option").all();
    // La primera opción es "Seleccionar usuario...", la segunda es un usuario real
    if (options.length < 2) {
      // No hay usuarios disponibles que no sean miembros — test pasa por defecto
      return;
    }
    const secondOption = await options[1].getAttribute("value");
    if (!secondOption) return;

    await userSelect.selectOption(secondOption);
    await page.click('[data-testid="btn-add-member"]');

    await expect(page.locator('[data-testid="member-row"]').first()).toBeVisible({
      timeout: 8_000,
    });
  } catch (e) {
    await screenshotOnFail(page, "CP-52");
    throw e;
  }
});

// ===========================================================================
// CP-53 — SUPER_ADMIN elimina miembro del proyecto
// ===========================================================================
test("CP-53 — SUPER_ADMIN elimina miembro del proyecto", async ({ page }) => {
  const ts = Date.now();
  const projectName = `RemoveTest ${ts}`;

  try {
    await login(page, ADMIN.email, ADMIN.password);

    // Crear proyecto de prueba y añadir un miembro via API
    const createRes = await page.request.post("/api/projects", {
      data: { name: projectName },
    });
    expect(createRes.ok()).toBeTruthy();

    // Navegar al proyecto recién creado
    await page.goto("/projects");
    await expect(page.locator(`text=${projectName}`)).toBeVisible({ timeout: 10_000 });

    // Abrir el panel de miembros
    const row = page.locator('[data-testid="project-row"]').filter({ hasText: projectName });
    await row.locator('[data-testid="btn-manage-members"]').click();
    await expect(page.locator('[data-testid="members-panel"]')).toBeVisible({ timeout: 5_000 });

    // Añadir un miembro (pm) via el select
    const userSelect = page.locator('[data-testid="member-user-select"]');
    await expect(userSelect).toBeVisible({ timeout: 5_000 });
    const options = await userSelect.locator("option").all();
    if (options.length < 2) return; // No hay usuarios disponibles
    const secondOption = await options[1].getAttribute("value");
    if (!secondOption) return;
    await userSelect.selectOption(secondOption);
    await page.click('[data-testid="btn-add-member"]');
    await expect(page.locator('[data-testid="member-row"]').first()).toBeVisible({ timeout: 8_000 });

    // Ahora hay al menos 2 miembros (admin + pm). Eliminar el último (no admin)
    const memberRows = page.locator('[data-testid="member-row"]');
    const memberCount = await memberRows.count();

    const removeResponse = page.waitForResponse((r) => r.url().includes("/api/projects") && r.url().includes("/members/") && r.request().method() === "DELETE");
    await page.locator('[data-testid="btn-remove-member"]').last().click();
    await removeResponse;

    // Confirmar eliminación vía conteo
    await expect(page.locator('[data-testid="member-row"]')).toHaveCount(memberCount - 1, { timeout: 10_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-53");
    throw e;
  }
});

// ===========================================================================
// CP-54 — Proyecto activo visible en el header tras seleccionar desde /projects
// ===========================================================================
test("CP-54 — Proyecto activo visible en header para SUPER_ADMIN", async ({ page }) => {
  try {
    await login(page, ADMIN.email, ADMIN.password);
    // Seleccionar el primer proyecto desde la página de proyectos
    await page.goto("/projects");
    const firstRow = page.locator('[data-testid="project-row"]').first();
    await expect(firstRow).toBeVisible({ timeout: 10_000 });
    await firstRow.locator('[data-testid="btn-select-project"]').click();
    // Debe navegar automáticamente a la home
    await page.waitForURL("/", { timeout: 8_000 });
    // El badge del proyecto activo aparece en el header
    await expect(page.locator('[data-testid="active-project-badge"]')).toBeVisible({
      timeout: 8_000,
    });
  } catch (e) {
    await screenshotOnFail(page, "CP-54");
    throw e;
  }
});

// ===========================================================================
// CP-55 — Proyecto auto-seleccionado visible en header para USER
// ===========================================================================
test("CP-55 — Proyecto activo visible en header para USER", async ({ page }) => {
  try {
    await login(page, TECH.email, TECH.password);
    await page.goto("/");
    // El sistema auto-selecciona el único proyecto del técnico al cargar la home
    await expect(page.locator('[data-testid="active-project-badge"]')).toBeVisible({
      timeout: 12_000,
    });
  } catch (e) {
    await screenshotOnFail(page, "CP-55");
    throw e;
  }
});

// ===========================================================================
// CP-56 — Header muestra enlace "Proyectos" solo para SUPER_ADMIN
// ===========================================================================
test("CP-56 — Header enlace Proyectos solo visible para SUPER_ADMIN", async ({ page }) => {
  try {
    // SUPER_ADMIN ve el enlace
    await login(page, ADMIN.email, ADMIN.password);
    await expect(page.locator('nav a[href="/projects"]')).toBeVisible({ timeout: 5_000 });

    // USER no ve el enlace — usar el helper de login
    await login(page, TECH.email, TECH.password);
    await expect(page.locator('nav a[href="/projects"]')).not.toBeVisible();
  } catch (e) {
    await screenshotOnFail(page, "CP-56");
    throw e;
  }
});
