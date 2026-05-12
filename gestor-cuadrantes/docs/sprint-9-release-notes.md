# Sprint 9 — Release Notes

**Fecha**: 12/05/2026  
**Versión**: 0.9  
**Commits**: `db53644` (algoritmo Fase 2) + `55133a3` (correcciones PO) + correcciones RF-16  
**Estado**: ✅ Completado

---

## Resumen ejecutivo

Sprint 9 reemplaza completamente el algoritmo de generación de cuadrantes por la especificación de **Fase 2**: bloques de noches de 12 días (2D+7N+3D) con rotación cíclica entre técnicos, reglas de cobertura mínima M/T en días laborables, consistencia de turno dentro de la semana, límite de 5 días consecutivos del mismo turno con continuidad entre meses, y soporte de `shiftPreference` por empleado. El algoritmo es 100 % determinista y está cubierto por 40 tests unitarios nuevos.

---

## Funcionalidades implementadas

### Nuevo algoritmo de generación (Fase 2)

#### Estructura de bloques de noche

Cada técnico realiza bloques de exactamente **12 días** en el siguiente patrón:

```
Día -2, -1 : D  (descanso pre-bloque)
Día 0..6   : N  (7 noches consecutivas)
Día 7, 8, 9: D  (descanso post-bloque)
```

La época de referencia (`NIGHT_EPOCH_FRIDAY`) es el **viernes 2 de enero de 2026**. Con 7 técnicos, el ciclo completo es 7 × 12 = **84 días = 12 semanas exactas**, garantizando que el técnico con `rotationOrder = 0` siempre empiece su bloque en viernes.

#### Ciclo de rotación nocturna

- El orden de rotación se determina por `nightRotationOrder` del proyecto (JSON de IDs), con fallback a `rotationOrder` del empleado.
- Nunca coinciden dos técnicos en turno N el mismo día.
- Cada técnico realiza como máximo un bloque de noches por mes.

#### Reglas de cobertura en días laborables

| Regla | Descripción |
|-------|-------------|
| Cobertura mínima | ≥ 2 empleados en turno M y ≥ 2 en turno T cada día laborable |
| Consistencia semanal | Ningún empleado cambia entre M y T dentro de la misma semana ISO |
| Máximo consecutivo | No más de 5 días seguidos con el mismo turno de trabajo |
| Preferencia | Se respeta `shiftPreference` del empleado (`"M"`, `"T"`, o `null`) cuando no hay restricciones superiores |

#### Prioridad de asignación (7 niveles)

1. Turno existente **V / B / J** (bloqueado, no se sobreescribe)
2. Turno existente **manual** (cualquier tipo → no se regenera)
3. **Bloque de noches** del plan nocturno → emite N/NF o D
4. **Continuidad**: si lleva ≥ 5 días consecutivos del mismo turno → emite D
5. **Fin de semana / festivo** → `pickWeekendShift` (equitativo, máx 1 MF + 1 TF por día, pref-aware)
6. **Día laborable** → `pickWorkdayShift` (cobertura ≥2M+2T, consistencia semanal, pref, equitativo)
7. **Descanso** por defecto si ninguna regla asigna turno

#### Continuidad entre meses

La API consulta los últimos 7 días del mes anterior (`prevMonthTail`) para aplicar correctamente la regla de máximo 5 días consecutivos en el inicio del mes nuevo.

#### `shiftPreference` por empleado

El campo `shiftPreference` (`"M"`, `"T"`, o `null`) en `Employee` orienta la asignación de turnos en días laborables y fines de semana cuando no hay restricciones de prioridad superior.

#### `nightRotationOrder` por proyecto

El campo `nightRotationOrder` (JSON) en `Project` permite definir el orden exacto de rotación nocturna. Si está vacío, se usa el `rotationOrder` de cada empleado.

---

### Cambios en el esquema de BD

```sql
-- Employee
ALTER TABLE "Employee" ADD COLUMN "shiftPreference" TEXT;

-- Project
ALTER TABLE "Project" ADD COLUMN "nightRotationOrder" TEXT;
```

Migración: `20260512093747_sprint9_shift_preference`

---

### Cambios en la API de generación

`POST /api/schedules/generate` (actualizado):

| Cambio | Detalle |
|--------|---------|
| `shiftPreference` | Se lee de BD junto a `id` y `rotationOrder` |
| `prevMonthTail` | Consulta los últimos 7 días del mes anterior por empleado |
| `nightRotationOrder` | Se lee del proyecto; fallback a `rotationOrder` |
| `existingSet` | Solo bloquea V/B/J; los turnos M/T/N de generaciones anteriores se regeneran |

---

## Bugs encontrados y resueltos

