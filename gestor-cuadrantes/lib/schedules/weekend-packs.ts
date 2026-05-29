/**
 * @module weekend-packs
 * @description Paquetes de fin de semana y festivos: selección de empleados
 *              para MF/TF, equidad de distribución, consistencia semanal y
 *              continuidad cross-month de packs incompletos.
 * @dependencies date-utils (normalizeShift, weekKey)
 *              rest-rules (getExtendedWeekend, isDayWorkShift)
 *
 * REGLA: Un pack de fin de semana es indivisible: el empleado que trabaja el
 * sábado también trabaja el domingo (y festivos adyacentes) con el mismo turno.
 * REGLA: Máximo 2 fins de semana consecutivos por empleado (Sprint 19 BUG-39).
 */

import { toDateStr, addDays, fromDateStr } from "./date-utils";

interface ScheduleEmployee {
  id: string;
  rotationOrder: number;
  shiftPreference?: string | null;
}

// ─── SECCIÓN: Selección de turno de fin de semana por empleado ─────────────

/**
 * Select the appropriate weekend shift for an employee on a specific date.
 * Returns the MF or TF weekend shift assigned to this employee, or falls back
 * to the normal weekday equivalent (M/T) if no package is assigned.
 */
export function pickWeekendShift(
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

// ─── SECCIÓN: Selección de empleado para paquete de fin de semana ─────────

/**
 * Select the best employee from candidates to fill a MF or TF weekend package slot.
 * Balances weekendCount equity, shift preference, and weekly consistency.
 */
export function pickWeekendPackageEmployee(
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
