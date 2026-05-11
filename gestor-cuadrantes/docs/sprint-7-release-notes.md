# Sprint 7 — Release Notes

**Fecha**: 11/05/2026  
**Versión**: 0.7  
**Estado**: ✅ Completado

---

## Resumen ejecutivo

Sprint 7 introduce la **arquitectura de multiproyecto completa**: API REST para gestión de proyectos, panel de miembros con control de roles de proyecto, selector de proyecto activo en el cuadrante, y scoping de empleados/turnos por proyecto.

---

## Funcionalidades implementadas

### API de proyectos

| Endpoint | Acceso | Descripción |
|----------|--------|-------------|
| `GET /api/projects` | Autenticado | Lista proyectos accesibles (todos para SUPER_ADMIN, propios para USER) |
| `POST /api/projects` | SUPER_ADMIN | Crear proyecto |
| `GET /api/projects/[id]` | Miembro del proyecto | Detalle + lista de miembros |
| `PUT /api/projects/[id]` | PROJECT_ADMIN o SUPER_ADMIN | Editar nombre/descripción/región |
| `DELETE /api/projects/[id]` | SUPER_ADMIN | Eliminar proyecto |
| `GET /api/projects/[id]/members` | Miembro del proyecto | Listar miembros |
| `POST /api/projects/[id]/members` | PROJECT_ADMIN o SUPER_ADMIN | Añadir/actualizar miembro |
| `DELETE /api/projects/[id]/members/[userId]` | PROJECT_ADMIN o SUPER_ADMIN | Eliminar miembro |

### Scoping por proyecto

- `GET /api/schedules?projectId=xxx` — filtra turnos por proyecto
- `GET /api/employees?projectId=xxx` — filtra empleados por proyecto
- Sin `projectId`: SUPER_ADMIN ve todos; USER ve su primer proyecto

### UI nueva

- **Página `/projects`** (SUPER_ADMIN): tabla de proyectos con CRUD completo y panel modal de miembros
- **`ProjectSelector`** en la home: selector desplegable para SUPER_ADMIN con "Todos los proyectos"; badge de nombre para USER con un solo proyecto
- **Header**: enlace "Proyectos" visible solo para SUPER_ADMIN
- **Seguridad**: asignar rol `PROJECT_ADMIN` requiere ser SUPER_ADMIN

---

## Tests

### Unitarios

| Suite | Tests | Estado |
|-------|-------|--------|
| `schedules/business-logic` | 12 | ✅ |
| `schedules/generate` | 36 | ✅ |
| `employees/business-logic` | 35 | ✅ |
| `auth/permissions` | 25 | ✅ |
| **Total** | **108** | **✅** |

### E2E Sprint 7

| ID | Descripción | Estado |
|----|-------------|--------|
| CP-47 | SUPER_ADMIN ve la lista de proyectos | ✅ |
| CP-48 | SUPER_ADMIN crea un proyecto nuevo | ✅ |
| CP-49 | SUPER_ADMIN edita un proyecto | ✅ |
| CP-50 | SUPER_ADMIN elimina un proyecto | ✅ |
| CP-51 | SUPER_ADMIN abre el panel de miembros | ✅ |
| CP-52 | SUPER_ADMIN añade miembro al proyecto | ✅ |
| CP-53 | SUPER_ADMIN elimina miembro del proyecto | ✅ |
| CP-54 | Selector de proyecto visible en home (SUPER_ADMIN) | ✅ |
| CP-55 | USER ve su proyecto en home | ✅ |
| CP-56 | Header "Proyectos" solo visible para SUPER_ADMIN | ✅ |

**Total E2E**: 55/55 ✅ (10 nuevos Sprint 7, 45 heredados Sprints 1-6)

---

## Archivos modificados

```
app/api/projects/route.ts                         NEW
app/api/projects/[id]/route.ts                    NEW
app/api/projects/[id]/members/route.ts            NEW
app/api/projects/[id]/members/[userId]/route.ts   NEW
app/api/schedules/route.ts                        scoping projectId
app/api/employees/route.ts                        scoping projectId
app/page.tsx                                      ProjectSelector integrado
app/projects/page.tsx                             NEW — gestión de proyectos
components/layout/header.tsx                      enlace Proyectos
components/projects/project-selector.tsx          NEW
lib/projects/types.ts                             NEW — tipos compartidos
tests/e2e/sprint-7.spec.ts                        NEW — CP-47..CP-56
```

---

## Próximo sprint

**Sprint 8** — Roles de proyecto en UI, panel multi-proyecto para PROJECT_ADMIN, permisos granulares en todas las rutas de escritura.
