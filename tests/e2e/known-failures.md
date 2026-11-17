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
| CP-164 | E2E webServer timeout: `next dev -p 3001` supera 60s en entorno local | Sprint 0 (baseline) | Infraestructura de tests; requiere servidor ya corriendo o timeout mayor. **Además (Sprint 5)**: la caché persistente de Turbopack en `.next-test` puede servir una versión antigua de `proxy.ts` o dejar el módulo roto (`TypeError: adapterFn is not a function`); si los E2E locales fallan de forma rara tras tocar `proxy.ts` o borrar páginas, `rm -rf .next-test`. |
| CP-165 | ci:check: 9 ESLint errors (react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any) + 6 warnings | Sprint 0 (baseline) | Código pre-existente no cumple reglas actuales de lint |

**Total pre-existentes**: 2
**Última verificación**: Sprint 5 (2026-11-17) — local con `.next-test` limpia: suite completa 111/111 (1 skip: CP-46 obsoleto), @smoke incluido. Unit 474/474.
**Método de verificación**: Ejecución directa `npm run test:unit`, `npm run test:e2e`, `npm run ci:check`, y runs reales de `e2e-smoke.yml` en GitHub Actions

---

## Historial de fallos corregidos

| ID | Descripción | Sprint corregido | Commit |
|----|-------------|-----------------|--------|
| CP-163 | Unit tests: 2 fallos pre-existentes en generate.test.ts (RF-16 weekend coverage + cross-month night block uniqueness) | fix/ci-seed-and-cp163 | Fixtures desactualizados: RF-16 exigía 5 turnos T consecutivos que disparaban el descanso forzoso obligatorio (BUG-44) dejando el fin de semana sin cobertura; el test de bloque nocturno cross-month usaba `emp-1` con un histórico que la rotación determinista (4 empleados) nunca produce — el empleado real cuyo bloque cruza mayo/junio es `emp-2` (3 noches finales + 4 de continuación). Se corrigieron los fixtures para reflejar el motor actual, sin cambios en el motor. |
| CP-171 | CI "E2E smoke suite": los 30 tests fallaban con el mismo timeout en el login (`page.waitForURL`, helpers.ts:40) | Sprint 3 (6cd3dbf) | El servidor respondía bien; `tests/e2e/config.ts` leía `ADMIN_EMAIL`/`TECH_EMAIL`/etc. de `.env.test`, fichero gitignored inexistente en CI, enviando login con credenciales vacías. Fix: las 6 env vars añadidas al bloque `env:` de `e2e-smoke.yml`/`e2e-nightly.yml`. Confirmado en CI real (run 37751532946, 2026-10-08): login funciona, 24/37 pasan; los 10 restantes son CP-172 (ya documentado, sin relación). |
| CP-172 (parcial, 6 de 10) | `sprint-24` CP-150/151/152 y `multi-month` AC-10, AC-13 TECNICO/VIEWER | Sprint 4 (SPEC-009) | No eran condiciones de carrera: el refactor `f46b1bb` borró el botón `btn-expanded-view`; `/multi-month` daba "Error al cargar empleados" a TECNICO/VIEWER (`/api/employees` solo ADMIN, sin fallback); y con span=6 se mostraban feb..jul en vez de mar..ago. |
| CP-172 (resto, 4 de 10) | `admin-users` AC-19/20/21 y `sprint-19` CP-133 | Sprint 5 (SPEC-010) | `proxy.ts` exigía `SUPER_ADMIN` para `/admin` (H-01). Además los tests de borrado usan ahora un usuario desechable, y CP-133 ya no espera la pestaña eliminada. |
