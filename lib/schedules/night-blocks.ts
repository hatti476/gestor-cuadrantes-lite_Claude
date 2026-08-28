/**
 * @module night-blocks
 * @description Lógica de bloques de noches: ciclo 2D+7N+3D, rotación entre
 *              empleados, resolución de conflictos (vacaciones/bajas en los
 *              7 días de guardia nocturna → transferencia al siguiente empleado
 *              que lleva más tiempo sin hacer noches).
 * @dependencies date-utils (addDays, toDateStr, fromDateStr, normalizeShift)
 */

import { addDays, toDateStr } from "./date-utils";

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
