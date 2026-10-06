# Known E2E Test Failures

Fichero de fallos pre-existentes del suite Playwright.
Mantenido por `qa-tester` al cierre de cada sprint.

**Regla**: si un test falla y NO está en esta lista → es una regresión. STOP.
**Regla**: si un test que está aquí empieza a pasar → eliminarlo de la lista y documentarlo
en las release notes del sprint como "bug corregido".

El histórico de fallos del ciclo anterior (pre-`baseline sprint-01`) está archivado en
[`docs/_archive/ciclo-1/known-failures-ciclo-1.md`](../../docs/_archive/ciclo-1/known-failures-ciclo-1.md).

---

## Fallos pre-existentes activos

| ID | Descripción | Sprint detectado | Causa conocida |
|----|-------------|-----------------|----------------|
| CP-164 | E2E webServer timeout: `next dev -p 3001` supera 60s en entorno local | Sprint 0 (baseline) | Infraestructura de tests; requiere servidor ya corriendo o timeout mayor |
| CP-165 | ci:check: 9 ESLint errors (react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any) + 6 warnings | Sprint 0 (baseline) | Código pre-existente no cumple reglas actuales de lint |
| CP-172 | 10 tests E2E fallan en paralelo (`admin-users.spec.ts`, `multi-month.spec.ts`, `sprint-19.spec.ts`, `sprint-24.spec.ts`) al correr contra el servidor único de CI tras el fix de CP-171 | Sprint 1 (post-refactor) | Enmascarado hasta ahora por CP-171 (todos los tests fallaban antes de llegar a estas aserciones). Patrón apunta a condiciones de carrera por estado compartido: `workers:2` + una sola BD/servidor, varios specs llaman a `generateScheduleAndWait` o mutan la lista de usuarios en paralelo. `sprint-24.spec.ts` conserva títulos de la era multi-proyecto ("proyecto activo") que SPEC-005 no limpió. Pendiente de investigación — candidato a `workers:1` en CI o aislar estado por test. |

**Total pre-existentes**: 3
**Última verificación**: Sprint 1 (2026-10-06) — `npx playwright test --config=playwright.ci.config.ts --grep @smoke` contra servidor único en :3000/3002 con BD migrada vía `migrate deploy`
**Método de verificación**: Ejecución directa `npm run test:unit`, `npm run test:e2e`, `npm run ci:check`

---

## Historial de fallos corregidos

| ID | Descripción | Sprint corregido | Commit |
|----|-------------|-----------------|--------|
| CP-171 | CI "E2E smoke suite": los 30 tests fallaban con el mismo timeout en el login (`page.waitForURL`, helpers.ts:40) por agotamiento de recursos — Playwright levantaba su propio `next dev -p 3001` además del servidor ya construido en :3000 | Sprint 1 (post-refactor) | Fix de raíz: nuevo `playwright.ci.config.ts` sin `webServer` propio, `baseURL` apuntando al servidor ya arrancado en :3000, y `E2E_DATABASE_URL` fijado para que `globalSetup` trunque/resiembre esa misma BD en vez de borrar el fichero. El paso "Seed test database" de `e2e-smoke.yml`/`e2e-nightly.yml` pasa de `prisma db push` a `prisma migrate deploy` para que el `migrate deploy` posterior de `globalSetup` sea idempotente (evita P3005 "schema not empty"). Validado en local: el login deja de fallar uniformemente (24/34 tests pasan; los 10 restantes son el nuevo CP-172, no timeouts de login). |
| CP-163 | Unit tests: 2 fallos pre-existentes en generate.test.ts (RF-16 weekend coverage + cross-month night block uniqueness) | fix/ci-seed-and-cp163 | Fixtures desactualizados: RF-16 exigía 5 turnos T consecutivos que disparaban el descanso forzoso obligatorio (BUG-44) dejando el fin de semana sin cobertura; el test de bloque nocturno cross-month usaba `emp-1` con un histórico que la rotación determinista (4 empleados) nunca produce — el empleado real cuyo bloque cruza mayo/junio es `emp-2` (3 noches finales + 4 de continuación). Se corrigieron los fixtures para reflejar el motor actual, sin cambios en el motor. |
