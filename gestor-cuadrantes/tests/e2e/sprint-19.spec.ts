/**
 * tests/e2e/sprint-19.spec.ts
 * Sprint 19 — Gestión de usuarios y proyectos: RBAC, /admin section
 *
 * CP-129 — SUPER_ADMIN ve el enlace "Administración" en la cabecera
 * CP-130 — PROJECT_ADMIN no ve "Administración" en la cabecera
 * CP-131 — USER (empleado) solo ve "Cuadrante" y "Ayuda" en la cabecera
 * CP-132 — /admin redirige a "/" si el usuario no es SUPER_ADMIN
 * CP-133 — SUPER_ADMIN puede crear un usuario desde /admin (tab Usuarios)
 * CP-134 — SUPER_ADMIN puede editar email de un usuario desde /admin
 * CP-135 — SUPER_ADMIN puede desactivar un usuario desde /admin
 * CP-136 — El filtro por rol en la tab Usuarios filtra correctamente
 * CP-137 — PROJECT_ADMIN solo ve su propio proyecto en /projects
 * CP-138 — SUPER_VIEWER ve todos los proyectos en /projects (modo lectura)
 * CP-139 — SUPER_VIEWER puede ver el cuadrante pero no tiene PrepPanel
 * CP-140 — SUPER_VIEWER no puede editar celdas del cuadrante
 * CP-141 — /employees redirige a /admin (backward compatibility)
 */

import { test, expect } from "@playwright/test";
import { ROUTES } from "./config";
import { loginAsAdmin, loginAsPM, loginAsViewer, loginAsTech } from "./helpers";

test.describe.configure({ mode: "serial" });

// ──────────────────────────────────────────────────────────────────────────────
// CP-129 — SUPER_ADMIN ve "Administración" en la cabecera
// ──────────────────────────────────────────────────────────────────────────────
test("CP-129 — SUPER_ADMIN ve el enlace 'Administración' en la cabecera @smoke", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto(ROUTES.home);
  const adminLink = page.locator('[data-testid="nav-admin"]');
  await expect(adminLink).toBeVisible({ timeout: 8_000 });
  await expect(adminLink).toHaveText("Administración");
});

// ──────────────────────────────────────────────────────────────────────────────
// CP-130 — PROJECT_ADMIN no ve "Administración" en la cabecera
// ──────────────────────────────────────────────────────────────────────────────
test("CP-130 — PROJECT_ADMIN no ve el enlace 'Administración' en la cabecera", async ({
  page,
}) => {
  await loginAsPM(page);
  await page.goto(ROUTES.home);
  // Esperar que la cabecera cargue (role badge visible)
  await expect(page.locator('[data-testid="role-badge"]')).toBeVisible({
    timeout: 8_000,
  });
  const adminLink = page.locator('[data-testid="nav-admin"]');
  await expect(adminLink).not.toBeVisible();
});

// ──────────────────────────────────────────────────────────────────────────────
// CP-131 — USER (empleado puro) solo ve "Cuadrante" y "Ayuda"
// ──────────────────────────────────────────────────────────────────────────────
test("CP-131 — USER solo ve 'Cuadrante' y 'Ayuda' en la cabecera", async ({
  page,
}) => {
  await loginAsTech(page);
  await page.goto(ROUTES.home);
  await expect(page.locator('[data-testid="role-badge"]')).toBeVisible({
    timeout: 8_000,
  });
  // No debe ver Proyectos ni Administración
  await expect(page.locator("nav a", { hasText: "Proyectos" })).not.toBeVisible();
  await expect(page.locator('[data-testid="nav-admin"]')).not.toBeVisible();
  // Sí debe ver Cuadrante y Ayuda
  await expect(page.locator("nav a", { hasText: "Cuadrante" })).toBeVisible();
  await expect(page.locator("nav a", { hasText: "Ayuda" })).toBeVisible();
});

// ──────────────────────────────────────────────────────────────────────────────
// CP-132 — /admin redirige a "/" si el usuario no es SUPER_ADMIN
// ──────────────────────────────────────────────────────────────────────────────
test("CP-132 — /admin redirige a '/' para no-SUPER_ADMIN (PM) @smoke", async ({
  page,
}) => {
  await loginAsPM(page);
  await page.goto("/admin");
  // Debe redirigir al home
  await expect(page).toHaveURL(/\/$/, { timeout: 10_000 });
});

