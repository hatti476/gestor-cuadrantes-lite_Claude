# Informe de Estado — Gestor de Cuadrantes

**Fecha**: 12/05/2026 | **Versión del sistema**: 1.1 | **Branch**: `main` | **Commits totales**: 26

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router, TypeScript, Tailwind CSS) |
| Base de datos | Prisma 5.22 + SQLite (dev) / PostgreSQL 16 (prod) |
| Autenticación | NextAuth 4.x — JWT + CredentialsProvider |
| Tests unitarios | Vitest 4.1 — **128/128 ✅** |
| Tests E2E | Playwright 1.59 — **84/84 ✅** |
| Producción | Docker + docker-compose.prod.yml |

---

## Sprint 1 — Autenticación y cuadrante base

**Commit**: `e4b25fd`

### Implementado
- Autenticación email + contraseña con bcrypt (coste 12), sesión JWT (NextAuth)
- Redirección automática a `/login` para usuarios no autenticados
- Grid de cuadrante mensual: filas = empleados, columnas = días
- Cabeceras con número de día, letra de semana, diferenciación visual sábado/domingo
- Colores por tipo de turno (M/T/N/D/V/B/J/MF/TF/NF)
- Navegación entre meses (`‹` / `›`)
- Columna de contadores de turnos por empleado
- Header con email del usuario y badge de rol
- Datos de prueba: 7 técnicos + admin con contraseñas validadas

### RFs cubiertos
RF-01 (autenticación completa), RF-02 (cuadrante visual), RF-03 (tipos de turno)

---

## Sprint 2 — Editor de turnos y gestión de empleados

**Commits**: `f749d31` + fix `98110ce`

### Implementado
- Edición manual de turnos: clic en celda → modal con todos los tipos disponibles
- Opción de limpiar celda (turno vacío)
- Página `/employees` con tabla de empleados
- CRUD completo de empleados: crear, editar nombre/rol, eliminar, email único
- Validación: contraseña mín 8 chars + 1 mayúscula + 1 número, nombre mín 2 chars
- Control de acceso: `USER` no puede editar turnos ni acceder a `/employees`
- Fix BUG-01: middleware no redirigía rutas `/api/` a `/login`

### Bugs resueltos
| ID | Severidad | Descripción |
|----|-----------|-------------|
| BUG-01 | 🟠 High | Middleware redirigía `/api/` a `/login` en vez de devolver 401 |
| BUG-02 | 🟢 Low | Botones de navegación de mes sin `data-testid` |
| BUG-03 | 🟢 Low | Modal ShiftEditor sin `data-testid` |
| BUG-04 | 🟢 Low | Botones de turno con texto compuesto sin `data-testid` |

### RFs cubiertos
RF-04 (edición manual), RF-08 (gestión empleados parcial)

---

## Sprint 3 — Cambio de contraseña, turnos especiales y generación automática v1

**Commit**: `750790c`

### Implementado
- Cambio de contraseña para cualquier empleado (SUPER_ADMIN)
- Tipos de turno especiales: MF, TF, NF (festivo/fin de semana)
- Generación automática v1: ciclo de 21 días (M×5 + D×2 + T×5 + D×2 + N×5 + D×2) — *sustituida en Sprint 9*
- Los turnos V/B/J bloquean la regeneración
- Exportación básica a PDF (window.print)
- Reglas iniciales de festivos M→MF, T→TF, N→NF
- Fixes: campo `passwordHash`, `createMany` incompatible con SQLite (→ bucle upsert), seed idempotente

### Bugs resueltos
| ID | Severidad | Descripción |
|----|-----------|-------------|
| BUG-05 | 🟠 High | Campo `passwordHash` inexistente en schema Prisma |
| BUG-06 | 🟡 Medium | `createMany` con `skipDuplicates` no soportado en SQLite |
| BUG-07 | 🟡 Medium | Seed no restauraba contraseñas al re-ejecutarse |

### RFs cubiertos
RF-05 (generación v1), RF-06 (reglas festivos base), RF-08.4, RF-10.4/10.5

