import { test, expect, Page } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

// Cada test crea su propio usuario desechable y borra solo ese: nunca toca los
// usuarios sembrados que usan otros specs (SPEC-010 H-04).
const PASSWORD = "Borrar1234!";

async function createDisposableViewer(page: Page): Promise<{ id: string; email: string }> {
  const email = `borrar-${Date.now()}-${Math.floor(Math.random() * 1e6)}@cuadrantes.test`;
  const res = await page.request.post("/api/admin/users", {
    data: { email, password: PASSWORD, globalRole: "VIEWER" },
  });
  expect(res.status()).toBe(201);
  const user: { id: string } = await res.json();
  return { id: user.id, email };
}

async function openAdmin(page: Page): Promise<void> {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe("@smoke Admin Users - DELETE (Bug 3)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("@smoke AC-19: ADMIN ve botón 'Eliminar' en las filas de usuario", async ({ page }) => {
    const user = await createDisposableViewer(page);
    await openAdmin(page);

    await expect(page.locator(`[data-testid="btn-delete-user-${user.id}"]`)).toBeVisible();
  });

  test("@smoke AC-20: Click Eliminar → modal confirmación → borra usuario", async ({ page }) => {
    const user = await createDisposableViewer(page);
    await openAdmin(page);

    await page.click(`[data-testid="btn-delete-user-${user.id}"]`);
    const modal = page.locator('[data-testid="delete-user-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(user.email);

    await page.click('[data-testid="btn-confirm-delete-user"]');
    await expect(modal).toBeHidden();
    await expect(page.locator(`[data-testid="btn-delete-user-${user.id}"]`)).toHaveCount(0);
  });

  test("@smoke AC-21: Usuario eliminado no aparece en lista ni puede loguearse", async ({ page }) => {
    const user = await createDisposableViewer(page);
    await openAdmin(page);

    await page.click(`[data-testid="btn-delete-user-${user.id}"]`);
    await page.click('[data-testid="btn-confirm-delete-user"]');
    await expect(page.locator("td", { hasText: user.email })).toHaveCount(0);

    // Login con sus credenciales correctas ya no funciona
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Contraseña").fill(PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Email o contraseña incorrectos")).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
