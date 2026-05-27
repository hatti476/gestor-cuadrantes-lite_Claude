# Sprint 21 — Análisis de cierres internos (`generateMonthSchedule`)

## Alcance analizado
- Archivo: `lib/schedules/generate.ts`
- Función: `generateMonthSchedule(...)`
- Tramo principal: líneas ~157–1556

## Mapa completo de cierres (closures)

| Cierre interno | Capturas principales del scope exterior | Responsabilidad | Dependencias entre cierres |
|---|---|---|---|
| `getPreviousShift` | `generatedShiftByKey`, `options.existingAssignments`, `previousMonthShiftByKey`, `toDateStr`, `addDays` | Resolver turno previo efectivo (generado, existente o arrastrado) | Base de `applyTransitionCompliance`, `wouldBreakTransition`, `ensureSecondRestAfterWork`, `respectsPackageTransitions`, `canLaterEmployeeCover`, `claimOpenWeekendPackageShift` |
| `applyTransitionCompliance` | `options.warnings`, `validateShiftTransition`, `isValidShiftType`, `toDateStr` | Forzar cumplimiento ET 12h (si no cumple, convierte a `D` y emite warning) | Usa `getPreviousShift`; usada por `pushAssignment` |
| `wouldBreakTransition` | `validateShiftTransition`, `isValidShiftType` | Comprobar rápido si una asignación rompería transición | Usa `getPreviousShift`; usada por `claimOpenWeekendPackageShift` |
| `ensureSecondRestAfterWork` | `isDayWorkShift` | Mantener 2º día de descanso tras trabajo | Usa `getPreviousShift`; usada en ramas `D` del loop diario |
| `pushAssignment` | `result`, `generatedShiftByKey`, `_updateState`, `toDateStr` | Escribir asignación + actualizar estado y cobertura del día | Usa `applyTransitionCompliance` |
| `isInGeneratedMonth` | `year`, `month` | Filtrar fechas al mes objetivo | Usada por `getWeekendPackageDates` |
| `getWeekendPackageDates` | `holidayDates`, `toDateStr`, `addDays` | Construir paquete extendido (festivos adyacentes) | Usa `isInGeneratedMonth`; usada por planificación/reparaciones |
| `getWeekendSaturdayForDate` | `holidayDates`, `toDateStr`, `addDays`, `isWeekend` | Hallar sábado “ancla” de un finde/festivo | Usada por funciones de paquete |
| `respectsPackageTransitions` | `validateShiftTransition`, `isValidShiftType`, `applyChristmasSpecialRule` | Validar transiciones para un empleado en todo el paquete | Usa `getPreviousShift`; usada por `ensureWeekendPlan` |
| `wouldExceedWorkWindow` | `isDayWorkShift` | Evitar paquetes que rompan ventana de 5 días trabajo | Usada por `ensureWeekendPlan`, `needsWeekendPrepRest` |
| `ensureWeekendPlan` | `weekendPlan`, `sortedEmps`, `stateMap`, `existingDates`, `nightPlan`, `weekKey`, `toDateStr` | Crear/recuperar dueño de `MF/TF` para un sábado | Usa `getWeekendPackageDates`, `wouldExceedWorkWindow`, `respectsPackageTransitions` |
| `availableForPackage` (anidado) | `sortedEmps`, `existingDates`, `nightPlan`, `stateMap` | Filtrar candidatos a paquete | Anidado en `ensureWeekendPlan` |
| `pickEmployee` (anidado) | `_pickWeekendPackageEmployee`, `stateMap` | Elegir propietario `MF` o `TF` | Anidado en `ensureWeekendPlan` |
| `wouldGet3rdConsec` (anidado) | `stateMap`, `prevWeekendKey`, `prev2WeekendKey` | Evitar 3º finde consecutivo | Anidado en `ensureWeekendPlan` |
| `reserveWeekendPattern` (anidado) | `stateMap` | Reservar `weekendShift/weekShift` para equilibrio | Anidado en `ensureWeekendPlan` |
| `getWeekendPackageShift` | `toDateStr` | Devolver `MF/TF/D` según plan | Usa `getWeekendSaturdayForDate`, `getWeekendPackageDates`, `ensureWeekendPlan` |
| `claimOpenWeekendPackageShift` | `sortedEmps`, `stateMap`, `existingDates`, `nightPlan`, `generatedShiftByKey` | Reclamar hueco `MF/TF` no cubierto para hard coverage | Usa `getWeekendSaturdayForDate`, `ensureWeekendPlan`, `wouldBreakTransition` |
| `canClaim` (anidado) | `cov`, `stateMap`, `existingDates`, `nightPlan`, `toDateStr` | Validación de elegibilidad al reclamar | Anidado en `claimOpenWeekendPackageShift` |
| `releaseWeekendPackageShift` | `weekendPlan`, `toDateStr` | Liberar slot `MF/TF` de paquete | Usa `getWeekendSaturdayForDate` |
| `getWeekendPackageShiftBySaturday` | `weekendPlan` | Lectura directa de slot por sábado | Usa `ensureWeekendPlan` |
| `getPrepRestSaturday` | `holidayDates`, `toDateStr`, `addDays` | Hallar sábado objetivo para descanso preparatorio | Usada en loop diario y `canLaterEmployeeCover` |
| `needsWeekendPrepRest` | `state.weekShift` | Decidir descanso previo a paquete por ventana/cambio semanal | Usa `wouldExceedWorkWindow`, `weekKey` |
| `canLaterEmployeeCover` (anidado) | `dailyOrder`, `stateMap`, `existingDates`, `nightPlan`, `holidayDates` | Saber si otro empleado posterior puede cubrir M/T | Usa `getPrepRestSaturday`, `getWeekendPackageShiftBySaturday`, `getPreviousShift` |
| `getGeneratedOrExistingShift` | `resultByKey`, `options.existingAssignments`, `previousMonthShiftByKey` | Resolver turno efectivo tras generación parcial + existentes | Base de todas las reparaciones |
| `countAdjacentDayWork` | `addDays` | Contar racha trabajo en vecinos | Usa `getGeneratedOrExistingShift`; usada por `canRepairCoverageWithShift` |
| `hasAdjacentOppositeDayShift` | `normalizeShift`, `addDays` | Detectar flip M↔T adyacente | Usa `getGeneratedOrExistingShift`; usada por `canRepairCoverageWithShift`, scoring |
| `canRepairCoverageWithShift` | `resultByKey`, `existingDates`, `nightPlan`, `forcedRestDates`, `sortedEmps`, `holidayDates` | Validar si `D -> targetShift` es seguro | Usa `countAdjacentDayWork`, `hasAdjacentOppositeDayShift`, `getWeekendSaturdayForDate`, `getWeekendPackageDates` |
| `repairCoverage` | `sortedEmps`, `stateMap`, `generatedShiftByKey`, `resultByKey`, `forcedRestDates` | Reponer cobertura mínima día/tipo con scoring estricto→relajado | Usa `canRepairCoverageWithShift`, `getGeneratedOrExistingShift`, `hasAdjacentOppositeDayShift` |
| `currentCoverageCount` (anidado) | `sortedEmps` | Medir cobertura actual de `targetBase` | Anidado en `repairCoverage` |
| `buildScoredCandidates` (anidado) | `stateMap`, `holidayDates`, `weekKey` | Scoring de candidatos de reparación | Anidado en `repairCoverage` |
| `setGeneratedShift` | `resultByKey`, `generatedShiftByKey`, `toDateStr` | Escritura atómica de cambio en fase reparación | Usado por varias reparaciones |
| `repairWeekendPackageConsistency` | `sortedEmps`, `stateMap`, `existingDates`, `nightPlan` | Consolidar un único owner por paquete M/T | Usa `getWeekendPackageDates`, `canRepairCoverageWithShift`, `setGeneratedShift` |
| `targetShiftForDate` (anidado) | `applyChristmasSpecialRule` | Turno objetivo dinámico por fecha especial | Anidado en `repairWeekendPackageConsistency` |
| `canConvertGeneratedWorkToRest` | `resultByKey`, `existingDates`, `nightPlan`, `sortedEmps` | Permitir conversión trabajo→`D` preservando cobertura | Usa `getGeneratedOrExistingShift`, `normalizeShift` |
| `convertGeneratedWorkToRest` | `resultByKey`, `generatedShiftByKey`, `toDateStr` | Ejecutar conversión trabajo→`D` | Usada por `repairSingleRestDays` |
| `movePackageShiftFromEmployee` | `sortedEmps`, `stateMap`, `holidayDates` | Reasignar paquete para eliminar `D` aislado | Usa `canRepairCoverageWithShift`, `setGeneratedShift`, `getWeekendPackageDates` |
| `isValidCandidate` (anidado) | `shiftType`, `employeeId` | Validador candidato a mover paquete | Anidado en `movePackageShiftFromEmployee` |
| `hasConsecHistory` (anidado) | `stateMap`, `pkgPrevWk`, `pkgPrev2Wk` | Penalizar 3º finde consecutivo en move | Anidado en `movePackageShiftFromEmployee` |
| `repairSingleRestDays` | `sortedEmps`, `result`, `daysInMonth` | Eliminar patrón trabajo-`D`-trabajo | Usa `movePackageShiftFromEmployee`, `canConvertGeneratedWorkToRest`, `convertGeneratedWorkToRest` |
| `repairAllDailyCoverage` | `availablePerDay`, `holidayDates`, `sortedEmps` | Pasada global de cobertura diaria | Usa `repairCoverage` |
| `repairAllWeekendPackageConsistency` | `daysInMonth` | Pasada global de consistencia de paquetes | Usa `repairWeekendPackageConsistency` |
| `repairAdjacentDayShiftFlips` | `sortedEmps`, `result`, `existingDates`, `nightPlan`, `holidayDates` | Suavizar flips M↔T adyacentes | Usa `getGeneratedOrExistingShift`, `setGeneratedShift`, `validateShiftTransition` |

