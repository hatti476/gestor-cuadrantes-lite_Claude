/**
 * Unit tests for lib/schedules/date-utils.ts
 * Sprint 20 — Task 5: Tests for extracted modules
 */

import { describe, it, expect } from "vitest";
import {
  isWeekend,
  toDateStr,
  fromDateStr,
  addDays,
  isWeekendOrHoliday,
  normalizeShift,
  weekKey,
  applySpecialDayRule,
} from "../../../lib/schedules/date-utils";

describe("date-utils — isWeekend", () => {
  it("Saturday is weekend", () => {
    expect(isWeekend(new Date(Date.UTC(2026, 0, 3)))).toBe(true); // Jan 3 2026 = Saturday
  });
  it("Sunday is weekend", () => {
    expect(isWeekend(new Date(Date.UTC(2026, 0, 4)))).toBe(true); // Jan 4 2026 = Sunday
  });
  it("Monday is not weekend", () => {
    expect(isWeekend(new Date(Date.UTC(2026, 0, 5)))).toBe(false);
  });
  it("Friday is not weekend", () => {
    expect(isWeekend(new Date(Date.UTC(2026, 0, 9)))).toBe(false);
  });
});

describe("date-utils — toDateStr / fromDateStr", () => {
  it("toDateStr produces YYYY-MM-DD", () => {
    expect(toDateStr(new Date(Date.UTC(2026, 0, 1)))).toBe("2026-01-01");
  });
  it("fromDateStr returns UTC midnight", () => {
    const d = fromDateStr("2026-03-15");
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(2); // 0-indexed
    expect(d.getUTCDate()).toBe(15);
    expect(d.getUTCHours()).toBe(0);
  });
  it("round-trip is identity", () => {
    const original = "2026-07-22";
    expect(toDateStr(fromDateStr(original))).toBe(original);
  });
});

describe("date-utils — addDays", () => {
  it("adds positive days", () => {
    const d = new Date(Date.UTC(2026, 0, 30));
    expect(toDateStr(addDays(d, 2))).toBe("2026-02-01");
  });
  it("subtracts negative days", () => {
    const d = new Date(Date.UTC(2026, 1, 1));
    expect(toDateStr(addDays(d, -1))).toBe("2026-01-31");
  });
  it("addDays(d, 0) is same day", () => {
    const d = new Date(Date.UTC(2026, 4, 15));
    expect(toDateStr(addDays(d, 0))).toBe("2026-05-15");
  });
});

describe("date-utils — isWeekendOrHoliday", () => {
  it("Saturday is weekend-or-holiday", () => {
    expect(isWeekendOrHoliday(new Date(Date.UTC(2026, 0, 3)), new Set())).toBe(true);
  });
  it("weekday is not weekend-or-holiday without holidays", () => {
    expect(isWeekendOrHoliday(new Date(Date.UTC(2026, 0, 5)), new Set())).toBe(false);
  });
  it("weekday holiday adjacent to Saturday is weekend-or-holiday", () => {
    // Jan 2 2026 is Friday, adjacent to Saturday Jan 3 → should be true
    const d = new Date(Date.UTC(2026, 0, 2)); // Friday
    expect(isWeekendOrHoliday(d, new Set(["2026-01-02"]))).toBe(true);
  });
  it("isolated midweek holiday is not weekend-or-holiday", () => {
    // Jan 7 2026 is Wednesday, isolated holiday (no adjacent weekend)
    const d = new Date(Date.UTC(2026, 0, 7)); // Wednesday
    expect(isWeekendOrHoliday(d, new Set(["2026-01-07"]))).toBe(false);
  });
});

describe("date-utils — normalizeShift", () => {
  it("M → M", () => expect(normalizeShift("M")).toBe("M"));
  it("T → T", () => expect(normalizeShift("T")).toBe("T"));
  it("N → N", () => expect(normalizeShift("N")).toBe("N"));
  it("D → D", () => expect(normalizeShift("D")).toBe("D"));
  it("MF → M", () => expect(normalizeShift("MF")).toBe("M"));
  it("TF → T", () => expect(normalizeShift("TF")).toBe("T"));
  it("NF → N", () => expect(normalizeShift("NF")).toBe("N"));
  it("MN → M", () => expect(normalizeShift("MN")).toBe("M"));
  it("TN → T", () => expect(normalizeShift("TN")).toBe("T"));
  it("NN → N", () => expect(normalizeShift("NN")).toBe("N"));
  it("V → V", () => expect(normalizeShift("V")).toBe("V"));
  it("B → B", () => expect(normalizeShift("B")).toBe("B"));
  it("J → J", () => expect(normalizeShift("J")).toBe("J"));
  it("unknown shift passes through unchanged", () => expect(normalizeShift("X")).toBe("X"));
});

describe("date-utils — weekKey", () => {
  it("returns the ISO week Monday date string", () => {
    // Jan 7 2026 is Wednesday → Monday of that week is Jan 5
    const wk = weekKey(new Date(Date.UTC(2026, 0, 7)));
    expect(wk).toBe("2026-01-05");
  });
  it("Monday weekKey equals itself", () => {
    // Jan 5 2026 is Monday
    const wk = weekKey(new Date(Date.UTC(2026, 0, 5)));
    expect(wk).toBe("2026-01-05");
  });
  it("Sunday weekKey goes back 6 days", () => {
    // Jan 11 2026 is Sunday
    const wk = weekKey(new Date(Date.UTC(2026, 0, 11)));
    expect(wk).toBe("2026-01-05");
  });
});

describe("date-utils — applySpecialDayRule", () => {
  it("returns shift unchanged on normal workday", () => {
    const d = new Date(Date.UTC(2026, 2, 10)); // Tuesday March 10
    expect(applySpecialDayRule("M", d, new Set())).toBe("M");
  });
  it("converts M to MF on Saturday", () => {
    const d = new Date(Date.UTC(2026, 0, 3)); // Saturday
    expect(applySpecialDayRule("M", d, new Set())).toBe("MF");
  });
  it("converts T to TF on Sunday", () => {
    const d = new Date(Date.UTC(2026, 0, 4)); // Sunday
    expect(applySpecialDayRule("T", d, new Set())).toBe("TF");
  });
  it("converts M to MF on holiday weekday", () => {
    const d = new Date(Date.UTC(2026, 0, 6)); // Tuesday (Reyes)
    expect(applySpecialDayRule("M", d, new Set(["2026-01-06"]))).toBe("MF");
  });
});
