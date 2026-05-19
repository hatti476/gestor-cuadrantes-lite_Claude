/**
 * lib/schedules/generate.ts  —  Sprint 9
 * Motor de generación de cuadrante según especificación de Fase 2.
 *
 * Reglas (por prioridad):
 *  1. Turnos marcados manualmente  →  nunca se sobreescriben
 *  2. Vacaciones / bajas ya introducidas  →  nunca se sobreescriben
 *  3. Bloque de noches del técnico en turno de rotación
 *  4. Continuidad con el mes anterior (≤5 días consecutivos del mismo turno)
 *  5. Cobertura mínima hard (RF-16):
 *       • ≥1M y ≥1T en cada día laborable (L-V no festivo) — overrides consistencia semanal
 *       • ≥1MF y ≥1TF en cada día de fin de semana o festivo
 *       • Soft target ≥2M + ≥2T en laborables (si hay suficientes técnicos disponibles)
 *  6. Consistencia semanal M/T (una vez satisfecho el mínimo hard)
 *  7. Preferencia de turno del empleado (shiftPreference)
 *  8. Equidad de distribución M/T
 *
 * Sin dependencias de BD ni HTTP — completamente testeable con Vitest.
 */

import {
  isValidShiftType,
  validateShiftTransition,
} from "./business-logic";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ScheduleEmployee {
  id: string;
  /** 0-based position used to order the employees */
  rotationOrder: number;
  /** Shift preference: "M" (morning) | "T" (afternoon) | null */
  shiftPreference?: string | null;
}

export interface GeneratedAssignment {
  employeeId: string;
  date: Date; // UTC midnight
  shiftType: string;
}

export interface GenerationWarning {
  employeeId: string;
  date: string;
  prevShift: string;
  nextShift: string;
  hoursGap: number;
  reason: string;
}

export interface GenerateMonthScheduleOptions {
  existingAssignments?: Map<string, string>;
  warnings?: GenerationWarning[];
}

/**
 * Previous-month tail data for continuity check.
 * Pass the last 7 shift assignments per employee from month N-1.
 */
export interface PrevMonthTail {
  employeeId: string;
  date: string; // "YYYY-MM-DD"
  shiftType: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const VALID_SHIFTS = [
  "M",
  "T",
  "N",
  "D",
  "MF",
  "TF",
  "NF",
  "MN",
  "TN",
  "NN",
  "V",
  "B",
  "J",
] as const;

// ─── Date helpers ─────────────────────────────────────────────────────────────

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

// ─── Night-block logic ───────────────────────────────────────────────────────

/**
 * A NightBlock describes the 12-day cycle: 2D + 7N + 3D.
 * Night shifts run from the first Friday of the block.
 *
 * Days relative to startFriday:
 *   -2 and -1 → D (pre-rest)
 *    0..6     → N (night, Fri–Thu)
 *    7, 8, 9  → D (post-rest)
 */
export interface NightBlock {
  employeeId: string;
  /** The Friday that is the first night shift date (UTC midnight) */
  startFriday: Date;
}

/**
 * Returns every day (as "YYYY-MM-DD" → shiftType) that belongs to a NightBlock.
 */
export function nightBlockDays(block: NightBlock): Map<string, string> {
  const map = new Map<string, string>();
  const { startFriday } = block;
  // pre-rest: days -2 and -1
  map.set(toDateStr(addDays(startFriday, -2)), "D");
  map.set(toDateStr(addDays(startFriday, -1)), "D");
  // 7 nights: days 0..6
  for (let offset = 0; offset <= 6; offset++) {
    map.set(toDateStr(addDays(startFriday, offset)), "N");
  }
  // post-rest: days 7, 8, 9
  map.set(toDateStr(addDays(startFriday, 7)), "D");
  map.set(toDateStr(addDays(startFriday, 8)), "D");
  map.set(toDateStr(addDays(startFriday, 9)), "D");
  return map;
}

/**
 * Reference Friday for the night-block rotation cycle (2026-01-02 is a Friday).
 */
export const NIGHT_EPOCH_FRIDAY = new Date("2026-01-02T00:00:00.000Z");
export const BLOCK_DAYS = 12; // 2 + 7 + 3
/** Days of actual night shifts per block (and offset between consecutive employees) */
export const NIGHT_DAYS = 7;

/**
 * Given a year/month and an ordered list of employee IDs (night rotation),
 * returns all NightBlocks whose days overlap with that month.
 *
 * Blocks cycle: emp[0] block 0, emp[1] block 1, …, emp[n-1] block n-1,
 * emp[0] block n, …  — each employee's nights start NIGHT_DAYS (7) after the
 * previous employee's nights started, guaranteeing continuous night coverage
 * with no gaps. Pre/post-rest days (D) overlap with adjacent employees' blocks
 * but that is correct — the resting employee is not on night shift.
 *
 * With N employees, the cycle length is N × 7 days.
 */
export function computeNightBlocks(
  year: number,
  month: number,
  employeeIds: string[]
): NightBlock[] {
  if (employeeIds.length === 0) return [];

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));
  const msPerDay = 86_400_000;

  // How many days from epoch to month start
  const daysToMonthStart = Math.floor(
    (monthStart.getTime() - NIGHT_EPOCH_FRIDAY.getTime()) / msPerDay
  );

  // Each employee's night block starts NIGHT_DAYS after the previous employee,
  // so consecutive blocks are adjacent with no gap in night coverage.
  const roundLength = employeeIds.length * NIGHT_DAYS;
  const roundStart = Math.floor((daysToMonthStart - BLOCK_DAYS) / roundLength) * roundLength;

  const blocks: NightBlock[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  // Search enough rounds to cover the month
  const searchRounds = Math.ceil((daysInMonth + 2 * BLOCK_DAYS) / roundLength) + 2;

  for (let r = 0; r < searchRounds; r++) {
    for (let empIdx = 0; empIdx < employeeIds.length; empIdx++) {
      const daysFromEpoch = roundStart + r * roundLength + empIdx * NIGHT_DAYS;
      const startFriday = addDays(NIGHT_EPOCH_FRIDAY, daysFromEpoch);

      // Block spans from startFriday-2 to startFriday+9
      const blockFirst = addDays(startFriday, -2);
      const blockLast = addDays(startFriday, 9);

      if (blockLast < monthStart) continue;
      if (blockFirst >= monthEnd) continue;

      blocks.push({ employeeId: employeeIds[empIdx], startFriday });
    }
  }

  return blocks;
}

