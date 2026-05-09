import { test, expect, Page } from "@playwright/test";
import path from "path";
import fs from "fs";

const BASE_URL = "http://localhost:3000";
const ADMIN_EMAIL = "admin@cuadrantes.local";
const ADMIN_PASSWORD = "Admin1234!";

// ─── helpers ─────────────────────────────────────────────────────────────────

async function screenshotOnFail(page: Page, id: string) {
  const dir = path.join(__dirname, "../screenshots");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  try {
    await page.screenshot({ path: path.join(dir, `${id}-fail.png`) });
  } catch {
    // ignore screenshot errors
  }
}

async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/`, { timeout: 10_000 });
}

// ─── CP-23 — Admin puede cambiar la contraseña de un empleado ─────────────────
test("CP-23 — Admin puede cambiar la contraseña de un empleado", async ({ page }) => {
  try {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/employees`);
    await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });

    // Pulsar "Clave" en el ÚLTIMO empleado (técnico, no el admin)
    const claveBtns = page.locator("button").filter({ hasText: /Clave/i });
    await claveBtns.last().click();

    // Modal de cambio de contraseña
    await expect(page.locator('input#pwd-new')).toBeVisible({ timeout: 5_000 });
    await page.fill('input#pwd-new', 'NuevaClave1!');
    await page.fill('input#pwd-confirm', 'NuevaClave1!');
    await page.locator('button[type="submit"]').click();

    // El modal debe cerrarse (éxito)
    await expect(page.locator('input#pwd-new')).not.toBeVisible({ timeout: 5_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-23");
    throw e;
  }
});

// ─── CP-24 — Validación de contraseña débil ───────────────────────────────────
test("CP-24 — Cambio de contraseña valida requisitos", async ({ page }) => {
  try {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/employees`);
    await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });

    // Abrir modal de contraseña
    await page.locator("button").filter({ hasText: /Clave/i }).first().click();
    await expect(page.locator('input#pwd-new')).toBeVisible({ timeout: 5_000 });

    // Introducir contraseña débil (< 8 chars)
    await page.fill('input#pwd-new', 'abc');
    await page.fill('input#pwd-confirm', 'abc');
    await page.locator('button[type="submit"]').click();

    // Debe aparecer mensaje de error
    await expect(page.locator("text=inválida")).toBeVisible({ timeout: 3_000 });

    // El modal permanece abierto
    await expect(page.locator('input#pwd-new')).toBeVisible();
  } catch (e) {
    await screenshotOnFail(page, "CP-24");
    throw e;
  }
});

// ─── CP-25 — Turnos MF/TF/NF en el selector ──────────────────────────────────
test("CP-25 — Turnos MF/TF/NF disponibles en el selector", async ({ page }) => {
  try {
    await loginAsAdmin(page);
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // Abrir ShiftEditor haciendo clic en cualquier celda
    const cell = page.locator("table tbody tr").first().locator("td").nth(1);
    await cell.click();
    await expect(page.locator('[data-testid="shift-editor"]')).toBeVisible({ timeout: 5_000 });

    // Verificar presencia de los 3 tipos especiales
    await expect(page.locator('[data-testid="shift-btn-MF"]')).toBeVisible();
    await expect(page.locator('[data-testid="shift-btn-TF"]')).toBeVisible();
    await expect(page.locator('[data-testid="shift-btn-NF"]')).toBeVisible();

    // Cerrar modal
    await page.keyboard.press("Escape");
  } catch (e) {
    await screenshotOnFail(page, "CP-25");
    throw e;
  }
});

// ─── CP-26 — Generación automática del cuadrante ─────────────────────────────
test("CP-26 — Admin puede generar el cuadrante automáticamente", async ({ page }) => {
  try {
    await loginAsAdmin(page);
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // Ir a Octubre 2026 (5 nexts, seguro sin datos al inicio del sprint)
    for (let i = 0; i < 5; i++) {
      await page.locator('[data-testid="btn-next-month"]').click();
      await page.waitForTimeout(600);
    }
    await page.waitForTimeout(1_000);

    // Pulsar "Generar cuadrante" (funciona tanto si está vacío como si ya tiene datos)
    await page.locator('[data-testid="btn-generate"]').click();

    // El grid debe mostrar la tabla con empleados
    await expect(page.locator("table")).toBeVisible({ timeout: 12_000 });
    const rows = page.locator("table tbody tr");
    expect(await rows.count()).toBeGreaterThan(0);
  } catch (e) {
    await screenshotOnFail(page, "CP-26");
    throw e;
  }
});

// ─── CP-27 — La generación no sobreescribe turnos manuales ───────────────────
test("CP-27 — La generación respeta los turnos manuales", async ({ page }) => {
  try {
    await loginAsAdmin(page);
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // Ir a Septiembre 2026 (4 nexts desde Mayo)
    for (let i = 0; i < 4; i++) {
      await page.locator('[data-testid="btn-next-month"]').click();
      await page.waitForTimeout(600);
    }

    // Generar primero para que haya tabla con celdas
    await page.locator('[data-testid="btn-generate"]').click();
    await expect(page.locator("table")).toBeVisible({ timeout: 12_000 });
    await page.waitForTimeout(1_000);

    // Asignar manualmente turno V (vacaciones) en día 1 del primer empleado
    const targetCell = page.locator("table tbody tr").first().locator("td").nth(1);
    await targetCell.click();
    await expect(page.locator('[data-testid="shift-editor"]')).toBeVisible({ timeout: 5_000 });
    await page.locator('[data-testid="shift-btn-V"]').click();
    await expect(page.locator('[data-testid="shift-editor"]')).not.toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(500);

    // Generar de nuevo
    await page.locator('[data-testid="btn-generate"]').click();
    await page.waitForTimeout(2_000);
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // La celda día 1 primer empleado debe seguir siendo V
    await expect(
      page.locator("table tbody tr").first().locator("td").nth(1).locator('[data-testid="shift-cell-V"]')
    ).toBeVisible({ timeout: 5_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-27");
    throw e;
  }
});

// ─── CP-28 — Botón Imprimir existe y es clicable ────────────────────────────
test("CP-28 — Botón Imprimir está disponible en el cuadrante", async ({ page }) => {
  try {
    await loginAsAdmin(page);
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // El botón Imprimir debe estar visible
    const printBtn = page.locator('[data-testid="btn-print"]');
    await expect(printBtn).toBeVisible({ timeout: 5_000 });

    // Interceptamos window.print para verificar que se llama (sin abrir diálogo real)
    await page.evaluate(() => {
      (window as unknown as { _printCalled: boolean })._printCalled = false;
      window.print = () => { (window as unknown as { _printCalled: boolean })._printCalled = true; };
    });
    await printBtn.click();
    const printCalled = await page.evaluate(() => (window as unknown as { _printCalled: boolean })._printCalled);
    expect(printCalled).toBe(true);
  } catch (e) {
    await screenshotOnFail(page, "CP-28");
    throw e;
  }
});