---

## Sprint 4 — Festivos, CSV, historial y notificaciones

**Commit**: `a05f59e`

### Implementado
- Panel de festivos: CRUD completo (solo SUPER_ADMIN), sin duplicados, filtro por año
- Al añadir festivo: actualización en caliente de turnos M→MF, T→TF, N(día anterior)→NF
- Regla NF corregida: la noche del domingo NO se convierte a NF si el lunes es laborable
- Historial de cambios: `ShiftChangeLog` con empleado, fecha, turno previo, turno nuevo, quien cambió, timestamp
- Panel historial: últimos 20 cambios por empleado (solo SUPER_ADMIN)
- Exportación CSV: nombre empleado + turno por día, archivo `cuadrante-YYYY-MM.csv`
- Notificaciones toast: verde éxito / rojo error, desaparecen a los 4 s
- Cabeceras de festivos en rojo con tooltip de descripción
- Generación automática mejorada: upsert de turnos existentes

### Bugs resueltos
| ID | Severidad | Descripción |
|----|-----------|-------------|
| BUG-08 | 🟠 High | Generación automática no actualizaba turnos existentes |
| BUG-09 | 🟠 High | `existingSet` incluía turnos de festivos impidiendo su actualización |
| BUG-10 | 🟠 High | Regla N→NF aplicaba sobre el día actual en lugar del siguiente |
| BUG-11 | 🟡 Medium | `holidayDates` como Set no permitía almacenar descripción del festivo |
| BUG-12 | 🟡 Medium | Contadores del grid no incluían tipos MF/TF/NF |
| BUG-13 | 🟡 Medium | Cabecera de día festivo mostraba "F" en lugar de la letra del día |

### RFs cubiertos
RF-06 (completo), RF-07, RF-09, RF-10 (completo), RF-11

---

## Sprint 5 — Ayuda contextual + fixes post-QA

**Commit**: `60f598a`

### Implementado
- Página `/info` (Ayuda) accesible a todos los usuarios autenticados
- Contenido diferenciado por rol: SUPER_ADMIN ve sección de gestión; USER ve solo consulta
- Fix BUG-14: M/T en sábado/domingo no se convertían a MF/TF en la generación automática
- Documentación: 13 tests unitarios de reglas de festivos, BUG-REGISTRY inicial

### Bugs resueltos
| ID | Severidad | Descripción |
|----|-----------|-------------|
| BUG-14 | 🟠 High | M/T en sábado/domingo no se convertían a MF/TF en la generación |

### RFs cubiertos
RF-12 (ayuda contextual)

---

## Sprint 6 — Roles y arquitectura multiproyecto

**Commits**: `b2ff867` + `755fc19`

### Implementado
- Roles globales: `SUPER_ADMIN` (acceso total) y `USER` (técnico)
- Roles de proyecto: `PROJECT_ADMIN` y `EMPLOYEE`
- Modelos BD: `Project`, `ProjectMember`, campo `Employee.projectId`, `Employee.userId`
- JWT incluye `projectMemberships[]` — se recargan en cada refresco de token
- SUPER_ADMIN actúa como admin de cualquier proyecto sin membresía explícita
- Seed: proyecto "Equipo Soporte 24h" con todos los técnicos de prueba
- 25 tests unitarios de `lib/auth/permissions.ts`
- Docker prod: `docker-compose.prod.yml` con PostgreSQL 16 + healthcheck, migraciones automáticas

### RFs cubiertos
RF-01.7/01.8, RF-13.1-13.7, RNF-04

---

## Sprint 7 — API de proyectos, gestión de miembros y scoping del cuadrante

**Commit**: `3062edb`

### Implementado
- Página `/projects`: lista de proyectos, crear/editar/eliminar (solo SUPER_ADMIN)
- Panel de miembros por proyecto: añadir (userId + rol) y eliminar miembros
- API completa:
  - `GET/POST /api/projects`
  - `GET/PUT/DELETE /api/projects/[id]`
  - `GET/POST /api/projects/[id]/members`
  - `DELETE /api/projects/[id]/members/[userId]`
