/**
 * @module workday-shifts
 * @description Asignación de turnos en días laborables (L-V, no festivos):
 *              consistencia semanal M/T, cobertura soft, preferencia de turno
 *              y equidad de distribución M/T entre empleados.
 * @dependencies date-utils (normalizeShift)
 *
 * REGLA: Consistencia semanal — un empleado no cambia de M a T (ni viceversa)
 *        dentro de la misma semana (ISO week). Solo se rompe cuando la cobertura
 *        hard (RF-16) lo requiere.
 * REGLA: Preferencia de turno tiene prioridad sobre equidad solo cuando la
 *        cobertura soft ya está cubierta.
 */

// ─── SECCIÓN: Selección de turno para día laborable ──────────────────────

/**
 * Select the best weekday shift (M or T) for an employee based on:
 * weekly consistency (weekShift), shift preference, and coverage equity.
 * Returns "M", "T", or "D" (rest day if forced rest is required).
 */
export function pickWorkdayShift(
  emp: { id: string; rotationOrder: number; shiftPreference?: string | null },
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
