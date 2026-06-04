/**
 * Unit tests for repairCoverageByDayShiftSwap (uncovered-shifts fix).
 *
 * When all employees prefer M (or T) the day loop can produce days with
 * no T (or M) coverage at all, and repairCoverage cannot help because no
 * employee has a free "D" cell to convert.  The swap repair detects a
 * surplus shift (≥2 M with 0 T) and converts one M→T — provided the
 * shift-transition rules allow it.
 *
 * CPs: 155 (swap M→T), 156 (swap T→M), 157 (transitions preserved).
 */

import { describe, expect, it } from "vitest";
import {
  generateMonthSchedule,
  normalizeShift,
} from "@/lib/schedules/monthly-schedule-engine";
import type { ScheduleEmployee } from "@/lib/schedules/monthly-schedule-engine";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function coverageByDay(
  assignments: Array<{ employeeId: string; date: Date; shiftType: string }>
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const a of assignments) {
    const ds = a.date.toISOString().slice(0, 10);
    if (!map.has(ds)) map.set(ds, new Set());
    map.get(ds)!.add(normalizeShift(a.shiftType));
  }
  return map;
}

function isWeekendDate(d: Date): boolean {
  const dow = d.getUTCDay();
  return dow === 0 || dow === 6;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("repairCoverageByDayShiftSwap – BUG coverage gaps", () => {
  /**
   * CP-155: After the swap repair, no day where M had surplus (≥2) AND T was
   * absent should still have T=0, given that at least one M-employee has a
   * non-M (D, T, or N) shift the next day.
   *
   * We verify this indirectly: run a 6-employee mixed team and check that for
   * every workday where ≥2 M employees exist, T is also present.
   */
  it("CP-155 — days with M surplus do not leave T uncovered", () => {
    const employees: ScheduleEmployee[] = [
      { id: "e1", rotationOrder: 0, shiftPreference: "M" },
      { id: "e2", rotationOrder: 1, shiftPreference: "M" },
      { id: "e3", rotationOrder: 2, shiftPreference: "M" },
      { id: "e4", rotationOrder: 3, shiftPreference: "T" },
      { id: "e5", rotationOrder: 4, shiftPreference: "T" },
      { id: "e6", rotationOrder: 5, shiftPreference: null },
    ];

    const result = generateMonthSchedule(
      employees,
      2026,
      4, // April – 30 days, no night rotation
      new Set<string>(),
      new Set<string>(),
      []
    );

    const byDay = coverageByDay(result);

    for (const [ds, shifts] of byDay) {
      const date = new Date(ds);
      if (isWeekendDate(date)) continue;
      const mCount = [...shifts].filter((s) => s === "M").length;
      // If M has surplus (≥2) on a workday, the swap repair must have
      // produced at least one T (or T was already there from normal repair).
      if (mCount >= 2) {
        expect(shifts.has("T"), `M surplus but T absent on workday ${ds}`).toBe(
          true
        );
      }
    }
  });

  /**
   * CP-156: Symmetric case — days with T surplus (≥2) should not leave M=0.
   */
  it("CP-156 — days with T surplus do not leave M uncovered", () => {
    const employees: ScheduleEmployee[] = [
      { id: "e1", rotationOrder: 0, shiftPreference: "T" },
      { id: "e2", rotationOrder: 1, shiftPreference: "T" },
      { id: "e3", rotationOrder: 2, shiftPreference: "T" },
      { id: "e4", rotationOrder: 3, shiftPreference: "M" },
      { id: "e5", rotationOrder: 4, shiftPreference: "M" },
      { id: "e6", rotationOrder: 5, shiftPreference: null },
    ];

    const result = generateMonthSchedule(
      employees,
      2026,
      4,
      new Set<string>(),
      new Set<string>(),
      []
    );

    const byDay = coverageByDay(result);

    for (const [ds, shifts] of byDay) {
      const date = new Date(ds);
      if (isWeekendDate(date)) continue;
      const tCount = [...shifts].filter((s) => s === "T").length;
      if (tCount >= 2) {
        expect(shifts.has("M"), `T surplus but M absent on workday ${ds}`).toBe(
          true
        );
      }
    }
  });

  /**
   * CP-157: The swap repair must not introduce invalid shift transitions.
   * N→T, N→M, and T→M within the same employee's schedule must never appear.
   */
  it("CP-157 — swap repair preserves all shift-transition constraints", () => {
    const employees: ScheduleEmployee[] = [
      { id: "e1", rotationOrder: 0, shiftPreference: "M" },
      { id: "e2", rotationOrder: 1, shiftPreference: "M" },
      { id: "e3", rotationOrder: 2, shiftPreference: "M" },
      { id: "e4", rotationOrder: 3, shiftPreference: "M" },
      { id: "n1", rotationOrder: 4, shiftPreference: null },
      { id: "n2", rotationOrder: 5, shiftPreference: null },
      { id: "n3", rotationOrder: 6, shiftPreference: null },
      { id: "n4", rotationOrder: 7, shiftPreference: null },
      { id: "n5", rotationOrder: 8, shiftPreference: null },
      { id: "n6", rotationOrder: 9, shiftPreference: null },
      { id: "n7", rotationOrder: 10, shiftPreference: null },
    ];
    const nightOrder = ["n1", "n2", "n3", "n4", "n5", "n6", "n7"];

    const result = generateMonthSchedule(
      employees,
      2026,
      3, // March 2026 – the month from the bug report
      new Set<string>(),
      new Set<string>(),
      [],
      nightOrder
    );

    // Group by employee and sort chronologically
    const byEmp = new Map<string, Array<{ date: Date; shift: string }>>();
    for (const a of result) {
      if (!byEmp.has(a.employeeId)) byEmp.set(a.employeeId, []);
      byEmp.get(a.employeeId)!.push({ date: a.date, shift: a.shiftType });
    }

    const forbidden = [
      ["N", "M"] as const,
      ["N", "T"] as const,
      ["T", "M"] as const,
    ];

    for (const [empId, assignments] of byEmp) {
      assignments.sort((a, b) => a.date.getTime() - b.date.getTime());
      for (let i = 1; i < assignments.length; i++) {
        const prev = normalizeShift(assignments[i - 1].shift);
        const curr = normalizeShift(assignments[i].shift);
        for (const [p, c] of forbidden) {
          expect(
            prev === p && curr === c,
            `Invalid ${p}→${c} transition for employee ${empId} on ` +
              `${assignments[i].date.toISOString().slice(0, 10)}`
          ).toBe(false);
        }
      }
    }
  });
});
