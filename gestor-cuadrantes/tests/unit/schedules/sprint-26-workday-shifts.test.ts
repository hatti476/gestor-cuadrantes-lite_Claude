/**
 * Sprint 26 — Unit tests for BUG-56, BUG-57, BUG-58
 *
 * BUG-56: weeklyShift not recorded in urgency/equity/soft-target paths
 *         → employee can change M↔T mid-week causing T→M invalid transitions
 * BUG-57: urgency check placed after weekly-consistency guard
 *         → RF-16 hard minimum could be violated when weeklyShift is set;
 *         soft-target steerer had pref guards preventing balance with all-M employees
 * BUG-58: single isolated D days caused by T→M forced transition (consequence of BUG-56)
 */

import { describe, it, expect } from "vitest";
import { pickWorkdayShift } from "@/lib/schedules/workday-shifts";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeEmp(id: string, pref: "M" | "T" | "J" | null = null) {
  return { id, rotationOrder: 0, shiftPreference: pref };
}

function makeState(
  mCount = 0,
  tCount = 0,
  weekShift: Map<string, string> = new Map()
) {
  return { mCount, tCount, weekShift, consecutiveShift: null, consecutiveCount: 0 };
}

// ── CP-163: BUG-56 — weeklyShift recorded in urgency path ─────────────────

describe("CP-163 BUG-56: weeklyShift recorded in urgency path", () => {
  it("records M in weekShift when urgentM fires on first day of week", () => {
    const weekShift = new Map<string, string>();
    const state = makeState(0, 1, weekShift);
    const emp = makeEmp("e1", null);

    const shift = pickWorkdayShift(emp, state, { M: 0, T: 1 }, "2026-W24");

    expect(shift).toBe("M");
    expect(weekShift.get("2026-W24")).toBe("M");
  });

  it("records T in weekShift when urgentT fires on first day of week", () => {
    const weekShift = new Map<string, string>();
    const state = makeState(1, 0, weekShift);
    const emp = makeEmp("e1", null);

    const shift = pickWorkdayShift(emp, state, { M: 1, T: 0 }, "2026-W24");

    expect(shift).toBe("T");
    expect(weekShift.get("2026-W24")).toBe("T");
  });

  it("records M/T in weekShift in equity path (both urgent, no deferShift)", () => {
    const weekShift = new Map<string, string>();
    const state = makeState(0, 0, weekShift);
    const emp = makeEmp("e1", null);

    const shift = pickWorkdayShift(emp, state, { M: 0, T: 0 }, "2026-W24");

    expect(["M", "T"]).toContain(shift);
    expect(weekShift.get("2026-W24")).toBe(shift);
  });

  it("records M/T in weekShift in soft-target path (only soft need)", () => {
    const weekShift = new Map<string, string>();
    // M already has 2, T only has 1 → softNeedT
    const state = makeState(2, 1, weekShift);
    const emp = makeEmp("e1", null);

    const shift = pickWorkdayShift(emp, state, { M: 2, T: 1 }, "2026-W24");

    expect(shift).toBe("T");
    expect(weekShift.get("2026-W24")).toBe("T");
  });

  it("records M in weekShift in preference path (pref=M, coverage met)", () => {
    const weekShift = new Map<string, string>();
    const state = makeState(2, 2, weekShift);
    const emp = makeEmp("e1", "M");

    const shift = pickWorkdayShift(emp, state, { M: 2, T: 2 }, "2026-W24");

    expect(shift).toBe("M");
    expect(weekShift.get("2026-W24")).toBe("M");
  });

  it("records T in weekShift in equity fallback path (mCount > tCount)", () => {
    const weekShift = new Map<string, string>();
    const state = makeState(3, 2, weekShift);
    const emp = makeEmp("e1", null);

    const shift = pickWorkdayShift(emp, state, { M: 2, T: 2 }, "2026-W24");

    expect(shift).toBe("T");
    expect(weekShift.get("2026-W24")).toBe("T");
  });

  it("does NOT change weekShift once it has been set (consecutive days stay consistent)", () => {
    const weekShift = new Map<string, string>([["2026-W24", "M"]]);
    const state = makeState(1, 1, weekShift);
    const emp = makeEmp("e1", null);

    // Second day of week — should return M (weekly consistency)
    const shift = pickWorkdayShift(emp, state, { M: 1, T: 1 }, "2026-W24");

    expect(shift).toBe("M");
    expect(weekShift.get("2026-W24")).toBe("M"); // unchanged
  });
});

// ── CP-164: BUG-57 — RF-16 hard minimum overrides weekly consistency ───────

