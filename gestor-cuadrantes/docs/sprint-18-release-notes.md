# Sprint 18 — Release Notes

**Fecha**: 22/05/2026  
**Versión**: 1.8  
**Rama**: `feature/sprint-18-fixes-and-ux`  
**Estado**: ✅ Completado

---

## Resumen ejecutivo

Sprint 18 cierra siete tareas planificadas de mejoras UX, correcciones de algoritmo y funcionalidades nuevas, más tres bugfixes adicionales detectados durante las pruebas manuales. Se añade el rol `SUPER_VIEWER`, el sistema de snapshot/undo de generación, esquema de colores unificado, columnas de fin de semana diferenciadas y correcciones del generador. Tests unitarios: 234 → 257 (+23). E2E: CP-115..CP-128.

---

## Objetivos cerrados

| # | Tarea | Estado |
|---|-------|--------|
| 1 | Continuidad cross-month del paquete sáb+dom (MF/TF) | ✅ |
| 2 | Avisos de cobertura crítica (alta concentración de vacaciones) | ✅ |
| 3 | Nuevo rol global SUPER_VIEWER (solo lectura) | ✅ |
| 4 | Columnas sáb/dom y festivos diferenciadas visualmente en el grid | ✅ |
| 5 | Esquema de colores unificado por familia de turno | ✅ |
| 6 | Snapshot de cuadrante y botón "Deshacer" generación | ✅ |
| 7 | Tests E2E CP-115..CP-125 | ✅ |
| B1 | V/B con fondo negro — máxima visibilidad | ✅ |
| B2 | Bug: bloque N cross-month no respetaba vacaciones en mes siguiente | ✅ |
| B3 | Bug: distribución desequilibrada de fines de semana (weekendCount) | ✅ |

---

## Cambios realizados

### Tarea 1 — Continuidad cross-month del paquete sáb+dom

**Archivos**: `lib/schedules/generate.ts`, `tests/unit/scheduler/generate.test.ts`

Si el último día del mes anterior es sábado con asignaciones MF/TF, el generador pre-siembra el `weekendPlan` con esa clave antes del bucle principal. El primer día del mes nuevo (domingo) hereda el mismo empleado y tipo de turno. Cubre el caso `MF → MF` y `TF → TF`.

---

### Tarea 2 — Avisos de cobertura crítica

**Archivos**: `lib/schedules/generate.ts`, `app/api/schedules/generate/route.ts`

Antes de la generación, se calcula `availablePerDay` (empleados no bloqueados por V/B/manual por día). Si un día tiene 0 disponibles → warning `⚠️ Sin cobertura el DD/MM`; si tiene 1 → warning de atención. El campo `coverageWarnings[]` se incluye en la respuesta de `POST /api/schedules/generate`. La función `repairAllDailyCoverage` omite días con 0 disponibles y evita reparar T/TF en días con solo 1.

---

### Tarea 3 — Rol SUPER_VIEWER

**Archivos**: `lib/auth/permissions.ts`, `types/next-auth.d.ts`, `app/api/auth/[...nextauth]/route.ts`, `prisma/schema.prisma`, `prisma/seed.ts`, `components/layout/header.tsx`, `app/page.tsx`

Nuevo rol global `SUPER_VIEWER`: puede ver todos los proyectos y cuadrantes sin membresía explícita. No puede editar celdas, generar ni usar PrepPanel. Header muestra badge "Viewer" gris con `data-testid="role-badge"`. Funciones nuevas: `isSuperViewer()`, `canEditProject()`. Migración: `20260522124917_sprint18_super_viewer_role`.

**Credenciales de prueba**: `viewer@cuadrantes.local` / `Viewer1234!`

---

### Tarea 4 — Diferenciación visual de columnas

**Archivo**: `components/schedule/schedule-grid.tsx`

| Columna | Header antes | Header ahora | Celda antes | Celda ahora |
|---------|-------------|-------------|-------------|-------------|
| Sáb/Dom | `bg-gray-100 text-gray-600` | `bg-blue-100 text-blue-800` | `bg-gray-50` | `bg-blue-50` |
| Festivo | `bg-red-100 text-red-700` | `bg-red-200 text-red-800` | sin fondo | `bg-red-50` |

---

### Tarea 5 — Esquema de colores unificado

**Archivo**: `lib/constants/shift-colors.ts`

| Familia | Tipos | Color nuevo | Color anterior |
|---------|-------|-------------|----------------|
| Mañana | M, MF | `#F97316` naranja | `#FF9800` / `#E65100` |
| Tarde | T, TF | `#3B82F6` azul | `#2196F3` / `#0D47A1` |
| Noche | N, NF | `#16A34A` verde | `#4CAF50` / `#1B5E20` |
| Vacaciones | V | `#111827` negro | `#B45309` ámbar |
| Baja | B | `#111827` negro | `#7C3AED` morado |

---

### Tarea 6 — Snapshot y undo de generación

**Archivos**: `app/api/schedules/snapshot/route.ts` (nuevo), `app/api/schedules/snapshot/restore/route.ts` (nuevo), `app/page.tsx`, `prisma/schema.prisma`