// ─── Night-block conflict resolution ─────────────────────────────────────────

/**
 * Resolves night-block assignments by transferring a block from an employee
 * who has any locked day (V, B, manual D…) in its 7 N-shift days to the
 * employee who has gone the longest without doing a night block.
 *
 * If that employee also has conflicts, it tries the next one, and so on.
 * If no one is available, the block is dropped (night coverage gap — rare).
 *
 * Invariants preserved:
 *  - Max 1 employee on N per day (no overlapping N-days between resolved blocks)
 *  - An employee with a conflict does not get assigned that block
 *
 * @param rawBlocks     Output of computeNightBlocks (chronological order)
 * @param existingDates Set of "empId|YYYY-MM-DD" that are locked (V, B, manual)
 * @param nightOrder    Ordered employee IDs for the night rotation
 */
export function resolveNightBlocks(
  rawBlocks: NightBlock[],
  existingDates: Set<string>,
  nightOrder: string[]
): NightBlock[] {
  if (nightOrder.length === 0) return rawBlocks;
  if (existingDates.size === 0) return rawBlocks; // fast-path: no conflicts possible

  // Track the most recent startFriday (ms) assigned to each employee during resolution.
  // Employees with no block yet have -Infinity → highest priority for replacement.
  const lastBlockMs = new Map<string, number>();
  for (const id of nightOrder) lastBlockMs.set(id, -Infinity);

  const resolved: NightBlock[] = [];

  // Process blocks in chronological order so "busyOnNights" is always accurate.
  const sorted = [...rawBlocks].sort((a, b) => a.startFriday.getTime() - b.startFriday.getTime());

  for (const block of sorted) {
    const days = nightBlockDays(block);

    // The 7 actual N-shift date strings of this block
    const nDays = [...days.entries()]
      .filter(([, shift]) => shift === "N")
      .map(([dateStr]) => dateStr);

    // ── Check original employee for conflicts ─────────────────────────────────
    const originalConflict = nDays.some((d) =>
      existingDates.has(`${block.employeeId}|${d}`)
    );

    // Also check if this employee was already assigned another block whose days
    // overlap with this block's N-days (e.g. received a transferred block from a
    // previous vacation and now their own subsequent block would cause two
    // consecutive night-shift weeks).
    const alreadyHasOverlappingBlock = resolved.some((r) => {
      if (r.employeeId !== block.employeeId) return false;
      const rDays = nightBlockDays(r);
      return nDays.some((d) => rDays.has(d));
    });

    if (!originalConflict && !alreadyHasOverlappingBlock) {
      // No conflict — keep as-is and update tracking
      resolved.push(block);
      const prev = lastBlockMs.get(block.employeeId) ?? -Infinity;
      if (block.startFriday.getTime() > prev) {
        lastBlockMs.set(block.employeeId, block.startFriday.getTime());
      }
      continue;
    }

    // ── Conflict detected — find a replacement ────────────────────────────────
    // Employees whose blocks already occupy any of this block's N-days
    // (N-overlap = double night; D-overlap = would overwrite N in nightPlan)
    const busyOnNights = new Set<string>([block.employeeId]);
    for (const r of resolved) {
      const rDays = nightBlockDays(r);
      if (nDays.some((d) => rDays.has(d))) {
        busyOnNights.add(r.employeeId);
      }
    }

    // Sort candidates: ascending lastBlockMs → longest without nights first
    const candidates = nightOrder
      .filter((id) => !busyOnNights.has(id))
      .sort((a, b) => (lastBlockMs.get(a) ?? -Infinity) - (lastBlockMs.get(b) ?? -Infinity));

    let assigned = false;
    for (const candidateId of candidates) {
      const candidateConflict = nDays.some((d) =>
        existingDates.has(`${candidateId}|${d}`)
      );
      if (!candidateConflict) {
        resolved.push({ employeeId: candidateId, startFriday: block.startFriday });
        const prev = lastBlockMs.get(candidateId) ?? -Infinity;
        if (block.startFriday.getTime() > prev) {
          lastBlockMs.set(candidateId, block.startFriday.getTime());
        }
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      // All employees have conflicts on these N-days — gap in night coverage.
      // This is an extreme edge case; no block is emitted.
    }
  }

  return resolved;
}

// ─── Normalisation ────────────────────────────────────────────────────────────

/** Return the base shift type (strip the F suffix for holiday variants) */
export function normalizeShift(shift: string): string {
  if (shift === "MF") return "M";
  if (shift === "TF") return "T";
  if (shift === "NF") return "N";
  if (shift === "MN") return "M";
  if (shift === "TN") return "T";
  if (shift === "NN") return "N";
  return shift;
}

function isDayWorkShift(shift: string | null): boolean {
  if (!shift) return false;
  const base = normalizeShift(shift);
  return base === "M" || base === "T" || base === "J";
}

function countTrailingDayWork(entries: { shiftType: string }[], endIndex = entries.length - 1): number {
  let count = 0;
  for (let i = endIndex; i >= 0; i--) {
    if (!isDayWorkShift(entries[i].shiftType)) break;
    count++;
  }
  return count;
}

function countTrailingShift(entries: { shiftType: string }[], shift: string): number {
  let count = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (normalizeShift(entries[i].shiftType) !== shift) break;
    count++;
  }
  return count;
}

