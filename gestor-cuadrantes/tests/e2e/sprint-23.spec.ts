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
