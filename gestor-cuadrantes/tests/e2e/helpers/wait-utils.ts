/**
 * @module wait-utils
 * @description Utilidades de espera deterministas para E2E.
 */

import { expect, type Page } from "@playwright/test";

export async function waitForScheduleGrid(page: Page): Promise<void> {
  const grid = page.locator('[data-testid="schedule-grid"]');
  await expect(grid).toBeVisible({ timeout: 15000 });
  await expect(grid.locator('[data-testid^="cell-"]').first()).toBeVisible({ timeout: 15000 });
}

export async function waitForGenerationComplete(page: Page): Promise<void> {
  const timeout = 15000;
  await Promise.race([
    page.waitForResponse(
      (r) => r.url().includes('/api/schedules/generate') && r.status() === 200,
      { timeout }
    ).catch(() => undefined),
    page.locator('[data-testid="toast"]').filter({ hasText: /generad|actualizado|guardado/i }).first().waitFor({ state: 'visible', timeout }).catch(() => undefined),
    page.locator('text=Generado').first().waitFor({ state: 'visible', timeout }).catch(() => undefined),
  ]);
  await waitForScheduleGrid(page);
}

export async function waitForToast(
  page: Page,
  text: string,
  options?: { timeout?: number }
): Promise<void> {
  const toast = text
    ? page.locator('[data-testid="toast"]').filter({ hasText: text }).first()
    : page.locator('[data-testid="toast"]').first();
  await expect(toast).toBeVisible({ timeout: options?.timeout ?? 10000 });
}

export async function waitForModalClose(page: Page): Promise<void> {
  const modalCandidates = [
    page.locator('[data-testid="shift-editor"]'),
    page.locator('[data-testid="confirm-generate-modal"]'),
    page.locator('[role="dialog"]'),
  ];
  for (const modal of modalCandidates) {
    if (await modal.count()) {
      await expect(modal).toBeHidden({ timeout: 8000 }).catch(() => undefined);
    }
  }
}

export async function waitForTableRow(
  page: Page,
  testId: string,
  text: string
): Promise<void> {
  const row = page.locator(`[data-testid="${testId}"]`).filter({ hasText: text }).first();
  await expect(row).toBeVisible({ timeout: 10000 });
}