Antes de generar, `doGenerate()` llama a `POST /api/schedules/snapshot` que guarda el estado actual en `ScheduleSnapshot` (upsert por `projectId+month+year`). Si la operación es exitosa, aparece el botón "↩ Deshacer" en la cabecera. Al pulsarlo, `POST /api/schedules/snapshot/restore` elimina las asignaciones generadas del mes y restaura el snapshot. El botón desaparece al navegar de mes o al editar manualmente una celda.

---

### Bugfixes adicionales (detectados en pruebas)

#### B1 — V/B con fondo negro
V (Vacaciones) y B (Baja) cambian a `#111827` (negro casi puro) con texto blanco, para máxima visibilidad y diferenciación respecto a turnos de trabajo.

#### B2 — Bloque N cross-month no respetaba vacaciones
**Archivo**: `lib/schedules/generate.ts`

El código que planificaba la continuación del bloque nocturno en el mes nuevo (`nightPlan.set(empKey, "N")` y post-rest `"D"`) no comprobaba `existingDates`. Si el empleado tenía V/B en los primeros días del mes nuevo, se planificaban igualmente noches y descansos. El fix añade `if (existingDates.has(empKey)) break` en los tres bucles de continuación (mid-block N, 7N completo, post-rest parcial).

#### B3 — Distribución desequilibrada de fines de semana
**Archivo**: `lib/schedules/generate.ts`

`_pickWeekendPackageEmployee` ordenaba candidatos por `mCount`/`tCount`, penalizando a empleados con muchos turnos entre semana aunque tuviesen 0 weekends. Se añade `weekendCount: number` a `EmpState` (incrementado en `reserveWeekendPattern`) y se usa como criterio de ordenamiento primario, garantizando que el empleado con menos fines de semana trabajados tiene mayor prioridad.

---

## Modelo de datos nuevos

### `ScheduleSnapshot`
```prisma
model ScheduleSnapshot {
  id        String   @id @default(cuid())
  projectId String
  month     Int
  year      Int
  snapshot  String   // JSON: [{ employeeId, date, shiftType }]
  createdAt DateTime @default(now())
  @@unique([projectId, month, year])
}
```

---

## Tests

| Suite | Antes | Después | Nuevos |
|-------|-------|---------|--------|
| Unit (`tests/unit/`) | 234 | 257 | +23 |
| E2E declarados | CP-01..CP-114 | CP-01..CP-128 | +14 |

**Nuevos describes unitarios**:
- `Sprint 18 Tarea 1: continuidad cross-month de pack Sáb+Dom` (4 tests)
- `Sprint 18 Tarea 2: alta concentración de vacaciones` (3 tests)
- `Sprint 18 Bugfix: continuidad N cross-month se interrumpe con vacaciones` (3 tests)
- `Sprint 18 Bugfix: weekendCount equilibra la distribución de fines de semana` (2 tests)
- Actualizados: `GLOBAL_ROLES` (longitud 3), `isSuperViewer`, `canEditProject`, `hasAdminAccess SUPER_VIEWER`, `V/B color negro`

**Nuevos E2E**:
- CP-115..CP-117: continuidad cross-month weekends
- CP-118..CP-119: SUPER_VIEWER restricciones
- CP-120..CP-123: visualización grid
- CP-124..CP-125: snapshot/undo
- CP-126: V/B color negro
- CP-127: equidad de fines de semana
- CP-128: endpoint restore + label botón

---

## Credenciales de prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin@cuadrantes.local` | `Admin1234!` | SUPER_ADMIN |
| `pm@cuadrantes.local` | `Pm1234!` | USER + PROJECT_ADMIN |
| `viewer@cuadrantes.local` | `Viewer1234!` | SUPER_VIEWER (**nuevo**) |
| `tecnico1@cuadrantes.local` | `Tecnico1234!` | USER + EMPLOYEE |

---

## Casos de prueba para QA

| ID | Descripción | Resultado esperado |
|----|-------------|-------------------|
| CP-115 | Mes termina sáb con MF → dom del mes siguiente mismo empleado MF | ✅ Mismo empId y shiftType |
| CP-116 | Generación cross-month: domingo inicial hereda turno del sábado previo | ✅ Continuidad pack |
| CP-117 | Regenerar mes anterior no rompe paquete del mes siguiente | ✅ Mismo count en Nov-1 |
| CP-118 | SUPER_VIEWER puede ver cuadrante, badge "Viewer", sin botón generar | ✅ Solo lectura |
| CP-119 | SUPER_VIEWER no ve PrepPanel ni ShiftEditor | ✅ Elementos ocultos |
| CP-120 | Columnas sáb/dom con fondo azul, festivos con fondo rojo | ✅ bg-blue-100 / bg-red-200 |
| CP-121 | M y MF mismo naranja #F97316 | ✅ Color unificado |
| CP-122 | T y TF mismo azul #3B82F6 | ✅ Color unificado |
| CP-123 | N y NF mismo verde #16A34A | ✅ Color unificado |
| CP-124 | Botón "↩ Deshacer" aparece tras generar | ✅ Visible con texto "Deshacer" |
| CP-125 | Restore snapshot devuelve al estado anterior | ✅ restored = count inicial |
| CP-126 | V y B con fondo negro #111827 | ✅ Color negro |
| CP-127 | Ningún empleado monopoliza todos los fines de semana | ✅ Ratio máx/mín < 3 |
| CP-128 | /snapshot/restore devuelve 200; botón dice "Deshacer" no "Deshacer generación" | ✅ API OK + label correcto |
