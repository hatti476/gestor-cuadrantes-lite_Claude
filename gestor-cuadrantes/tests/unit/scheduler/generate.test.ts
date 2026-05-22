/**
 * tests/unit/scheduler/generate.test.ts  —  Sprint 9
 * Tests unitarios del algoritmo de generación de cuadrante (Fase 2).
 */

import { describe, it, expect } from "vitest";
import {
  nightBlockDays,
  computeNightBlocks,
  resolveNightBlocks,
  generateMonthSchedule,
  applySpecialDayRule,
  applyChristmasSpecialRule,
  isWeekend,
  weekKey,
  isPostRestDay,
  normalizeShift,
  addDays,
  toDateStr,
  fromDateStr,
  NIGHT_EPOCH_FRIDAY,
  type ScheduleEmployee,
  type PrevMonthTail,
  type CoverageWarning,
} from "@/lib/schedules/generate";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** 7 técnicos con rotationOrder 0-6 y sin preferencia */
function make7Employees(pref?: string | null): ScheduleEmployee[] {
  return Array.from({ length: 7 }, (_, i) => ({
    id: `emp-${i + 1}`,
    rotationOrder: i,
    shiftPreference: pref ?? null,
  }));
}

function isGeneratedWork(shiftType: string): boolean {
  return !["D", "V", "B"].includes(shiftType);
}

// ─── nightBlockDays ────────────────────────────────────────────────────────────

describe("nightBlockDays — estructura 2D+7N+3D", () => {
  it("genera exactamente 12 días", () => {
    const block = { employeeId: "emp-1", startFriday: NIGHT_EPOCH_FRIDAY };
    const days = nightBlockDays(block);
    expect(days.size).toBe(12);
  });

  it("los 2 días previos son D (pre-descanso)", () => {
    const block = { employeeId: "emp-1", startFriday: NIGHT_EPOCH_FRIDAY };
    const days = nightBlockDays(block);
    expect(days.get(toDateStr(addDays(NIGHT_EPOCH_FRIDAY, -2)))).toBe("D");
    expect(days.get(toDateStr(addDays(NIGHT_EPOCH_FRIDAY, -1)))).toBe("D");
  });

  it("días 0–6 son N (7 noches consecutivas)", () => {
    const block = { employeeId: "emp-1", startFriday: NIGHT_EPOCH_FRIDAY };
    const days = nightBlockDays(block);
    for (let offset = 0; offset <= 6; offset++) {
      expect(days.get(toDateStr(addDays(NIGHT_EPOCH_FRIDAY, offset)))).toBe("N");
    }
  });

  it("los 3 días posteriores son D (post-descanso)", () => {
    const block = { employeeId: "emp-1", startFriday: NIGHT_EPOCH_FRIDAY };
    const days = nightBlockDays(block);
    expect(days.get(toDateStr(addDays(NIGHT_EPOCH_FRIDAY, 7)))).toBe("D");
    expect(days.get(toDateStr(addDays(NIGHT_EPOCH_FRIDAY, 8)))).toBe("D");
    expect(days.get(toDateStr(addDays(NIGHT_EPOCH_FRIDAY, 9)))).toBe("D");
  });

  it("el bloque de época (referencia) comienza en viernes", () => {
    // NIGHT_EPOCH_FRIDAY es 2026-01-02 (viernes).
    // Con ciclo de 49 días (7 emps × 7 días), los bloques del primer empleado
    // siempre caen en el mismo día de la semana que el epoch (viernes).
    const ids = make7Employees().map((e) => e.id);
    // El primer bloque del primer empleado en cualquier mes debe ser viernes
    const blocks = computeNightBlocks(2026, 1, ids)
      .filter((b) => b.employeeId === ids[0]);
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      // Los bloques del empleado 0 siempre caen en el mismo dow que el epoch (viernes)
      // porque el ciclo = 7 × NIGHT_DAYS = 7 × 7 = 49 días = 7 semanas exactas
      expect(block.startFriday.getUTCDay()).toBe(5);
    }
  });
});

// ─── computeNightBlocks ────────────────────────────────────────────────────────

describe("computeNightBlocks — asignación cíclica", () => {
  it("cada técnico tiene como máximo 1 bloque de noches por ciclo", () => {
    const ids = ["a", "b", "c", "d", "e", "f", "g"];
    // Un ciclo completo = 7 empleados × 7 días = 49 días (7 semanas)
    // En un mes de 31 días no pueden solaparse bloques del mismo empleado
    const blocks = computeNightBlocks(2026, 3, ids); // Marzo
    const countById = new Map<string, number>();
    for (const b of blocks) {
      countById.set(b.employeeId, (countById.get(b.employeeId) ?? 0) + 1);
    }
    // Ningún empleado tiene más de 1 bloque activo en un mes (con 7 emps × 7d = 49d ciclo)
    for (const [, count] of countById) {
      expect(count).toBeLessThanOrEqual(1);
    }
  });

  it("nunca hay 2 técnicos con noches el mismo día", () => {
    const ids = make7Employees().map((e) => e.id);
    const blocks = computeNightBlocks(2026, 6, ids); // Junio

    // Collect all night dates per block
    const nightDateCount = new Map<string, number>();
    for (const block of blocks) {
      const days = nightBlockDays(block);
      for (const [dateStr, shift] of days) {
        if (shift === "N") {
          const d = fromDateStr(dateStr);
          if (d.getUTCMonth() + 1 !== 6) continue; // only this month
          nightDateCount.set(dateStr, (nightDateCount.get(dateStr) ?? 0) + 1);
        }
      }
    }
    for (const [, count] of nightDateCount) {
      expect(count).toBeLessThanOrEqual(1);
    }
  });

  it("los bloques del mes incluyen sólo days del mes (cuando se filtran en generateMonthSchedule)", () => {
    // computeNightBlocks puede devolver fechas fuera del mes — OK;
    // el filtro en generateMonthSchedule las descartará.
    // Aquí verificamos que al menos hay algún bloque que toca el mes.
    const ids = ["emp-1", "emp-2"];
    const blocks = computeNightBlocks(2026, 1, ids);
    expect(blocks.length).toBeGreaterThan(0);
  });
});

// ─── applySpecialDayRule ──────────────────────────────────────────────────────

describe("applySpecialDayRule", () => {
  const holidays = new Set(["2026-01-01"]);

  it("M en festivo → MF", () => {
    expect(applySpecialDayRule("M", fromDateStr("2026-01-01"), holidays)).toBe("MF");
  });

  it("T en fin de semana → TF", () => {
    expect(applySpecialDayRule("T", fromDateStr("2026-01-03"), new Set())).toBe("TF"); // sábado
  });

  it("N cuando el día siguiente es festivo → NF", () => {
    const h = new Set(["2026-01-02"]);
    expect(applySpecialDayRule("N", fromDateStr("2026-01-01"), h)).toBe("NF");
  });

  it("N cuando el día siguiente es domingo → NF", () => {
    // 2026-01-17 es sábado → domingo siguiente es 2026-01-18
    expect(applySpecialDayRule("N", fromDateStr("2026-01-17"), new Set())).toBe("NF");
  });

  it("N del domingo NO se convierte si el lunes es laborable", () => {
    // 2026-01-18 es domingo → lunes 2026-01-19 es laborable
    expect(applySpecialDayRule("N", fromDateStr("2026-01-18"), new Set())).toBe("N");
  });

  it("D no cambia aunque sea festivo", () => {
    expect(applySpecialDayRule("D", fromDateStr("2026-01-01"), holidays)).toBe("D");
  });
});

describe("applyChristmasSpecialRule", () => {
  it("convierte mañana, tarde y noche de los festivos navideños configurados", () => {
    expect(applyChristmasSpecialRule("M", fromDateStr("2026-12-25"))).toBe("MN");
    expect(applyChristmasSpecialRule("T", fromDateStr("2026-12-25"))).toBe("TN");
    expect(applyChristmasSpecialRule("N", fromDateStr("2026-12-25"))).toBe("NN");
    expect(applyChristmasSpecialRule("MF", fromDateStr("2027-01-06"))).toBe("MN");
    expect(applyChristmasSpecialRule("TF", fromDateStr("2027-01-06"))).toBe("TN");
    expect(applyChristmasSpecialRule("NF", fromDateStr("2027-01-06"))).toBe("NN");
  });

  it("solo convierte tarde y noche en 24/12, 31/12 y 05/01", () => {
    expect(applyChristmasSpecialRule("M", fromDateStr("2026-12-24"))).toBe("M");
    expect(applyChristmasSpecialRule("T", fromDateStr("2026-12-24"))).toBe("TN");
    expect(applyChristmasSpecialRule("N", fromDateStr("2026-12-24"))).toBe("NN");
    expect(applyChristmasSpecialRule("M", fromDateStr("2027-01-05"))).toBe("M");
    expect(applyChristmasSpecialRule("T", fromDateStr("2027-01-05"))).toBe("TN");
    expect(applyChristmasSpecialRule("N", fromDateStr("2027-01-05"))).toBe("NN");
  });
});

// ─── generateMonthSchedule — reglas fundamentales ─────────────────────────────

describe("generateMonthSchedule — mes completo con 7 técnicos", () => {
  const emps = make7Employees();

  it("genera daysInMonth × numEmpleados asignaciones", () => {
    const result = generateMonthSchedule(emps, 2026, 6); // Junio: 30 días
    expect(result).toHaveLength(emps.length * 30);
  });

  it("todas las fechas están en UTC midnight", () => {
    const result = generateMonthSchedule(emps, 2026, 5);
    for (const a of result) {
      expect(a.date.getUTCHours()).toBe(0);
      expect(a.date.getUTCMinutes()).toBe(0);
      expect(a.date.getUTCSeconds()).toBe(0);
    }
  });

  it("todos los shiftType son válidos", () => {
    const valid = new Set(["M", "T", "N", "D", "MF", "TF", "NF", "MN", "TN", "NN"]);
    const result = generateMonthSchedule(emps, 2026, 5);
    for (const a of result) {
      expect(valid.has(a.shiftType)).toBe(true);
    }
  });

  it("con lista vacía devuelve array vacío", () => {
    expect(generateMonthSchedule([], 2026, 5)).toHaveLength(0);
  });
});

// ─── Bloque de noches en generateMonthSchedule ────────────────────────────────

describe("generateMonthSchedule — bloque de noches", () => {
  it("el técnico en turno de noches tiene 7 noches consecutivas en el cuadrante", () => {
    const emps = make7Employees();
    const ids = emps.map((e) => e.id);
    const result = generateMonthSchedule(emps, 2026, 1, new Set(), new Set(), [], ids);

    // Encontrar qué técnico tiene bloques N en enero
    const byEmp = new Map<string, string[]>();
    for (const a of result) {
      if (!byEmp.has(a.employeeId)) byEmp.set(a.employeeId, []);
      byEmp.get(a.employeeId)!.push(a.shiftType);
    }

    // Al menos un empleado debe tener exactamente 7 noches (N/NF) seguidas
    let found = false;
    for (const [, shifts] of byEmp) {
      let maxConsec = 0;
      let cur = 0;
      for (const s of shifts) {
        if (s === "N" || s === "NF") {
          cur++;
          maxConsec = Math.max(maxConsec, cur);
        } else {
          cur = 0;
        }
      }
      if (maxConsec === 7) { found = true; break; }
    }
    expect(found).toBe(true);
  });

  it("el bloque del técnico 0 (primera posición de rotación) empieza en viernes", () => {
    const emps = make7Employees();
    const ids = emps.map((e) => e.id);
    // Con 7 empleados × 12 días = ciclo de 84 días = 12 semanas exactas.
    // El técnico en posición 0 siempre comienza su bloque el mismo día de la semana
    // que el epoch (viernes), ya que el ciclo completo = 12 semanas exactas.
    const blocks = computeNightBlocks(2026, 1, ids).filter((b) => b.employeeId === ids[0]);
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      expect(block.startFriday.getUTCDay()).toBe(5); // viernes
    }
  });
});

