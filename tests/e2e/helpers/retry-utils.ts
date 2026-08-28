/**
 * @module retry-utils
 * @description Utilidades de reintento para E2E.
 */

import type { Page } from "@playwright/test";

export async function retryClick(
  page: Page,
  selector: string,
  options?: { maxRetries?: number; delay?: number }
): Promise<void> {
  const maxRetries = options?.maxRetries ?? 3;
  const delay = options?.delay ?? 200;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await page.locator(selector).click({ timeout: 3000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await page.waitForTimeout(delay);
      }
    }
  }

  throw lastError;
}

export async function retryExpect(
  assertion: () => Promise<void>,
  options?: { maxRetries?: number; delay?: number }
): Promise<void> {
  const maxRetries = options?.maxRetries ?? 3;
  const delay = options?.delay ?? 200;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await assertion();
      return;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
