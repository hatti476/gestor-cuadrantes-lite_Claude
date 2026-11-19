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
  EXTRA_PAY_RATES,
  isRestOnlyDay,
  validateRestOnlyShift,
  countLaborableDays,
  countOccupiedDays,
  balanceColorClass,
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

describe("EXTRA_PAY_RATES (SPEC-012 AC-19: subida +20%)", () => {
  it("refleja las tarifas vigentes desde Sprint-06", () => {
    expect(EXTRA_PAY_RATES).toEqual({
      MF: 39.6,
      TF: 39.6,
      N: 46.2,
      NF: 59.4,
      MN: 151.8,
      TN: 151.8,
      NN: 151.8,
    });
  });
});

describe("calculateExtraPay (SPEC-012 AC-19/21: tarifas +20%)", () => {
  it("empleado sin turnos extra devuelve 0 €", () => {
    expect(calculateExtraPay({ M: 10, T: 8, D: 4 })).toBe(0);
  });

  it("calcula solo turnos MF a 39,6 €", () => {
    expect(calculateExtraPay({ MF: 3 })).toBeCloseTo(118.8, 2);
  });

  it("calcula solo turnos N a 46,2 €", () => {
    expect(calculateExtraPay({ N: 4 })).toBeCloseTo(184.8, 2);
  });

  it("calcula combinación de MF, TF, N y NF", () => {
    expect(calculateExtraPay({ MF: 2, TF: 1, N: 7, NF: 1 })).toBeCloseTo(501.6, 2);
  });

  it("mantiene decimales correctamente", () => {
    expect(calculateExtraPay({ N: 1, NF: 1 })).toBeCloseTo(105.6, 2);
  });

  it("calcula turnos especiales de Navidad a 151,8 €", () => {
    expect(calculateExtraPay({ MN: 1, TN: 1, NN: 1 })).toBeCloseTo(455.4, 2);
  });

  it("calcula complementos ordinarios y navideños juntos", () => {
    expect(calculateExtraPay({ MF: 1, TF: 1, N: 1, NF: 1, MN: 1 })).toBeCloseTo(336.6, 2);
  });
});

describe("isRestOnlyDay (SPEC-012 AC-12/14/15)", () => {
  it("sábado es weekend", () => {
    expect(isRestOnlyDay(new Date("2026-05-16"), false)).toBe(true);
  });

  it("domingo es weekend", () => {
    expect(isRestOnlyDay(new Date("2026-05-17"), false)).toBe(true);
  });

  it("festivo entre semana cuenta como weekend/festivo", () => {
    expect(isRestOnlyDay(new Date("2026-05-01"), true)).toBe(true);
  });

  it("día de semana no festivo no cuenta", () => {
    expect(isRestOnlyDay(new Date("2026-05-15"), false)).toBe(false);
  });
});

describe("validateRestOnlyShift (SPEC-012 AC-12/13/14/15)", () => {
  it("rechaza V en sábado", () => {
    const result = validateRestOnlyShift("V", new Date("2026-05-16"), false);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/descanso/i);
  });

  it("rechaza B en domingo", () => {
    const result = validateRestOnlyShift("B", new Date("2026-05-17"), false);
    expect(result.valid).toBe(false);
  });

  it("rechaza V en festivo entre semana", () => {
    const result = validateRestOnlyShift("V", new Date("2026-05-01"), true);
    expect(result.valid).toBe(false);
  });

  it("permite D en sábado", () => {
    expect(validateRestOnlyShift("D", new Date("2026-05-16"), false).valid).toBe(true);
  });

  it("permite V en día de semana no festivo", () => {
    expect(validateRestOnlyShift("V", new Date("2026-05-15"), false).valid).toBe(true);
  });

  it("permite B en día de semana no festivo", () => {
    expect(validateRestOnlyShift("B", new Date("2026-05-15"), false).valid).toBe(true);
  });

  it("no afecta a turnos M/T/N/J en festivo o fin de semana", () => {
    expect(validateRestOnlyShift("M", new Date("2026-05-16"), false).valid).toBe(true);
    expect(validateRestOnlyShift("N", new Date("2026-05-01"), true).valid).toBe(true);
  });
});