## Variables de estado que se modifican día a día
- `result` (array de asignaciones generadas)
- `generatedShiftByKey`
- `dayCoverage`
- `stateMap` por empleado:
  - `consecutiveShift`
  - `consecutiveCount`
  - `forcedRestDaysRemaining`
  - `weekShift`
  - `weekendShift`
  - `mCount`
  - `tCount`
  - `weekendCount`
- `weekendPlan` (por sábado)
- `forcedRestDates`
- `options.warnings` y `options.coverageWarnings` (si se proveen)

## Variables de estado acumuladas entre días (y usadas en reparaciones)
- `resultByKey` (construido tras loop diario y luego mutado)
- `availablePerDay` (baseline para cobertura)
- `nightPlan` y `nightBlockRestDates` (plan fijo del mes, consultado durante todo el flujo)
- `crossMonthRestDates` (arrastre protegido)
- `previousMonthShiftByKey` y `prevTailByEmp` (continuidad cross-month)
- `weekendPlan` (persistente entre iteraciones y reparaciones)

## Orden real de ejecución dentro de cada día (loop principal)
1. Calcular metadatos del día (`date`, `dateStr`, `isHoliday`, `wKey`, `cov`).
2. Ordenar empleados (`dailyOrder`) y evaluar potencial de cobertura diferida (`canLaterEmployeeCover`).
3. Para cada empleado:
   - Prioridad 1: `existingDates` (celda bloqueada/manual/V/B) → no tocar.
   - Prioridad 2: descanso HARD (`forcedRest`) → asignar `D`.
   - Prioridad 3: `nightPlan` (N o D de bloque noche).
   - Prioridad 4: descanso preparatorio de paquete (`prepRest`).
   - Prioridad 5: fallback legacy de descanso forzado (`needsRest`).
   - Prioridad 6: paquete finde/festivo (`MF/TF/D`) + posible `claimOpenWeekendPackageShift`.
   - Prioridad 7: festivo laborable sin paquete (`_pickWeekendShift`).
   - Prioridad 8: laborable normal (`_pickWorkdayShift`).
