/**
 * Unit tests for lib/schedules/cross-month.ts
 * Sprint 20 — Task 5: Tests for extracted modules
 */

import { describe, it, expect } from "vitest";
import {
  buildPrevMonthTrailingState,
  applyCrossMonthNightBlocks,
  applyCrossMonthWeekendPack,
} from "../../../lib/schedules/cross-month";

// ─────────────────────────────────────────────────────────────────────────────
// buildPrevMonthTrailingState
// ─────────────────────────────────────────────────────────────────────────────

describe("cross-month — buildPrevMonthTrailingState", () => {
  it("returns empty map for empty tail", () => {
    const result = buildPrevMonthTrailingState([]);
    expect(result.size).toBe(0);
  });

  it("computes trailing M shifts correctly", () => {
    const tail = [
      { employeeId: "e1", date: "2026-01-29", shiftType: "M" },
      { employeeId: "e1", date: "2026-01-30", shiftType: "T" },
      { employeeId: "e1", date: "2026-01-31", shiftType: "M" },
    ];
    const result = buildPrevMonthTrailingState(tail);
    const e1 = result.get("e1");
    expect(e1).toBeDefined();
    expect(e1!.shift).toBe("M");
    expect(e1!.count).toBe(3); // all 3 are day-work (M/T)
  });

  it("computes trailing N shifts correctly", () => {
    const tail = [
      { employeeId: "e2", date: "2026-01-28", shiftType: "M" },
      { employeeId: "e2", date: "2026-01-29", shiftType: "N" },
      { employeeId: "e2", date: "2026-01-30", shiftType: "N" },
      { employeeId: "e2", date: "2026-01-31", shiftType: "N" },
    ];
    const result = buildPrevMonthTrailingState(tail);
    const e2 = result.get("e2");
    expect(e2).toBeDefined();
    expect(e2!.shift).toBe("N");
    expect(e2!.count).toBe(3);
  });

  it("handles multiple employees", () => {
    const tail = [
      { employeeId: "e1", date: "2026-01-31", shiftType: "M" },
      { employeeId: "e2", date: "2026-01-31", shiftType: "T" },
    ];
    const result = buildPrevMonthTrailingState(tail);
    expect(result.size).toBe(2);
    expect(result.get("e1")?.shift).toBe("M");
    expect(result.get("e2")?.shift).toBe("T");
  });

  it("handles NF shifts (normalizes to N)", () => {
    const tail = [
      { employeeId: "e3", date: "2026-01-31", shiftType: "NF" },
    ];
    const result = buildPrevMonthTrailingState(tail);
    expect(result.get("e3")?.shift).toBe("N");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// applyCrossMonthNightBlocks
// ─────────────────────────────────────────────────────────────────────────────

describe("cross-month — applyCrossMonthNightBlocks", () => {
  it("does nothing for empty prevMonthTail", () => {
    const nightPlan = new Map<string, string>();
    const restDates = new Set<string>();
    applyCrossMonthNightBlocks([], 2026, 2, new Set(), nightPlan, restDates);
    expect(nightPlan.size).toBe(0);
    expect(restDates.size).toBe(0);
  });

  it("assigns remaining nights for mid-block employee (3 trailing Ns)", () => {
    // Employee had 3 trailing nights → needs 4 more nights + 3D post-rest
    const tail = [
      { employeeId: "e1", date: "2026-01-29", shiftType: "N" },
      { employeeId: "e1", date: "2026-01-30", shiftType: "N" },
      { employeeId: "e1", date: "2026-01-31", shiftType: "N" },
    ];
    const nightPlan = new Map<string, string>();
    const restDates = new Set<string>();
    applyCrossMonthNightBlocks(tail, 2026, 2, new Set(), nightPlan, restDates);

    // Should plan Feb 1-4 as N, Feb 5-7 as D
    expect(nightPlan.get("e1|2026-02-01")).toBe("N");
    expect(nightPlan.get("e1|2026-02-02")).toBe("N");
    expect(nightPlan.get("e1|2026-02-03")).toBe("N");
    expect(nightPlan.get("e1|2026-02-04")).toBe("N");
    expect(nightPlan.get("e1|2026-02-05")).toBe("D");
    expect(nightPlan.get("e1|2026-02-06")).toBe("D");
    expect(nightPlan.get("e1|2026-02-07")).toBe("D");
    expect(restDates.has("e1|2026-02-05")).toBe(true);
  });

  it("adds 3 post-rest D days for employee with 7 trailing nights", () => {
    const tail = Array.from({ length: 7 }, (_, i) => ({
      employeeId: "e2",
      date: `2026-01-${25 + i}`.padStart(10, "0"),
      shiftType: "N",
    }));
    // Fix dates manually for simplicity
    const tail7 = [
      { employeeId: "e2", date: "2026-01-25", shiftType: "N" },
      { employeeId: "e2", date: "2026-01-26", shiftType: "N" },
      { employeeId: "e2", date: "2026-01-27", shiftType: "N" },
      { employeeId: "e2", date: "2026-01-28", shiftType: "N" },
      { employeeId: "e2", date: "2026-01-29", shiftType: "N" },
      { employeeId: "e2", date: "2026-01-30", shiftType: "N" },
      { employeeId: "e2", date: "2026-01-31", shiftType: "N" },
    ];
    const nightPlan = new Map<string, string>();
    const restDates = new Set<string>();
    applyCrossMonthNightBlocks(tail7, 2026, 2, new Set(), nightPlan, restDates);

    // Feb 1-3 must be D post-rest
    expect(nightPlan.get("e2|2026-02-01")).toBe("D");
    expect(nightPlan.get("e2|2026-02-02")).toBe("D");
    expect(nightPlan.get("e2|2026-02-03")).toBe("D");
    expect(restDates.has("e2|2026-02-01")).toBe(true);
  });

  it("stops night continuation at locked date (vacation)", () => {
    const tail = [
      { employeeId: "e3", date: "2026-01-30", shiftType: "N" },
      { employeeId: "e3", date: "2026-01-31", shiftType: "N" },
    ];
    // Employee has vacation on Feb 1
    const existingDates = new Set(["e3|2026-02-01"]);
    const nightPlan = new Map<string, string>();
    const restDates = new Set<string>();
    applyCrossMonthNightBlocks(tail, 2026, 2, existingDates, nightPlan, restDates);

    // No nights or rest should be planned
    expect(nightPlan.get("e3|2026-02-01")).toBeUndefined();
    expect(nightPlan.get("e3|2026-02-02")).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// applyCrossMonthWeekendPack
// ─────────────────────────────────────────────────────────────────────────────

describe("cross-month — applyCrossMonthWeekendPack", () => {
  it("does nothing for empty prevMonthTail", () => {
    const weekendPlan = new Map<string, any>();
    const stateMap = new Map<string, any>();
    applyCrossMonthWeekendPack([], 2026, 2, weekendPlan, stateMap);
    expect(weekendPlan.size).toBe(0);
  });

  it("does nothing when last day of prev month is not Saturday", () => {
    // Jan 2026 ends on Saturday (Jan 31 = Saturday), let's pick a month where it's not
    // March 2026: Feb ends on Sunday (Feb 28 = Saturday? No, Feb 28 2026 = Saturday)
    // Actually: Jan 31 2026 = Saturday. We want a case where last day != Saturday.
    // April 2026: March 31 2026 = Tuesday
    const tail = [
      { employeeId: "e1", date: "2026-03-31", shiftType: "MF" },
    ];
    const weekendPlan = new Map<string, any>();
    const stateMap = new Map<string, any>();
    // April 2026 → last day of March is March 31 = Tuesday → NOT Saturday
    applyCrossMonthWeekendPack(tail, 2026, 4, weekendPlan, stateMap);
    expect(weekendPlan.size).toBe(0);
  });

  it("pre-seeds weekend plan when Jan ends Saturday and Feb starts Sunday", () => {
    // Jan 31 2026 = Saturday → Feb 1 2026 = Sunday
    const tail = [
      { employeeId: "e1", date: "2026-01-31", shiftType: "MF" },
      { employeeId: "e2", date: "2026-01-31", shiftType: "TF" },
    ];
    const weekendPlan = new Map<string, any>();
    const e1State = { weekendShift: new Map<string, string>(), weekShift: new Map<string, string>() };
    const e2State = { weekendShift: new Map<string, string>(), weekShift: new Map<string, string>() };
    const stateMap = new Map([["e1", e1State], ["e2", e2State]]);

    applyCrossMonthWeekendPack(tail, 2026, 2, weekendPlan, stateMap);

    // weekendPlan should have Jan 31 pre-seeded
    const plan = weekendPlan.get("2026-01-31");
    expect(plan).toBeDefined();
    expect(plan.mfEmpId).toBe("e1");
    expect(plan.tfEmpId).toBe("e2");

    // e1's state should have MF/M for the first week of Feb
    expect(e1State.weekendShift.size).toBeGreaterThan(0);
    expect(e2State.weekendShift.size).toBeGreaterThan(0);
  });
});
