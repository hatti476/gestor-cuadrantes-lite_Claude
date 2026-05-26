# Esfuerzo — Sprint 19: Gestión de usuarios y proyectos (UI CRUD + RBAC) + correcciones de algoritmo

**Período**: 23/05/2026 - 26/05/2026  
**Estado**: Completado ✅  
**Versión**: 1.9  
**Rama**: `feature/sprint-19-user-project-management`  
**Commits**: 7 commits de feature + 2 commits de docs/fix

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Project Manager / Product Owner (usuario) | Humano | ~2,0 h | Prompt Sprint 19, revisión acceso por rol, verificación /admin, revisión bugs algoritmo |
| Dev Agent (Copilot / Claude) | IA | ~16,0 h equiv. | 5 tareas RBAC + 3 bugs algoritmo + 7 tests unitarios nuevos |
| Doc Agent | IA | ~0,5 h equiv. | Release notes, esfuerzo, context.md, BUG-REGISTRY |

**Total humano estimado**: ~2,0 h  
**Total IA estimado**: ~16,5 h equiv.  
**Total sprint estimado**: ~18,5 h

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

## Sesión 2 — Correcciones de algoritmo (26/05/2026)

| Tarea | Responsable | Tamaño | Interacciones PM | Resultado |
|-------|-------------|--------|-----------------|-----------|
| BUG-38 — Validar transición de turno en path last-resort de `repairCoverage` | Dev | M | 0 | ✅ |
| BUG-39 — Restructurar `ensureWeekendPlan` en 3 niveles para evitar 3er fin de semana consecutivo | Dev | L | 2 | ✅ |
| BUG-40 — Reordenar `repairSingleRestDays` + añadir `enforceConsecLimit` a `movePackageShiftFromEmployee` | Dev | L | 3 | ✅ |
| 7 tests unitarios nuevos (Sprint 19: transiciones N→trabajo, consecutivos, sin huecos) | Dev/QA | M | 0 | ✅ |
| Commit: `fix: scheduler algorithm bugs - N-to-work rest, consecutive weekends, isolated rest repair` | Dev | S | 0 | ✅ |
| Corrección índice BUG-REGISTRY (BUG-34..37 marcados como Open erróneamente) | Doc | S | 1 | ✅ |
| Commit: `docs: fix BUG-REGISTRY index - mark BUG-34..37 as Fixed` | Doc | S | 0 | ✅ |

---

## Notas técnicas

- **Toast API**: El patrón correcto es `const { showToast } = useToast()` → `showToast(msg, "success")`. No usar `toast.success()`.
- **Async en setState**: Siempre awaitar la respuesta antes de llamar setState: `const data = await res.json(); setState(data);`
- **PrepPanel RBAC**: El componente ya no se auto-guarda con `if (!isAdmin) return null` — la visibilidad la gestiona el padre con `{canEdit && !loading}`.
- **Middleware**: `getToken({ req })` de `next-auth/jwt` funciona correctamente en Next.js middleware con estrategia JWT.
- **BUG-39/40 (consecutivos)**: Feb 2026 con 8 empleados puede generar 3 fines de semana consecutivos de forma matemáticamente inevitable (2 en noches + 4 con ventana de trabajo agotada → solo 1 disponible). El test acepta `≤3` en ese escenario; Marzo 2026 con 7 empleados mantiene `≤2`.
- **BUG-REGISTRY**: El índice rápido puede desincronizarse del detalle. Siempre verificar estado real en la sección `### BUG-XX`, no en la tabla de índice.
