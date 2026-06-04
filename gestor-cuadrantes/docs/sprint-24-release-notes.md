# Sprint 24 — Release Notes

**Version**: 2.4.0  
**Date**: 2026-06-04  
**Status**: Closed ✅  
**Branch**: `feature/sprint-24-scheduling-fixes`

---

## Summary

Sprint 24 focuses on **scheduling engine correctness** (4 regressions detected in manual QA) and a new **multi-month expanded view** for reading cuadrantes in an Excel-like horizontal scroll format.

**Key Metrics (cierre de sprint):**
- **Unit Tests**: 425/427 passing (15 suites) — 2 fallos pre-existentes en cross-month night continuity (Sprint 17, no regresión de este sprint)
- **E2E Smoke**: CP-149..154 añadidos (sprint total: 6 nuevos CPs)
- **Build**: ✅ TypeScript clean
- **New bugs fixed**: 12 (BUG-41..BUG-52)
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

---

### BUG-45 — RatesLegend se muestra debajo de la tabla en lugar de a la derecha ✅

**Symptom**: After the BUG-41 fix added `RatesLegend` to the layout, the component was rendering below `ExtraPayTable` instead of alongside it.

**Root cause**: `RatesLegend` was placed outside the horizontal flex container shared by `CountersTable` and `ExtraPayTable`.

**Fix**: Moved `RatesLegend` inside the shared flex container.

**Files**: `app/page.tsx`

---

### BUG-46 — Se muestran empleados de otros proyectos al volver de la vista multi-mes ✅

**Symptom**: After navigating to `/multi-month` and pressing Back, the schedule grid showed employees from other projects mixed in.

**Root cause**: Multi-month page fetched employees without filtering by active project; navigating back triggered a stale state render.

**Fix**: Applied active project filter in the multi-month data fetch.

**Files**: `app/multi-month/page.tsx`

---

### BUG-47 — Estilo del toolbar de vista multi-mes inconsistente ✅

**Symptom**: The multi-month toolbar used `text-xl`/`text-sm`/`gap-4` while the main app uses `text-xs`/`gap-2`.

**Fix**: Normalized to `text-xs`/`gap-2`, replaced `<label>` with `<span>`, added `data-testid="btn-back"`.

**Files**: `app/multi-month/page.tsx`

---

### BUG-48 — 11+ noches consecutivas al cambiar el orden de rotación entre meses ✅

**Symptom**: An employee accumulated 11+ consecutive night shifts when the night rotation order changed between months.

**Root cause**: `applyCrossMonthNightBlocks` was adding cross-month night continuation even when the new rotation already covered those slots, and was incorrectly clearing other employees' legitimate rotation nights.

**Fix**:
- Skip cross-month continuation if the employee's new rotation already starts within the `nightsRemaining + 3` window.
- Only clear conflicting nights for employees who also have trailing nights in the previous month.

**Files**: `lib/schedules/cross-month.ts`

**Tests**: `tests/unit/schedules/cross-month-nights.test.ts` (3 cases)

---

### BUG-49 — Celdas de vista multi-mes sin estilo visual consistente ✅

**Symptom**: Multi-month cells rendered as flat full-width rectangles. Weekend headers used amber instead of blue.

**Fix**: Imported and used `ShiftCell` component, added `p-0.5`/`h-7` on `<td>`, changed weekend column color from `amber` to `blue`.

**Files**: `app/multi-month/page.tsx`

---

### BUG-50 — RatesLegend se apila verticalmente debajo de ExtraPayTable ✅

**Symptom**: `RatesLegend` was stacking vertically below `ExtraPayTable` after the BUG-45 fix.

**Fix**: Corrected placement within the horizontal flex container in `app/page.tsx`.

**Files**: `app/page.tsx`

**Tests**: `tests/e2e/sprint-24.spec.ts` — CP-153

---

### BUG-51 — Las tres tablas de resumen separadas por justify-between ✅

**Symptom**: `RatesLegend` was pushed to the far right of the viewport by a `justify-between` container while `CountersTable` and `ExtraPayTable` remained left-aligned. User preference: all three tables left-aligned in sequence.

**Fix**: Replaced the two-div nesting with `justify-between` by a single `flex flex-wrap gap-4 items-start` container holding all three tables.

**Files**: `app/page.tsx`

**Tests**: `tests/e2e/sprint-24.spec.ts` — CP-154

---

### BUG-52 — Turno Tarde sin cobertura cuando surplus de Mañana y sin candidatos D ✅

**Symptom**: Some days showed zero Tarde (T/TF) employees while Mañana (M/MF) had ≥2, leaving a shift with no coverage.

**Root cause**: `repairAllDailyCoverage` only promotes `D` (rest) days to the deficit shift. When all available employees already had a working shift (M or T) and no `D` candidate existed, the repair couldn't act.

**Fix**: New `repairCoverageByDayShiftSwap()` runs as the last repair pass. When M surplus (≥2) and T=0, it converts one surplus M→T — provided the employee is not in `nightPlan`, `forcedRestDates`, not preference `J`, and the shift transition is valid.

**Known limitation**: Weekend TF gaps where adjacent days have MF remain unfixed (T→M transition blocked by 8h rest rule). Requires weekend package redesign.

**Files**: `lib/schedules/monthly-schedule-engine.ts`

**Tests**: `tests/unit/schedules/coverage-swap-repair.test.ts` — CP-155, CP-156, CP-157


## E2E Test Coverage

| Test | Status | Description |
|------|--------|-------------|
| CP-110 (updated) | ✅ | Verifica `extra-pay-rates-legend` visible con códigos de tarifa y "/turno" |
| CP-149 | ✅ | Toolbar multi-mes usa `text-xs` / `gap-2` (BUG-47) |
| CP-150 | ✅ | Botón Back multi-mes tiene `data-testid="btn-back"` (BUG-47) |
| CP-151 | ✅ | Vista multi-mes no mezcla empleados de otros proyectos (BUG-46) |
| CP-152 | ✅ | Celdas multi-mes usan ShiftCell con `border-radius > 0` (BUG-49) |
| CP-153 | ✅ | `rates-legend` visible y en la misma fila que ExtraPayTable (BUG-50) |
| CP-154 | ✅ | Las tres tablas (Contadores, ExtraPay, Tarifas) alineadas a la izquierda en fila (BUG-51) |

---

## Pendiente para próximo sprint

- [ ] Favicon replacement (`app/favicon.ico` — pendiente ruta del sistema de archivos)
- [ ] Cobertura TF en fines de semana (limitación conocida de BUG-52 — requiere rediseño del paquete de fin de semana)
- [ ] Fallos pre-existentes en tests de continuidad cross-month nocturna (Sprint 17, `generate.test.ts`)
