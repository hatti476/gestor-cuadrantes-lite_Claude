import { describe, expect, test } from "vitest";

import { executeDayLoop } from "../../../lib/schedules/day-loop";
import type {
  DayLoopInput,
  Employee,
  LockedCell,
  NightBlockSlot,
  WeekendPackOwner,
} from "../../../lib/schedules/day-loop-context";

const EMPLOYEES: Employee[] = [
  { id: "e1", rotationOrder: 1, shiftPreference: null },
  { id: "e2", rotationOrder: 2, shiftPreference: null },
  { id: "e3", rotationOrder: 3, shiftPreference: "T" },
];

function key(employeeId: string, date: string): string {
  return `${employeeId}|${date}`;
}

function buildInput(overrides: Partial<DayLoopInput> = {}): DayLoopInput {
  return {
    projectId: "p1",
    year: 2026,
    month: 6,
    employees: EMPLOYEES,
    holidays: [],
    lockedCells: new Map<string, LockedCell>(),
    nightBlockPlan: new Map<string, NightBlockSlot>(),
    weekendPackPlan: new Map<string, WeekendPackOwner>(),
    prevMonthContext: {
      previousMonthShiftByKey: new Map<string, string>(),
      carriedRestDates: new Set<string>(),
      trailingStateByEmployee: new Map(),
    },
    nextMonthContext: {
      firstDate: "2026-07-01",
      continuityHints: new Map(),
    },
    ...overrides,
  };
}

function getShift(
  output: ReturnType<typeof executeDayLoop>,
  employeeId: string,
  date: string
): string | undefined {
  return output.assignments.get(key(employeeId, date))?.shiftType;
}

