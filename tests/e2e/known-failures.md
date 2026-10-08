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
| CP-172 | 10 tests E2E fallan (`admin-users.spec.ts`, `multi-month.spec.ts`, `sprint-19.spec.ts`, `sprint-24.spec.ts`) | Sprint 1 (post-refactor) | Confirmado en CI real tras corregir CP-171 (run 37751532946, 2026-10-08): con el login arreglado, 24/37 pasan y exactamente estos 10 fallan — mismo patrón ya detectado en local. Apunta a condiciones de carrera por estado compartido: varios specs llaman a `generateScheduleAndWait` o mutan la lista de usuarios contra la misma BD/servidor, incluso con `workers:1` (serializar no fue suficiente, descarta la hipótesis de que `workers:2` era la causa). `sprint-24.spec.ts` conserva títulos de la era multi-proyecto ("proyecto activo") que SPEC-005 no limpió. Pendiente de investigación — fuera de scope de SPEC-007/SPEC-008. |

**Total pre-existentes**: 3
**Última verificación**: Sprint 3 (2026-10-08) — CI real (PR #32, run 37751532946): CP-171 confirmado corregido (login funciona, 24/37 pasan); CP-172 reconfirmado activo (10/37 fallan, los mismos de siempre).
**Método de verificación**: Ejecución directa `npm run test:unit`, `npm run test:e2e`, `npm run ci:check`, y runs reales de `e2e-smoke.yml` en GitHub Actions

---

## Historial de fallos corregidos

| ID | Descripción | Sprint corregido | Commit |
|----|-------------|-----------------|--------|
| CP-163 | Unit tests: 2 fallos pre-existentes en generate.test.ts (RF-16 weekend coverage + cross-month night block uniqueness) | fix/ci-seed-and-cp163 | Fixtures desactualizados: RF-16 exigía 5 turnos T consecutivos que disparaban el descanso forzoso obligatorio (BUG-44) dejando el fin de semana sin cobertura; el test de bloque nocturno cross-month usaba `emp-1` con un histórico que la rotación determinista (4 empleados) nunca produce — el empleado real cuyo bloque cruza mayo/junio es `emp-2` (3 noches finales + 4 de continuación). Se corrigieron los fixtures para reflejar el motor actual, sin cambios en el motor. |
| CP-171 | CI "E2E smoke suite": los 30 tests fallaban con el mismo timeout en el login (`page.waitForURL`, helpers.ts:40) | Sprint 3 (6cd3dbf) | El servidor respondía bien; `tests/e2e/config.ts` leía `ADMIN_EMAIL`/`TECH_EMAIL`/etc. de `.env.test`, fichero gitignored inexistente en CI, enviando login con credenciales vacías. Fix: las 6 env vars añadidas al bloque `env:` de `e2e-smoke.yml`/`e2e-nightly.yml`. Confirmado en CI real (run 37751532946, 2026-10-08): login funciona, 24/37 pasan; los 10 restantes son CP-172 (ya documentado, sin relación). |
