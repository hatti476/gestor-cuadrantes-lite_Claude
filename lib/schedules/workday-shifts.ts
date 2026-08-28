/**
 * @module workday-shifts
 * @description Asignación de turnos en días laborables (L-V, no festivos):
 *              consistencia semanal M/T, cobertura soft, preferencia de turno
 *              y equidad de distribución M/T entre empleados.
 * @dependencies date-utils (normalizeShift)
 *
 * REGLA: Consistencia semanal — un empleado no cambia de M a T (ni viceversa)
 *        dentro de la misma semana (ISO week). Solo se rompe cuando la cobertura
 *        hard (RF-16) lo requiere (urgentT puede cambiar M→T, que es transición
 *        válida per ET Art.34.3; urgentM NO puede cambiar T→M porque gap=8h).
 * REGLA: Preferencia de turno tiene prioridad sobre equidad solo cuando la
 *        cobertura soft ya está cubierta.
 */

// ─── SECCIÓN: Selección de turno para día laborable ──────────────────────

/**
 * Select the best weekday shift (M or T) for an employee based on:
 * weekly consistency (weekShift), shift preference, and coverage equity.
 * Returns "M", "T", or "J".
 *
 * BUG-56 fix: every return path that assigns M or T now records the choice in
 * state.weekShift so that weekly consistency holds for all subsequent days of
 * the same ISO week.
 *
 * BUG-57 fix (RF-16 override): urgentT is checked BEFORE the weekly-consistency
 * guard so that an employee locked to M can be switched to T when coverage hard
 * minimum would otherwise not be met (M→T is a valid ≥12h transition).
 * urgentM does NOT override a T-locked employee (T→M = 8h gap, invalid).
 *
 * BUG-57 fix (soft target balance): the soft-target steerer no longer carries
 * `pref !== "M"` / `pref !== "T"` guards, allowing it to steer preference
 * employees toward the under-covered shift when the ≥2M/≥2T target demands it.
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

  // BUG-56 fix: helper that always records the weekly shift before returning.
  // All paths that can assign M or T when weeklyShift is null must call this.
  const setAndReturn = (shift: "M" | "T"): string => {
    if (!state.weekShift.has(wKey)) state.weekShift.set(wKey, shift);
    return shift;
  };

  const weeklyShift = state.weekShift.get(wKey) ?? null;
  const urgentM = cov.M < 1;
  const urgentT = cov.T < 1;

  // BUG-57 fix: RF-16 hard minimum overrides weekly consistency.
  // urgentT can switch a M-locked employee to T (M→T: ≥24h gap → valid).
  // urgentM CANNOT switch a T-locked employee to M (T→M: 8h gap → invalid).
  if (urgentT && !urgentM && weeklyShift === "M") {
    state.weekShift.set(wKey, "T");
    return "T";
  }

  if (preserveWeeklyShiftForLaterCoverage && (weeklyShift === "M" || weeklyShift === "T")) {
    return weeklyShift;
  }

  // Weekly consistency: maintain same shift type all week.
  if (weeklyShift === "M") return "M";
  if (weeklyShift === "T") return "T";

  // From here: weeklyShift === null — first assignment this week.

  // Hard minimum (RF-16): both urgent simultaneously on first day of week.
  // BUG-56 fix: setAndReturn records the chosen shift.
  if (urgentM && urgentT) {
    if (deferShift === "T") return setAndReturn("M");
    if (deferShift === "M") return setAndReturn("T");
    return setAndReturn(state.mCount <= state.tCount ? "M" : "T");
  }

  if (urgentM) return setAndReturn("M");
  if (urgentT) return setAndReturn("T");

  // Soft target ≥2M and ≥2T (best-effort balance).
  // BUG-57 fix: steerer no longer guards on pref — the coverage target takes
  // priority over preference when one shift is already at ≥2 and the other is not.
  const softNeedM = cov.M < 2;
  const softNeedT = cov.T < 2;

  // Seed with preference only when the opposite soft target is already met.
  if (pref === "M" && !softNeedT) return setAndReturn("M");
  if (pref === "T" && !softNeedM) return setAndReturn("T");

  // One soft slot still needed — steer unconditionally (overrides preference).
  if (softNeedM && !softNeedT) return setAndReturn("M");
  if (softNeedT && !softNeedM) return setAndReturn("T");

  // Both soft slots needed simultaneously — preference wins, then equity.
  if (pref === "M") return setAndReturn("M");
  if (pref === "T") return setAndReturn("T");
  return setAndReturn(state.mCount <= state.tCount ? "M" : "T");
}