describe("countLaborableDays (SPEC-014 AC-01)", () => {
  it("mes sin festivos cuenta solo días entre semana", () => {
    expect(countLaborableDays(2026, 2, new Set())).toBe(20); // febrero 2026, 28 días
  });

  it("festivo en fin de semana no resta doble (ya era fin de semana)", () => {
    expect(countLaborableDays(2026, 8, new Set())).toBe(21); // agosto 2026 sin festivos
    expect(countLaborableDays(2026, 8, new Set(["2026-08-15"]))).toBe(21); // 15 agosto = sábado
  });

  it("festivo en día laborable resta un día más", () => {
    expect(countLaborableDays(2026, 5, new Set())).toBe(21); // mayo 2026 sin festivos
    expect(countLaborableDays(2026, 5, new Set(["2026-05-01"]))).toBe(20); // 1 mayo = viernes
  });

  it("ignora festivos que no caen en el mes consultado", () => {
    expect(countLaborableDays(2026, 2, new Set(["2026-05-01", "2026-08-15"]))).toBe(20);
  });

  it("resta también un festivo local añadido a mano por el ADMIN (no solo los nacionales precargados)", () => {
    // "2026-05-15" (San Isidro) no está en el seed de festivos nacionales — llega vía
    // POST /api/holidays, pero se guarda en la misma tabla Holiday sin distinción de origen.
    expect(countLaborableDays(2026, 5, new Set(["2026-05-15"]))).toBe(20);
  });

  it("combina festivo nacional y festivo local añadido a mano en el mismo mes", () => {
    expect(countLaborableDays(2026, 5, new Set(["2026-05-01", "2026-05-15"]))).toBe(19);
  });
});

describe("countOccupiedDays (SPEC-014 AC-02)", () => {
  it("cuenta todo excepto D", () => {
    expect(countOccupiedDays(["M", "M", "T", "N", "D", "D", "V", "B"])).toBe(6);
  });

  it("devuelve 0 si la lista es solo D", () => {
    expect(countOccupiedDays(["D", "D", "D"])).toBe(0);
  });

  it("devuelve 0 para lista vacía", () => {
    expect(countOccupiedDays([])).toBe(0);
  });

  it("cuenta las variantes de festivo y Navidad igual que un turno normal", () => {
    expect(countOccupiedDays(["MF", "TF", "NF", "MN", "TN", "NN", "D"])).toBe(6);
  });
});

describe("diferencia mensual = jornadas ocupadas - laborables (SPEC-014 AC-03)", () => {
  it("menos jornadas ocupadas que laborables da diferencia negativa", () => {
    const shifts = [...Array(18).fill("M"), ...Array(13).fill("D")]; // 31 días, 18 ocupados
    const laborable = countLaborableDays(2026, 5, new Set(["2026-05-01"])); // 20
    expect(countOccupiedDays(shifts) - laborable).toBe(-2);
  });

  it("jornadas ocupadas igual a laborables da diferencia 0", () => {
    const shifts = [...Array(21).fill("M"), ...Array(10).fill("D")]; // 31 días, 21 ocupados
    const laborable = countLaborableDays(2026, 8, new Set(["2026-08-15"])); // 21
    expect(countOccupiedDays(shifts) - laborable).toBe(0);
  });
});

describe("balanceColorClass (SPEC-014 AC-06)", () => {
  it("negativo → rojo", () => {
    expect(balanceColorClass(-1)).toBe("text-red-700");
  });

  it("cero → verde", () => {
    expect(balanceColorClass(0)).toBe("text-green-700");
  });

  it("positivo → verde", () => {
    expect(balanceColorClass(3)).toBe("text-green-700");
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
    ["TN", "M", 8],
    ["TN", "MF", 8],
    ["TN", "MN", 8],
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
    ["T", "N", 24],
    ["T", "NF", 24],
    ["TF", "N", 24],
    ["TF", "NF", 24],
    ["N", "N", 16],
    ["NF", "NF", 16],
    ["MN", "TN", 24],
    ["TN", "TN", 16],
    ["TN", "N", 24],
    ["TN", "NF", 24],
    ["TN", "NN", 24],
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
