/**
 * @module cross-month
 * @description Cross-month continuity logic for schedule generation.
 *
 * Handles two types of state that carry over from month N to month N+1:
 *   1. Night-block continuation: employees mid-block at month boundary continue
 *      their assigned night shifts + post-rest days into the new month.
 *   2. Weekend-pack continuation: a Saturday at the end of the previous month
 *      implies the same employee pair covers the following Sunday (first day
 *      of the new month) with the same shift types.
 *
 * All exported functions mutate the Maps/Sets passed in — they have no return
 * value beyond side effects, matching the imperative style of generate.ts.
 *
 * @dependencies
 *   date-utils  (toDateStr, addDays, normalizeShift, weekKey)
 *   rest-rules  (isDayWorkShift, countTrailingDayWork, countTrailingShift,
 *                initialForcedRestDaysRemaining)
 */

import { toDateStr, addDays, normalizeShift, weekKey } from "./date-utils";
import {
  isDayWorkShift,
  countTrailingDayWork,
  countTrailingShift,
  initialForcedRestDaysRemaining,
} from "./rest-rules";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Minimal shape required from each prevMonthTail entry */
export type PrevMonthTailEntry = {
  employeeId: string;
  date: string;
  shiftType: string;
};

/** Result type for buildPrevMonthTrailingState */
export type TrailingState = {
  shift: string;
  count: number;
  forcedRestDaysRemaining: number;
};

/** Minimal shape of the per-employee state map required by applyCrossMonthWeekendPack */
type EmpWeekendState = {
  weekendShift: Map<string, string>;
  weekShift: Map<string, string>;
};

// ─────────────────────────────────────────────────────────────────────────────
// buildPrevMonthTrailingState
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute, per employee, the last assigned shift from prevMonthTail together
 * with how many consecutive trailing days of that shift type were worked and
 * how many forced-rest days still remain.
 *
 * Pure function — no side effects.
 */
export function buildPrevMonthTrailingState(
  prevMonthTail: PrevMonthTailEntry[]
): Map<string, TrailingState> {
  const prevTailByEmp = new Map<string, TrailingState>();
  if (prevMonthTail.length === 0) return prevTailByEmp;

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
  return prevTailByEmp;
}

// ─────────────────────────────────────────────────────────────────────────────
// applyCrossMonthNightBlocks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mutate `nightPlan` and `crossMonthRestDates` so that employees who were
 * mid-night-block or in their post-rest period at the end of the previous month
 * continue their pattern into the new month.
 *
 * Business rules:
 *  - If an employee had 1-6 trailing nights  → assign remaining nights + 3 post-rest D.
 *  - If an employee had ≥7 trailing nights    → assign 3 post-rest D.
 *  - If an employee had 2 trailing post-rest D → assign 1 more post-rest D.
 *  - A locked date (vacation/baja in existingDates) interrupts the continuation.
 */
