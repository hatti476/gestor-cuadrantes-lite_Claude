# Known E2E Test Failures

Fichero de fallos pre-existentes del suite Playwright.
Mantenido por `qa-tester` al cierre de cada sprint.

**Regla**: si un test falla y NO está en esta lista → es una regresión. STOP.
**Regla**: si un test que está aquí empieza a pasar → eliminarlo de la lista y documentarlo
en las release notes del sprint como "bug corregido".

---

## Fallos pre-existentes activos

Confirmados como pre-existentes mediante `git stash` en Sprint 25 (2026-06-05).

| ID | Descripción | Sprint detectado | Causa conocida |
|----|-------------|-----------------|----------------|
| CP-12 | Grid no muestra empleados en estado inicial | Sprint 2 | Seed de test no tiene empleados en el proyecto del test |
| CP-13 | Texto de estado vacío incorrecto | Sprint 2 | Mensaje hardcodeado no coincide con el esperado en el test |
| CP-33 | CSV download timeout | Sprint 4 | Timeout de descarga demasiado corto para el entorno CI |
| CP-75 | TECH user ve mensaje "no publicado" en lugar del grid | Sprint 10 | Seed de test no tiene cuadrante publicado para EMPLOYEE |
| CP-89 | Own-row highlight en schedule-grid no encontrada | Sprint 12 | Usuario admin no tiene registro de empleado; `emp.userId` no coincide |
| CP-91 | Auto-load holidays botón — comportamiento incorrecto | Sprint 13 | Comportamiento del botón cambió en sprint posterior |
| CP-92 | Auto-load holidays — validación de duplicados | Sprint 13 | Race condition con otros tests que crean festivos |
| CP-93 | Auto-load holidays — feedback de toast | Sprint 13 | Toast desaparece antes de que el test lo detecte |
| CP-94 | Auto-load holidays — recarga del grid | Sprint 13 | Timing de recarga variable |
| CP-109 | PrepPanel B toggle no encontrado | Sprint 16 | data-testid del toggle cambiado en refactor posterior |
| CP-124 | Botón undo generation no encontrado | Sprint 18 | Funcionalidad eliminada o renombrada en sprint posterior |
| CP-139 | SUPER_VIEWER grid no visible | Sprint 19 | Cuadrante no publicado en seed; SUPER_VIEWER requiere publicado |
| CP-164 | E2E webServer timeout: `next dev -p 3001` supera 60s en entorno local | Sprint 0 (baseline) | Infraestructura de tests; requiere servidor ya corriendo o timeout mayor |
| CP-165 | ci:check: 9 ESLint errors (react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any) + 6 warnings | Sprint 0 (baseline) | Código pre-existente no cumple reglas actuales de lint |

**Total pre-existentes**: 14  
**Última verificación**: Sprint 0 baseline (2026-08-27)  
**Método de verificación**: Ejecución directa `npm run test:unit`, `npm run test:e2e`, `npm run ci:check`

---

## Historial de fallos corregidos

| ID | Descripción | Sprint corregido | Commit |
|----|-------------|-----------------|--------|
| BUG-53 / CP-158 | EMPLOYEE recibía 403 en `/api/employees` y `/api/holidays` | Sprint 25 | `8cf8803` |
| BUG-54 / CP-159 | Stale closure reseteaba proyecto activo al primer proyecto | Sprint 25 | `8cf8803` |
| BUG-55 / CP-162 | PROJECT_ADMIN no veía PrepPanel (Generar, Vacaciones...) | Sprint 25 | `9c03938` |
| CP-149 | data-testid 'rates-legend' incorrecto + positional check frágil (flex-wrap) | Sprint 26 | `sprint-26` |
| CP-154 | Alineación pixel-level frágil con flex-wrap en viewport estrecho | Sprint 26 | `sprint-26` |
| CP-140 | Promise.race resolvía con unpublished-message transitorio antes de networkidle | Sprint 26 | `sprint-26` |
| CP-163 | Unit tests: 2 fallos pre-existentes en generate.test.ts (RF-16 weekend coverage + cross-month night block uniqueness) | fix/ci-seed-and-cp163 | Fixtures desactualizados: RF-16 exigía 5 turnos T consecutivos que disparaban el descanso forzoso obligatorio (BUG-44) dejando el fin de semana sin cobertura; el test de bloque nocturno cross-month usaba `emp-1` con un histórico que la rotación determinista (4 empleados) nunca produce — el empleado real cuyo bloque cruza mayo/junio es `emp-2` (3 noches finales + 4 de continuación). Se corrigieron los fixtures para reflejar el motor actual, sin cambios en el motor. |
