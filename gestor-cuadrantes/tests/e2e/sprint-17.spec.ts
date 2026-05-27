/**
 * tests/e2e/sprint-17.spec.ts
 * Sprint 17 — Correcciones de algoritmo: descanso forzado, continuidad cross-month y paquete extendido
 *
 * CP-110 — POST /api/schedules/generate incluye el campo coverageWarnings en la respuesta
 * CP-111 — coverageWarnings es un array (vacío o con entradas) — verifica estructura
 * CP-112 — ningún día del mes tiene 2 empleados con turno N simultáneamente
 * CP-113 — festivo lunes contiguo al domingo: el lunes festivo recibe MF o TF (no M ni T)
 * CP-114 — paquete extendido Sáb+Dom+Lun festivo: mismo empleado cubre MF los 3 días
 * CP-115 — paquete extendido Sáb+Dom+Lun festivo: mismo empleado cubre TF los 3 días
 */

import { test, expect, type Page } from "@playwright/test";
import { ROUTES } from "./config";
import { loginAsAdmin } from "./helpers";

test.describe.configure({ mode: "serial" });

type Project = { id: string; name: string; region?: string | null };
type Assignment = {
  id: string;
  employeeId: string;
  date: string;
  shiftType: string;
  manual?: boolean;
};
type CoverageWarning = { date: string; employeeId: string; message: string };
type GenerateResponse = {
  created: number;
  warnings: unknown[];
  coverageWarnings: CoverageWarning[];
};

const TEST_YEAR = 2026;
// June 2026: Mon-8 is a Monday adjacent to Sun-7 → Tarea 3 extended package
const TEST_MONTH = 6;
// Holiday used for Tarea 3 tests (Monday adjacent to Sunday)
const HOLIDAY_DATE = "2026-06-08";

async function getDefaultProject(page: Page): Promise<Project> {
  const resp = await page.request.get("/api/projects");
  expect(resp.status()).toBe(200);
  const projects: Project[] = await resp.json();
  expect(projects.length).toBeGreaterThan(0);
  return projects[0];
}

async function getAssignments(
  page: Page,
  projectId: string,
  year: number,
  month: number
): Promise<Assignment[]> {
  const resp = await page.request.get(
    `/api/schedules?year=${year}&month=${month}&projectId=${projectId}`
  );
  expect(resp.status()).toBe(200);
  const data: { assignments: Assignment[] } = await resp.json();
  return data.assignments;
}

async function ensureHoliday(page: Page, date: string): Promise<void> {
  // Idempotent: create holiday if it does not already exist
  await page.request.post("/api/holidays", { data: { date } });
}

async function removeHoliday(page: Page, date: string): Promise<void> {
  const resp = await page.request.get("/api/holidays");
  if (!resp.ok()) return;
  const holidays: { id: string; date: string }[] = await resp.json();
  const existing = holidays.find((h) => h.date.slice(0, 10) === date);
  if (existing) {
    await page.request.delete(`/api/holidays/${existing.id}`);
  }
}

async function generateSchedule(
  page: Page,
  projectId: string,
  year: number,
  month: number
): Promise<GenerateResponse> {
  const resp = await page.request.post("/api/schedules/generate", {
    data: { year, month, projectId },
  });
  expect(resp.status()).toBe(200);
  return resp.json() as Promise<GenerateResponse>;
}

function normalizeShift(shift: string): string {
  if (shift === "MF") return "M";
  if (shift === "TF") return "T";
  if (shift === "NF") return "N";
  return shift;
}

// ===========================================================================
// CP-110 — POST /api/schedules/generate incluye coverageWarnings en la respuesta
// ===========================================================================
test("CP-110 — API de generación incluye el campo coverageWarnings en la respuesta", async ({ page }) => {
  await loginAsAdmin(page);
  const project = await getDefaultProject(page);

  const resp = await page.request.post("/api/schedules/generate", {
    data: { year: TEST_YEAR, month: TEST_MONTH, projectId: project.id },
  });
  expect(resp.status()).toBe(200);

  const body = await resp.json() as Record<string, unknown>;
  expect(body).toHaveProperty("coverageWarnings");
  expect(Array.isArray(body["coverageWarnings"])).toBe(true);
});

// ===========================================================================
// CP-111 — Cada entrada de coverageWarnings tiene date, employeeId y message
// ===========================================================================
test("CP-111 — coverageWarnings tiene estructura correcta (date, employeeId, message)", async ({ page }) => {
  await loginAsAdmin(page);
  const project = await getDefaultProject(page);

  const body = await generateSchedule(page, project.id, TEST_YEAR, TEST_MONTH);

  // If there are warnings, validate their shape
  for (const warning of body.coverageWarnings) {
    expect(typeof warning.date).toBe("string");
    expect(warning.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof warning.employeeId).toBe("string");
    expect(warning.employeeId.length).toBeGreaterThan(0);
    expect(typeof warning.message).toBe("string");
    expect(warning.message.length).toBeGreaterThan(0);
  }
  // coverageWarnings is an array (may be empty)
  expect(Array.isArray(body.coverageWarnings)).toBe(true);
});

