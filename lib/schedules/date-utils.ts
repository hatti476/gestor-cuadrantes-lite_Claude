/**
 * @module date-utils
 * @description Utilidades de fecha y normalización de tipos de turno.
 *              Funciones puras sin dependencias de BD ni HTTP.
 *              Usadas por generate.ts y todos los módulos del algoritmo.
 * @dependencies ninguna (módulo raíz del algoritmo)
 */

// ─── SECCIÓN: Helpers de fecha ─────────────────────────────────────────────

/** Returns true when UTC day-of-week is Saturday (6) or Sunday (0) */
export function isWeekend(date: Date): boolean {
  const dow = date.getUTCDay();
  return dow === 0 || dow === 6;
}

/** Returns "YYYY-MM-DD" for a UTC-midnight Date */
export function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** UTC midnight Date from "YYYY-MM-DD" */
export function fromDateStr(s: string): Date {
  return new Date(s + "T00:00:00.000Z");
}

/** Add `n` days (returns new Date) */
export function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 86_400_000);
}

/**
 * Returns true if the date is a weekend or a public holiday, OR if the date is
 * a weekday holiday that belongs to an extended weekend (connected to Sat/Sun
 * through a contiguous chain of holidays).
 */
export function isWeekendOrHoliday(date: Date, holidays: Set<string>): boolean {
  if (isWeekend(date)) return true;
  const ds = toDateStr(date);
  if (!holidays.has(ds)) return false;
  // Walk forward: check if this holiday connects to Saturday through consecutive holidays
  let fwd = addDays(date, 1);
  while (!isWeekend(fwd)) {
    if (!holidays.has(toDateStr(fwd))) break;
    fwd = addDays(fwd, 1);
  }
  if (fwd.getUTCDay() === 6) return true;
  // Walk backward: check if this holiday connects to Sunday through consecutive holidays
  let bwd = addDays(date, -1);
  while (!isWeekend(bwd)) {
    if (!holidays.has(toDateStr(bwd))) break;
    bwd = addDays(bwd, -1);
  }
  return isWeekend(bwd);
}

/**
 * Applies the holiday/weekend rule to a base shift on a given date:
 *   M → MF if the day is a holiday or weekend
 *   T → TF if the day is a holiday or weekend
 *   N → NF if the NEXT day is a holiday or weekend
 *   D / J / V / B → unchanged
 */
export function applySpecialDayRule(
  baseShift: string,
  date: Date,
  holidayDates: Set<string>
): string {
  const isSpecialDay = holidayDates.has(toDateStr(date)) || isWeekend(date);
  if (baseShift === "M" || baseShift === "T") {
    if (isSpecialDay) return baseShift + "F";
  } else if (baseShift === "N") {
    const next = addDays(date, 1);
    const nextIsSpecial = holidayDates.has(toDateStr(next)) || isWeekend(next);
    if (nextIsSpecial) return "NF";
  }
  return baseShift;
}

// ─── SECCIÓN: Normalización de tipos de turno ──────────────────────────────

/** Return the base shift type (strip the F/N suffix for holiday/night variants) */
export function normalizeShift(shift: string): string {
  if (shift === "MF") return "M";
  if (shift === "TF") return "T";
  if (shift === "NF") return "N";
  if (shift === "MN") return "M";
  if (shift === "TN") return "T";
  if (shift === "NN") return "N";
  return shift;
}

// ─── SECCIÓN: Reglas especiales de Navidad ────────────────────────────────

// REGLA: Turnos en fechas navideñas se convierten a variante nocturna especial
// (MN, TN, NN) que tiene compensación económica adicional.
const CHRISTMAS_MORNING_DATES = new Set(["12-25", "01-01", "01-06"]);
const CHRISTMAS_AFTERNOON_DATES = new Set(["12-24", "12-25", "12-31", "01-01", "01-05", "01-06"]);
const CHRISTMAS_NIGHT_DATES = new Set(["12-24", "12-25", "12-31", "01-01", "01-05", "01-06"]);

function monthDayKey(date: Date): string {
  return `${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function applyChristmasSpecialRule(shift: string, date: Date): string {
  const md = monthDayKey(date);
  const base = normalizeShift(shift);

  if (base === "M" && CHRISTMAS_MORNING_DATES.has(md)) return "MN";
  if (base === "T" && CHRISTMAS_AFTERNOON_DATES.has(md)) return "TN";
  if (base === "N" && CHRISTMAS_NIGHT_DATES.has(md)) return "NN";
  return shift;
}

// ─── SECCIÓN: Clave de semana ISO ─────────────────────────────────────────

/** Return the Monday of the ISO week containing `date` as "YYYY-MM-DD" key */
export function weekKey(date: Date): string {
  const d = date.getUTCDay(); // 0=Sun,1=Mon,...,6=Sat
  const offset = d === 0 ? -6 : 1 - d;
  return toDateStr(addDays(date, offset));
}
