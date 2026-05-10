import { test, expect, Page } from "@playwright/test";

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("/", { timeout: 10_000 });
}

// ─── CP-40 — El admin ve la guía de administrador ────────────────────────────
test("CP-40 — El admin ve la guía de administrador", async ({ page }) => {
  await loginAs(page, "admin@cuadrantes.local", "Admin1234!");
  await page.locator('a[href="/info"]').click();
  await expect(page).toHaveURL("/info", { timeout: 5_000 });

  // Debe mostrar secciones específicas del admin
  await expect(page.locator("text=Gestión del cuadrante")).toBeVisible();
  await expect(page.locator("text=Gestión de festivos")).toBeVisible();
  await expect(page.locator("text=Gestión de empleados")).toBeVisible();
  await expect(page.locator("text=Administrador")).toBeVisible();
});

// ─── CP-41 — El técnico ve la guía de empleado ───────────────────────────────
test("CP-41 — El técnico ve la guía de empleado", async ({ page }) => {
  await loginAs(page, "tecnico1@cuadrantes.local", "Tecnico1234!");
  await page.locator('a[href="/info"]').click();
  await expect(page).toHaveURL("/info", { timeout: 5_000 });

  // Secciones del empleado
  await expect(page.locator("text=Consulta del cuadrante")).toBeVisible();
  await expect(page.locator("text=Tu cuenta")).toBeVisible();
  await expect(page.locator("text=Técnico")).toBeVisible();

  // NO debe mostrar secciones de admin
  await expect(page.locator("text=Gestión de festivos")).not.toBeVisible();
  await expect(page.locator("text=Gestión de empleados")).not.toBeVisible();
});

// ─── CP-42 — La página /info redirige a login si no autenticado ───────────────
test("CP-42 — /info redirige a login si no autenticado", async ({ page }) => {
  await page.goto("/info");
  await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
});
