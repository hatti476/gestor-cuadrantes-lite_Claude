import { test, expect } from "@playwright/test";
import { loginAsAdmin, generateScheduleAndWait, screenshotOnFail } from "./helpers";

test("CP-143 — Generación mensual no deja celdas vacías en el grid @smoke", async ({ page }) => {
  try {
    await loginAsAdmin(page);
    await expect(page).toHaveURL("/");

    await generateScheduleAndWait(page);

    const grid = page.locator('[data-testid="schedule-grid"]');
    await expect(grid).toBeVisible({ timeout: 10_000 });

    const emptyCells = grid.locator('td[data-testid^="cell-"]:not(:has([data-testid^="shift-cell-"]))');
    await expect(emptyCells).toHaveCount(0);
  } catch (error) {
    await screenshotOnFail(page, "CP-143");
    throw error;
  }
});

test("CP-144 — Grid mantiene celdas cuadradas en ultrawide @smoke", async ({ page }) => {
  try {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginAsAdmin(page);
    await expect(page).toHaveURL("/");

    await generateScheduleAndWait(page);

    const grid = page.locator('[data-testid="schedule-grid"]');
    const firstCell = grid.locator('td[data-testid^="cell-"]').first();
    await expect(firstCell).toBeVisible({ timeout: 10_000 });

    const compactWidth = await firstCell.boundingBox().then((box) => box?.width ?? 0);
    const compactGridWidth = await grid.boundingBox().then((box) => box?.width ?? 0);

    await page.setViewportSize({ width: 2560, height: 1080 });
    await page.waitForTimeout(500);

    const wideWidth = await firstCell.boundingBox().then((box) => box?.width ?? 0);
    const wideGridWidth = await grid.boundingBox().then((box) => box?.width ?? 0);

    expect(Math.abs(wideWidth - compactWidth)).toBeLessThanOrEqual(1);
    expect(wideGridWidth).toBeLessThan(2560);
    expect(compactGridWidth).toBeLessThan(1920);
  } catch (error) {
    await screenshotOnFail(page, "CP-144");
    throw error;
  }
});
