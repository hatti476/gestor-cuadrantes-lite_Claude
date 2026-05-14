# Sprint 10 — Release Notes

**Fecha**: 12/05/2026  
**Versión**: 1.0  
**Commit**: `7fcc9a9`  
**Estado**: ✅ Completado

---

## Resumen ejecutivo

Sprint 10 cierra la Fase 2 funcional del Gestor de Cuadrantes con cuatro áreas principales: soft-delete de empleados (preservando historial de turnos), interfaz de edición de `shiftPreference` y `nightRotationOrder`, permisos de edición de turnos para `PROJECT_ADMIN`, y una tabla de contadores de turnos independiente del grid con estilo visual unificado. La versión 1.0 también corrige el espacio vacío que quedaba a la derecha del calendario y homogeneiza las cabeceras de la tabla de contadores con las celdas del grid.

---

## Funcionalidades implementadas

### 1. Soft-delete de empleados

Los empleados ya no se eliminan físicamente de la base de datos. En su lugar, se desactivan con `active = false`, preservando todo el historial de turnos y cambios asociado.

#### Cambios en el esquema de BD

```sql
-- Migración: 20260512150600_sprint10_soft_delete_shift_preference
ALTER TABLE "Employee" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
```

#### Comportamiento

| Acción | Resultado |
|--------|-----------|
| Desactivar empleado | `PATCH /api/employees/[id]` con `{ active: false }` — solo SUPER_ADMIN |
| Reactivar empleado | `PATCH /api/employees/[id]` con `{ active: true }` — solo SUPER_ADMIN |
| Listado normal (`GET /api/employees`) | Solo empleados activos |
| Listado con inactivos (`GET /api/employees?includeInactive=true`) | Solo disponible para SUPER_ADMIN |
| Generación automática | Solo incluye empleados activos |
| Historial de turnos | Se preserva íntegro aunque el empleado esté desactivado |

#### UI en `/employees`

- Botón **Desactivar** con modal de confirmación (`data-testid="btn-confirm-deactivate"`)
- Botón **Reactivar** para empleados desactivados (`data-testid="btn-reactivate-{id}"`)

---

### 2. `shiftPreference` editable en UI

El campo `shiftPreference` (usado por el algoritmo Fase 2 para orientar la asignación de turnos en días laborables) ya es configurable desde la interfaz.

#### Cambios

- **`EmployeeForm`**: selector con opciones Sin preferencia / Solo mañanas (M) / Solo tardes (T) (`data-testid="select-shift-preference"`)
- **`EmployeeTable`**: badge de preferencia visible en el listado (`data-testid="badge-pref-{id}"`)
- **API PATCH `/api/employees/[id]`**: acepta `name`, `shiftPreference`, `role` y `active`; permiten SUPER_ADMIN y PROJECT_ADMIN (excepto `active`, que es solo SUPER_ADMIN)

---

### 3. `nightRotationOrder` editable en UI

El orden de rotación nocturna por proyecto es ahora configurable desde `/projects` sin necesidad de editar la base de datos directamente.

#### Panel de reordenación

- Panel **NightRotationPanel** visible al pulsar el botón "Orden rotación" de cada proyecto (`data-testid="btn-rotation-order"`)
- Lista de empleados ordenable con botones ↑ / ↓ (`data-testid="btn-rotation-up-{id}"`, `data-testid="btn-rotation-down-{id}"`)
- Botón **Guardar orden** que persiste el JSON en `Project.nightRotationOrder` (`data-testid="btn-save-rotation-order"`)
- API PUT `/api/projects/[id]` acepta `nightRotationOrder` (JSON string de IDs); disponible para PROJECT_ADMIN y SUPER_ADMIN

---

### 4. Edición de turnos para PROJECT_ADMIN

Un `PROJECT_ADMIN` ahora puede asignar y modificar turnos en el cuadrante del proyecto del que es administrador, con las mismas restricciones que el SUPER_ADMIN en ese proyecto.

#### Cambios

- **`app/page.tsx`**: `canEdit = isAdmin || PROJECT_ADMIN del proyecto activo`; `onCellClick` solo se pasa al grid si `canEdit` es true
- **API POST `/api/schedules`**: acepta PROJECT_ADMIN del proyecto
- **API DELETE `/api/schedules`**: acepta PROJECT_ADMIN del proyecto

---

### 5. Tabla de contadores de turnos separada (RF-17)

La tabla de contadores de turnos por empleado se ha extraído del interior del `ScheduleGrid` a un componente independiente `CountersTable`, visible debajo del grid y antes de la leyenda.

#### Diseño

```
┌─────────────────────────────────────────────────────┐
│  Grid del cuadrante (celdas cuadradas, w-9, w-fit)  │
├─────────────────────────────────────────────────────┘
│
├─ Tabla de contadores (inline-block, alineada a la izquierda)
│  ┌──────────────┬───┬───┬───┬────┬────┬────┬───┬───┬───┬───┐
│  │ Empleado     │ M │ T │ N │ MF │ TF │ NF │ J │ D │ V │ B │
│  ├──────────────┼───┼───┼───┼────┼────┼────┼───┼───┼───┼───┤
│  │ Técnico 1    │ 8 │10 │ 0 │  3 │  2 │  0 │ 0 │ 7 │ 1 │ 0 │
│  └──────────────┴───┴───┴───┴────┴────┴────┴───┴───┴───┴───┘
│
└─ Leyenda de colores
```

