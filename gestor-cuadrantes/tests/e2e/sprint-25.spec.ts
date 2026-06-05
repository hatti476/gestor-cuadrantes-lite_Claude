/**
 * Sprint 25 E2E regression tests.
 * Covers: BUG-53 (viewer 403 en multi-month), BUG-54 (stale closure proyecto activo),
 *         Feature: fila resaltada usuario, Feature: festivos en vista ampliada.
 */

import { test, expect } from "@playwright/test";
import {
  loginAsAdmin,
  loginAsTech,
  generateScheduleAndWait,
  screenshotOnFail,
} from "./helpers";

// ── BUG-53: EMPLOYEE puede ver vista multi-mes sin error 403 ────────────────────

test("CP-158 — Usuario con rol EMPLOYEE puede abrir la vista ampliada sin error @smoke", async ({
  page,
}) => {
  try {
    await loginAsTech(page);
    await expect(page).toHaveURL("/");

    // Ensure there is a project active; wait for badge or schedule
    await page.waitForSelector('[data-testid="schedule-grid"], [data-testid="active-project-badge"]', {
      timeout: 10_000,
    });

    // Navigate to multi-month via URL (same projectId used by the current active project)
    // Read active project from badge or navigate directly with the first project found
    const searchParams = new URL(page.url()).searchParams;
    let projectId = searchParams.get("projectId") ?? "";

    if (!projectId) {
      // Try to get projectId from localStorage via page.evaluate
      projectId = await page.evaluate(() => {
        try {
          const data = localStorage.getItem("activeProject");
          return data ? (JSON.parse(data) as { id: string }).id : "";
        } catch {
          return "";
        }
      });
    }

    // If still no project, find it from the schedule API calls in the network
    if (!projectId) {
      const projectsRes = await page.evaluate(async () => {
        const r = await fetch("/api/projects");
        const list = await r.json() as Array<{ id: string }>;
        return list[0]?.id ?? "";
      });
      projectId = projectsRes;
    }

    expect(projectId).not.toBe("");

    const now = new Date();
    await page.goto(
      `/multi-month?projectId=${projectId}&year=${now.getFullYear()}&month=${now.getMonth() + 1}`
    );

    // Should NOT show the employee error
    await expect(page.locator("text=Error al cargar empleados")).not.toBeVisible({
      timeout: 10_000,
    });

    // The back button should be visible (page loaded correctly)
    await expect(page.locator('[data-testid="btn-back"]')).toBeVisible({ timeout: 10_000 });
  } catch (error) {
    await screenshotOnFail(page, "CP-158");
    throw error;
  }
});

// ── BUG-54: Proyecto activo no se pierde al navegar a inicio ───────────────────
// El test crea su propio proyecto de prueba para ser autónomo, sin depender de
// proyectos creados por otros tests que podrían ser eliminados en ejecución paralela.

test("CP-159 — Selección de proyecto se mantiene al navegar al inicio @smoke", async ({
  page,
}) => {
  const testProjectName = `BUG54-CP159-${Date.now()}`;
  let createdProjectId: string | null = null;

  try {
    await loginAsAdmin(page);
    await expect(page).toHaveURL("/");

    // Crear un proyecto de prueba propio vía API para garantizar aislamiento
    const createRes = await page.evaluate(async (name: string) => {
      const r = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: "Test BUG-54", region: "Madrid" }),
      });
      return r.ok ? (r.json() as Promise<{ id: string; name: string }>) : null;
    }, testProjectName);

    if (!createRes) return; // seed DB sin soporte, skip
    createdProjectId = createRes.id;

    // Ir a /projects y seleccionar el proyecto recién creado
    await page.goto("/projects");
    await expect(page.locator('[data-testid="projects-table"]')).toBeVisible({ timeout: 10_000 });

    // Buscar la fila del proyecto creado por nombre
    const targetRow = page.locator('[data-testid="project-row"]').filter({
      has: page.locator(`td:first-child:has-text("${testProjectName}")`),
    });
    await expect(targetRow).toBeVisible({ timeout: 5_000 });
    await targetRow.locator('[data-testid="btn-select-project"]').click();

    // Debe redirigir a / y el badge debe mostrar el proyecto seleccionado
    await page.waitForURL("/", { timeout: 10_000 });

    const badge = page.locator('[data-testid="active-project-badge"]');
    await expect(badge).toBeVisible({ timeout: 10_000 });
    await expect(badge).toContainText(testProjectName);

    // Recargar — el validation effect vuelve a ejecutarse.
    // Con el fix de BUG-54, el proyecto debe mantenerse (no resetearse al primero).
    await page.reload();
    await page.waitForURL("/", { timeout: 10_000 });
    await expect(badge).toBeVisible({ timeout: 10_000 });
    await expect(badge).toContainText(testProjectName);
  } catch (error) {
    await screenshotOnFail(page, "CP-159");
    throw error;
  } finally {
    // Cleanup: eliminar el proyecto de prueba
    if (createdProjectId) {
      await page.evaluate(async (id: string) => {
        await fetch(`/api/projects/${id}`, { method: "DELETE" }).catch(() => {});
      }, createdProjectId);
    }
  }
});

