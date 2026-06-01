# Esfuerzo — Sprint 23: Publicacion de cuadrantes y estabilizacion E2E

**Periodo**: 29/05/2026 - 01/06/2026  
**Estado**: Completado ✅  
**Version**: 2.3.0  
**Rama**: feature/sprint-23-bugs-publish  
**Tipo de sprint**: Feature funcional + correcciones de calidad

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Product Owner / PM (usuario) | Humano | ~1,5 h | Definicion de criterios de cierre, priorizacion de tareas y validacion final |
| Dev Agent | IA | ~16,0 h equiv. | TASK-01, TASK-02, TASK-04 (schema, API, permisos, UI) y correcciones de regresion |
| QA/Testing Agent | IA | ~6,0 h equiv. | Baseline, unit tests, smoke, estabilizacion CP-146 y validaciones finales |
| Doc Agent | IA | ~2,5 h equiv. | REQUIREMENTS, CHANGELOG, release notes, analysis y sync de contexto |

**Total humano estimado**: ~1,5 h  
**Total IA estimado**: ~24,5 h equiv.  
**Total sprint estimado**: ~26,0 h

---

## Detalle de tareas

| Tarea | Responsable | Tamano | Resultado |
|-------|-------------|--------|-----------|
| Baseline inicial (tests y rama de trabajo) | QA/Dev | S | ✅ |
| TASK-01: fix integridad de bloque nocturno para rotacion de 7 tecnicos | Dev | M | ✅ |
| TASK-02: fix layout del grid en pantallas ultrawide | Dev | S | ✅ |
| TASK-03: verificacion de cierre como efecto de TASK-01 | Dev/QA | S | ✅ |
| TASK-04a: cambios de schema y migracion de Schedule (published, publishedAt, publishedBy) | Dev | M | ✅ |
| TASK-04b: helper de permisos canPublishSchedule() | Dev | S | ✅ |
| TASK-04c: endpoint PATCH /api/schedules/publish | Dev | M | ✅ |
| TASK-04d: gating de publicacion en GET /api/schedules + upsert en generate | Dev | M | ✅ |
| TASK-04e: UI de publicacion en home (badge, boton, estado unpublished) | Dev | M | ✅ |
| TASK-04f: pruebas unitarias y E2E (CP-143..CP-146) | QA/Dev | M | ✅ |
| Estabilizacion smoke (CP-146) y limpieza de artefactos de test | QA | M | ✅ |
| Validacion final (ci:check, build, unit, smoke) | QA | M | ✅ |
| Documentacion de cierre (REQUIREMENTS, CHANGELOG, release notes, analysis) | Doc | M | ✅ |
| Merge y push a main | Dev | S | ✅ |

---

## Commits atomicos del sprint

| Hash | Mensaje |
|------|---------|
| b6a61d3 | feat(schedule): add publication fields to Schedule model |
| ccadf74 | feat(auth): add canPublishSchedule permission helper |
| bc6b833 | feat(api): add PATCH /api/schedules/publish endpoint |
| cbb2376 | feat(api): implement publication gating in /api/schedules |
| 984cdb8 | feat(ui): add publication support components |
| a52d23c | feat(ui): add publication toggle UI to main schedule page |
| c1f626b | test: add Sprint 23 publication coverage and fix E2E smoke regressions |
| 933bff9 | docs: add Sprint 23 publication requirements and release notes |
| 1feeec6 | docs: Sprint 23 closure - release notes, analysis, and context sync |

---

## Metricas de salida del sprint

| Metrica | Resultado |
|---------|-----------|
| Unit tests | 419/419 ✅ |
| E2E smoke | 22/22 ✅ |
| Build produccion | ✅ |
| CI checks (tsc + eslint) | ✅ |
| RF-20.1..20.8 | ✅ Implementado |
| Endpoint publish | ✅ Activo |
| Gating read-only en meses no publicados | ✅ Activo |
| Estado final | ✅ Merged to main |

---

## Notas de gestion

- El principal sobrecoste se concentro en la estabilizacion de CP-146 por dependencia de estado entre tests smoke.
- La funcionalidad de publicacion queda cerrada de extremo a extremo (schema, permisos, API, UI, tests y docs).
- Sprint 23 termina con validacion completa en local y merge en main sin regresiones abiertas.
