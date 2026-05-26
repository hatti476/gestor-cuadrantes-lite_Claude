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

/** Warning emitted when a day has reduced coverage due to mandatory rest rules. */
export interface CoverageWarning {
  date: string; // "YYYY-MM-DD"
  employeeId: string;
  message: string;
}

export interface GenerateMonthScheduleOptions {
  existingAssignments?: Map<string, string>;
  warnings?: GenerationWarning[];
  coverageWarnings?: CoverageWarning[];
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

// ─── Exported helpers ─────────────────────────────────────────────────────────

/**
 * Counts consecutive work days (M/T/J including their MF/TF variants) going
 * backward from `date` (not including `date` itself).
 * Looks up assignments and, optionally, prevMonthTail to cross month boundaries.
 */
export function countConsecutiveWorkDays(
  employeeId: string,
  date: Date,
  assignments: { employeeId: string; date: Date | string; shiftType: string }[],
  prevMonthTail?: PrevMonthTail[]
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
  // Night-block pre/post-rest days that must not be converted to work by coverage repair.
  // These mandatory rest days are analogous to Priority-2 HARD forced-rest days.
  const nightBlockRestDates = new Set<string>();
  // Cross-month post-rest dates populated by TAREA 2 below; pre-seeded into
  // forcedRestDates so the repair phase cannot convert them even in relaxed mode.
  const crossMonthRestDates = new Set<string>();
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
      // Mark pre-rest and post-rest days as protected from coverage repair
      if (baseShift === "D") {
        nightBlockRestDates.add(key);
      }
    }
  }

  // ── Night block continuity from prevMonthTail (TAREA 2 fix) ────────────────
  // Detect employees who were mid-block at the end of the previous month and
  // give them absolute priority to complete their nights at the start of this month.
  if (prevMonthTail.length > 0) {
    const prevByEmpNight = new Map<string, PrevMonthTail[]>();
    for (const p of prevMonthTail) {
      if (!prevByEmpNight.has(p.employeeId)) prevByEmpNight.set(p.employeeId, []);
      prevByEmpNight.get(p.employeeId)!.push(p);
    }

    for (const [empId, entries] of prevByEmpNight) {
      const sorted = entries.sort((a, b) => a.date.localeCompare(b.date));

      // Count trailing N/NF nights from the end of prevMonthTail
      let trailingNights = 0;
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (normalizeShift(sorted[i].shiftType) !== "N") break;
        trailingNights++;
      }

      // Count trailing D shifts (potential post-rest period)
      let trailingPostRestD = 0;
      if (trailingNights === 0) {
        let checkIdx = sorted.length - 1;
        while (checkIdx >= 0 && sorted[checkIdx].shiftType === "D") {
          trailingPostRestD++;
          checkIdx--;
        }
        // Validate: there must be N shifts before the D for it to count as post-rest
        if (trailingPostRestD > 0 && (checkIdx < 0 || normalizeShift(sorted[checkIdx].shiftType) !== "N")) {
          trailingPostRestD = 0;
        }
      }

      const monthStart = new Date(Date.UTC(year, month - 1, 1));

      if (trailingNights > 0 && trailingNights < 7) {
        // Employee mid-block: add remaining nights + 3D post-rest to nightPlan with priority.
        // Stop immediately if a locked date (V/B/manual) interrupts the continuation —
        // vacation breaks the block; the employee returns to normal rotation after absence.
        const nightsRemaining = 7 - trailingNights;
        let contDate = monthStart;
        let actualNightsPlanned = 0;

        // Override nightPlan for remaining night dates, clearing conflicting N entries
        for (let i = 0; i < nightsRemaining; i++) {
          if (contDate.getUTCFullYear() !== year || contDate.getUTCMonth() + 1 !== month) break;
          const ds = toDateStr(contDate);
          const empKey = `${empId}|${ds}`;
          // If the employee has a locked date (V, B, manual), the block is interrupted.
          // Stop planning — no night continuation and no post-rest after vacation.
          if (existingDates.has(empKey)) break;
          // Remove conflicting N from any other employee assigned to this date
          for (const [existingKey, existingShift] of nightPlan.entries()) {
            if (existingKey !== empKey && existingKey.endsWith(`|${ds}`) && existingShift === "N") {
              nightPlan.delete(existingKey);
            }
          }
          nightPlan.set(empKey, "N");
          actualNightsPlanned++;
          contDate = addDays(contDate, 1);
        }
        // Add 3D post-rest only if at least one night was actually planned
        if (actualNightsPlanned > 0) {
          for (let i = 0; i < 3; i++) {
            if (contDate.getUTCFullYear() !== year || contDate.getUTCMonth() + 1 !== month) break;
            const ds = toDateStr(contDate);
            const empKey = `${empId}|${ds}`;
            if (existingDates.has(empKey)) break; // vacation/baja covers rest — stop
            if (nightPlan.get(empKey) !== "N") {
              nightPlan.set(empKey, "D");
              crossMonthRestDates.add(empKey);
            }
            contDate = addDays(contDate, 1);
          }
        }
      } else if (trailingNights >= 7) {
        // Employee completed all 7 nights: add 3D post-rest in new month.
        // Skip if vacation/baja is covering the rest period.
        let contDate = monthStart;
        for (let i = 0; i < 3; i++) {
          if (contDate.getUTCFullYear() !== year || contDate.getUTCMonth() + 1 !== month) break;
          const ds = toDateStr(contDate);
          const empKey = `${empId}|${ds}`;
          if (existingDates.has(empKey)) break; // vacation/baja acts as rest — stop
          if (nightPlan.get(empKey) !== "N") {
            nightPlan.set(empKey, "D");
            crossMonthRestDates.add(empKey);
          }
          contDate = addDays(contDate, 1);
        }
      } else if (trailingPostRestD >= 2 && trailingPostRestD < 3) {
        // Employee in post-rest: add remaining D days (≥2 trailing D required to be
        // unambiguously post-rest; a single trailing D might be a mid-block interruption)
        const postRestNeeded = 3 - trailingPostRestD;
        let contDate = monthStart;
        for (let i = 0; i < postRestNeeded; i++) {
          if (contDate.getUTCFullYear() !== year || contDate.getUTCMonth() + 1 !== month) break;
          const ds = toDateStr(contDate);
          const empKey = `${empId}|${ds}`;
          if (existingDates.has(empKey)) break; // vacation/baja covers rest — stop
          if (nightPlan.get(empKey) !== "N") nightPlan.set(empKey, "D");
          contDate = addDays(contDate, 1);
        }
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
    weekendCount: number; // total weekend packages (Sat+Sun) assigned this month
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
      weekendCount: 0,
    });
  }

  // ── Pre-generation availability check (Sprint 18 Tarea 2) ─────────────────
  // Count employees available (not locked by V/B/manual) per day.
  // Emit warnings before generation when coverage is critically low.
  const availablePerDay = new Map<string, number>();
  for (let avDay = 1; avDay <= daysInMonth; avDay++) {
    const avDate = new Date(Date.UTC(year, month - 1, avDay));
    const avDateStr = toDateStr(avDate);
    const available = sortedEmps.filter(
      (emp) => !existingDates.has(`${emp.id}|${avDateStr}`)
    ).length;
    availablePerDay.set(avDateStr, available);
    if (available < 2 && options.coverageWarnings) {
      if (available === 0) {
        options.coverageWarnings.push({
          date: avDateStr,
          employeeId: "",
          message: `⚠️ Sin cobertura el ${avDateStr.slice(8, 10)}/${avDateStr.slice(5, 7)}: todos los empleados tienen ausencia programada.`,
        });
      } else {
        options.coverageWarnings.push({
          date: avDateStr,
          employeeId: "",
          message: `Atención: el ${avDateStr.slice(8, 10)}/${avDateStr.slice(5, 7)} solo tiene ${available} empleado(s) disponible(s). La cobertura mínima no puede garantizarse.`,
        });
      }
    }
  }

  // ── Day-by-day assignment ─────────────────────────────────────────────────
  const dayCoverage = new Map<string, { M: number; T: number }>();

  type WeekendPackage = { mfEmpId: string | null; tfEmpId: string | null };

  // Weekend package plan: Saturday date string → package owner for MF/TF.
  // Friday/Monday holidays glued to that weekend reuse the same package.
  const weekendPlan = new Map<string, WeekendPackage>();

  // ── Weekend pack continuity from prevMonthTail (Sprint 18 Tarea 1) ─────────
  // If the previous month ended on a Saturday with MF/TF assignments, and the
  // first day of the current month is a Sunday, pre-seed the weekendPlan so
  // that Sunday is assigned to the same employees with the same shift type.
  {
    const lastDayOfPrevMonth = new Date(Date.UTC(year, month - 1, 0));
    if (prevMonthTail.length > 0 && lastDayOfPrevMonth.getUTCDay() === 6) {
      const lastDayStr = toDateStr(lastDayOfPrevMonth);
      const mfEntry = prevMonthTail.find(
        (p) => p.date === lastDayStr && p.shiftType === "MF"
      );
      const tfEntry = prevMonthTail.find(
        (p) => p.date === lastDayStr && p.shiftType === "TF"
      );
      if (mfEntry || tfEntry) {
        // Pre-seed weekendPlan keyed by the Saturday from the previous month
        weekendPlan.set(lastDayStr, {
          mfEmpId: mfEntry?.employeeId ?? null,
          tfEmpId: tfEntry?.employeeId ?? null,
        });
        // Reserve weekendShift and weekShift for the first week of the new month
        const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1));
        if (firstDayOfMonth.getUTCDay() === 0) {
          const wk = weekKey(firstDayOfMonth);
          if (mfEntry) {
            const st = stateMap.get(mfEntry.employeeId);
            if (st) {
              if (!st.weekendShift.has(wk)) st.weekendShift.set(wk, "MF");
              if (!st.weekShift.has(wk)) st.weekShift.set(wk, "M");
            }
          }
          if (tfEntry) {
            const st = stateMap.get(tfEntry.employeeId);
            if (st) {
              if (!st.weekendShift.has(wk)) st.weekendShift.set(wk, "TF");
              if (!st.weekShift.has(wk)) st.weekShift.set(wk, "T");
            }
          }
        }
      }
    }
  }

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

  const wouldBreakTransition = (employeeId: string, date: Date, shiftType: string): boolean => {
    if (!isValidShiftType(shiftType)) return false;
    const prevShift = getPreviousShift(employeeId, date);
    if (!prevShift || !isValidShiftType(prevShift)) return false;
    return !validateShiftTransition(prevShift, shiftType).valid;
  };

  const ensureSecondRestAfterWork = (
    employeeId: string,
    date: Date,
    state: EmpState
  ): void => {
    const previousShift = getPreviousShift(employeeId, date);
    if (previousShift && isDayWorkShift(previousShift)) {
      state.forcedRestDaysRemaining = Math.max(state.forcedRestDaysRemaining, 1);
    }
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
    const sunDate = addDays(satDate, 1);
    const dates: Date[] = [];

    // Expand backward: consecutive holiday weekdays before Saturday (Thu, Fri, …)
    const backDates: Date[] = [];
    let back = addDays(satDate, -1);
    while (isInGeneratedMonth(back) && holidayDates.has(toDateStr(back))) {
      backDates.unshift(back);
      back = addDays(back, -1);
    }
    dates.push(...backDates);

    // Core: Saturday and Sunday
    if (isInGeneratedMonth(satDate)) dates.push(satDate);
    if (isInGeneratedMonth(sunDate)) dates.push(sunDate);

    // Expand forward: consecutive holiday weekdays after Sunday (Mon, Tue, …)
    let fwd = addDays(sunDate, 1);
    while (isInGeneratedMonth(fwd) && holidayDates.has(toDateStr(fwd))) {
      dates.push(fwd);
      fwd = addDays(fwd, 1);
    }
    return dates;
  };

  const getWeekendSaturdayForDate = (date: Date, isHolidayDay: boolean): Date | null => {
    const dow = date.getUTCDay();
    if (dow === 6) return date;
    if (dow === 0) return addDays(date, -1);
    if (!isHolidayDay) return null;

    // Walk forward through consecutive holidays to find Saturday
    {
      let check = addDays(date, 1);
      while (!isWeekend(check)) {
        if (!holidayDates.has(toDateStr(check))) break;
        check = addDays(check, 1);
      }
      if (check.getUTCDay() === 6) return check;
    }

    // Walk backward through consecutive holidays to find Sunday → return its Saturday
    {
      let check = addDays(date, -1);
      while (!isWeekend(check)) {
        if (!holidayDates.has(toDateStr(check))) break;
        check = addDays(check, -1);
      }
      if (check.getUTCDay() === 0) return addDays(check, -1);
      if (check.getUTCDay() === 6) return check;
    }

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

    // Filter out employees who would get a 3rd consecutive weekend (when others are available).
    const prevWeekendKey = toDateStr(addDays(fromDateStr(packageWeekKey), -7));
    const prev2WeekendKey = toDateStr(addDays(fromDateStr(packageWeekKey), -14));
    const wouldGet3rdConsec = (e: ScheduleEmployee): boolean => {
      const st = stateMap.get(e.id);
      return Boolean(st && st.weekendShift.has(prevWeekendKey) && st.weekendShift.has(prev2WeekendKey));
    };

    const strictAvailable = availableForPackage(true);
    const strictNoConsec = strictAvailable.filter((e) => !wouldGet3rdConsec(e));

    // Tier 1: strict rest window AND no 3rd consecutive weekend
    let mfEmp = pickEmployee("MF", strictNoConsec);
    let tfEmp = pickEmployee("TF", strictNoConsec, mfEmp?.id);

    // Tier 2: strict rest window, allow 3rd consecutive if no other option
    if (!mfEmp || !tfEmp) {
      mfEmp = mfEmp ?? pickEmployee("MF", strictAvailable);
      tfEmp = tfEmp ?? pickEmployee("TF", strictAvailable, mfEmp?.id);
    }

    // Tier 3: relax rest window entirely (last resort)
    if (!mfEmp || !tfEmp) {
      const relaxedAvailable = availableForPackage(false);
      mfEmp = mfEmp ?? pickEmployee("MF", relaxedAvailable, undefined, true);
      tfEmp = tfEmp ?? pickEmployee("TF", relaxedAvailable, mfEmp?.id, true);
    }

    const plan = {
      mfEmpId: mfEmp?.id ?? null,
      tfEmpId: tfEmp?.id ?? null,
    };

    const reserveWeekendPattern = (employeeId: string | null, targetShift: "MF" | "TF"): void => {
      if (!employeeId) return;
      const state = stateMap.get(employeeId);
      if (!state) return;
      if (!state.weekendShift.has(packageWeekKey)) {
        state.weekendShift.set(packageWeekKey, targetShift);
        state.weekendCount++; // Track total weekends assigned — used to balance distribution
      }
      const targetBase = targetShift === "MF" ? "M" : "T";
      if (!state.weekShift.has(packageWeekKey)) {
        state.weekShift.set(packageWeekKey, targetBase);
      }
    };

    reserveWeekendPattern(plan.mfEmpId, "MF");
    reserveWeekendPattern(plan.tfEmpId, "TF");
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
        const generatedSlotShift = generatedShiftByKey.get(slotKey);
        const targetShiftForDate = applyChristmasSpecialRule(targetShift, date);
        const slotUnavailable =
          generatedSlotShift === "D" ||
          Boolean(generatedSlotShift && generatedSlotShift !== targetShiftForDate) ||
          existingDates.has(slotKey) ||
          nightPlan.has(slotKey) ||
          wouldBreakTransition(slotEmployeeId, date, targetShiftForDate) ||
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

  const needsWeekendPrepRest = (
    state: EmpState,
    packageShift: string | null,
    satDate: Date,
    planningDate: Date
  ): boolean => {
    if (packageShift !== "MF" && packageShift !== "TF") return false;
    if (wouldExceedWorkWindow(state, getWeekendPackageDates(satDate), planningDate)) return true;

    const targetBase = packageShift === "MF" ? "M" : "T";
    const packageWeeklyShift = state.weekShift.get(weekKey(satDate)) ?? null;
    return packageWeeklyShift !== null && packageWeeklyShift !== targetBase;
  };

  // ── HARD forced-rest tracking (Tarea 1) ──────────────────────────────────
  // Assignments added here must NEVER be converted to work shifts by the repair phase.
  // Pre-seeded with cross-month post-rest dates from TAREA 2 so they are also protected.
  const forcedRestDates = new Set<string>(crossMonthRestDates);

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
        // Accept candidates whose weekShift already matches OR whose preference matches
        // the target (they will naturally pick that shift once urgency is resolved).
        const weeklyShiftMatch = candidateState.weekShift.get(wKey) === targetBaseShift;
        const preferenceMatch = candidate.shiftPreference === targetBaseShift;
        if (!weeklyShiftMatch && !preferenceMatch) return false;

        const candidateKey = `${candidate.id}|${dateStr}`;
        if (existingDates.has(candidateKey) || nightPlan.has(candidateKey)) return false;

        const candidateNeedsRest =
          candidateState.forcedRestDaysRemaining > 0 ||
          (candidateState.consecutiveCount >= 5 && isDayWorkShift(candidateState.consecutiveShift));
        if (candidateNeedsRest) return false;

        const candidatePrepRestSaturday = getPrepRestSaturday(date, isHoliday);
        const candidatePackageShift = candidatePrepRestSaturday
          ? getWeekendPackageShiftBySaturday(candidate.id, candidatePrepRestSaturday, date)
          : null;
        if (
          candidatePrepRestSaturday &&
          candidatePackageShift &&
          needsWeekendPrepRest(candidateState, candidatePackageShift, candidatePrepRestSaturday, date)
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

      // Priority 1: existing / locked (manual, V, B) — skip, do not emit
      if (existingDates.has(key)) {
        // Reset consecutive tracking conservatively
        state.consecutiveShift = null;
        state.consecutiveCount = 0;
        continue;
      }

      // Priority 2: HARD forced rest — must never be skipped for coverage.
      // Applies when employee has ≥5 consecutive day-work shifts OR already
      // started a 2-day forced rest sequence. Active night shifts (N) from the
      // night plan are exempt — they have their own pre/post-rest structure.
      const needsHardRest =
        (state.consecutiveCount >= 5 && isDayWorkShift(state.consecutiveShift)) ||
        state.forcedRestDaysRemaining > 0;
      const isActiveNightSlot = nightPlan.get(key) === "N";

      if (needsHardRest && !isActiveNightSlot) {
        // Release any pre-planned weekend package slot for this employee
        releaseWeekendPackageShift(emp.id, date, isHoliday);
        if (state.forcedRestDaysRemaining > 0) {
          state.forcedRestDaysRemaining--;
        } else {
          state.forcedRestDaysRemaining = 1;
        }
        // HARD rest days on non-weekend days (Mon–Fri, including holidays) are permanently
        // protected and cannot be converted to work shifts by the repair phase.
        // Weekend forced rest (Sat/Sun) remains D-assigned but IS repairable by the
        // weekend-package planner (which can reassign the slot to another available employee).
        if (!isWeekend(date)) {
          forcedRestDates.add(key);
        }
        // Emit coverage warning if day-coverage minimum cannot be guaranteed
        if (!isWeekend(date) && !holidayDates.has(dateStr)) {
          const mCovered = cov.M >= 1;
          const tCovered = cov.T >= 1;
          if (!mCovered || !tCovered) {
            const missingShift = !mCovered ? "M" : "T";
            options.coverageWarnings?.push({
              date: dateStr,
              employeeId: emp.id,
              message: `Cobertura reducida el ${dateStr.slice(8, 10)}/${dateStr.slice(5, 7)}: empleado ${emp.id} en descanso obligatorio. Revisar manualmente si es necesario.`,
            });
            // Also emit for weekend/holiday if applicable
            void missingShift;
          }
        } else if (isWeekend(date) || holidayDates.has(dateStr)) {
          if (cov.M < 1 || cov.T < 1) {
            options.coverageWarnings?.push({
              date: dateStr,
              employeeId: emp.id,
              message: `Cobertura reducida el ${dateStr.slice(8, 10)}/${dateStr.slice(5, 7)}: empleado ${emp.id} en descanso obligatorio. Revisar manualmente si es necesario.`,
            });
          }
        }
        pushAssignment(emp.id, date, "D", state, wKey, cov);
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
      const prepRestPackageShift = prepRestSaturday
        ? getWeekendPackageShiftBySaturday(emp.id, prepRestSaturday, date)
        : null;
      if (
        prepRestSaturday &&
        prepRestPackageShift &&
        needsWeekendPrepRest(state, prepRestPackageShift, prepRestSaturday, date)
      ) {
        state.forcedRestDaysRemaining = Math.max(state.forcedRestDaysRemaining, 1);
        pushAssignment(emp.id, date, "D", state, wKey, cov);
        continue;
      }

      // Priority 4 (was Priority 4 originally, now renumbered): force 2 consecutive
      // rest days after ≥5 consecutive day-work shifts — kept here for safety but the
      // HARD check above (Priority 2) should handle it before reaching this point.
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
        if (resolvedWeekendPackageShift === "D") {
          ensureSecondRestAfterWork(emp.id, date, state);
        }
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
        const holidayShift = applyChristmasSpecialRule(shift, date);
        if (holidayShift === "D") {
          ensureSecondRestAfterWork(emp.id, date, state);
        }
        pushAssignment(emp.id, date, holidayShift, state, wKey, cov);
        continue;
      }

      // Workday (Mon–Fri, non-holiday)
      const weeklyShift = state.weekShift.get(wKey) ?? null;
      const canPreserveWeeklyShift =
        (weeklyShift === "M" && cov.M >= 1 && cov.T < 1 && canLaterEmployeeCover("T", orderIndex)) ||
        (weeklyShift === "T" && cov.T >= 1 && cov.M < 1 && canLaterEmployeeCover("M", orderIndex));
      // When both shifts are urgent simultaneously, check if a preference employee
      // coming later in dailyOrder can naturally cover one of the shifts, so this
      // (neutral) employee can take the other without violating any preferences.
      let deferShift: "M" | "T" | null = null;
      if (cov.M < 1 && cov.T < 1 && weeklyShift === null) {
        if (canLaterEmployeeCover("T", orderIndex)) deferShift = "T";
        else if (canLaterEmployeeCover("M", orderIndex)) deferShift = "M";
      }
      const shift = _pickWorkdayShift(emp, state, cov, wKey, canPreserveWeeklyShift, deferShift);
      pushAssignment(emp.id, date, applyChristmasSpecialRule(shift, date), state, wKey, cov);
    }
  }

  const resultByKey = new Map(result.map((assignment) => [
    `${assignment.employeeId}|${toDateStr(assignment.date)}`,
    assignment,
  ]));

  const getGeneratedOrExistingShift = (employeeId: string, date: Date): string | null => {
    const dateKey = toDateStr(date);
    const key = `${employeeId}|${dateKey}`;
    return (
      resultByKey.get(key)?.shiftType ??
      options.existingAssignments?.get(key) ??
      previousMonthShiftByKey.get(key) ??
      null
    );
  };

  const countAdjacentDayWork = (
    employeeId: string,
    date: Date,
    direction: -1 | 1
  ): number => {
    let count = 0;
    for (let offset = direction; Math.abs(offset) <= 7; offset += direction) {
      const shift = getGeneratedOrExistingShift(employeeId, addDays(date, offset));
      if (!isDayWorkShift(shift)) break;
      count++;
    }
    return count;
  };

  const hasAdjacentOppositeDayShift = (
    employeeId: string,
    date: Date,
    targetBase: string
  ): boolean => {
    if (targetBase !== "M" && targetBase !== "T") return false;
    const oppositeBase = targetBase === "M" ? "T" : "M";
    const previousShift = getGeneratedOrExistingShift(employeeId, addDays(date, -1));
    const nextShift = getGeneratedOrExistingShift(employeeId, addDays(date, 1));
    return normalizeShift(previousShift ?? "") === oppositeBase ||
      normalizeShift(nextShift ?? "") === oppositeBase;
  };

  const canRepairCoverageWithShift = (
    employeeId: string,
    date: Date,
    targetShift: string,
    options: { relaxed?: boolean; allowNightPlanRest?: boolean } = {}
  ): boolean => {
    const dateKey = toDateStr(date);
    const key = `${employeeId}|${dateKey}`;
    const assignment = resultByKey.get(key);
    if (!assignment || assignment.shiftType !== "D") return false;
    if (existingDates.has(key)) return false;
    if (nightPlan.has(key) && !options.allowNightPlanRest) return false;
    // HARD constraint: forced rest days must never be converted to work shifts
    if (forcedRestDates.has(key)) return false;

    const employee = sortedEmps.find((e) => e.id === employeeId);
    if (!employee || employee.shiftPreference === "J") return false;

    const targetBase = normalizeShift(targetShift);
    const previousShift = getGeneratedOrExistingShift(employeeId, addDays(date, -1));
    if (!options.relaxed && (targetBase === "M" || targetBase === "T")) {
      const workStreak =
        countAdjacentDayWork(employeeId, date, -1) +
        1 +
        countAdjacentDayWork(employeeId, date, 1);
      if (workStreak > 5) return false;
      if (hasAdjacentOppositeDayShift(employeeId, date, targetBase)) return false;
    }

    // On weekdays, in strict (non-relaxed) mode only: reject candidates whose conversion
    // would create an isolated D at a neighbouring day. For example, converting date D→T
    // when date-1=D and date-2=work would make date-1 isolated (work–D–work pattern).
    // Relaxed mode allows creating isolated Ds because repairSingleRestDays will fix them.
    if (!options.relaxed && (targetBase === "M" || targetBase === "T") && !isWeekend(date) && !holidayDates.has(toDateStr(date))) {
      const prevShift = getGeneratedOrExistingShift(employeeId, addDays(date, -1));
      if (prevShift === "D") {
        const prev2Shift = getGeneratedOrExistingShift(employeeId, addDays(date, -2));
        if (prev2Shift !== null && isDayWorkShift(prev2Shift)) return false;
      }
      const nextShift2 = getGeneratedOrExistingShift(employeeId, addDays(date, 1));
      if (nextShift2 === "D") {
        const next2Shift = getGeneratedOrExistingShift(employeeId, addDays(date, 2));
        if (next2Shift !== null && isDayWorkShift(next2Shift)) return false;
      }
    }

    // Reject if converting this D to work would create an isolated D at date+1 that
    // CANNOT be fixed by repairSingleRestDays method 1 (package move). This specifically
    // catches the pattern: date=Thu→T, date+1=Fri=D, date+2=Sat=MF (1-day package).
    // Applies in both strict and relaxed modes to prevent repair cycles.
    if (targetBase === "M" || targetBase === "T") {
      const nextDateV = addDays(date, 1);
      const nextShiftV = getGeneratedOrExistingShift(employeeId, nextDateV);
      if (nextShiftV === "D") {
        const nextNextDate = addDays(date, 2);
        const nextNextShift = getGeneratedOrExistingShift(employeeId, nextNextDate);
        if (nextNextShift !== null && isDayWorkShift(nextNextShift)) {
          // date+1 would become isolated D; fixable only if date+2 is part of a ≥2-day package
          const nextNextStr = toDateStr(nextNextDate);
          const isNextNextSpecial = isWeekend(nextNextDate) || holidayDates.has(nextNextStr);
          if (isNextNextSpecial) {
            const satDateV = getWeekendSaturdayForDate(nextNextDate, holidayDates.has(nextNextStr));
            const pkgLength = satDateV ? getWeekendPackageDates(satDateV).length : 0;
            if (pkgLength < 2) return false; // isolated D at date+1 would be unfixable
          }
        }
      }
    }

    if (previousShift && isValidShiftType(previousShift) && isValidShiftType(targetShift)) {
      const previousTransition = validateShiftTransition(previousShift, targetShift);
      if (!previousTransition.valid) return false;
    }

    const nextShift = getGeneratedOrExistingShift(employeeId, addDays(date, 1));
    if (nextShift && isValidShiftType(nextShift) && isValidShiftType(targetShift)) {
      const nextTransition = validateShiftTransition(targetShift, nextShift);
      if (!nextTransition.valid) return false;
    }

    return true;
  };

  const repairCoverage = (date: Date, targetShift: string, minimumCount = 1): void => {
    const dateKey = toDateStr(date);
    const targetBase = normalizeShift(targetShift);
    const currentCoverageCount = (): number =>
      sortedEmps.filter((employee) => {
        const shift = getGeneratedOrExistingShift(employee.id, date);
        return shift !== null && normalizeShift(shift) === targetBase;
      }).length;

    const buildScoredCandidates = (relaxed: boolean) =>
      sortedEmps
        .filter((employee) =>
          canRepairCoverageWithShift(employee.id, date, targetShift, {
            relaxed,
            allowNightPlanRest: relaxed,
          })
        )
        .map((employee) => {
          const previousShift = getGeneratedOrExistingShift(employee.id, addDays(date, -1));
          const nextShift = getGeneratedOrExistingShift(employee.id, addDays(date, 1));
          const adjacentSameBase =
            (previousShift && normalizeShift(previousShift) === targetBase) ||
            (nextShift && normalizeShift(nextShift) === targetBase);
          const adjacentOppositeDayShift = hasAdjacentOppositeDayShift(employee.id, date, targetBase);
          const previousRestPair =
            previousShift === "D" &&
            getGeneratedOrExistingShift(employee.id, addDays(date, -2)) === "D";
          const state = stateMap.get(employee.id);
          const weeklyShift = state?.weekShift.get(weekKey(date)) ?? null;
          const weeklyPenalty =
            (targetBase === "M" || targetBase === "T") &&
            weeklyShift !== null &&
            weeklyShift !== targetBase
              ? 8
              : 0;
          const preferencePenalty =
            (targetBase === "M" || targetBase === "T") &&
            employee.shiftPreference !== null &&
            employee.shiftPreference !== undefined &&
            employee.shiftPreference !== targetBase
              ? 4
              : 0;
          const targetCount = targetBase === "M"
            ? state?.mCount ?? 0
            : targetBase === "T"
              ? state?.tCount ?? 0
              : 0;
          return {
            employee,
            score:
              (adjacentSameBase ? 0 : 10) +
              (adjacentOppositeDayShift ? 20 : 0) +
              (previousRestPair ? 0 : 3) +
              weeklyPenalty +
              preferencePenalty +
              targetCount +
              employee.rotationOrder,
          };
        })
        .sort((a, b) => a.score - b.score);

    let guard = 0;
    while (currentCoverageCount() < minimumCount && guard < sortedEmps.length) {
      guard++;
      let scoredCandidates = buildScoredCandidates(false);
      if (scoredCandidates.length === 0) {
        scoredCandidates = buildScoredCandidates(true);
      }
      if (scoredCandidates.length === 0) {
        const targetBase2 = normalizeShift(targetShift);
        const isWeekdayDate = !isWeekend(date) && !holidayDates.has(dateKey);
        scoredCandidates = sortedEmps
          .filter((employee) => {
            const key = `${employee.id}|${dateKey}`;
            const assignment = resultByKey.get(key);
            if (!Boolean(assignment) || assignment?.shiftType !== "D") return false;
            if (existingDates.has(key)) return false;
            if (forcedRestDates.has(key)) return false; // HARD: never convert forced rest to work
            if (nightPlan.has(key)) return false; // night-block days (pre/post-rest) cannot become work
            if (employee.shiftPreference === "J") return false;
            // Transition safety: never create an invalid shift sequence (e.g. N→M)
            const lrPrev = getGeneratedOrExistingShift(employee.id, addDays(date, -1));
            if (lrPrev && isValidShiftType(lrPrev) && isValidShiftType(targetShift)) {
              if (!validateShiftTransition(lrPrev, targetShift).valid) return false;
            }
            const lrNext = getGeneratedOrExistingShift(employee.id, addDays(date, 1));
            if (lrNext && isValidShiftType(lrNext) && isValidShiftType(targetShift)) {
              if (!validateShiftTransition(targetShift, lrNext).valid) return false;
            }
            // On weekdays: do not create isolated D at a neighbouring day
            if ((targetBase2 === "M" || targetBase2 === "T") && isWeekdayDate) {
              const prevShift = getGeneratedOrExistingShift(employee.id, addDays(date, -1));
              if (prevShift === "D") {
                const prev2Shift = getGeneratedOrExistingShift(employee.id, addDays(date, -2));
                if (prev2Shift !== null && isDayWorkShift(prev2Shift)) return false;
              }
              const nextShift = getGeneratedOrExistingShift(employee.id, addDays(date, 1));
              if (nextShift === "D") {
                const next2Shift = getGeneratedOrExistingShift(employee.id, addDays(date, 2));
                if (next2Shift !== null && isDayWorkShift(next2Shift)) return false;
              }
            }
            return true;
          })
          .map((employee) => ({ employee, score: employee.rotationOrder }))
          .sort((a, b) => a.score - b.score);
      }

      const selected = scoredCandidates[0]?.employee;
      if (!selected) return;

      const key = `${selected.id}|${dateKey}`;
      const assignment = resultByKey.get(key);
      if (!assignment) return;
      assignment.shiftType = targetShift;
      generatedShiftByKey.set(key, targetShift);
    }
  };

  const setGeneratedShift = (employeeId: string, date: Date, shiftType: string): void => {
    const key = `${employeeId}|${toDateStr(date)}`;
    const assignment = resultByKey.get(key);
    if (!assignment) return;
    const prevShift = assignment.shiftType;
    assignment.shiftType = shiftType;
    generatedShiftByKey.set(key, shiftType);

  };

  const repairWeekendPackageConsistency = (satDate: Date): void => {
    const packageDates = getWeekendPackageDates(satDate);
    if (packageDates.length < 2) return;

    // Consecutive weekend guard: do not reassign to employees who already had
    // the two preceding weekend packages (they would get a 3rd in a row).
    const satWk = weekKey(satDate);
    const consecPrevWk = toDateStr(addDays(fromDateStr(satWk), -7));
    const consecPrev2Wk = toDateStr(addDays(fromDateStr(satWk), -14));

    for (const targetBase of ["M", "T"] as const) {
      const ownerCounts = new Map<string, number>();

      for (const packageDate of packageDates) {
        for (const employee of sortedEmps) {
          const shift = getGeneratedOrExistingShift(employee.id, packageDate);
          if (shift !== null && normalizeShift(shift) === targetBase) {
            ownerCounts.set(employee.id, (ownerCounts.get(employee.id) ?? 0) + 1);
          }
        }
      }

      const targetShiftForDate = (date: Date): string =>
        applyChristmasSpecialRule(targetBase === "M" ? "MF" : "TF", date);

      const candidateOwners = sortedEmps
        .filter((employee) => employee.shiftPreference !== "J")
        .map((employee) => {
          const existingCount = ownerCounts.get(employee.id) ?? 0;

          const canOwnFullPackage = packageDates.every((packageDate) => {
            const shift = getGeneratedOrExistingShift(employee.id, packageDate);
            if (shift !== null && normalizeShift(shift) === targetBase) return true;
            return canRepairCoverageWithShift(employee.id, packageDate, targetShiftForDate(packageDate), {
              relaxed: true,
              allowNightPlanRest: true,
            });
          });
          if (!canOwnFullPackage) return null;

          // Consecutive weekend penalty: employees who already own none of the
          // package days AND had the 2 preceding weekends get a high score penalty
          // so they are only picked when no better candidate exists.
          const st = stateMap.get(employee.id)!;
          const consecPenalty =
            existingCount === 0 &&
            st.weekendShift.has(consecPrevWk) &&
            st.weekendShift.has(consecPrev2Wk)
              ? 1
              : 0;

          const state = stateMap.get(employee.id);
          const targetCount = targetBase === "M" ? state?.mCount ?? 0 : state?.tCount ?? 0;
          return {
            employeeId: employee.id,
            existingCount,
            targetCount,
            consecPenalty,
            rotationOrder: employee.rotationOrder,
          };
        })
        .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
        .sort((a, b) =>
          a.consecPenalty - b.consecPenalty ||  // ← consecutive weekend penalty (soft: last resort)
          b.existingCount - a.existingCount ||
          a.targetCount - b.targetCount ||
          a.rotationOrder - b.rotationOrder
        );

      const ownerId = candidateOwners[0]?.employeeId;
      if (!ownerId) continue;

      for (const packageDate of packageDates) {
        const targetShift = targetShiftForDate(packageDate);
        const ownerKey = `${ownerId}|${toDateStr(packageDate)}`;
        const ownerAssignment = resultByKey.get(ownerKey);
        if (
          ownerAssignment &&
          normalizeShift(ownerAssignment.shiftType) !== targetBase &&
          canRepairCoverageWithShift(ownerId, packageDate, targetShift, {
            relaxed: true,
            allowNightPlanRest: true,
          })
        ) {
          setGeneratedShift(ownerId, packageDate, targetShift);
        }

        if (normalizeShift(getGeneratedOrExistingShift(ownerId, packageDate) ?? "") !== targetBase) {
          continue;
        }

        for (const employee of sortedEmps) {
          if (employee.id === ownerId) continue;
          const key = `${employee.id}|${toDateStr(packageDate)}`;
          const assignment = resultByKey.get(key);
          if (
            assignment &&
            !existingDates.has(key) &&
            !nightPlan.has(key) &&
            normalizeShift(assignment.shiftType) === targetBase
          ) {
            setGeneratedShift(employee.id, packageDate, "D");
          }
        }
      }
    }
  };

  const canConvertGeneratedWorkToRest = (employeeId: string, date: Date, ignoreMinCoverage = false): boolean => {
    const dateKey = toDateStr(date);
    const key = `${employeeId}|${dateKey}`;
    const assignment = resultByKey.get(key);
    if (!assignment || existingDates.has(key) || nightPlan.has(key)) return false;
    if (!isDayWorkShift(assignment.shiftType)) return false;

    const base = normalizeShift(assignment.shiftType);
    if (base !== "M" && base !== "T") return true;
    if (ignoreMinCoverage) return true; // skip coverage floor; caller must restore it afterwards

    const sameBaseCoverage = sortedEmps.filter((employee) => {
      if (employee.id === employeeId) return false;
      const shift = getGeneratedOrExistingShift(employee.id, date);
      return shift !== null && normalizeShift(shift) === base;
    }).length;

    return sameBaseCoverage >= 1;
  };

  const convertGeneratedWorkToRest = (employeeId: string, date: Date): void => {
    const key = `${employeeId}|${toDateStr(date)}`;
    const assignment = resultByKey.get(key);
    if (!assignment) return;
    assignment.shiftType = "D";
    generatedShiftByKey.set(key, "D");
  };

  const movePackageShiftFromEmployee = (
    employeeId: string,
    packageDate: Date,
    shiftType: string,
    enforceConsecLimit = false
  ): boolean => {
    const targetBase = normalizeShift(shiftType);
    if (targetBase !== "M" && targetBase !== "T") return false;

    const satDate = getWeekendSaturdayForDate(packageDate, holidayDates.has(toDateStr(packageDate)));
    if (!satDate) return false;

    const packageDates = getWeekendPackageDates(satDate);
    if (packageDates.length < 2) return false;

    // Compute consecutive weekend history for the target weekend package.
    const pkgWk = weekKey(satDate);
    const pkgPrevWk = toDateStr(addDays(fromDateStr(pkgWk), -7));
    const pkgPrev2Wk = toDateStr(addDays(fromDateStr(pkgWk), -14));

    const isValidCandidate = (employee: ScheduleEmployee): boolean => {
      if (employee.id === employeeId || employee.shiftPreference === "J") return false;
      return packageDates.every((date) => {
        const targetShift = applyChristmasSpecialRule(targetBase === "M" ? "MF" : "TF", date);
        return canRepairCoverageWithShift(employee.id, date, targetShift);
      });
    };

    // Two-pass: prefer candidates who would NOT get a 3rd consecutive weekend.
    const hasConsecHistory = (employee: ScheduleEmployee): boolean => {
      const st = stateMap.get(employee.id);
      return Boolean(st && st.weekendShift.has(pkgPrevWk) && st.weekendShift.has(pkgPrev2Wk));
    };

    const candidate = enforceConsecLimit
      ? sortedEmps.find((employee) => isValidCandidate(employee) && !hasConsecHistory(employee))
      : (sortedEmps.find((employee) => isValidCandidate(employee) && !hasConsecHistory(employee)) ??
         sortedEmps.find((employee) => isValidCandidate(employee)));

    if (!candidate) return false;

    for (const date of packageDates) {
      const targetShift = applyChristmasSpecialRule(targetBase === "M" ? "MF" : "TF", date);
      setGeneratedShift(candidate.id, date, targetShift);

      const originalKey = `${employeeId}|${toDateStr(date)}`;
      const originalAssignment = resultByKey.get(originalKey);
      if (
        originalAssignment &&
        !existingDates.has(originalKey) &&
        !nightPlan.has(originalKey) &&
        normalizeShift(originalAssignment.shiftType) === targetBase
      ) {
        setGeneratedShift(employeeId, date, "D");
      }
    }

    return true;
  };

  const repairSingleRestDays = (): void => {
    let changed = true;
    let guard = 0;

    while (changed && guard < daysInMonth * sortedEmps.length) {
      changed = false;
      guard++;

      for (const employee of sortedEmps) {
        const employeeAssignments = result
          .filter((assignment) => assignment.employeeId === employee.id)
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        for (let i = 1; i < employeeAssignments.length - 1; i++) {
          const previous = employeeAssignments[i - 1];
          const current = employeeAssignments[i];
          const next = employeeAssignments[i + 1];

          if (
            current.shiftType !== "D" ||
            !isDayWorkShift(previous.shiftType) ||
            !isDayWorkShift(next.shiftType)
          ) {
            continue;
          }

          // Try 1: move the adjacent package, but ONLY to an employee who won't get
          // a 3rd consecutive weekend (enforceConsecLimit=true).
          if (movePackageShiftFromEmployee(employee.id, next.date, next.shiftType, true)) {
            changed = true;
            break;
          }

          // Try 2 & 3: convert adjacent work day to rest (safe if coverage allows).
          if (canConvertGeneratedWorkToRest(employee.id, previous.date)) {
            convertGeneratedWorkToRest(employee.id, previous.date);
            changed = true;
            break;
          }

          if (canConvertGeneratedWorkToRest(employee.id, next.date)) {
            convertGeneratedWorkToRest(employee.id, next.date);
            changed = true;
            break;
          }

          // Last-resort relaxed fallback: when all normal repair methods fail, extend
          // the rest window to an adjacent work day even if coverage temporarily drops.
          // The subsequent repairAllDailyCoverage pass will restore coverage from
          // another available D employee. Applies to any isolated D including those
          // caused by prepRest or HARD forced-rest (forcedRestDates).
          if (canConvertGeneratedWorkToRest(employee.id, previous.date, true)) {
              convertGeneratedWorkToRest(employee.id, previous.date);
              changed = true;
              break;
            }
            if (canConvertGeneratedWorkToRest(employee.id, next.date, true)) {
              convertGeneratedWorkToRest(employee.id, next.date);
              changed = true;
              break;
            }
        }

        if (changed) break;
      }
    }
  };

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month - 1, day));
    const dateStr = toDateStr(date);
    if (!isWeekend(date) && !holidayDates.has(dateStr)) continue;

    repairCoverage(date, applyChristmasSpecialRule("MF", date));
    repairCoverage(date, applyChristmasSpecialRule("TF", date));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCDay() === 6) {
      repairWeekendPackageConsistency(date);
    }
  }

  repairSingleRestDays();

  const repairAllDailyCoverage = (): void => {
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(year, month - 1, day));
      const dateStr = toDateStr(date);
      // Days with 0 available employees: leave cells empty, skip repair entirely
      const dayAvailable = availablePerDay.get(dateStr) ?? sortedEmps.length;
      if (dayAvailable === 0) continue;

      const isSpecialDay = isWeekend(date) || holidayDates.has(dateStr);
      repairCoverage(date, applyChristmasSpecialRule(applySpecialDayRule("N", date, holidayDates), date));
      repairCoverage(date, applyChristmasSpecialRule(isSpecialDay ? "MF" : "M", date));
      // With only 1 available employee, skip T/TF repair — M/MF is the max achievable coverage
      if (dayAvailable >= 2) {
        repairCoverage(date, applyChristmasSpecialRule(isSpecialDay ? "TF" : "T", date));
      }
    }
  };

  const repairAllWeekendPackageConsistency = (): void => {
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(year, month - 1, day));
      if (date.getUTCDay() === 6) {
        repairWeekendPackageConsistency(date);
      }
    }
  };

  const repairAdjacentDayShiftFlips = (): void => {
    for (const employee of sortedEmps) {
      const assignments = result
        .filter((assignment) => assignment.employeeId === employee.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      for (let i = 1; i < assignments.length; i++) {
        const previous = assignments[i - 1];
        const current = assignments[i];
        const previousBase = normalizeShift(previous.shiftType);
        const currentBase = normalizeShift(current.shiftType);
        if (
          (previousBase !== "M" && previousBase !== "T") ||
          (currentBase !== "M" && currentBase !== "T") ||
          previousBase === currentBase
        ) {
          continue;
        }

        const currentDate = current.date;
        const dateKey = toDateStr(currentDate);
        const key = `${employee.id}|${dateKey}`;
        if (existingDates.has(key) || nightPlan.has(key)) continue;

        const currentBaseCoverage = sortedEmps.filter((candidate) => {
          if (candidate.id === employee.id) return false;
          const shift = getGeneratedOrExistingShift(candidate.id, currentDate);
          return shift !== null && normalizeShift(shift) === currentBase;
        }).length;
        if (currentBaseCoverage < 1) continue;

        const isSpecialDay = isWeekend(currentDate) || holidayDates.has(dateKey);
        const targetShift = applyChristmasSpecialRule(
          previousBase === "M"
            ? (isSpecialDay ? "MF" : "M")
            : (isSpecialDay ? "TF" : "T"),
          currentDate
        );

        const previousTransition = isValidShiftType(previous.shiftType) && isValidShiftType(targetShift)
          ? validateShiftTransition(previous.shiftType, targetShift)
          : { valid: true };
        if (!previousTransition.valid) continue;

        const nextShift = getGeneratedOrExistingShift(employee.id, addDays(currentDate, 1));
        const nextTransition = nextShift && isValidShiftType(nextShift) && isValidShiftType(targetShift)
          ? validateShiftTransition(targetShift, nextShift)
          : { valid: true };
        if (!nextTransition.valid) continue;

        setGeneratedShift(employee.id, currentDate, targetShift);
      }
    }
  };

  repairAllDailyCoverage();
  repairAllWeekendPackageConsistency();
  repairAdjacentDayShiftFlips();
  repairSingleRestDays();
  repairAllDailyCoverage();
  repairAllWeekendPackageConsistency();
  repairAdjacentDayShiftFlips();

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
    weekendCount: number;
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

  // Consecutive weekend penalty: penalise employees who already worked last week's
  // weekend (penalty 3) or the last TWO consecutive weekends (additional penalty 5).
  // This prevents a single employee from accumulating 3+ consecutive weekends.
  const prevWeekKey = toDateStr(addDays(fromDateStr(wKey), -7));
  const prev2WeekKey = toDateStr(addDays(fromDateStr(wKey), -14));

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
    // Primary balance: fewest total weekends worked this month.
    const aWeekendCount = aState.weekendCount;
    const bWeekendCount = bState.weekendCount;
    // Consecutive weekend penalty: last week +3, last 2 consecutive weeks +5 extra
    const aHadLast = aState.weekendShift.has(prevWeekKey);
    const bHadLast = bState.weekendShift.has(prevWeekKey);
    const aConsecPenalty = (aHadLast ? 3 : 0) +
      (aHadLast && aState.weekendShift.has(prev2WeekKey) ? 5 : 0);
    const bConsecPenalty = (bHadLast ? 3 : 0) +
      (bHadLast && bState.weekendShift.has(prev2WeekKey) ? 5 : 0);

    return (
      aCoveragePenalty - bCoveragePenalty ||
      aPreferencePenalty - bPreferencePenalty ||  // ← preference first (preserves BUG-35)
      aConsecPenalty - bConsecPenalty ||           // ← consecutive penalty before weekly (prevents 3+ in a row)
      aWeeklyPenalty - bWeeklyPenalty ||
      aWeekendCount - bWeekendCount ||             // ← weekend equity over the full month
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
  preserveWeeklyShiftForLaterCoverage = false,
  deferShift: "M" | "T" | null = null
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

  // Weekly consistency: maintain same shift type all week. Coverage repair runs
  // after the first pass and can use a different employee if a slot remains open.
  if (weeklyShift === "M") return "M";
  if (weeklyShift === "T") return "T";

  // Hard minimum (RF-16): ≥1M and ≥1T — handle urgency first.
  // BUG-30 fix: dailyOrder (see caller) processes preference-null employees first each day
  // so urgency is resolved by neutral employees before preference employees arrive.
  // These lines then almost never fire against preference, but must remain for the
  // edge case where all neutral employees are in night blocks (RF-16 must hold).
  const urgentM = cov.M < 1;
  const urgentT = cov.T < 1;

  // When both shifts are simultaneously urgent and weeklyShift is null (first day of week),
  // defer to a later preference employee when available (deferShift indicates which shift
  // a later preference employee can cover, so this employee takes the opposite).
  if (urgentM && urgentT && weeklyShift === null) {
    if (deferShift === "T") return "M"; // a T-pref employee comes later → take M now
    if (deferShift === "M") return "T"; // an M-pref employee comes later → take T now
    return state.mCount <= state.tCount ? "M" : "T"; // equity fallback
  }

  if (urgentM && !urgentT && weeklyShift === null) return "M";
  if (urgentT && !urgentM && weeklyShift === null) return "T";

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