4. Escritura final de cada asignación siempre vía `pushAssignment` (incluye validación ET).

## Identificación de qué pertenece a `DayLoopContext`

### `DayLoopInput` (inmutable en ejecución)
- `projectId`, `year`, `month`
- `employees`
- `holidays`
- `lockedCells` (`existingDates`)
- `nightBlockPlan` (`nightPlan` ya materializado)
- `weekendPackPlan` (seed/base de `weekendPlan`)
- `prevMonthContext` (`prevMonthTail`, `previousMonthShiftByKey`, `prevTailByEmp`)
- `nextMonthContext` (metadatos para continuidad post-mes)

### `DayLoopState` (mutable día a día)
- `assignments` (`result`, `generatedShiftByKey`, `resultByKey`)
- `weeklyShifts` (`state.weekShift` por empleado)
- `consecutiveWorkDays` (`state.consecutiveCount`)
- `consecutiveRestDays` (derivable y/o explícito en nueva estructura)
- `currentWeekendShifts` (`state.weekendShift` + `weekendPlan` en curso)
- `forcedRestDates`, `dayCoverage`

### `DayLoopOutput` (acumulado final)
- `assignments`
- `warnings` (`coverageWarnings` + warnings ET)
- `coverageSummary` (estado final por día/turno)

## Conclusión
La función actual concentra tres capas mezcladas: planificación diaria, política de prioridad y reparaciones globales post-loop. El refactor de Sprint 21 debe extraer el bloque de iteración cronológica + helpers de decisión a `day-loop.ts` y dejar `generate.ts` como orquestador (validación/carga/contexto/persistencia/respuesta).