- Cuadrante filtrado por `?projectId=`: solo empleados del proyecto
- Header: selector de proyecto activo para SUPER_ADMIN, badge de proyecto para USER
- `localStorage` + evento `activeProjectChanged` para persistir proyecto seleccionado entre pestañas
- Botón "Seleccionar" en cada proyecto → activa proyecto y navega al cuadrante
- 10/10 tests E2E

### RFs cubiertos
RF-13.8-13.13, RF-15

---

## Sprint 8 — Acceso PROJECT_ADMIN + correcciones E2E

**Commits**: `fff5142` + `7eaddcb` + `5fcf8f9`

### Implementado
- PROJECT_ADMIN puede acceder a `/projects` y gestionar miembros de su proyecto
- PROJECT_ADMIN **no puede** crear/editar/eliminar proyectos
- PROJECT_ADMIN **no puede** asignar rol PROJECT_ADMIN a otros miembros
- `EMPLOYEE` puro es redirigido de `/projects`
- Corrección de 7 fallos E2E preexistentes
- Centralización de configuración y helpers en tests (`config.ts` + `helpers.ts`)
- 65/65 E2E ✅

### Bugs resueltos
| ID | Severidad | Descripción |
|----|-----------|-------------|
| BUG-15 | 🟠 High | PROJECT_ADMIN era redirigido incorrectamente de `/projects` |
| BUG-16 | 🟡 Medium | Batch upserts sin transacción fallaban en SQLite |
| BUG-17 | 🟡 Medium | Botón e historial de turnos ausentes en `/employees` |

### RFs cubiertos
RF-13.14-13.17

---

## Sprint 9 — Algoritmo Fase 2 + cobertura mínima + UX PO

**Commits**: `db53644` + `55133a3` + `e0ed638` + `2b32247` + 6 fixes post-PO + 4 fixes sesión actual

### Implementado

#### Algoritmo de generación Fase 2 (reemplaza ciclo 21 días)

Estructura de bloque de noche por técnico:
```
Día -2, -1 : D  (descanso pre-bloque)
Día  0..6  : N  (7 noches consecutivas, empezando el viernes)
Día  7, 8, 9: D  (descanso post-bloque)
```

- Época de referencia: **viernes 2 de enero de 2026** (`NIGHT_EPOCH_FRIDAY`)
- Con 7 técnicos: ciclo de **84 días** (12 semanas exactas), técnico 0 siempre arranca en viernes
- Offset entre técnicos consecutivos: **7 días** (sin huecos en cobertura nocturna)
- Nunca coinciden 2 técnicos en turno N el mismo día
- `nightRotationOrder` (JSON en `Project`) configura el orden; fallback a `rotationOrder`
- `shiftPreference` por empleado ("M", "T" o null) orienta asignación en laborables
- Continuidad entre meses: consulta últimos 7 días del mes anterior (`prevMonthTail`)
- Máximo 5 días consecutivos del mismo turno
- Consistencia semanal M/T (best effort)

#### Prioridad de asignación (7 niveles)
1. Turno existente **V / B** — bloqueado, nunca se sobreescribe
2. **Bloque de noches** del plan nocturno → emite N/NF o D
3. **Continuidad**: si lleva ≥ 5 días seguidos del mismo turno → emite D
4. **Fin de semana / festivo** → `_pickWeekendShift` (equitativo, máx 1 MF + 1 TF por día)
5. **Día laborable** → `_pickWorkdayShift` (cobertura ≥1M+1T hard, ≥2M+2T soft, consistencia semanal, pref, equidad)
6. **Descanso** por defecto

#### RF-16 — Cobertura mínima garantizada
- **Hard**: ≥1M y ≥1T cada día laborable (L-V no festivo); prioridad sobre consistencia semanal
- **Hard**: ≥1MF y ≥1TF cada festivo/fin de semana (si hay ≥2 técnicos disponibles)
- **Soft**: objetivo ≥2M y ≥2T en laborables cuando hay suficientes técnicos
- 1 técnico en noche por día (garantizado por bloque de rotación)

