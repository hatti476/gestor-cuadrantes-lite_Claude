/**
 * Helpers compartidos para todos los tests E2E.
 * Importar desde aquí — no duplicar en cada spec.
 */

import { expect, Page } from "@playwright/test";
import path from "path";
import fs from "fs";
import { USERS, ROUTES } from "./config";

/**
 * Realiza el login con las credenciales indicadas y espera la redirección a /.
 */
export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto(ROUTES.login);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => url.pathname !== ROUTES.login, { timeout: 20_000 });
}

/** Login rápido como SUPER_ADMIN. */
export async function loginAsAdmin(page: Page): Promise<void> {
  return login(page, USERS.admin.email, USERS.admin.password);
}

/** Login rápido como técnico (USER). */
export async function loginAsTech(page: Page): Promise<void> {
  return login(page, USERS.tech.email, USERS.tech.password);
}

/** Login rápido como project manager (PM). */
export async function loginAsPM(page: Page): Promise<void> {
  return login(page, USERS.pm.email, USERS.pm.password);
}

/** Login rápido como SUPER_VIEWER. */
export async function loginAsViewer(page: Page): Promise<void> {
  return login(page, USERS.viewer.email, USERS.viewer.password);
}

/**
 * Captura un screenshot al fallar un test.
 * Se guarda en tests/screenshots/<cpId>-fail.png
 */
export async function screenshotOnFail(page: Page, cpId: string): Promise<void> {
  const dir = path.join(process.cwd(), "tests/screenshots");
  fs.mkdirSync(dir, { recursive: true });
  try {
    await page.screenshot({
      path: path.join(dir, `${cpId}-fail.png`),
      fullPage: true,
    });
  } catch {
    // La página puede estar cerrada; ignoramos el error del screenshot.
  }
}

/** Open the PrepPanel generation step when the generate button is hidden. */
export async function openGenerateStep(page: Page): Promise<void> {
  const generateButton = page.locator('[data-testid="btn-generate"]');
  if (await generateButton.isVisible({ timeout: 500 }).catch(() => false)) return;

  const generateStep = page.locator('[data-testid="prep-step-generar"]');
  if (await generateStep.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await generateStep.click();
  }
  await expect(generateButton).toBeVisible({ timeout: 5_000 });
}

/** Generate the current month, confirming regeneration when needed. */
export async function generateScheduleAndWait(page: Page): Promise<void> {
  await openGenerateStep(page);

  const generateRes = page.waitForResponse(
    (r) => r.url().includes("/api/schedules/generate") && r.status() === 200,
    { timeout: 120_000 }
  );
  await page.locator('[data-testid="btn-generate"]').click();

  const confirmModal = page.locator('[data-testid="confirm-generate-modal"]');
  if (await confirmModal.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await page.locator('[data-testid="btn-confirm-generate"]').click();
  }

  await generateRes;
  await page
    .waitForResponse(
      (r) => r.url().includes("/api/schedules") && !r.url().includes("/generate") && r.status() === 200,
      { timeout: 30_000 }
    )
    .catch(() => undefined);
  await page.waitForTimeout(500);
}

/**
 * Open ShiftEditor by clicking an actually editable schedule cell.
 * Retries across multiple cells to avoid flaky clicks on locked/non-interactive cells.
 */
export async function openShiftEditorFromEditableCell(page: Page): Promise<void> {
  const editor = page.locator('[data-testid="shift-editor"]');
  if (await editor.isVisible({ timeout: 500 }).catch(() => false)) return;

  const cells = page.locator(
    'td[data-testid^="cell-"]:not([data-locked="true"]):not(:has([data-testid="shift-cell-V"])):not(:has([data-testid="shift-cell-B"]))'
  );
  const total = await cells.count();
  const limit = Math.min(total, 20);

  for (let i = 0; i < limit; i++) {
    const cell = cells.nth(i);
    if (!(await cell.isVisible().catch(() => false))) continue;
    await cell.scrollIntoViewIfNeeded().catch(() => undefined);
    await cell.click({ timeout: 5_000 }).catch(() => undefined);
    if (await editor.isVisible({ timeout: 1_500 }).catch(() => false)) return;
  }

  throw new Error("No se pudo abrir ShiftEditor desde celdas editables");
}
