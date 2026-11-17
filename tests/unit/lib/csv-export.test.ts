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

describe("buildScheduleCsv (SPEC-012 AC-16/17/18)", () => {
  it("mayo: incluye columnas MF/TF/N/NF pero no MN/TN/NN, con el total de paga extra", () => {
    const assignments: ScheduleAssignment[] = [
      assignment("emp-1", "2026-05-02", "MF"),
      assignment("emp-1", "2026-05-03", "N"),
      assignment("emp-2", "2026-05-04", "NF"),
    ];

    const csv = buildScheduleCsv({ year: 2026, month: 5, employees, assignments });
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
    const csv = buildScheduleCsv({ year: 2026, month: 12, employees, assignments });
    const [header] = csv.split("\n");

    expect(header).toContain("MN");
    expect(header).toContain("TN");
    expect(header).toContain("NN");
  });

  it("el total de paga extra usa punto decimal, nunca coma (no debe romper el CSV)", () => {
    const assignments: ScheduleAssignment[] = [assignment("emp-1", "2026-05-02", "MF")];
    const csv = buildScheduleCsv({ year: 2026, month: 5, employees, assignments });

    expect(csv).not.toMatch(/\d,\d{1,2}(?!\d)/); // nada tipo "39,60"
    expect(csv).not.toContain("€");
  });

  it("empleado sin turnos de paga extra → columnas en 0 y total 0", () => {
    const csv = buildScheduleCsv({ year: 2026, month: 5, employees, assignments: [] });
    const rows = csv.split("\n").slice(1);
    rows.forEach((row) => {
      expect(row.endsWith(",0")).toBe(true);
    });
  });
});