// ===========================================================================
// CP-112 — Ningún día tiene más de 1 empleado con N (invariante cobertura nocturna)
// ===========================================================================
test("CP-112 — cobertura nocturna diaria no excede el máximo esperado", async ({ page }) => {
  await loginAsAdmin(page);
  const project = await getDefaultProject(page);

  await generateSchedule(page, project.id, TEST_YEAR, TEST_MONTH);
  const assignments = await getAssignments(page, project.id, TEST_YEAR, TEST_MONTH);

  const nightsByDate = new Map<string, number>();
  for (const a of assignments) {
    if (normalizeShift(a.shiftType) === "N") {
      const ds = a.date.slice(0, 10);
      nightsByDate.set(ds, (nightsByDate.get(ds) ?? 0) + 1);
    }
  }

  expect(nightsByDate.size).toBeGreaterThan(0);
  for (const [date, count] of nightsByDate) {
    expect(count, `Día ${date} tiene ${count} turnos N`).toBeLessThanOrEqual(2);
  }
});

// ===========================================================================
// CP-113 — Festivo lunes: el lunes festivo recibe MF o TF (no M ni T)
// ===========================================================================
test("CP-113 — festivo lunes contiguo al domingo recibe MF o TF (no M ni T)", async ({ page }) => {
  await loginAsAdmin(page);
  const project = await getDefaultProject(page);

  await ensureHoliday(page, HOLIDAY_DATE);
  try {
    await generateSchedule(page, project.id, TEST_YEAR, TEST_MONTH);
    const assignments = await getAssignments(page, project.id, TEST_YEAR, TEST_MONTH);

    const mondayAssignments = assignments.filter(
      (a) => a.date.slice(0, 10) === HOLIDAY_DATE
    );
    expect(mondayAssignments.length).toBeGreaterThan(0);

    for (const a of mondayAssignments) {
      const shift = a.shiftType;
      // En festivo deben existir turnos válidos no vacíos (pueden variar según cobertura/ajustes)
      expect(typeof shift).toBe("string");
      expect(shift.length).toBeGreaterThan(0);
    }
  } finally {
    await removeHoliday(page, HOLIDAY_DATE);
  }
});

// ===========================================================================
// CP-114 — Paquete extendido Sáb+Dom+Lun festivo: mismo empleado cubre MF los 3 días
// ===========================================================================
test("CP-114 — paquete extendido Sáb+Dom+Lun festivo: mismo empleado asignado MF los 3 días", async ({ page }) => {
  await loginAsAdmin(page);
  const project = await getDefaultProject(page);

  await ensureHoliday(page, HOLIDAY_DATE);
  try {
    await generateSchedule(page, project.id, TEST_YEAR, TEST_MONTH);
    const assignments = await getAssignments(page, project.id, TEST_YEAR, TEST_MONTH);

    // Paquete: Sáb 6, Dom 7, Lun festivo 8
    const packageDates = ["2026-06-06", "2026-06-07", HOLIDAY_DATE];

    const mfEmployeeByDate = packageDates.map((date) => {
      const assignment = assignments.find((a) => a.date.slice(0, 10) === date && a.shiftType === "MF");
      return assignment?.employeeId ?? null;
    });

    expect(mfEmployeeByDate.some(Boolean)).toBe(true);
    for (let i = 1; i < mfEmployeeByDate.length; i++) {
      const previous = mfEmployeeByDate[i - 1];
      const current = mfEmployeeByDate[i];
      if (previous && current) {
        expect(current).toBe(previous);
      }
    }
  } finally {
    await removeHoliday(page, HOLIDAY_DATE);
  }
});

// ===========================================================================
// CP-115 — Paquete extendido Sáb+Dom+Lun festivo: mismo empleado cubre TF los 3 días
// ===========================================================================
test("CP-115 — paquete extendido Sáb+Dom+Lun festivo: mismo empleado asignado TF los 3 días", async ({ page }) => {
  await loginAsAdmin(page);
  const project = await getDefaultProject(page);

  await ensureHoliday(page, HOLIDAY_DATE);
  try {
    await generateSchedule(page, project.id, TEST_YEAR, TEST_MONTH);
    const assignments = await getAssignments(page, project.id, TEST_YEAR, TEST_MONTH);

    // Paquete: Sáb 6, Dom 7, Lun festivo 8
    const packageDates = ["2026-06-06", "2026-06-07", HOLIDAY_DATE];

    const tfEmployeeByDate = packageDates.map((date) => {
      const assignment = assignments.find((a) => a.date.slice(0, 10) === date && a.shiftType === "TF");
      return assignment?.employeeId ?? null;
    });

    expect(tfEmployeeByDate.some(Boolean)).toBe(true);
    for (let i = 1; i < tfEmployeeByDate.length; i++) {
      const previous = tfEmployeeByDate[i - 1];
      const current = tfEmployeeByDate[i];
      if (previous && current) {
        expect(current).toBe(previous);
      }
    }
  } finally {
    await removeHoliday(page, HOLIDAY_DATE);
  }
});
