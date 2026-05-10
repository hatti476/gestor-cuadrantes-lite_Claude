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

/** Mapa de turno laboral → turno de día especial equivalente (festivo o fin de semana) */
const FESTIVO_MAP: Record<string, string> = {
  M: "MF",
  T: "TF",
  N: "NF",
};

/**
 * Devuelve true si la fecha UTC es sábado (6) o domingo (0).
 * Se usa UTC para ser consistente con cómo se almacenan las fechas (UTC midnight).
 */
export function isWeekend(date: Date): boolean {
  const dow = date.getUTCDay();
  return dow === 0 || dow === 6;
}

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
 * Aplica conversión si el día (o el siguiente para N) es festivo o fin de semana:
 *   M → MF, T → TF si el propio día es festivo o sábado/domingo
 *   N → NF si el día SIGUIENTE es festivo o sábado/domingo
 *          EXCEPTO: N del domingo → N si el lunes no es festivo
 *                   (el turno termina el lunes, que es laborable)
 * D permanece D en cualquier caso.
 */
export function shiftForEmployee(
  employee: Pick<ScheduleEmployee, "rotationOrder">,
  date: Date,
  holidayDates: Set<string> = new Set()
): string {
  const offset = (employee.rotationOrder * 3) % PATTERN_LENGTH;
  const idx = patternIndexForDate(date, offset);
  const baseShift = BASE_PATTERN[idx];
  const dateStr = date.toISOString().slice(0, 10);

  if (baseShift === "N") {
    // Turno de noche 23:00-07:00: el tipo especial lo determina el día SIGUIENTE
    const nextDay = new Date(date.getTime() + 86_400_000);
    const nextDateStr = nextDay.toISOString().slice(0, 10);
    if (holidayDates.has(nextDateStr) || isWeekend(nextDay)) return "NF";
  } else if (FESTIVO_MAP[baseShift]) {
    if (holidayDates.has(dateStr) || isWeekend(date)) return FESTIVO_MAP[baseShift];
  }

  return baseShift;
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
 * @param holidayDates    Set de strings "YYYY-MM-DD" que son festivos
 */
export function generateMonthSchedule(
  employees: Pick<ScheduleEmployee, "id" | "rotationOrder">[],
  year: number,
  month: number,
  existingDates: Set<string> = new Set(),
  holidayDates: Set<string> = new Set()
): GeneratedAssignment[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const assignments: GeneratedAssignment[] = [];

  for (const emp of employees) {
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(year, month - 1, day));
      const dateStr = date.toISOString().slice(0, 10);
      const key = `${emp.id}|${dateStr}`;

      if (existingDates.has(key)) continue; // no sobreescribir manuales

      const shiftType = shiftForEmployee(emp, date, holidayDates);
      assignments.push({ employeeId: emp.id, date, shiftType });
    }
  }

  return assignments;
}