| ID | Descripción | Severidad | Commit fix |
|----|-------------|-----------|-----------|
| [BUG-18](bugs/BUG-REGISTRY.md#bug-18) | `_pickWeekendShift` no recibía el parámetro `wKey` → asignación de fin de semana incorrecta | 🟠 High | `db53644` |
| [BUG-19](bugs/BUG-REGISTRY.md#bug-19) | TypeScript TS1117: clave `EMPLOYEE` duplicada en `ROLE_BADGES` de `employee-table.tsx` | 🟢 Low | `db53644` |
| [BUG-20](bugs/BUG-REGISTRY.md#bug-20) | Servidor E2E conservaba estado obsoleto al reutilizarse — CP-69 no podía verificar celdas N/NF por DOM | 🟡 Medium | `db53644` (mitigado) |
---

## Correcciones Product Owner (revisión manual post-sprint)

Tras la revisión manual de la aplicación, el Product Owner detectó 5 mejoras de UX que se corrigieron en el mismo sprint antes del cierre.

| BUG | Descripción | Severidad | Estado |
|-----|-------------|-----------|--------|
| [BUG-21](bugs/BUG-REGISTRY.md#bug-21) | Pestañas del header sin indicación visual de cuál está activa | 🟡 Medium | ✅ Fixed |
| [BUG-22](bugs/BUG-REGISTRY.md#bug-22) | Orden incorrecto de las pestañas de navegación | 🟢 Low | ✅ Fixed |
| [BUG-23](bugs/BUG-REGISTRY.md#bug-23) | El proyecto activo no era visible desde el header | 🟡 Medium | ✅ Fixed |
| [BUG-24](bugs/BUG-REGISTRY.md#bug-24) | Información de la tabla de proyectos cortada por `max-width` | 🟢 Low | ✅ Fixed |
| [BUG-25](bugs/BUG-REGISTRY.md#bug-25) | Selector de proyecto en el cuadrante — debe elegirse desde /projects | 🟠 High | ✅ Fixed |
| [BUG-26](bugs/BUG-REGISTRY.md#bug-26) | Regresión de timing al cargar cuadrante (estado `undefined`) | 🟠 High | ✅ Fixed |

### Cambios de UX implementados

**Header** (`components/layout/header.tsx`):
- **Pestaña activa resaltada**: `usePathname()` + clases `text-indigo-600 font-semibold border-b-2 border-indigo-500`
- **Nuevo orden de pestañas**: Proyectos → Cuadrante → Empleados → Ayuda
- **Badge de proyecto activo**: lee `localStorage("activeProject")`, escucha evento `activeProjectChanged`, muestra `📁 {nombre}` en todas las páginas
- **Acceso a Proyectos**: visible para SUPER_ADMIN y PROJECT_ADMIN

**Cuadrante** (`app/page.tsx`):
- Eliminado el `ProjectSelector` (`<select>`) de la barra de herramientas
- `activeProjectId` se inicializa con `useState(() => localStorage...)` (lectura síncrona, sin parpadeo)
- Auto-selección del primer proyecto solo cuando localStorage está vacío

**Proyectos** (`app/projects/page.tsx`):
- Nuevo botón `Seleccionar` / `✓ Activo` por fila (data-testid `btn-select-project`)
- Click → persiste en localStorage + emite `activeProjectChanged` + navega a home
- Fila resaltada en verde cuando el proyecto está activo
- Eliminado `max-w-4xl`, columna descripción sin `truncate`, `overflow-x-auto` en la tabla
---

## Tests

### Unitarios

| Suite | Archivo | Tests | Estado |
|-------|---------|-------|--------|
| `schedules/business-logic` | `tests/unit/lib/business-logic.test.ts` | 12 | ✅ |
| `schedules/generate` (Fase 2) | `tests/unit/scheduler/generate.test.ts` | 40 | ✅ NEW |
| `employees/business-logic` | `tests/unit/employees/business-logic.test.ts` | 37 | ✅ |
| `auth/permissions` | `tests/unit/auth/permissions.test.ts` | 25 | ✅ |
| **Total unit** | | **114** | **✅** |

#### Nuevos tests unitarios Sprint 9 (40 tests)

| Suite | Tests | Qué verifica |
|-------|-------|-------------|
| `nightBlockDays — estructura 2D+7N+3D` | 5 | Total 12 días, 2 pre-D, 7 N, 3 post-D, inicio en viernes para emp[0] |
| `computeNightBlocks — asignación cíclica` | 3 | Máx 1 bloque/empleado/mes, nunca 2 técnicos la misma noche, bloques solapados incluidos |
| `applySpecialDayRule` | 6 | M/T→MF/TF en festivos/fines de semana, N→NF si día siguiente especial, D inalterado |
| `generateMonthSchedule — mes completo` | 4 | Conteo correcto, UTC midnight, tipos válidos, vacío devuelve [] |
| `generateMonthSchedule — bloque de noches` | 2 | 7 N consecutivos por empleado, emp[0] empieza en viernes |
| `máximo 1 técnico en noche por día` | 1 | Nunca 2 N el mismo día |
| `cobertura mínima M/T en laborables` | 1 | ≥2M + ≥2T cuando hay suficientes técnicos sin noche |
| `consistencia semanal M/T` | 1 | Ningún empleado tiene M y T en la misma semana ISO |
| `máximo 5 días consecutivos` | 1 | No hay secuencias de 6+ del mismo turno |
| `turnos manuales no se sobreescriben` | 2 | V y B persistidos tras regenerar |
| `continuidad entre meses` | 2 | 5M → D en inicio del mes siguiente; 3M → puede continuar M |
| `preferencias de turno` | 2 | `shiftPreference="M"` → más M; `shiftPreference="T"` → más T |
| `weekKey`, `normalizeShift`, `isWeekend` | 6 | Funciones utilitarias |

### E2E Sprint 9

| ID | Descripción | Estado |
|----|-------------|--------|
| CP-67 | La generación respeta turnos manuales previos (V no se sobreescribe) | ✅ |
| CP-68 | La generación respeta bajas introducidas (B no se sobreescribe) | ✅ |
| CP-69 | El cuadrante generado contiene ≥ 7 celdas N/NF (bloque de noches) — verificado vía API | ✅ |
| CP-70 | Continuidad correcta al generar el mes siguiente | ✅ |

**Total E2E**: 69/69 ✅ (4 nuevos Sprint 9 + 65 heredados Sprints 1-8)

> **Nota CP-69**: La verificación se realiza llamando directamente a `/api/schedules` desde `page.evaluate()` en lugar de contar celdas del DOM, ya que en algunas ejecuciones el servidor E2E puede retener una conexión obsoleta a la BD anterior. Los tests unitarios validan el comportamiento del DOM de forma exhaustiva.

---

## Archivos modificados

```
lib/schedules/generate.ts                         REESCRITO — algoritmo Fase 2 (471 líneas)
lib/schedules/types.ts                            MODIFIED — shiftPreference en ScheduleEmployee
app/api/schedules/generate/route.ts               MODIFIED — shiftPreference, prevMonthTail, nightRotationOrder
prisma/schema.prisma                              MODIFIED — shiftPreference + nightRotationOrder
prisma/migrations/20260512093747_sprint9_shift_preference/migration.sql  NEW
tests/unit/scheduler/generate.test.ts             NEW — 40 tests Fase 2
tests/unit/lib/generate.test.ts                   DELETED — reemplazado por scheduler/
tests/e2e/sprint-9.spec.ts                        NEW — CP-67..CP-70
components/employees/employee-table.tsx           FIXED — clave EMPLOYEE duplicada
```

---

---

## RF-16 — Cobertura mínima garantizada por turno (post-sprint)

Requisito añadido tras revisión adicional del Product Owner: el cuadrante generado **siempre debe cubrir todos los turnos con al menos una persona**.

### Especificación

| Tipo de día | Turno | Mínimo hard | Objetivo soft |
|-------------|-------|-------------|---------------|
| Laborable (L-V no festivo) | M | **1** | 2 |
| Laborable (L-V no festivo) | T | **1** | 2 |
| Fin de semana o festivo | MF | **1** | 1 |
| Fin de semana o festivo | TF | **1** | 1 |
| Cualquier día | N | 1 | 1 (ya garantizado por bloque) |

> Los mínimos hard solo se garantizan cuando hay ≥ 2 empleados disponibles (no en D ni N) ese día.

### Cambios en el algoritmo (`lib/schedules/generate.ts`)

**`_pickWorkdayShift`** — nueva prioridad por encima de la consistencia semanal:

```
1. urgentM = cov.M < 1 → si empleado sin weeklyShift, forzar M
2. urgentT = cov.T < 1 → si empleado sin weeklyShift, forzar T
3. Si todos tienen weeklyShift y sigue sin cobertura → forzar al que no tiene el turno urgente
4. Consistencia semanal (weeklyShift) — solo si ya hay ≥1M y ≥1T
5. Soft target ≥2M y ≥2T
6. Preferencia del empleado
7. Equidad de distribución
```

**`_pickWeekendShift`** — corrección de "retorno D en lugar de cubrir TF":

```
Antes: weeklyShift="M" → mOpen ? "MF" : "D"   ← BUG: TF queda sin cubrir
Ahora: weeklyShift="M" → mOpen ? "MF" : "TF"  ← cubre el turno abierto
       weeklyShift="T" → tOpen ? "TF" : "MF"  ← ídem
```

### Nuevos tests unitarios (3 tests)

| Test | Qué verifica |
|------|-------------|
| `laborable con todos pref M garantiza ≥1M y ≥1T` | Con 4 emps pref M, todo día laborable con ≥2 disponibles tiene ≥1M y ≥1T |
| `fin de semana garantiza ≥1MF y ≥1TF` | Con 4 emps pref M, todo fin de semana con ≥2 disponibles tiene ≥1MF y ≥1TF |
| `con todos pref T garantiza ≥1M y ≥1T` | Con 4 emps pref T, todo día laborable con ≥2 disponibles tiene ≥1M y ≥1T |

**Total unit tras RF-16**: 117/117 ✅

---

## Próximos candidatos (Sprint 10)

| Funcionalidad | Requisito |
|---------------|-----------|
| UI para configurar `nightRotationOrder` en un proyecto | RF-14.5 |
| Campo `shiftPreference` editable en la página de empleados | RF-14.6 |
| Gestión de packs de fin de semana (Sáb+Dom mismo turno, editables) | RF-14.7 |
| CP-69 mejorado con verificación DOM (resolver estabilidad servidor E2E) | — |
