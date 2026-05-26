# Sprint 19 — Release Notes
**Fecha:** 2026-05-26  
**Rama:** `feature/sprint-19-user-project-management`  
**Estado:** ✅ Completado  
**Tests:** 296 unit (↑39 nuevos) · 13 E2E nuevos (CP-129..CP-141)

---

## Resumen ejecutivo

Sprint 19 implementa la sección de administración unificada `/admin` con gestión completa de usuarios y proyectos, corrección de permisos en todas las rutas API y ajustes de acceso específicos por rol. Se elimina la ruta `/employees` (ahora redirige a `/admin`) y se consolida toda la administración en una única interfaz con dos pestañas.

---

## Cambios incluidos

### Task 1 — Auditoría y corrección de permisos (`fix: permission audit`)

**`lib/auth/permissions.ts`** — 5 nuevas funciones exportadas:
- `isAnyProjectAdmin(session)` — true si PROJECT_ADMIN en cualquier proyecto
- `canViewEmployees(session)` — SUPER_ADMIN | SUPER_VIEWER | PROJECT_ADMIN
- `canViewHolidays(session)` — igual que `canViewEmployees`
- `canManageHolidays(session)` — solo SUPER_ADMIN
- `canManageProjectMembers(session)` — solo SUPER_ADMIN

**Rutas API corregidas:**
| Ruta | Cambio |
|------|--------|
| `GET /api/employees` | Requiere `canViewEmployees` (bloqueaba a EMPLOYEE puro) |
| `PATCH /api/employees/[id]` | Solo SUPER_ADMIN (quitado acceso a PROJECT_ADMIN) |
| `GET /api/employees/[id]/history` | SUPER_ADMIN ∨ SUPER_VIEWER ∨ isProjectAdmin(propio) |
| `GET /api/projects` | SUPER_ADMIN ∨ SUPER_VIEWER (antes solo SUPER_ADMIN) |
| `GET /api/projects/[id]` | Usa `canViewProject` (incluye SUPER_VIEWER) |
| `POST /api/projects/[id]/members` | Solo `canManageProjectMembers` (SUPER_ADMIN) |
| `DELETE /api/projects/[id]/members/[userId]` | Solo `canManageProjectMembers` |
| `GET /api/holidays` | Requiere `canViewHolidays` |
| `POST /api/holidays` | Requiere `canManageHolidays` (SUPER_ADMIN) |
| `GET /api/holidays/public` | Solo SUPER_ADMIN |
| `POST /api/schedules/generate` | SUPER_ADMIN ∨ isProjectAdmin(projectId) |

---

### Task 2 — Navegación basada en rol (`feat: role-based navigation`)

**`components/layout/header.tsx`** — Menú adaptativo:
- **SUPER_ADMIN:** Proyectos · Cuadrante · **Administración** · Ayuda
- **PROJECT_ADMIN:** Proyectos · Cuadrante · Ayuda
- **SUPER_VIEWER:** Proyectos · Cuadrante · Ayuda
- **USER/EMPLOYEE:** Cuadrante · Ayuda
- Se elimina el enlace "Empleados" del menú

**`middleware.ts`** (nuevo) — Middleware de Next.js:
- Redirige `/employees/*` → `/admin/*` (compatibilidad hacia atrás)
- Protege `/admin/*`: redirige a `/` si el usuario no es SUPER_ADMIN

---

### Task 3 — Sección /admin unificada (`feat: unified /admin section`)

**`app/admin/page.tsx`** (nuevo) — Página con dos pestañas:

**Pestaña Usuarios (`data-testid="admin-tab-users"`):**
- Tabla con búsqueda por nombre/email, filtro por rol global, filtro por estado
- Crear usuario (nombre, email, contraseña, rol global, preferencia de turno, asignación a proyectos)
- Editar usuario (email, rol, turno, asignaciones de proyecto, cambio de contraseña)
- Desactivar/reactivar usuario con confirmación
- Chips de proyecto por usuario con rol (`data-testid="project-chip-{userId}-{projectId}"`)

**Pestaña Proyectos (`data-testid="admin-tab-projects"`):**
- Lista expandible de proyectos con contador de miembros
- Crear/editar proyecto (nombre, descripción, región)
- Eliminar proyecto con confirmación
- Gestión inline de miembros (añadir/eliminar, asignar rol PROJECT_ADMIN/EMPLOYEE)

**`app/api/admin/users/route.ts`** (nuevo):
- `GET /api/admin/users` — lista todos los usuarios con employee+memberships
- `POST /api/admin/users` — crea usuario + Employee (si USER) + asignaciones

**`app/api/admin/users/[id]/route.ts`** (nuevo):
- `PATCH /api/admin/users/[id]` — actualiza usuario/employee/memberships atómicamente
- `PUT /api/admin/users/[id]` — cambia contraseña

---

### Task 4 — Acceso específico por rol (`fix: PROJECT_ADMIN and SUPER_VIEWER`)

**`app/page.tsx`** (schedule grid):
- PrepPanel ahora visible para PROJECT_ADMIN (además de SUPER_ADMIN) ya que `canEdit` incluye a PROJECT_ADMIN del proyecto activo
- SUPER_VIEWER no tiene PrepPanel (ya que `canEdit = false` para viewers)

