# Esfuerzo — Sprint 17: Correcciones del algoritmo II

**Período**: 22/05/2026 - 22/05/2026  
**Estado**: Completado ✅  
**Versión**: 1.7  
**Rama**: `feature/sprint-17-algorithm-fixes-ii`  
**Commits**: `3011cf6`..`e0b4fe6` (4 commits en rama feature)

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Project Manager / Product Owner (usuario) | Humano | ~1,5 h | Prompt Sprint 17, validación de tests fallidos, revisión del informe de estado |
| Dev Agent (`new-feature`) | IA | ~6,0 h equiv. | Corrección de las 3 tareas del algoritmo, crossMonthRestDates, route handler, tests |
| QA Agent / Debug Agent | IA | ~3,0 h equiv. | Debug de night-block cycle math, crossMonthRestDates fix, diagnóstico de reparación relajada |
| Context/Doc Agent | IA | ~0,5 h equiv. | Release notes, esfuerzo, actualización de requisitos e informe de estado |

**Total humano estimado**: ~1,5 h  
**Total IA estimado**: ~9,5 h equiv.  
**Total sprint estimado**: ~11,0 h

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Interacciones PM | Resultado |
|-------|-------------|--------|-----------------|-----------|
| Crear rama `feature/sprint-17-algorithm-fixes-ii` | Dev | S | 0 | ✅ |
| Tarea 1 — Condición `trailingPostRestD >= 2` para post-descanso nocturno cross-month | Dev + Debug | M | 1 | ✅ |
| Tarea 1 — Exclusión de fines de semana de `forcedRestDates` (Priority 2) | Dev | S | 0 | ✅ |
| Tarea 1 — Emisión de `CoverageWarning` cuando descanso forzado deja cobertura < 1 | Dev | M | 0 | ✅ |
| Tarea 2 — `crossMonthRestDates` pre-seeded en `forcedRestDates` (fix reparación relajada) | Dev + Debug | L | 1 (validación de tests fallidos) | ✅ |
| Tarea 2 — Continuidad cross-month completa: 1-6N, 7N y post-rest parcial | Dev | M | 0 | ✅ |
| Tarea 3 — Guard de fixabilidad D aislado en `canRepairCoverageWithShift` | Dev | M | 0 | ✅ |
| Tarea 3 — `canLaterEmployeeCover` + mecanismo `deferShift` para preferencia M/T | Dev | M | 0 | ✅ |
| Añadir `coverageWarnings` al endpoint `POST /api/schedules/generate` | Dev | S | 0 | ✅ |
| Rediseño del setup de tests Tarea 1 (4 empleados + nightRotationIds posicionados) | Debug | L | 0 | ✅ |
| 8 tests unitarios nuevos (Tareas 1-3) | QA/Dev | M | 0 | ✅ |
| E2E CP-110..CP-115 | QA/Dev | M | 0 | ✅ |
| Commits atómicos por capa (algo / api / tests / docs) | Dev | S | 0 | ✅ |
| Release notes Sprint 17 | Doc | S | 0 | ✅ |
| Documentación completa (esfuerzo, bugs, requisitos, informe) | Doc | M | 0 | ✅ |
| Push rama `feature/sprint-17-algorithm-fixes-ii` | Dev | S | 0 | ✅ |

---

## Interacciones del Project Manager

1. **Prompt Sprint 17** — el PM definió 3 tareas con sus casos de prueba unitarios y E2E esperados, incluyendo la estructura de `coverageWarnings`.
2. **Validación de tests fallidos** — los 2 tests de Tarea 1 y Tarea 2 fallaban por interferencia del night-block cycle math. El PM confirmó que los tests debían corregirse rediseñando el setup (4 empleados con `nightRotationIds` posicionados) y aplicando el fix `crossMonthRestDates` para la Tarea 2.

---

## Métricas de calidad del sprint

| Métrica | Antes | Después |
|---------|-------|---------|
| Tests unitarios | 217/217 ✅ | 227/227 ✅ |
| E2E Sprint 17 | — | 6/6 ✅ (`CP-110..CP-115`) |
| E2E acumulados | CP-01..CP-109 (109) | CP-01..CP-115 (115) |
| Lint | ✅ | ✅ Passing |
| Build | ✅ | ✅ Passing |
| Bugs detectados por PM | — | 0 nuevos (correcciones planificadas) |
| Commits del sprint | — | 4 |

---

## Notas

- La causa raíz del fallo de Tarea 2 (D post-descanso cross-month convertido a M por la fase relajada) era sutil: `repairCoverage` pasa `allowNightPlanRest: true` en su segunda pasada, lo que omite el check `nightPlan.has(key)`. El fix `crossMonthRestDates` → `forcedRestDates` es independiente de esa flag y cierra el agujero permanentemente.
- El setup de tests de Tarea 1 requirió calcular manualmente el ciclo nocturno (epoch 2026-01-02, módulo 28 días con 4 empleados) para posicionar a `emp-1` con su bloque de noches en Jun12-18, dejando Jun1-3 libres para que el descanso forzado pueda aplicar.
- Los archivos de debug (`debug_t1.test.ts`, `debug-tarea2b.test.ts`, etc.) fueron eliminados antes del push final.
