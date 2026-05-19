import { describe, it, expect } from "vitest";
import {
  isValidShiftType,
  normalizeToUTCMidnight,
  getMonthRange,
  countShifts,
  validateScheduleBody,
  applyHolidayRule,
  removeHolidayRule,
  validateShiftTransition,
  calculateExtraPay,
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

  it("acepta los 3 tipos especiales de Navidad", () => {
    ["MN", "TN", "NN"].forEach((t) => expect(isValidShiftType(t)).toBe(true));
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

describe("calculateExtraPay", () => {
  it("empleado sin turnos extra devuelve 0 €", () => {
    expect(calculateExtraPay({ M: 10, T: 8, D: 4 })).toBe(0);
  });

  it("calcula solo turnos MF a 33 €", () => {
    expect(calculateExtraPay({ MF: 3 })).toBe(99);
  });

  it("calcula solo turnos N a 38,5 €", () => {
    expect(calculateExtraPay({ N: 4 })).toBe(154);
  });

  it("calcula combinación de MF, TF, N y NF", () => {
    expect(calculateExtraPay({ MF: 2, TF: 1, N: 7, NF: 1 })).toBe(418);
  });

  it("mantiene decimales correctamente", () => {
    expect(calculateExtraPay({ N: 1, NF: 1 })).toBe(88);
  });

  it("calcula turnos especiales de Navidad a 126,5 €", () => {
    expect(calculateExtraPay({ MN: 1, TN: 1, NN: 1 })).toBe(379.5);
  });

  it("calcula complementos ordinarios y navideños juntos", () => {
    expect(calculateExtraPay({ MF: 1, TF: 1, N: 1, NF: 1, MN: 1 })).toBe(280.5);
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

describe("applyHolidayRule", () => {
  it("M → MF cuando el día actual es festivo", () => {
    expect(applyHolidayRule("M", true, false)).toBe("MF");
  });

  it("T → TF cuando el día actual es festivo", () => {
    expect(applyHolidayRule("T", true, false)).toBe("TF");
  });

  it("N → NF cuando el día SIGUIENTE es festivo", () => {
    expect(applyHolidayRule("N", false, true)).toBe("NF");
  });

  it("N NO cambia si solo el día actual es festivo (no el siguiente)", () => {
    expect(applyHolidayRule("N", true, false)).toBe("N");
  });

  it("D no cambia aunque el día sea festivo", () => {
    expect(applyHolidayRule("D", true, true)).toBe("D");
  });

  it("M no cambia si el día no es festivo", () => {
    expect(applyHolidayRule("M", false, false)).toBe("M");
  });

  it("T no cambia si el día no es festivo", () => {
    expect(applyHolidayRule("T", false, false)).toBe("T");
  });

  it("N no cambia si ni hoy ni mañana son festivos", () => {
    expect(applyHolidayRule("N", false, false)).toBe("N");
  });
});

describe("removeHolidayRule", () => {
  it("MF → M", () => expect(removeHolidayRule("MF")).toBe("M"));
  it("TF → T", () => expect(removeHolidayRule("TF")).toBe("T"));
  it("NF → N", () => expect(removeHolidayRule("NF")).toBe("N"));
  it("MN → M", () => expect(removeHolidayRule("MN")).toBe("M"));
  it("TN → T", () => expect(removeHolidayRule("TN")).toBe("T"));
  it("NN → N", () => expect(removeHolidayRule("NN")).toBe("N"));
  it("M no cambia", () => expect(removeHolidayRule("M")).toBe("M"));
  it("D no cambia", () => expect(removeHolidayRule("D")).toBe("D"));
});

describe("validateShiftTransition", () => {
  it.each([
    ["T", "M", 8],
    ["T", "MF", 8],
    ["TF", "M", 8],
    ["TF", "MF", 8],
    ["N", "T", 8],
    ["N", "TF", 8],
    ["N", "M", 0],
    ["N", "MF", 0],
    ["NF", "T", 8],
    ["NF", "TF", 8],
    ["NF", "M", 0],
    ["NF", "MF", 0],
    ["T", "N", 0],
    ["T", "NF", 0],
    ["TF", "N", 0],
    ["TF", "NF", 0],
    ["TN", "M", 8],
    ["TN", "MF", 8],
    ["TN", "MN", 8],
    ["TN", "N", 0],
    ["TN", "NF", 0],
    ["TN", "NN", 0],
    ["NN", "M", 0],
    ["NN", "MF", 0],
    ["NN", "MN", 0],
    ["NN", "T", 8],
    ["NN", "TF", 8],
    ["NN", "TN", 8],
  ] as const)("prohíbe %s → %s por dejar %ih de descanso", (prevShift, nextShift, hoursGap) => {
    expect(validateShiftTransition(prevShift, nextShift)).toEqual({ valid: false, hoursGap });
  });

  it.each([
    ["M", "M", 16],
    ["M", "T", 24],
    ["M", "N", 32],
    ["MF", "TF", 24],
    ["T", "T", 16],
    ["N", "N", 16],
    ["NF", "NF", 16],
    ["MN", "TN", 24],
    ["TN", "TN", 16],
    ["NN", "NN", 16],
  ] as const)("permite %s → %s con al menos 12h de descanso", (prevShift, nextShift, hoursGap) => {
    expect(validateShiftTransition(prevShift, nextShift)).toEqual({ valid: true, hoursGap });
  });

  it("permite transiciones hacia descanso o sin turno anterior", () => {
    expect(validateShiftTransition(null, "M")).toEqual({ valid: true, hoursGap: 24 });
    expect(validateShiftTransition("N", "D")).toEqual({ valid: true, hoursGap: 24 });
    expect(validateShiftTransition("T", "V")).toEqual({ valid: true, hoursGap: 24 });
  });
});
