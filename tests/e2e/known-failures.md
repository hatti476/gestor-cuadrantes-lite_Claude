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
| CP-171 | CI "E2E smoke suite": los 30 tests fallan con el mismo timeout en el login (`page.waitForURL`, helpers.ts:40) | Sprint 1 (post-refactor) | **Reabierto tras fix parcial.** El fix de levantar un único servidor (eliminar el `next dev -p 3001` duplicado) está validado y es necesario, pero NO fue suficiente: el PR #32 volvió a fallar los 30 tests en CI con un único servidor. Traza de Playwright muestra el click en "Entrar" completándose al instante, sin ninguna petición POST a `/api/auth/callback/credentials` registrada, y timeout de 30s esperando navegación — y el mismo bloqueo persiste durante los 25 min siguientes del job (no es lentitud puntual, el proceso Next.js queda atascado). Hipótesis: `bcrypt.compare` (bcryptjs, implementación pura en JS, coste 12, en `app/api/auth/[...nextauth]/route.ts`) compite por las 2 vCPUs compartidas del runner de GitHub contra 2 Chromium headless simultáneos (`workers:2`). Mitigación aplicada: `workers:1` en `playwright.ci.config.ts` + `timeout:45_000` — pendiente de verificación en el siguiente run de CI. NO bajar el coste de bcrypt (regresión de seguridad). |
| CP-172 | 10 tests E2E fallan en paralelo (`admin-users.spec.ts`, `multi-month.spec.ts`, `sprint-19.spec.ts`, `sprint-24.spec.ts`) al correr contra el servidor único con `workers:2` | Sprint 1 (post-refactor) | Detectado en una ejecución local donde el login SÍ funcionaba (hardware sin la contención de CP-171). Patrón apunta a condiciones de carrera por estado compartido: varios specs llaman a `generateScheduleAndWait` o mutan la lista de usuarios en paralelo contra la misma BD/servidor. `sprint-24.spec.ts` conserva títulos de la era multi-proyecto ("proyecto activo") que SPEC-005 no limpió. Pendiente de investigación — el cambio a `workers:1` (ver CP-171) probablemente lo mitigue también al serializar el acceso al estado compartido. |

**Total pre-existentes**: 4
**Última verificación**: Sprint 1 (2026-10-06) — CI real (PR #32, run 37478279864): 30/30 fallan con `workers:2` sobre servidor único. Pendiente re-verificación con `workers:1`.
**Método de verificación**: Ejecución directa `npm run test:unit`, `npm run test:e2e`, `npm run ci:check`, y runs reales de `e2e-smoke.yml` en GitHub Actions

---

## Historial de fallos corregidos

| ID | Descripción | Sprint corregido | Commit |
|----|-------------|-----------------|--------|
| CP-163 | Unit tests: 2 fallos pre-existentes en generate.test.ts (RF-16 weekend coverage + cross-month night block uniqueness) | fix/ci-seed-and-cp163 | Fixtures desactualizados: RF-16 exigía 5 turnos T consecutivos que disparaban el descanso forzoso obligatorio (BUG-44) dejando el fin de semana sin cobertura; el test de bloque nocturno cross-month usaba `emp-1` con un histórico que la rotación determinista (4 empleados) nunca produce — el empleado real cuyo bloque cruza mayo/junio es `emp-2` (3 noches finales + 4 de continuación). Se corrigieron los fixtures para reflejar el motor actual, sin cambios en el motor. |