describe("CP-164 BUG-57: urgentT overrides M-locked weekly shift (M→T valid)", () => {
  it("switches a M-locked employee to T when urgentT fires", () => {
    // Employee was assigned M on Monday → weeklyShift = "M"
    const weekShift = new Map<string, string>([["2026-W24", "M"]]);
    const state = makeState(3, 0, weekShift);
    const emp = makeEmp("e1", "M");

    // Wednesday: 3M already assigned, 0T → urgentT
    const shift = pickWorkdayShift(emp, state, { M: 3, T: 0 }, "2026-W24");

    expect(shift).toBe("T");
    // weekShift must be updated so remaining days this week stay T
    expect(weekShift.get("2026-W24")).toBe("T");
  });

  it("does NOT switch a T-locked employee to M (T→M would be invalid 8h gap)", () => {
    // Employee was assigned T on Monday → weeklyShift = "T"
    const weekShift = new Map<string, string>([["2026-W24", "T"]]);
    const state = makeState(0, 3, weekShift);
    const emp = makeEmp("e1", "T");

    // Wednesday: 0M already, urgentM — but T→M is invalid, must stay T
    const shift = pickWorkdayShift(emp, state, { M: 0, T: 3 }, "2026-W24");

    expect(shift).toBe("T");
    expect(weekShift.get("2026-W24")).toBe("T"); // unchanged
  });
});

// ── CP-165: BUG-57 — soft target steerer overrides M-preference for balance

describe("CP-165 BUG-57: soft target steerer overrides preference for 2+2 balance", () => {
  it("assigns T to a M-pref employee when softNeedT && !softNeedM", () => {
    const weekShift = new Map<string, string>();
    // 2M already, 1T → softNeedT is true, softNeedM is false
    const state = makeState(2, 1, weekShift);
    const emp = makeEmp("e1", "M");

    const shift = pickWorkdayShift(emp, state, { M: 2, T: 1 }, "2026-W24");

    expect(shift).toBe("T");
    expect(weekShift.get("2026-W24")).toBe("T");
  });

  it("assigns M to a T-pref employee when softNeedM && !softNeedT", () => {
    const weekShift = new Map<string, string>();
    // 1M, 2T already → softNeedM is true, softNeedT is false
    const state = makeState(1, 2, weekShift);
    const emp = makeEmp("e1", "T");

    const shift = pickWorkdayShift(emp, state, { M: 1, T: 2 }, "2026-W24");

    expect(shift).toBe("M");
    expect(weekShift.get("2026-W24")).toBe("M");
  });

  it("distributes 4 M-pref employees into 2M+2T when no weeklyShift set", () => {
    const wKey = "2026-W24";
    const weekShifts = [
      new Map<string, string>(),
      new Map<string, string>(),
      new Map<string, string>(),
      new Map<string, string>(),
    ];

    const emps = [
      makeEmp("e1", "M"),
      makeEmp("e2", "M"),
      makeEmp("e3", "M"),
      makeEmp("e4", "M"),
    ];

    const cov = { M: 0, T: 0 };
    const counts = { M: 0, T: 0 };

    for (let i = 0; i < 4; i++) {
      const state = makeState(counts.M, counts.T, weekShifts[i]);
      const shift = pickWorkdayShift(emps[i], state, { ...cov }, wKey);
      cov[shift as "M" | "T"]++;
      counts[shift as "M" | "T"]++;
    }

    // With 4 M-pref employees the soft target steerer should produce ≥2M and ≥2T
    expect(cov.M).toBeGreaterThanOrEqual(2);
    expect(cov.T).toBeGreaterThanOrEqual(2);
  });
});

// ── CP-166: BUG-58 — no spurious M↔T changes within a week ───────────────

describe("CP-166 BUG-58: weekly consistency prevents mid-week shift changes", () => {
  it("employee stays on M all week once Monday is assigned M", () => {
    const wKey = "2026-W24";
    const weekShift = new Map<string, string>();
    const emp = makeEmp("e1", null);

    // Monday: first assignment
    const mon = pickWorkdayShift(emp, makeState(0, 1, weekShift), { M: 0, T: 1 }, wKey);
    expect(mon).toBe("M");

    // Tuesday–Friday: should all return M (weekly consistency)
    for (let d = 0; d < 4; d++) {
      const shift = pickWorkdayShift(emp, makeState(1, 1, weekShift), { M: 1, T: 1 }, wKey);
      expect(shift).toBe("M");
    }
  });

  it("employee stays on T all week once Monday is assigned T", () => {
    const wKey = "2026-W25";
    const weekShift = new Map<string, string>();
    const emp = makeEmp("e1", null);

    // Monday
    const mon = pickWorkdayShift(emp, makeState(1, 0, weekShift), { M: 1, T: 0 }, wKey);
    expect(mon).toBe("T");

    // Tuesday–Friday
    for (let d = 0; d < 4; d++) {
      const shift = pickWorkdayShift(emp, makeState(1, 1, weekShift), { M: 1, T: 1 }, wKey);
      expect(shift).toBe("T");
    }
  });
});
