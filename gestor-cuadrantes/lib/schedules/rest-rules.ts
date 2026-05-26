/**
 * @module rest-rules
 * @description Reglas de descanso HARD: máximo 5 días consecutivos de trabajo
 *              (M/T/J incluyendo variantes MF/TF), detección de post-descanso,
 *              y conteo de días de trabajo seguidos hacia atrás en el tiempo.
 * @dependencies date-utils (normalizeShift, addDays, toDateStr)
 *
 * REGLA: Tras 5 días consecutivos de trabajo (M/T), obligatorio 2D de descanso.
 * REGLA: isDayWorkShift incluye J (jornada normal L-V) como trabajo.
 */

import { normalizeShift, addDays, toDateStr } from "./date-utils";
/** Returns true if the normalized shift is a day-work shift (M or T). */
export function isDayWorkShift(shift: string | null): boolean {
  if (!shift) return false;
  const base = normalizeShift(shift);
  return base === "M" || base === "T" || base === "J";
}

/** Count consecutive trailing day-work entries (M or T shifts) at the end of tail. */
export function countTrailingDayWork(entries: { shiftType: string }[], endIndex = entries.length - 1): number {
  let count = 0;
  for (let i = endIndex; i >= 0; i--) {
    if (!isDayWorkShift(entries[i].shiftType)) break;
    count++;
  }
  return count;
}

/** Count consecutive trailing entries of the given shift type at the end of tail. */
export function countTrailingShift(entries: { shiftType: string }[], shift: string): number {
  let count = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (normalizeShift(entries[i].shiftType) !== shift) break;
    count++;
  }
  return count;
}

/** Compute the number of forced rest days still remaining at the start of a new month. */
export function initialForcedRestDaysRemaining(entries: { shiftType: string }[]): number {
  let trailingRestDays = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].shiftType !== "D") break;
    trailingRestDays++;
  }

  if (trailingRestDays !== 1) return 0;

  const workBeforeSingleRest = countTrailingDayWork(entries, entries.length - trailingRestDays - 1);
  return workBeforeSingleRest >= 5 ? 1 : 0;
}

/** Returns true when date is a post-night-block rest day for the given employee. */
export function isPostRestDay(
  employeeId: string,
  date: Date,
  assignments: { employeeId: string; date: Date | string; shiftType: string }[]
): boolean {
  const previousDate = toDateStr(addDays(date, -1));
  const secondPreviousDate = toDateStr(addDays(date, -2));

  const shiftByDate = new Map(
    assignments
      .filter((assignment) => assignment.employeeId === employeeId)
      .map((assignment) => {
        const dateStr = typeof assignment.date === "string"
          ? assignment.date.slice(0, 10)
          : toDateStr(assignment.date);
        return [dateStr, assignment.shiftType] as const;
      })
  );

  return shiftByDate.get(previousDate) === "D" && shiftByDate.get(secondPreviousDate) === "D";
}

// ─── Exported helpers ─────────────────────────────────────────────────────────

/**
 * Counts consecutive work days (M/T/J including their MF/TF variants) going
 * backward from `date` (not including `date` itself).
 * Looks up assignments and, optionally, prevMonthTail to cross month boundaries.
 */
/** Count consecutive work days up to and including tail[-1] for an employee. */
export function countConsecutiveWorkDays(
  employeeId: string,
  date: Date,
  assignments: { employeeId: string; date: Date | string; shiftType: string }[],
  prevMonthTail?: { employeeId: string; date: string; shiftType: string }[]
): number {
  const shiftMap = new Map<string, string>();
  if (prevMonthTail) {
    for (const p of prevMonthTail) {
      if (p.employeeId === employeeId) shiftMap.set(p.date, p.shiftType);
    }
  }
  for (const a of assignments) {
    if (a.employeeId !== employeeId) continue;
    const ds = typeof a.date === "string" ? a.date.slice(0, 10) : toDateStr(a.date);
    shiftMap.set(ds, a.shiftType);
  }
  let count = 0;
  let check = addDays(date, -1);
  for (let i = 0; i < 100; i++) {
    const ds = toDateStr(check);
    const shift = shiftMap.get(ds);
    if (shift === undefined) break;
    const base = normalizeShift(shift);
    if (base !== "M" && base !== "T" && base !== "J") break;
    count++;
    check = addDays(check, -1);
  }
  return count;
}

/**
 * Returns the extended weekend block that includes `date` (which must be a
 * Saturday or Sunday). The core is always Sat+Sun; it then expands backward
 * through consecutive holiday weekdays (Fri, Thu, …) and forward through
 * consecutive holiday weekdays (Mon, Tue, …).
 */
/** Returns extended weekend dates (including adjacent holidays) for the Saturday satDate. */
export function getExtendedWeekend(
  date: Date,
  holidays: Set<string>
): { start: Date; end: Date; days: Date[] } {
  const dow = date.getUTCDay();
  const satDate = dow === 6 ? date : dow === 0 ? addDays(date, -1) : null;
  if (!satDate) return { start: date, end: date, days: [] };

  const sunDate = addDays(satDate, 1);
  const days: Date[] = [satDate, sunDate];

  // Expand backward: consecutive holiday weekdays before Saturday
  let back = addDays(satDate, -1);
  while (holidays.has(toDateStr(back))) {
    days.unshift(back);
    back = addDays(back, -1);
  }

  // Expand forward: consecutive holiday weekdays after Sunday
  let fwd = addDays(sunDate, 1);
  while (holidays.has(toDateStr(fwd))) {
    days.push(fwd);
    fwd = addDays(fwd, 1);
  }

  return { start: days[0], end: days[days.length - 1], days };
}