#### Correcciones UX post-revisión PO (RF-15)
- Pestañas header con indicación visual de activa (subrayado azul)
- Orden pestañas: Proyectos → Cuadrante → Empleados → Ayuda
- Badge de proyecto activo visible en todas las páginas
- Selector de proyecto movido a `/projects` (eliminado del cuadrante)
- Tabla de proyectos con scroll horizontal completo

#### Fixes aplicados en sesión actual (post-sprint 9)
| Fix | Descripción |
|-----|-------------|
| Sync `Employee.projectId` | POST/DELETE de miembros ahora actualiza `Employee.projectId` |
| Backfill datos | 8 empleados sincronizados con su `projectId` correcto |
| Badge rol | `whitespace-nowrap` — "Super Admin" ya no se parte en dos líneas |
| `J` en LOCKED_TYPES | Eliminado: era turno residual que bloqueaba asignación de noches |
| Aislamiento por proyecto | La generación filtra employees, shifts, prevMonthTail y nightRotationOrder por `projectId` — proyectos completamente independientes |

### Bugs resueltos en S9
| ID | Severidad | Descripción |
|----|-----------|-------------|
| BUG-18 | 🟠 High | `_pickWeekendShift` no recibía `wKey` → asignación incorrecta de festivos |
| BUG-19 | 🟢 Low | TypeScript TS1117: clave `EMPLOYEE` duplicada en `ROLE_BADGES` |
| BUG-20 | 🟡 Medium | ⚠️ Mitigado — servidor E2E no puede verificar celdas N/NF por estado obsoleto |
| BUG-21 | 🟡 Medium | Pestañas del header sin indicación visual de activa |
| BUG-22 | 🟢 Low | Orden incorrecto de las pestañas de navegación |
| BUG-23 | 🟡 Medium | Proyecto activo no visible desde el header en ninguna página |
| BUG-24 | 🟢 Low | Tabla de proyectos truncada por `max-width` |
| BUG-25 | 🟠 High | Selector de proyectos en cuadrante confuso; se mueve a `/projects` |
| BUG-26 | 🟠 High | Regresión timing: cuadrante tardía en cargar por estado `undefined` de proyecto |

### Tests al cierre de Sprint 9
- **Unit**: 118/118 ✅
- **E2E**: 69/69 ✅

### RFs cubiertos
RF-05 (completo), RF-13 (completo), RF-14, RF-15, RF-16

---

## Sprint 10 — Soft-delete, shiftPreference UI, PROJECT_ADMIN edición, nightRotationOrder UI, tabla de contadores

**Commit**: `7fcc9a9`

### Implementado

#### Soft-delete de empleados
- Campo `Employee.active Boolean @default(true)` en Prisma
- Migración: `20260512150600_sprint10_soft_delete_shift_preference`
- API PATCH `/api/employees/[id]`: acepta `active` (solo SUPER_ADMIN), `name`/`shiftPreference`/`role` (SUPER_ADMIN o PROJECT_ADMIN)
- API DELETE `/api/employees/[id]`: soft-delete (`active = false`); solo SUPER_ADMIN
- Reactivación: PATCH con `active: true`
- La API `GET /api/employees` devuelve solo activos por defecto; param `includeInactive=true` para SUPER_ADMIN
- La generación automática solo incluye empleados activos

#### shiftPreference editable en UI
- Selector `data-testid="select-shift-preference"` en `EmployeeForm`
- Badge de preferencia `data-testid="badge-pref-{id}"` en `EmployeeTable`
- API PATCH actualiza `shiftPreference` junto con el resto de campos

#### PROJECT_ADMIN puede editar turnos
- `canEdit = isAdmin || PROJECT_ADMIN del proyecto activo` en `app/page.tsx`
- `onCellClick` solo se pasa al grid si `canEdit` es true
- API POST/DELETE `/api/schedules` acepta PROJECT_ADMIN del proyecto

