import type { ScheduleAssignment, ScheduleEmployee } from "./types";

export interface MonthPeriod {
  year: number;
  month: number;
}

export const SPAN_OPTIONS = [2, 3, 4, 6] as const;
export const DEFAULT_SPAN = 3;

export function addMonths(year: number, month: number, delta: number): MonthPeriod {
  let m = month + delta;
  let y = year;
  while (m > 12) { m -= 12; y++; }
  while (m < 1)  { m += 12; y--; }
  return { year: y, month: m };
}

/**
 * Meses de la vista ampliada centrados en el mes visible.
 * Con span par no hay centro exacto: se muestra un mes más hacia delante
 * que hacia atrás (6 meses centrados en mayo → marzo..agosto).
 */
export function getMonthPeriods(year: number, month: number, span: number): MonthPeriod[] {
  const before = Math.floor((span - 1) / 2);
  const periods: MonthPeriod[] = [];
  for (let d = -before; d < span - before; d++) {
    periods.push(addMonths(year, month, d));
  }
  return periods;
}

/** Span de la URL validado contra SPAN_OPTIONS; cualquier otro valor → DEFAULT_SPAN. */
export function parseSpan(raw: string | null): number {
  const n = Number(raw);
  return (SPAN_OPTIONS as readonly number[]).includes(n) ? n : DEFAULT_SPAN;
}

/**
 * Empleados extraídos de las asignaciones, para roles sin acceso a /api/employees
 * (TECNICO, VIEWER). Mismo fallback que la vista mensual en app/page.tsx.
 */
export function employeesFromAssignments(assignments: ScheduleAssignment[]): ScheduleEmployee[] {
  const byId = new Map<string, ScheduleEmployee>();
  for (const a of assignments) {
    if (a.employee && !byId.has(a.employeeId)) byId.set(a.employeeId, a.employee);
  }
  return Array.from(byId.values()).sort((a, b) => a.rotationOrder - b.rotationOrder);
}
