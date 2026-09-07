# Sprint 12 — Release Notes

**Fecha**: 14/05/2026  
**Versión**: 1.3  
**Estado**: ✅ Completado

---

## Resumen ejecutivo

Sprint 12 cierra la arquitectura multiproyecto añadiendo **aislamiento total de asignaciones por proyecto** (`ShiftAssignment.projectId`), implementa la **transferencia automática del bloque de noches** cuando un empleado tiene vacaciones en esos días, añade la **preferencia de jornada `J`** con comportamiento correcto en generación (turno `J` en días L-V, `D` en fines de semana y festivos), y el **resaltado de la fila propia** del usuario autenticado en el grid (RF-19). Además resuelve tres bugs críticos de generación (BUG-30, BUG-31a, BUG-31b) y corrige una validación de API que rechazaba el valor `"J"` con HTTP 400.

---

## Funcionalidades implementadas

### 1. Aislamiento de asignaciones por proyecto (`ShiftAssignment.projectId`)

**Requisito**: BUG-29 — Nuevo proyecto heredaba asignaciones históricas de empleados de proyectos anteriores.

#### Migración

```sql
-- 20260513081837_sprint12_assignment_projectid
ALTER TABLE "ShiftAssignment" ADD COLUMN "projectId" TEXT;
CREATE UNIQUE INDEX ... ON "ShiftAssignment"("employeeId", "date", "projectId");
```

#### Cambios en la API

- `GET /api/schedules` filtra ahora por `ShiftAssignment.projectId` (en lugar de `employee.projectId`).
- `POST /api/schedules` y `POST /api/schedules/generate` incluyen `projectId` en cada `upsert`.
- 4.379 asignaciones históricas actualizadas con `projectId` mediante backfill.

---

### 2. Transferencia automática del bloque de noches (`resolveNightBlocks`)

**Requisito**: RF-14.10 — Si un empleado tiene vacaciones durante su bloque de noches programado, el bloque se transfiere al empleado con más tiempo sin noches.

#### Lógica (`lib/schedules/generate.ts`)

```typescript
function resolveNightBlocks(employees, nightOrder, monthDays, lockedCells):
  NightBlock[]
```

1. Para cada empleado en `nightOrder`, calcula su bloque natural (2D + 7N + 3D) según `NIGHT_EPOCH_FRIDAY`.
2. Si algún día de noches (N) coincide con una celda bloqueada (`V` o `D manual`), marca el bloque como conflictivo.
3. El empleado con conflicto cede su bloque; el siguiente empleado en la cola con más tiempo sin noches recibe el bloque cedido.
4. El empleado que cede pasa al final de la cola de rotación nocturna (próxima vez que le toque).

#### Tests unitarios añadidos

| Caso | Descripción |
|------|-------------|
| Sin conflictos | Bloque asignado correctamente al empleado natural |
| Vacación en pre-bloque (D) | No activa transferencia (solo D, no N) |
| Vacación en bloque N | Activa transferencia al siguiente en cola |
| Múltiples conflictos | Cola de candidatos respeta orden de antigüedad sin noches |

#### Test E2E

| CP | Descripción |
|----|-------------|
| CP-88 | Bloque de noches se transfiere al empleado con más tiempo sin noches cuando el asignado tiene vacaciones |

---

### 3. Preferencia de turno `J` (Jornada L-V)

**Requisito**: RF-14.6 — Empleados con `shiftPreference = "J"` trabajan con turno tipo `J` en días laborables (L-V) y descansan (`D`) en fines de semana y festivos. No computan para la cobertura M/T del equipo.

#### Cambios en el algoritmo (`lib/schedules/generate.ts`)

| Función | Cambio |
|---------|--------|
| `_pickWorkdayShift` | Primera línea: `if (pref === "J") return "J"` — retorna el tipo `J` directamente sin entrar en la lógica M/T |
| `_pickWeekendShift` | Primera línea: `if (pref === "J") return "D"` — descansa siempre en fin de semana/festivo |
| Bucle principal | `dailyOrder` procesa primero empleados sin preferencia M/T; los empleados J no compiten por cobertura |

#### Cambios en la API

| Archivo | Cambio |
|---------|--------|
| `lib/employees/business-logic.ts` | `VALID_SHIFT_PREFERENCES = ["M", "T", "J", null]` + función `isValidShiftPreference()` |
| `app/api/employees/[id]/route.ts` | PATCH usa `isValidShiftPreference`; antes solo aceptaba `"M"`, `"T"`, `null` (devolvía 400 para `"J"`) |

