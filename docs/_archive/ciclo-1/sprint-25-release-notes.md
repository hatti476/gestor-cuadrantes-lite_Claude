# Sprint 25 — Release Notes

**Fecha**: 2026-06-05 / 2026-06-08  
**Versión**: 2.5.0  
**Rama**: `feature/sprint-24-scheduling-fixes`  
**Estado**: ✅ Cerrado

---

## Resumen

Sprint de corrección de bugs críticos de permisos y experiencia de usuario, más dos mejoras visuales en la vista multi-mes. También incluye una revisión y refuerzo significativo del flujo de trabajo de los agentes de IA.

---

## Bugs corregidos

### BUG-53 🟠 High — EMPLOYEE recibe 403 en `/api/employees` y `/api/holidays`
- **Síntoma**: usuario con rol EMPLOYEE en un proyecto abría `/multi-month` y veía "Error al cargar empleados". Los festivos tampoco se mostraban.
- **Causa**: `GET /api/employees` solo permitía SUPER_ADMIN, SUPER_VIEWER, PROJECT_ADMIN. `GET /api/holidays` tenía la misma restricción.
- **Fix**: `/api/employees` ahora permite también a miembros del proyecto (`canViewProject`) cuando se especifica `projectId`. `/api/holidays` permite cualquier usuario autenticado.
- **Commit**: `8cf8803`
- **Test**: CP-158

### BUG-54 🔴 Critical — Proyecto activo se resetea al primer proyecto al cargar la página
- **Síntoma**: SUPER_ADMIN y PROJECT_ADMIN seleccionaban un proyecto en `/projects`, navegaban a `/` y el badge volvía al primer proyecto.
- **Causa**: Stale closure en el `useEffect` de validación de `app/page.tsx`. `activeProjectId` en el closure siempre era `null` al montar, por lo que `projects.find()` nunca encontraba el proyecto guardado y siempre reseteaba al primero.
- **Fix**: El efecto lee el `id` directamente de `localStorage` dentro del `.then()` del fetch, evitando el closure.
- **Commit**: `8cf8803`
- **Test**: CP-159

### BUG-55 🟠 High — PROJECT_ADMIN no ve el PrepPanel (Generar, Vacaciones, Bajas…)
- **Síntoma**: Un usuario con rol PROJECT_ADMIN podía editar celdas del cuadrante pero no veía el panel lateral de preparación (Vacaciones, Días libres, Bajas, Festivos, Generar cuadrante).
- **Causa**: El PrepPanel en `app/page.tsx` estaba gateado con `{isAdmin && ...}` donde `isAdmin = session?.user?.role === "SUPER_ADMIN"`. PROJECT_ADMIN tiene `canEdit = true` pero `isAdmin = false`.
- **Fix**: Cambiar la condición a `{canEdit && !loading && (`. El backend ya aceptaba PROJECT_ADMIN en `/api/schedules/generate` y `/api/schedules/publish`.
- **Commit**: `9c03938`
- **Test**: CP-162

---

## Nuevas funcionalidades

### Fila propia resaltada en vista multi-mes
- La fila del empleado logado aparece con fondo índigo, borde `ring-2 ring-indigo-300` e indicador `▶` en la vista `/multi-month`.
- Consistente con el comportamiento ya existente en la vista mensual normal.
- **Commit**: `8cf8803`
- **Test**: CP-160

### Festivos en rojo en la vista multi-mes
- Las cabeceras de días festivos aparecen con `bg-red-200 text-red-800` en la vista `/multi-month`, igual que en la vista mensual.
- Las celdas de festivos sin turno asignado tienen fondo `bg-red-50`.
- **Commit**: `8cf8803`
- **Test**: CP-161

---

## Mejoras de proceso (flujo de agentes)

- **Smoke tests tras cada commit**: obligatorio ejecutar `npx playwright test --grep @smoke` después de cada tarea. Regresión = fix inmediato.
- **`review-safe` obligatorio**: mandatorio para commits que toquen `app/page.tsx`, `lib/auth/permissions.ts` o condicionales de render basados en roles.
- **CP-XX antes de implementar**: los criterios de aceptación (DADO/CUANDO/ENTONCES + roles + data-testid) se definen en sprint planning, no al escribir los tests.
- **`known-failures.md`**: fichero con 14 fallos pre-existentes documentados. `qa-tester` y `pre-merge-review` lo consultan para distinguir regresiones de fallos conocidos.
- **Matriz de roles en `qa-tester`**: todo cambio que toque permisos de UI genera tests con TODOS los roles afectados.

---

## Casos de prueba QA

| ID | Descripción | Resultado | Rol probado |
|----|-------------|-----------|-------------|
| CP-158 | EMPLOYEE puede abrir multi-month sin 403 | ✅ PASS | EMPLOYEE |
| CP-159 | Proyecto seleccionado se mantiene al navegar a inicio | ✅ PASS | SUPER_ADMIN |
| CP-160 | Fila propia resaltada en vista multi-mes | ✅ PASS | EMPLOYEE |
| CP-161 | Festivos en rojo en cabecera multi-mes | ✅ PASS | SUPER_ADMIN |
| CP-162 | PROJECT_ADMIN ve el PrepPanel completo | ✅ PASS | PROJECT_ADMIN |

**Resultado global**: 5/5 nuevos tests ✅  
**Suite completa**: 127 passing, 14 failing (todos pre-existentes, registrados en `known-failures.md`)

---

## Ficheros modificados

| Fichero | Tipo de cambio |
|---------|---------------|
| `app/page.tsx` | Fix BUG-54 (stale closure) + Fix BUG-55 (PrepPanel canEdit) + data-testid edit-mode-banner |
| `app/api/employees/route.ts` | Fix BUG-53 (permisos EMPLOYEE) |
| `app/api/holidays/route.ts` | Fix BUG-53 (permisos authenticated) |
| `app/multi-month/page.tsx` | Feature: fila propia + festivos en rojo |
| `tests/e2e/sprint-25.spec.ts` | Tests CP-158..CP-162 |
| `tests/e2e/known-failures.md` | Nuevo: 14 fallos pre-existentes documentados |
| `docs/bugs/BUG-REGISTRY.md` | BUG-53, BUG-54, BUG-55 registrados |
| `.github/copilot/agents/*.md` | Mejoras de flujo: orchestrator, sprint-planner, qa-tester, review-safe, pre-merge-review |

---

## Credenciales de prueba (entorno local)

| Rol | Email | Password |
|-----|-------|----------|
| SUPER_ADMIN | admin@cuadrantes.local | Admin1234! |
| PROJECT_ADMIN | pm@cuadrantes.local | PM1234! |
| EMPLOYEE | tecnico1@cuadrantes.local | Tech1234! |
| SUPER_VIEWER | viewer@cuadrantes.local | Viewer1234! |

## Entorno de pruebas

- **URL**: http://localhost:3001 (servidor de test aislado)
- **BD**: `test.db` (resembrada en cada ejecución del suite)
- **Comando**: `npx playwright test tests/e2e/sprint-25.spec.ts --reporter=list`