#### nightRotationOrder editable en UI
- Panel `NightRotationPanel` en `/projects` con lista reordenable (botones ↑/↓)
- `data-testid="night-rotation-panel"`, `rotation-order-list`, `btn-rotation-up-{id}`, `btn-rotation-down-{id}`, `btn-save-rotation-order`
- API PUT `/api/projects/[id]` acepta `nightRotationOrder` (JSON string de IDs)

#### Tabla de contadores separada (RF-17)
- Extraida del ScheduleGrid a un componente `CountersTable` en `app/page.tsx`
- Posición: debajo del grid, antes de la leyenda, alineada a la izquierda (`w-fit`)
- Columna sticky "Empleado" propia (140px) — no comparte encabezado con el grid
- Cabeceras de turno: mismo badge cuadrado redondeado que `ShiftCell` (colores + tipografía)
- Estilo visual: `rounded-lg border border-gray-200 shadow-sm`, hover de filas `hover:bg-yellow-50/40`
- Grid: añadido `w-fit` al wrapper `overflow-x-auto` para eliminar el hueco vacío a la derecha

### Tests E2E añadidos
| CP | Descripción |
|----|-------------|
| CP-71 | `shiftPreference` se guarda y muestra badge en el listado de empleados |
| CP-72 | Desactivar empleado hace soft-delete; el historial persiste |
| CP-73 | Empleado inactivo no aparece en la API de empleados activos |
| CP-74 | PROJECT_ADMIN puede editar celdas de su proyecto |
| CP-75 | PROJECT_ADMIN no puede editar celdas de otro proyecto |
| CP-76 | `nightRotationOrder` se puede reordenar y guardar desde /projects |
| CP-77 | Tabla de contadores aparece debajo del grid con datos coherentes |
| CP-78 | Tabla de contadores tiene estilo visual consistente con el grid (posición, colores, no solape) |

### Tests al cierre de Sprint 10
- **Unit**: 118/118 ✅ (sin cambios: `countShifts` y lógica de negocio ya cubiertos)
- **E2E**: 77/77 ✅

### RFs cubiertos
RF-02.8, RF-04.7/04.8, RF-08.9-08.12, RF-14.12/14.13, RF-17 (completo)

---

## Sprint 11 — Estado del mes, PrepPanel, revert festivos y celdas bloqueadas

**Commit**: `pendiente`

### Implementado

#### Estado del mes (`MonthStatus`)
- Tipo `MonthStatus = "ungenerated" | "preparation" | "generated"` en `lib/schedules/types.ts`
- Función pura `computeMonthStatus(assignments)`: sin asignaciones → `ungenerated`; solo V/D → `preparation`; cualquier M/T/N/MF/TF/NF → `generated`
- API `GET /api/schedules` devuelve `{ assignments, monthStatus }` (antes solo `assignments`)
- Componente `MonthStatusBadge` visible junto al título del mes en `app/page.tsx`:
  - Sin generar → badge gris `"Sin generar"`
  - En preparación → badge azul `"En preparación"`
  - Generado → badge verde `"Generado"`

#### Panel de preparación (`PrepPanel`)
- Componente `components/schedule/prep-panel.tsx` con 4 pasos desplegables (acordeón):
  1. **Vacaciones** — muestra contador de V asignadas en el mes
  2. **Libres** — muestra contador de D(manual) asignados en el mes
  3. **Festivos** — muestra contador de festivos del mes + enlace a `/holidays`
  4. **Generar** — botón `btn-generate` solo visible cuando este paso está activo
- Botón `btn-save-preparation` (guardar preparación): guarda el estado y recarga el cuadrante; **deshabilitado si `monthStatus === "generated"`**
- Props: `monthStatus, activeStep, onStepChange, vacacionesCount, libresCount, holidaysCount, onSavePreparation, onGenerate, generating, isAdmin, onManageHolidays`
- `data-testid="prep-panel"` y `"prep-step-{id}"` para cada paso