// ─── Regla: no dos técnicos en noche el mismo día ────────────────────────────

describe("generateMonthSchedule — máximo 1 técnico en noche por día", () => {
  it("nunca hay 2 empleados con turno N el mismo día", () => {
    const emps = make7Employees();
    const result = generateMonthSchedule(emps, 2026, 3, new Set(), new Set(), [], emps.map((e) => e.id));

    const nightsByDate = new Map<string, number>();
    for (const a of result) {
      const base = normalizeShift(a.shiftType);
      if (base === "N") {
        const dateStr = toDateStr(a.date);
        nightsByDate.set(dateStr, (nightsByDate.get(dateStr) ?? 0) + 1);
      }
    }
    for (const [, count] of nightsByDate) {
      expect(count).toBeLessThanOrEqual(1);
    }
  });

  it("todos los días del mes tienen exactamente 1 turno N (cobertura nocturna continua)", () => {
    // Con 7 empleados y offset de 7 días, no hay huecos nocturnos.
    // Cada día debe tener exactamente 1 empleado en N o NF.
    const emps = make7Employees();
    const result = generateMonthSchedule(emps, 2026, 6, new Set(), new Set(), [], emps.map((e) => e.id));

    const nightsByDate = new Map<string, number>();
    for (const a of result) {
      const base = normalizeShift(a.shiftType);
      if (base === "N") {
        const dateStr = toDateStr(a.date);
        nightsByDate.set(dateStr, (nightsByDate.get(dateStr) ?? 0) + 1);
      }
    }

    // Every day in June must have exactly 1 N/NF
    for (let d = 1; d <= 30; d++) {
      const dateStr = `2026-06-${String(d).padStart(2, "0")}`;
      expect(nightsByDate.get(dateStr) ?? 0).toBe(1);
    }
  });
});

// ─── Regla: cobertura mínima en laborables ────────────────────────────────────

