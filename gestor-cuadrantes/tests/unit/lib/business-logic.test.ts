import { describe, it, expect } from "vitest";
import {
  isValidShiftType,
  normalizeToUTCMidnight,
  getMonthRange,
  countShifts,
  validateScheduleBody,
} from "@/lib/schedules/business-logic";

describe("isValidShiftType", () => {
  it("acepta los 7 tipos principales", () => {
    ["M", "T", "N", "J", "D", "V", "B"].forEach((t) =>
      expect(isValidShiftType(t)).toBe(true)
    );
  });

  it("acepta los 3 tipos de fin de semana", () => {
    ["MF", "TF", "NF"].forEach((t) => expect(isValidShiftType(t)).toBe(true));
  });

  it("rechaza tipos desconocidos", () => {
    expect(isValidShiftType("X")).toBe(false);
    expect(isValidShiftType("")).toBe(false);
    expect(isValidShiftType("mañana")).toBe(false);
  });
});

describe("normalizeToUTCMidnight", () => {
  it("fija la hora a 00:00:00 UTC", () => {
    const d = new Date("2026-05-09T15:30:00Z");
    const normalized = normalizeToUTCMidnight(d);
    expect(normalized.getUTCHours()).toBe(0);
    expect(normalized.getUTCMinutes()).toBe(0);
    expect(normalized.getUTCSeconds()).toBe(0);
  });

  it("no modifica la fecha original (inmutabilidad)", () => {
    const original = new Date("2026-05-09T15:30:00Z");
    normalizeToUTCMidnight(original);
    expect(original.getUTCHours()).toBe(15);
  });
});

describe("getMonthRange", () => {
  it("mayo 2026 va del 1 al 31 inclusive", () => {
    const { start, end } = getMonthRange(2026, 5);
    expect(start).toEqual(new Date(2026, 4, 1));
    expect(end).toEqual(new Date(2026, 5, 1));
  });

  it("diciembre 2026 termina en enero 2027", () => {
    const { end } = getMonthRange(2026, 12);
    expect(end).toEqual(new Date(2027, 0, 1));
  });
});

describe("countShifts", () => {
  it("cuenta correctamente cada tipo", () => {
    const result = countShifts(["M", "M", "T", "N", "M", "D"]);
    expect(result).toEqual({ M: 3, T: 1, N: 1, D: 1 });
  });

  it("devuelve objeto vacío para array vacío", () => {
    expect(countShifts([])).toEqual({});
  });
});

describe("validateScheduleBody", () => {
  it("valida un body correcto", () => {
    const result = validateScheduleBody({
      employeeId: "emp-1",
      date: "2026-05-09",
      shiftType: "M",
    });
    expect(result.valid).toBe(true);
    expect(result.employeeId).toBe("emp-1");
    expect(result.shiftType).toBe("M");
    expect(result.date).toBeInstanceOf(Date);
  });

  it("rechaza body sin campos", () => {
    expect(validateScheduleBody(null).valid).toBe(false);
    expect(validateScheduleBody({}).valid).toBe(false);
  });

  it("rechaza shiftType inválido", () => {
    const result = validateScheduleBody({
      employeeId: "emp-1",
      date: "2026-05-09",
      shiftType: "X",
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("inválido");
  });

  it("rechaza fecha inválida", () => {
    const result = validateScheduleBody({
      employeeId: "emp-1",
      date: "no-es-fecha",
      shiftType: "M",
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("fecha");
  });

  it("rechaza employeeId vacío", () => {
    const result = validateScheduleBody({
      employeeId: "  ",
      date: "2026-05-09",
      shiftType: "M",
    });
    expect(result.valid).toBe(false);
  });
});
