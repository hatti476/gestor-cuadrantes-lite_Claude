# Esfuerzo — Sprint 25: Bugs de permisos, mejoras multi-mes y proceso de agentes

**Periodo**: 05/06/2026 - 08/06/2026  
**Estado**: Cerrado ✅  
**Versión**: 2.5.0  
**Rama**: `feature/sprint-24-scheduling-fixes`  
**Tipo de sprint**: Corrección de bugs críticos de permisos + mejoras UI + refuerzo de proceso

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Product Owner / PM (usuario) | Humano | ~1,5 h | Detección de BUG-53/54/55 en QA manual, revisión de flujo de agentes, confirmación de scope |
| Dev Agent | IA | ~6,0 h equiv. | BUG-53, BUG-54, BUG-55 (análisis + fix + test), features multi-mes, tests E2E |
| Doc Agent | IA | ~2,0 h equiv. | Release notes, effort, BUG-REGISTRY, informe de estado, mejoras de agentes |

**Total humano estimado**: ~1,5 h  
**Total IA estimado**: ~8,0 h equiv.  
**Total sprint estimado**: ~9,5 h

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Resultado |
|-------|-------------|--------|-----------|
| Análisis root cause BUG-53 (EMPLOYEE 403 en employees/holidays) | Dev | S | ✅ |
| Fix BUG-53: permisos en /api/employees y /api/holidays | Dev | S | ✅ |
| Test E2E CP-158: EMPLOYEE accede a multi-month | Dev | S | ✅ |
| Análisis root cause BUG-54 (stale closure, proyecto se resetea) | Dev | M | ✅ |
| Fix BUG-54: leer localStorage en .then() en vez del closure | Dev | S | ✅ |
| Test E2E CP-159: proyecto seleccionado se mantiene tras navegación | Dev | M | ✅ |
| Feature: fila propia resaltada en vista multi-mes | Dev | S | ✅ |
| Test E2E CP-160: fila propia con ring indigo en multi-month | Dev | S | ✅ |
| Feature: festivos en rojo en vista multi-mes | Dev | S | ✅ |
| Test E2E CP-161: festivos con bg-red-200 en cabecera | Dev | S | ✅ |
| Análisis root cause BUG-55 (PROJECT_ADMIN sin PrepPanel) | Dev | S | ✅ |
| Fix BUG-55: isAdmin → canEdit en condicional PrepPanel | Dev | XS | ✅ |
| Test E2E CP-162: PROJECT_ADMIN ve prep-panel y btn-generate | Dev | S | ✅ |
| Mejoras orchestrator: smoke por tarea, review-safe obligatorio | Doc | M | ✅ |
| Mejoras sprint-planner: CP-XX antes de implementar | Doc | S | ✅ |
| Mejoras qa-tester: matriz de roles, known-failures | Doc | S | ✅ |
| Mejoras pre-merge-review: known-failures como criterio de merge | Doc | S | ✅ |
| Crear known-failures.md con 14 fallos pre-existentes | Doc | M | ✅ |
| BUG-REGISTRY: BUG-53, BUG-54, BUG-55 | Doc | S | ✅ |
| Docs: release-notes, effort, informe de estado, CHANGELOG | Doc | M | ✅ |

---

## Commits atómicos del sprint

| Hash | Mensaje |
|------|---------|
| `8cf8803` | feat(sprint-25): BUG-53, BUG-54, own-row highlight, holidays in multi-month |
| `9c03938` | fix(sprint-25): BUG-55 PROJECT_ADMIN no ve PrepPanel + mejoras de agentes QA |
| `083efc1` | chore: mejoras de flujo de trabajo — smoke por tarea, CP-XX previos, known-failures |

---

## Métricas de salida

| Métrica | Valor |
|---------|-------|
| Bugs corregidos | 3 (BUG-53, BUG-54, BUG-55) |
| Features añadidas | 2 (fila propia + festivos en multi-mes) |
| Tests E2E añadidos | 5 (CP-158..CP-162) |
| Tests E2E totales | 127 passing, 14 failing pre-existentes |
| Errores TypeScript | 0 |
| Agentes actualizados | 5 (orchestrator, sprint-planner, qa-tester, review-safe, pre-merge-review) |
| Ficheros nuevos | 2 (known-failures.md, sprint-25-release-notes.md) |

---

## Notas de gestión

- La rama `feature/sprint-24-scheduling-fixes` acumula Sprint 24 + Sprint 25. En el siguiente sprint se creará rama propia desde `main` tras el merge de esta PR.
- Los 14 fallos pre-existentes están documentados en `tests/e2e/known-failures.md` y verificados mediante `git stash` comparativo.
- BUG-55 se detectó en prueba manual del usuario, no en QA automatizado. Las mejoras de flujo de agentes implementadas en este sprint están diseñadas para que este tipo de bug (permisos de UI por rol) se detecte automáticamente en sprints futuros.