function initialForcedRestDaysRemaining(entries: { shiftType: string }[]): number {
  let trailingRestDays = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].shiftType !== "D") break;
    trailingRestDays++;
  }

  if (trailingRestDays !== 1) return 0;

  const workBeforeSingleRest = countTrailingDayWork(entries, entries.length - trailingRestDays - 1);
  return workBeforeSingleRest >= 5 ? 1 : 0;
}

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

// ─── ISO week helper ─────────────────────────────────────────────────────────

/** Return the Monday of the ISO week containing `date` as "YYYY-MM-DD" key */
export function weekKey(date: Date): string {
  const d = date.getUTCDay(); // 0=Sun,1=Mon,...,6=Sat
  const offset = d === 0 ? -6 : 1 - d;
  return toDateStr(addDays(date, offset));
}

// ─── Main algorithm ──────────────────────────────────────────────────────────

/**
 * Generates all shift assignments for a full month.
 *
 * @param employees        List of employees (with id, rotationOrder, shiftPreference)
 * @param year             e.g. 2026
 * @param month            1-12
 * @param existingDates    Set of "employeeId|YYYY-MM-DD" that must NOT be overwritten
 * @param holidayDates     Set of "YYYY-MM-DD" that are public holidays
 * @param prevMonthTail    Last 7 days of month N-1 per employee (continuity)
 * @param nightRotationIds Ordered employee IDs for night rotation
 */