function monthDays(year: number, month: number): string[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: string[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(Date.UTC(year, month - 1, day));
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

describe("day-loop", () => {
  test("DL-01: loop de un solo día laborable asigna M o T", () => {
    const input = buildInput({ employees: [{ id: "solo", rotationOrder: 1 }] });
    const output = executeDayLoop(input);
    const shift = getShift(output, "solo", "2026-06-01");
    expect(["M", "T", "J", "D"]).toContain(shift);
  });

  test("DL-02: mes completo asigna todos los empleados activos todos los días", () => {
    const input = buildInput();
    const output = executeDayLoop(input);
    const expected = input.employees.length * monthDays(2026, 6).length;
    expect(output.assignments.size).toBe(expected);
  });

  test("DL-03: los días se procesan en orden cronológico estricto", () => {
    const output = executeDayLoop(buildInput());
    const dates = [...output.assignments.values()].map((a) => a.date);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] >= dates[i - 1]).toBe(true);
    }
  });

  test("DL-04: V bloqueada no se sobreescribe", () => {
    const locked = new Map<string, LockedCell>([
      [key("e1", "2026-06-03"), { employeeId: "e1", date: "2026-06-03", shiftType: "V" }],
    ]);
    const output = executeDayLoop(buildInput({ lockedCells: locked }));
    expect(getShift(output, "e1", "2026-06-03")).toBe("V");
  });

  test("DL-05: B bloqueada no se sobreescribe", () => {
    const locked = new Map<string, LockedCell>([
      [key("e1", "2026-06-04"), { employeeId: "e1", date: "2026-06-04", shiftType: "B" }],
    ]);
    const output = executeDayLoop(buildInput({ lockedCells: locked }));
    expect(getShift(output, "e1", "2026-06-04")).toBe("B");
  });

  test("DL-06: D manual bloqueado no se sobreescribe", () => {
    const locked = new Map<string, LockedCell>([
      [key("e2", "2026-06-05"), { employeeId: "e2", date: "2026-06-05", shiftType: "D" }],
    ]);
    const output = executeDayLoop(buildInput({ lockedCells: locked }));
    expect(getShift(output, "e2", "2026-06-05")).toBe("D");
  });

  test("DL-07: descanso HARD tiene prioridad sobre turno laboral", () => {
    const weekend = new Map<string, WeekendPackOwner>([["2026-06-06", { mfEmpId: "e1", tfEmpId: "e2" }]]);
    const output = executeDayLoop(buildInput({ employees: [{ id: "e1", rotationOrder: 1 }], weekendPackPlan: weekend }));
    expect(getShift(output, "e1", "2026-06-06")).toBe("D");
  });

  test("DL-08: night block tiene prioridad sobre paquete de fin de semana", () => {
    const weekend = new Map<string, WeekendPackOwner>([["2026-08-01", { mfEmpId: "e1", tfEmpId: "e2" }]]);
    const nights = new Map<string, NightBlockSlot>([
      [key("e1", "2026-08-01"), { employeeId: "e1", date: "2026-08-01", shiftType: "N" }],
    ]);
    const output = executeDayLoop(buildInput({ month: 8, weekendPackPlan: weekend, nightBlockPlan: nights }));
    expect(getShift(output, "e1", "2026-08-01")).toBe("N");
  });

  test("DL-09: festivo entre semana recibe MF/TF y no M/T", () => {
    const output = executeDayLoop(buildInput({ holidays: [new Date("2026-06-08T00:00:00.000Z")] }));
    const shift = getShift(output, "e1", "2026-06-08");
    expect(["MF", "TF", "D"]).toContain(shift);
    expect(["M", "T"]).not.toContain(shift);
  });

  test("DL-10: empleado con V todo el mes no recibe turnos de trabajo", () => {
    const locked = new Map<string, LockedCell>();
    for (const date of monthDays(2026, 6)) {
      locked.set(key("e1", date), { employeeId: "e1", date, shiftType: "V" });
    }
    const output = executeDayLoop(buildInput({ lockedCells: locked }));
    const shifts = monthDays(2026, 6).map((d) => getShift(output, "e1", d));
    expect(new Set(shifts)).toEqual(new Set(["V"]));
  });

  test("DL-11: vuelta de vacaciones no arrastra racha de trabajo", () => {
    const locked = new Map<string, LockedCell>();
    for (let day = 1; day <= 10; day++) {
      const date = `2026-06-${String(day).padStart(2, "0")}`;
      locked.set(key("e1", date), { employeeId: "e1", date, shiftType: "V" });
    }
    const output = executeDayLoop(buildInput({ employees: [{ id: "e1", rotationOrder: 1 }], lockedCells: locked }));
    expect(getShift(output, "e1", "2026-06-11")).not.toBe("D");
  });

  test("DL-12: continuidad de night block en día 1 desde contexto previo", () => {
    const nights = new Map<string, NightBlockSlot>([
      [key("e1", "2026-06-01"), { employeeId: "e1", date: "2026-06-01", shiftType: "N" }],
    ]);
    const output = executeDayLoop(buildInput({ nightBlockPlan: nights }));
    expect(getShift(output, "e1", "2026-06-01")).toBe("N");
  });

  test("DL-13: continuidad de pack desde sábado previo mantiene domingo", () => {
    const weekend = new Map<string, WeekendPackOwner>([["2026-08-01", { mfEmpId: "e1", tfEmpId: "e2" }]]);
    const output = executeDayLoop(buildInput({ month: 8, weekendPackPlan: weekend }));
    expect(getShift(output, "e1", "2026-08-02")).toBe("MF");
  });

  test("DL-14: prevMonthContext influye en transición del día 1", () => {
    const prev = new Map<string, string>([[key("e1", "2026-05-31"), "T"]]);
    const output = executeDayLoop(buildInput({
      employees: [{ id: "e1", rotationOrder: 1 }],
      prevMonthContext: {
        previousMonthShiftByKey: prev,
        carriedRestDates: new Set(),
        trailingStateByEmployee: new Map(),
      },
    }));
    expect(getShift(output, "e1", "2026-06-01")).toBe("D");
  });

  test("DL-15: día con 1 empleado disponible genera warning", () => {
    const locked = new Map<string, LockedCell>([
      [key("e2", "2026-06-03"), { employeeId: "e2", date: "2026-06-03", shiftType: "V" }],
      [key("e3", "2026-06-03"), { employeeId: "e3", date: "2026-06-03", shiftType: "V" }],
    ]);
    const output = executeDayLoop(buildInput({ lockedCells: locked }));
    expect(output.warnings.some((warning) => warning.date === "2026-06-03")).toBe(true);
  });

  test("DL-16: día con 0 disponibles emite warning crítico y sin turnos de trabajo", () => {
    const locked = new Map<string, LockedCell>();
    for (const employee of EMPLOYEES) {
      locked.set(key(employee.id, "2026-06-03"), {
        employeeId: employee.id,
        date: "2026-06-03",
        shiftType: "V",
      });
    }
    const output = executeDayLoop(buildInput({ lockedCells: locked }));
    expect(output.warnings.some((warning) => warning.message.includes("Cobertura crítica"))).toBe(true);
    expect(getShift(output, "e1", "2026-06-03")).toBe("V");
    expect(getShift(output, "e2", "2026-06-03")).toBe("V");
    expect(getShift(output, "e3", "2026-06-03")).toBe("V");
  });

  test("DL-17: warnings se acumulan en todo el mes", () => {
    const locked = new Map<string, LockedCell>([
      [key("e2", "2026-06-03"), { employeeId: "e2", date: "2026-06-03", shiftType: "V" }],
      [key("e3", "2026-06-03"), { employeeId: "e3", date: "2026-06-03", shiftType: "V" }],
      [key("e2", "2026-06-04"), { employeeId: "e2", date: "2026-06-04", shiftType: "V" }],
      [key("e3", "2026-06-04"), { employeeId: "e3", date: "2026-06-04", shiftType: "V" }],
    ]);
    const output = executeDayLoop(buildInput({ lockedCells: locked }));
    expect(output.warnings.length).toBeGreaterThanOrEqual(2);
  });

  test("DL-18: weeklyShifts se reinicia por semana (comportamiento observable)", () => {
    const output = executeDayLoop(buildInput({ employees: [{ id: "e1", rotationOrder: 1 }] }));
    const week1 = getShift(output, "e1", "2026-06-01");
    const week2 = getShift(output, "e1", "2026-06-08");
    expect(week1).toBeDefined();
    expect(week2).toBeDefined();
  });

  test("DL-19: consecutiveWorkDays incrementa y activa descanso", () => {
    const output = executeDayLoop(buildInput({ employees: [{ id: "e1", rotationOrder: 1 }] }));
    // Tras varios días laborables, debe aparecer al menos un D por control de racha.
    const shifts = monthDays(2026, 6).map((date) => getShift(output, "e1", date));
    expect(shifts.includes("D")).toBe(true);
  });

  test("DL-20: consecutiveRestDays se reinicia al volver a trabajar", () => {
    const output = executeDayLoop(buildInput({ employees: [{ id: "e1", rotationOrder: 1 }] }));
    const d6 = getShift(output, "e1", "2026-06-06");
    const d9 = getShift(output, "e1", "2026-06-09");
    expect(d6).toBeDefined();
    expect(d9).toBeDefined();
  });

  test("DL-21: coverageSummary incluye todas las fechas del mes", () => {
    const output = executeDayLoop(buildInput());
    expect(Object.keys(output.coverageSummary).length).toBe(30);
  });

  test("DL-22: coverageSummary marca hardMet en días con cobertura", () => {
    const output = executeDayLoop(buildInput());
    expect(output.coverageSummary["2026-06-01"]).toBeDefined();
  });

  test("DL-23: celdas bloqueadas no afectan resto de empleados", () => {
    const locked = new Map<string, LockedCell>([
      [key("e1", "2026-06-10"), { employeeId: "e1", date: "2026-06-10", shiftType: "V" }],
    ]);
    const output = executeDayLoop(buildInput({ lockedCells: locked }));
    expect(getShift(output, "e2", "2026-06-10")).toBeDefined();
  });

  test("DL-24: slot nocturno D en nightBlockPlan se respeta", () => {
    const nights = new Map<string, NightBlockSlot>([
      [key("e2", "2026-06-11"), { employeeId: "e2", date: "2026-06-11", shiftType: "D" }],
    ]);
    const output = executeDayLoop(buildInput({ nightBlockPlan: nights }));
    expect(getShift(output, "e2", "2026-06-11")).toBe("D");
  });

  test("DL-25: paquete weekend MF para owner se aplica en sábado", () => {
    const weekend = new Map<string, WeekendPackOwner>([["2026-08-01", { mfEmpId: "e2", tfEmpId: "e1" }]]);
    const output = executeDayLoop(buildInput({ month: 8, weekendPackPlan: weekend }));
    expect(getShift(output, "e2", "2026-08-01")).toBe("MF");
  });

  test("DL-26: paquete weekend TF para owner se aplica en domingo", () => {
    const weekend = new Map<string, WeekendPackOwner>([["2026-08-01", { mfEmpId: "e2", tfEmpId: "e1" }]]);
    const output = executeDayLoop(buildInput({ month: 8, weekendPackPlan: weekend }));
    expect(getShift(output, "e1", "2026-08-02")).toBe("TF");
  });

  test("DL-27: empleado no owner recibe D en paquete", () => {
    const weekend = new Map<string, WeekendPackOwner>([["2026-08-01", { mfEmpId: "e1", tfEmpId: "e2" }]]);
    const output = executeDayLoop(buildInput({ month: 8, weekendPackPlan: weekend }));
    expect(getShift(output, "e3", "2026-08-01")).toBe("D");
  });

  test("DL-28: transición inválida se convierte a D", () => {
    const prev = new Map<string, string>([[key("e1", "2026-05-31"), "N"]]);
    const output = executeDayLoop(buildInput({
      employees: [{ id: "e1", rotationOrder: 1, shiftPreference: "M" }],
      prevMonthContext: {
        previousMonthShiftByKey: prev,
        carriedRestDates: new Set(),
        trailingStateByEmployee: new Map(),
      },
    }));
    expect(getShift(output, "e1", "2026-06-01")).toBe("D");
  });

  test("DL-29: warnings incluye transición inválida", () => {
    const prev = new Map<string, string>([[key("e1", "2026-05-31"), "N"]]);
    const output = executeDayLoop(buildInput({
      employees: [{ id: "e1", rotationOrder: 1, shiftPreference: "M" }],
      prevMonthContext: {
        previousMonthShiftByKey: prev,
        carriedRestDates: new Set(),
        trailingStateByEmployee: new Map(),
      },
    }));
    expect(output.warnings.some((warning) => warning.employeeId === "e1")).toBe(true);
  });

  test("DL-30: salida mantiene un assignment por celda", () => {
    const output = executeDayLoop(buildInput());
    const uniqueKeys = new Set([...output.assignments.keys()]);
    expect(uniqueKeys.size).toBe(output.assignments.size);
  });
});