export function applyCrossMonthNightBlocks(
  prevMonthTail: PrevMonthTailEntry[],
  year: number,
  month: number,
  existingDates: Set<string>,
  nightPlan: Map<string, string>,
  crossMonthRestDates: Set<string>
): void {
  if (prevMonthTail.length === 0) return;

  const prevByEmpNight = new Map<string, PrevMonthTailEntry[]>();
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
      // Stop immediately if a locked date (V/B/manual) interrupts the continuation.
      const nightsRemaining = 7 - trailingNights;

      // GUARD: If this employee already has a new-rotation night block assigned in nightPlan
      // within the continuation+rest window, skip cross-month continuation for them.
      // This prevents 11+ consecutive nights when rotation order changes between months:
      //   - Old rotation had emp A doing nights at end of prev month (e.g. 3 trailing nights).
      //   - New rotation assigns emp A a fresh block starting early in the current month.
      //   - Without this guard, cross-month would (a) force 4 more nights for A on top of the
      //     new block, and (b) wrongly delete another employee's legitimately-assigned N's.
      // When the new rotation already covers the slot, no continuation is needed.
      const restPeriodDays = nightsRemaining + 3; // nights to complete + 3 rest days
      let hasEarlyNewBlock = false;
      for (let chk = 0; chk < restPeriodDays; chk++) {
        const chkDate = addDays(monthStart, chk);
        if (chkDate.getUTCMonth() + 1 !== month) break;
        if (nightPlan.get(`${empId}|${toDateStr(chkDate)}`) === "N") {
          hasEarlyNewBlock = true;
          break;
        }
      }
      if (hasEarlyNewBlock) continue; // new rotation handles this employee's nights

      let contDate = monthStart;
      let actualNightsPlanned = 0;

      for (let i = 0; i < nightsRemaining; i++) {
        if (contDate.getUTCFullYear() !== year || contDate.getUTCMonth() + 1 !== month) break;
        const ds = toDateStr(contDate);
        const empKey = `${empId}|${ds}`;
        if (existingDates.has(empKey)) break;
        // Remove conflicting N from any other employee assigned to this date.
        // Only remove N's from employees who also have cross-month trailing nights
        // (i.e., also in prevByEmpNight). Rotation-assigned N's from employees with
        // no trailing nights must not be deleted — those are legitimate coverage.
        for (const [existingKey, existingShift] of nightPlan.entries()) {
          if (existingKey !== empKey && existingKey.endsWith(`|${ds}`) && existingShift === "N") {
            const otherEmpId = existingKey.split("|")[0];
            if (prevByEmpNight.has(otherEmpId)) {
              nightPlan.delete(existingKey);
            }
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
          if (existingDates.has(empKey)) break;
          if (nightPlan.get(empKey) !== "N") {
            nightPlan.set(empKey, "D");
            crossMonthRestDates.add(empKey);
          }
          contDate = addDays(contDate, 1);
        }
      }
    } else if (trailingNights >= 7) {
      // Employee completed all 7 nights: add 3D post-rest in new month.
      let contDate = monthStart;
      for (let i = 0; i < 3; i++) {
        if (contDate.getUTCFullYear() !== year || contDate.getUTCMonth() + 1 !== month) break;
        const ds = toDateStr(contDate);
        const empKey = `${empId}|${ds}`;
        if (existingDates.has(empKey)) break;
        if (nightPlan.get(empKey) !== "N") {
          nightPlan.set(empKey, "D");
          crossMonthRestDates.add(empKey);
        }
        contDate = addDays(contDate, 1);
      }
    } else if (trailingPostRestD >= 2 && trailingPostRestD < 3) {
      // Employee in post-rest: add remaining D days
      const postRestNeeded = 3 - trailingPostRestD;
      let contDate = monthStart;
      for (let i = 0; i < postRestNeeded; i++) {
        if (contDate.getUTCFullYear() !== year || contDate.getUTCMonth() + 1 !== month) break;
        const ds = toDateStr(contDate);
        const empKey = `${empId}|${ds}`;
        if (existingDates.has(empKey)) break;
        if (nightPlan.get(empKey) !== "N") nightPlan.set(empKey, "D");
        contDate = addDays(contDate, 1);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// applyCrossMonthWeekendPack
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pre-seed weekendPlan and stateMap so that a Saturday→Sunday weekend that
 * straddles two months keeps the same employee pair and shift types.
 *
 * Specifically: if the last day of the previous month was a Saturday with MF/TF
 * assignments, AND the first day of the new month is a Sunday, the weekendPlan
 * for that Saturday is pre-seeded so the Sunday continues the pack.
 */
export function applyCrossMonthWeekendPack(
  prevMonthTail: PrevMonthTailEntry[],
  year: number,
  month: number,
  weekendPlan: Map<string, { mfEmpId: string | null; tfEmpId: string | null }>,
  stateMap: Map<string, EmpWeekendState>
): void {
  if (prevMonthTail.length === 0) return;

  const lastDayOfPrevMonth = new Date(Date.UTC(year, month - 1, 0));
  if (lastDayOfPrevMonth.getUTCDay() !== 6) return; // Not a Saturday → nothing to continue

  const lastDayStr = toDateStr(lastDayOfPrevMonth);
  const mfEntry = prevMonthTail.find((p) => p.date === lastDayStr && p.shiftType === "MF");
  const tfEntry = prevMonthTail.find((p) => p.date === lastDayStr && p.shiftType === "TF");
  if (!mfEntry && !tfEntry) return;

  // Pre-seed weekendPlan keyed by the Saturday from the previous month
  weekendPlan.set(lastDayStr, {
    mfEmpId: mfEntry?.employeeId ?? null,
    tfEmpId: tfEntry?.employeeId ?? null,
  });

  // Reserve weekendShift and weekShift for the first week of the new month
  const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1));
  if (firstDayOfMonth.getUTCDay() !== 0) return; // First day is not a Sunday → no continuation

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
