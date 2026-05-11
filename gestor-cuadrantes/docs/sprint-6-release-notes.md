# Sprint 6 — Release Notes

**Versión**: 0.6.0  
**Fecha**: 11/05/2026  
**Tipo**: Feature (Fase 2 — Kickoff multiproyecto)

---

## Resumen

Sprint 6 marca el inicio de la Fase 2 con el rediseño de roles, la arquitectura multiproyecto base y la preparación del stack de producción con PostgreSQL.

---

## Cambios principales

### Renombrado de roles globales (Opción B)

- `"ADMIN"` → `"SUPER_ADMIN"` en todo el sistema
- `"EMPLOYEE"` → `"USER"` en todo el sistema
- El badge del header ahora muestra `SUPER_ADMIN` o `USER`
- Todos los formularios, guards de ruta y API routes actualizados

### Nuevo modelo de datos — Proyecto y Membresías

```
Project         — id, name, description, region, createdAt
ProjectMember   — id, projectId, userId, role (PROJECT_ADMIN | EMPLOYEE)
Employee        — añadido projectId (nullable, backward compat)
```

### Nueva capa de autorización — `lib/auth/permissions.ts`

Funciones puras sin efectos secundarios:
- `isSuperAdmin(session)` — rol global SUPER_ADMIN
- `isProjectAdmin(session, projectId)` — PROJECT_ADMIN en un proyecto
- `canViewProject(session, projectId)` — miembro con cualquier rol
- `hasAdminAccess(session)` — SUPER_ADMIN global o PROJECT_ADMIN en algún proyecto

### NextAuth session extendida

El callback `session` ahora propaga `projectMemberships[]` desde BD, accesible como `session.user.projectMemberships`.

### Seed actualizado

| Email | Contraseña | Rol global | Rol en proyecto |
|-------|-----------|-----------|-----------------|
| admin@cuadrantes.local | Admin1234! | SUPER_ADMIN | PROJECT_ADMIN |
| pm@cuadrantes.local | PM1234! | USER | PROJECT_ADMIN |
| tecnico1-7@cuadrantes.local | Tecnico1234! | USER | EMPLOYEE |

Proyecto inicial: **"Equipo Soporte 24h"**

### Stack de producción

- `docker-compose.prod.yml` — PostgreSQL 16 + app Next.js
- `Dockerfile.prod` — build multi-stage (builder + runner minimal)
- `.env.example` — actualizado con vars de producción
- `docs/deployment.md` — guía completa de despliegue

---

## Tests

| Tipo | Total | Resultado |
|------|-------|-----------|
| Unit | 83 | ✅ 83/83 |
| E2E | 45 | ✅ 43/45 (2 flaky pre-existentes) |

### Nuevos tests E2E (Sprint 6)

| ID | Descripción |
|----|-------------|
| CP-43 | SUPER_ADMIN ve badge SUPER_ADMIN en header |
| CP-44 | USER ve badge USER en header |
| CP-45 | SUPER_ADMIN crea empleado con rol USER |
| CP-46 | SUPER_ADMIN crea empleado con rol SUPER_ADMIN |

---

## Migraciones Prisma

```
20260511151311_sprint6_multiproject  — añade Project, ProjectMember, Employee.projectId
20260511153815_sprint6_holiday_revert — restaura @@unique([date]) en Holiday
```

---

## Breaking changes

- Cualquier código externo que compare roles con `"ADMIN"` o `"EMPLOYEE"` debe actualizarse a `"SUPER_ADMIN"` / `"USER"`
- La sesión NextAuth ahora incluye `projectMemberships[]` — los tipos en `types/next-auth.d.ts` están actualizados

---

## Próximo sprint

**Sprint 7** — API de proyectos: CRUD de proyectos, asignación de miembros, scoping de cuadrante por proyecto.
