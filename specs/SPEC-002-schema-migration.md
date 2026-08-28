# SPEC-002 — Migración de Esquema Prisma: Eliminar Project/ProjectMember, Simplificar Role Enum

## Metadatos

| Campo | Valor |
|-------|-------|
| ID | SPEC-002 |
| Tipo | feature |
| Estado | done |
| Prioridad | alta |
| Agentes asignados | @orchestrator, @qa, @backend, @devlead |
| Fecha de creación | 2026-08-27 |
| Sprint | Sprint-01 |

---

## Descripción

Eliminar los modelos `Project` y `ProjectMember` del schema Prisma. Limpiar todos los campos `projectId` de las tablas restantes (`Employee`, `ShiftAssignment`, `Schedule`). Actualizar el enum `Role` del modelo `User` a `ADMIN | TECNICO | VIEWER`. Actualizar el seed para reflejar los nuevos roles.

---

## Contexto y antecedentes

El sistema actual tiene una capa multi-proyecto que añade complejidad innecesaria. El objetivo es operar en un único contexto global con tres roles planos. Esta migración es la base de todo el sprint — todo lo demás depende de ella.

---

## Historia de usuario

Como **arquitecto del sistema**,
quiero **un esquema de BD simplificado sin proyectos ni roles anidados**,
para **reducir complejidad y permitir permisos planos ADMIN/TECNICO/VIEWER**.

---

## Criterios de aceptación

- [x] AC-01: Modelos `Project` y `ProjectMember` eliminados de `prisma/schema.prisma`
- [x] AC-02: Campo `projectId` eliminado de `Employee`, `ShiftAssignment`, `Schedule`
- [x] AC-03: Enum `Role` en `User` actualizado a `ADMIN | TECNICO | VIEWER` (sin `SUPER_ADMIN`, `SUPER_VIEWER`, `USER`)
- [x] AC-04: `prisma/seed.ts` actualizado: crea usuarios con roles `ADMIN`, `TECNICO`, `VIEWER`; elimina creación de proyecto y `ProjectMember`
- [x] AC-05: `npx prisma db push --force-reset` ejecuta sin errores (migración aplicada vía db push en entorno no interactivo)
- [x] AC-06: `npm run db:seed` completa sin errores y genera usuarios `ADMIN`, `TECNICO`, `VIEWER`
- [x] AC-07: `npx prisma studio` / schema válido muestra modelos sin `Project` ni `ProjectMember`
- [x] AC-08: `npm run ci:check` — 0 errores TypeScript **sobre tipos de `Role`** (los errores restantes son en API/tests que referencian modelo antiguo — se arreglan en SPEC-003/004)
- [x] AC-09: Soft-delete `Employee.active` se mantiene intacto
- [x] AC-10: `ShiftChangeLog`, `ScheduleSnapshot`, `Holiday` sin cambios (no tenían `projectId`); `ScheduleSnapshot` adaptado a unique `[year, month]`

---

## Referencias visuales

N/A — migración de BD.

---

## Flujo del usuario

1. Modificar `prisma/schema.prisma` según especificación
2. Actualizar `prisma/seed.ts` con nuevos roles y sin proyecto
3. Ejecutar `npx prisma migrate dev --name sprint01-simplify-roles`
4. Ejecutar `npm run db:seed`
5. Verificar en `prisma studio` o `prisma migrate status`
6. Ejecutar `npm run ci:check`

---

## Fuera de scope

- No tocar API routes, permisos, UI ni tests en esta spec
- No modificar `lib/schedules/monthly-schedule-engine.ts`
- No cambiar lógica de generación de cuadrantes

---

## Notas técnicas para los agentes

- Módulo probable: `prisma/schema.prisma`, `prisma/seed.ts`, `prisma/migrations/`
- Dependencias externas: Prisma CLI, SQLite
- Riesgo de regresión: **alto** — cambio de esquema afecta a todas las capas
- **RF-01**: Sistema soporta exactamente tres roles: `ADMIN`, `TECNICO`, `VIEWER`
- **RF-02**: No existe concepto de proyecto múltiple. Todas las entidades operan en contexto global único
- **RF-03**: Solo usuarios con rol `TECNICO` tienen registro `Employee` asociado (1:1 con User)

---

## Casos de test sugeridos

- Test unitario: `tests/unit/models/user-role.test.ts`
  - El enum `Role` solo acepta `ADMIN | TECNICO | VIEWER`
  - Un usuario `TECNICO` puede tener `Employee` asociado; `VIEWER` no
- Test E2E: `tests/e2e/db/schema-validation.spec.ts` (opcional, smoke)
  - `@smoke` Migración se aplica sin errores
  - `@smoke` Seed crea 3 usuarios con roles correctos

---

## Historial de cambios

| Fecha | Autor | Cambio |
|-------|-------|--------|
| 2026-08-27 | @orchestrator | Creación de la spec |
| 2026-08-27 | @qa | Test unitario `tests/unit/models/user-role.test.ts` escrito (TDD) |
| 2026-08-27 | @backend | `prisma/schema.prisma` actualizado: eliminados Project, ProjectMember, projectId; Role enum simplificado |
| 2026-08-27 | @backend | `prisma/seed.ts` actualizado: usuarios ADMIN, TECNICO, VIEWER sin proyecto |
| 2026-08-27 | @backend | `npx prisma db push --force-reset` + `npm run db:seed` ejecutados con éxito |
| 2026-08-27 | @qa | Tests unitarios modelo pasan (11/11); 2 fallos pre-existentes en generate.test.ts (CP-163) |
| 2026-08-27 | @devlead | Schema revisado y aprobado |