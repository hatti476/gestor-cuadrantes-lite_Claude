# Esfuerzo — Sprint 18: UX fixes, SUPER_VIEWER y correcciones de algoritmo

**Período**: 22/05/2026 - 22/05/2026  
**Estado**: Completado ✅  
**Versión**: 1.8  
**Rama**: `feature/sprint-18-fixes-and-ux`  
**Commits**: `28d2660`..`6c94861` (8 commits en rama feature)

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Project Manager / Product Owner (usuario) | Humano | ~2,0 h | Prompt Sprint 18, pruebas manuales, feedback de 3 bugs adicionales, verificación del seed |
| Dev Agent (Copilot / Claude) | IA | ~10,0 h equiv. | 7 tareas planificadas + 3 bugfixes + prisma generate + tests + agentes |
| QA / Debug Agent | IA | ~2,0 h equiv. | Diagnóstico de prisma.scheduleSnapshot undefined, diagnóstico de weekendCount, E2E adicionales |
| Doc Agent | IA | ~1,0 h equiv. | Release notes, esfuerzo, BUG-REGISTRY, REQUIREMENTS, context.md |

**Total humano estimado**: ~2,0 h  
**Total IA estimado**: ~13,0 h equiv.  
**Total sprint estimado**: ~15,0 h

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Interacciones PM | Resultado |
|-------|-------------|--------|-----------------|-----------|
| Crear rama `feature/sprint-18-fixes-and-ux` desde `main` (post-merge S17) | Dev | S | 0 | ✅ |
| Tarea 1 — Pre-seed `weekendPlan` con sábado del mes anterior para continuidad cross-month | Dev | M | 0 | ✅ |
| Tarea 2 — `availablePerDay` + `coverageWarnings` pre-generación + guard en `repairAllDailyCoverage` | Dev | M | 0 | ✅ |
| Commit atómico Tareas 1+2 con 7 tests unitarios nuevos | Dev | M | 0 | ✅ |
| Tarea 3 — Rol SUPER_VIEWER: permissions, NextAuth, schema, seed, header, page | Dev | L | 1 (verificar credenciales) | ✅ |
| Commit atómico Tarea 3 | Dev | S | 0 | ✅ |
| Tarea 4 — Columnas sáb/dom azul + festivos rojo intenso + celdas festivo bg-red-50 | Dev | S | 1 (pedir más contraste) | ✅ |
| Commit atómico Tarea 4 | Dev | S | 0 | ✅ |
| Tarea 5 — Colores unificados por familia (M/MF, T/TF, N/NF) + V/B negro | Dev | S | 1 (V/B pedir negro) | ✅ |
| Commit atómico Tarea 5 | Dev | S | 0 | ✅ |
| Tarea 6 — Modelo `ScheduleSnapshot`, API snapshot + restore, UI undo button | Dev | L | 0 | ✅ |
| Fix: `prisma generate` faltaba → `prisma.scheduleSnapshot` undefined | Debug | S | 1 (reporte de error) | ✅ |
| Fix: `setSnapshotAvailable(true)` solo si `res.ok` | Dev | S | 0 | ✅ |
| Rename botón "Deshacer generación" → "↩ Deshacer" | Dev | S | 1 (petición usuario) | ✅ |
| Commit atómico Tarea 6 + tests unitarios actualizados (250 total) | Dev | M | 0 | ✅ |
| Tarea 7 — E2E sprint-18.spec.ts CP-115..CP-125 | QA | M | 0 | ✅ |
| Commit atómico Tarea 7 | Dev | S | 0 | ✅ |
| Bugfix B2 — bloque N cross-month interrumpido por V/B: `break` en bucles nightPlan | Dev | M | 1 (reporte de bug) | ✅ |
| Tests unitarios B2 (3 nuevos) | Dev | M | 0 | ✅ |
| Bugfix B3 — `weekendCount` en EmpState para equidad de fines de semana | Dev | M | 1 (reporte de desequilibrio) | ✅ |
| Tests unitarios B3 (2 nuevos) | Dev | M | 0 | ✅ |
| E2E CP-126..CP-128 para bugfixes B1/B2/B3 | QA | M | 0 | ✅ |
| Actualizar agentes: orchestrator, new-feature, pre-merge-review (tests obligatorios) | Dev | M | 1 (petición usuario) | ✅ |
| Commit final agrupado (bugfixes + tests + agentes) | Dev | S | 0 | ✅ |
| Push rama a origin | Dev | S | 0 | ✅ |
| Documentación de cierre (release notes, esfuerzo, BUG-REGISTRY, REQUIREMENTS, context.md) | Doc | M | 0 | ✅ |
| Pull Request contra `main` | Dev | S | 0 | ✅ |

---

## Interacciones del Project Manager

1. **Prompt Sprint 18** — el PM definió 7 tareas con descripción técnica y E2E esperados.
2. **Pruebas manuales** — el PM probó la app en local y reportó 3 issues: (a) V/B necesitan fondo negro, (b) bloque N del 31 Jul no respetaba vacaciones de agosto, (c) desequilibrio de fines de semana.
3. **Error botón Deshacer** — el PM notificó que el botón daba error → diagnóstico: `prisma generate` no ejecutado tras la migración del modelo `ScheduleSnapshot`.
4. **Rename botón** — el PM pidió que el botón dijera solo "Deshacer" en lugar de "Deshacer generación".
5. **Más contraste** — el PM pidió que sáb/dom y festivos fueran más visibles → cambio a azul/rojo.
6. **Creación de SUPER_VIEWER** — el PM preguntó cómo crear el usuario → explicación del seed y ejecución de `npm run db:seed`.
7. **Tests obligatorios** — el PM pidió que los agentes siempre generasen tests sin que él tuviese que recordarlo.

---

## Métricas de calidad del sprint

| Métrica | Antes | Después |
|---------|-------|---------|
| Tests unitarios | 234/234 ✅ | 257/257 ✅ |
| E2E declarados | CP-01..CP-114 | CP-01..CP-128 |
| Bugs abiertos | 0 | 0 |
| Commits en rama | — | 8 |
| TypeScript errors | 0 | 0 |
