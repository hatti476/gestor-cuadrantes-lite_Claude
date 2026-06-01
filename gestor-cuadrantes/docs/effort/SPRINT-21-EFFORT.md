# Esfuerzo — Sprint 21: Refactorización Day-Loop (Fase 2)

**Período**: 27/05/2026 - 28/05/2026
**Estado**: Completado ✅
**Versión**: 2.1.0
**Rama**: `feature/sprint-21-dayloop-refactor`
**Tipo de sprint**: Deuda técnica (sin cambios funcionales de producto)

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Product Owner / PM (usuario) | Humano | ~1,0 h | Definición de objetivo, criterios de aceptación, validación de cierre de sprint |
| Dev Agent | IA | ~12,5 h equiv. | Análisis de cierres, diseño de DayLoopContext, extracción day-loop.ts, refactor generate.ts/generate-core.ts, JSDoc |
| QA/Testing Agent | IA | ~4,0 h equiv. | 20 tests unitarios DL-01..DL-20, estabilización de 7 casos E2E flakey (2 rondas) |
| Doc Agent | IA | ~1,5 h equiv. | Release notes, REQUIREMENTS, CHANGELOG, informe de estado Sprint 21 |

**Total humano estimado**: ~1,0 h
**Total IA estimado**: ~18,0 h equiv.
**Total sprint estimado**: ~19,0 h

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Resultado |
|-------|-------------|--------|-----------|
| Análisis de cierres internos de `generateMonthSchedule` (`sprint-21-analysis.md`) | Dev | L | ✅ |
| Diagramas de arquitectura day-loop (`sprint-21-architecture.md`) | Dev | M | ✅ |
| Diseño e implementación de `DayLoopContext` en `day-loop-context.ts` | Dev | M | ✅ |
| Extracción del loop día-a-día a `day-loop.ts` | Dev | L | ✅ |
| Extracción de orquestación a `generate-core.ts` y reducción de `generate.ts` a fachada | Dev | M | ✅ |
| Completar JSDoc de módulos `day-loop.ts` y `day-loop-context.ts` | Dev | S | ✅ |
| Tests unitarios DL-01..DL-20 (`day-loop` unit tests, 20 casos nuevos) | QA | M | ✅ |
| Estabilización de E2E flakey: CP-37, CP-68, CP-77, CP-115 (1ª ronda) | QA | M | ✅ |
| Estabilización de E2E flakey: CP-15, CP-38, CP-116 (2ª ronda) | QA | M | ✅ |
| Baseline E2E previo a Sprint 21 (142/142, commit `00e5c68`) | QA | S | ✅ |
| Release notes Sprint 21, actualización REQUIREMENTS y CHANGELOG | Doc | M | ✅ |
| Informe de estado Sprint 21 / planificación Sprint 22 | Doc | S | ✅ |

---

## Commits atómicos del sprint

| Hash | Mensaje |
|------|---------|
| `dcd6224` | `docs: sprint-21 analysis and architecture diagrams` |
| `3ecdf3d` | `feat: DayLoopContext types in day-loop-context.ts` |
| `90feda2` | `refactor: extract day-loop logic to day-loop.ts` |
| `d8fc71b` | `test: day-loop unit tests DL-01 to DL-20` |
| `e629d57` | `test: stabilize flaky E2E cases CP-37 CP-68 CP-77 CP-115` |
| `91fb5d0` | `refactor: extract generate core and reduce generate.ts facade` |
| `74d4423` | `test: harden flaky E2E cases CP-15 CP-38 CP-116` |
| `21d868b` | `docs: complete JSDoc for day-loop modules` |
| `0871c2b` | `docs: sprint-21 release notes, REQUIREMENTS and CHANGELOG` |
| `2f8a7ca` | `docs: add Sprint 21 status report for Sprint 22 planning` |

---

## Interacciones del Project Manager

1. Definición del objetivo: extraer day-loop de `generate.ts` hasta ≤300 líneas.
2. Aprobación del diseño de `DayLoopContext` como contrato explícito de estado.
3. Validación del cierre de sprint con 404/404 unit + 142/142 E2E.

---

## Métricas de salida del sprint

| Métrica | Antes Sprint 21 | Después Sprint 21 |
|---------|-----------------|-------------------|
| Tamaño `lib/schedules/generate.ts` | ~1605 líneas | ~10 líneas (fachada) |
| Módulos especializados en `lib/schedules/` | 8 | 11 (+`generate-core.ts`, `day-loop.ts`, `day-loop-context.ts`) |
| Tests unitarios | 374 | 404 (+30) |
| Tests E2E | 142 | 142 (estabilizados) |
| Casos E2E flakey activos | 7 | 0 |
| Bugs abiertos del sprint | 0 | 0 |

---

## Notas de gestión

- Sprint 21 cierra la segunda fase de modularización. `generate.ts` queda reducida a una fachada de ~10 líneas que delega a `generate-core.ts`.
- Los 7 casos E2E flakey históricos (CP-15, CP-37, CP-38, CP-68, CP-77, CP-115, CP-116) fueron estabilizados sin modificar lógica de negocio.
- No se registraron bugs nuevos en este sprint.
- La deuda técnica remanente (dualidad `generate.ts`/`generate-core.ts`, equidad avanzada del algoritmo) queda documentada en las release notes para Sprint 22+.
