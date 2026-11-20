import { describe, it, expect } from "vitest";
import { buildScheduleCsv } from "@/lib/schedules/csv-export";
import type { ScheduleAssignment, ScheduleEmployee } from "@/lib/schedules/types";

// SPEC-012 AC-16/17/18: el CSV exportado debe incluir las columnas de paga
// extra (igual criterio que ExtraPayTable: MN/TN/NN solo en dic/ene) y un
// total "Paga extra" por empleado, en un formato numérico que no rompa el CSV
// (sin coma decimal ni símbolo de moneda).

const employees: ScheduleEmployee[] = [
  { id: "emp-1", name: "Técnico 1", rotationOrder: 1 },
  { id: "emp-2", name: "Técnico 2", rotationOrder: 2 },
];

function assignment(employeeId: string, date: string, shiftType: string): ScheduleAssignment {
  return { id: `${employeeId}-${date}`, employeeId, date, shiftType };
}

const noHolidays = new Set<string>();
const noAnnualBalance: Record<string, number> = {};

describe("buildScheduleCsv (SPEC-012 AC-16/17/18)", () => {
  it("mayo: incluye columnas MF/TF/N/NF pero no MN/TN/NN, con el total de paga extra", () => {
    const assignments: ScheduleAssignment[] = [
      assignment("emp-1", "2026-05-02", "MF"),
      assignment("emp-1", "2026-05-03", "N"),
      assignment("emp-2", "2026-05-04", "NF"),
    ];

    const csv = buildScheduleCsv({
      year: 2026,
      month: 5,
      employees,
      assignments,
      holidayDates: noHolidays,
      annualBalance: noAnnualBalance,
    });
    const [header, ...rows] = csv.split("\n");

    expect(header).toContain("MF");
    expect(header).toContain("TF");
    expect(header).toContain("N");
    expect(header).toContain("NF");
    expect(header).not.toContain("MN");
    expect(header).not.toContain("TN");
    expect(header).not.toContain("NN");
    expect(header).toContain("Paga extra");

    const emp1Row = rows.find((r) => r.startsWith("Técnico 1"));
    const emp2Row = rows.find((r) => r.startsWith("Técnico 2"));
    expect(emp1Row).toBeDefined();
    expect(emp2Row).toBeDefined();

    // Técnico 1: 1 MF (39.6) + 1 N (46.2) = 85.8
    expect(emp1Row).toContain("85.8");
    // Técnico 2: 1 NF (59.4)
    expect(emp2Row).toContain("59.4");
  });

  it("diciembre: incluye también columnas MN/TN/NN", () => {
    const assignments: ScheduleAssignment[] = [assignment("emp-1", "2026-12-25", "MN")];
    const csv = buildScheduleCsv({
      year: 2026,
      month: 12,
      employees,
      assignments,
      holidayDates: noHolidays,
      annualBalance: noAnnualBalance,
    });
    const [header] = csv.split("\n");

    expect(header).toContain("MN");
    expect(header).toContain("TN");
    expect(header).toContain("NN");
  });

  it("el total de paga extra usa punto decimal, nunca coma", () => {
    const assignments: ScheduleAssignment[] = [assignment("emp-1", "2026-05-02", "MF")];
    const csv = buildScheduleCsv({
      year: 2026,
      month: 5,
      employees,
      assignments,
      holidayDates: noHolidays,
      annualBalance: noAnnualBalance,
    });
    const [header, ...rows] = csv.split("\n");
    const pagaExtraIndex = header.split(",").indexOf("Paga extra");
    const totalFields = rows.map((row) => row.split(",")[pagaExtraIndex]);

    totalFields.forEach((field) => {
      expect(field).toMatch(/^\d+(\.\d+)?$/); // nunca "39,60" ni "39,60 €"
    });
    expect(csv).not.toContain("€");
  });

  it("empleado sin turnos de paga extra → columnas en 0 y total 0", () => {
    const csv = buildScheduleCsv({
      year: 2026,
      month: 5,
      employees,
      assignments: [],
      holidayDates: noHolidays,
      annualBalance: noAnnualBalance,
    });
    const [header, ...rows] = csv.split("\n");
    const pagaExtraIndex = header.split(",").indexOf("Paga extra");
    rows.forEach((row) => {
      expect(row.split(",")[pagaExtraIndex]).toBe("0");
    });
  });
});

describe("buildScheduleCsv — balance jornadas/laborables (SPEC-014 AC-11)", () => {
  it("incluye Laborables, Diferencia mes y Diferencia acumulada año al final de cada fila", () => {
    const assignments: ScheduleAssignment[] = [
      assignment("emp-1", "2026-05-02", "MF"), // ocupada
      assignment("emp-1", "2026-05-03", "N"), // ocupada
      assignment("emp-2", "2026-05-04", "D"), // descanso, no cuenta como ocupada
    ];

    const csv = buildScheduleCsv({
      year: 2026,
      month: 5,
      employees,
      assignments,
      holidayDates: new Set(["2026-05-01"]), // festivo nacional, viernes → laborable mayo = 20
      annualBalance: { "emp-1": -5, "emp-2": 10 },
    });
    const [header, ...rows] = csv.split("\n");

    expect(header.split(",").slice(-3)).toEqual(["Laborables", "Diferencia mes", "Diferencia acumulada año"]);

    const emp1Row = rows.find((r) => r.startsWith("Técnico 1"))!;
    const emp2Row = rows.find((r) => r.startsWith("Técnico 2"))!;

    // emp-1: 2 ocupadas - 20 laborables = -18; acumulado -5
    expect(emp1Row.split(",").slice(-3)).toEqual(["20", "-18", "-5"]);
    // emp-2: 0 ocupadas (solo tiene un D) - 20 laborables = -20; acumulado 10
    expect(emp2Row.split(",").slice(-3)).toEqual(["20", "-20", "10"]);
  });

  it("empleado sin entrada en annualBalance → acumulado 0, no error", () => {
    const csv = buildScheduleCsv({
      year: 2026,
      month: 5,
      employees,
      assignments: [],
      holidayDates: noHolidays,
      annualBalance: {},
    });
    const rows = csv.split("\n").slice(1);
    rows.forEach((row) => {
      expect(row.split(",").pop()).toBe("0");
    });
  });
});
