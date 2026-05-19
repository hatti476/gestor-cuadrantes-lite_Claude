/**
 * Sprint 6 — E2E: Multiproyecto y roles
 *
 * CP-43 — Admin (SUPER_ADMIN) ve badge "SUPER_ADMIN" en el header
 * CP-44 — Técnico (USER) ve badge "USER" en el header
 * CP-45 — SUPER_ADMIN puede crear un empleado con rol USER
 * CP-46 — SUPER_ADMIN puede crear un empleado con rol SUPER_ADMIN
 */

import { test, expect } from "@playwright/test";
import { USERS } from "./config";
import { login, screenshotOnFail } from "./helpers";

const { admin: ADMIN, tech: TECH } = USERS;

// ===========================================================================
// CP-43 — SUPER_ADMIN ve su badge con texto "SUPER_ADMIN"
// ===========================================================================
test("CP-43 — SUPER_ADMIN ve badge SUPER_ADMIN en header", async ({ page }) => {
  try {
    await login(page, ADMIN.email, ADMIN.password);

    await expect(page).toHaveURL("/");
    // El badge del header muestra el rol directamente como texto
    await expect(
      page.locator("header span").filter({ hasText: /^SUPER_ADMIN$/ })
    ).toBeVisible();
  } catch (e) {
    await screenshotOnFail(page, "CP-43");
    throw e;
  }
});

// ===========================================================================
// CP-44 — USER ve su badge con texto "USER"
// ===========================================================================
test("CP-44 — USER ve badge USER en header", async ({ page }) => {
  try {
    await login(page, TECH.email, TECH.password);

    await expect(page).toHaveURL("/");
    await expect(
      page.locator("header span").filter({ hasText: /^USER$/ })
    ).toBeVisible();
  } catch (e) {
    await screenshotOnFail(page, "CP-44");
    throw e;
  }
});

// ===========================================================================
// CP-45 — SUPER_ADMIN puede crear empleado con rol USER
// ===========================================================================
test("CP-45 — SUPER_ADMIN crea empleado con rol USER", async ({ page }) => {
  const ts = Date.now();
  const email = `sprint6-user-${ts}@cuadrantes.local`;
  const name = `Técnico Sprint6 ${ts}`;

  try {
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto("/employees");
    await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });

    await page.locator("button").filter({ hasText: /Nuevo empleado|Añadir|Crear/i }).click();
    await expect(page.locator("input#emp-name")).toBeVisible({ timeout: 5_000 });

    await page.fill("input#emp-name", name);
    await page.fill("input#emp-email", email);
    await page.fill("input#emp-password", "Sprint6User1!");

    await page.selectOption("select#emp-role", "USER");
    await expect(page.locator("select#emp-role")).toHaveValue("USER");

    await page.locator('button[type="submit"]').click();

    await expect(page.locator(`text=${name}`)).toBeVisible({ timeout: 8_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-45");
    throw e;
  }
});

// ===========================================================================
// CP-46 — SUPER_ADMIN puede crear empleado con rol SUPER_ADMIN
// ===========================================================================
test("CP-46 — SUPER_ADMIN crea empleado con rol SUPER_ADMIN", async ({ page }) => {
  const ts = Date.now();
  const email = `sprint6-sa-${ts}@cuadrantes.local`;
  const name = `Admin Sprint6 ${ts}`;

  try {
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto("/employees");
    await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });

    await page.locator("button").filter({ hasText: /Nuevo empleado|Añadir|Crear/i }).click();
    await expect(page.locator("input#emp-name")).toBeVisible({ timeout: 5_000 });

    await page.fill("input#emp-name", name);
    await page.fill("input#emp-email", email);
    await page.fill("input#emp-password", "Sprint6SA1!");

    await page.selectOption("select#emp-role", "SUPER_ADMIN");
    await expect(page.locator("select#emp-role")).toHaveValue("SUPER_ADMIN");

    await page.locator('button[type="submit"]').click();

    await expect(page.locator(`text=${name}`)).toBeVisible({ timeout: 8_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-46");
    throw e;
  }
});
