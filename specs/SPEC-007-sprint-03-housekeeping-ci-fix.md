# SPEC-007 — Sprint 3: Cierre de ciclo + fix de raíz CP-171

## Metadatos

| Campo | Valor |
|-------|-------|
| ID | SPEC-007 |
| Tipo | chore |
| Estado | done |
| Prioridad | media |
| Agentes asignados | @orchestrator, @devlead, @qa |
| Fecha de creación | 2026-10-06 |
| Sprint | Sprint-03 |

---

## Descripción

Retomar el proyecto tras el merge de Sprint 1/2 (refactor single-tenant + fixes post-refactor) y cerrar los cabos sueltos de proceso antes de empezar funcionalidad nueva:

1. El servidor MCP `codebase-memory` que exige `AGENTS.md` (DIRECTIVA 0) solo estaba configurado para OpenCode (`.opencode/mcp.json`), no para Claude Code.
2. `CHANGELOG.md` no reflejaba el cierre de Sprint 1/2, y la spec SPEC-006 seguía marcada `proposed` aunque ya estaba implementada y mergeada.
3. `CP-171` (fallo conocido de CI: la suite E2E `@smoke` fallaba en los 30 tests por timeout de login) seguía con el fix de raíz pendiente.

---

## Contexto y antecedentes

Sprint 1 (`sprint1-limpieza-post-refactor`) ya está mergeado a `main` (PR #1, commit `427165d`). Al retomar el trabajo se detectó que la documentación de proceso (changelog, estado de specs) no se había cerrado, y que `CP-171` — documentado como causa conocida pero sin fix — seguía bloqueando la confianza en la suite `@smoke` de CI.

---

## Historia de usuario

Como **Delivery Manager retomando el proyecto**,
quiero **que el estado del repo (changelog, specs, CI) sea coherente con lo que ya está mergeado**,
para **poder planificar el siguiente sprint sin arrastrar deuda de proceso**.

Como **QA Lead**,
quiero **que la suite E2E `@smoke` de CI no falle por agotamiento de recursos del runner**,
para **que un fallo real de CI sea señal de regresión, no ruido de infraestructura**.

---

## Criterios de aceptación

- [x] AC-01: `.mcp.json` creado en la raíz del repo, espejando `.opencode/mcp.json`, para que Claude Code tenga acceso al servidor `codebase-memory` (requiere reinicio de sesión + aprobación del usuario; no verificable sin reiniciar)
- [x] AC-02: `CHANGELOG.md` tiene una entrada para el cierre de Sprint 1/2 (refactor single-tenant + fixes post-refactor)
- [x] AC-03: `SPEC-006` actualizada a estado `done` con los 21 AC marcados
- [x] AC-04: Causa raíz de CP-171 identificada y corregida: la suite de CI deja de levantar un segundo `next dev` y reutiliza el servidor ya construido en `:3000`
- [x] AC-05: Fix de CP-171 validado localmente reproduciendo el flujo de CI (seed → build → start → playwright) — el login deja de fallar uniformemente en todos los tests
- [x] AC-06: `tests/e2e/known-failures.md` actualizado: CP-171 movido a "corregidos"; nuevos fallos descubiertos (antes enmascarados por CP-171) documentados como `CP-172`, sin intentar arreglarlos en este sprint (fuera de scope)

---

## Flujo del usuario

1. DM retoma el proyecto y pide situación actual → se audita `specs/`, git log y CI.
2. Se detecta que falta `.mcp.json` para Claude Code → se crea espejando la config de OpenCode.
3. Se cierra el changelog y el estado de SPEC-006.
4. Se investiga CP-171: se confirma que Playwright levanta un segundo `next dev -p 3001` en paralelo al servidor ya construido por el workflow en `:3000`.
5. Se crea `playwright.ci.config.ts` (mismo patrón que el ya existente `playwright.docker.config.ts`) sin `webServer` propio.
6. Se ajustan `e2e-smoke.yml` y `e2e-nightly.yml` para usar ese config y para sembrar la BD con `prisma migrate deploy` en vez de `db push` (necesario para que el `migrate deploy` de `globalSetup` sea idempotente).
7. Se valida localmente replicando el flujo de CI completo.

---

## Fuera de scope

- NO incluye: arreglar los 10 tests `CP-172` descubiertos al dejar de estar enmascarados por CP-171 (condiciones de carrera por estado compartido en E2E en paralelo).
- NO incluye: limpiar `sprint-19.spec.ts` / `sprint-24.spec.ts`, que conservan referencias a la terminología de la era multi-proyecto ("proyecto activo") que SPEC-005 debió haber limpiado.
- NO incluye: añadir `.next-dev/` a `.gitignore` (quedó como artefacto de build sin trackear, detectado pero no solicitado).

---

## Notas técnicas para los agentes

- Módulos afectados: `.mcp.json` (nuevo), `CHANGELOG.md`, `specs/SPEC-006-*.md`, `playwright.ci.config.ts` (nuevo), `.github/workflows/e2e-smoke.yml`, `.github/workflows/e2e-nightly.yml`, `tests/e2e/known-failures.md`.
- El patrón de `playwright.ci.config.ts` replica `playwright.docker.config.ts` (sin `webServer`, `E2E_DATABASE_URL` fijado para que `globalSetup` no borre el fichero de BD que la app ya tiene abierto).
- Riesgo de regresión: bajo — cambios de configuración de CI/tests y documentación, sin tocar código de aplicación.

---

## Casos de test sugeridos

- Verificación manual: ejecutar `npx playwright test --config=playwright.ci.config.ts --grep @smoke` contra un servidor ya arrancado y confirmar que no hay fallos uniformes de login.
- CI: la primera ejecución real de `e2e-smoke.yml` sobre este sprint es la verificación definitiva de AC-04/AC-05.

---

## Historial de cambios

| Fecha | Autor | Cambio |
|-------|-------|--------|
| 2026-10-06 | @orchestrator | Creación de la spec, con el trabajo ya implementado y validado localmente en esta misma sesión |
