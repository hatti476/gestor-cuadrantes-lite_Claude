/**
 * Helpers compartidos para todos los tests E2E.
 * Importar desde aquí — no duplicar en cada spec.
 */

import { Page } from "@playwright/test";
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
  await page.waitForURL(ROUTES.home, { timeout: 10_000 });
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
