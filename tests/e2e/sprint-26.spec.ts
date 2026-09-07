/**
 * Sprint 26 E2E regression tests.
 * Covers: CHG-01 (sombreado finde/festivo más marcado — vista mensual y multi-mes),
 *         CHG-02 (separador mensual más grueso en vista ampliada).
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin, screenshotOnFail } from "./helpers";

// ── CHG-01: Sombreado de fines de semana más marcado ─────────────────────────

test("CP-167 — Celdas de fin de semana usan bg-blue-100 en vista mensual @smoke", async ({
  page,
}) => {
  try {
    await loginAsAdmin(page);
    await expect(page).toHaveURL("/");

    // Wait for the schedule grid to load
    await page.waitForSelector('[data-testid="schedule-grid"]', { timeout: 15_000 });

    // Find a cell that corresponds to a weekend day.
    // We look for a td inside the grid with the bg-blue-100 class.
    const weekendCell = page.locator('[data-testid="schedule-grid"] td.bg-blue-100').first();
    await expect(weekendCell).toBeVisible({ timeout: 10_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-167");
    throw e;
  }
});

test("CP-168 — Cabeceras de fin de semana usan bg-blue-200 en vista mensual @smoke", async ({
  page,
}) => {
  try {
    await loginAsAdmin(page);
    await expect(page).toHaveURL("/");

    await page.waitForSelector('[data-testid="schedule-grid"]', { timeout: 15_000 });

    // Weekend header cells should have bg-blue-200
    const weekendHeader = page.locator('[data-testid="schedule-grid"] th.bg-blue-200').first();
    await expect(weekendHeader).toBeVisible({ timeout: 10_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-168");
    throw e;
  }
});

// ── CHG-01 (multi-month): Sombreado en vista ampliada ────────────────────────

test("CP-169 — Vista ampliada: celdas de finde usan bg-blue-100 y cabeceras bg-blue-200", async ({
  page,
}) => {
  try {
    await loginAsAdmin(page);
    await expect(page).toHaveURL("/");

    await page.waitForSelector('[data-testid="schedule-grid"]', { timeout: 15_000 });

    const now = new Date();
    const url = `/multi-month?year=${now.getFullYear()}&month=${now.getMonth() + 1}`;
    await page.goto(url);
    await page.waitForSelector("table", { timeout: 15_000 });

    // Weekend header cells in multi-month should have bg-blue-200
    const weekendHeader = page.locator("thead th.bg-blue-200").first();
    await expect(weekendHeader).toBeVisible({ timeout: 10_000 });

    // Weekend body cells in multi-month should have bg-blue-100
    const weekendCell = page.locator("tbody td.bg-blue-100").first();
    await expect(weekendCell).toBeVisible({ timeout: 10_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-169");
    throw e;
  }
});

// ── CHG-02: Separador mensual más grueso en vista ampliada ───────────────────

test("CP-170 — Vista ampliada: separador entre meses usa border-r-2 @smoke", async ({
  page,
}) => {
  try {
    await loginAsAdmin(page);
    await expect(page).toHaveURL("/");

    await page.waitForSelector('[data-testid="schedule-grid"]', { timeout: 15_000 });

    const now = new Date();
    const url = `/multi-month?year=${now.getFullYear()}&month=${now.getMonth() + 1}`;
    await page.goto(url);
    await page.waitForSelector("table", { timeout: 15_000 });

    // The last day of each month should have border-r-2 class
    const thickSeparator = page.locator("th.border-r-2, td.border-r-2").first();
    await expect(thickSeparator).toBeVisible({ timeout: 10_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-170");
    throw e;
  }
});
