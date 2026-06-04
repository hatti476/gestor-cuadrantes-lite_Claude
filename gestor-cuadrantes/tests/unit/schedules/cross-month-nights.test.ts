/**
 * Unit tests for applyCrossMonthNightBlocks (BUG-48 fix).
 *
 * Scenario: rotation order changes between months. An employee (A) had
 * trailing nights at end of previous month. The new rotation assigns a
 * different employee (B) to cover the start of the current month.
 *
 * Expected: cross-month continuation for A is skipped when A already has
 * a new-rotation night block in nightPlan within the continuation+rest window.
 * B's legitimately-assigned N's must NOT be deleted.
 */

import { describe, expect, it } from "vitest";
import { applyCrossMonthNightBlocks } from "@/lib/schedules/cross-month";

type PrevMonthTailEntry = { employeeId: string; date: string; shiftType: string };

/** Build nightPlan entries for an employee starting from a given date. */
function buildNights(
  empId: string,
  startDate: Date,
  count: number
): Map<string, string> {
  const map = new Map<string, string>();
  for (let i = 0; i < count; i++) {
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + i);
    const ds = d.toISOString().slice(0, 10);
    map.set(`${empId}|${ds}`, "N");
  }
  return map;
}

describe("applyCrossMonthNightBlocks – BUG-48: consecutive nights with rotation change", () => {
  const year = 2026;
  const month = 6; // June

  it("skips cross-month continuation when employee already has a new-rotation night block in nightPlan", () => {
    // Employee A had 3 trailing nights at end of May (→ 4 nights needed to complete block)
    const prevMonthTail: PrevMonthTailEntry[] = [
      { employeeId: "A", date: "2026-05-29", shiftType: "N" },
      { employeeId: "A", date: "2026-05-30", shiftType: "N" },
      { employeeId: "A", date: "2026-05-31", shiftType: "N" },
    ];

    // nightPlan already has A's new-rotation block starting June 5.
    const nightPlan = new Map<string, string>();
    // Employee B covers June 1–7 (assigned by new rotation).
    for (const entry of buildNights("B", new Date("2026-06-01T00:00:00.000Z"), 7)) {
      nightPlan.set(entry[0], entry[1]);
    }
    // Employee A has a new block starting June 5 (within the continuation+rest window).
    for (const entry of buildNights("A", new Date("2026-06-05T00:00:00.000Z"), 7)) {
      nightPlan.set(entry[0], entry[1]);
    }

    const existingDates = new Set<string>();
    const crossMonthRestDates = new Set<string>();

    applyCrossMonthNightBlocks(prevMonthTail, year, month, existingDates, nightPlan, crossMonthRestDates);

    // A must NOT have nights on June 1–4 (cross-month continuation should be skipped).
    expect(nightPlan.get("A|2026-06-01")).toBeUndefined();
    expect(nightPlan.get("A|2026-06-02")).toBeUndefined();
    expect(nightPlan.get("A|2026-06-03")).toBeUndefined();
    expect(nightPlan.get("A|2026-06-04")).toBeUndefined();

    // A's new rotation block on June 5–11 must be intact.
    expect(nightPlan.get("A|2026-06-05")).toBe("N");
    expect(nightPlan.get("A|2026-06-11")).toBe("N");

    // B's legitimately-assigned nights on June 1–4 must NOT be deleted.
    expect(nightPlan.get("B|2026-06-01")).toBe("N");
    expect(nightPlan.get("B|2026-06-04")).toBe("N");
  });

  it("applies cross-month continuation normally when no new block exists for the employee", () => {
    // Employee A had 5 trailing nights at end of May (→ 2 nights needed).
    const prevMonthTail: PrevMonthTailEntry[] = [
      { employeeId: "A", date: "2026-05-27", shiftType: "N" },
      { employeeId: "A", date: "2026-05-28", shiftType: "N" },
      { employeeId: "A", date: "2026-05-29", shiftType: "N" },
      { employeeId: "A", date: "2026-05-30", shiftType: "N" },
      { employeeId: "A", date: "2026-05-31", shiftType: "N" },
    ];

    const nightPlan = new Map<string, string>();
    const existingDates = new Set<string>();
    const crossMonthRestDates = new Set<string>();

    applyCrossMonthNightBlocks(prevMonthTail, year, month, existingDates, nightPlan, crossMonthRestDates);

    // A should get 2 continuation nights (June 1–2) + 3 post-rest D (June 3–5).
    expect(nightPlan.get("A|2026-06-01")).toBe("N");
    expect(nightPlan.get("A|2026-06-02")).toBe("N");
    expect(nightPlan.get("A|2026-06-03")).toBe("D");
    expect(nightPlan.get("A|2026-06-04")).toBe("D");
    expect(nightPlan.get("A|2026-06-05")).toBe("D");
    // June 6+ must NOT be set by cross-month logic.
    expect(nightPlan.get("A|2026-06-06")).toBeUndefined();
  });

  it("does not delete rotation-assigned N's from employees who have no cross-month trailing nights", () => {
    // Employee A had 6 trailing nights → needs 1 more continuation night.
    // B has NO trailing nights but has a rotation-assigned block in nightPlan.
    // The continuation slots for A (June 1) must NOT displace B's rotation N.
    const prevMonthTail: PrevMonthTailEntry[] = [
      { employeeId: "A", date: "2026-05-26", shiftType: "N" },
      { employeeId: "A", date: "2026-05-27", shiftType: "N" },
      { employeeId: "A", date: "2026-05-28", shiftType: "N" },
      { employeeId: "A", date: "2026-05-29", shiftType: "N" },
      { employeeId: "A", date: "2026-05-30", shiftType: "N" },
      { employeeId: "A", date: "2026-05-31", shiftType: "N" },
    ];

    const nightPlan = new Map<string, string>();
    // B has no trailing nights but rotation assigns them June 2–8.
    for (const entry of buildNights("B", new Date("2026-06-02T00:00:00.000Z"), 7)) {
      nightPlan.set(entry[0], entry[1]);
    }
    // June 1 is free for A's continuation night.

    const existingDates = new Set<string>();
    const crossMonthRestDates = new Set<string>();

    applyCrossMonthNightBlocks(prevMonthTail, year, month, existingDates, nightPlan, crossMonthRestDates);

    // A should get June 1 as continuation night.
    expect(nightPlan.get("A|2026-06-01")).toBe("N");
    // B's rotation block on June 2–8 must be untouched.
    expect(nightPlan.get("B|2026-06-02")).toBe("N");
    expect(nightPlan.get("B|2026-06-08")).toBe("N");
  });
});
