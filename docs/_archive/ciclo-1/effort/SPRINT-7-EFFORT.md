# Sprint 7 — Registro de esfuerzo

**Fecha**: 11/05/2026  
**Duración estimada**: 1 sesión  
**Estado**: ✅ Completado

---

## Tareas realizadas

| Tarea | Descripción |
|-------|-------------|
| API proyectos | `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/[id]` |
| API miembros | `GET/POST /api/projects/[id]/members`, `DELETE .../[userId]` |
| Scoping schedules | `?projectId` en `/api/schedules` y `/api/employees` |
| Tipos compartidos | `lib/projects/types.ts` |
| UI `/projects` | Página completa con tabla, formulario y panel de miembros |
| `ProjectSelector` | Componente reutilizable para la home |
| Header | Enlace "Proyectos" condicional |
| Tests E2E | 10 nuevos casos CP-47..CP-56, todos ✅ |

---

## Métricas

- **Unit tests**: 108/108 ✅ (sin cambios — lógica auth ya cubierta)
- **E2E tests**: 55/55 ✅ (10 nuevos)
- **Archivos nuevos**: 7
- **Archivos modificados**: 5