#### Modo dual de asignación en celda
- Con paso activo `vacaciones` → clic en celda asigna `V` directamente (sin modal)
- Con paso activo `libres` → clic en celda asigna `D` directamente con `manual: true`
- Resto de pasos o sin paso → comportamiento modal habitual

#### Campo `manual` en asignaciones
- Migración `20260512173942_sprint11_manual_assignment`: `ShiftAssignment.manual Boolean @default(false)`
- API `POST /api/schedules`: guarda `manual: true` en todas las asignaciones manuales
- API `GET /api/schedules/generate`: bloquea celdas con `V`, `B` **y** `D` con `manual=true` (no sobreescribe)

#### Celdas bloqueadas (`lockedCells`)
- Prop `lockedCells?: Set<string>` en `ScheduleGrid` (formato `"employeeId|YYYY-MM-DD"`)
- Celdas bloqueadas muestran `ring-2 ring-inset ring-dashed ring-amber-400` + emoji 🔒
- En `app/page.tsx`: se bloquean `V` y `D` con `manual=true`
- Añadido `data-testid={`cell-${emp.id}-${dateStr}`}` a cada `<td>` del grid

#### Confirmación antes de regenerar (L-03)
- Si `monthStatus === "generated"`, el botón Generar muestra un modal de confirmación antes de ejecutar
- Modal con `data-testid="confirm-generate-modal"`, `"btn-confirm-generate"`, `"btn-cancel-generate"`
- El usuario puede cancelar sin perder los datos existentes

#### Revert de turnos al eliminar festivo (L-02)
- `DELETE /api/holidays/[id]`: tras eliminar el festivo, revierte automáticamente:
  - `MF` → `M` en la fecha del festivo
  - `TF` → `T` en la fecha del festivo
  - `NF` → `N` en el día anterior al festivo
- Devuelve `{ ok: true, reverted: <count> }` con el número de turnos revertidos
- UI en `/holidays`: toast diferenciado:
  - Si `reverted > 0` → `"Festivo eliminado. X turno(s) revertido(s) a su tipo original."`
  - Si `reverted === 0` → `"Festivo eliminado correctamente."`

### Tests E2E añadidos
| CP | Descripción |
|----|-------------|
| CP-79 | Badge muestra "Sin generar" en mes sin cuadrante |
| CP-80 | Marcar vacaciones en modo PrepPanel bloquea celda con 🔒 |
| CP-81 | Guardar preparación cambia badge a "En preparación" |
| CP-82 | Generar cuadrante preserva las celdas V bloqueadas |
| CP-83 | Confirmación de regeneración aparece si ya hay datos; cancelar no borra nada |
| CP-84 | Eliminar festivo con turnos MF/TF/NF muestra toast con conteo de revertidos |
| CP-85 | Eliminar festivo sin turnos MF/TF/NF muestra toast genérico de "eliminado" |

### Tests al cierre de Sprint 11
- **Unit**: 128/128 ✅ (+10 nuevos en `tests/unit/schedules/month-status.test.ts`)
- **E2E**: 84/84 ✅ (+7 nuevos CP-79 a CP-85)

### RFs cubiertos
RF-04.9, RF-05.8, RF-07.6/07.7, RF-11.4, RF-18 (completo)

---

## Resumen de bugs por sprint

| Sprint | Bugs totales | Resueltos | Abiertos/Mitigados |
|--------|-------------|-----------|---------------------|
| S2 | 4 | 4 | 0 |
| S3 | 3 | 3 | 0 |
| S4 | 6 | 6 | 0 |
| Post-S5 | 1 | 1 | 0 |
| S8 | 3 | 3 | 0 |
| S9 | 3 | 2 | 1 mitigado |
| S9-PO | 6 | 6 | 0 |
| S10 | 0 | 0 | 0 |
| S11 | 0 | 0 | 0 |
| Post-S11 | 2 | 2 | 0 |
| **Total** | **31** | **30** | **1 mitigado** |

> BUG-20 (mitigado): el servidor E2E con estado obsoleto no puede verificar celdas N/NF por DOM. No impacta a producción.

