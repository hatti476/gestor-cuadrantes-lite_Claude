/**
 * tests/e2e/sprint-7.balance-jornadas.spec.ts
 * Sprint-07 (SPEC-014) — Balance jornadas trabajadas vs. días laborables.
 *
 * CP-186 — La vista del cuadrante muestra los días laborables del mes una sola
 *          vez, y las columnas "Dif. mes" / "Acum. año" por empleado.
 * CP-187 — Un valor negativo de "Dif. mes" o "Acum. año" se distingue
 *          visualmente de uno positivo o cero.
 */

import { test, expect } from "@playwright/test";
import { ROUTES } from "./config";
import { loginAsAdmin, screenshotOnFail } from "./helpers";

test("CP-186 — laborables del mes y columnas Dif. mes / Acum. año visibles en CountersTable @smoke", async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await loginAsAdmin(page);
    await page.goto(ROUTES.home);
    await page.waitForLoadState("networkidle");

    // AC-05: días laborables del mes, mostrados una sola vez (no por fila)
    const laborableBadge = page.locator('[data-testid="laborable-days"]');
    await expect(laborableBadge).toBeVisible();
    await expect(laborableBadge).toHaveCount(1);

    const countersTable = page.locator('[data-testid="counters-table"]');
    const firstRow = countersTable.locator("tbody tr").first();
    const employeeId = await firstRow.getAttribute("data-employee-id");
    expect(employeeId).toBeTruthy();

    // AC-04/06: diferencia mensual junto a los contadores, sin petición extra
    await expect(page.locator(`[data-testid="month-diff-${employeeId}"]`)).toBeVisible();
    // AC-08: acumulado del año natural en curso
    await expect(page.locator(`[data-testid="year-balance-${employeeId}"]`)).toBeVisible();
  } catch (e) {
    await screenshotOnFail(page, "CP-186");
    throw e;
  }
});

test("CP-187 — una diferencia negativa se distingue visualmente de una positiva/cero", async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await loginAsAdmin(page);
    await page.goto(ROUTES.home);
    await page.waitForLoadState("networkidle");

    // Invariante por celda (independiente de qué signos tenga el mes sembrado en
    // este momento, que otros specs E2E pueden haber regenerado): negativo → rojo,
    // cero/positivo → verde. No exige que coexistan ambos signos a la vez.
    const cells = page.locator('[data-testid^="month-diff-"], [data-testid^="year-balance-"]');
    const count = await cells.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const cell = cells.nth(i);
      const text = (await cell.textContent())?.trim() ?? "";
      const value = Number(text);
      const className = (await cell.getAttribute("class")) ?? "";
      if (value < 0) {
        expect(className).toContain("text-red-700");
      } else {
        expect(className).toContain("text-green-700");
      }
    }
  } catch (e) {
    await screenshotOnFail(page, "CP-187");
    throw e;
  }
});
