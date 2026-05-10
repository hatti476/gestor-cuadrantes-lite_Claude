import { describe, it, expect } from "vitest";
import {
  BASE_PATTERN,
  PATTERN_LENGTH,
  EPOCH_DATE,
  patternIndexForDate,
  shiftForEmployee,
  generateMonthSchedule,
} from "@/lib/schedules/generate";

describe("BASE_PATTERN", () => {
  it("tiene exactamente 21 elementos", () => {
    expect(BASE_PATTERN).toHaveLength(21);
  });

  it("contiene solo tipos de turno válidos", () => {
    const valid = new Set(["M", "T", "N", "D"]);
    BASE_PATTERN.forEach((s) => expect(valid.has(s)).toBe(true));
  });

  it("sigue la estructura M×5 D×2 T×5 D×2 N×5 D×2", () => {
    expect(BASE_PATTERN.slice(0, 5)).toEqual(["M", "M", "M", "M", "M"]);
    expect(BASE_PATTERN.slice(5, 7)).toEqual(["D", "D"]);
    expect(BASE_PATTERN.slice(7, 12)).toEqual(["T", "T", "T", "T", "T"]);
    expect(BASE_PATTERN.slice(12, 14)).toEqual(["D", "D"]);
    expect(BASE_PATTERN.slice(14, 19)).toEqual(["N", "N", "N", "N", "N"]);
    expect(BASE_PATTERN.slice(19, 21)).toEqual(["D", "D"]);
  });
});

describe("patternIndexForDate", () => {
  it("el primer día de la época con offset 0 da índice 0", () => {
    expect(patternIndexForDate(EPOCH_DATE, 0)).toBe(0);
  });

  it("el día 21 vuelve al índice 0 (ciclo completo)", () => {
    const day21 = new Date("2026-01-22T00:00:00.000Z");
    expect(patternIndexForDate(day21, 0)).toBe(0);
  });

  it("un offset de 21 equivale a no tener offset", () => {
    const date = new Date("2026-05-01T00:00:00.000Z");
    expect(patternIndexForDate(date, 0)).toBe(patternIndexForDate(date, 21));
  });

  it("siempre devuelve un índice en rango [0, 20]", () => {
    for (let d = 0; d < 100; d++) {
      const date = new Date(EPOCH_DATE.getTime() + d * 86_400_000);
      const idx = patternIndexForDate(date, 3);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(PATTERN_LENGTH);
    }
  });
});

describe("shiftForEmployee", () => {
  it("devuelve un tipo de turno reconocido", () => {
    const emp = { rotationOrder: 0 };
    const date = new Date("2026-05-01T00:00:00.000Z");
    const shift = shiftForEmployee(emp, date);
    const valid = new Set(["M", "T", "N", "D", "MF", "TF", "NF"]);
    expect(valid.has(shift)).toBe(true);
  });

  it("empleados con distinto rotationOrder tienen turnos distintos en el mismo día", () => {
    const date = new Date("2026-05-01T00:00:00.000Z");
    const shifts = [0, 1, 2, 3, 4, 5, 6].map((r) =>
      shiftForEmployee({ rotationOrder: r }, date)
    );
    // No todos pueden ser iguales (al menos dos deberían diferir)
    const unique = new Set(shifts);
    expect(unique.size).toBeGreaterThan(1);
  });
});

describe("generateMonthSchedule", () => {
  const employees = [
    { id: "emp-1", rotationOrder: 0 },
    { id: "emp-2", rotationOrder: 1 },
    { id: "emp-3", rotationOrder: 2 },
  ];

  it("genera daysInMonth × numEmpleados asignaciones para un mes vacío", () => {
    const result = generateMonthSchedule(employees, 2026, 6); // Junio: 30 días
    expect(result).toHaveLength(3 * 30);
  });

  it("genera 31 días para mayo (mes completo)", () => {
    const result = generateMonthSchedule(employees, 2026, 5);
    const emp1 = result.filter((a) => a.employeeId === "emp-1");
    expect(emp1).toHaveLength(31);
  });

  it("respeta los turnos ya existentes (no los sobreescribe)", () => {
    const existing = new Set(["emp-1|2026-06-01"]);
    const result = generateMonthSchedule(employees, 2026, 6, existing);
    // emp-1 solo tiene 29 asignaciones (el día 1 ya estaba)
    const emp1 = result.filter((a) => a.employeeId === "emp-1");
    expect(emp1).toHaveLength(29);
    // El día 1 no aparece en el resultado
    const day1 = result.find(
      (a) => a.employeeId === "emp-1" && a.date.toISOString().slice(0, 10) === "2026-06-01"
    );
    expect(day1).toBeUndefined();
  });

  it("todas las asignaciones tienen shiftType del patrón base o su variante especial", () => {
    const result = generateMonthSchedule(employees, 2026, 5);
    const valid = new Set(["M", "T", "N", "D", "MF", "TF", "NF"]);
    result.forEach((a) => {
      expect(valid.has(a.shiftType)).toBe(true);
    });
  });

  it("las fechas generadas están en UTC midnight", () => {
    const result = generateMonthSchedule(employees, 2026, 5);
    result.forEach((a) => {
      expect(a.date.getUTCHours()).toBe(0);
      expect(a.date.getUTCMinutes()).toBe(0);
      expect(a.date.getUTCSeconds()).toBe(0);
    });
  });

  it("con lista de empleados vacía devuelve array vacío", () => {
    const result = generateMonthSchedule([], 2026, 5);
    expect(result).toHaveLength(0);
  });
});