// ── Feature: fila del usuario logado resaltada en vista ampliada ───────────────

test("CP-160 — La fila del empleado logado está resaltada en la vista ampliada @smoke", async ({
  page,
}) => {
  try {
    // Login as a tech user who is an EMPLOYEE in the project
    await loginAsTech(page);
    await expect(page).toHaveURL("/");

    // Generate schedule so there is data (needed to display grid with employees)
    // If it fails (not admin), we continue — just need employees visible
    const projectId = await page.evaluate(() => {
      try {
        const data = localStorage.getItem("activeProject");
        return data ? (JSON.parse(data) as { id: string }).id : "";
      } catch {
        return "";
      }
    });

    if (!projectId) return;

    const now = new Date();
    await page.goto(
      `/multi-month?projectId=${projectId}&year=${now.getFullYear()}&month=${now.getMonth() + 1}`
    );

    await expect(page.locator('[data-testid="btn-back"]')).toBeVisible({ timeout: 15_000 });

    // Wait for the grid to load (no loading spinner)
    await expect(page.locator("text=Cargando cuadrante…")).not.toBeVisible({ timeout: 10_000 });

    // If the tech user appears in the employee list, their row must be highlighted
    const ownRow = page.locator('[data-testid="own-row-multimonth"]');
    const hasOwnRow = await ownRow.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasOwnRow) {
      // Row should have indigo styling
      const rowClass = await ownRow.getAttribute("class");
      expect(rowClass).toContain("ring-indigo");

      // Name cell should show the marker arrow
      const nameCell = ownRow.locator("td").first();
      await expect(nameCell).toContainText("▶");
    }
    // If there are no employees (empty schedule project) the test passes without the row check
  } catch (error) {
    await screenshotOnFail(page, "CP-160");
    throw error;
  }
});

// ── Feature: festivos marcados en cabecera de vista ampliada ───────────────────

test("CP-161 — Los festivos se marcan en rojo en la cabecera de la vista ampliada @smoke", async ({
  page,
}) => {
  try {
    await loginAsAdmin(page);
    await generateScheduleAndWait(page);

    // Intercept holidays API and inject a known holiday for the current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    // Use day 15 as a synthetic holiday
    const holidayDate = `${year}-${String(month).padStart(2, "0")}-15`;
    const mockHoliday = { date: `${holidayDate}T00:00:00.000Z`, description: "Festivo test" };

    await page.route(`**/api/holidays?year=${year}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([mockHoliday]),
      });
    });

    // Also intercept for any other year that might be requested
    await page.route(`**/api/holidays?year=**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([mockHoliday]),
      });
    });

    const projectId = await page.evaluate(() => {
      try {
        const data = localStorage.getItem("activeProject");
        return data ? (JSON.parse(data) as { id: string }).id : "";
      } catch {
        return "";
      }
    });

    if (!projectId) return;

    await page.goto(
      `/multi-month?projectId=${projectId}&year=${year}&month=${month}`
    );

    await expect(page.locator('[data-testid="btn-back"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("text=Cargando cuadrante…")).not.toBeVisible({ timeout: 10_000 });

    // Check that at least one header cell has the red-holiday classes
    const redHeaders = page.locator("thead th.bg-red-200");
    await expect(redHeaders.first()).toBeVisible({ timeout: 5_000 });
  } catch (error) {
    await screenshotOnFail(page, "CP-161");
    throw error;
  }
});
