/**
 * lib/schedules/generate.ts
 * Lógica pura de generación automática de cuadrante por rotación.
 * Sin dependencias de DB ni HTTP — completamente testeable con Vitest.
 */

import { ScheduleEmployee } from "@/lib/schedules/types";

// ─── Patrón base de 21 días ───────────────────────────────────────────────────
// M×5, D×2, T×5, D×2, N×5, D×2
export const BASE_PATTERN: string[] = [
  "M", "M", "M", "M", "M",
  "D", "D",
  "T", "T", "T", "T", "T",
  "D", "D",
  "N", "N", "N", "N", "N",
  "D", "D",
];

/** Número de días desde la época de referencia (2026-01-01 UTC) */
export const EPOCH_DATE = new Date("2026-01-01T00:00:00.000Z");
export const PATTERN_LENGTH = BASE_PATTERN.length; // 21

/**
 * Calcula el índice en el patrón para un empleado en una fecha concreta.
 * @param date   Fecha del turno (UTC midnight)
 * @param offset Desplazamiento del empleado en el ciclo (rotationOrder × 3)
 */
export function patternIndexForDate(date: Date, offset: number): number {
  const msPerDay = 86_400_000;
  const daysSinceEpoch = Math.floor(
    (date.getTime() - EPOCH_DATE.getTime()) / msPerDay
  );
  // Módulo siempre positivo
  return ((daysSinceEpoch + offset) % PATTERN_LENGTH + PATTERN_LENGTH) % PATTERN_LENGTH;
}

/**
 * Tipo de turno que le corresponde a un empleado en una fecha.
 */
export function shiftForEmployee(
  employee: Pick<ScheduleEmployee, "rotationOrder">,
  date: Date
): string {
  const offset = (employee.rotationOrder * 3) % PATTERN_LENGTH;
  const idx = patternIndexForDate(date, offset);
  return BASE_PATTERN[idx];
}

export interface GeneratedAssignment {
  employeeId: string;
  date: Date; // UTC midnight
  shiftType: string;
}

/**
 * Genera los turnos para un mes completo dado un conjunto de empleados.
 * Solo genera asignaciones para las celdas NO cubiertas por `existingDates`.
 *
 * @param employees       Lista de empleados con id y rotationOrder
 * @param year            Año (ej. 2026)
 * @param month           Mes 1-12
 * @param existingDates   Set de strings "employeeId|YYYY-MM-DD" ya asignadas
 */
export function generateMonthSchedule(
  employees: Pick<ScheduleEmployee, "id" | "rotationOrder">[],
  year: number,
  month: number,
  existingDates: Set<string> = new Set()
): GeneratedAssignment[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const assignments: GeneratedAssignment[] = [];

  for (const emp of employees) {
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(year, month - 1, day));
      const dateStr = date.toISOString().slice(0, 10);
      const key = `${emp.id}|${dateStr}`;

      if (existingDates.has(key)) continue; // no sobreescribir manuales

      const shiftType = shiftForEmployee(emp, date);
      assignments.push({ employeeId: emp.id, date, shiftType });
    }
  }

  return assignments;
}