export function generateMonthSchedule(
  employees: ScheduleEmployee[],
  year: number,
  month: number,
  existingDates: Set<string> = new Set(),
  holidayDates: Set<string> = new Set(),
  prevMonthTail: PrevMonthTail[] = [],
  nightRotationIds?: string[],
  options: GenerateMonthScheduleOptions = {}
): GeneratedAssignment[] {
  if (employees.length === 0) return [];

  const daysInMonth = new Date(year, month, 0).getDate();
  const result: GeneratedAssignment[] = [];
  const generatedShiftByKey = new Map<string, string>();
  const previousMonthShiftByKey = new Map<string, string>(
    prevMonthTail.map((assignment) => [
      `${assignment.employeeId}|${assignment.date}`,
      assignment.shiftType,
    ])
  );

  // Sort employees by rotationOrder
  const sortedEmps = [...employees].sort((a, b) => a.rotationOrder - b.rotationOrder);

  // Night rotation order (default: rotationOrder). Employees with Jornada (J)
  // are never part of automatic night blocks; with fewer than 7 eligible people
  // the 7-day block cadence rotates among the available employees.
  const eligibleForNights = sortedEmps.filter((e) => e.shiftPreference !== "J");
  const eligibleNightIds = new Set(eligibleForNights.map((e) => e.id));
  const configuredNightOrder = (nightRotationIds ?? []).filter((id) => eligibleNightIds.has(id));
  const configuredNightOrderSet = new Set(configuredNightOrder);
  const missingNightIds = eligibleForNights
    .map((e) => e.id)
    .filter((id) => !configuredNightOrderSet.has(id));
  const nightOrder: string[] = configuredNightOrder.length > 0
    ? [...configuredNightOrder, ...missingNightIds]
    : eligibleForNights.map((e) => e.id);

  // ── Night blocks ─────────────────────────────────────────────────────────
  // Compute the mathematical rotation, then resolve conflicts: if an employee
  // has any locked day (V, B, manual D…) in their 7 N-shift days, the entire
  // block transfers to the employee who has gone longest without night shifts.
  const rawNightBlocks = computeNightBlocks(year, month, nightOrder);
  const nightBlocks = resolveNightBlocks(rawNightBlocks, existingDates, nightOrder);

  // Map: "empId|YYYY-MM-DD" → base shift from night plan
  // N takes priority over D: a night shift must never be overwritten by a rest day
  // (can happen when the same employee gets both a transferred block and their natural
  // block, whose pre/post-rest D-days overlap with the transferred N-days).
  const nightPlan = new Map<string, string>();
  for (const block of nightBlocks) {
    const days = nightBlockDays(block);
    for (const [dateStr, baseShift] of days) {
      const d = fromDateStr(dateStr);
      if (d.getUTCFullYear() !== year || d.getUTCMonth() + 1 !== month) continue;
      const key = `${block.employeeId}|${dateStr}`;
      // N wins over D: skip writing D if N is already recorded for this slot
      if (nightPlan.get(key) !== "N") {
        nightPlan.set(key, baseShift);
      }
    }
  }

  // ── Prev-month trailing state ─────────────────────────────────────────────
  const prevTailByEmp = new Map<string, { shift: string; count: number; forcedRestDaysRemaining: number }>();
  if (prevMonthTail.length > 0) {
    const byEmp = new Map<string, { date: string; shiftType: string }[]>();
    for (const p of prevMonthTail) {
      if (!byEmp.has(p.employeeId)) byEmp.set(p.employeeId, []);
      byEmp.get(p.employeeId)!.push(p);
    }
    for (const [empId, entries] of byEmp) {
      const sorted = entries.sort((a, b) => a.date.localeCompare(b.date));
      const lastShift = normalizeShift(sorted[sorted.length - 1].shiftType);
      const count = isDayWorkShift(lastShift)
        ? countTrailingDayWork(sorted)
        : countTrailingShift(sorted, lastShift);
      prevTailByEmp.set(empId, {
        shift: lastShift,
        count,
        forcedRestDaysRemaining: initialForcedRestDaysRemaining(sorted),
      });
    }
  }

  // ── Per-employee state ────────────────────────────────────────────────────
  interface EmpState {
    consecutiveShift: string | null;
    consecutiveCount: number;
    forcedRestDaysRemaining: number;
    weekShift: Map<string, string>; // weekKey → "M" | "T"
    weekendShift: Map<string, "MF" | "TF">; // weekKey → "MF" | "TF"
    mCount: number;
    tCount: number;
  }

  const stateMap = new Map<string, EmpState>();
  for (const emp of sortedEmps) {
    const prev = prevTailByEmp.get(emp.id);
    stateMap.set(emp.id, {
      consecutiveShift: prev?.shift ?? null,
      consecutiveCount: prev?.count ?? 0,
      forcedRestDaysRemaining: prev?.forcedRestDaysRemaining ?? 0,
      weekShift: new Map(),
      weekendShift: new Map(),
      mCount: 0,
      tCount: 0,
    });
  }

  // ── Day-by-day assignment ─────────────────────────────────────────────────
  const dayCoverage = new Map<string, { M: number; T: number }>();

  type WeekendPackage = { mfEmpId: string | null; tfEmpId: string | null };

  // Weekend package plan: Saturday date string → package owner for MF/TF.
  // Friday/Monday holidays glued to that weekend reuse the same package.
  const weekendPlan = new Map<string, WeekendPackage>();

  const getPreviousShift = (employeeId: string, date: Date): string | null => {
    const previousDateStr = toDateStr(addDays(date, -1));
    const key = `${employeeId}|${previousDateStr}`;
    return (
      generatedShiftByKey.get(key) ??
      options.existingAssignments?.get(key) ??
      previousMonthShiftByKey.get(key) ??
      null
    );
  };

  const applyTransitionCompliance = (
    employeeId: string,
    date: Date,
    shiftType: string
  ): { shiftType: string; adjusted: boolean } => {
    if (!isValidShiftType(shiftType)) return { shiftType, adjusted: false };
    const prevShift = getPreviousShift(employeeId, date);
    if (!prevShift || !isValidShiftType(prevShift)) return { shiftType, adjusted: false };

    const transition = validateShiftTransition(prevShift, shiftType);
    if (transition.valid) return { shiftType, adjusted: false };

    options.warnings?.push({
      employeeId,
      date: toDateStr(date),
      prevShift,
      nextShift: shiftType,
      hoursGap: transition.hoursGap,
      reason: `Transición ${prevShift}→${shiftType} deja ${transition.hoursGap}h de descanso`,
    });
    return { shiftType: "D", adjusted: true };
  };

  const pushAssignment = (
    employeeId: string,
    date: Date,
    shiftType: string,
    state: EmpState,
    wKey: string,
    cov: { M: number; T: number }
  ): void => {
    const compliance = applyTransitionCompliance(employeeId, date, shiftType);
    const compliantShift = compliance.shiftType;
    if (compliance.adjusted && shiftType !== "D") {
      state.forcedRestDaysRemaining = Math.max(state.forcedRestDaysRemaining, 1);
    }
    result.push({ employeeId, date, shiftType: compliantShift });
    generatedShiftByKey.set(`${employeeId}|${toDateStr(date)}`, compliantShift);
    _updateState(state, compliantShift, wKey, cov);
  };

  const isInGeneratedMonth = (date: Date): boolean =>
    date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month;

  const getWeekendPackageDates = (satDate: Date): Date[] => {
    const dates: Date[] = [];
    const friDate = addDays(satDate, -1);
    const sunDate = addDays(satDate, 1);
    const monDate = addDays(satDate, 2);

    if (isInGeneratedMonth(friDate) && holidayDates.has(toDateStr(friDate))) dates.push(friDate);
    if (isInGeneratedMonth(satDate)) dates.push(satDate);
    if (isInGeneratedMonth(sunDate)) dates.push(sunDate);
    if (isInGeneratedMonth(monDate) && holidayDates.has(toDateStr(monDate))) dates.push(monDate);
    return dates;
  };

  const getWeekendSaturdayForDate = (date: Date, isHolidayDay: boolean): Date | null => {
    const dow = date.getUTCDay();
    if (dow === 6) return date;
    if (dow === 0) return addDays(date, -1);
    if (dow === 5 && isHolidayDay) return addDays(date, 1);
    if (dow === 1 && isHolidayDay) return addDays(date, -2);
    return null;
  };

  const respectsPackageTransitions = (
    employeeId: string,
    targetShift: "MF" | "TF",
    packageDates: Date[]
  ): boolean => {
    if (packageDates.length === 0) return false;
    let previousShift = getPreviousShift(employeeId, packageDates[0]);

    for (const packageDate of packageDates) {
      const shift = applyChristmasSpecialRule(targetShift, packageDate);
      if (previousShift && isValidShiftType(previousShift) && isValidShiftType(shift)) {
        const transition = validateShiftTransition(previousShift, shift);
        if (!transition.valid) return false;
      }
      previousShift = shift;
    }

    return true;
  };

  const wouldExceedWorkWindow = (
    state: EmpState,
    packageDates: Date[],
    planningDate: Date
  ): boolean => {
    if (packageDates.length === 0 || !isDayWorkShift(state.consecutiveShift)) return false;
    const firstPackageDate = packageDates[0];
    const daysUntilPackage = Math.max(
      0,
      Math.round((firstPackageDate.getTime() - planningDate.getTime()) / 86_400_000)
    );
    return state.consecutiveCount + daysUntilPackage + packageDates.length > 5;
  };

  const ensureWeekendPlan = (satDate: Date, planningDate = satDate): WeekendPackage => {
    const satStr = toDateStr(satDate);
    const existingPlan = weekendPlan.get(satStr);
    if (existingPlan) return existingPlan;

    const packageDates = getWeekendPackageDates(satDate);
    const packageWeekKey = weekKey(satDate);

    const availableForPackage = (enforceRestWindow: boolean): ScheduleEmployee[] =>
      sortedEmps.filter((e) => {
        if (e.shiftPreference === "J") return false;
        if (packageDates.length === 0) return false;

        for (const packageDate of packageDates) {
          const key = `${e.id}|${toDateStr(packageDate)}`;
          if (existingDates.has(key) || nightPlan.has(key)) return false;
        }

        const s = stateMap.get(e.id)!;
        if (s.forcedRestDaysRemaining > 0) return false;

        if (enforceRestWindow && wouldExceedWorkWindow(s, packageDates, planningDate)) return false;

        return true;
      });

    const pickEmployee = (
      targetShift: "MF" | "TF",
      candidates: ScheduleEmployee[],
      excludedId?: string,
      preferPreservingWeekdayCoverage = false
    ): ScheduleEmployee | null =>
      _pickWeekendPackageEmployee(
        targetShift,
        candidates.filter(
          (candidate) =>
            candidate.id !== excludedId &&
            respectsPackageTransitions(candidate.id, targetShift, packageDates)
        ),
        stateMap,
        packageWeekKey,
        preferPreservingWeekdayCoverage
      );

    const strictAvailable = availableForPackage(true);
    let mfEmp = pickEmployee("MF", strictAvailable);
    let tfEmp = pickEmployee("TF", strictAvailable, mfEmp?.id);

    if (!mfEmp || !tfEmp) {
      const relaxedAvailable = availableForPackage(false);
      mfEmp = mfEmp ?? pickEmployee("MF", relaxedAvailable, undefined, true);
      tfEmp = tfEmp ?? pickEmployee("TF", relaxedAvailable, mfEmp?.id, true);
    }

    const plan = {
      mfEmpId: mfEmp?.id ?? null,
      tfEmpId: tfEmp?.id ?? null,
    };
    weekendPlan.set(satStr, plan);
    return plan;
  };

  const getWeekendPackageShift = (
    employeeId: string,
    date: Date,
    isHolidayDay: boolean
  ): string | null => {
    const satDate = getWeekendSaturdayForDate(date, isHolidayDay);
    if (!satDate) return null;

    const packageDates = getWeekendPackageDates(satDate).map(toDateStr);
    if (!packageDates.includes(toDateStr(date))) return null;

    const pkg = ensureWeekendPlan(satDate, date);
    if (pkg.mfEmpId === employeeId) return "MF";
    if (pkg.tfEmpId === employeeId) return "TF";
    return "D";
  };

  const claimOpenWeekendPackageShift = (
    employeeId: string,
    date: Date,
    isHolidayDay: boolean,
    cov: { M: number; T: number }
  ): string | null => {
    const satDate = getWeekendSaturdayForDate(date, isHolidayDay);
    if (!satDate) return null;

    const packageDateStrs = getWeekendPackageDates(satDate).map(toDateStr);
    if (!packageDateStrs.includes(toDateStr(date))) return null;

    const pkg = ensureWeekendPlan(satDate, date);
    if (pkg.mfEmpId === employeeId || pkg.tfEmpId === employeeId) return null;

    const canClaim = (targetShift: "MF" | "TF"): boolean => {
      const slotEmployeeId = targetShift === "MF" ? pkg.mfEmpId : pkg.tfEmpId;
      if (slotEmployeeId !== null) {
        const slotKey = `${slotEmployeeId}|${toDateStr(date)}`;
        const slotState = stateMap.get(slotEmployeeId);
        const slotUnavailable =
          generatedShiftByKey.get(slotKey) === "D" ||
          existingDates.has(slotKey) ||
          nightPlan.has(slotKey) ||
          (slotState?.forcedRestDaysRemaining ?? 0) > 0 ||
          Boolean(slotState && slotState.consecutiveCount >= 5 && isDayWorkShift(slotState.consecutiveShift));

        if (!slotUnavailable) return false;
        if (targetShift === "MF") pkg.mfEmpId = null;
        if (targetShift === "TF") pkg.tfEmpId = null;
      }

      if (targetShift === "MF" && cov.M >= 1) return false;
      if (targetShift === "TF" && cov.T >= 1) return false;

      const employee = sortedEmps.find((e) => e.id === employeeId);
      if (!employee || employee.shiftPreference === "J") return false;

      for (const packageDateStr of packageDateStrs) {
        if (packageDateStr < toDateStr(date)) continue;
        const key = `${employeeId}|${packageDateStr}`;
        if (existingDates.has(key) || nightPlan.has(key)) return false;
      }

      const shift = applyChristmasSpecialRule(targetShift, date);
      const previousShift = getPreviousShift(employeeId, date);
      if (previousShift && isValidShiftType(previousShift) && isValidShiftType(shift)) {
        return validateShiftTransition(previousShift, shift).valid;
      }

      return true;
    };

    if (canClaim("MF")) {
      pkg.mfEmpId = employeeId;
      return "MF";
    }

    if (canClaim("TF")) {
      pkg.tfEmpId = employeeId;
      return "TF";
    }

    return null;
  };

  const releaseWeekendPackageShift = (
    employeeId: string,
    date: Date,
    isHolidayDay: boolean
  ): void => {
    const satDate = getWeekendSaturdayForDate(date, isHolidayDay);
    if (!satDate) return;

    const pkg = weekendPlan.get(toDateStr(satDate));
    if (!pkg) return;
    if (pkg.mfEmpId === employeeId) pkg.mfEmpId = null;
    if (pkg.tfEmpId === employeeId) pkg.tfEmpId = null;
  };

  const getWeekendPackageShiftBySaturday = (
    employeeId: string,
    satDate: Date,
    planningDate: Date
  ): string | null => {
    const pkg = ensureWeekendPlan(satDate, planningDate);
    if (pkg.mfEmpId === employeeId) return "MF";
    if (pkg.tfEmpId === employeeId) return "TF";
    return null;
  };

  const getPrepRestSaturday = (date: Date, isHolidayDay: boolean): Date | null => {
    const dow = date.getUTCDay();
    const friday = dow === 3 ? addDays(date, 2) : dow === 4 ? addDays(date, 1) : date;

    if ((dow === 3 || dow === 4) && holidayDates.has(toDateStr(friday))) {
      return addDays(friday, 1);
    }

    if (dow === 4) return addDays(date, 2);
    if (dow === 5 && !isHolidayDay) return addDays(date, 1);
    return null;
  };

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month - 1, day));
    const dateStr = toDateStr(date);
    const isHoliday = holidayDates.has(dateStr);
    const wKey = weekKey(date);

    if (!dayCoverage.has(dateStr)) dayCoverage.set(dateStr, { M: 0, T: 0 });
    const cov = dayCoverage.get(dateStr)!;

    // BUG-30 fix: process preference-less employees first each day so that
    // coverage urgency (RF-16 hard minimum) is resolved by neutral employees.
    // Preference employees (M/T) are processed last and find urgency already met.
    // "J" is treated as preference-less for ordering (no M/T urgency impact).
    const dailyOrder = [...sortedEmps].sort((a, b) => {
      const aPref = (a.shiftPreference === "M" || a.shiftPreference === "T") ? 1 : 0;
      const bPref = (b.shiftPreference === "M" || b.shiftPreference === "T") ? 1 : 0;
      return aPref - bPref || a.rotationOrder - b.rotationOrder;
    });

    const canLaterEmployeeCover = (targetBaseShift: "M" | "T", currentIndex: number): boolean =>
      dailyOrder.slice(currentIndex + 1).some((candidate) => {
        const candidateState = stateMap.get(candidate.id)!;
        if (candidateState.weekShift.get(wKey) !== targetBaseShift) return false;

        const candidateKey = `${candidate.id}|${dateStr}`;
        if (existingDates.has(candidateKey) || nightPlan.has(candidateKey)) return false;

        const candidateNeedsRest =
          candidateState.forcedRestDaysRemaining > 0 ||
          (candidateState.consecutiveCount >= 5 && isDayWorkShift(candidateState.consecutiveShift));
        if (candidateNeedsRest) return false;

        const candidatePrepRestSaturday = getPrepRestSaturday(date, isHoliday);
        if (
          candidatePrepRestSaturday &&
          getWeekendPackageShiftBySaturday(candidate.id, candidatePrepRestSaturday, date) &&
          wouldExceedWorkWindow(candidateState, getWeekendPackageDates(candidatePrepRestSaturday), date)
        ) {
          return false;
        }

        const candidateShift = applyChristmasSpecialRule(targetBaseShift, date);
        const previousShift = getPreviousShift(candidate.id, date);
        if (previousShift && isValidShiftType(previousShift) && isValidShiftType(candidateShift)) {
          return validateShiftTransition(previousShift, candidateShift).valid;
        }

        return true;
      });

    for (let orderIndex = 0; orderIndex < dailyOrder.length; orderIndex++) {
      const emp = dailyOrder[orderIndex];
      const key = `${emp.id}|${dateStr}`;
      const state = stateMap.get(emp.id)!;

      // Priority 1/2: existing / locked (manual, V, B) — skip, do not emit
      if (existingDates.has(key)) {
        // Reset consecutive tracking conservatively
        state.consecutiveShift = null;
        state.consecutiveCount = 0;
        continue;
      }

      // Priority 3: night block
      if (nightPlan.has(key)) {
        const baseShift = nightPlan.get(key)!;
        const finalShift = baseShift === "N"
          ? applyChristmasSpecialRule(applySpecialDayRule("N", date, holidayDates), date)
          : "D";
        pushAssignment(emp.id, date, finalShift, state, wKey, cov);
        continue;
      }

      const weekendPackageShift = getWeekendPackageShift(emp.id, date, isHoliday);
      const prepRestSaturday = getPrepRestSaturday(date, isHoliday);
      if (
        prepRestSaturday &&
        getWeekendPackageShiftBySaturday(emp.id, prepRestSaturday, date) &&
        wouldExceedWorkWindow(state, getWeekendPackageDates(prepRestSaturday), date)
      ) {
        state.forcedRestDaysRemaining = Math.max(state.forcedRestDaysRemaining, 1);
        pushAssignment(emp.id, date, "D", state, wKey, cov);
        continue;
      }

      // Priority 4: force 2 consecutive rest days after ≥5 consecutive day-work
      // shifts (M/T/J, including MF/TF variants). Night blocks have their own
      // pre/post rest plan and are handled before this branch.
      const needsRest =
        state.consecutiveCount >= 5 &&
        isDayWorkShift(state.consecutiveShift);

      if (state.forcedRestDaysRemaining > 0 || needsRest) {
        if (weekendPackageShift && weekendPackageShift !== "D") {
          releaseWeekendPackageShift(emp.id, date, isHoliday);
        }
        if (state.forcedRestDaysRemaining > 0) {
          state.forcedRestDaysRemaining--;
        } else {
          state.forcedRestDaysRemaining = 1;
        }
        pushAssignment(emp.id, date, "D", state, wKey, cov);
        continue;
      }

      const resolvedWeekendPackageShift =
        weekendPackageShift === "D"
          ? (claimOpenWeekendPackageShift(emp.id, date, isHoliday, cov) ?? weekendPackageShift)
          : weekendPackageShift;

      // Weekend days and adjacent Friday/Monday holidays share the same package.
      if (resolvedWeekendPackageShift !== null) {
        pushAssignment(
          emp.id,
          date,
          resolvedWeekendPackageShift === "D"
            ? "D"
            : applyChristmasSpecialRule(resolvedWeekendPackageShift, date),
          state,
          wKey,
          cov
        );
        continue;
      }

      // Weekday holiday: per-employee assignment respecting preference (BUG-35 fix)
      if (isHoliday) {
        const shift = _pickWeekendShift(emp, state, cov, wKey);
        pushAssignment(emp.id, date, applyChristmasSpecialRule(shift, date), state, wKey, cov);
        continue;
      }

      // Workday (Mon–Fri, non-holiday)
      const weeklyShift = state.weekShift.get(wKey) ?? null;
      const canPreserveWeeklyShift =
        (weeklyShift === "M" && cov.M >= 1 && cov.T < 1 && canLaterEmployeeCover("T", orderIndex)) ||
        (weeklyShift === "T" && cov.T >= 1 && cov.M < 1 && canLaterEmployeeCover("M", orderIndex));
      const shift = _pickWorkdayShift(emp, state, cov, wKey, canPreserveWeeklyShift);
      pushAssignment(emp.id, date, applyChristmasSpecialRule(shift, date), state, wKey, cov);
    }
  }

  return result;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function _updateState(
  state: {
    consecutiveShift: string | null;
    consecutiveCount: number;
    forcedRestDaysRemaining: number;
    weekShift: Map<string, string>;
    weekendShift: Map<string, "MF" | "TF">;
    mCount: number;
    tCount: number;
  },
  shift: string,
  wKey: string,
  cov: { M: number; T: number }
): void {
  const base = normalizeShift(shift);

  // Consecutive work-day tracking (BUG-36 fix): any work day (M or T, including
  // their MF/TF weekend variants after normalisation) continues the streak,
  // regardless of M↔T switches. Only non-work shifts (D, N, J, V, B) reset it.
  const isWorkDay = isDayWorkShift(base);
  const prevIsWorkDay = isDayWorkShift(state.consecutiveShift);
  if (isWorkDay && prevIsWorkDay) {
    state.consecutiveCount++;
    state.consecutiveShift = base;
  } else {
    state.consecutiveShift = base;
    state.consecutiveCount = 1;
  }

  if (base === "M") {
    state.mCount++;
    cov.M++;
    if (!state.weekShift.has(wKey)) state.weekShift.set(wKey, "M");
    if ((shift === "MF" || shift === "MN") && !state.weekendShift.has(wKey)) {
      state.weekendShift.set(wKey, "MF");
    }
  } else if (base === "T") {
    state.tCount++;
    cov.T++;
    if (!state.weekShift.has(wKey)) state.weekShift.set(wKey, "T");
    if ((shift === "TF" || shift === "TN") && !state.weekendShift.has(wKey)) {
      state.weekendShift.set(wKey, "TF");
    }
  }
}

