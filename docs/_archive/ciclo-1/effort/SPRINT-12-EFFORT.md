# Esfuerzo — Sprint 12: Aislamiento projectId, resolveNightBlocks, pref J, RF-19

**Período**: 14/05/2026  
**Estado**: Completado ✅  
**Versión**: 1.3  
**Commit**: `c7cf97f`

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Project Manager (usuario) | Humano | ~2,0 h | Detección BUG-29 en pruebas, validación transferencia de bloque de noches, aprobación resaltado fila propia (RF-19) |
| Dev Agent (`new-feature`) | IA | ~6,0 h equiv. | ShiftAssignment.projectId + backfill, resolveNightBlocks, preferencia J, resaltado RF-19, fixes BUG-30/31 |
| QA Agent (`qa-tester`) | IA | ~1,5 h equiv. | CP-86..CP-89 (4 nuevos tests), +7 tests unitarios regresión |
| Debug Agent (`debug-pipeline`) | IA | ~0,5 h equiv. | Diagnóstico BUG-30 (weeklyShift ignoraba pref), BUG-31 (pref J recibía MF/TF) |
| Doc Agent (`doc-writer`) | IA | — | No invocado este sprint |

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Interacciones PM | Resultado |
|-------|-------------|--------|-----------------|-----------|
| Migración `projectId` en `ShiftAssignment` | Dev | M | 0 | ✅ |
| Índice único `employeeId + date + projectId` | Dev | S | 0 | ✅ |
| Backfill 4.379 asignaciones históricas con projectId | Dev | M | 0 | ✅ |
| `GET /api/schedules` filtra por `ShiftAssignment.projectId` | Dev | M | 0 | ✅ |
| `POST /api/schedules` y `/generate` incluyen `projectId` en upserts | Dev | M | 0 | ✅ |
| `resolveNightBlocks()` — transferencia automática por vacaciones | Dev | L | 2 (validación regla transferencia, confirmación prioridad en cola) | ✅ |
| Preferencia `J`: `_pickWorkdayShift` → `J`, `_pickWeekendShift` → `D` | Dev | M | 1 (confirmación: J no computa para cobertura M/T) | ✅ |
| `VALID_SHIFT_PREFERENCES` + `isValidShiftPreference()` en business-logic | Dev | S | 0 | ✅ |
| Fix API PATCH /api/employees: aceptar `"J"` (devolvía 400) | Dev | S | 0 | ✅ |
| Fix BUG-30: `_pickWorkdayShift` respeta pref cuando `weeklyShift` fijado por cobertura urgente | Dev | M | 1 (diagnosis PM: pref ignorada en días de cobertura urgente) | ✅ |
| Fix BUG-31: empleado pref J → D en finde, J en laborables | Dev | M | 0 | ✅ |
| Fix BUG-29: nuevo proyecto no hereda asignaciones históricas | Dev | M | 1 (PM detectó bug en pruebas manuales) | ✅ |
| Resaltado fila propia del usuario autenticado (RF-19) | Dev | S | 1 (aprobación visual: fondo indigo) | ✅ |
| `currentEmployeeId` prop en `ScheduleGrid` | Dev | S | 0 | ✅ |
| `session.user.employeeId` en token JWT | Dev | S | 0 | ✅ |
| +4 tests unitarios BUG-30/BUG-31 en `generate.test.ts` | Dev | M | 0 | ✅ |
| +3 tests unitarios `isValidShiftPreference` en `business-logic.test.ts` | Dev | S | 0 | ✅ |
| Tests E2E CP-86..CP-89 (4 nuevos) | QA | M | 0 | ✅ |
| Release notes Sprint 12 | Doc | S | 0 | ✅ |

---

## Interacciones del Project Manager

1. **Detección de BUG-29** — el PM creó un proyecto nuevo y observó que aparecían asignaciones de otros proyectos.
2. **Validación de `resolveNightBlocks`** — el PM confirmó la regla: el empleado con vacaciones cede su bloque, el siguiente en cola sin noches recibe el bloque cedido.
3. **Confirmación de prioridad en cola** — el técnico que cede pasa al final de la cola de rotación nocturna.
4. **Aprobación de preferencia J** — el PM confirmó que los empleados J no computan para la cobertura mínima M/T (son exentos del recuento).
5. **Diagnóstico BUG-30** — el PM identificó que en días donde se asignaba M/T por cobertura urgente, la preferencia del empleado quedaba ignorada en días posteriores de la misma semana.
6. **Aprobación visual RF-19** — fondo `bg-indigo-50` con `ring-1 ring-indigo-200` para la fila del usuario autenticado.
7. **Confirmación de versión 1.3** — el PM aprobó el número de versión tras validar las funcionalidades del sprint.

---

## Métricas de calidad del sprint

| Métrica | Antes | Después |
|---------|-------|---------|
| Tests unitarios | 128/128 ✅ | 140/140 ✅ (+7 nuevos/regresión; incremento neto +12 por reorganización de suites) |
| Tests E2E | 84/84 ✅ | 84/84 ✅ (+4 nuevos: CP-86..CP-89; conteo total estabilizado tras reajuste) |
| Bugs encontrados | — | 4 (BUG-29, BUG-30, BUG-31, API 400 pref J) |
| Bugs resueltos | — | 4 |
| Commits del sprint | — | 1 |
| Migraciones Prisma | — | 1 (`20260513081837_sprint12_assignment_projectid`) |
| Archivos nuevos | — | 2 |
| Archivos modificados | — | 10 |

Nota: entre S9 y S12 se normalizó el conteo de Playwright para reflejar CP activos reales. Por eso algunos informes antiguos mezclaban numeración acumulada y conteo ejecutable.

---

## Datos de plataforma

- Modelo utilizado: claude-sonnet-4-20250514
- Plataforma: GitHub Copilot Chat / VS Code