**`components/schedule/prep-panel.tsx`**:
- Eliminado `if (!isAdmin) return null` — la visibilidad la controla el padre con `{canEdit && !loading}`
- Botón "Gestionar festivos del mes" solo visible con `isAdmin` (SUPER_ADMIN)

**`app/projects/page.tsx`**:
- SUPER_VIEWER puede acceder a `/projects` (canAccess = SUPER_ADMIN ∨ SUPER_VIEWER ∨ PROJECT_ADMIN)
- SUPER_VIEWER ve la lista en modo lectura (sin botones de crear/editar/eliminar)

---

### Task 6 — Corrección de bugs de algoritmo de generación (`fix: scheduler algorithm bugs`)

**`lib/schedules/generate.ts`** — 3 bugs corregidos en el algoritmo de generación:

**Fix 1 — Transición N→trabajo sin descanso mínimo (path de reparación de última instancia)**  
El camino `repairCoverage → last-resort` podía asignar un turno de día inmediatamente después de un turno de noche sin respetar el descanso mínimo (ej. N→M, 8h de hueco que viola la regla de 12h). Se añade validación de `validateShiftTransition` antes de aplicar asignaciones en ese path.

**Fix 2 — Planificación inicial en 3 niveles para fines de semana consecutivos**  
Se añade `wouldGet3rdConsec` y se restructura `ensureWeekendPlan` en 3 niveles:
1. Ventana de descanso estricta + sin 3er fin de semana consecutivo
2. Ventana de descanso estricta (permite 3er consecutivo si no hay otra opción)
3. Ventana de descanso relajada (último recurso)

**Fix 3 — Reparación de días D aislados sin violar límite de fines de semana**  
Se añade parámetro `enforceConsecLimit` a `movePackageShiftFromEmployee` y se reordena `repairSingleRestDays`:
1. Mover paquete a candidato sin 3er consecutivo (`enforceConsecLimit=true`)
2. Convertir día anterior a descanso
3. Convertir día siguiente a descanso
4. Fallbacks `ignoreMinCoverage=true`

Se elimina el path de último recurso que permitía silenciosamente dar un 3er fin de semana consecutivo.

---

### Task 5 — Tests (`test: Sprint 19 E2E + unit tests`)

**`tests/e2e/sprint-19.spec.ts`** — 13 tests E2E (CP-129..CP-141):
- CP-129: SUPER_ADMIN ve "Administración" en cabecera
- CP-130: PROJECT_ADMIN no ve "Administración" en cabecera  
- CP-131: USER solo ve "Cuadrante" y "Ayuda"
- CP-132: /admin redirige a "/" para no-SUPER_ADMIN
- CP-133: SUPER_ADMIN crea usuario SUPER_VIEWER desde /admin
- CP-134: SUPER_ADMIN edita email de usuario
- CP-135: SUPER_ADMIN desactiva usuario
- CP-136: Filtro por rol funciona correctamente
- CP-137: PROJECT_ADMIN solo ve su proyecto en /projects
- CP-138: SUPER_VIEWER ve todos los proyectos (read-only)
- CP-139: SUPER_VIEWER ve cuadrante sin PrepPanel
- CP-140: SUPER_VIEWER no puede editar celdas
- CP-141: /employees redirige a /admin

**`tests/unit/scheduler/generate.test.ts`** — 7 tests unitarios nuevos (Sprint 19 algoritmo):
- `Sprint 19 — Bug: transición N→trabajo sin descanso mínimo` (3 casos)
- `Sprint 19 — Bug: máximo 2 fines de semana consecutivos por empleado` (2 casos)
- `Sprint 19 — Sin huecos: todos los días tienen asignación` (2 casos)

**`tests/unit/lib/permissions.test.ts`** — 26 tests unitarios nuevos:
- `isAnyProjectAdmin`: 5 casos (4 roles + null)
- `canViewEmployees`: 6 casos (4 roles + sin membresías + null)
- `canViewHolidays`: 5 casos
- `canManageHolidays`: 5 casos
- `canManageProjectMembers`: 5 casos

**`tests/e2e/config.ts`** — Añadido usuario `viewer` (SUPER_VIEWER)  
**`tests/e2e/helpers.ts`** — Añadida función `loginAsViewer()`  
**`.env.test`** — Añadidas variables `VIEWER_EMAIL` / `VIEWER_PASSWORD`

---

## Métricas finales

| Métrica | Sprint 18 | Sprint 19 |
|---------|-----------|-----------|
| Unit tests | 257 ✅ | 296 ✅ (+39) |
| E2E tests declarados | CP-01..CP-128 | CP-01..CP-141 (+13) |
| TypeScript errors | 0 | 0 |
| Rutas API auditadas | — | 11 rutas corregidas |
| Archivos nuevos | — | 6 |
| Archivos modificados | — | 13 |
| Bugs algoritmo corregidos | — | 3 (Fix1-Fix3) |

---

## Commits del sprint

```
fix: permission audit - align all routes with role matrix
feat: role-based navigation in header
feat: unified /admin section with users and projects tabs
fix: PROJECT_ADMIN and SUPER_VIEWER specific access rules
test: Sprint 19 E2E tests CP-129 to CP-141 and unit tests for new permission functions
fix: scheduler algorithm bugs - N-to-work rest, consecutive weekends, isolated rest repair
```
