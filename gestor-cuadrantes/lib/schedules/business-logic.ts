/**
 * Lógica de negocio del cuadrante — funciones puras, sin dependencias de BD ni HTTP.
 * Pensadas para ser fácilmente testeables con Vitest.
 */

export const VALID_SHIFT_TYPES = [
  "M",
  "T",
  "N",
  "J",
  "D",
  "V",
  "B",
  "MF",
  "TF",
  "NF",
  "MN",
  "TN",
  "NN",
] as const;
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

export const EXTRA_PAY_RATES: Record<string, number> = {
  MF: 33,
  TF: 33,
  N: 38.5,
  NF: 49.5,
  MN: 126.5,
  TN: 126.5,
  NN: 126.5,
};

export function calculateExtraPay(shiftCounts: Record<string, number>): number {
  return Object.entries(EXTRA_PAY_RATES).reduce(
    (total, [shift, rate]) => total + (shiftCounts[shift] ?? 0) * rate,
    0
  );
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

/**
 * Dado un turno base y si el día propio / el día siguiente es "especial"
 * (festivo O fin de semana), devuelve el turno resultante:
 *   M → MF si el día actual es especial
 *   T → TF si el día actual es especial
 *   N → NF si el día SIGUIENTE es especial (el turno termina en ese día)
 *          Nota: N del domingo → N si el lunes no es especial
 *   D y resto → sin cambio
 */
export function applyHolidayRule(
  shiftType: string,
  isTodaySpecial: boolean,  // festivo o fin de semana
  isTomorrowSpecial: boolean // festivo o fin de semana
): string {
  if (shiftType === "M" && isTodaySpecial) return "MF";
  if (shiftType === "T" && isTodaySpecial) return "TF";
  if (shiftType === "N" && isTomorrowSpecial) return "NF";
  return shiftType;
}

/**
 * Dado un turno festivo, devuelve el turno base equivalente (MF→M, TF→T, NF→N).
 * Si no es festivo, devuelve el mismo turno.
 */
export function removeHolidayRule(shiftType: string): string {
  if (shiftType === "MF") return "M";
  if (shiftType === "TF") return "T";
  if (shiftType === "NF") return "N";
  if (shiftType === "MN") return "M";
  if (shiftType === "TN") return "T";
  if (shiftType === "NN") return "N";
  return shiftType;
}

function isMorningShift(shiftType: ValidShiftType): boolean {
  return shiftType === "M" || shiftType === "MF" || shiftType === "MN";
}

function isAfternoonShift(shiftType: ValidShiftType): boolean {
  return shiftType === "T" || shiftType === "TF" || shiftType === "TN";
}

function isNightShift(shiftType: ValidShiftType): boolean {
  return shiftType === "N" || shiftType === "NF" || shiftType === "NN";
}

function isTimedShift(shiftType: ValidShiftType): boolean {
  return isMorningShift(shiftType) || isAfternoonShift(shiftType) || isNightShift(shiftType);
}

function shiftEndHourFromDayStart(shiftType: ValidShiftType): number {
  if (isMorningShift(shiftType)) return 15;
  if (isAfternoonShift(shiftType)) return 23;
  if (isNightShift(shiftType)) return 31; // 07:00 del día siguiente
  return 0;
}

function nextShiftStartHourFromPreviousDayStart(shiftType: ValidShiftType): number {
  if (isMorningShift(shiftType)) return 31; // día siguiente 07:00
  if (isAfternoonShift(shiftType)) return 39; // día siguiente 15:00
  if (isNightShift(shiftType)) return 47; // día siguiente 23:00
  return 24;
}

export function validateShiftTransition(
  prevShift: ValidShiftType | null,
  nextShift: ValidShiftType
): { valid: boolean; hoursGap: number } {
  if (!prevShift || !isTimedShift(prevShift) || !isTimedShift(nextShift)) {
    return { valid: true, hoursGap: 24 };
  }

  if (isAfternoonShift(prevShift) && isMorningShift(nextShift)) {
    return { valid: false, hoursGap: 8 };
  }

  if (isAfternoonShift(prevShift) && isNightShift(nextShift)) {
    return { valid: false, hoursGap: 0 };
  }

  if (isNightShift(prevShift) && isMorningShift(nextShift)) {
    return { valid: false, hoursGap: 0 };
  }

  if (isNightShift(prevShift) && isAfternoonShift(nextShift)) {
    return { valid: false, hoursGap: 8 };
  }

  const hoursGap = nextShiftStartHourFromPreviousDayStart(nextShift) - shiftEndHourFromDayStart(prevShift);
  return { valid: hoursGap >= 12, hoursGap };
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