// ──────────────────────────────────────────────────────────────────────────────
// CP-133 — SUPER_ADMIN puede crear un usuario desde /admin (tab Usuarios)
// ──────────────────────────────────────────────────────────────────────────────
test("CP-133 — SUPER_ADMIN puede crear un SUPER_VIEWER desde /admin @smoke", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto("/admin");

  // Tab Usuarios debe estar activo por defecto
  const usersTab = page.locator('[data-testid="admin-tab-users"]');
  await expect(usersTab).toBeVisible({ timeout: 8_000 });

  // Abrir modal de nuevo usuario
  await page.getByRole("button", { name: /Nuevo usuario/i }).click();
  // Esperar que el modal esté visible
  await expect(page.locator('h3:has-text("Nuevo usuario")')).toBeVisible({ timeout: 5_000 });

  // Cambiar rol primero (elimina el campo Nombre requerido para USER)
  const roleSelect = page.locator('[data-testid="select-global-role"]');
  await roleSelect.selectOption("SUPER_VIEWER");

  // Rellenar formulario
  await page.locator('input[type="email"]').fill("newviewer_cp133@cuadrantes.test");
  await page.locator('input[type="password"]').first().fill("Test1234!");

  // Guardar
  await page.getByRole("button", { name: /Guardar/i }).click();

  // Toast de éxito y modal cerrado
  await expect(page.locator("text=Usuario creado")).toBeVisible({
    timeout: 8_000,
  });

  // El usuario aparece en la tabla
  await expect(
    page.locator("td", { hasText: "newviewer_cp133@cuadrantes.test" })
  ).toBeVisible({ timeout: 5_000 });
});

// ──────────────────────────────────────────────────────────────────────────────
// CP-134 — SUPER_ADMIN puede editar el email de un usuario desde /admin
// ──────────────────────────────────────────────────────────────────────────────
test("CP-134 — SUPER_ADMIN puede editar el email del usuario creado en CP-133", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto("/admin");
  await expect(page.locator('[data-testid="admin-tab-users"]')).toBeVisible({
    timeout: 8_000,
  });

  // Encontrar la fila del usuario creado en CP-133
  const row = page.locator("tr", {
    hasText: "newviewer_cp133@cuadrantes.test",
  });
  await expect(row).toBeVisible({ timeout: 5_000 });

  // Click en Editar
  await row.getByRole("button", { name: /Editar/i }).click();
  await expect(page.locator('h3:has-text("Editar")')).toBeVisible({ timeout: 5_000 });

  // Cambiar el email
  const emailField = page.locator('input[type="email"]');
  await emailField.clear();
  await emailField.fill("newviewer_cp134@cuadrantes.test");

  await page.getByRole("button", { name: /Guardar/i }).click();

  await expect(page.locator("text=Usuario actualizado")).toBeVisible({
    timeout: 8_000,
  });
  await expect(
    page.locator("td", { hasText: "newviewer_cp134@cuadrantes.test" })
  ).toBeVisible({ timeout: 5_000 });
});