describe("shiftForEmployee — festivos", () => {
  const emp = { rotationOrder: 0 };

  it("convierte M en MF cuando el día es festivo", () => {
    // rotationOrder=0, día 1 de la época (2026-01-01) → índice 0 → BASE_PATTERN[0] = M
    const date = new Date("2026-01-01T00:00:00.000Z");
    const holidays = new Set(["2026-01-01"]);
    expect(shiftForEmployee(emp, date, holidays)).toBe("MF");
  });

  it("mantiene D cuando el día es festivo (D no se convierte)", () => {
    // día 6 (2026-01-06) → índice 5 → BASE_PATTERN[5] = D
    const date = new Date("2026-01-06T00:00:00.000Z");
    const holidays = new Set(["2026-01-06"]);
    expect(shiftForEmployee(emp, date, holidays)).toBe("D");
  });

  it("no modifica el turno si el día no es festivo", () => {
    const date = new Date("2026-01-01T00:00:00.000Z");
    expect(shiftForEmployee(emp, date)).toBe("M");
  });

  it("convierte N en NF cuando el día SIGUIENTE es festivo", () => {
    // rotationOrder=0, día 15 (2026-01-15) → índice 14 → BASE_PATTERN[14] = N
    const date = new Date("2026-01-15T00:00:00.000Z");
    const holidays = new Set(["2026-01-16"]); // el día siguiente es festivo
    expect(shiftForEmployee(emp, date, holidays)).toBe("NF");
  });

  it("N NO se convierte a NF cuando el propio día es festivo pero el siguiente no", () => {
    // Si el día del turno de noche es festivo pero el siguiente no → sigue siendo N
    const date = new Date("2026-01-15T00:00:00.000Z");
    const holidays = new Set(["2026-01-15"]); // solo el propio día es festivo
    expect(shiftForEmployee(emp, date, holidays)).toBe("N");
  });
});