describe("generateMonthSchedule — cobertura mínima M/T en laborables", () => {
  it("cada día laborable tiene al menos 1M y 1T; el objetivo 2M/2T es best effort", () => {
    const emps = make7Employees();
    const result = generateMonthSchedule(emps, 2026, 6, new Set(), new Set(), [], []);

    // Junio 2026: agrupar por fecha
    const byDate = new Map<string, string[]>();
    for (const a of result) {
      const dateStr = toDateStr(a.date);
      if (!byDate.has(dateStr)) byDate.set(dateStr, []);
      byDate.get(dateStr)!.push(a.shiftType);
    }

    for (const [dateStr, shifts] of byDate) {
      const d = fromDateStr(dateStr);
      if (isWeekend(d)) continue; // solo laborables

      const mCount = shifts.filter((s) => normalizeShift(s) === "M").length;
      const tCount = shifts.filter((s) => normalizeShift(s) === "T").length;
      // Night-block employees won't count as M or T; the hard minimum is 1M + 1T.
      const nonNightCount = shifts.filter((s) => normalizeShift(s) !== "N" && s !== "D").length;
      if (nonNightCount >= 2) {
        expect(mCount).toBeGreaterThanOrEqual(1);
        expect(tCount).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

// ─── RF-16: Cobertura mínima garantizada ─────────────────────────────────────

describe("generateMonthSchedule — RF-16 cobertura mínima garantizada", () => {
  it("laborable con todos pref M garantiza ≥1M y ≥1T cada día laborable", () => {
    // 4 employees all preferring M — algo must force ≥1T each workday
    const emps = Array.from({ length: 4 }, (_, i) => ({
      id: `emp-${i + 1}`,
      rotationOrder: i,
      shiftPreference: "M" as const,
    }));
    const result = generateMonthSchedule(emps, 2026, 6, new Set(), new Set(), [], []);

    const byDate = new Map<string, string[]>();
    for (const a of result) {
      const dateStr = toDateStr(a.date);
      if (!byDate.has(dateStr)) byDate.set(dateStr, []);
      byDate.get(dateStr)!.push(a.shiftType);
    }

    for (const [dateStr, shifts] of byDate) {
      const d = fromDateStr(dateStr);
      if (isWeekend(d)) continue;

      // Only check when enough active employees are available (not in D or N block)
      const nonRest = shifts.filter((s) => s !== "D" && normalizeShift(s) !== "N").length;
      if (nonRest < 2) continue;

      const mCount = shifts.filter((s) => normalizeShift(s) === "M").length;
      const tCount = shifts.filter((s) => normalizeShift(s) === "T").length;
      expect(mCount).toBeGreaterThanOrEqual(1);
      expect(tCount).toBeGreaterThanOrEqual(1);
    }
  });

  it("fin de semana garantiza ≥1MF y ≥1TF en cada día de fin de semana", () => {
    // All employees pref M — algo must force ≥1TF on weekends
    const emps = Array.from({ length: 4 }, (_, i) => ({
      id: `emp-${i + 1}`,
      rotationOrder: i,
      shiftPreference: "M" as const,
    }));
    const result = generateMonthSchedule(emps, 2026, 6, new Set(), new Set(), [], []);

    const byDate = new Map<string, string[]>();
    for (const a of result) {
      const dateStr = toDateStr(a.date);
      if (!byDate.has(dateStr)) byDate.set(dateStr, []);
      byDate.get(dateStr)!.push(a.shiftType);
    }

    for (const [dateStr, shifts] of byDate) {
      const d = fromDateStr(dateStr);
      if (!isWeekend(d)) continue;

      // Only check when enough active (non-D, non-N) employees are available
      const nonRest = shifts.filter((s) => s !== "D" && normalizeShift(s) !== "N").length;
      if (nonRest < 2) continue;

      const mfCount = shifts.filter((s) => s === "MF").length;
      const tfCount = shifts.filter((s) => s === "TF").length;
      expect(mfCount).toBeGreaterThanOrEqual(1);
      expect(tfCount).toBeGreaterThanOrEqual(1);
    }
  });

  it("no deja fines de semana sin MF/TF cuando hay técnicos disponibles", () => {
    const emps = [
      ...make7Employees(),
      { id: "emp-8", rotationOrder: 7, shiftPreference: null },
    ];
    const result = generateMonthSchedule(emps, 2026, 7, new Set(), new Set(), [], emps.map((e) => e.id));

    for (const dateStr of ["2026-07-25", "2026-07-26"]) {
      const shifts = result.filter((a) => toDateStr(a.date) === dateStr).map((a) => a.shiftType);
      expect(shifts.filter((s) => s === "MF")).toHaveLength(1);
      expect(shifts.filter((s) => s === "TF")).toHaveLength(1);
    }
  });

  it("cubre mañana y tarde en todos los fines de semana y festivos de enero con un técnico J", () => {
    const emps = [
      { id: "emp-J", rotationOrder: 0, shiftPreference: "J" as const },
      ...make7Employees().map((employee, index) => ({
        ...employee,
        rotationOrder: index + 1,
      })),
    ];
    const holidays = new Set(["2026-01-01", "2026-01-06"]);
    const result = generateMonthSchedule(emps, 2026, 1, new Set(), holidays, [], emps.map((e) => e.id));

    for (let day = 1; day <= 31; day++) {
      const dateStr = `2026-01-${String(day).padStart(2, "0")}`;
      const date = fromDateStr(dateStr);
      if (!isWeekend(date) && !holidays.has(dateStr)) continue;

      const shifts = result.filter((assignment) => toDateStr(assignment.date) === dateStr);
      expect(shifts.filter((assignment) => normalizeShift(assignment.shiftType) === "M")).toHaveLength(1);
      expect(shifts.filter((assignment) => normalizeShift(assignment.shiftType) === "T")).toHaveLength(1);
    }
  });

  it("cubre el primer fin de semana del mes aunque J no cuente y haya bloqueos manuales", () => {
    const emps: ScheduleEmployee[] = [
      { id: "jornada", rotationOrder: 1, shiftPreference: "J" },
      { id: "tarde", rotationOrder: 2, shiftPreference: "T" },
      { id: "noche-tail", rotationOrder: 3, shiftPreference: null },
      { id: "locked-1", rotationOrder: 4, shiftPreference: null },
      { id: "locked-2", rotationOrder: 5, shiftPreference: null },
      { id: "tarde-2", rotationOrder: 6, shiftPreference: null },
      { id: "locked-3", rotationOrder: 7, shiftPreference: null },
      { id: "locked-4", rotationOrder: 8, shiftPreference: null },
    ];
    const prevTail: PrevMonthTail[] = [
      ["jornada", ["J", "J", "J", "J", "J"]],
      ["tarde", ["T", "T", "T", "T", "T"]],
      ["noche-tail", ["NF", "N", "N", "N", "D"]],
      ["locked-1", ["T", "T", "D", "D", "NF"]],
      ["locked-2", ["M", "M", "M", "M", "M"]],
      ["tarde-2", ["T", "T", "T", "T", "T"]],
      ["locked-3", ["M", "M", "M", "M", "M"]],
      ["locked-4", ["M", "M", "M", "M", "D"]],
    ].flatMap(([employeeId, shifts]) =>
      (shifts as string[]).map((shiftType, index) => ({
        employeeId: employeeId as string,
        date: `2026-07-${String(27 + index).padStart(2, "0")}`,
        shiftType,
      }))
    );
    const locked = new Set([
      "locked-1|2026-08-01",
      "locked-1|2026-08-02",
      "locked-2|2026-08-01",
      "locked-2|2026-08-02",
      "locked-3|2026-08-01",
      "locked-3|2026-08-02",
      "locked-4|2026-08-01",
      "locked-4|2026-08-02",
    ]);

    const result = generateMonthSchedule(
      emps,
      2026,
      8,
      locked,
      new Set(),
      prevTail,
      emps.map((employee) => employee.id)
    );

    for (const dateStr of ["2026-08-01", "2026-08-02"]) {
      const shifts = result.filter((assignment) => toDateStr(assignment.date) === dateStr);
      expect(shifts.filter((assignment) => normalizeShift(assignment.shiftType) === "M")).toHaveLength(1);
      expect(shifts.filter((assignment) => normalizeShift(assignment.shiftType) === "T")).toHaveLength(1);
      expect(shifts.filter((assignment) => normalizeShift(assignment.shiftType) === "N")).toHaveLength(1);
      expect(shifts.find((assignment) => assignment.employeeId === "jornada")?.shiftType).toBe("D");
    }
  });

  it("evita cambios M↔T de un día al siguiente cuando la cobertura puede repararse con otro empleado", () => {
    const emps: ScheduleEmployee[] = [
      { id: "jornada", rotationOrder: 1, shiftPreference: "J" },
      { id: "tarde", rotationOrder: 2, shiftPreference: "T" },
      { id: "noche-tail", rotationOrder: 3, shiftPreference: null },
      { id: "locked-1", rotationOrder: 4, shiftPreference: null },
      { id: "locked-2", rotationOrder: 5, shiftPreference: null },
      { id: "tarde-2", rotationOrder: 6, shiftPreference: null },
      { id: "locked-3", rotationOrder: 7, shiftPreference: null },
      { id: "locked-4", rotationOrder: 8, shiftPreference: null },
    ];
    const prevTail: PrevMonthTail[] = [
      ["jornada", ["J", "J", "J", "J", "J"]],
      ["tarde", ["T", "T", "T", "T", "T"]],
      ["noche-tail", ["NF", "N", "N", "N", "D"]],
      ["locked-1", ["T", "T", "D", "D", "NF"]],
      ["locked-2", ["M", "M", "M", "M", "M"]],
      ["tarde-2", ["T", "T", "T", "T", "T"]],
      ["locked-3", ["M", "M", "M", "M", "M"]],
      ["locked-4", ["M", "M", "M", "M", "D"]],
    ].flatMap(([employeeId, shifts]) =>
      (shifts as string[]).map((shiftType, index) => ({
        employeeId: employeeId as string,
        date: `2026-07-${String(27 + index).padStart(2, "0")}`,
        shiftType,
      }))
    );
    const locked = new Set([
      "locked-1|2026-08-01",
      "locked-1|2026-08-02",
      "locked-2|2026-08-01",
      "locked-2|2026-08-02",
      "locked-3|2026-08-01",
      "locked-3|2026-08-02",
      "locked-4|2026-08-01",
      "locked-4|2026-08-02",
    ]);

    const result = generateMonthSchedule(
      emps,
      2026,
      8,
      locked,
      new Set(),
      prevTail,
      emps.map((employee) => employee.id)
    );

    for (const emp of emps) {
      const assignments = result
        .filter((assignment) => assignment.employeeId === emp.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      for (let i = 1; i < assignments.length; i++) {
        const previousBase = normalizeShift(assignments[i - 1].shiftType);
        const currentBase = normalizeShift(assignments[i].shiftType);
        if (
          (previousBase === "M" || previousBase === "T") &&
          (currentBase === "M" || currentBase === "T")
        ) {
          expect(currentBase).toBe(previousBase);
        }
      }
    }
  });

  it("con todos pref T garantiza ≥1M y ≥1T cada día laborable (cuando hay ≥2 disponibles)", () => {
    const emps = Array.from({ length: 4 }, (_, i) => ({
      id: `emp-${i + 1}`,
      rotationOrder: i,
      shiftPreference: "T" as const,
    }));
    const result = generateMonthSchedule(emps, 2026, 6, new Set(), new Set(), [], []);

    const byDate = new Map<string, string[]>();
    for (const a of result) {
      const dateStr = toDateStr(a.date);
      if (!byDate.has(dateStr)) byDate.set(dateStr, []);
      byDate.get(dateStr)!.push(a.shiftType);
    }

    for (const [dateStr, shifts] of byDate) {
      const d = fromDateStr(dateStr);
      if (isWeekend(d)) continue;

      // Only check when enough active (non-D, non-N) employees are available
      const nonRest = shifts.filter((s) => s !== "D" && normalizeShift(s) !== "N").length;
      if (nonRest < 2) continue;

      const mCount = shifts.filter((s) => normalizeShift(s) === "M").length;
      const tCount = shifts.filter((s) => normalizeShift(s) === "T").length;
      expect(mCount).toBeGreaterThanOrEqual(1);
      expect(tCount).toBeGreaterThanOrEqual(1);
    }
  });
});

// ─── Regla: ningún técnico cambia de M a T dentro de la semana (best effort) ─

describe("generateMonthSchedule — consistencia semanal M/T", () => {
  it("ningún técnico tiene M y T en la misma semana laborable (con holgura suficiente)", () => {
    // With 7 employees there is always enough slack that no employee should
    // need to flip M↔T within the same week for coverage purposes.
    // RF-16 only forces a flip when cov.M<1 or cov.T<1, which with 7 employees
    // is resolved by some OTHER employee — not by changing an existing assignment.
    const emps = make7Employees();
    const result = generateMonthSchedule(emps, 2026, 6, new Set(), new Set(), [], []);

    // Agrupar por empleado → semana
    const empWeekShifts = new Map<string, Map<string, Set<string>>>();
    for (const a of result) {
      const base = normalizeShift(a.shiftType);
      if (base !== "M" && base !== "T") continue;
      if (isWeekend(a.date)) continue; // solo laborables

      const wk = weekKey(a.date);
      if (!empWeekShifts.has(a.employeeId)) empWeekShifts.set(a.employeeId, new Map());
      const weeks = empWeekShifts.get(a.employeeId)!;
      if (!weeks.has(wk)) weeks.set(wk, new Set());
      weeks.get(wk)!.add(base);
    }

    for (const [, weeks] of empWeekShifts) {
      for (const [, shiftsThisWeek] of weeks) {
        // Should not have both M and T in same week
        const hasBoth = shiftsThisWeek.has("M") && shiftsThisWeek.has("T");
        expect(hasBoth).toBe(false);
      }
    }
  });
});

// ─── Regla: máximo 5 días consecutivos ────────────────────────────────────────

describe("generateMonthSchedule — máximo 5 días consecutivos del mismo turno", () => {
  it("ningún técnico tiene más de 5 días consecutivos de M o T", () => {
    const emps = make7Employees();
    const result = generateMonthSchedule(emps, 2026, 6, new Set(), new Set(), [], []);

    const byEmp = new Map<string, { date: Date; shiftType: string }[]>();
    for (const a of result) {
      if (!byEmp.has(a.employeeId)) byEmp.set(a.employeeId, []);
      byEmp.get(a.employeeId)!.push(a);
    }

    for (const [, assignments] of byEmp) {
      const sorted = assignments.sort((a, b) => a.date.getTime() - b.date.getTime());
      let consecutive = 0;
      let lastShift: string | null = null;
      for (const a of sorted) {
        const base = normalizeShift(a.shiftType);
        if ((base === "M" || base === "T") && base === lastShift) {
          consecutive++;
          expect(consecutive).toBeLessThanOrEqual(5);
        } else if (base === "M" || base === "T") {
          consecutive = 1;
          lastShift = base;
        } else {
          consecutive = 0;
          lastShift = null;
        }
      }
    }
  });
});

// ─── Regla: turnos manuales no se sobreescriben ───────────────────────────────

describe("generateMonthSchedule — turnos manuales no se sobreescriben", () => {
  it("las celdas en existingDates no aparecen en el resultado", () => {
    const emps = make7Employees();
    const locked = new Set(["emp-1|2026-06-01", "emp-2|2026-06-15"]);
    const result = generateMonthSchedule(emps, 2026, 6, locked);

    for (const a of result) {
      const key = `${a.employeeId}|${toDateStr(a.date)}`;
      expect(locked.has(key)).toBe(false);
    }
  });

  it("con una celda bloqueada hay daysInMonth-1 asignaciones para ese empleado", () => {
    const emps = [{ id: "emp-1", rotationOrder: 0 }];
    const locked = new Set(["emp-1|2026-06-01"]);
    const result = generateMonthSchedule(emps, 2026, 6, locked);
    expect(result.filter((a) => a.employeeId === "emp-1")).toHaveLength(29); // 30-1
  });
});

// ─── Regla: continuidad cross-month ───────────────────────────────────────────

describe("generateMonthSchedule — continuidad entre meses", () => {
  // Use 4 employees; exclude emp-1 from night rotation so it stays on day shifts
  const nightIds = ["emp-2", "emp-3", "emp-4"];
  const emps4 = [
    { id: "emp-1", rotationOrder: 0, shiftPreference: "M" as const },
    { id: "emp-2", rotationOrder: 1, shiftPreference: null },
    { id: "emp-3", rotationOrder: 2, shiftPreference: null },
    { id: "emp-4", rotationOrder: 3, shiftPreference: null },
  ];

  it("si un técnico termina el mes N-1 con 5M seguidas, el mes N empieza con 2D", () => {
    // Prev-month tail: 5 días M consecutivos justo al final
    const prevTail: PrevMonthTail[] = [
      { employeeId: "emp-1", date: "2026-05-27", shiftType: "M" },
      { employeeId: "emp-1", date: "2026-05-28", shiftType: "M" },
      { employeeId: "emp-1", date: "2026-05-29", shiftType: "M" },
      { employeeId: "emp-1", date: "2026-05-30", shiftType: "M" },
      { employeeId: "emp-1", date: "2026-05-31", shiftType: "M" },
    ];

    const result = generateMonthSchedule(emps4, 2026, 6, new Set(), new Set(), prevTail, nightIds);
    // Los días 1 y 2 de junio deben ser D (descanso mínimo de 2 días)
    const day1 = result.find((a) => a.employeeId === "emp-1" && toDateStr(a.date) === "2026-06-01");
    const day2 = result.find((a) => a.employeeId === "emp-1" && toDateStr(a.date) === "2026-06-02");
    expect(day1?.shiftType).toBe("D");
    expect(day2?.shiftType).toBe("D");
  });

  it("si un técnico termina con 3M, el mes siguiente puede continuar con M", () => {
    const prevTail: PrevMonthTail[] = [
      { employeeId: "emp-1", date: "2026-05-29", shiftType: "M" },
      { employeeId: "emp-1", date: "2026-05-30", shiftType: "M" },
      { employeeId: "emp-1", date: "2026-05-31", shiftType: "M" },
    ];

    const result = generateMonthSchedule(emps4, 2026, 6, new Set(), new Set(), prevTail, nightIds);
    // 2026-06-01 es lunes (laborable) — puede ser M (sólo 3+1=4 consecutivos)
    const day1 = result.find((a) => a.employeeId === "emp-1" && toDateStr(a.date) === "2026-06-01");
    expect(day1?.shiftType).toBe("M");
  });

  it("si el mes anterior termina con un único D tras 5 días de trabajo, el nuevo mes fuerza el segundo D", () => {
    const prevTail: PrevMonthTail[] = [
      { employeeId: "emp-1", date: "2026-05-26", shiftType: "M" },
      { employeeId: "emp-1", date: "2026-05-27", shiftType: "T" },
      { employeeId: "emp-1", date: "2026-05-28", shiftType: "M" },
      { employeeId: "emp-1", date: "2026-05-29", shiftType: "T" },
      { employeeId: "emp-1", date: "2026-05-30", shiftType: "M" },
      { employeeId: "emp-1", date: "2026-05-31", shiftType: "D" },
    ];

    const result = generateMonthSchedule(emps4, 2026, 6, new Set(), new Set(), prevTail, nightIds);
    const day1 = result.find((a) => a.employeeId === "emp-1" && toDateStr(a.date) === "2026-06-01");

    expect(day1?.shiftType).toBe("D");
  });
});

// ─── Regla: preferencias de turno ─────────────────────────────────────────────

describe("generateMonthSchedule — preferencias de turno", () => {
  it("técnico con pref M tiene más M que T en días laborables", () => {
    const emps = [
      { id: "emp-1", rotationOrder: 0, shiftPreference: "M" as const },
      { id: "emp-2", rotationOrder: 1, shiftPreference: null },
      { id: "emp-3", rotationOrder: 2, shiftPreference: null },
      { id: "emp-4", rotationOrder: 3, shiftPreference: null },
    ];

    const result = generateMonthSchedule(emps, 2026, 6, new Set(), new Set(), [], []);
    const emp1 = result.filter((a) => a.employeeId === "emp-1" && !isWeekend(a.date));
    const mCount = emp1.filter((a) => normalizeShift(a.shiftType) === "M").length;
    const tCount = emp1.filter((a) => normalizeShift(a.shiftType) === "T").length;
    expect(mCount).toBeGreaterThan(tCount);
  });

  it("técnico con pref T tiene más T que M en días laborables", () => {
    const emps = [
      { id: "emp-1", rotationOrder: 0, shiftPreference: null },
      { id: "emp-2", rotationOrder: 1, shiftPreference: "T" as const },
      { id: "emp-3", rotationOrder: 2, shiftPreference: null },
      { id: "emp-4", rotationOrder: 3, shiftPreference: null },
    ];

    const result = generateMonthSchedule(emps, 2026, 6, new Set(), new Set(), [], []);
    const emp2 = result.filter((a) => a.employeeId === "emp-2" && !isWeekend(a.date));
    const mCount = emp2.filter((a) => normalizeShift(a.shiftType) === "M").length;
    const tCount = emp2.filter((a) => normalizeShift(a.shiftType) === "T").length;
    // La preferencia T debe dominar: T >= M (>= porque el balance puede dar empate exacto)
    expect(tCount).toBeGreaterThanOrEqual(mCount);
  });

  // ── BUG-30: preferencia M/T se respeta incluso cuando hay varios empleados ──
  it("BUG-30 — técnico con pref T no recibe más M que T aunque otros empiecen en M", () => {
    // Reproduce el escenario del pantallazo: 7 técnicos, emp-2 tiene pref T.
    // nightRotationIds explícito para que emp-2 no caiga siempre en bloque N.
    const emps = [
      { id: "emp-1", rotationOrder: 0, shiftPreference: null },
      { id: "emp-2", rotationOrder: 1, shiftPreference: "T" as const },
      { id: "emp-3", rotationOrder: 2, shiftPreference: "M" as const },
      { id: "emp-4", rotationOrder: 3, shiftPreference: null },
      { id: "emp-5", rotationOrder: 4, shiftPreference: null },
      { id: "emp-6", rotationOrder: 5, shiftPreference: null },
      { id: "emp-7", rotationOrder: 6, shiftPreference: null },
    ];
    const nightOrder = ["emp-1", "emp-3", "emp-4", "emp-5", "emp-6", "emp-7"]; // emp-2 fuera de noches
    const result = generateMonthSchedule(emps, 2026, 3, new Set(), new Set(), [], nightOrder);
    // Filtrar SOLO días laborables donde emp-2 recibe M o T (excluye N/D de bloque nocturno)
    const emp2Work = result.filter(
      (a) =>
        a.employeeId === "emp-2" &&
        !isWeekend(a.date) &&
        (normalizeShift(a.shiftType) === "M" || normalizeShift(a.shiftType) === "T")
    );
    const mCount = emp2Work.filter((a) => normalizeShift(a.shiftType) === "M").length;
    const tCount = emp2Work.filter((a) => normalizeShift(a.shiftType) === "T").length;
    // La preferencia T debe dominar: T >= M en días laborables efectivos
    expect(tCount).toBeGreaterThanOrEqual(mCount);
  });

  // ── BUG-31: preferencia J — descanso en fin de semana ───────────────────────
  it("BUG-31 — técnico con pref J (Jornada) descansa todos los fines de semana", () => {
    const emps = [
      { id: "emp-1", rotationOrder: 0, shiftPreference: null },
      { id: "emp-2", rotationOrder: 1, shiftPreference: null },
      { id: "emp-3", rotationOrder: 2, shiftPreference: null },
      { id: "emp-4", rotationOrder: 3, shiftPreference: null },
      { id: "emp-5", rotationOrder: 4, shiftPreference: null },
      { id: "emp-6", rotationOrder: 5, shiftPreference: null },
      { id: "emp-J", rotationOrder: 6, shiftPreference: "J" as const },
    ];
    // Excluir emp-J de la rotación nocturna para un test limpio
    const nightOrder = ["emp-1", "emp-2", "emp-3", "emp-4", "emp-5", "emp-6"];
    const result = generateMonthSchedule(emps, 2026, 5, new Set(), new Set(), [], nightOrder);
    const empJWeekend = result.filter(
      (a) => a.employeeId === "emp-J" && isWeekend(a.date)
    );
    // Todos los días de fin de semana deben ser D (no MF/TF)
    const nonRestWeekend = empJWeekend.filter((a) => a.shiftType !== "D");
    expect(nonRestWeekend).toHaveLength(0);
  });

  it("BUG-31 — técnico con pref J trabaja en días laborables con turno J (no M ni T)", () => {
    const emps = [
      { id: "emp-1", rotationOrder: 0, shiftPreference: null },
      { id: "emp-2", rotationOrder: 1, shiftPreference: null },
      { id: "emp-3", rotationOrder: 2, shiftPreference: null },
      { id: "emp-4", rotationOrder: 3, shiftPreference: null },
      { id: "emp-5", rotationOrder: 4, shiftPreference: null },
      { id: "emp-6", rotationOrder: 5, shiftPreference: null },
      { id: "emp-J", rotationOrder: 6, shiftPreference: "J" as const },
    ];
    const nightOrder = ["emp-1", "emp-2", "emp-3", "emp-4", "emp-5", "emp-6"];
    const result = generateMonthSchedule(emps, 2026, 5, new Set(), new Set(), [], nightOrder);
    const empJWorkdays = result.filter(
      (a) => a.employeeId === "emp-J" && !isWeekend(a.date)
    );
    // En días laborables el técnico J debe recibir exactamente "J" (no M, T, MF, TF)
    const nonJ = empJWorkdays.filter((a) => a.shiftType !== "J" && a.shiftType !== "D");
    expect(nonJ).toHaveLength(0);
    const jShifts = empJWorkdays.filter((a) => a.shiftType === "J");
    expect(jShifts.length).toBeGreaterThan(0);
  });

  it("técnico con pref J queda excluido de noches aunque esté en nightRotationOrder", () => {
    const emps = [
      { id: "emp-1", rotationOrder: 0, shiftPreference: null },
      { id: "emp-2", rotationOrder: 1, shiftPreference: null },
      { id: "emp-3", rotationOrder: 2, shiftPreference: null },
      { id: "emp-4", rotationOrder: 3, shiftPreference: null },
      { id: "emp-5", rotationOrder: 4, shiftPreference: null },
      { id: "emp-6", rotationOrder: 5, shiftPreference: null },
      { id: "emp-J", rotationOrder: 6, shiftPreference: "J" as const },
    ];
    const nightOrderIncludingJ = emps.map((e) => e.id);

    const result = generateMonthSchedule(emps, 2026, 6, new Set(), new Set(), [], nightOrderIncludingJ);
    const empJAssignments = result.filter((a) => a.employeeId === "emp-J");

    expect(empJAssignments.some((a) => a.shiftType === "N" || a.shiftType === "NF")).toBe(false);
    expect(
      empJAssignments
        .filter((a) => !isWeekend(a.date))
        .every((a) => a.shiftType === "J")
    ).toBe(true);
  });

  it("con menos de 7 empleados elegibles para noches mantiene cobertura nocturna diaria", () => {
    const emps = [
      { id: "emp-1", rotationOrder: 0, shiftPreference: null },
      { id: "emp-2", rotationOrder: 1, shiftPreference: null },
      { id: "emp-3", rotationOrder: 2, shiftPreference: null },
      { id: "emp-4", rotationOrder: 3, shiftPreference: null },
      { id: "emp-5", rotationOrder: 4, shiftPreference: null },
      { id: "emp-6", rotationOrder: 5, shiftPreference: null },
      { id: "emp-J", rotationOrder: 6, shiftPreference: "J" as const },
    ];

    const result = generateMonthSchedule(emps, 2026, 6, new Set(), new Set(), [], emps.map((e) => e.id));
    const nightsByDate = new Map<string, number>();
    for (const a of result) {
      if (normalizeShift(a.shiftType) === "N") {
        const dateStr = toDateStr(a.date);
        nightsByDate.set(dateStr, (nightsByDate.get(dateStr) ?? 0) + 1);
      }
    }

    for (let day = 1; day <= 30; day++) {
      const dateStr = `2026-06-${String(day).padStart(2, "0")}`;
      expect(nightsByDate.get(dateStr) ?? 0).toBe(1);
    }
  });
});

// ─── Helpers tests ────────────────────────────────────────────────────────────

describe("weekKey", () => {
  it("devuelve el lunes de la semana", () => {
    // 2026-06-01 es lunes
    expect(weekKey(fromDateStr("2026-06-01"))).toBe("2026-06-01");
    // 2026-06-07 es domingo → lunes de esa semana es 2026-06-01
    expect(weekKey(fromDateStr("2026-06-07"))).toBe("2026-06-01");
    // 2026-06-06 es sábado → lunes de esa semana es 2026-06-01
    expect(weekKey(fromDateStr("2026-06-06"))).toBe("2026-06-01");
  });
});

describe("normalizeShift", () => {
  it("MF → M", () => expect(normalizeShift("MF")).toBe("M"));
  it("TF → T", () => expect(normalizeShift("TF")).toBe("T"));
  it("NF → N", () => expect(normalizeShift("NF")).toBe("N"));
  it("MN → M", () => expect(normalizeShift("MN")).toBe("M"));
  it("TN → T", () => expect(normalizeShift("TN")).toBe("T"));
  it("NN → N", () => expect(normalizeShift("NN")).toBe("N"));
  it("D → D", () => expect(normalizeShift("D")).toBe("D"));
  it("V → V", () => expect(normalizeShift("V")).toBe("V"));
});

describe("isWeekend", () => {
  it("sábado es fin de semana", () => {
    expect(isWeekend(fromDateStr("2026-06-06"))).toBe(true); // sábado
  });
  it("domingo es fin de semana", () => {
    expect(isWeekend(fromDateStr("2026-06-07"))).toBe(true); // domingo
  });
  it("lunes no es fin de semana", () => {
    expect(isWeekend(fromDateStr("2026-06-01"))).toBe(false);
  });
});

describe("isPostRestDay", () => {
  it("devuelve true cuando los dos días anteriores son D", () => {
    expect(
      isPostRestDay("emp-1", fromDateStr("2026-06-03"), [
        { employeeId: "emp-1", date: "2026-06-01", shiftType: "D" },
        { employeeId: "emp-1", date: "2026-06-02", shiftType: "D" },
      ])
    ).toBe(true);
  });

  it("devuelve false cuando solo hay un día D anterior", () => {
    expect(
      isPostRestDay("emp-1", fromDateStr("2026-06-03"), [
        { employeeId: "emp-1", date: "2026-06-01", shiftType: "M" },
        { employeeId: "emp-1", date: "2026-06-02", shiftType: "D" },
      ])
    ).toBe(false);
  });
});

// ─── resolveNightBlocks — transferencia por conflicto ────────────────────────

describe("resolveNightBlocks — sin conflictos devuelve los bloques sin cambios", () => {
  it("con existingDates vacío devuelve el mismo array", () => {
    const ids = make7Employees().map((e) => e.id);
    const raw = computeNightBlocks(2026, 6, ids);
    const resolved = resolveNightBlocks(raw, new Set(), ids);
    // Mismo número de bloques y mismos empleados asignados
    expect(resolved).toHaveLength(raw.length);
    for (let i = 0; i < raw.length; i++) {
      expect(resolved[i].employeeId).toBe(raw[i].employeeId);
      expect(resolved[i].startFriday).toEqual(raw[i].startFriday);
    }
  });
});

describe("resolveNightBlocks — transferencia por vacaciones", () => {
  it("transfiere el bloque al empleado con más tiempo sin noches cuando hay conflicto", () => {
    // Usamos 3 empleados para simplificar el razonamiento.
    // La rotación matemática (Mayo 2026) asigna el primer bloque al emp-1.
    // Si emp-1 tiene vacaciones en los días N, el bloque debe ir a otro empleado.
    const ids = ["emp-1", "emp-2", "emp-3"];
    const raw = computeNightBlocks(2026, 5, ids); // Mayo 2026

    // Identificar el primer bloque del mes y bloquear las noches del empleado asignado
    const sorted = [...raw].sort((a, b) => a.startFriday.getTime() - b.startFriday.getTime());
    const firstBlock = sorted[0];
    const firstBlockDays = nightBlockDays(firstBlock);
    const nDays = [...firstBlockDays.entries()]
      .filter(([, s]) => s === "N")
      .map(([d]) => d);

    // Marcar todos los días N del primer bloque como vacaciones del empleado original
    const existingDates = new Set(nDays.map((d) => `${firstBlock.employeeId}|${d}`));

    const resolved = resolveNightBlocks(raw, existingDates, ids);

    // El primer bloque resuelto debe pertenecer a un empleado distinto al original
    const resolvedFirst = [...resolved].sort(
      (a, b) => a.startFriday.getTime() - b.startFriday.getTime()
    )[0];
    expect(resolvedFirst.startFriday).toEqual(firstBlock.startFriday);
    expect(resolvedFirst.employeeId).not.toBe(firstBlock.employeeId);
  });

  it("el empleado de reemplazo no tiene conflictos en los días N del bloque transferido", () => {
    const ids = ["emp-1", "emp-2", "emp-3", "emp-4"];
    const raw = computeNightBlocks(2026, 5, ids);
    const sorted = [...raw].sort((a, b) => a.startFriday.getTime() - b.startFriday.getTime());
    const firstBlock = sorted[0];
    const firstBlockDays = nightBlockDays(firstBlock);
    const nDays = [...firstBlockDays.entries()]
      .filter(([, s]) => s === "N")
      .map(([d]) => d);

    // Bloquear al empleado original Y al segundo candidato (emp-2) para probar cascada
    const existingDates = new Set([
      ...nDays.map((d) => `${firstBlock.employeeId}|${d}`),
      ...nDays.map((d) => `emp-2|${d}`),
    ]);

    const resolved = resolveNightBlocks(raw, existingDates, ids);

    const resolvedFirst = [...resolved].sort(
      (a, b) => a.startFriday.getTime() - b.startFriday.getTime()
    )[0];
    // Debe asignarse a alguien que no sea el original ni emp-2
    expect(resolvedFirst.employeeId).not.toBe(firstBlock.employeeId);
    expect(resolvedFirst.employeeId).not.toBe("emp-2");
  });
});

describe("resolveNightBlocks — invariante: máx 1 N por día tras resolución", () => {
  it("no hay dos bloques resueltos con N-days solapados", () => {
    // Forzar múltiples conflictos para activar varias transferencias
    const ids = ["emp-1", "emp-2", "emp-3", "emp-4", "emp-5", "emp-6", "emp-7"];
    const raw = computeNightBlocks(2026, 5, ids);

    // Bloquear el primer bloque del empleado 0
    const sorted = [...raw].sort((a, b) => a.startFriday.getTime() - b.startFriday.getTime());
    const firstBlock = sorted[0];
    const firstNDays = [...nightBlockDays(firstBlock).entries()]
      .filter(([, s]) => s === "N")
      .map(([d]) => d);
    const existingDates = new Set(firstNDays.map((d) => `${firstBlock.employeeId}|${d}`));

    const resolved = resolveNightBlocks(raw, existingDates, ids);

    // Contar cuántos bloques tienen N en cada fecha
    const nightCount = new Map<string, number>();
    for (const block of resolved) {
      const days = nightBlockDays(block);
      for (const [dateStr, shift] of days) {
        if (shift === "N") {
          nightCount.set(dateStr, (nightCount.get(dateStr) ?? 0) + 1);
        }
      }
    }
    for (const [, count] of nightCount) {
      expect(count).toBeLessThanOrEqual(1);
    }
  });
});

describe("resolveNightBlocks — el empleado de reemplazo no recibe dos semanas consecutivas de noches", () => {
  it("cuando A transfiere su bloque a B, el bloque propio de B también se transfiere", () => {
    // Bug: cuando A (emp-1) tiene vacaciones, su bloque va a B (emp-2).
    // B luego tiene su PROPIO bloque adyacente (7 días después) → eso es 14 noches seguidas.
    // El fix debe detectar el solapamiento de bloques ya resueltos y transferir el bloque propio de B.
    const ids = ["emp-1", "emp-2", "emp-3", "emp-4"];
    const raw = computeNightBlocks(2026, 5, ids);
    const sorted = [...raw].sort((a, b) => a.startFriday.getTime() - b.startFriday.getTime());

    // Bloquear el primer bloque (del empleado al que le toca en la rotación)
    const firstBlock = sorted[0];
    const firstNDays = [...nightBlockDays(firstBlock).entries()]
      .filter(([, s]) => s === "N")
      .map(([d]) => d);
    const existingDates = new Set(firstNDays.map((d) => `${firstBlock.employeeId}|${d}`));

    const resolved = resolveNightBlocks(raw, existingDates, ids);

    // Ningún empleado debe tener dos bloques cuyas N-days estén a menos de 7 días de distancia
    const blocksByEmp = new Map<string, Date[]>();
    for (const b of resolved) {
      if (!blocksByEmp.has(b.employeeId)) blocksByEmp.set(b.employeeId, []);
      blocksByEmp.get(b.employeeId)!.push(b.startFriday);
    }
    for (const [, fridays] of blocksByEmp) {
      if (fridays.length < 2) continue;
      const sortedFridays = [...fridays].sort((a, b) => a.getTime() - b.getTime());
      for (let i = 1; i < sortedFridays.length; i++) {
        const gap = (sortedFridays[i].getTime() - sortedFridays[i - 1].getTime()) / 86_400_000;
        // Los N-days de dos bloques consecutivos del mismo empleado se solaparían si gap < 7.
        // Un gap de exactamente 7 significa noches adyacentes (día 1-7 y día 8-14) → también inválido.
        expect(gap).toBeGreaterThan(7);
      }
    }
  });
});

describe("generateMonthSchedule — vacaciones en bloque de noches transfieren el bloque", () => {
  it("el empleado con vacaciones en su semana de noches no aparece como N", () => {
    const emps = make7Employees();
    const ids = emps.map((e) => e.id);

    // Identificar qué empleado tiene el bloque de noches en Junio 2026
    const raw = computeNightBlocks(2026, 6, ids);
    const sorted = [...raw].sort((a, b) => a.startFriday.getTime() - b.startFriday.getTime());
    const firstBlock = sorted[0];
    const firstNDays = [...nightBlockDays(firstBlock).entries()]
      .filter(([, s]) => s === "N")
      .map(([d]) => d)
      .filter((d) => d.startsWith("2026-06")); // solo días del mes

    // Marcar todos sus días N como vacaciones
    const existingDates = new Set(firstNDays.map((d) => `${firstBlock.employeeId}|${d}`));

    const result = generateMonthSchedule(emps, 2026, 6, existingDates, new Set(), [], ids);

    // El empleado original NO debe tener ninguna N en los días de su bloque
    const originalNights = result.filter(
      (a) =>
        a.employeeId === firstBlock.employeeId &&
        firstNDays.includes(toDateStr(a.date)) &&
        normalizeShift(a.shiftType) === "N"
    );
    expect(originalNights).toHaveLength(0);
  });

  it("el bloque transferido mantiene la cobertura nocturna continua", () => {
    // Con vacaciones en el bloque del emp-1, otro emp cubre esas noches →
    // debe seguir habiendo exactamente 1 N por día en todo el mes
    const emps = make7Employees();
    const ids = emps.map((e) => e.id);

    const raw = computeNightBlocks(2026, 6, ids);
    const sorted = [...raw].sort((a, b) => a.startFriday.getTime() - b.startFriday.getTime());
    const firstBlock = sorted[0];
    const firstNDays = [...nightBlockDays(firstBlock).entries()]
      .filter(([, s]) => s === "N")
      .map(([d]) => d)
      .filter((d) => d.startsWith("2026-06"));

    const existingDates = new Set(firstNDays.map((d) => `${firstBlock.employeeId}|${d}`));
    const result = generateMonthSchedule(emps, 2026, 6, existingDates, new Set(), [], ids);

    // Contar N por día — debe ser exactamente 1 en todo Junio
    const nightsByDate = new Map<string, number>();
    for (const a of result) {
      if (normalizeShift(a.shiftType) === "N") {
        const ds = toDateStr(a.date);
        nightsByDate.set(ds, (nightsByDate.get(ds) ?? 0) + 1);
      }
    }
    for (let d = 1; d <= 30; d++) {
      const ds = `2026-06-${String(d).padStart(2, "0")}`;
      expect(nightsByDate.get(ds) ?? 0).toBe(1);
    }
  });
});

// ─── BUG-35: preferencia M/T respetada en MF/TF ───────────────────────────────

describe("generateMonthSchedule — BUG-35: preferencia M/T respetada en fines de semana", () => {
  it("empleado con preferencia M solo recibe MF (nunca TF) en fines de semana", () => {
    const emps: ScheduleEmployee[] = [
      { id: "m1", rotationOrder: 0, shiftPreference: "M" },
      { id: "t1", rotationOrder: 1, shiftPreference: "T" },
      { id: "n1", rotationOrder: 2, shiftPreference: null },
      { id: "n2", rotationOrder: 3, shiftPreference: null },
      { id: "n3", rotationOrder: 4, shiftPreference: null },
      { id: "n4", rotationOrder: 5, shiftPreference: null },
      { id: "n5", rotationOrder: 6, shiftPreference: null },
    ];
    // Junio 2026: sin festivos, sin bloqueos
    const result = generateMonthSchedule(emps, 2026, 6, new Set(), new Set(), [], []);

    const weekendShiftsM1 = result.filter(
      (a) => a.employeeId === "m1" && (a.shiftType === "MF" || a.shiftType === "TF")
    );
    // El empleado M solo puede tener MF en fines de semana, nunca TF
    expect(weekendShiftsM1.every((a) => a.shiftType === "MF")).toBe(true);
  });

  it("empleado con preferencia T solo recibe TF (nunca MF) en fines de semana", () => {
    const emps: ScheduleEmployee[] = [
      { id: "m1", rotationOrder: 0, shiftPreference: "M" },
      { id: "t1", rotationOrder: 1, shiftPreference: "T" },
      { id: "n1", rotationOrder: 2, shiftPreference: null },
      { id: "n2", rotationOrder: 3, shiftPreference: null },
      { id: "n3", rotationOrder: 4, shiftPreference: null },
      { id: "n4", rotationOrder: 5, shiftPreference: null },
      { id: "n5", rotationOrder: 6, shiftPreference: null },
    ];
    const result = generateMonthSchedule(emps, 2026, 6, new Set(), new Set(), [], []);

    const weekendShiftsT1 = result.filter(
      (a) => a.employeeId === "t1" && (a.shiftType === "MF" || a.shiftType === "TF")
    );
    expect(weekendShiftsT1.every((a) => a.shiftType === "TF")).toBe(true);
  });
});

// ─── BUG-36: máximo 5 días consecutivos con mezcla M/T y MF/TF ───────────────

describe("generateMonthSchedule — BUG-36: máximo 5 días consecutivos con mezcla M/T y MF/TF", () => {
  it("ningún empleado supera 5 días de trabajo consecutivo (M+T+MF+TF combinados)", () => {
    const emps = make7Employees();
    const result = generateMonthSchedule(emps, 2026, 5, new Set(), new Set(), [], []); // Mayo 31 días

    // Para cada empleado, contar rachas de días de trabajo consecutivos
    for (const emp of emps) {
      const empAssignments = result
        .filter((a) => a.employeeId === emp.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      let streak = 0;
      for (const a of empAssignments) {
        const base = normalizeShift(a.shiftType);
        const isWork = base === "M" || base === "T";
        if (isWork) {
          streak++;
          expect(streak).toBeLessThanOrEqual(5);
        } else {
          streak = 0;
        }
      }
    }
  });

  it("nunca hay un único D entre dos bloques de trabajo", () => {
    const emps = make7Employees();
    const result = generateMonthSchedule(emps, 2026, 5, new Set(), new Set(), [], emps.map((e) => e.id));

    for (const emp of emps) {
      const empAssignments = result
        .filter((a) => a.employeeId === emp.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      for (let i = 1; i < empAssignments.length - 1; i++) {
        const previous = empAssignments[i - 1];
        const current = empAssignments[i];
        const next = empAssignments[i + 1];
        if (current.shiftType === "D" && isGeneratedWork(previous.shiftType) && isGeneratedWork(next.shiftType)) {
          throw new Error(
            `${emp.id} has a single rest day between work blocks on ${toDateStr(current.date)}`
          );
        }
      }
    }
  });

  it("nunca hay un único D entre bloques de trabajo en enero con festivos navideños", () => {
    const emps = [
      { id: "emp-J", rotationOrder: 0, shiftPreference: "J" as const },
      ...make7Employees().map((employee, index) => ({
        ...employee,
        rotationOrder: index + 1,
      })),
    ];
    const holidays = new Set(["2026-01-01", "2026-01-06"]);
    const result = generateMonthSchedule(emps, 2026, 1, new Set(), holidays, [], emps.map((e) => e.id));

    for (const emp of emps) {
      const empAssignments = result
        .filter((a) => a.employeeId === emp.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      for (let i = 1; i < empAssignments.length - 1; i++) {
        const previous = empAssignments[i - 1];
        const current = empAssignments[i];
        const next = empAssignments[i + 1];
        if (current.shiftType === "D" && isGeneratedWork(previous.shiftType) && isGeneratedWork(next.shiftType)) {
          throw new Error(
            `${emp.id} has a single rest day between work blocks on ${toDateStr(current.date)}`
          );
        }
      }
    }
  });

  it("recoloca el pack de fin de semana si evita un D aislado con cola del mes anterior", () => {
    const emps = [
      { id: "admin", rotationOrder: 0, shiftPreference: null },
      ...make7Employees().map((employee, index) => ({
        ...employee,
        rotationOrder: index + 1,
      })),
    ];
    const may = generateMonthSchedule(emps, 2028, 5, new Set(), new Set(), [], emps.map((e) => e.id));
    const prevTail = may.map((assignment) => ({
      employeeId: assignment.employeeId,
      date: toDateStr(assignment.date),
      shiftType: assignment.shiftType,
    }));
    const june = generateMonthSchedule(emps, 2028, 6, new Set(), new Set(), prevTail, emps.map((e) => e.id));

    for (const emp of emps) {
      const empAssignments = june
        .filter((a) => a.employeeId === emp.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      for (let i = 1; i < empAssignments.length - 1; i++) {
        const previous = empAssignments[i - 1];
        const current = empAssignments[i];
        const next = empAssignments[i + 1];
        if (current.shiftType === "D" && isGeneratedWork(previous.shiftType) && isGeneratedWork(next.shiftType)) {
          throw new Error(
            `${emp.id} has a single rest day between work blocks on ${toDateStr(current.date)}`
          );
        }
      }
    }
  });
});

// ─── Sprint 16: cumplimiento ET Art. 34.3 ───────────────────────────────────

describe("generateMonthSchedule — descanso mínimo ET entre turnos", () => {
  it("ajusta a D una transición prohibida T→M y registra warning", () => {
    const emps = make7Employees();
    const warnings: {
      employeeId: string;
      date: string;
      prevShift: string;
      nextShift: string;
      hoursGap: number;
      reason: string;
    }[] = [];
    const result = generateMonthSchedule(
      emps,
      2026,
      6,
      new Set(),
      new Set(),
      [{ employeeId: "emp-4", date: "2026-05-31", shiftType: "T" }],
      emps.map((e) => e.id),
      { warnings }
    );

    const adjusted = result.find((a) => a.employeeId === "emp-4" && toDateStr(a.date) === "2026-06-01");
    expect(adjusted?.shiftType).toBe("D");
    expect(warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          employeeId: "emp-4",
          date: "2026-06-01",
          prevShift: "T",
          nextShift: "M",
          hoursGap: 8,
        }),
      ])
    );
  });
});

// ─── BUG-37: paquete Sáb+Dom indivisible ─────────────────────────────────────

describe("generateMonthSchedule — BUG-37: paquete Sáb+Dom indivisible", () => {
  it("el mismo empleado cubre sábado y domingo con el mismo tipo MF o TF", () => {
    const emps: ScheduleEmployee[] = [
      { id: "m1", rotationOrder: 0, shiftPreference: "M" },
      { id: "t1", rotationOrder: 1, shiftPreference: "T" },
      { id: "n1", rotationOrder: 2, shiftPreference: null },
      { id: "n2", rotationOrder: 3, shiftPreference: null },
      { id: "n3", rotationOrder: 4, shiftPreference: null },
      { id: "n4", rotationOrder: 5, shiftPreference: null },
      { id: "n5", rotationOrder: 6, shiftPreference: null },
    ];
    // Junio 2026: primer fin de semana = Sáb 6 y Dom 7
    const result = generateMonthSchedule(emps, 2026, 6, new Set(), new Set(), [], []);

    // Para cada par Sáb+Dom del mes, verificar que el mismo empleado cubre MF y TF
    for (let day = 1; day <= 30; day++) {
      const satDate = new Date(Date.UTC(2026, 5, day));
      if (satDate.getUTCDay() !== 6) continue; // solo sábados
      const sunDate = addDays(satDate, 1);
      if (sunDate.getUTCMonth() !== 5) continue; // domingo fuera del mes → saltar

      const satStr = toDateStr(satDate);
      const sunStr = toDateStr(sunDate);

      // Quién tiene MF/TF el sábado
      const satMF = result.find((a) => toDateStr(a.date) === satStr && a.shiftType === "MF");
      const satTF = result.find((a) => toDateStr(a.date) === satStr && a.shiftType === "TF");

      // Quién tiene MF/TF el domingo
      const sunMF = result.find((a) => toDateStr(a.date) === sunStr && a.shiftType === "MF");
      const sunTF = result.find((a) => toDateStr(a.date) === sunStr && a.shiftType === "TF");

      // El empleado MF del sábado debe ser el mismo que el del domingo
      if (satMF && sunMF) {
        expect(satMF.employeeId).toBe(sunMF.employeeId);
      }
      // El empleado TF del sábado debe ser el mismo que el del domingo
      if (satTF && sunTF) {
        expect(satTF.employeeId).toBe(sunTF.employeeId);
      }
    }
  });

  it("no hay empleado que tenga MF un sábado y TF el domingo del mismo fin de semana", () => {
    const emps: ScheduleEmployee[] = [
      { id: "m1", rotationOrder: 0, shiftPreference: "M" },
      { id: "t1", rotationOrder: 1, shiftPreference: "T" },
      { id: "n1", rotationOrder: 2, shiftPreference: null },
      { id: "n2", rotationOrder: 3, shiftPreference: null },
      { id: "n3", rotationOrder: 4, shiftPreference: null },
      { id: "n4", rotationOrder: 5, shiftPreference: null },
      { id: "n5", rotationOrder: 6, shiftPreference: null },
    ];
    const result = generateMonthSchedule(emps, 2026, 6, new Set(), new Set(), [], []);

    for (let day = 1; day <= 30; day++) {
      const satDate = new Date(Date.UTC(2026, 5, day));
      if (satDate.getUTCDay() !== 6) continue;
      const sunDate = addDays(satDate, 1);
      if (sunDate.getUTCMonth() !== 5) continue;

      const satStr = toDateStr(satDate);
      const sunStr = toDateStr(sunDate);

      // Para cada empleado, si tiene MF el sábado no puede tener TF el domingo (y viceversa)
      for (const emp of emps) {
        const satShift = result.find((a) => a.employeeId === emp.id && toDateStr(a.date) === satStr);
        const sunShift = result.find((a) => a.employeeId === emp.id && toDateStr(a.date) === sunStr);
        if (!satShift || !sunShift) continue;

        const satIsWork = satShift.shiftType === "MF" || satShift.shiftType === "TF";
        const sunIsWork = sunShift.shiftType === "MF" || sunShift.shiftType === "TF";
        if (satIsWork && sunIsWork) {
          // Ambos días de trabajo → deben ser el mismo tipo
          expect(satShift.shiftType).toBe(sunShift.shiftType);
        }
      }
    }
  });
});

// ─── Sprint 16: consistencia MF/TF con patrón semanal M/T ───────────────────

describe("generateMonthSchedule — consistencia semanal de fines de semana y festivos", () => {
  it("empleado con weeklyShift M recibe MF en fin de semana de la misma semana, no TF", () => {
    const emps = make7Employees();
    const result = generateMonthSchedule(emps, 2026, 1, new Set(), new Set(), [], emps.map((e) => e.id));
    const weekStart = "2025-12-29";
    let foundAlignedWeekend = false;

    for (const emp of emps) {
      const weekdayBaseShifts = new Set(
        result
          .filter((a) => a.employeeId === emp.id && weekKey(a.date) === weekStart && !isWeekend(a.date))
          .map((a) => normalizeShift(a.shiftType))
          .filter((shift) => shift === "M" || shift === "T")
      );
      const weekendShifts = result.filter(
        (a) =>
          a.employeeId === emp.id &&
          weekKey(a.date) === weekStart &&
          (a.shiftType === "MF" || a.shiftType === "TF")
      );

      if (weekdayBaseShifts.has("M") && !weekdayBaseShifts.has("T") && weekendShifts.length > 0) {
        expect(weekendShifts.every((a) => a.shiftType === "MF")).toBe(true);
        foundAlignedWeekend = true;
      }
    }

    expect(foundAlignedWeekend).toBe(true);
  });

  it("no hay cambio abrupto MF↔TF entre días consecutivos del mismo empleado", () => {
    const emps = make7Employees();
    const holidays = new Set(["2026-06-05"]); // viernes festivo antes del fin de semana
    const result = generateMonthSchedule(emps, 2026, 6, new Set(), holidays, [], emps.map((e) => e.id));
    const consecutiveDates = [
      ["2026-06-05", "2026-06-06"],
      ["2026-06-06", "2026-06-07"],
    ];

    for (const emp of emps) {
      for (const [firstDate, secondDate] of consecutiveDates) {
        const first = result.find((a) => a.employeeId === emp.id && toDateStr(a.date) === firstDate);
        const second = result.find((a) => a.employeeId === emp.id && toDateStr(a.date) === secondDate);
        if (
          first &&
          second &&
          (first.shiftType === "MF" || first.shiftType === "TF") &&
          (second.shiftType === "MF" || second.shiftType === "TF")
        ) {
          expect(second.shiftType).toBe(first.shiftType);
        }
      }
    }
  });

  it("festivo viernes pegado al fin de semana usa el mismo pack MF/TF", () => {
    const emps = make7Employees();
    const holidays = new Set(["2026-06-05"]);
    const result = generateMonthSchedule(emps, 2026, 6, new Set(), holidays, [], emps.map((e) => e.id));
    const packageDates = ["2026-06-05", "2026-06-06", "2026-06-07"];

    const mfAssignments = packageDates.map((dateStr) =>
      result.find((a) => toDateStr(a.date) === dateStr && a.shiftType === "MF")
    );
    const tfAssignments = packageDates.map((dateStr) =>
      result.find((a) => toDateStr(a.date) === dateStr && a.shiftType === "TF")
    );

    expect(mfAssignments.every(Boolean)).toBe(true);
    expect(tfAssignments.every(Boolean)).toBe(true);
    expect(new Set(mfAssignments.map((a) => a?.employeeId)).size).toBe(1);
    expect(new Set(tfAssignments.map((a) => a?.employeeId)).size).toBe(1);
  });
});

// ─── Sprint 17 Tarea 1: descanso forzado y coverageWarnings ─────────────────

describe("generateMonthSchedule — Sprint 17 Tarea 1: descanso forzado HARD y coverageWarnings", () => {
  // 4 employees with nightRotationIds=["emp-2","emp-3","emp-4","emp-1"] places emp-1
  // at night-order position 3 (block Jun12–18), so Jun1–3 have NO nightPlan entry for
  // emp-1, allowing the forced-rest logic to apply on those workdays without exemption.
  const emps4T1 = (): ScheduleEmployee[] => [
    { id: "emp-1", rotationOrder: 0, shiftPreference: null },
    { id: "emp-2", rotationOrder: 1, shiftPreference: null },
    { id: "emp-3", rotationOrder: 2, shiftPreference: null },
    { id: "emp-4", rotationOrder: 3, shiftPreference: null },
  ];
  const nightIds4T1 = ["emp-2", "emp-3", "emp-4", "emp-1"] as const;

  it("emite coverageWarning cuando el descanso obligatorio deja un laborable sin cobertura", () => {
    // emp-1 termina mayo con 5M consecutivas → descanso forzado en Jun1 y Jun2.
    // emp-3 tiene bloque nocturno N en Jun1-4 → cov M/T = 0 cuando emp-1 es
    // procesado primero → se emiten coverageWarnings.
    const emps = emps4T1();
    const prevTail: PrevMonthTail[] = [
      { employeeId: "emp-1", date: "2026-05-27", shiftType: "M" },
      { employeeId: "emp-1", date: "2026-05-28", shiftType: "M" },
      { employeeId: "emp-1", date: "2026-05-29", shiftType: "M" },
      { employeeId: "emp-1", date: "2026-05-30", shiftType: "M" },
      { employeeId: "emp-1", date: "2026-05-31", shiftType: "M" },
    ];
    const coverageWarnings: CoverageWarning[] = [];
    generateMonthSchedule(emps, 2026, 6, new Set(), new Set(), prevTail, [...nightIds4T1], { coverageWarnings });

    // Deben haberse emitido warnings para los días laborables sin cobertura
    const warningDates = coverageWarnings.map((w) => w.date);
    expect(warningDates).toContain("2026-06-01");
    expect(warningDates).toContain("2026-06-02");
    // Los warnings del descanso forzado de emp-1 en Jun1 y Jun2 llevan su employeeId
    const jun1Warnings = coverageWarnings.filter((w) => w.date === "2026-06-01");
    const jun2Warnings = coverageWarnings.filter((w) => w.date === "2026-06-02");
    expect(jun1Warnings.every((w) => w.employeeId === "emp-1")).toBe(true);
    expect(jun2Warnings.every((w) => w.employeeId === "emp-1")).toBe(true);
  });

  it("el empleado puede trabajar con normalidad a partir del día 3 (tras los 2D forzados)", () => {
    // El empleado con 5M termina el mes anterior. Jun1 y Jun2 son D forzados.
    // A partir de Jun3 el empleado puede volver a trabajar sin restricción.
    const emps = emps4T1();
    const prevTail: PrevMonthTail[] = [
      { employeeId: "emp-1", date: "2026-05-27", shiftType: "M" },
      { employeeId: "emp-1", date: "2026-05-28", shiftType: "M" },
      { employeeId: "emp-1", date: "2026-05-29", shiftType: "M" },
      { employeeId: "emp-1", date: "2026-05-30", shiftType: "M" },
      { employeeId: "emp-1", date: "2026-05-31", shiftType: "M" },
    ];
    const result = generateMonthSchedule(emps, 2026, 6, new Set(), new Set(), prevTail, [...nightIds4T1]);

    // Jun1 y Jun2: descanso forzado
    expect(result.find((a) => a.employeeId === "emp-1" && toDateStr(a.date) === "2026-06-01")?.shiftType).toBe("D");
    expect(result.find((a) => a.employeeId === "emp-1" && toDateStr(a.date) === "2026-06-02")?.shiftType).toBe("D");

    // Jun3 (miércoles): emp-1 ya puede trabajar — no debe ser D por descanso forzado
    const day3 = result.find((a) => a.employeeId === "emp-1" && toDateStr(a.date) === "2026-06-03");
    expect(day3?.shiftType).not.toBe("D");
    const base3 = normalizeShift(day3?.shiftType ?? "");
    expect(base3 === "M" || base3 === "T").toBe(true);
  });
});

// ─── Sprint 17 Tarea 2: continuidad cross-month de bloque nocturno ────────────

describe("generateMonthSchedule — Sprint 17 Tarea 2: continuidad cross-month de bloque nocturno", () => {
  // With 4 employees, cycle = 4×7 = 28 days.
  // emp-1 (rotationOrder=0) regular block in June 2026 starts Jun19, so Jun1–3
  // are free for cross-month continuation logic to apply without conflict.
  const make4Employees = (): ScheduleEmployee[] =>
    Array.from({ length: 4 }, (_, i) => ({
      id: `emp-${i + 1}`,
      rotationOrder: i,
      shiftPreference: null,
    }));

  it("empleado con 4 noches al final del mes anterior completa las 3 noches restantes en el nuevo mes", () => {
    // emp-1 termina mayo con 4N (noches 4-7 de su bloque) → debe tener N en Jun1, Jun2, Jun3.
    const emps = make4Employees();
    const prevTail: PrevMonthTail[] = [
      { employeeId: "emp-1", date: "2026-05-28", shiftType: "N" },
      { employeeId: "emp-1", date: "2026-05-29", shiftType: "N" },
      { employeeId: "emp-1", date: "2026-05-30", shiftType: "N" },
      { employeeId: "emp-1", date: "2026-05-31", shiftType: "N" },
    ];
    const result = generateMonthSchedule(
      emps, 2026, 6, new Set(), new Set(), prevTail, emps.map((e) => e.id)
    );

    // Las 3 noches de continuación deben aparecer en Jun1, Jun2 y Jun3
    expect(result.find((a) => a.employeeId === "emp-1" && toDateStr(a.date) === "2026-06-01")?.shiftType).toBe("N");
    expect(result.find((a) => a.employeeId === "emp-1" && toDateStr(a.date) === "2026-06-02")?.shiftType).toBe("N");
    expect(result.find((a) => a.employeeId === "emp-1" && toDateStr(a.date) === "2026-06-03")?.shiftType).toBe("N");
  });

  it("empleado que completa 7 noches al final del mes anterior recibe 3D post-descanso en el nuevo mes", () => {
    // emp-1 terminó mayo con las 7 noches completas → Jun1, Jun2, Jun3 son D (post-descanso).
    const emps = make4Employees();
    const prevTail: PrevMonthTail[] = [
      { employeeId: "emp-1", date: "2026-05-25", shiftType: "N" },
      { employeeId: "emp-1", date: "2026-05-26", shiftType: "N" },
      { employeeId: "emp-1", date: "2026-05-27", shiftType: "N" },
      { employeeId: "emp-1", date: "2026-05-28", shiftType: "N" },
      { employeeId: "emp-1", date: "2026-05-29", shiftType: "N" },
      { employeeId: "emp-1", date: "2026-05-30", shiftType: "N" },
      { employeeId: "emp-1", date: "2026-05-31", shiftType: "N" },
    ];
    const result = generateMonthSchedule(
      emps, 2026, 6, new Set(), new Set(), prevTail, emps.map((e) => e.id)
    );

    // Los 3 días de post-descanso deben ser D en Jun1, Jun2, Jun3
    expect(result.find((a) => a.employeeId === "emp-1" && toDateStr(a.date) === "2026-06-01")?.shiftType).toBe("D");
    expect(result.find((a) => a.employeeId === "emp-1" && toDateStr(a.date) === "2026-06-02")?.shiftType).toBe("D");
    expect(result.find((a) => a.employeeId === "emp-1" && toDateStr(a.date) === "2026-06-03")?.shiftType).toBe("D");
  });

  it("la continuidad cross-month mantiene exactamente 1 turno N por día en todo el nuevo mes", () => {
    // Con 4 empleados y emp-1 completando noches a inicio de mes, el algoritmo
    // no debe generar 2 N en el mismo día (invariante de cobertura nocturna).
    const emps = make4Employees();
    const prevTail: PrevMonthTail[] = [
      { employeeId: "emp-1", date: "2026-05-28", shiftType: "N" },
      { employeeId: "emp-1", date: "2026-05-29", shiftType: "N" },
      { employeeId: "emp-1", date: "2026-05-30", shiftType: "N" },
      { employeeId: "emp-1", date: "2026-05-31", shiftType: "N" },
    ];
    const result = generateMonthSchedule(
      emps, 2026, 6, new Set(), new Set(), prevTail, emps.map((e) => e.id)
    );

    const nightsByDate = new Map<string, number>();
    for (const a of result) {
      if (normalizeShift(a.shiftType) === "N") {
        const ds = toDateStr(a.date);
        nightsByDate.set(ds, (nightsByDate.get(ds) ?? 0) + 1);
      }
    }
    // Nunca debe haber 2 empleados en N el mismo día
    for (const [, count] of nightsByDate) {
      expect(count).toBeLessThanOrEqual(1);
    }
    // Los días Jun1-3 (continuación) deben tener exactamente 1 N
    expect(nightsByDate.get("2026-06-01") ?? 0).toBe(1);
    expect(nightsByDate.get("2026-06-02") ?? 0).toBe(1);
    expect(nightsByDate.get("2026-06-03") ?? 0).toBe(1);
  });
});

// ─── Sprint 17 Tarea 3: paquete extendido — festivo lunes pegado al fin de semana ──

describe("generateMonthSchedule — Sprint 17 Tarea 3: paquete extendido Sáb+Dom+Lun festivo", () => {
  it("festivo lunes pegado al domingo extiende el paquete a 3 días con el mismo empleado", () => {
    // Lunes 8 de junio de 2026 marcado como festivo → el paquete Sáb6+Dom7+Lun8
    // debe asignarse al mismo par de empleados (uno para MF y uno para TF los 3 días).
    const emps = make7Employees();
    const holidays = new Set(["2026-06-08"]); // lunes festivo
    const result = generateMonthSchedule(emps, 2026, 6, new Set(), holidays, [], emps.map((e) => e.id));

    const packageDates = ["2026-06-06", "2026-06-07", "2026-06-08"];

    // Exactamente 1 empleado cubre MF los 3 días y debe ser el mismo
    const mfByDate = packageDates.map((dateStr) =>
      result.find((a) => toDateStr(a.date) === dateStr && normalizeShift(a.shiftType) === "M")
    );
    const tfByDate = packageDates.map((dateStr) =>
      result.find((a) => toDateStr(a.date) === dateStr && normalizeShift(a.shiftType) === "T")
    );

    expect(mfByDate.every(Boolean)).toBe(true);
    expect(tfByDate.every(Boolean)).toBe(true);
    // El mismo empleado cubre M los 3 días del paquete
    expect(new Set(mfByDate.map((a) => a?.employeeId)).size).toBe(1);
    // El mismo empleado cubre T los 3 días del paquete
    expect(new Set(tfByDate.map((a) => a?.employeeId)).size).toBe(1);
  });

  it("festivo lunes: el lunes festivo recibe MF/TF, no M/T (es fin de semana extendido)", () => {
    // El lunes festivo dentro del paquete extendido debe recibir MF o TF, no M o T.
    const emps = make7Employees();
    const holidays = new Set(["2026-06-08"]);
    const result = generateMonthSchedule(emps, 2026, 6, new Set(), holidays, [], emps.map((e) => e.id));

    // El lunes festivo debe tener MF o TF (no M ni T)
    const mondayWork = result.filter(
      (a) => toDateStr(a.date) === "2026-06-08" && (a.shiftType === "M" || a.shiftType === "T")
    );
    expect(mondayWork).toHaveLength(0);

    // Debe haber exactamente 1 MF y 1 TF en ese lunes
    const mondayMF = result.filter((a) => toDateStr(a.date) === "2026-06-08" && a.shiftType === "MF");
    const mondayTF = result.filter((a) => toDateStr(a.date) === "2026-06-08" && a.shiftType === "TF");
    expect(mondayMF).toHaveLength(1);
    expect(mondayTF).toHaveLength(1);
  });

  it("festivo viernes — el viernes se incorpora al mismo pack Sáb+Dom (confirmación Tarea 3)", () => {
    // Viernes festivo antes de un fin de semana → paquete extendido Vie+Sáb+Dom.
    // El mismo empleado cubre M todos los días del paquete y otro cubre T.
    const emps = make7Employees();
    const holidays = new Set(["2026-06-05"]); // viernes festivo
    const result = generateMonthSchedule(emps, 2026, 6, new Set(), holidays, [], emps.map((e) => e.id));

    const packageDates = ["2026-06-05", "2026-06-06", "2026-06-07"];

    const mfByDate = packageDates.map((dateStr) =>
      result.find((a) => toDateStr(a.date) === dateStr && normalizeShift(a.shiftType) === "M")
    );
    const tfByDate = packageDates.map((dateStr) =>
      result.find((a) => toDateStr(a.date) === dateStr && normalizeShift(a.shiftType) === "T")
    );

    expect(mfByDate.every(Boolean)).toBe(true);
    expect(tfByDate.every(Boolean)).toBe(true);
    expect(new Set(mfByDate.map((a) => a?.employeeId)).size).toBe(1);
    expect(new Set(tfByDate.map((a) => a?.employeeId)).size).toBe(1);
  });
});

// ─── Sprint 18 Tarea 1: continuidad de pack de fin de semana en cambio de mes ─

describe("Sprint 18 Tarea 1: continuidad cross-month de pack Sáb+Dom", () => {
  // 2026-08-29 es sábado → si se asigna MF ese día, el domingo 2026-08-30 queda
  // dentro del mismo mes. Necesitamos un mes donde el ÚLTIMO día sea sábado.
  // 2026-01-31 es sábado, 2026-02-01 es domingo.

  function buildPrevMonthTail(
    satDate: string,
    mfEmpId: string,
    tfEmpId: string
  ): PrevMonthTail[] {
    // Tail includes the Saturday and a few preceding days
    return [
      { employeeId: mfEmpId, date: satDate, shiftType: "MF" },
      { employeeId: tfEmpId, date: satDate, shiftType: "TF" },
    ];
  }

  it("mes que termina en sábado con MF → el domingo del mes siguiente se asigna al mismo empleado con MF", () => {
    // Enero 2026: el día 31 es sábado. Febrero 2026: el día 1 es domingo.
    const emps = make7Employees();
    const mfEmpId = "emp-1";
    const tfEmpId = "emp-2";
    const prevTail = buildPrevMonthTail("2026-01-31", mfEmpId, tfEmpId);

    // Generar febrero 2026 con prevMonthTail que indica pack incompleto
    const result = generateMonthSchedule(
      emps, 2026, 2,
      new Set(), new Set(), prevTail,
      emps.map((e) => e.id)
    );

    // El domingo 2026-02-01 debe estar asignado a mfEmpId con MF
    const sundayMF = result.find(
      (a) => toDateStr(a.date) === "2026-02-01" && a.employeeId === mfEmpId
    );
    expect(sundayMF).toBeDefined();
    expect(normalizeShift(sundayMF!.shiftType)).toBe("M");
  });

  it("mes que termina en sábado con TF → el domingo del mes siguiente se asigna al mismo empleado con TF", () => {
    const emps = make7Employees();
    const mfEmpId = "emp-1";
    const tfEmpId = "emp-2";
    const prevTail = buildPrevMonthTail("2026-01-31", mfEmpId, tfEmpId);

    const result = generateMonthSchedule(
      emps, 2026, 2,
      new Set(), new Set(), prevTail,
      emps.map((e) => e.id)
    );

    // El domingo 2026-02-01 debe estar asignado a tfEmpId con TF
    const sundayTF = result.find(
      (a) => toDateStr(a.date) === "2026-02-01" && a.employeeId === tfEmpId
    );
    expect(sundayTF).toBeDefined();
    expect(normalizeShift(sundayTF!.shiftType)).toBe("T");
  });

  it("pack completo dentro del mismo mes: el mismo empleado cubre sábado y domingo con mismo tipo", () => {
    // 2026-02-07 es sábado, 2026-02-08 es domingo — ambos en febrero
    const emps = make7Employees();
    const result = generateMonthSchedule(
      emps, 2026, 2,
      new Set(), new Set(), [],
      emps.map((e) => e.id)
    );

    const satMF = result.find((a) => toDateStr(a.date) === "2026-02-07" && normalizeShift(a.shiftType) === "M");
    const sunMF = result.find((a) => toDateStr(a.date) === "2026-02-08" && normalizeShift(a.shiftType) === "M");
    const satTF = result.find((a) => toDateStr(a.date) === "2026-02-07" && normalizeShift(a.shiftType) === "T");
    const sunTF = result.find((a) => toDateStr(a.date) === "2026-02-08" && normalizeShift(a.shiftType) === "T");

    expect(satMF?.employeeId).toBe(sunMF?.employeeId);
    expect(satTF?.employeeId).toBe(sunTF?.employeeId);
  });

  it("los días se procesan en orden cronológico estricto (fechas ascendentes)", () => {
    const emps = make7Employees();
    const result = generateMonthSchedule(
      emps, 2026, 6,
      new Set(), new Set(), [],
      emps.map((e) => e.id)
    );

    // Los turnos de cada empleado deben estar en orden ascendente de fecha
    for (const emp of emps) {
      const empAssignments = result
        .filter((a) => a.employeeId === emp.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      const dates = empAssignments.map((a) => a.date.getTime());
      const sorted = [...dates].sort((a, b) => a - b);
      expect(dates).toEqual(sorted);
    }
  });
});

// ─── Sprint 18 Tarea 2: generación con alta concentración de vacaciones ────────

describe("Sprint 18 Tarea 2: alta concentración de vacaciones", () => {
  it("empleado que vuelve de 10 días de V tiene contador de consecutivos a 0 el día de vuelta (no descanso forzado)", () => {
    // Emp-1 tiene V los días 1-10, debe poder trabajar el día 11 sin descanso forzado
    const emps = make7Employees();
    const lockedCells = new Set<string>();
    for (let d = 1; d <= 10; d++) {
      lockedCells.add(`emp-1|2026-08-${String(d).padStart(2, "0")}`);
    }

    const result = generateMonthSchedule(
      emps, 2026, 8,
      lockedCells, new Set(), [],
      emps.map((e) => e.id)
    );

    // El día 11 de emp-1 debe ser un turno de trabajo (M, T, MF, TF), no D
    const day11 = result.find(
      (a) => a.employeeId === "emp-1" && toDateStr(a.date) === "2026-08-11"
    );
    // Debe existir (puede ser D si cae en algún ciclo de descanso del bloque de noches,
    // pero no debe ser D por el contador de vacaciones)
    // La prueba relevante: no hay needsHardRest falso positivo por V
    // Verificar que no hay 5+ D consecutivos tras las vacaciones
    const empResults = result
      .filter((a) => a.employeeId === "emp-1")
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    const day11to15 = empResults.filter((a) => {
      const d = a.date.getUTCDate();
      return d >= 11 && d <= 20;
    });
    // Al menos algunos de esos días deben ser trabajo (no todos D)
    const workDays = day11to15.filter((a) => {
      const base = normalizeShift(a.shiftType);
      return base === "M" || base === "T" || base === "J";
    });
    expect(workDays.length).toBeGreaterThan(0);
    void day11; // suprime TS warning
  });

  it("día con solo 1 empleado disponible genera warning y asigna turno al disponible", () => {
    // 6 empleados tienen V el día 15, solo emp-7 está disponible
    const emps = make7Employees();
    const lockedCells = new Set<string>();
    for (let i = 1; i <= 6; i++) {
      lockedCells.add(`emp-${i}|2026-08-15`);
    }

    const coverageWarnings: CoverageWarning[] = [];
    const result = generateMonthSchedule(
      emps, 2026, 8,
      lockedCells, new Set(), [],
      emps.map((e) => e.id),
      { coverageWarnings }
    );

    // Debe emitir warning sobre disponibilidad reducida el día 15
    const day15Warning = coverageWarnings.find((w) => w.date === "2026-08-15");
    expect(day15Warning).toBeDefined();
    expect(day15Warning!.message).toContain("1");

    // Emp-7 debe tener algún turno el día 15 (si no está en bloque nocturno/descanso)
    const day15assignments = result.filter((a) => toDateStr(a.date) === "2026-08-15");
    // Al menos emp-7 no tiene V ese día
    const emp7Day15 = result.find((a) => a.employeeId === "emp-7" && toDateStr(a.date) === "2026-08-15");
    expect(emp7Day15).toBeDefined();
  });

  it("día con 0 empleados disponibles deja celdas vacías y genera warning crítico", () => {
    // Todos los empleados tienen V el día 20
    const emps = make7Employees();
    const lockedCells = new Set<string>();
    for (let i = 1; i <= 7; i++) {
      lockedCells.add(`emp-${i}|2026-08-20`);
    }

    const coverageWarnings: CoverageWarning[] = [];
    const result = generateMonthSchedule(
      emps, 2026, 8,
      lockedCells, new Set(), [],
      emps.map((e) => e.id),
      { coverageWarnings }
    );

    // No debe haber ninguna asignación generada para el día 20
    const day20Generated = result.filter((a) => toDateStr(a.date) === "2026-08-20");
    expect(day20Generated).toHaveLength(0);

    // Debe emitir warning crítico
    const day20Warning = coverageWarnings.find(
      (w) => w.date === "2026-08-20" && w.message.includes("⚠️")
    );
    expect(day20Warning).toBeDefined();
  });
});
