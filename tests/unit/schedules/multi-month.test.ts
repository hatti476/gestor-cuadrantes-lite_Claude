import { describe, expect, test } from "vitest";

import {
  employeesFromAssignments,
  getMonthPeriods,
  parseSpan,
} from "../../../lib/schedules/multi-month";
import type { ScheduleAssignment } from "../../../lib/schedules/types";

describe("getMonthPeriods — mes visible centrado (SPEC-009 AC-08)", () => {
  test("span=3 centrado en mayo → abr, may, jun", () => {
    expect(getMonthPeriods(2026, 5, 3)).toEqual([
      { year: 2026, month: 4 },
      { year: 2026, month: 5 },
      { year: 2026, month: 6 },
    ]);
  });

  test("span par: un mes más hacia delante que hacia atrás (6 → mar..ago)", () => {
    expect(getMonthPeriods(2026, 5, 6).map((p) => p.month)).toEqual([3, 4, 5, 6, 7, 8]);
  });

  test("span=4 → abr..jul, span=2 → may..jun", () => {
    expect(getMonthPeriods(2026, 5, 4).map((p) => p.month)).toEqual([4, 5, 6, 7]);
    expect(getMonthPeriods(2026, 5, 2).map((p) => p.month)).toEqual([5, 6]);
  });

  test("cruza el cambio de año en ambos sentidos", () => {
    expect(getMonthPeriods(2026, 1, 3)).toEqual([
      { year: 2025, month: 12 },
      { year: 2026, month: 1 },
      { year: 2026, month: 2 },
    ]);
    expect(getMonthPeriods(2026, 12, 3).at(-1)).toEqual({ year: 2027, month: 1 });
  });
});

describe("parseSpan — span de la URL (SPEC-009 AC-07)", () => {
  test("acepta 2, 3, 4 y 6", () => {
    expect(parseSpan("2")).toBe(2);
    expect(parseSpan("4")).toBe(4);
    expect(parseSpan("6")).toBe(6);
  });

  test("valor ausente o fuera de la lista → 3", () => {
    expect(parseSpan(null)).toBe(3);
    expect(parseSpan("5")).toBe(3);
    expect(parseSpan("abc")).toBe(3);
    expect(parseSpan("1000")).toBe(3);
  });
});

describe("employeesFromAssignments — fallback sin /api/employees (SPEC-009 AC-09)", () => {
  const emp = (id: string, rotationOrder: number) => ({ id, name: id, rotationOrder });
  const a = (employeeId: string, date: string, employee?: ReturnType<typeof emp>): ScheduleAssignment => ({
    id: `${employeeId}-${date}`,
    employeeId,
    date,
    shiftType: "M",
    employee,
  });

  test("deduplica por empleado y ordena por rotationOrder", () => {
    const result = employeesFromAssignments([
      a("e2", "2026-05-01", emp("e2", 2)),
      a("e1", "2026-05-01", emp("e1", 1)),
      a("e2", "2026-06-01", emp("e2", 2)),
    ]);
    expect(result.map((e) => e.id)).toEqual(["e1", "e2"]);
  });

  test("ignora asignaciones sin datos de empleado", () => {
    expect(employeesFromAssignments([a("e1", "2026-05-01")])).toEqual([]);
  });
});
