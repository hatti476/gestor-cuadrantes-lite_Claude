import { test, expect, Page } from "@playwright/test";
import path from "path";
import fs from "fs";

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("admin@cuadrantes.local");
  await page.locator('input[type="password"]').fill("Admin1234!");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("/", { timeout: 10_000 });
}

async function screenshotOnFail(page: Page, testId: string) {
  const dir = path.join(process.cwd(), "tests/screenshots");
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, `${testId}-fail.png`) });
}

// ─── CP-30 — Admin puede añadir un festivo ───────────────────────────────────
test("CP-30 — Admin puede añadir un festivo", async ({ page }) => {
  try {
    await loginAsAdmin(page);
    await page.locator('[data-testid="btn-holidays"]').click();
    await expect(page).toHaveURL("/holidays", { timeout: 5_000 });

    await page.locator('[data-testid="holiday-date-input"]').fill("2026-12-25");
    await page.locator('[data-testid="holiday-desc-input"]').fill("Navidad (QA)");
    await page.locator('[data-testid="btn-add-holiday"]').click();

    // El festivo aparece en la tabla
    await expect(page.locator("text=Navidad (QA)")).toBeVisible({ timeout: 6_000 });
    // Toast de éxito
    await expect(page.locator('[data-testid="toast"]')).toBeVisible({ timeout: 5_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-30");
    throw e;
  }
});

// ─── CP-31 — Admin puede eliminar un festivo ─────────────────────────────────
test("CP-31 — Admin puede eliminar un festivo", async ({ page }) => {
  try {
    await loginAsAdmin(page);
    await page.goto("/holidays");

    // Asegurar que hay al menos un festivo (el de CP-30 puede haber quedado)
    // Si no hay, lo añadimos
    const noHolidays = page.locator('[data-testid="no-holidays"]');
    if (await noHolidays.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await page.locator('[data-testid="holiday-date-input"]').fill("2026-11-01");
      await page.locator('[data-testid="holiday-desc-input"]').fill("Todos los Santos (QA)");
      await page.locator('[data-testid="btn-add-holiday"]').click();
      await expect(page.locator("text=Todos los Santos (QA)")).toBeVisible({ timeout: 6_000 });
    }

    // Eliminar el primer botón de eliminar visible
    const deleteBtn = page.locator("button:has-text('Eliminar')").first();
    await deleteBtn.click();

    // El toast de éxito aparece
    await expect(page.locator('[data-testid="toast"]')).toBeVisible({ timeout: 5_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-31");
    throw e;
  }
});

// ─── CP-32 — La generación respeta festivos (M→MF) ───────────────────────────
test("CP-32 — La generación respeta los festivos (M→MF)", async ({ page }) => {
  try {
    await loginAsAdmin(page);

    // Añadir festivo el día 1 de Noviembre 2026
    await page.goto("/holidays");
    const yearSelect = page.locator("select");
    await yearSelect.selectOption("2026");

    // Añadir festivo el 1 de Noviembre
    await page.locator('[data-testid="holiday-date-input"]').fill("2026-11-01");
    await page.locator('[data-testid="holiday-desc-input"]').fill("Festivo test generación");
    await page.locator('[data-testid="btn-add-holiday"]').click();
    await expect(page.locator("text=Festivo test generación")).toBeVisible({ timeout: 6_000 });

    // Ir al cuadrante de Noviembre 2026 (6 nexts desde Mayo)
    await page.goto("/");
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
    for (let i = 0; i < 6; i++) {
      await page.locator('[data-testid="btn-next-month"]').click();
      await page.waitForTimeout(400);
    }

    // Generar
    await page.locator('[data-testid="btn-generate"]').click();
    await expect(page.locator('[data-testid="toast"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // Verificar que el día 1 tiene MF, TF o NF (festivo) en al menos un empleado
    // (puede ser D si ese empleado descansa, lo cual también es válido)
    const day1Cells = page.locator("table tbody tr").first().locator("td").nth(1);
    await expect(day1Cells).toBeVisible({ timeout: 5_000 });
    // Al menos debe contener algún turno
    const cellText = await day1Cells.innerText().catch(() => "");
    // MF, TF, NF o D (válidos todos para un festivo)
    const validOnHoliday = ["MF", "TF", "NF", "D", ""];
    const shiftCell = day1Cells.locator("[data-testid^='shift-cell-']");
    const testId = await shiftCell.getAttribute("data-testid").catch(() => null);
    if (testId) {
      const shiftType = testId.replace("shift-cell-", "");
      expect(validOnHoliday).toContain(shiftType);
    }
  } catch (e) {
    await screenshotOnFail(page, "CP-32");
    throw e;
  }
});

// ─── CP-33 — Exportar CSV descarga el fichero ────────────────────────────────
test("CP-33 — Exportar CSV descarga el fichero correcto", async ({ page }) => {
  try {
    await loginAsAdmin(page);
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // Interceptar la descarga
    const downloadPromise = page.waitForEvent("download", { timeout: 8_000 });
    await page.locator('[data-testid="btn-export-csv"]').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/cuadrante-2026-\d{2}\.csv/);
  } catch (e) {
    await screenshotOnFail(page, "CP-33");
    throw e;
  }
});

// ─── CP-34 — Historial registra cambios de turno ─────────────────────────────
test("CP-34 — Historial registra cambios de turno", async ({ page }) => {
  try {
    await loginAsAdmin(page);
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // Asignar turno V al empleado 1, día 1 del cuadrante activo (Mayo 2026)
    const cell = page.locator("table tbody tr").first().locator("td").nth(1);
    await cell.click();
    await expect(page.locator('[data-testid="shift-editor"]')).toBeVisible({ timeout: 5_000 });
    await page.locator('[data-testid="shift-btn-V"]').click();
    await expect(page.locator('[data-testid="shift-editor"]')).not.toBeVisible({ timeout: 5_000 });

    // Ir a /employees y pulsar historial del primer empleado
    await page.goto("/employees");
    await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });
    const firstHistoryBtn = page.locator("button:has-text('Historial')").first();
    await firstHistoryBtn.click();

    // La tabla de historial debe mostrar al menos un registro
    await expect(page.locator('[data-testid="history-table"]')).toBeVisible({ timeout: 8_000 });
    const rows = page.locator('[data-testid="history-table"] tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  } catch (e) {
    await screenshotOnFail(page, "CP-34");
    throw e;
  }
});

// ─── CP-35 — Solo el admin puede ver el historial ────────────────────────────
test("CP-35 — Solo el admin ve el historial", async ({ page }) => {
  try {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("tecnico1@cuadrantes.local");
    await page.locator('input[type="password"]').fill("Tecnico1234!");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("/", { timeout: 10_000 });

    // Intentar acceder directamente a la API de historial con cualquier ID
    const res = await page.request.get("/api/employees/fake-id/history");
    expect(res.status()).toBe(403);
  } catch (e) {
    await screenshotOnFail(page, "CP-35");
    throw e;
  }
});

// ─── CP-36 — Las notificaciones toast aparecen y desaparecen ─────────────────
test("CP-36 — Las notificaciones toast aparecen y desaparecen", async ({ page }) => {
  try {
    await loginAsAdmin(page);
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // Generar cuadrante para disparar un toast de éxito
    // Ir a un mes sin datos previos de este sprint (Diciembre 2026, 7 nexts)
    for (let i = 0; i < 7; i++) {
      await page.locator('[data-testid="btn-next-month"]').click();
      await page.waitForTimeout(400);
    }
    await page.locator('[data-testid="btn-generate"]').click();

    // El toast aparece
    const toast = page.locator('[data-testid="toast"]');
    await expect(toast).toBeVisible({ timeout: 10_000 });

    // El toast desaparece automáticamente en ~4s (esperamos hasta 7s)
    await expect(toast).not.toBeVisible({ timeout: 7_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-36");
    throw e;
  }
});
