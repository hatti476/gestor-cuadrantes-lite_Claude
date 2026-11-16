# SPEC-009 — CI E2E en Ubuntu 24.04, botón de acceso a la vista multi-mes y `.gitignore`

## Metadatos

| Campo | Valor |
|-------|-------|
| ID | SPEC-009 |
| Tipo | bug / chore |
| Estado | in-progress |
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
   El botón original `btn-expanded-view` ("↔ Vista ampliada", CHANGELOG 2.4.0) se eliminó
   en el refactor `f46b1bb` al quitar `projectId`, y nadie lo repuso: CP-150/151/152
   fallaban desde entonces (registrados por error como CP-172).
4. **Vista multi-mes rota para TECNICO y VIEWER**: `GET /api/employees` es solo ADMIN y la
   página no tenía fallback, así que mostraba "Error al cargar empleados" (AC-13 de
   SPEC-006 incumplido; fallos de `multi-month.spec.ts` AC-13, también en CP-172).
5. **Centrado de la vista**: con span par se mostraban más meses hacia atrás (6 → feb..jul)
   y el parámetro `span` de la URL se ignoraba; tampoco había scroll inicial hacia el mes
   visible, que con 6 meses queda fuera de pantalla.
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
- [x] AC-07: `/multi-month` lee `span` de la URL (valores `2|3|4|6`; cualquier otro → 3).
- [x] AC-08: Los meses mostrados se centran en el mes visible; con span par, un mes más
  hacia delante (6 meses en mayo → marzo..agosto). Al cargar, el scroll horizontal deja
  el mes visible centrado en pantalla.
- [x] AC-09: TECNICO y VIEWER ven la vista sin error: los empleados salen de las
  asignaciones (ya filtradas por publicación en el servidor), igual que en la vista
  mensual. Sin meses publicados se muestra "Ningún mes de este rango está publicado todavía."
- [x] AC-10: El botón usa el `data-testid="btn-expanded-view"` y el texto "↔ Vista ampliada"
  originales.

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
  `app/page.tsx` (barra de herramientas, junto a `btn-print`), `app/multi-month/page.tsx`,
  `lib/schedules/multi-month.ts` (nuevo, lógica pura testeable), `.gitignore`.
- No se abre `GET /api/employees` a TECNICO/VIEWER (expondría email y rol de usuarios).
- El estado del mes visible está en `year`/`month` de `app/page.tsx`.
- Riesgo de regresión: bajo — botón nuevo sin lógica propia; el cambio de runner no
  modifica los pasos del workflow.

---

## Casos de test sugeridos

- Test E2E @smoke (CP-173): ADMIN pulsa "Vista ampliada" → URL
  `/multi-month?year=2026&month=5&span=3` y 3 cabeceras de mes visibles.
- Test E2E (CP-174): ADMIN navega al mes anterior y pulsa el botón → `month=4`.
- Test E2E @smoke (CP-175, uno por rol): TECNICO y VIEWER pulsan el botón y la vista carga
  sin error.
- Test E2E (CP-176): con `span=6`, el scroll inicial deja mayo dentro de la vista.
- Unit (`tests/unit/schedules/multi-month.test.ts`): `getMonthPeriods`, `parseSpan`,
  `employeesFromAssignments`.

---

## Historial de cambios

| Fecha | Autor | Cambio |
|-------|-------|--------|
| 2026-11-16 | @orchestrator | Creación de la spec tras revisar el fallo de CI de PR #37 y el stash pendiente. |
| 2026-11-16 | @qa | AC-02 verificado en CI real (PR #76, run 43889457645): instalación de Playwright OK en ubuntu-24.04; 25 pasan, 10 fallan (CP-172, mismos ficheros), 3 no se ejecutan. CP-173 pasa en CI. |
| 2026-11-16 | @devlead | Revisión @devlead/@security: ALTO (botón llevaba a TECNICO/VIEWER a una vista rota). Alcance ampliado con AC-07..AC-10; CP-150/151/152 y AC-10/AC-13 de `multi-month.spec.ts` dejan de ser CP-172. Local: 18/18 E2E (sprint-4, multi-month, sprint-24), 439/439 unit. |
