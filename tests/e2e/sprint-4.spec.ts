/**
 * Sprint 4 (ciclo 2) E2E tests — SPEC-009.
 * Covers: AC-03/AC-04 (botón "Vista ampliada" en la barra del cuadrante).
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsTech, loginAsViewer } from "./helpers";

test("CP-173 — Botón 'Vista ampliada' abre /multi-month del mes visible @smoke", async ({ page }) => {
  await loginAsAdmin(page);

  await page.click('[data-testid="btn-multi-month"]');
  await page.waitForURL((url) => url.pathname === "/multi-month");

  const url = new URL(page.url());
  expect(url.searchParams.get("year")).toBe("2026");
  expect(url.searchParams.get("month")).toBe("5");
  expect(url.searchParams.get("span")).toBe("3");

  const monthHeaders = page.locator("thead tr:first-child th[colspan]");
  await expect(monthHeaders).toHaveCount(3);
});

test("CP-174 — 'Vista ampliada' respeta el mes navegado, no el mes por defecto", async ({ page }) => {
  await loginAsAdmin(page);

  await page.click('[data-testid="btn-prev-month"]');
  await page.click('[data-testid="btn-multi-month"]');
  await page.waitForURL((url) => url.pathname === "/multi-month");

  const url = new URL(page.url());
  expect(url.searchParams.get("year")).toBe("2026");
  expect(url.searchParams.get("month")).toBe("4");
});

test("CP-175 — TECNICO y VIEWER ven el botón 'Vista ampliada'", async ({ page }) => {
  await loginAsTech(page);
  await expect(page.locator('[data-testid="btn-multi-month"]')).toBeVisible();

  await page.context().clearCookies();
  await loginAsViewer(page);
  await expect(page.locator('[data-testid="btn-multi-month"]')).toBeVisible();
});
