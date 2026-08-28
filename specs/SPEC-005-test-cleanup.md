# SPEC-005 — Limpieza y Actualización de la Suite de Tests Post-Sprint 1

## Metadatos

| Campo | Valor |
|-------|-------|
| ID | SPEC-005 |
| Tipo | test |
| Estado | ready |
| Prioridad | media |
| Agentes asignados | @orchestrator, @qa, @devlead |
| Fecha de creación | 2026-08-27 |
| Sprint | Sprint-01 |

---

## Descripción

Auditar los 404 tests unitarios y 142 E2E heredados. Eliminar los que cubren funcionalidad eliminada (proyectos, roles antiguos). Actualizar los que referencian roles o modelos del sistema anterior. Dejar la suite coherente con el nuevo sistema `ADMIN | TECNICO | VIEWER` sin proyectos.

---

## Contexto y antecedentes

El Sprint 1 elimina `Project`, `ProjectMember`, `projectId` y los roles `SUPER_ADMIN`, `SUPER_VIEWER`, `USER`, `PROJECT_ADMIN`, `EMPLOYEE`. La suite de tests heredada contiene tests para toda esa funcionalidad que ya no existe.

---

## Historia de usuario

Como **QA Lead**,
quiero **una suite de tests limpia y alineada con el código actual**,
para **evitar falsos positivos/negativos y mantener confianza en CI**.

---

## Criterios de aceptación

- [ ] AC-01: `tests/unit/` auditado — eliminados tests referenciando `Project`, `ProjectMember`, `projectId`, `SUPER_ADMIN`, `SUPER_VIEWER`, `PROJECT_ADMIN`, `USER` (rol), `EMPLOYEE` (rol)
- [ ] AC-02: `tests/e2e/` auditado — eliminados specs que ejerciten `/projects`, `ProjectSelector`, flujos multi-proyecto o roles eliminados
- [ ] AC-03: Tests que cubren lógica vigente con nombres de rol distintos → actualizados (no borrados)
- [ ] AC-04: `tests/e2e/known-failures.md` revisado — actualizado si alguno de los 14 known failures queda resuelto por los cambios del sprint
- [ ] AC-05: Documentación en commit message de cada test eliminado: qué cubría y por qué se elimina
- [ ] AC-06: @devlead revisa que no se eliminó cobertura de lógica de negocio válida
- [ ] AC-07: **Nuevos tests añadidos en SPEC-002, SPEC-003, SPEC-004 están pasando**
- [ ] AC-08: Estimación post-limpieza:
  - Unit: ≥ 389 tests (baseline 404 - ~45 eliminados + ~30 nuevos)
  - E2E: ≥ 122 tests (baseline 142 - ~40 eliminados + ~20 nuevos)
  - Smoke: ≥ 19 tests (baseline 18 - ~2 eliminados + ~3 nuevos)
- [ ] AC-09: `npm run test:unit` — todos passing
- [ ] AC-10: `npm run test:e2e` — todos passing
- [ ] AC-11: `npm run test:e2e:smoke` — todos passing
- [ ] AC-11: `npm run ci:check` — 0 errores

---

## Referencias visuales

N/A — limpieza de tests.

---

## Flujo del usuario

1. Buscar en `tests/unit/` referencias a: `Project`, `ProjectMember`, `projectId`, `SUPER_ADMIN`, `SUPER_VIEWER`, `USER` (como rol), `PROJECT_ADMIN`, `EMPLOYEE` (como rol)
2. Buscar en `tests/e2e/` specs que usen `/projects`, `ProjectSelector`, multi-proyecto, roles eliminados
3. Para cada match: decidir eliminar (funcionalidad muerta) o actualizar (lógica viva, rol renombrado)
4. Revisar `tests/e2e/known-failures.md` — actualizar o eliminar entradas resueltas
5. Verificar nuevos tests de SPEC-002/003/004 pasan
6. Ejecutar suite completa y confirmar mínimos de AC-08
7. Commit con mensaje documentando eliminaciones

---

## Fuera de scope

- No añadir tests de nueva funcionalidad más allá de los definidos en SPEC-002/003/004
- No modificar código de aplicación

---

## Notas técnicas para los agentes

- Módulo probable: `tests/unit/`, `tests/e2e/`, `tests/e2e/known-failures.md`
- Dependencias externas: Vitest, Playwright
- Riesgo de regresión: **medio** — eliminar tests válidos reduce cobertura; no actualizar tests deja falsos positivos

---

## Casos de test sugeridos

- Test unitario: Validar que los tests nuevos de SPEC-002/003/004 pasan
- Test E2E: Validar que los tests @smoke nuevos pasan
- Test @smoke: Suite completa de smoke en verde

---

## Historial de cambios

| Fecha | Autor | Cambio |
|-------|-------|--------|
| 2026-08-27 | @orchestrator | Creación de la spec |