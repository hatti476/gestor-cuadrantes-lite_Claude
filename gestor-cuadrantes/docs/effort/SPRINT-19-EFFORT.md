# Esfuerzo — Sprint 19: Gestión de usuarios y proyectos (UI CRUD + RBAC)

**Período**: 23/05/2026 - 23/05/2026  
**Estado**: Completado ✅  
**Versión**: 1.9  
**Rama**: `feature/sprint-19-user-project-management`  
**Commits**: 5 commits de feature

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Project Manager / Product Owner (usuario) | Humano | ~1,5 h | Prompt Sprint 19, revisión de acceso por rol, verificación de /admin |
| Dev Agent (Copilot / Claude) | IA | ~12,0 h equiv. | 5 tareas: auditoría permisos, nav RBAC, /admin page, fixes acceso, tests |
| Doc Agent | IA | ~0,5 h equiv. | Release notes, esfuerzo, context.md |

**Total humano estimado**: ~1,5 h  
**Total IA estimado**: ~12,5 h equiv.  
**Total sprint estimado**: ~14,0 h

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Interacciones PM | Resultado |
|-------|-------------|--------|-----------------|-----------|
| Crear rama `feature/sprint-19-user-project-management` desde `main` + merge Sprint 18 | Dev | S | 0 | ✅ |
| Tarea 1 — Auditoría de permisos: 5 nuevas funciones + 11 rutas API corregidas | Dev | L | 0 | ✅ |
| Commit: `fix: permission audit - align all routes with role matrix` | Dev | S | 0 | ✅ |
| Tarea 2 — Cabecera adaptativa por rol + middleware `/employees→/admin` + protección `/admin` | Dev | M | 0 | ✅ |
| Commit: `feat: role-based navigation in header` | Dev | S | 0 | ✅ |
| Tarea 3 — API `/api/admin/users` (GET+POST) y `/api/admin/users/[id]` (PATCH+PUT) | Dev | M | 0 | ✅ |
| Tarea 3 — Página `/admin` con tabs Usuarios y Proyectos (modales, filtros, chips) | Dev | XL | 0 | ✅ |
| Corrección de errores TypeScript en `app/admin/page.tsx` (toast API, async setState) | Dev | M | 0 | ✅ |
| Commit: `feat: unified /admin section with users and projects tabs` | Dev | S | 0 | ✅ |
| Tarea 4 — PrepPanel visible para PROJECT_ADMIN; SUPER_VIEWER en /projects; botones read-only | Dev | S | 0 | ✅ |
| Commit: `fix: PROJECT_ADMIN and SUPER_VIEWER specific access rules` | Dev | S | 0 | ✅ |
| Tarea 5 — 13 tests E2E CP-129..CP-141 + 26 tests unitarios nuevas funciones permisos | Dev/QA | L | 0 | ✅ |
| Commit: `test: Sprint 19 E2E tests CP-129 to CP-141 and unit tests for new permission functions` | Dev | S | 0 | ✅ |
| Push rama + release notes + effort doc | Dev | S | 0 | ✅ |

---

## Notas técnicas

- **Toast API**: El patrón correcto es `const { showToast } = useToast()` → `showToast(msg, "success")`. No usar `toast.success()`.
- **Async en setState**: Siempre awaitar la respuesta antes de llamar setState: `const data = await res.json(); setState(data);`
- **PrepPanel RBAC**: El componente ya no se auto-guarda con `if (!isAdmin) return null` — la visibilidad la gestiona el padre con `{canEdit && !loading}`.
- **Middleware**: `getToken({ req })` de `next-auth/jwt` funciona correctamente en Next.js middleware con estrategia JWT.
