# Sprint 22 — Mapa de `generate-core.ts` (Paso 1)

Fecha: 2026-05-29
Archivo analizado: `lib/schedules/generate-core.ts` (1606 líneas)

## Funciones exportadas

- `generateMonthSchedule(...)`
  - Tipo: orquestación + loop diario + reparaciones post-loop
  - Estado: migrada a módulo especializado `monthly-schedule-engine.ts` y expuesta vía `generate.ts`.

## Funciones auxiliares internas (scope de generateMonthSchedule)

- **Auxiliares de orquestación pura**
  - `getPreviousShift`
  - `applyTransitionCompliance`
  - `wouldBreakTransition`
  - `ensureSecondRestAfterWork`
  - `pushAssignment`
  - `isInGeneratedMonth`
  - `getGeneratedOrExistingShift`

- **Lógica de paquete fin de semana / festivos extendidos**
  - `getWeekendPackageDates`
  - `getWeekendSaturdayForDate`
  - `respectsPackageTransitions`
  - `wouldExceedWorkWindow`
  - `ensureWeekendPlan`
  - `getWeekendPackageShift`
  - `claimOpenWeekendPackageShift`
  - `releaseWeekendPackageShift`
  - `getWeekendPackageShiftBySaturday`
  - `getPrepRestSaturday`
  - `needsWeekendPrepRest`

- **Lógica de reparación y cobertura**
  - `countAdjacentDayWork`
  - `hasAdjacentOppositeDayShift`
  - `canRepairCoverageWithShift`
  - `repairCoverage`
  - `setGeneratedShift`
  - `repairWeekendPackageConsistency`
  - `canConvertGeneratedWorkToRest`
  - `convertGeneratedWorkToRest`
  - `movePackageShiftFromEmployee`
  - `repairSingleRestDays`
  - `repairAllDailyCoverage`
  - `repairAllWeekendPackageConsistency`
  - `repairAdjacentDayShiftFlips`

- **Actualización de estado por asignación**
  - `_updateState`

## Duplicaciones ya cubiertas por módulos especializados

- `date-utils.ts`: `isWeekend`, `toDateStr`, `fromDateStr`, `addDays`, `isWeekendOrHoliday`, `applySpecialDayRule`, `applyChristmasSpecialRule`, `normalizeShift`, `weekKey`.
- `night-blocks.ts`: `nightBlockDays`, `computeNightBlocks`, `resolveNightBlocks`.
- `rest-rules.ts`: `isDayWorkShift`, `countTrailingDayWork`, `countTrailingShift`, `initialForcedRestDaysRemaining`, `isPostRestDay`, `countConsecutiveWorkDays`, `getExtendedWeekend`.
- `weekend-packs.ts`: `pickWeekendShift`, `pickWeekendPackageEmployee`.
- `workday-shifts.ts`: `pickWorkdayShift`.
- `cross-month.ts`: `buildPrevMonthTrailingState`, `applyCrossMonthNightBlocks`, `applyCrossMonthWeekendPack`.

## Clasificación final para migración

- Duplicación: ya resuelta vía imports a módulos especializados (sin cambios de comportamiento).
- Orquestación pura: se expone desde `generate.ts` como punto de entrada estable.
- Lógica de negocio de loop diario y reparaciones: consolidada en módulo especializado `monthly-schedule-engine.ts`.
- Nuevos módulos creados: `monthly-schedule-engine.ts` (responsabilidad: engine mensual completo).
