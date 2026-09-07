# Esfuerzo — Sprint 26: Bugs algorítmicos de turno semanal, mejoras visuales y refactor de tipos

**Periodo**: 18/06/2026 - 19/06/2026  
**Estado**: Cerrado ✅  
**Versión**: 2.6.0  
**Rama**: `feature/sprint-26-scheduling-fixes`  
**Tipo de sprint**: Corrección de bugs críticos de algoritmo + mejoras UI + refactorización de tipos

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Product Owner / PM (usuario) | Humano | ~1,0 h | Detección síntomas BUG-56/57/58, revisión de cambios visuales, confirmación de scope |
| Dev Agent | IA | ~5,0 h equiv. | BUG-56/57/58 (análisis + fix + 14 unit tests), CHG-01/02, fix tests CP-140/149/154, refactor tipos |
| Doc Agent | IA | ~1,5 h equiv. | Release notes, effort, BUG-REGISTRY, context.md |

**Total humano estimado**: ~1,0 h  
**Total IA estimado**: ~6,5 h equiv.  
**Total sprint estimado**: ~7,5 h

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Resultado |
|-------|-------------|--------|-----------|
| Análisis root cause BUG-56 (weeklyShift paths) | Dev | M | ✅ |
| Fix BUG-56: registrar weekShift en todos los caminos | Dev | M | ✅ |
| Fix BUG-57: urgentT priority antes de weekly-consistency guard | Dev | S | ✅ |
| Fix BUG-58: días D aislados (consecuencia BUG-56) | Dev | XS | ✅ |
| Tests unitarios CP-163..CP-166 (14 tests) | Dev | M | ✅ |
| CHG-01: weekend shading más intenso (vista mensual + multi-mes) | Dev | S | ✅ |
| CHG-02: separador de mes más grueso en multi-mes | Dev | XS | ✅ |
| Tests E2E CP-167..CP-170 | Dev | S | ✅ |
| Fix test CP-140 (Promise.race inestable) | Dev | S | ✅ |
| Fix tests CP-149 + CP-154 (data-testid + posición) | Dev | S | ✅ |
| Refactor: consolidar ScheduleEmployee en types.ts | Dev | S | ✅ |
| Fix tsc errors (3 errores) tras refactor | Dev | S | ✅ |
| Release notes + effort + BUG-REGISTRY | Doc | M | ✅ |