// ──────────────────────────────────────────────────────────────────────────────
// CP-135 — SUPER_ADMIN puede desactivar un usuario desde /admin
// ──────────────────────────────────────────────────────────────────────────────
test("CP-135 — SUPER_ADMIN puede desactivar un usuario USER desde /admin @smoke", async ({
  page,
}) => {
  // Login primero para que el API request tenga sesión
  await loginAsAdmin(page);

  // Crear un usuario USER para poder desactivarlo
  const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const tempEmail = `cp135_temp_${uniqueSuffix}@cuadrantes.test`;
  const createRes = await page.request.post("/api/admin/users", {
    data: {
      name: "CP135 Temp",
      email: tempEmail,
      password: "Test1234!",
      globalRole: "USER",
    },
  });

  expect(
    createRes.ok(),
    `CP-135 setup failed creating user: ${createRes.status()} ${createRes.statusText()}`
  ).toBeTruthy();

  const createPayload = (await createRes.json()) as { id: string };
  const userId = createPayload.id;
  await page.goto("/admin");
  await expect(page.locator('[data-testid="admin-tab-users"]')).toBeVisible({
    timeout: 8_000,
  });

  const row = page.locator("tr", { hasText: tempEmail });
  await expect(row).toBeVisible({ timeout: 5_000 });
  await row.getByRole("button", { name: /Editar/i }).click();

  // Click en "Desactivar usuario"
  await page.getByRole("button", { name: /Desactivar usuario/i }).click();
  // Confirmar
  await page.getByRole("button", { name: /^Sí$/ }).click();

  await expect(page.locator("text=Usuario desactivado")).toBeVisible({
    timeout: 8_000,
  });

  // Limpieza: eliminar el usuario si lo creamos aquí
  await page.request.patch(`/api/admin/users/${userId}`, {
    data: { active: false },
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// CP-136 — El filtro por rol en la tab Usuarios funciona correctamente
// ──────────────────────────────────────────────────────────────────────────────
test("CP-136 — Filtro por rol SUPER_ADMIN muestra solo SUPER_ADMINs @smoke", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto("/admin");
  await expect(page.locator('[data-testid="admin-tab-users"]')).toBeVisible({
    timeout: 8_000,
  });

  // Seleccionar filtro SUPER_ADMIN
  const roleFilter = page.locator("select", { hasText: "Todos los roles" });
  await roleFilter.selectOption("SUPER_ADMIN");

  // Todos los badges de rol deben ser SUPER_ADMIN
  const badges = page.locator("span.rounded-full", { hasText: "SUPER_ADMIN" });
  await expect(badges.first()).toBeVisible({ timeout: 5_000 });

  // No debe haber badges de SUPER_VIEWER ni USER
  await expect(
    page.locator("span.rounded-full", { hasText: "SUPER_VIEWER" })
  ).not.toBeVisible();
  await expect(
    page.locator("span.rounded-full", { hasText: /^USER$/ })
  ).not.toBeVisible();
});

// ──────────────────────────────────────────────────────────────────────────────
// CP-137 — PROJECT_ADMIN solo ve su propio proyecto en /projects
// ──────────────────────────────────────────────────────────────────────────────
test("CP-137 — PROJECT_ADMIN solo ve su propio proyecto en /projects", async ({
  page,
}) => {
  await loginAsPM(page);
  await page.goto(ROUTES.projects);

  const table = page.locator('[data-testid="projects-table"]');
  await expect(table).toBeVisible({ timeout: 8_000 });

  // La API /api/projects filtra por membresía para PROJECT_ADMIN
  // → solo debe aparecer 1 proyecto
  const rows = table.locator('[data-testid="project-row"]');
  const count = await rows.count();
  expect(count).toBe(1);
});

// ──────────────────────────────────────────────────────────────────────────────
// CP-138 — SUPER_VIEWER ve todos los proyectos en /projects (modo lectura)
// ──────────────────────────────────────────────────────────────────────────────
test("CP-138 — SUPER_VIEWER puede acceder a /projects y ve todos los proyectos", async ({
  page,
}) => {
  await loginAsViewer(page);
  await page.goto(ROUTES.projects);

  // No debe redirigir — debe llegar a /projects
  await expect(page).toHaveURL(/\/projects/, { timeout: 10_000 });

  const table = page.locator('[data-testid="projects-table"]');
  await expect(table).toBeVisible({ timeout: 8_000 });

  // No debe haber botón de "Nuevo proyecto"
  await expect(
    page.locator('[data-testid="btn-new-project"]')
  ).not.toBeVisible();
});

// ──────────────────────────────────────────────────────────────────────────────
// CP-139 — SUPER_VIEWER puede ver el cuadrante sin PrepPanel
// ──────────────────────────────────────────────────────────────────────────────
test("CP-139 — SUPER_VIEWER ve el cuadrante pero no tiene PrepPanel", async ({
  page,
}) => {
  await loginAsViewer(page);
  await page.goto(ROUTES.home);

  // El grid debe ser visible
  const grid = page.locator('[data-testid="schedule-grid"]');
  await expect(grid).toBeVisible({ timeout: 15_000 });

  // No debe haber PrepPanel
  const prepPanel = page.locator('[data-testid="prep-step-generar"]');
  await expect(prepPanel).not.toBeVisible();

  // No debe haber botón de generar
  await expect(page.locator('[data-testid="btn-generate"]')).not.toBeVisible();
});

// ──────────────────────────────────────────────────────────────────────────────
// CP-140 — SUPER_VIEWER no puede editar celdas del cuadrante
// ──────────────────────────────────────────────────────────────────────────────
test("CP-140 — SUPER_VIEWER no puede editar celdas (no hay ShiftEditor al hacer clic) @smoke", async ({
  page,
}) => {
  await loginAsViewer(page);
  await page.goto(ROUTES.home);

  const grid = page.locator('[data-testid="schedule-grid"]');
  await expect(grid).toBeVisible({ timeout: 15_000 });

  // Intentar hacer clic en una celda — el ShiftEditor no debe aparecer
  const firstCell = grid.locator("td.cursor-pointer").first();
  const cellCount = await firstCell.count();
  if (cellCount > 0) {
    await firstCell.click();
    // El editor no debe aparecer
    await expect(
      page.locator('[data-testid="shift-editor"]')
    ).not.toBeVisible({ timeout: 2_000 });
  } else {
    // No hay celdas con cursor-pointer → SUPER_VIEWER no puede editar (correcto)
    expect(cellCount).toBe(0);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// CP-141 — /employees redirige a /admin (backward compatibility)
// ──────────────────────────────────────────────────────────────────────────────
test("CP-141 — /employees redirige a /admin para SUPER_ADMIN", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto("/employees");
  // El middleware debe redirigir /employees → /admin
  await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 });
});