#### Características

| Característica | Descripción |
|----------------|-------------|
| Posición | Debajo del grid, antes de la leyenda |
| Alineación | Izquierda (`w-fit`), no se extiende al ancho de la página |
| Columna Empleado | Propia (140px), sticky |
| Cabeceras de turno | Mismo badge redondeado (`rounded-sm font-bold`) y colores que `ShiftCell` |
| Estilo del contenedor | `rounded-lg border border-gray-200 shadow-sm` — idéntico al grid |
| Hover de filas | `hover:bg-yellow-50/40 transition-colors` — idéntico al grid |
| Ceros | Se muestran en gris (`#9E9E9E`) para distinguirlos de valores reales |
| `data-testid` | `counter-{employeeId}-{shiftType}` por celda, `counters-table` en el contenedor |

#### Corrección del hueco vacío a la derecha del grid

El wrapper del `ScheduleGrid` tenía `overflow-x-auto` sin limitar el ancho, haciendo que el contenedor se estirara al 100 % del viewport. Se ha añadido `w-fit` para que el grid solo ocupe el ancho de su contenido.

---

## Tests añadidos

### E2E

| CP | Descripción |
|----|-------------|
| CP-71 | `shiftPreference` se guarda y muestra badge en el listado de empleados |
| CP-72 | Desactivar empleado hace soft-delete; el historial de turnos persiste |
| CP-73 | Empleado inactivo no aparece en la API de empleados activos |
| CP-74 | PROJECT_ADMIN puede editar celdas de su proyecto |
| CP-75 | PROJECT_ADMIN no puede editar celdas de otro proyecto |
| CP-76 | `nightRotationOrder` se puede reordenar y guardar desde /projects |
| CP-77 | Tabla de contadores aparece debajo del grid con datos coherentes (suma de contadores = total de asignaciones) |
| CP-78 | Tabla de contadores tiene estilo visual consistente con el grid (posición, colores de cabecera, no solapamiento) |

### Tests unitarios

Sin nuevos tests unitarios — la lógica de `countShifts` ya estaba cubierta en sprints anteriores. El campo `active` y su filtrado se verifican a nivel E2E e integración.

---

## Cambios en la API

| Método | Ruta | Cambio |
|--------|------|--------|
| PATCH | `/api/employees/[id]` | Nuevo endpoint: acepta `name`, `shiftPreference`, `role`, `active`; acceso SUPER_ADMIN o PROJECT_ADMIN |
| PUT | `/api/employees/[id]` | Ahora también acepta PROJECT_ADMIN (cambio de contraseña) |
| DELETE | `/api/employees/[id]` | Cambio a soft-delete (`active = false`); solo SUPER_ADMIN |
| GET | `/api/employees` | Nuevo param `includeInactive=true` (solo SUPER_ADMIN) |
| POST | `/api/schedules` | Ahora acepta PROJECT_ADMIN del proyecto |
| DELETE | `/api/schedules` | Ahora acepta PROJECT_ADMIN del proyecto |
| PUT | `/api/projects/[id]` | Ahora acepta `nightRotationOrder` (JSON string de IDs) |
| GET | `/api/projects/[id]` | Devuelve `nightRotationOrder` en la respuesta |

---

## Archivos modificados

| Archivo | Tipo de cambio |
|---------|----------------|
| `prisma/schema.prisma` | Campo `Employee.active Boolean @default(true)` |
| `prisma/migrations/20260512150600_sprint10_soft_delete_shift_preference/` | Nueva migración |
| `app/page.tsx` | `canEdit` con PROJECT_ADMIN; componente `CountersTable`; imports `countShifts`, `COUNTER_SHIFTS` |
| `components/schedule/schedule-grid.tsx` | Eliminados contadores del tbody; `w-fit` en wrapper; import `SHIFT_COLORS` eliminado |
| `app/employees/page.tsx` | Modal confirmDeactivate, `handleDeactivate`, `handleReactivate` |
| `components/employees/employee-table.tsx` | Badges `badge-pref-{id}`, botones `btn-deactivate-{id}`, `btn-reactivate-{id}` |
| `components/employees/employee-form.tsx` | Selector `select-shift-preference` |
| `app/projects/page.tsx` | `NightRotationPanel` con controles de reordenación |
| `app/api/employees/[id]/route.ts` | PATCH (soft-delete, shiftPreference, PROJECT_ADMIN); PUT (PROJECT_ADMIN) |
| `app/api/employees/route.ts` | Parámetro `includeInactive` |
| `app/api/schedules/route.ts` | POST/DELETE permiten PROJECT_ADMIN |
| `app/api/projects/[id]/route.ts` | PUT acepta `nightRotationOrder`; GET lo devuelve |
| `lib/projects/types.ts` | `ProjectDetail.nightRotationOrder?: string \| null` |
| `tests/e2e/sprint-10.spec.ts` | CP-71..CP-78 |

---

## Estado de tests al cierre

| Suite | Resultado |
|-------|-----------|
| Unit (`npm run test:unit`) | **118 / 118 ✅** |
| E2E (`npx playwright test`) | **77 / 77 ✅** |
| TypeScript (`tsc --noEmit`) | **0 errores ✅** |
