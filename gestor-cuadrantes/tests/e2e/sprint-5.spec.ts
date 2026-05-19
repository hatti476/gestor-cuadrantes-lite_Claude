import { test, expect } from "@playwright/test";
import { ROUTES } from "./config";
import { loginAsAdmin, loginAsTech } from "./helpers";

// ─── CP-40 — El admin ve la guía de administrador ────────────────────────────
test("CP-40 — El admin ve la guía de administrador", async ({ page }) => {
  await loginAsAdmin(page);
  await page.locator(`a[href="${ROUTES.info}"]`).click();
  await expect(page).toHaveURL(ROUTES.info, { timeout: 5_000 });

  // Debe mostrar secciones específicas del admin
  await expect(page.locator("text=Gestión de proyectos")).toBeVisible();
  await expect(page.locator("text=Preparar el cuadrante")).toBeVisible();
  await expect(page.locator("text=Festivos automáticos")).toBeVisible();
  await expect(page.locator("text=Super Admin")).toBeVisible();
});

// ─── CP-41 — El técnico ve la guía de empleado ───────────────────────────────
test("CP-41 — El técnico ve la guía de empleado", async ({ page }) => {
  await loginAsTech(page);
  await page.locator(`a[href="${ROUTES.info}"]`).click();
  await expect(page).toHaveURL(ROUTES.info, { timeout: 5_000 });

  // Secciones del empleado
  await expect(page.locator("text=Cómo leer el cuadrante")).toBeVisible();
  await expect(page.locator("text=Tu turno actual")).toBeVisible();
  await expect(page.locator("text=Técnico")).toBeVisible();

  // NO debe mostrar secciones de admin
  await expect(page.locator("text=Gestión de proyectos")).not.toBeVisible();
  await expect(page.locator("text=Festivos automáticos")).not.toBeVisible();
});

// ─── CP-42 — La página /info redirige a login si no autenticado ───────────────
test("CP-42 — /info redirige a login si no autenticado", async ({ page }) => {
  await page.goto(ROUTES.info);
  await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
});