function _pickWeekendShift(
  emp: ScheduleEmployee,
  state: {
    pref?: string | null;
    mCount: number;
    tCount: number;
    weekShift: Map<string, string>;
    weekendShift: Map<string, "MF" | "TF">;
  },
  cov: { M: number; T: number },
  wKey: string
): string {
  const pref = emp.shiftPreference ?? null;

  // Jornada (J): only works Mon–Fri, always rests on weekends/holidays
  if (pref === "J") return "D";

  const mOpen = cov.M < 1;
  const tOpen = cov.T < 1;

  // Hard minimum: both slots filled → rest
  if (!mOpen && !tOpen) return "D";

  const fixedWeekendShift = state.weekendShift.get(wKey) ?? null;
  if (fixedWeekendShift === "MF") return mOpen ? "MF" : "D";
  if (fixedWeekendShift === "TF") return tOpen ? "TF" : "D";

  // Weekly consistency: honor the weekly pattern strictly.
  // If the employee's preferred slot is already covered, they rest rather than
  // switching to the opposite shift type (BUG-35 fix).
  const weeklyShift = state.weekShift.get(wKey) ?? null;
  if (weeklyShift === "M") return mOpen ? "MF" : "D";
  if (weeklyShift === "T") return tOpen ? "TF" : "D";

  // No weekly constraint — preference then balance
  if (pref === "M" && mOpen) return "MF";
  if (pref === "T" && tOpen) return "TF";
  // Preference slot taken — rest rather than switch type (BUG-35 fix)
  if (pref === "M" || pref === "T") return "D";

  if (mOpen && tOpen) {
    return state.mCount <= state.tCount ? "MF" : "TF";
  }
  if (mOpen) return "MF";
  return "TF";
}

