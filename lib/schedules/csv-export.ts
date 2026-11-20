/** Construcción del CSV exportable del cuadrante — función pura, testeable sin DOM. */

import { ScheduleAssignment, ScheduleEmployee } from "@/lib/schedules/types";
import {
  calculateExtraPay,
  countShifts,
  countLaborableDays,
  countOccupiedDays,
  getExtraPayColumnsForMonth,
} from "@/lib/schedules/business-logic";

interface BuildScheduleCsvInput {
  year: number;
  month: number; // 1-12
  employees: ScheduleEmployee[];
  assignments: ScheduleAssignment[];
  /** Fechas "YYYY-MM-DD" de festivos del mes — ver countLaborableDays (SPEC-014) */
  holidayDates: Set<string>;
  /** Acumulado anual por empleado — ya calculado vía GET /api/schedules/annual-balance (SPEC-014) */
  annualBalance: Record<string, number>;
}

/**
 * Genera el CSV del cuadrante: una fila por empleado con el turno de cada día
 * del mes, seguido de los contadores de turnos con paga extra vigentes ese
 * mes y el total de paga extra (SPEC-012 AC-16/17/18), y por último el
 * balance de jornadas/laborables del mes y del año (SPEC-014 AC-11).
 *
 * El total se redondea a 2 decimales y se formatea con punto (nunca coma, ni
 * símbolo de moneda) para no romper el formato CSV.
 */
export function buildScheduleCsv({
  year,
  month,
  employees,
  assignments,
  holidayDates,
  annualBalance,
}: BuildScheduleCsvInput): string {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const extraPayColumns = getExtraPayColumnsForMonth(month);
  const laborableDays = countLaborableDays(year, month, holidayDates);

  const header = [
    "Empleado",
    ...days.map(String),
    ...extraPayColumns,
    "Paga extra",
    "Laborables",
    "Diferencia mes",
    "Diferencia acumulada año",
  ].join(",");

  const rows = employees.map((emp) => {
    const empAssignments = assignments.filter((a) => a.employeeId === emp.id);
    const empShiftTypes = empAssignments.map((a) => a.shiftType);

    const dayCells = days.map((day) => {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const found = empAssignments.find((a) => a.date.slice(0, 10) === dateStr);
      return found ? found.shiftType : "";
    });

    const counters = countShifts(empShiftTypes);
    const extraPayCounts = extraPayColumns.map((shift) => String(counters[shift] ?? 0));
    const extraPayTotal = calculateExtraPay(
      Object.fromEntries(extraPayColumns.map((shift) => [shift, counters[shift] ?? 0]))
    );
    const roundedTotal = Math.round(extraPayTotal * 100) / 100;

    const monthDiff = countOccupiedDays(empShiftTypes) - laborableDays;
    const yearBalance = annualBalance[emp.id] ?? 0;

    return [
      emp.name ?? "",
      ...dayCells,
      ...extraPayCounts,
      String(roundedTotal),
      String(laborableDays),
      String(monthDiff),
      String(yearBalance),
    ].join(",");
  });

  return [header, ...rows].join("\n");
}
