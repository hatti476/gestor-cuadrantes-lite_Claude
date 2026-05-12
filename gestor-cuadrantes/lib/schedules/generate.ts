/**
 * lib/schedules/generate.ts  —  Sprint 9
 * Motor de generación de cuadrante según especificación de Fase 2.
 *
 * Reglas (por prioridad):
 *  1. Turnos marcados manualmente  →  nunca se sobreescriben
 *  2. Vacaciones / bajas ya introducidas  →  nunca se sobreescriben
 *  3. Bloque de noches del técnico en turno de rotación
 *  4. Continuidad con el mes anterior (≤5 días consecutivos del mismo turno)
 *  5. Preferencia de turno del empleado (shiftPreference)
 *  6. Cobertura mínima (≥2M + ≥2T en días laborables)
 *  7. Equidad de distribución M/T
 *
 * Sin dependencias de BD ni HTTP — completamente testeable con Vitest.
 */

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

export const VALID_SHIFTS = ["M", "T", "N", "D", "MF", "TF", "NF", "V", "B", "J"] as const;

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

/**
 * Given a year/month and an ordered list of employee IDs (night rotation),
 * returns all NightBlocks whose days overlap with that month.
 *
 * Blocks cycle: emp[0] block 0, emp[1] block 1, …, emp[n-1] block n-1,
 * emp[0] block n, emp[1] block n+1, …  — each block offset by BLOCK_DAYS.
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

  // Each round (all employees once) = employeeIds.length * BLOCK_DAYS days
  // Find the round that starts just before the month
  const roundLength = employeeIds.length * BLOCK_DAYS;
  const roundStart = Math.floor((daysToMonthStart - BLOCK_DAYS) / roundLength) * roundLength;

  const blocks: NightBlock[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  // Search enough rounds to cover the month
  const searchRounds = Math.ceil((daysInMonth + 2 * BLOCK_DAYS) / roundLength) + 2;

  for (let r = 0; r < searchRounds; r++) {
    for (let empIdx = 0; empIdx < employeeIds.length; empIdx++) {
      const blockIndex = (roundStart / BLOCK_DAYS + r * employeeIds.length + empIdx);
      const startFriday = addDays(NIGHT_EPOCH_FRIDAY, blockIndex * BLOCK_DAYS);

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

// ─── Normalisation ────────────────────────────────────────────────────────────

/** Return the base shift type (strip the F suffix for holiday variants) */
export function normalizeShift(shift: string): string {
  if (shift === "MF") return "M";
  if (shift === "TF") return "T";
  if (shift === "NF") return "N";
  return shift;
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
  nightRotationIds?: string[]
): GeneratedAssignment[] {
  if (employees.length === 0) return [];

  const daysInMonth = new Date(year, month, 0).getDate();
  const result: GeneratedAssignment[] = [];

  // Sort employees by rotationOrder
  const sortedEmps = [...employees].sort((a, b) => a.rotationOrder - b.rotationOrder);

  // Night rotation order (default: rotationOrder)
  const nightOrder: string[] =
    nightRotationIds && nightRotationIds.length > 0
      ? nightRotationIds
      : sortedEmps.map((e) => e.id);

  // ── Night blocks ─────────────────────────────────────────────────────────
  const nightBlocks = computeNightBlocks(year, month, nightOrder);

  // Map: "empId|YYYY-MM-DD" → base shift from night plan
  const nightPlan = new Map<string, string>();
  for (const block of nightBlocks) {
    const days = nightBlockDays(block);
    for (const [dateStr, baseShift] of days) {
      const d = fromDateStr(dateStr);
      if (d.getUTCFullYear() !== year || d.getUTCMonth() + 1 !== month) continue;
      nightPlan.set(`${block.employeeId}|${dateStr}`, baseShift);
    }
  }

  // ── Prev-month trailing state ─────────────────────────────────────────────
  const prevTailByEmp = new Map<string, { shift: string; count: number }>();
  if (prevMonthTail.length > 0) {
    const byEmp = new Map<string, { date: string; shiftType: string }[]>();
    for (const p of prevMonthTail) {
      if (!byEmp.has(p.employeeId)) byEmp.set(p.employeeId, []);
      byEmp.get(p.employeeId)!.push(p);
    }
    for (const [empId, entries] of byEmp) {
      const sorted = entries.sort((a, b) => a.date.localeCompare(b.date));
      const lastShift = normalizeShift(sorted[sorted.length - 1].shiftType);
      let count = 0;
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (normalizeShift(sorted[i].shiftType) === lastShift) count++;
        else break;
      }
      prevTailByEmp.set(empId, { shift: lastShift, count });
    }
  }

  // ── Per-employee state ────────────────────────────────────────────────────
  interface EmpState {
    consecutiveShift: string | null;
    consecutiveCount: number;
    weekShift: Map<string, string>; // weekKey → "M" | "T"
    mCount: number;
    tCount: number;
  }

  const stateMap = new Map<string, EmpState>();
  for (const emp of sortedEmps) {
    const prev = prevTailByEmp.get(emp.id);
    stateMap.set(emp.id, {
      consecutiveShift: prev?.shift ?? null,
      consecutiveCount: prev?.count ?? 0,
      weekShift: new Map(),
      mCount: 0,
      tCount: 0,
    });
  }

  // ── Day-by-day assignment ─────────────────────────────────────────────────
  const dayCoverage = new Map<string, { M: number; T: number }>();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month - 1, day));
    const dateStr = toDateStr(date);
    const isWeekendDay = isWeekend(date);
    const isHoliday = holidayDates.has(dateStr);
    const isSpecialDay = isWeekendDay || isHoliday;
    const wKey = weekKey(date);

    if (!dayCoverage.has(dateStr)) dayCoverage.set(dateStr, { M: 0, T: 0 });
    const cov = dayCoverage.get(dateStr)!;

    for (const emp of sortedEmps) {
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
          ? applySpecialDayRule("N", date, holidayDates)
          : "D";
        result.push({ employeeId: emp.id, date, shiftType: finalShift });
        _updateState(state, finalShift, wKey, cov);
        continue;
      }

      // Priority 4: force rest if ≥5 consecutive same work shift
      const needsRest =
        state.consecutiveCount >= 5 &&
        state.consecutiveShift !== null &&
        state.consecutiveShift !== "D" &&
        state.consecutiveShift !== "N"; // night blocks handle their own rest

      if (needsRest) {
        result.push({ employeeId: emp.id, date, shiftType: "D" });
        _updateState(state, "D", wKey, cov);
        continue;
      }

      // Weekend / holiday
      if (isSpecialDay) {
        const shift = _pickWeekendShift(emp, state, cov, wKey);
        result.push({ employeeId: emp.id, date, shiftType: shift });
        _updateState(state, shift, wKey, cov);
        continue;
      }

      // Workday (Mon–Fri, non-holiday)
      const shift = _pickWorkdayShift(emp, state, cov, wKey);
      result.push({ employeeId: emp.id, date, shiftType: shift });
      _updateState(state, shift, wKey, cov);
    }
  }

  return result;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function _updateState(
  state: {
    consecutiveShift: string | null;
    consecutiveCount: number;
    weekShift: Map<string, string>;
    mCount: number;
    tCount: number;
  },
  shift: string,
  wKey: string,
  cov: { M: number; T: number }
): void {
  const base = normalizeShift(shift);

  // Consecutive tracking
  if (base === state.consecutiveShift) {
    state.consecutiveCount++;
  } else {
    state.consecutiveShift = base;
    state.consecutiveCount = 1;
  }

  if (base === "M") {
    state.mCount++;
    cov.M++;
    if (!state.weekShift.has(wKey)) state.weekShift.set(wKey, "M");
  } else if (base === "T") {
    state.tCount++;
    cov.T++;
    if (!state.weekShift.has(wKey)) state.weekShift.set(wKey, "T");
  }
}

