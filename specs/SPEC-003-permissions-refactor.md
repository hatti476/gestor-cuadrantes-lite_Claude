# SPEC-003 — Refactor Sistema de Roles y Permisos: ADMIN | TECNICO | VIEWER

## Metadatos

| Campo | Valor |
|-------|-------|
| ID | SPEC-003 |
| Tipo | feature |
| Estado | ready |
| Prioridad | alta |
| Agentes asignados | @orchestrator, @qa, @backend, @frontend, @devlead, @security |
| Fecha de creación | 2026-08-27 |
| Sprint | Sprint-01 |

---

## Descripción

Reescribir `lib/auth/permissions.ts` con la nueva matriz de tres roles planos. Actualizar NextAuth para emitir el nuevo enum en el JWT. Actualizar todos los guards de API routes y los condicionales de UI que referencian los roles eliminados (`SUPER_ADMIN`, `SUPER_VIEWER`, `PROJECT_ADMIN`, `USER`, `EMPLOYEE`).

---

## Contexto y antecedentes

Tras la migración de esquema (SPEC-002), el sistema de permisos debe reflejar la nueva realidad: tres roles globales sin contexto de proyecto. `ADMIN` tiene acceso total; `TECNICO` y `VIEWER` son estrictamente read-only y solo ven cuadrantes publicados.

---

## Historia de usuario

Como **desarrollador de backend/frontend**,
quiero **un sistema de permisos simple y plano**,
para **evitar lógica compleja de proyectos y roles anidados**.

---

## Criterios de aceptación

- [ ] AC-01: `lib/auth/permissions.ts` reescrito completamente con matriz `ADMIN | TECNICO | VIEWER`
- [ ] AC-02: Eliminadas funciones obsoletas: `canManageProjectMembers`, `canManageProjects`, `isProjectAdmin`, `isSuperViewer`, `isSuperAdmin` (en favor de nuevos helpers)
- [ ] AC-03: `app/api/auth/[...nextauth]/route.ts` actualizado: callbacks `jwt` y `session` mapean al nuevo enum `ADMIN | TECNICO | VIEWER`
- [ ] AC-04: Todos los endpoints `/api/**/route.ts` auditados y guards actualizados a nuevo sistema
- [ ] AC-05: `middleware.ts` (si existe) actualizado con nuevas reglas de protección
- [ ] AC-06: Componentes UI actualizados: `header.tsx`, `prep-panel.tsx`, `schedule-grid.tsx` y cualquier otro con condicionales de rol
- [ ] AC-07: **RF-04**: `ADMIN` tiene acceso completo a todas las operaciones lectura/escritura
- [ ] AC-08: **RF-05**: `TECNICO` y `VIEWER` son estrictamente read-only; cualquier escritura retorna 403
- [ ] AC-09: **RF-06**: `TECNICO` y `VIEWER` solo ven cuadrante cuando `Schedule.published === true`; `ADMIN` ve siempre
- [ ] AC-10: Gating de publicación aplica únicamente a `TECNICO` y `VIEWER`
- [ ] AC-11: No hay lógica de proyecto en ningún guard
- [ ] AC-12: `npm run ci:check` — 0 errores TypeScript sobre enum `Role`

---

## Referencias visuales

N/A — lógica de permisos. Ver capturas de UI en `specs/assets/` si se añaden.

---

## Flujo del usuario

1. Reescribir `lib/auth/permissions.ts` con nueva matriz
2. Actualizar NextAuth callbacks
3. Auditar y actualizar todos los API route guards
4. Actualizar condicionales UI en componentes
5. Verificar login con cada rol seed:
   - `ADMIN`: acceso completo
   - `TECNICO`: solo lectura, solo publicado, 403 en POST
   - `VIEWER`: mismo comportamiento, no aparece como empleado en grid
6. Ejecutar `npm run ci:check`

---

## Fuera de scope

- No modificar esquema BD (ya hecho en SPEC-002)
- No eliminar páginas UI (se hace en SPEC-004)
- No tocar motor de generación (`lib/schedules/monthly-schedule-engine.ts`)

---

## Notas técnicas para los agentes

- Módulo probable: `lib/auth/permissions.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/api/**/route.ts`, `components/layout/header.tsx`, `components/schedule/prep-panel.tsx`, `components/schedule/schedule-grid.tsx`
- Dependencias externas: NextAuth, Prisma Client
- Riesgo de regresión: **alto** — permisos incorrectos = brecha de seguridad
- **@security debe auditar antes de merge**

---

## Casos de test sugeridos

- Test unitario: `tests/unit/auth/permissions.test.ts`
  - `canEditSchedule` retorna `true` solo para `ADMIN`
  - `canViewPublishedOnly` retorna `true` para `TECNICO` y `VIEWER`
  - `canManageEmployees` retorna `true` solo para `ADMIN`
- Test E2E: `tests/e2e/auth/role-access.spec.ts`
  - `@smoke` `TECNICO` recibe 403 al intentar POST a `/api/schedules`
  - `@smoke` `VIEWER` recibe 403 al intentar POST a `/api/schedules`
  - `@smoke` `ADMIN` accede a `/admin` y ve panel de usuarios

---

## Historial de cambios

| Fecha | Autor | Cambio |
|-------|-------|--------|
| 2026-08-27 | @orchestrator | Creación de la spec |