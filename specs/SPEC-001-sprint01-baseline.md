# SPEC-001 — Sprint 1 Baseline y Preparación

## Metadatos

| Campo | Valor |
|-------|-------|
| ID | SPEC-001 |
| Tipo | chore |
| Estado | done |
| Prioridad | alta |
| Agentes asignados | @orchestrator, @qa |
| Fecha de creación | 2026-08-27 |
| Sprint | Sprint-01 |

---

## Descripción

Establecer el baseline de tests y calidad de código antes de iniciar el Sprint 1 (simplificación de roles y eliminación de multi-proyecto). Documentar el estado actual para poder medir regresiones.

---

## Contexto y antecedentes

El Sprint 1 elimina la capa multi-proyecto (`Project`, `ProjectMember`) y simplifica el sistema de roles a tres niveles planos (`ADMIN`, `TECNICO`, `VIEWER`). Antes de tocar código, se debe ejecutar la suite completa y anotar el baseline real.

---

## Historia de usuario

Como **equipo de desarrollo**,
quiero **un baseline documentado y verificado**,
para **detectar regresiones durante el sprint y tener punto de partida limpio**.

---

## Criterios de aceptación

- [x] AC-01: `npm run test:unit` ejecutado — **439 passing, 2 failing** (baseline real: 439/441, no 404 como heredado)
- [x] AC-02: `npm run test:e2e` intentado — **bloqueado por webServer timeout** (next dev -p 3001 supera 60s)
- [x] AC-03: `npm run test:e2e:smoke` intentado — **bloqueado por webServer timeout**
- [x] AC-04: `npm run ci:check` ejecutado — **9 errores ESLint, 6 warnings** (no clean)
- [x] AC-05: Fallos pre-existentes documentados en `tests/e2e/known-failures.md` (añadidos CP-163, CP-164, CP-165)
- [x] AC-06: Commit vacío de baseline creado: `chore: baseline sprint-01 — 439 unit (2 fail) / E2E blocked by webServer timeout / 18 smoke blocked / ci:check 9 errors 6 warnings`

---

## Referencias visuales

N/A — tarea de infraestructura.

---

## Flujo del usuario

1. Ejecutar `npm run test:unit` y anotar resultado
2. Ejecutar `npm run test:e2e` y anotar resultado
3. Ejecutar `npm run test:e2e:smoke` y anotar resultado
4. Ejecutar `npm run ci:check` y verificar 0 errores
5. Si hay fallos, documentar en `tests/e2e/known-failures.md`
6. Crear commit vacío de baseline

---

## Fuera de scope

- No modificar código de aplicación
- No crear migraciones de BD
- No tocar permisos ni UI

---

## Notas técnicas para los agentes

- Módulo afectado: `tests/` (ejecución), `package.json` (scripts)
- Dependencias externas: ninguna
- Riesgo de regresión: **bajo** — solo lectura y documentación

---

## Casos de test sugeridos

- Test unitario: N/A (solo ejecución de suite existente)
- Test E2E: N/A (solo ejecución de suite existente)
- Test @smoke: Verificar que los 18 tests @smoke actuales pasan

---

## Historial de cambios

| Fecha | Autor | Cambio |
|-------|-------|--------|
| 2026-08-27 | @orchestrator | Creación de la spec |
| 2026-08-27 | @qa | Ejecución baseline real: 439 unit (2 fail), E2E/smoke blocked by webServer timeout, ci:check 9 errors 6 warnings. Documentados CP-163, CP-164, CP-165 en known-failures.md |