function _pickWeekendShift(
  emp: ScheduleEmployee,
  state: { pref?: string | null; mCount: number; tCount: number; weekShift: Map<string, string> },
  cov: { M: number; T: number },
  wKey: string
): string {
  const pref = emp.shiftPreference ?? null;

  // Weekly consistency: if already assigned M or T this week, keep same type
  const weeklyShift = state.weekShift.get(wKey) ?? null;
  const mOpen = cov.M < 1;
  const tOpen = cov.T < 1;

  if (weeklyShift === "M") return mOpen ? "MF" : "D";
  if (weeklyShift === "T") return tOpen ? "TF" : "D";

  if (!mOpen && !tOpen) return "D";

  if (pref === "M" && mOpen) return "MF";
  if (pref === "T" && tOpen) return "TF";

  if (mOpen && tOpen) {
    return state.mCount <= state.tCount ? "MF" : "TF";
  }
  if (mOpen) return "MF";
  return "TF";
}

function _currentWeekKey(_state: unknown): string {
  return "";
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
  wKey: string
): string {
  const pref = emp.shiftPreference ?? null;

  // Weekly consistency: if already assigned M or T this week, lock to same
  const weeklyShift = state.weekShift.get(wKey) ?? null;
  if (weeklyShift === "M") return "M";
  if (weeklyShift === "T") return "T";

  // Coverage priority
  const needM = cov.M < 2;
  const needT = cov.T < 2;

  if (needM && !needT) return "M";
  if (needT && !needM) return "T";
  if (needM && needT) {
    if (pref === "M") return "M";
    if (pref === "T") return "T";
    return state.mCount <= state.tCount ? "M" : "T";
  }

  // Coverage met — preference then equitable
  if (pref === "M") return "M";
  if (pref === "T") return "T";
  return state.mCount <= state.tCount ? "M" : "T";
}
