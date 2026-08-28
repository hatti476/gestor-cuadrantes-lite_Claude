# Esfuerzo — Sprint 20: Refactor modular de `generate.ts`

**Período**: 25/05/2026 - 26/05/2026  
**Estado**: Completado ✅  
**Versión**: 2.0  
**Rama**: `feature/sprint-20-algorithm-refactor`  
**Tipo de sprint**: Deuda técnica (sin cambios funcionales de producto)

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Product Owner / PM (usuario) | Humano | ~1,5 h | Definición de objetivo de refactor, validación de cierre de sprint, priorización Sprint 21 |
| Dev Agent | IA | ~14,0 h equiv. | Extracción de 8 módulos, limpieza de imports/exports, resolución de incidencias de integración |
| QA/Testing Agent | IA | ~3,0 h equiv. | Validación de 374 tests unitarios y baseline E2E |
| Doc Agent | IA | ~1,0 h equiv. | Release notes y actualización de requisitos |

**Total humano estimado**: ~1,5 h  
**Total IA estimado**: ~18,0 h equiv.  
**Total sprint estimado**: ~19,5 h

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Resultado |
|------|-------------|--------|-----------|
| Extracción `date-utils.ts` | Dev | S | ✅ |
| Extracción `night-blocks.ts` | Dev | M | ✅ |
| Extracción `rest-rules.ts` | Dev | M | ✅ |
| Extracción `shift-transitions.ts` | Dev | S | ✅ |
| Extracción `coverage.ts` | Dev | S | ✅ |
| Extracción `weekend-packs.ts` | Dev | M | ✅ |
| Extracción `workday-shifts.ts` | Dev | S | ✅ |
| Extracción `cross-month.ts` | Dev | M | ✅ |
| Limpieza final `generate.ts` (imports/exports y orquestación) | Dev | M | ✅ |
| Tests unitarios de módulos extraídos (4 ficheros nuevos) | QA/Dev | M | ✅ |
| Corrección BUG-38 (imports incompletos) | Dev | S | ✅ |
| Corrección BUG-39 (dependencia circular de tipos) | Dev | S | ✅ |
| Consolidación documental de sprint | Doc | S | ✅ |

---

## Métricas de salida del sprint

| Métrica | Antes Sprint 20 | Después Sprint 20 |
|--------|------------------|-------------------|
| Tamaño `lib/schedules/generate.ts` | ~2350 líneas | ~1605 líneas |
| Módulos especializados en `lib/schedules/` | 0 (monolito principal) | 8 nuevos módulos |
| Tests unitarios | 296 | 374 |
| Bugs abiertos del sprint | 2 detectados | 0 abiertos |

---

## Notas de gestión

- Sprint 20 se cerró como refactor puro: no se introdujeron requisitos funcionales nuevos.
- Se deja explícitamente preparada la fase 2 de modularización en Sprint 21 (`day-loop.ts`).
- La deuda técnica remanente principal sigue concentrada en el bucle día-a-día de `generateMonthSchedule`.
