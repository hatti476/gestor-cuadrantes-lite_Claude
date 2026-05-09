/**
 * Lógica de negocio del cuadrante — funciones puras, sin dependencias de BD ni HTTP.
 * Pensadas para ser fácilmente testeables con Vitest.
 */

export const VALID_SHIFT_TYPES = ["M", "T", "N", "J", "D", "V", "B", "MF", "TF", "NF"] as const;
export type ValidShiftType = (typeof VALID_SHIFT_TYPES)[number];

/** Valida que el shiftType sea un código conocido */
export function isValidShiftType(value: string): value is ValidShiftType {
  return (VALID_SHIFT_TYPES as readonly string[]).includes(value);
}

/** Normaliza una fecha a medianoche UTC (elimina horas/minutos/segundos) */
export function normalizeToUTCMidnight(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Devuelve el rango [inicio, fin) de un mes dado (fin = primer día del mes siguiente) */
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1),
  };
}

export interface ShiftCounter {
  [shiftType: string]: number;
}

/**
 * Calcula cuántos turnos de cada tipo tiene un empleado en una lista de asignaciones.
 * Las asignaciones deben ser ya del empleado concreto.
 */
export function countShifts(shiftTypes: string[]): ShiftCounter {
  return shiftTypes.reduce<ShiftCounter>((acc, type) => {
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});
}

/** Valida el body de un POST /api/schedules */
export function validateScheduleBody(body: unknown): {
  valid: boolean;
  error?: string;
  employeeId?: string;
  date?: Date;
  shiftType?: string;
} {
  if (
    !body ||
    typeof body !== "object" ||
    !("employeeId" in body) ||
    !("date" in body) ||
    !("shiftType" in body)
  ) {
    return { valid: false, error: "Campos requeridos: employeeId, date, shiftType" };
  }

  const { employeeId, date, shiftType } = body as Record<string, unknown>;

  if (typeof employeeId !== "string" || !employeeId.trim()) {
    return { valid: false, error: "employeeId debe ser un string no vacío" };
  }
  if (typeof shiftType !== "string" || !isValidShiftType(shiftType)) {
    return { valid: false, error: `Tipo de turno inválido: ${shiftType}` };
  }

  const parsedDate = new Date(date as string);
  if (isNaN(parsedDate.getTime())) {
    return { valid: false, error: "Formato de fecha inválido" };
  }

  return {
    valid: true,
    employeeId: employeeId.trim(),
    date: normalizeToUTCMidnight(parsedDate),
    shiftType,
  };
}