#### Test E2E

| CP | Descripción |
|----|-------------|
| CP-87 | La preferencia "Jornada" aparece en el formulario de edición, se puede guardar y muestra el badge "Jornada" en la tabla |

#### Tests unitarios añadidos (BUG-30 / BUG-31)

| Caso | Resultado esperado |
|------|--------------------|
| BUG-30: empleado pref T — `dailyOrder` neutrales primero | T ≥ M en días laborables (pref respetada) |
| BUG-31 weekends: empleado pref J en fin de semana | 0 turnos no-D en fin de semana |
| BUG-31 workdays: empleado pref J en días laborables | Todos los turnos laborables son tipo `J` (no M ni T) |

---

### 4. Resaltado de la fila propia en el grid (RF-19)

**Requisito**: RF-19 — El usuario autenticado puede identificar fácilmente su propia fila en el cuadrante.

#### Implementación

- `ScheduleGrid` recibe la prop `currentEmployeeId?: string`.
- La fila del empleado cuyo `id` coincide con `currentEmployeeId` aplica la clase `bg-indigo-50 ring-1 ring-indigo-200`.
- `app/page.tsx` pasa `session.user.employeeId` (del token JWT) como `currentEmployeeId`.
- Solo visible para usuarios con rol `USER` o `EMPLOYEE`; los administradores no tienen una fila "propia" en el grid.

#### Test E2E

| CP | Descripción |
|----|-------------|
| CP-89 | La fila del usuario autenticado se resalta con fondo indigo en el cuadrante |

---

## Bugs corregidos en Sprint 12

| ID | Severidad | Título |
|----|-----------|--------|
| [BUG-29](bugs/BUG-REGISTRY.md#bug-29) | 🟠 High | Nuevo proyecto hereda asignaciones históricas de empleados de proyectos anteriores |
| [BUG-30](bugs/BUG-REGISTRY.md#bug-30) | 🟠 High | `_pickWorkdayShift` ignoraba preferencia M/T cuando `weeklyShift` fue fijado por cobertura urgente |
| [BUG-31](bugs/BUG-REGISTRY.md#bug-31) | 🟠 High | Empleado con pref `J` recibía MF/TF en fines de semana y M/T en días laborables en lugar de D y J respectivamente |
| — | 🟡 Medium | API `PATCH /api/employees/[id]` devolvía HTTP 400 al guardar `shiftPreference = "J"` |

---

## Tests

| Suite | Casos | Estado |
|-------|-------|--------|
| Unit — `scheduler/generate` (regresiones BUG-30/BUG-31) | +4 nuevos (total 40) | ✅ |
| Unit — `employees/business-logic` (`isValidShiftPreference`) | +3 nuevos (total 43) | ✅ |
| E2E Sprint 12 (CP-86..CP-89) | 4 | ✅ |
| **Total unit** | **140** | **✅** |
| **Total E2E** | **84** | **✅** |

---

## Ficheros modificados

| Fichero | Motivo |
|---------|--------|
| `prisma/schema.prisma` | Campo `projectId` en `ShiftAssignment` |
| `prisma/migrations/20260513081837_sprint12_assignment_projectid/` | Migración SQL |
| `prisma/seed.ts` | Clave compuesta `employeeId_date_projectId` |
| `lib/schedules/generate.ts` | `resolveNightBlocks`, `_pickWorkdayShift` (J→J, dailyOrder), `_pickWeekendShift` (J→D) |
| `lib/employees/business-logic.ts` | `VALID_SHIFT_PREFERENCES`, `isValidShiftPreference()` |
| `app/api/schedules/route.ts` | Filtro por `ShiftAssignment.projectId` |
| `app/api/schedules/generate/route.ts` | `projectId` en upserts |
| `app/api/employees/[id]/route.ts` | Usa `isValidShiftPreference` del business-logic |
| `components/schedule/schedule-grid.tsx` | Prop `currentEmployeeId`, resaltado RF-19 |
| `app/page.tsx` | Pasa `currentEmployeeId` al grid |
| `tests/e2e/sprint-12.spec.ts` | CP-86, CP-87, CP-88, CP-89 |
| `tests/unit/scheduler/generate.test.ts` | Regresiones BUG-30/BUG-31 |
| `tests/unit/employees/business-logic.test.ts` | Tests `isValidShiftPreference` |
| `docs/REQUIREMENTS.md` | Actualización a v2.4.0 |
| `docs/bugs/BUG-REGISTRY.md` | BUG-30, BUG-31 añadidos |
