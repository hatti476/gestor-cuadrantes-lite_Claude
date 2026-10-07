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
| CP-171 | CI "E2E smoke suite": los 30 tests fallan con el mismo timeout en el login (`page.waitForURL`, helpers.ts:40) | Sprint 1 (post-refactor) | **Tres hipótesis exploradas.** (1) Servidor duplicado (`next dev -p 3001`): corregido, necesario pero no suficiente. (2) Contención de CPU bcrypt vs. `workers:2`: **descartada** — con `workers:1` falla igual. (3) Con `next-server.log` capturado se ve `[auth] Usuario encontrado: ninguno` — el login SÍ llega al servidor y SÍ ejecuta la query, pero no encuentra al usuario `admin@cuadrantes.local` que el seed acababa de crear con éxito, y es la ÚNICA línea `[auth]` en todo el log de 48 min (ningún intento posterior, de los ~90 restantes, llega siquiera a esa línea). Apunta a resolución de ruta relativa inconsistente para `DATABASE_URL=file:./test.db` entre procesos distintos (CLI de `prisma migrate deploy`, el script de seed, el cliente Prisma en tiempo de ejecución dentro de `next start`, y los dos clientes Prisma de `globalSetup`) — cada uno podría resolver `./test.db` relativo a un `cwd`/ubicación distinta y acabar tocando ficheros SQLite diferentes aunque todos reporten éxito. Mitigación en verificación: `DATABASE_URL` absoluto (`file:${{ github.workspace }}/prisma/test.db`) en ambos workflows, eliminando toda ambigüedad de resolución relativa. |
| CP-172 | 10 tests E2E fallan en paralelo (`admin-users.spec.ts`, `multi-month.spec.ts`, `sprint-19.spec.ts`, `sprint-24.spec.ts`) al correr contra el servidor único con `workers:2` | Sprint 1 (post-refactor) | Detectado en una ejecución local donde el login SÍ funcionaba (hardware sin la contención de CP-171). Patrón apunta a condiciones de carrera por estado compartido: varios specs llaman a `generateScheduleAndWait` o mutan la lista de usuarios en paralelo contra la misma BD/servidor. `sprint-24.spec.ts` conserva títulos de la era multi-proyecto ("proyecto activo") que SPEC-005 no limpió. Pendiente de investigación — el cambio a `workers:1` (ver CP-171) probablemente lo mitigue también al serializar el acceso al estado compartido. |

**Total pre-existentes**: 4
**Última verificación**: Sprint 1 (2026-10-06) — CI real (PR #32, run 37478279864): 30/30 fallan con `workers:2` sobre servidor único. Pendiente re-verificación con `workers:1`.
**Método de verificación**: Ejecución directa `npm run test:unit`, `npm run test:e2e`, `npm run ci:check`, y runs reales de `e2e-smoke.yml` en GitHub Actions

---

## Historial de fallos corregidos

| ID | Descripción | Sprint corregido | Commit |
|----|-------------|-----------------|--------|
| CP-163 | Unit tests: 2 fallos pre-existentes en generate.test.ts (RF-16 weekend coverage + cross-month night block uniqueness) | fix/ci-seed-and-cp163 | Fixtures desactualizados: RF-16 exigía 5 turnos T consecutivos que disparaban el descanso forzoso obligatorio (BUG-44) dejando el fin de semana sin cobertura; el test de bloque nocturno cross-month usaba `emp-1` con un histórico que la rotación determinista (4 empleados) nunca produce — el empleado real cuyo bloque cruza mayo/junio es `emp-2` (3 noches finales + 4 de continuación). Se corrigieron los fixtures para reflejar el motor actual, sin cambios en el motor. |