describe("shiftForEmployee — fines de semana", () => {
  const emp = { rotationOrder: 0 };

  it("convierte M en MF cuando el día es sábado", () => {
    // 2026-01-03 es sábado (dow=6) y rotationOrder=0 → M (índice 2)
    const date = new Date("2026-01-03T00:00:00.000Z");
    expect(shiftForEmployee(emp, date)).toBe("MF");
  });

  it("convierte M en MF cuando el día es domingo", () => {
    // 2026-01-04 es domingo (dow=0) y rotationOrder=0 → M (índice 3)
    const date = new Date("2026-01-04T00:00:00.000Z");
    expect(shiftForEmployee(emp, date)).toBe("MF");
  });

  it("convierte T en TF cuando el día es sábado", () => {
    // 2026-01-10 es sábado y rotationOrder=0 → T (índice 9)
    const date = new Date("2026-01-10T00:00:00.000Z");
    expect(shiftForEmployee(emp, date)).toBe("TF");
  });

  it("convierte T en TF cuando el día es domingo", () => {
    // 2026-01-11 es domingo y rotationOrder=0 → T (índice 10)
    const date = new Date("2026-01-11T00:00:00.000Z");
    expect(shiftForEmployee(emp, date)).toBe("TF");
  });

  it("convierte N en NF cuando el día siguiente es sábado (turno viernes)", () => {
    // 2026-01-16 es viernes (dow=5) y rotationOrder=0 → N (índice 15)
    // El día siguiente (2026-01-17) es sábado → NF
    const date = new Date("2026-01-16T00:00:00.000Z");
    expect(shiftForEmployee(emp, date)).toBe("NF");
  });

  it("convierte N en NF cuando el día siguiente es domingo (turno sábado)", () => {
    // 2026-01-17 es sábado (dow=6) y rotationOrder=0 → N (índice 16)
    // El día siguiente (2026-01-18) es domingo → NF
    const date = new Date("2026-01-17T00:00:00.000Z");
    expect(shiftForEmployee(emp, date)).toBe("NF");
  });

  it("N del domingo NO se convierte en NF si el lunes no es festivo", () => {
    // 2026-01-18 es domingo y rotationOrder=0 → N (índice 17)
    // El día siguiente (2026-01-19) es lunes laborable → N permanece
    const date = new Date("2026-01-18T00:00:00.000Z");
    expect(shiftForEmployee(emp, date)).toBe("N");
  });

  it("N del domingo SÍ se convierte en NF si el lunes es festivo", () => {
    // 2026-01-18 es domingo, rotationOrder=0 → N; el 19 es festivo → NF
    const date = new Date("2026-01-18T00:00:00.000Z");
    const holidays = new Set(["2026-01-19"]);
    expect(shiftForEmployee(emp, date, holidays)).toBe("NF");
  });

  it("D no cambia aunque el día sea sábado o domingo", () => {
    // 2026-01-06 es martes pero índice 5 → D; buscamos un D en finde
    // 2026-01-24 es sábado (dow=6) y rotationOrder=0 → M (idx 23%21=2) → no D
    // Buscamos un D en finde: día 7 es miércoles, idx=6 → D
    // No hay D natural en finde para emp0 en enero. Usamos rotationOrder=2 que desplaza 6 posiciones.
    // rotationOrder=2: offset=(2*3)%21=6; día 1 (2026-01-01): idx=(0+6)%21=6 → D
    // 2026-01-25 es domingo (dow=0): idx=(24+6)%21=30%21=9 → T (no D)
    // Mejor: rotationOrder=1, offset=3; 2026-01-04 es dom, idx=(3+3)%21=6 → D
    const empD = { rotationOrder: 1 };
    const date = new Date("2026-01-04T00:00:00.000Z"); // domingo
    expect(shiftForEmployee(empD, date)).toBe("D");
  });
});

describe("generateMonthSchedule — festivos", () => {
  const employees = [
    { id: "emp-1", rotationOrder: 0 },
    { id: "emp-2", rotationOrder: 1 },
  ];

  it("los días festivos generan MF/TF en lugar de M/T (no N)", () => {
    // Generamos enero con el día 1 como festivo (rotationOrder=0 → M ese día)
    const holidays = new Set(["2026-01-01"]);
    const result = generateMonthSchedule(employees, 2026, 1, new Set(), holidays);
    const day1 = result.find(
      (a) => a.employeeId === "emp-1" && a.date.toISOString().slice(0, 10) === "2026-01-01"
    );
    const baseShift = shiftForEmployee({ rotationOrder: 0 }, new Date("2026-01-01T00:00:00.000Z"));
    if (baseShift === "M") expect(day1?.shiftType).toBe("MF");
    else if (baseShift === "T") expect(day1?.shiftType).toBe("TF");
    else expect(day1?.shiftType).toBe(baseShift); // D o N no cambian con el día actual como festivo
  });

  it("N en la víspera de un festivo se convierte en NF", () => {
    // emp-1 (rotationOrder=0): día 15 enero → índice 14 → N; festivo en día 16
    const holidays = new Set(["2026-01-16"]);
    const result = generateMonthSchedule(employees, 2026, 1, new Set(), holidays);
    const day15 = result.find(
      (a) => a.employeeId === "emp-1" && a.date.toISOString().slice(0, 10) === "2026-01-15"
    );
    expect(day15?.shiftType).toBe("NF");
  });

  it("N en el propio día festivo (siguiente no festivo) no se convierte", () => {
    // festivo solo en el día 15, no en el 16
    const holidays = new Set(["2026-01-15"]);
    const result = generateMonthSchedule(employees, 2026, 1, new Set(), holidays);
    const day15 = result.find(
      (a) => a.employeeId === "emp-1" && a.date.toISOString().slice(0, 10) === "2026-01-15"
    );
    expect(day15?.shiftType).toBe("N");
  });

  it("los días no festivos no cambian su turno", () => {
    const holidays = new Set(["2026-01-01"]);
    const result = generateMonthSchedule(employees, 2026, 1, new Set(), holidays);
    const day2 = result.find(
      (a) => a.employeeId === "emp-1" && a.date.toISOString().slice(0, 10) === "2026-01-02"
    );
    expect(day2?.shiftType).not.toBeUndefined();
    expect(["M", "T", "N", "D"]).toContain(day2?.shiftType);
  });
});
