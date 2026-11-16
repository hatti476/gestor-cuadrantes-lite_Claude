# SPEC-009 — CI E2E en Ubuntu 24.04, botón de acceso a la vista multi-mes y `.gitignore`

## Metadatos

| Campo | Valor |
|-------|-------|
| ID | SPEC-009 |
| Tipo | bug / chore |
| Estado | done |
| Prioridad | alta |
| Agentes asignados | @orchestrator, @qa, @frontend, @devlead |
| Fecha de creación | 2026-11-16 |
| Sprint | Sprint-04 |

---

## Descripción

Tres problemas pequeños detectados al retomar el proyecto tras la pausa de octubre:

1. **CI E2E roto por el runner**: los workflows `e2e-smoke.yml` y `e2e-nightly.yml` usan
   `runs-on: ubuntu-latest`, que GitHub ha movido a Ubuntu 26.04. Playwright 1.59.1 no
   soporta esa versión y el paso `npx playwright install --with-deps chromium` falla antes
   de ejecutar ningún test. Bloquea el merge de cualquier PR (p. ej. PR #37).
2. **Vista multi-mes inaccesible desde la UI**: la página `/multi-month` existe y funciona,
   pero ningún botón ni enlace del cuadrante lleva a ella; solo se llega tecleando la URL.
   El CHANGELOG 2.4.0 menciona un botón "↔ Vista ampliada" que no existe en el historial
   de git. La única implementación del botón estaba en un stash sin commitear
   (`wip-sprint2-not-part-of-this-fix`).
3. **Ficheros generados sin ignorar**: `.next-dev/` (directorio de build de `next dev`)
   aparece como untracked; `dev.log` y `cookies.txt` son artefactos locales de depuración.

---

## Contexto y antecedentes

- Fallo de CI detectado en el run 43853496231 (PR #37, 2026-11-16):
  `Error: ERROR: Playwright does not support chromium on ubuntu26.04-x64`.
- El job `ci.yml` (typecheck + lint + unit + build) no instala navegadores y sigue en verde.
- El botón de multi-mes y las entradas de `.gitignore` se recuperan del stash
  `wip-sprint2-not-part-of-this-fix` (creado sobre `0ffdee4`). El resto del stash
  (reescritura de `prep-panel.tsx`, `getRole`, `tsconfig.json`, `Suspense`) se descarta:
  ya está en `main` o rompería el flujo de pasos de preparación.

---

## Historia de usuario

Como técnico, viewer o admin,
quiero abrir la vista ampliada multi-mes desde el cuadrante mensual,
para consultar varios meses seguidos sin tener que conocer la URL.

---

## Criterios de aceptación

- [x] AC-01: `e2e-smoke.yml` y `e2e-nightly.yml` usan `runs-on: ubuntu-24.04`.
- [x] AC-02: El job "E2E smoke suite" pasa el paso "Install Playwright browsers" en CI real.
- [x] AC-03: La barra de herramientas del cuadrante (`/`) muestra un botón
  `data-testid="btn-multi-month"` con el texto "Vista ampliada", visible para ADMIN,
  TECNICO y VIEWER, y oculto al imprimir (`print:hidden`).
- [x] AC-04: Al pulsarlo navega a `/multi-month?year=<año>&month=<mes>&span=3`, donde
  año/mes son los del mes que se está viendo en ese momento (no el mes actual del sistema).
- [x] AC-05: `.gitignore` incluye `/.next-dev/`, `dev.log` y `cookies.txt`.
- [x] AC-06: `npx tsc --noEmit` y `npx vitest run` en verde (baseline: 431/431).

---

## Flujo del usuario

1. El usuario inicia sesión y ve el cuadrante mensual (por defecto Mayo 2026).
2. Opcionalmente navega a otro mes con las flechas.
3. Pulsa "Vista ampliada" en la barra de herramientas.
4. El sistema abre `/multi-month` centrado en el mes que estaba viendo, con 3 meses.

---

## Fuera de scope

- NO incluye: actualizar Playwright a una versión compatible con Ubuntu 26.04 (se fija el
  runner; la actualización queda para un sprint posterior).
- NO incluye: cambiar `ci.yml` (no usa Playwright; sigue funcionando en `ubuntu-latest`).
- NO incluye: corregir CP-172 (fallos por estado compartido en E2E), que se aborda en su
  propia spec.
- NO incluye: corregir el CHANGELOG 2.4.0 histórico.

---

## Notas técnicas para los agentes

- Módulos afectados: `.github/workflows/e2e-smoke.yml`, `.github/workflows/e2e-nightly.yml`,
  `app/page.tsx` (barra de herramientas, junto a `btn-print`), `.gitignore`.
- El estado del mes visible está en `year`/`month` de `app/page.tsx`.
- Riesgo de regresión: bajo — botón nuevo sin lógica propia; el cambio de runner no
  modifica los pasos del workflow.

---

## Casos de test sugeridos

- Test E2E @smoke (CP-173): ADMIN pulsa "Vista ampliada" → URL
  `/multi-month?year=2026&month=5&span=3` y 3 cabeceras de mes visibles.
- Test E2E (CP-174): ADMIN navega al mes anterior y pulsa el botón → `month=4`.
- Test E2E (CP-175): VIEWER y TECNICO ven el botón.

---

## Historial de cambios

| Fecha | Autor | Cambio |
|-------|-------|--------|
| 2026-11-16 | @orchestrator | Creación de la spec tras revisar el fallo de CI de PR #37 y el stash pendiente. |
| 2026-11-16 | @qa | AC-02 verificado en CI real (PR #76, run 43889457645): instalación de Playwright OK en ubuntu-24.04; 25 pasan, 10 fallan (CP-172, mismos ficheros), 3 no se ejecutan. CP-173 pasa en CI. |
