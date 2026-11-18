/**
 * tests/e2e/sprint-6.palette-y-fixes.spec.ts
 * Sprint-06 (SPEC-012) — Paleta de edición unificada con arrastre + fixes.
 *
 * Contrato de testids esperado para la paleta (a implementar en Fase 3):
 *   - data-testid="palette-swatch-<TIPO>" para cada turno (M/T/N/J/D/V/B)
 *   - data-testid="palette-swatch-borrar" para la opción de borrar turno
 * El resto reutiliza los testids ya existentes del grid (cell-*, shift-cell-*).
 *
 * CP-N01 — Paleta: clic en celda aplica el turno seleccionado (sin modal)
 * CP-N02 — Paleta: arrastre pinta un rango de celdas, saltando fin de semana a D
 * CP-N03 — Una celda V/B puede re-editarse con la paleta sin "modo preparación"
 * CP-N04 — Cerrar sesión no produce error de consola ni fetch extra a las APIs
 * CP-N05 — El CSV exportado incluye la columna "Paga extra"
 */

import { test, expect } from "@playwright/test";
import fs from "fs";
import { ROUTES } from "./config";
import { loginAsAdmin, screenshotOnFail } from "./helpers";

test("CP-N01 — paleta: clic en celda aplica el turno seleccionado directamente @smoke", async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await loginAsAdmin(page);
    await page.goto(ROUTES.home);
    await page.waitForLoadState("networkidle");

    await page.click('[data-testid="palette-swatch-V"]');

    const row = page.locator('[data-testid="schedule-grid"] tbody tr').first();
    const cell = row.locator("td").nth(20); // 2026-05-20, miércoles, sin festivo
    await cell.click();
    await page.waitForTimeout(600);

    await expect(cell.locator('[data-testid="shift-cell-V"]')).toBeVisible({ timeout: 5_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-N01");
    throw e;
  }
});

test("CP-N02 — paleta: arrastre pinta un rango de celdas, fin de semana queda en D @smoke", async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await loginAsAdmin(page);
    await page.goto(ROUTES.home);
    await page.waitForLoadState("networkidle");

    await page.click('[data-testid="palette-swatch-V"]');

    // Rango 14-18 mayo 2026: jue(14) vie(15) SAB(16) DOM(17) lun(18) — sin festivos
    const row = page.locator('[data-testid="schedule-grid"] tbody tr').first();
    const startCell = row.locator("td").nth(14);
    await startCell.hover();
    await page.mouse.down();
    for (const day of [15, 16, 17, 18]) {
      await row.locator("td").nth(day).hover();
    }
    await page.mouse.up();
    await page.waitForTimeout(1_000);

    for (const day of [14, 15, 18]) {
      await expect(row.locator("td").nth(day).locator('[data-testid="shift-cell-V"]')).toBeVisible({
        timeout: 5_000,
      });
    }
    for (const day of [16, 17]) {
      await expect(row.locator("td").nth(day).locator('[data-testid="shift-cell-D"]')).toBeVisible({
        timeout: 5_000,
      });
      await expect(row.locator("td").nth(day).locator('[data-testid="shift-cell-V"]')).toHaveCount(0);
    }
  } catch (e) {
    await screenshotOnFail(page, "CP-N02");
    throw e;
  }
});

test("CP-N03 — una celda V puede re-editarse con la paleta sin estar en ningún paso", async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await loginAsAdmin(page);
    await page.goto(ROUTES.home);
    await page.waitForLoadState("networkidle");

    const row = page.locator('[data-testid="schedule-grid"] tbody tr').first();
    const cell = row.locator("td").nth(21); // 2026-05-21, jueves

    await page.click('[data-testid="palette-swatch-V"]');
    await cell.click();
    await page.waitForTimeout(600);
    await expect(cell.locator('[data-testid="shift-cell-V"]')).toBeVisible({ timeout: 5_000 });
    await expect(cell).toHaveAttribute("data-locked", "true");

    // Sin ningún "paso" de preparación activo, se puede volver a pintar la celda
    await page.click('[data-testid="palette-swatch-B"]');
    await cell.click();
    await page.waitForTimeout(600);
    await expect(cell.locator('[data-testid="shift-cell-B"]')).toBeVisible({ timeout: 5_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-N03");
    throw e;
  }
});

test("CP-N04 — cerrar sesión no produce error de consola ni fetch extra a las APIs @smoke", async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await loginAsAdmin(page);
    await page.goto(ROUTES.home);
    await page.waitForLoadState("networkidle");

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    let loggedOut = false;
    const unexpectedRequests: string[] = [];
    page.on("request", (req) => {
      if (loggedOut && /\/api\/(schedules|holidays|employees)(\?|$)/.test(req.url())) {
        unexpectedRequests.push(req.url());
      }
    });

    await page.getByRole("button", { name: /Cerrar sesión/i }).click();
    loggedOut = true;
    await page.waitForURL((url) => url.pathname === "/login", { timeout: 15_000 });
    await page.waitForTimeout(1_000);

    expect(unexpectedRequests, `peticiones inesperadas tras logout: ${unexpectedRequests.join(", ")}`).toHaveLength(0);
    expect(
      consoleErrors.filter((e) => /Error cargando cuadrante/i.test(e)),
      `errores de consola tras logout: ${consoleErrors.join(" | ")}`
    ).toHaveLength(0);
  } catch (e) {
    await screenshotOnFail(page, "CP-N04");
    throw e;
  }
});

test("CP-N05 — el CSV exportado incluye la columna Paga extra", async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await loginAsAdmin(page);
    await page.goto(ROUTES.home);
    await page.waitForLoadState("networkidle");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click('[data-testid="btn-export-csv"]'),
    ]);

    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    const content = fs.readFileSync(filePath as string, "utf-8");
    const header = content.split("\n")[0];

    expect(header).toContain("Paga extra");
    expect(content).not.toContain("€");
  } catch (e) {
    await screenshotOnFail(page, "CP-N05");
    throw e;
  }
});

test("CP-N06 — un fallo de red al pintar se avisa con un toast, no se silencia", async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await loginAsAdmin(page);
    await page.goto(ROUTES.home);
    await page.waitForLoadState("networkidle");

    // Forzar que el POST de guardado falle (simula un error de red/servidor)
    await page.route("**/api/schedules", (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({ status: 500, body: "{}" });
      }
      return route.continue();
    });

    await page.click('[data-testid="palette-swatch-J"]');
    const row = page.locator('[data-testid="schedule-grid"] tbody tr').first();
    const cell = row.locator("td").nth(22); // 2026-05-22, viernes
    await cell.click();

    await expect(page.locator('[data-testid="toast"]').filter({ hasText: /no se pudo guardar/i })).toBeVisible({
      timeout: 5_000,
    });
  } catch (e) {
    await screenshotOnFail(page, "CP-N06");
    throw e;
  }
});

/**
 * AC-22/23 (colores al imprimir) no se verifican aquí: Playwright no renderiza
 * el motor de impresión del navegador real. Cubierto por tests/unit/print-colors.test.ts
 * (presencia de la regla CSS) + verificación visual manual documentada en el
 * checklist de @qa antes de cerrar el sprint.
 */