function _pickWeekendPackageEmployee(
  targetShift: "MF" | "TF",
  candidates: ScheduleEmployee[],
  stateMap: Map<string, {
    mCount: number;
    tCount: number;
    weekShift: Map<string, string>;
    weekendShift: Map<string, "MF" | "TF">;
  }>,
  wKey: string,
  preferPreservingWeekdayCoverage = false
): ScheduleEmployee | null {
  const targetBase = targetShift === "MF" ? "M" : "T";

  const compatibleCandidates = candidates.filter((candidate) => {
    const state = stateMap.get(candidate.id)!;
    const fixedWeekendShift = state.weekendShift.get(wKey) ?? null;
    return fixedWeekendShift === null || fixedWeekendShift === targetShift;
  });

  if (compatibleCandidates.length === 0) return null;

  return [...compatibleCandidates].sort((a, b) => {
    const aState = stateMap.get(a.id)!;
    const bState = stateMap.get(b.id)!;
    const aWeeklyShift = aState.weekShift.get(wKey) ?? null;
    const bWeeklyShift = bState.weekShift.get(wKey) ?? null;
    const aCoveragePenalty = preferPreservingWeekdayCoverage && aWeeklyShift === targetBase ? 1 : 0;
    const bCoveragePenalty = preferPreservingWeekdayCoverage && bWeeklyShift === targetBase ? 1 : 0;
    const aWeeklyPenalty = aWeeklyShift !== null && aWeeklyShift !== targetBase ? 1 : 0;
    const bWeeklyPenalty = bWeeklyShift !== null && bWeeklyShift !== targetBase ? 1 : 0;
    const aPreferencePenalty =
      a.shiftPreference === null || a.shiftPreference === undefined || a.shiftPreference === targetBase ? 0 : 1;
    const bPreferencePenalty =
      b.shiftPreference === null || b.shiftPreference === undefined || b.shiftPreference === targetBase ? 0 : 1;
    const aCount = targetBase === "M" ? aState.mCount : aState.tCount;
    const bCount = targetBase === "M" ? bState.mCount : bState.tCount;

    return (
      aCoveragePenalty - bCoveragePenalty ||
      aWeeklyPenalty - bWeeklyPenalty ||
      aPreferencePenalty - bPreferencePenalty ||
      aCount - bCount ||
      a.rotationOrder - b.rotationOrder
    );
  })[0] ?? null;
}

