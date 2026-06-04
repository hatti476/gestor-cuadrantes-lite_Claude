/**
 * Sprint 24 post-release E2E regression tests.
 * Covers: BUG-45, BUG-46, BUG-47, BUG-49
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin, generateScheduleAndWait, screenshotOnFail } from "./helpers";

// ── BUG-45: RatesLegend alignment ──────────────────────────────────────────────

test("CP-149 — RatesLegend aparece a la derecha de ExtraPayTable, no debajo @smoke", async ({ page }) => {
  try {
    await loginAsAdmin(page);
    await generateScheduleAndWait(page);

    const legend = page.locator('[data-testid="rates-legend"]');
    const extraPay = page.locator('[data-testid="extra-pay-legend"]');

    await expect(legend).toBeVisible({ timeout: 10_000 });
    await expect(extraPay).toBeVisible({ timeout: 10_000 });

    const legendBox = await legend.boundingBox();
    const extraPayBox = await extraPay.boundingBox();

    // The legend must be to the RIGHT of the extra pay table (same row, higher x)
    expect(legendBox).not.toBeNull();
    expect(extraPayBox).not.toBeNull();

    // Legend's left edge is beyond ExtraPayTable's left edge (they share a row)
    expect(legendBox!.x).toBeGreaterThan(extraPayBox!.x);

    // Legend must NOT be below ExtraPayTable: their tops must be within 20px of each other
    expect(Math.abs(legendBox!.y - extraPayBox!.y)).toBeLessThan(20);
  } catch (error) {
    await screenshotOnFail(page, "CP-149");
    throw error;
  }
});

// ── BUG-46: Wrong employees after returning from multi-month view ───────────────

test("CP-150 — Solo se muestran empleados del proyecto activo al volver de vista multi-mes @smoke", async ({ page }) => {
  try {
    await loginAsAdmin(page);
    await generateScheduleAndWait(page);

    // Record the employees shown in the main view
    const grid = page.locator('[data-testid="schedule-grid"]');
    await expect(grid).toBeVisible({ timeout: 10_000 });
    const rowsBefore = await grid.locator("tbody tr").allTextContents();

    // Navigate to multi-month view
    const btnExpanded = page.locator('[data-testid="btn-expanded-view"]');
    await expect(btnExpanded).toBeEnabled({ timeout: 5_000 });
    await btnExpanded.click();

    // Wait for multi-month page to load
    await page.waitForURL(/\/multi-month/, { timeout: 10_000 });
    await expect(page.locator('[data-testid="btn-back"]')).toBeVisible({ timeout: 10_000 });

    // Go back
    await page.locator('[data-testid="btn-back"]').click();
    await page.waitForURL("/", { timeout: 10_000 });

    // Wait for grid to reload
    await expect(grid).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1_000);

    const rowsAfter = await grid.locator("tbody tr").allTextContents();

    // Same number of employees — no cross-project leakage
    expect(rowsAfter.length).toBe(rowsBefore.length);
  } catch (error) {
    await screenshotOnFail(page, "CP-150");
    throw error;
  }
});

// ── BUG-47: Multi-month toolbar consistent styling ─────────────────────────────

test("CP-151 — Vista multi-mes tiene botón Volver con data-testid correcto @smoke", async ({ page }) => {
  try {
    await loginAsAdmin(page);
    await generateScheduleAndWait(page);

    const btnExpanded = page.locator('[data-testid="btn-expanded-view"]');
    await expect(btnExpanded).toBeEnabled({ timeout: 5_000 });
    await btnExpanded.click();

    await page.waitForURL(/\/multi-month/, { timeout: 10_000 });

    const btnBack = page.locator('[data-testid="btn-back"]');
    await expect(btnBack).toBeVisible({ timeout: 10_000 });
    await expect(btnBack).toHaveText(/Volver/i);

    // Toolbar buttons must use small text (text-xs = 12px font-size)
    const fontSize = await btnBack.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).fontSize)
    );
    expect(fontSize).toBeLessThanOrEqual(12);
  } catch (error) {
    await screenshotOnFail(page, "CP-151");
    throw error;
  }
});

// ── BUG-49: Multi-month cell styling matches main grid ─────────────────────────

test("CP-152 — Celdas de vista multi-mes usan ShiftCell con esquinas redondeadas @smoke", async ({ page }) => {
  try {
    await loginAsAdmin(page);
    await generateScheduleAndWait(page);

    const btnExpanded = page.locator('[data-testid="btn-expanded-view"]');
    await expect(btnExpanded).toBeEnabled({ timeout: 5_000 });
    await btnExpanded.click();

    await page.waitForURL(/\/multi-month/, { timeout: 10_000 });

    // Wait for grid to render
    const table = page.locator("table").first();
    await expect(table).toBeVisible({ timeout: 15_000 });

    // At least one ShiftCell should be visible (rendered via ShiftCell component with data-testid)
    const shiftCell = page.locator('[data-testid^="shift-cell-"]').first();
    await expect(shiftCell).toBeVisible({ timeout: 15_000 });

    // The shift cell must have rounded corners (border-radius > 0)
    const borderRadius = await shiftCell.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).borderRadius)
    );
    expect(borderRadius).toBeGreaterThan(0);
  } catch (error) {
    await screenshotOnFail(page, "CP-152");
    throw error;
  }
});
