/**
 * Unit tests for lib/schedules/rest-rules.ts
 * Sprint 20 — Task 5: Tests for extracted modules
 */

import { describe, it, expect } from "vitest";
import {
  isDayWorkShift,
  countTrailingDayWork,
  countTrailingShift,
  initialForcedRestDaysRemaining,
  isPostRestDay,
  countConsecutiveWorkDays,
} from "../../../lib/schedules/rest-rules";

describe("rest-rules — isDayWorkShift", () => {
  it("M is day-work", () => expect(isDayWorkShift("M")).toBe(true));
  it("T is day-work", () => expect(isDayWorkShift("T")).toBe(true));
  it("N is not day-work", () => expect(isDayWorkShift("N")).toBe(false));
  it("D is not day-work", () => expect(isDayWorkShift("D")).toBe(false));
  it("V is not day-work", () => expect(isDayWorkShift("V")).toBe(false));
  it("B is not day-work", () => expect(isDayWorkShift("B")).toBe(false));
  it("null is not day-work", () => expect(isDayWorkShift(null)).toBe(false));
});

describe("rest-rules — countTrailingDayWork", () => {
  it("counts consecutive M/T at end", () => {
    const tail = [
      { date: "2026-01-01", shiftType: "N" },
      { date: "2026-01-02", shiftType: "M" },
      { date: "2026-01-03", shiftType: "T" },
      { date: "2026-01-04", shiftType: "M" },
    ];
    expect(countTrailingDayWork(tail)).toBe(3);
  });

  it("returns 0 when last shift is N", () => {
    const tail = [
      { date: "2026-01-01", shiftType: "M" },
      { date: "2026-01-02", shiftType: "N" },
    ];
    expect(countTrailingDayWork(tail)).toBe(0);
  });

  it("counts full tail if all day-work", () => {
    const tail = [
      { date: "2026-01-01", shiftType: "M" },
      { date: "2026-01-02", shiftType: "T" },
      { date: "2026-01-03", shiftType: "M" },
      { date: "2026-01-04", shiftType: "T" },
      { date: "2026-01-05", shiftType: "M" },
    ];
    expect(countTrailingDayWork(tail)).toBe(5);
  });
});

describe("rest-rules — countTrailingShift", () => {
  it("counts trailing N shifts", () => {
    const tail = [
      { date: "2026-01-01", shiftType: "M" },
      { date: "2026-01-02", shiftType: "N" },
      { date: "2026-01-03", shiftType: "N" },
      { date: "2026-01-04", shiftType: "N" },
    ];
    expect(countTrailingShift(tail, "N")).toBe(3);
  });

  it("returns 0 when last shift doesn't match", () => {
    const tail = [
      { date: "2026-01-01", shiftType: "N" },
      { date: "2026-01-02", shiftType: "M" },
    ];
    expect(countTrailingShift(tail, "N")).toBe(0);
  });
});

describe("rest-rules — initialForcedRestDaysRemaining", () => {
  it("returns 1 when last entry is D after 5+ day-work (partial rest taken)", () => {
    // Employee worked M/T/M/T/M (5 in a row), then took 1 D → 1 rest day remaining
    const tail = [
      { shiftType: "M" },
      { shiftType: "T" },
      { shiftType: "M" },
      { shiftType: "T" },
      { shiftType: "M" },
      { shiftType: "D" }, // single trailing rest day after 5+ work
    ];
    expect(initialForcedRestDaysRemaining(tail)).toBe(1);
  });

  it("returns 0 when last shift is not D", () => {
    const tail = [
      { shiftType: "M" },
      { shiftType: "T" },
      { shiftType: "M" },
    ];
    expect(initialForcedRestDaysRemaining(tail)).toBe(0);
  });

  it("returns 0 when trailing D is 2 (rest already complete)", () => {
    const tail = [
      { shiftType: "M" },
      { shiftType: "T" },
      { shiftType: "D" },
      { shiftType: "D" },
    ];
    expect(initialForcedRestDaysRemaining(tail)).toBe(0);
  });

  it("returns 0 for empty tail", () => {
    expect(initialForcedRestDaysRemaining([])).toBe(0);
  });
});

describe("rest-rules — isPostRestDay", () => {
  it("returns true when both previous days were D (2-day post-rest)", () => {
    // isPostRestDay checks if the 2 previous days are both D
    const assignments = [
      { employeeId: "emp1", date: new Date(Date.UTC(2026, 1, 1)), shiftType: "D" },
      { employeeId: "emp1", date: new Date(Date.UTC(2026, 1, 2)), shiftType: "D" },
    ];
    // Feb 3 would be a post-rest day (both Feb 1 and Feb 2 were D)
    expect(isPostRestDay("emp1", new Date(Date.UTC(2026, 1, 3)), assignments)).toBe(true);
  });

  it("returns false when only one previous day was D", () => {
    const assignments = [
      { employeeId: "emp1", date: new Date(Date.UTC(2026, 1, 1)), shiftType: "M" },
      { employeeId: "emp1", date: new Date(Date.UTC(2026, 1, 2)), shiftType: "D" },
    ];
    expect(isPostRestDay("emp1", new Date(Date.UTC(2026, 1, 3)), assignments)).toBe(false);
  });

  it("returns false for a different employee", () => {
    const assignments = [
      { employeeId: "emp2", date: new Date(Date.UTC(2026, 1, 1)), shiftType: "D" },
      { employeeId: "emp2", date: new Date(Date.UTC(2026, 1, 2)), shiftType: "D" },
    ];
    expect(isPostRestDay("emp1", new Date(Date.UTC(2026, 1, 3)), assignments)).toBe(false);
  });
});

describe("rest-rules — countConsecutiveWorkDays", () => {
  it("counts 3 consecutive M/T days", () => {
    const assignments = [
      { employeeId: "emp1", date: new Date(Date.UTC(2026, 0, 1)), shiftType: "D" },
      { employeeId: "emp1", date: new Date(Date.UTC(2026, 0, 2)), shiftType: "M" },
      { employeeId: "emp1", date: new Date(Date.UTC(2026, 0, 3)), shiftType: "T" },
      { employeeId: "emp1", date: new Date(Date.UTC(2026, 0, 4)), shiftType: "M" },
    ];
    // Call from Jan 5 (day after last assignment)
    const result = countConsecutiveWorkDays("emp1", new Date(Date.UTC(2026, 0, 5)), assignments);
    expect(result).toBe(3);
  });

  it("returns 0 when last assignment is rest", () => {
    const assignments = [
      { employeeId: "emp1", date: new Date(Date.UTC(2026, 0, 1)), shiftType: "M" },
      { employeeId: "emp1", date: new Date(Date.UTC(2026, 0, 2)), shiftType: "D" },
    ];
    const result = countConsecutiveWorkDays("emp1", new Date(Date.UTC(2026, 0, 3)), assignments);
    expect(result).toBe(0);
  });

  it("returns 0 for no assignments", () => {
    const result = countConsecutiveWorkDays("emp1", new Date(Date.UTC(2026, 0, 1)), []);
    expect(result).toBe(0);
  });
});
