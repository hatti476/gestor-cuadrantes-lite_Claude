# Sprint 24 — Release Notes

**Version**: 2.4.0  
**Date**: 2026-06-04  
**Status**: In progress 🔄  
**Branch**: `feature/sprint-24-scheduling-fixes`

---

## Summary

Sprint 24 focuses on **scheduling engine correctness** (4 regressions detected in manual QA) and a new **multi-month expanded view** for reading cuadrantes in an Excel-like horizontal scroll format.

**Key Metrics (baseline):**
- **Unit Tests**: 419/419 passing (12 suites)
- **E2E Smoke**: 22/22 passing
- **Build**: ✅ TypeScript clean
- **New bugs fixed**: 4 (BUG-41..BUG-44)
- **New features**: 1 (multi-month view)

---

## Bug Fixes

### BUG-41 — Leyenda de tarifas de complementos desaparecida ✅

**Symptom**: The rates box (MF=33€/turno, TF=33€/turno, N=38.5€/turno, NF=49.5€/turno) was no longer visible in the schedule UI after Sprint 23 layout changes.

**Root cause**: The `ExtraPayTable` wrapper div had `data-testid="extra-pay-legend"`, causing CP-110 to pass (the testid existed in DOM) even though the actual tariff rates were not rendered for users.

**Fix**:
- Added `RatesLegend` component in `app/page.tsx` using `EXTRA_PAY_RATES` from `lib/schedules/business-logic.ts`
- Component is positioned to the far right of the CountersTable + ExtraPayTable group
- Updated CP-110 in `tests/e2e/sprint-16.spec.ts` to assert `data-testid="extra-pay-rates-legend"` is visible and contains tariff text ("Tarifas", shift codes, "/turno")

**Files**: `app/page.tsx`, `tests/e2e/sprint-16.spec.ts`

---

### BUG-42 — Empleados con preferencia T nunca reciben fines de semana ✅

**Symptom**: Test1 (shift preference = T) was only getting night/afternoon assignments — zero weekend (TF) slots across the entire month.

**Root cause**: `wouldExceedWorkWindow` returns `true` for employees who work Mon–Fri every week (consecutiveCount=5). These employees were excluded from Tiers 1 and 2 of `ensureWeekendPlan`. With enough M-preference employees available, MF and TF slots were filled before Tier 3 was reached, so the T-preference employee was never selected.

**Fix**: Added **Tier 2.5** in `ensureWeekendPlan`. After Tiers 1/2, if a slot was assigned to a mismatched-preference employee, attempt to swap it for a preference-matched employee from the relaxed pool (work-window limit ignored, no 3rd-consecutive-weekend constraint).

**Files**: `lib/schedules/monthly-schedule-engine.ts`

---

### BUG-43 — Más de 2 fines de semana entre bloques de noche ✅

**Symptom**: Test2 in February 2026 received 4 weekend assignments between two of their night blocks; requirement is maximum 2.

**Root cause**: The algorithm only prevented 3+ **consecutive** weekends. The actual requirement ("max 2 weekends between night blocks") is a stronger constraint that was never implemented. Between two night blocks, a long gap allowed 4+ weekends.

**Fix**: Added `getWeekendsSinceLastNightBlock` helper inside `ensureWeekendPlan`. Counts weekendShift entries assigned after the employee's last completed night block (startFriday+9). Employees with ≥2 weekends since their last block end are excluded in strict mode (Tiers 1/2). Tier 3 (coverage guarantee) relaxes this.

**Files**: `lib/schedules/monthly-schedule-engine.ts`

---

### BUG-44 — Más de 5 turnos de día consecutivos tras reparación ✅

**Symptom**: Test2 in May 2026 had 6+ consecutive MF morning shifts, violating the ≤5 rule.

**Root cause**: When an employee reaches 5 consecutive work days (Mon–Fri), Priority 2 assigns forced D on Saturday. However, the Saturday key was NOT added to `forcedRestDates` because of an `if (!isWeekend(date))` guard. The repair phase (`repairCoverage`), not finding Saturday in `forcedRestDates`, could convert the D → MF, creating 6+ consecutive shifts.

**Fix**: Removed the `!isWeekend(date)` condition. All forced-rest days (Mon–Sun) are now added to `forcedRestDates`, making them immune to the repair phase. The `releaseWeekendPackageShift` call already handles reassignment planning for the slot.

**Files**: `lib/schedules/monthly-schedule-engine.ts`

---

## New Feature

### Vista ampliada multi-mes (Excel-like horizontal scroll) ✅

**Description**: New page at `/multi-month` accessible via the "↔ Vista ampliada" button in the schedule toolbar. Displays an horizontally scrollable grid showing employees as rows and all dates across multiple months (configurable: 2, 3, 4, or 6 months) as columns, with cells color-coded by shift type.

**Details**:
- Uses `<Header />` and app layout conventions (auth guard, `useSession`, `bg-gray-50`)
- Month boundary marked with a stronger right border
- Weekend columns highlighted in amber
- Alternating row zebra striping for readability
- Print-friendly (controls hidden with `print:hidden`)
- Default: 3 months centered on current month

**Files**: `app/multi-month/page.tsx`, `app/page.tsx` (button)

---

## E2E Test Coverage

| Test | Status | Description |
|------|--------|-------------|
| CP-110 (updated) | ✅ | Verifies `extra-pay-rates-legend` visible with tariff codes and "/turno" text |

---

## Pending

- [ ] Favicon replacement (`app/favicon.ico` — 41662-byte ICO binary, awaiting filesystem path from user)
- [ ] E2E tests for multi-month view (CP-150+)
- [ ] Unit tests for BUG-42 / BUG-43 scheduling engine changes
