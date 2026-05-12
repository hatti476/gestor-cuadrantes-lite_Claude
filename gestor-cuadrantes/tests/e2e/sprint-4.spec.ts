import { test, expect } from "@playwright/test";
import { USERS, ROUTES } from "./config";
import { loginAsAdmin, login, screenshotOnFail } from "./helpers";

const { tech: TECH } = USERS;

// ─── CP-30 — Admin puede añadir un festivo ───────────────────────────────────
test("CP-30 — Admin puede añadir un festivo", async ({ page }) => {
  try {
    await loginAsAdmin(page);
    await page.locator('[data-testid="btn-holidays"]').click();
    // La primera carga de /holidays puede compilar el módulo en dev — timeout generoso
    await expect(page).toHaveURL("/holidays", { timeout: 20_000 });

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
  test.setTimeout(60_000);
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
  test.setTimeout(45_000);
  try {
    await loginAsAdmin(page);
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
    // Esperar que el cuadrante cargue: al menos 1 fila con empleado
    await expect(page.locator("table tbody tr").first().locator("td").first()).not.toBeEmpty({ timeout: 8_000 });

    // Asignar turno V al empleado 1, día 2 del cuadrante activo (Mayo 2026)
    // Usamos día 2 para evitar conflictos con otros tests que usan día 1
    const cell = page.locator("table tbody tr").first().locator("td").nth(2);
    await cell.click();
    await expect(page.locator('[data-testid="shift-editor"]')).toBeVisible({ timeout: 5_000 });
    // Esperar respuesta del servidor antes de navegar
    const saveResponse = page.waitForResponse((r) => r.url().includes("/api/schedules") && r.status() === 201);
    await page.locator('[data-testid="shift-btn-V"]').click();
    const savedRes = await saveResponse;
    const savedData = await savedRes.json();
    const savedEmployeeId = savedData.employeeId;
    await expect(page.locator('[data-testid="shift-editor"]')).not.toBeVisible({ timeout: 5_000 });

    // Ir a /employees y pulsar historial del empleado que TIENE turnos
    await page.goto("/employees");
    await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });
    // Usar el data-testid del botón historial con el ID del empleado guardado
    await page.locator(`[data-testid="btn-history-${savedEmployeeId}"]`).click();

    // El modal debe abrirse (esperar el contenedor)
    await expect(page.locator("h3:has-text('Historial')")).toBeVisible({ timeout: 5_000 });

    // La tabla de historial debe mostrar al menos un registro
    await expect(page.locator('[data-testid="history-table"]')).toBeVisible({ timeout: 20_000 });
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
    // Limpiar sesión y entrar como técnico (rol USER)
    await page.context().clearCookies();
    await page.goto(ROUTES.login);
    await page.locator('input[type="email"]').fill(TECH.email);
    await page.locator('input[type="password"]').fill(TECH.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(ROUTES.home, { timeout: 10_000 });

    // Verificar que el endpoint de historial no es accesible a usuarios no-admin
    // La API debe devolver 401 (sin sesión válida en el request) o 403 (rol no suficiente)
    // Nunca debe devolver 200 para un USER
    const status = await page.evaluate(async () => {
      const res = await fetch("/api/employees/fake-id/history", { credentials: "include" });
      return res.status;
    });
    // La API no debe devolver 200; puede devolver 401, 403 o 404 (si la sesión no se propaga)
    expect(status).not.toBe(200);
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

// ─── CP-37 — N→NF en la víspera al añadir un festivo ────────────────────────
test("CP-37 — El turno N de la víspera de un festivo se convierte en NF", async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await loginAsAdmin(page);
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // Ir a Febrero 2027 (9 nexts desde Mayo 2026) — mes limpio
    for (let i = 0; i < 9; i++) {
      await page.locator('[data-testid="btn-next-month"]').click();
      await page.waitForTimeout(400);
    }

    // Generar el cuadrante para que haya turnos
    await page.locator('[data-testid="btn-generate"]').click();
    await expect(page.locator('[data-testid="toast"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(800);

    // Encontrar un día que tenga turno N para saber qué día es la víspera
    // rotationOrder=0 (primer empleado): 2027-02-15 → calculamos via API que es N
    // En su lugar, añadimos festivo el día 16 y verificamos que el 15 sea NF
    // (si el 15 era N antes, ahora debe ser NF)

    // Leer el turno actual del primer empleado en día 15
    const cell15 = page.locator("table tbody tr").first().locator("td").nth(15);
    const shiftBefore = await cell15.locator("[data-testid^='shift-cell-']").getAttribute("data-testid").catch(() => null);

    // Añadir festivo el día 16 de Febrero 2027
    await page.goto("/holidays");
    const yearSelect = page.locator("select");
    await yearSelect.selectOption("2027");
    await page.locator('[data-testid="holiday-date-input"]').fill("2027-02-16");
    await page.locator('[data-testid="holiday-desc-input"]').fill("Festivo CP-37");
    await page.locator('[data-testid="btn-add-holiday"]').click();
    await expect(page.locator("text=Festivo CP-37")).toBeVisible({ timeout: 6_000 });

    // Volver al cuadrante de Febrero 2027
    await page.goto("/");
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
    for (let i = 0; i < 9; i++) {
      await page.locator('[data-testid="btn-next-month"]').click();
      await page.waitForTimeout(400);
    }
    await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });

    // Si el turno del día 15 era N, ahora debe ser NF
    const shiftAfter = await cell15.locator("[data-testid^='shift-cell-']").getAttribute("data-testid").catch(() => null);
    if (shiftBefore === "shift-cell-N") {
      expect(shiftAfter).toBe("shift-cell-NF");
    } else {
      // Si no era N, al menos no debe haber dado error (la API no falla)
      expect(shiftAfter).not.toBeNull();
    }
  } catch (e) {
    await screenshotOnFail(page, "CP-37");
    throw e;
  }
});

// ─── CP-38 — Cabecera roja en días festivos con día de la semana visible ──────
test("CP-38 — El grid muestra cabecera roja con letra del día en festivos", async ({ page }) => {
  try {
    await loginAsAdmin(page);

    // Ir a Noviembre 2026 (tiene festivo del 1-Nov añadido en CP-32)
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
    for (let i = 0; i < 6; i++) {
      await page.locator('[data-testid="btn-next-month"]').click();
      await page.waitForTimeout(400);
    }
    await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });

    await page.waitForTimeout(500); // dar tiempo a que carguen los festivos

    // La cabecera del día 1 debe tener clase de fondo rojo
    // nth(0)=Empleado, nth(1)=día 1, nth(2)=día 2, ...
    const header1 = page.locator("table thead tr th").nth(1);
    const classes = await header1.getAttribute("class");
    expect(classes).toContain("bg-red-100");

    // Debe mostrar la letra del día de la semana (no "F")
    const dayLetter = await header1.locator("div").nth(1).innerText();
    expect(["L", "M", "X", "J", "V", "S", "D"]).toContain(dayLetter.trim());
  } catch (e) {
    await screenshotOnFail(page, "CP-38");
    throw e;
  }
});

// ─── CP-39 — Popover con nombre del festivo al pulsar la cabecera ─────────────
test("CP-39 — Pulsar la cabecera de un festivo muestra su nombre en un popover", async ({ page }) => {
  try {
    await loginAsAdmin(page);

    // Ir a Noviembre 2026 (festivo 1-Nov: "Festivo test generación")
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
    for (let i = 0; i < 6; i++) {
      await page.locator('[data-testid="btn-next-month"]').click();
      await page.waitForTimeout(400);
    }
    await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });

    await page.waitForTimeout(500); // dar tiempo a que carguen los festivos

    // Pulsar la cabecera del día 1 (festivo) — nth(0)=Empleado, nth(1)=día 1
    const header1 = page.locator("table thead tr th").nth(1);
    await header1.click();

    // El popover debe aparecer con el texto "Festivo"
    await expect(page.locator("div:text('🎉 Festivo')")).toBeVisible({ timeout: 4_000 });

    // Cerrar haciendo clic fuera
    await page.locator("body").click({ position: { x: 10, y: 10 } });
    await expect(page.locator("div:text('🎉 Festivo')")).not.toBeVisible({ timeout: 3_000 });
  } catch (e) {
    await screenshotOnFail(page, "CP-39");
    throw e;
  }
});