function _pickWorkdayShift(
  emp: ScheduleEmployee,
  state: {
    pref?: string | null;
    mCount: number;
    tCount: number;
    weekShift: Map<string, string>;
    consecutiveShift: string | null;
    consecutiveCount: number;
  },
  cov: { M: number; T: number },
  wKey: string,
  preserveWeeklyShiftForLaterCoverage = false
): string {
  const pref = emp.shiftPreference ?? null;

  // Jornada (J): works Mon–Fri with J shift type, always rests on weekends/holidays.
  // J does not count toward M/T coverage — handled by _pickWeekendShift returning "D".
  if (pref === "J") return "J";

  // Weekly consistency: if already assigned M or T this week, prefer keeping same
  const weeklyShift = state.weekShift.get(wKey) ?? null;
  if (preserveWeeklyShiftForLaterCoverage && (weeklyShift === "M" || weeklyShift === "T")) {
    return weeklyShift;
  }

  // Hard minimum (RF-16): ≥1M and ≥1T — handle urgency first.
  // BUG-30 fix: dailyOrder (see caller) processes preference-null employees first each day
  // so urgency is resolved by neutral employees before preference employees arrive.
  // These lines then almost never fire against preference, but must remain for the
  // edge case where all neutral employees are in night blocks (RF-16 must hold).
  const urgentM = cov.M < 1;
  const urgentT = cov.T < 1;
  if (urgentM && !urgentT && weeklyShift === null) return "M";
  if (urgentT && !urgentM && weeklyShift === null) return "T";
  if (urgentM && !urgentT && weeklyShift !== "M") return "M";
  if (urgentT && !urgentM && weeklyShift !== "T") return "T";

  // Weekly consistency: maintain same shift type all week
  if (weeklyShift === "M") return "M";
  if (weeklyShift === "T") return "T";

  // No weeklyShift yet for this week — seed it with the employee's preference
  // when coverage is already satisfied, so the rest of the week stays consistent.
  const softNeedM = cov.M < 2;
  const softNeedT = cov.T < 2;

  // Prefer seeding with employee's preference when possible
  if (pref === "M" && !softNeedT) { state.weekShift.set(wKey, "M"); return "M"; }
  if (pref === "T" && !softNeedM) { state.weekShift.set(wKey, "T"); return "T"; }

  // Soft target ≥2M and ≥2T (best effort — do not override employee preference)
  if (softNeedM && !softNeedT && pref !== "T") return "M";
  if (softNeedT && !softNeedM && pref !== "M") return "T";

  // Coverage met (or preference takes priority over soft target) — preference then equitable
  if (pref === "M") return "M";
  if (pref === "T") return "T";
  return state.mCount <= state.tCount ? "M" : "T";
}
