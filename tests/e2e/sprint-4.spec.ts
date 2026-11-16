/**
 * Sprint 4 (ciclo 2) E2E tests — SPEC-009.
 * Covers: AC-03/AC-04 (botón "↔ Vista ampliada" en la barra del cuadrante),
 *         AC-08 (scroll inicial centrado en el mes visible),
 *         AC-09 (vista multi-mes funcional para TECNICO y VIEWER).
 */

import { test, expect, Page } from "@playwright/test";
import { loginAsAdmin, loginAsTech, loginAsViewer } from "./helpers";

const BTN_EXPANDED = '[data-testid="btn-expanded-view"]';
const MONTH_HEADERS = "thead tr:first-child th[colspan]";

async function openExpandedView(page: Page): Promise<URL> {
  await page.click(BTN_EXPANDED);
  await page.waitForURL((url) => url.pathname === "/multi-month");
  return new URL(page.url());
}

test("CP-173 — Botón 'Vista ampliada' abre /multi-month del mes visible @smoke", async ({ page }) => {
  await loginAsAdmin(page);

  const url = await openExpandedView(page);
  expect(url.searchParams.get("year")).toBe("2026");
  expect(url.searchParams.get("month")).toBe("5");
  expect(url.searchParams.get("span")).toBe("3");

  await expect(page.locator(MONTH_HEADERS)).toHaveCount(3);
});

test("CP-174 — 'Vista ampliada' respeta el mes navegado, no el mes por defecto", async ({ page }) => {
  await loginAsAdmin(page);

  await page.click('[data-testid="btn-prev-month"]');
  const url = await openExpandedView(page);

  expect(url.searchParams.get("year")).toBe("2026");
  expect(url.searchParams.get("month")).toBe("4");
});

for (const [role, login] of [
  ["TECNICO", loginAsTech],
  ["VIEWER", loginAsViewer],
] as const) {
  test(`CP-175 — ${role} abre la vista ampliada y ve la tabla de empleados @smoke`, async ({ page }) => {
    await login(page);

    await openExpandedView(page);

    await expect(page.locator(MONTH_HEADERS)).toHaveCount(3);
    await expect(page.getByText("Error al cargar empleados")).toHaveCount(0);
    // Con meses publicados se ven filas de empleados; sin publicar (seed: mayo sin
    // publicar), el aviso específico — nunca "Sin empleados en el sistema".
    const rows = page.locator('[data-testid="multi-month-grid"] tbody tr:not(:has([data-testid="multi-month-empty"]))');
    const notPublished = page.getByText("Ningún mes de este rango está publicado todavía.");
    await expect(rows.first().or(notPublished)).toBeVisible();
    await expect(page.getByText("Sin empleados en el sistema.")).toHaveCount(0);
  });
}

test("CP-176 — Con 6 meses el scroll inicial deja el mes visible centrado", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await loginAsAdmin(page);
  await page.goto("/multi-month?year=2026&month=5&span=6");

  const grid = page.locator('[data-testid="multi-month-grid"]');
  const mayHeader = page.locator('[data-testid="month-header-2026-5"]');
  await expect(mayHeader).toBeVisible();

  // span=6 → marzo..agosto; mayo es el tercero, así que sin scroll quedaría fuera de vista
  await expect(page.locator(MONTH_HEADERS).first()).toHaveText("Marzo 2026");
  await expect.poll(() => grid.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);

  const gridBox = (await grid.boundingBox())!;
  const mayBox = (await mayHeader.boundingBox())!;
  const mayCenter = mayBox.x + mayBox.width / 2;
  expect(mayCenter).toBeGreaterThan(gridBox.x);
  expect(mayCenter).toBeLessThan(gridBox.x + gridBox.width);
});
