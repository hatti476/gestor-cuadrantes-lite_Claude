# SPEC-008 — Fix: validación de shiftPreference "J" y consolidación del seed a 7 técnicos

## Metadatos

| Campo | Valor |
|-------|-------|
| ID | SPEC-008 |
| Tipo | bug |
| Estado | done |
| Prioridad | media |
| Agentes asignados | @devlead, @qa |
| Fecha de creación | 2026-10-07 |
| Sprint | Sprint-03 |

---

## Descripción

Al revisar la causa raíz de CP-171 se auditó también el seed de datos de test y la gestión
de usuarios TECNICO en `/admin`, pedido explícitamente por el DM tras la reducción a la
versión LITE (single-tenant, roles `ADMIN | TECNICO | VIEWER`). Se encontraron tres defectos:

1. El seed (`prisma/seed.ts` y `tests/e2e/global-setup.ts`) creaba 8 técnicos, no 7: un
   "Técnico Ejemplo" (`tecnico@cuadrantes.local`) duplicado, con `rotationOrder: 1`
   colisionando con "Técnico 1", y sin turnos asignados (el patrón de siembra de turnos
   solo recorre los 7 técnicos numerados).
2. `POST /api/admin/users` validaba `shiftPreference` contra `["M", "T"]`, rechazando con
   400 el valor `"J"` (jornada normal) — valor que la propia UI de `/admin` ofrece en el
   `<select>` y que el motor de generación (`monthly-schedule-engine.ts`) trata como
   preferencia válida (técnico exento de noches).
3. `PATCH /api/admin/users/[id]` no validaba `shiftPreference` en absoluto: aceptaba
   cualquier string, inconsistente con la validación de `isValidShiftPreference` que sí
   usa `/api/employees/[id]`.

---

## Contexto y antecedentes

Detectado durante la investigación de CP-171 (ver SPEC-007), al revisar el seed para
construir las env vars de CI y al pedir explícitamente el DM una auditoría de la función
de preferencia de turno M/T/J.

---

## Criterios de aceptación

- [x] AC-01: El seed (ambos ficheros) crea exactamente 1 ADMIN, 7 TECNICO (con `Employee` y
  turnos de Mayo 2026) y 1 VIEWER — sin usuario "ejemplo" extra ni colisión de `rotationOrder`.
- [x] AC-02: `POST /api/admin/users` acepta `shiftPreference: "J"` para un TECNICO nuevo
  (usa `isValidShiftPreference` de `lib/employees/business-logic.ts`, la misma fuente de
  verdad que `/api/employees/[id]`).
- [x] AC-03: `PATCH /api/admin/users/[id]` rechaza con 400 cualquier `shiftPreference` que
  no sea `"M" | "T" | "J" | null`.
- [x] AC-04: `npx tsc --noEmit` y `npx vitest run` en verde tras los cambios.

---

## Fuera de scope

- NO incluye: añadir un valor `shiftPreference: "J"` al seed de ejemplo (los 7 técnicos
  sembrados siguen alternando solo M/T; no se pidió un escenario J en el seed).
- NO incluye: limpiar las menciones residuales a "PM" en títulos/comentarios de
  `sprint-10.spec.ts` y `sprint-19.spec.ts` (texto, no lógica funcional; mismo criterio de
  "fuera de scope" ya aplicado en SPEC-007 a terminología obsoleta).

---

## Notas técnicas para los agentes

- Módulos afectados: `prisma/seed.ts`, `tests/e2e/global-setup.ts`,
  `app/api/admin/users/route.ts`, `app/api/admin/users/[id]/route.ts`,
  `tests/unit/admin-users-delete.test.ts` (su mock de `@/lib/auth/permissions` necesitó
  exportar `ROLES` al pasar `[id]/route.ts` a importar `lib/employees/business-logic.ts`,
  que a su vez importa `ROLES`).
- Riesgo de regresión: bajo — las dos rutas de API quedan más estrictas (rechazan valores
  antes aceptados por omisión en PATCH) y más permisivas donde correspondía (aceptan "J" en
  POST), ambos cambios alineados con la validación ya existente en `/api/employees/[id]`.

---

## Casos de test sugeridos

- Test E2E @smoke: crear un TECNICO desde `/admin` con preferencia "Jornada" → 201, no 400.
- Test unitario: `PATCH /api/admin/users/[id]` con `shiftPreference: "X"` → 400.

---

## Historial de cambios

| Fecha | Autor | Cambio |
|-------|-------|--------|
| 2026-10-07 | @devlead | Creación de la spec con los 3 fixes ya implementados y verificados (`tsc`, `vitest`) en la misma sesión que SPEC-007. |
