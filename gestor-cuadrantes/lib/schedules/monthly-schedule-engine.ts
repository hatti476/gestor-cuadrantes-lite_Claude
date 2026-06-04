/**
 * lib/schedules/monthly-schedule-engine.ts  —  Sprint 9
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
import {
  pickWeekendShift as _pickWeekendShift,
  pickWeekendPackageEmployee as _pickWeekendPackageEmployee,
} from "./weekend-packs";
import { pickWorkdayShift as _pickWorkdayShift } from "./workday-shifts";
import { buildPrevMonthTrailingState, applyCrossMonthNightBlocks, applyCrossMonthWeekendPack } from "./cross-month";

import {
  isWeekend,
  toDateStr,
  fromDateStr,
  addDays,
  isWeekendOrHoliday,
  applySpecialDayRule,
  applyChristmasSpecialRule,
  normalizeShift,
  weekKey,
} from "./date-utils";
export { isWeekend, toDateStr, fromDateStr, addDays, isWeekendOrHoliday, applySpecialDayRule, applyChristmasSpecialRule, normalizeShift, weekKey };

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

// GenerationWarning, CoverageWarning, GenerateMonthScheduleOptions → see coverage.ts
export type { GenerationWarning, CoverageWarning, GenerateMonthScheduleOptions } from "./coverage";
import type { GenerateMonthScheduleOptions } from "./coverage";

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

// isWeekend → see date-utils.ts

// toDateStr → see date-utils.ts

// fromDateStr → see date-utils.ts

// isWeekendOrHoliday → see date-utils.ts

// addDays → see date-utils.ts

// applySpecialDayRule → see date-utils.ts

// CHRISTMAS_* constants, monthDayKey, applyChristmasSpecialRule → see date-utils.ts

// ─── Night-block logic (→ see night-blocks.ts) ─────────────────────────────

import type { NightBlock } from "./night-blocks";
import {
  nightBlockDays,
  computeNightBlocks,
  resolveNightBlocks,
  NIGHT_EPOCH_FRIDAY,
  BLOCK_DAYS,
  NIGHT_DAYS,
} from "./night-blocks";
export type { NightBlock };
export { nightBlockDays, computeNightBlocks, resolveNightBlocks, NIGHT_EPOCH_FRIDAY, BLOCK_DAYS, NIGHT_DAYS };

// ─── Normalisation ────────────────────────────────────────────────────────────

// normalizeShift → see date-utils.ts

// ─── Rest rules + shift helpers (→ see rest-rules.ts) ──────────────────────

import {
  isDayWorkShift,
  countTrailingDayWork,
  countTrailingShift,
  initialForcedRestDaysRemaining,
  isPostRestDay,
  countConsecutiveWorkDays,
  getExtendedWeekend,
} from "./rest-rules";
export { isDayWorkShift, countTrailingDayWork, countTrailingShift, initialForcedRestDaysRemaining, isPostRestDay, countConsecutiveWorkDays, getExtendedWeekend };

// ─── ISO week helper ─────────────────────────────────────────────────────────

// weekKey → see date-utils.ts

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
  const preserveNightBlockRest = nightOrder.length >= 7;

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

  // ── Night block continuity from prevMonthTail ─────────────────────────────
  // Extracted to cross-month.ts → applyCrossMonthNightBlocks
  applyCrossMonthNightBlocks(prevMonthTail, year, month, existingDates, nightPlan, crossMonthRestDates);

  // ── Prev-month trailing state ─────────────────────────────────────────────
  // Extracted to cross-month.ts → buildPrevMonthTrailingState
  const prevTailByEmp = buildPrevMonthTrailingState(prevMonthTail);

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

  // ── Weekend pack continuity from prevMonthTail ─────────────────────────────
  // Extracted to cross-month.ts → applyCrossMonthWeekendPack
  applyCrossMonthWeekendPack(prevMonthTail, year, month, weekendPlan, stateMap);
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

    // Bug 3: compute weekends since last night block for this employee.
    // A night block ends at startFriday + 9 (last post-rest day). We count
    // weekendShift entries that were assigned after that end date.
    const getWeekendsSinceLastNightBlock = (empId: string): number => {
      const empBlockEnds = nightBlocks
        .filter((b) => b.employeeId === empId)
        .map((b) => addDays(b.startFriday, 9))
        .filter((d) => d.getTime() < satDate.getTime())
        .sort((a, b) => b.getTime() - a.getTime());
      const lastBlockEnd = empBlockEnds[0] ?? null;
      const empState = stateMap.get(empId);
      if (!empState) return 0;
      let count = 0;
      for (const [wk] of empState.weekendShift) {
        // wk is the Monday of the weekend's week; Saturday is 5 days later
        const satOfWeek = addDays(fromDateStr(wk), 5);
        if (lastBlockEnd === null || satOfWeek.getTime() > lastBlockEnd.getTime()) {
          count++;
        }
      }
      return count;
    };

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

        // Bug 3: max 2 weekends between consecutive night blocks (BUG-43 fix).
        // Only enforced in strict mode (Tiers 1 & 2); Tier 3 relaxes this.
        if (enforceRestWindow && getWeekendsSinceLastNightBlock(e.id) >= 2) return false;

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

    // Tier 2.5: prefer preference-matched employees even when they exceed the work window.
    // T-preference employees who work Mon–Fri every week always reach consecutiveCount=5
    // and are systematically excluded from Tiers 1/2 — so they would never get weekend
    // assignments without this tier (BUG-42 fix).
    const relaxedNoConsec = availableForPackage(false).filter((e) => !wouldGet3rdConsec(e));
    if (!mfEmp || mfEmp.shiftPreference !== "M") {
      const mPref = relaxedNoConsec.filter((e) => e.shiftPreference === "M");
      const betterMf = pickEmployee("MF", mPref);
      if (betterMf) mfEmp = betterMf;
    }
    if (!tfEmp || tfEmp.shiftPreference !== "T") {
      const tPref = relaxedNoConsec.filter((e) => e.shiftPreference === "T");
      const betterTf = pickEmployee("TF", tPref, mfEmp?.id);
      if (betterTf) tfEmp = betterTf;
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
        // HARD rest days are permanently protected and cannot be converted to work
        // shifts by the repair phase. This applies to ALL days (Mon–Sun), ensuring
        // that an employee with ≥5 consecutive work days cannot have their forced rest
        // overridden on weekends either (BUG-44 fix: prevents >5 consecutive day shifts).
        forcedRestDates.add(key);
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
    options: { relaxed?: boolean } = {}
  ): boolean => {
    const dateKey = toDateStr(date);
    const key = `${employeeId}|${dateKey}`;
    const assignment = resultByKey.get(key);
    if (!assignment || assignment.shiftType !== "D") return false;
    if (existingDates.has(key)) return false;
    if (nightPlan.has(key) && preserveNightBlockRest) return false;
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

// ─── imports moved to top of file ───────────────────────────────────────────
