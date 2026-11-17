/**
 * Sprint 5 (ciclo 2) — SPEC-010 H-02/H-09: rotación de noches e historial en /admin.
 *
 * El intercambio real de posiciones (POST /api/admin/users/[id]/rotation) se cubre
 * con tests unitarios: hacerlo aquí cambiaría el orden de noches mientras otros
 * specs generan cuadrantes en paralelo contra la misma BD.
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin");
  await expect(page.locator("table").first()).toBeVisible({ timeout: 10_000 });
});

test("CP-180 — /admin muestra la rotación de noches 1..n con ↑/↓ en los extremos deshabilitados @smoke", async ({ page }) => {
  // n ≥ 7 (seed); otros specs pueden crear técnicos temporales en paralelo
  const positions = page.locator('[data-testid^="rotation-pos-"]');
  await expect(positions.nth(6)).toBeVisible();
  const values = (await positions.allTextContents()).map(Number).sort((a, b) => a - b);
  const n = values.length;
  expect(values).toEqual(Array.from({ length: n }, (_, i) => i + 1));

  const first = page.locator('[data-testid^="rotation-pos-"]', { hasText: /^1$/ });
  const firstUserId = (await first.getAttribute("data-testid"))!.replace("rotation-pos-", "");
  await expect(page.locator(`[data-testid="btn-rotation-up-${firstUserId}"]`)).toBeDisabled();
  await expect(page.locator(`[data-testid="btn-rotation-down-${firstUserId}"]`)).toBeEnabled();

  const last = page.locator('[data-testid^="rotation-pos-"]', { hasText: new RegExp(`^${n}$`) });
  const lastUserId = (await last.getAttribute("data-testid"))!.replace("rotation-pos-", "");
  await expect(page.locator(`[data-testid="btn-rotation-down-${lastUserId}"]`)).toBeDisabled();
});

test("CP-181 — 'Historial' abre el historial de cambios del técnico", async ({ page }) => {
  const row = page.locator("tbody tr", { hasText: "tecnico1@cuadrantes.local" });
  await row.locator('[data-testid^="btn-history-user-"]').click();

  const modal = page.locator('[data-testid="history-modal"]');
  await expect(modal).toBeVisible();
  await expect(modal).toContainText("Historial — Técnico 1");
  await expect(modal.getByText("Cargando historial...")).toHaveCount(0, { timeout: 10_000 });
  await expect(modal.getByText("Error cargando historial")).toHaveCount(0);
});

test("CP-182 — /employees y /employees/<id>/history redirigen a /admin", async ({ page }) => {
  await page.goto("/employees");
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/employees/cualquier-id/history");
  await expect(page).toHaveURL(/\/admin$/);
});