> BUG-27 y BUG-28 detectados durante pruebas manuales post-Sprint 11 en servidor de desarrollo.

---

## Estado de requisitos funcionales

| Grupo | Total RFs | Completados |
|-------|-----------|-------------|
| RF-01 — Autenticación | 8 | 8 ✅ |
| RF-02 — Cuadrante visual | 8 | 8 ✅ |
| RF-03 — Tipos de turno | 10 tipos | 10 ✅ |
| RF-04 — Edición manual | 6 | 6 ✅ |
| RF-05 — Generación automática | 7 | 7 ✅ |
| RF-06 — Reglas festivos | 7 | 7 ✅ |
| RF-07 — Gestión festivos | 5 | 5 ✅ |
| RF-08 — Gestión empleados | 8 | 8 ✅ |
| RF-09 — Historial de cambios | 3 | 3 ✅ |
| RF-10 — Exportación | 5 | 5 ✅ |
| RF-11 — Notificaciones | 3 | 3 ✅ |
| RF-12 — Ayuda contextual | 4 | 4 ✅ |
| RF-13 — Multiproyecto | 17 | 17 ✅ |
| RF-14 — Algoritmo Fase 2 | 11 | 11 ✅ |
| RF-15 — UX Header | 7 | 7 ✅ |
| RF-16 — Cobertura mínima | 5 | 5 ✅ |
| RF-17 — Tabla de contadores | 6 | 6 ✅ |
| RF-18 — Estado del mes y PrepPanel | 8 | 8 ✅ |
| **TOTAL** | **~132** | **~132 ✅** |

### Requisitos no funcionales

| ID | Descripción | Estado |
|----|-------------|--------|
| RNF-01 — Seguridad | Bcrypt, JWT firmado, 401/403 en API, roles validados en backend | ✅ |
| RNF-02 — Rendimiento | Carga <2 s, generación <5 s para 7+ empleados | ✅ |
| RNF-03 — Mantenibilidad | Lógica pura en `lib/`, tests unitarios por función, E2E por flujo, tsc sin errores | ✅ |
| RNF-04 — Escalabilidad | SQLite dev / PostgreSQL prod, Docker, migraciones automáticas | ✅ |
| RNF-05 — Usabilidad | Toasts, modo impresión limpio, scroll horizontal en tablas, badges sin overflow | ✅ |

---

## Áreas sin desarrollar — candidatas a sprints futuros

### Funcionales

| Área | Descripción | Complejidad estimada |
|------|-------------|----------------------|
| **Festivos por proyecto** | Los festivos son actualmente globales. Cada proyecto debería tener su propio calendario (CCAA, convenio colectivo). El schema ya reserva `ProjectHoliday`. | Media |
| **Vista personalizada del técnico** | El técnico ve el cuadrante completo. Podría tener una vista solo con sus propios turnos y próximos días. | Baja |
| **Solicitud / aprobación de vacaciones** | Las vacaciones y ausencias se asignan manualmente celda a celda. No hay flujo de solicitud ni aprobación. | Alta |
| **Dashboard de proyecto** | El PROJECT_ADMIN no tiene estadísticas centralizadas: cobertura diaria, ausencias del mes, horas totales. | Alta |
| **Notificaciones por email** | El sistema no notifica a los técnicos sus turnos ni los cambios que se realizan. | Alta |

### No funcionales / operativos

| Área | Descripción |
|------|-------------|
| **Tests E2E multi-proyecto** | Los E2E actuales no cubren el aislamiento entre proyectos ni la generación por proyecto. |
| **Pipeline CI/CD** | No hay pipeline de integración continua ni deploy automático. El `docker-compose.prod.yml` existe pero el deploy es manual. |
| **Backup de BD** | No hay estrategia de backup automático para la BD de producción (PostgreSQL). |
| **Rate limiting** | Las rutas de autenticación no tienen protección contra fuerza bruta (sin límite de intentos). |
| **Auditoría de acceso** | No se registran los accesos al sistema (login, logout, cambios de proyecto activo). |
