# Sprint 11 — Release Notes

**Fecha**: 12/05/2026  
**Versión**: 1.1  
**Estado**: ✅ Completado

---

## Resumen ejecutivo

Sprint 11 incorpora el **flujo de preparación mensual guiado**: un panel lateral con 4 pasos (Vacaciones, Libres, Festivos, Generar) que acompaña al administrador desde la asignación manual de ausencias hasta la generación del cuadrante. Además, añade un **badge de estado del mes** siempre visible, la **reversión automática de turnos** al eliminar festivos, las **celdas bloqueadas** para proteger vacaciones y días libres manuales, y una **confirmación explícita** antes de sobreescribir un cuadrante ya generado.

---

## Funcionalidades implementadas

### 1. Estado del mes (`MonthStatus`)

El sistema calcula y muestra en tiempo real el estado del mes activo a través de un badge junto al título del mes.

#### Lógica de cálculo (`lib/schedules/types.ts`)

```typescript
type MonthStatus = "ungenerated" | "preparation" | "generated";

function computeMonthStatus(assignments): MonthStatus {
  if (assignments.length === 0) return "ungenerated";
  const GENERATED_TYPES = new Set(["M", "T", "N", "MF", "TF", "NF"]);
  return assignments.some(a => GENERATED_TYPES.has(a.shiftType))
    ? "generated"
    : "preparation";
}
```

| Estado | Condición | Badge |
|--------|-----------|-------|
| `ungenerated` | Sin asignaciones en el mes | Gris — "Sin generar" |
| `preparation` | Solo V y/o D(manual) asignados | Azul — "En preparación" |
| `generated` | Al menos un turno M/T/N/MF/TF/NF presente | Verde — "Generado" |

#### Cambios en la API

- `GET /api/schedules` ahora devuelve `{ assignments: ScheduleAssignment[], monthStatus: MonthStatus }` (antes solo el array plano).

---

### 2. Panel de preparación (`PrepPanel`)

Nuevo componente lateral `components/schedule/prep-panel.tsx` que guía el proceso de preparación mensual en 4 pasos acordeón.

#### Pasos

| Paso | ID | Descripción |
|------|----|-------------|
| Vacaciones | `vacaciones` | Muestra contador de `V` asignadas. Al estar activo, pulsar una celda asigna `V` directamente sin modal |
| Libres | `libres` | Muestra contador de `D` con `manual=true`. Al estar activo, pulsar una celda asigna `D` con `manual: true` |
| Festivos | `festivos` | Muestra el número de festivos del mes y un enlace a `/holidays` para gestionarlos |
| Generar | `generar` | Contiene el botón Generar cuadrante; el botón solo es visible cuando este paso está activo |

#### Botones

| Elemento | `data-testid` | Comportamiento |
|----------|---------------|---------------|
| Panel contenedor | `prep-panel` | — |
| Cabecera de paso | `prep-step-{id}` | Alterna el paso activo (acordeón) |
| Guardar preparación | `btn-save-preparation` | Recarga el cuadrante; **deshabilitado** si `monthStatus === "generated"` |
| Generar cuadrante | `btn-generate` | Solo visible en paso `generar`; abre confirmación si ya hay datos |

---

### 3. Campo `manual` en asignaciones

Nueva columna en `ShiftAssignment` para distinguir asignaciones manuales de las generadas automáticamente.

#### Migración

```sql
-- 20260512173942_sprint11_manual_assignment
ALTER TABLE "ShiftAssignment" ADD COLUMN "manual" BOOLEAN NOT NULL DEFAULT false;
```

#### Comportamiento

- `POST /api/schedules` guarda `manual: true` en todas las asignaciones creadas manualmente desde la UI.
- `POST /api/schedules/generate`: bloquea y no sobreescribe celdas con `V`, `B` **y** `D` con `manual=true`.

---

### 4. Celdas bloqueadas (`lockedCells`)

Las celdas protegidas se muestran con un borde dashed ámbar y el emoji 🔒.

#### Criterio de bloqueo

```typescript
const lockedCells = new Set(
  assignments
    .filter(a => a.shiftType === "V" || (a.shiftType === "D" && a.manual))
    .map(a => `${a.employeeId}|${a.date}`)
);
```

#### Estilo visual

```css
ring-2 ring-inset ring-dashed ring-amber-400
```

#### Grid

- Prop `lockedCells?: Set<string>` añadida a `ScheduleGrid`.
- Añadido `data-testid={`cell-${emp.id}-${dateStr}`}` a cada `<td>` del grid para facilitar los tests E2E.

---

### 5. Confirmación antes de regenerar (L-03)

Si el mes ya está en estado `generated`, el botón Generar muestra un modal de confirmación antes de ejecutar la generación, evitando pérdidas accidentales de datos.

| Elemento | `data-testid` |
|----------|---------------|
| Modal de confirmación | `confirm-generate-modal` |
| Confirmar | `btn-confirm-generate` |
| Cancelar | `btn-cancel-generate` |

---

### 6. Reversión de turnos al eliminar festivo (L-02)

`DELETE /api/holidays/[id]` revierte automáticamente los turnos afectados por el festivo eliminado.

#### Reglas de reversión

| Turno existente | Fecha | Acción |
|----------------|-------|--------|
| `MF` | Fecha del festivo | → `M` |
| `TF` | Fecha del festivo | → `T` |
| `NF` | Día anterior al festivo | → `N` |

#### Respuesta de la API

```json
{ "ok": true, "reverted": 3 }
```

#### Toast diferenciado en `/holidays`

- `reverted > 0` → `"Festivo eliminado. X turno(s) revertido(s) a su tipo original."`
- `reverted === 0` → `"Festivo eliminado correctamente."`

---

## Tests añadidos

### Unitarios (`tests/unit/schedules/month-status.test.ts`) — +10

| Test | Descripción |
|------|-------------|
| 1 | Sin asignaciones → `ungenerated` |
| 2 | Solo V → `preparation` |
| 3 | Solo D → `preparation` |
| 4 | Solo V y D → `preparation` |
| 5 | M presente → `generated` |
| 6 | T presente → `generated` |
| 7 | N presente → `generated` |
| 8 | MF presente → `generated` |
| 9 | TF presente → `generated` |
| 10 | NF presente → `generated` |

### E2E (`tests/e2e/sprint-11.spec.ts`) — +7

| CP | Descripción | Estado |
|----|-------------|--------|
| CP-79 | Badge muestra "Sin generar" en mes sin cuadrante | ✅ |
| CP-80 | Marcar vacaciones en PrepPanel bloquea celda con 🔒 | ✅ |
| CP-81 | Guardar preparación cambia badge a "En preparación" | ✅ |
| CP-82 | Generar cuadrante preserva las celdas V bloqueadas | ✅ |
| CP-83 | Confirmación de regeneración aparece si ya hay datos; cancelar no borra nada | ✅ |
| CP-84 | Eliminar festivo con turnos MF/TF/NF muestra toast con conteo de revertidos | ✅ |
| CP-85 | Eliminar festivo sin turnos MF/TF/NF muestra toast genérico "eliminado" | ✅ |

---

## Cobertura total al cierre

| Suite | Antes | Ahora |
|-------|-------|-------|
| Tests unitarios | 118/118 | **128/128** ✅ |
| Tests E2E | 77/77 | **84/84** ✅ |

---

## Archivos modificados

| Archivo | Tipo de cambio |
|---------|---------------|
| `prisma/schema.prisma` | Campo `manual Boolean @default(false)` en `ShiftAssignment` |
| `prisma/migrations/20260512173942_sprint11_manual_assignment/` | Nueva migración |
| `lib/schedules/types.ts` | Tipo `MonthStatus`, función `computeMonthStatus`, tipo `ScheduleAssignment` con `manual?` |
| `app/api/schedules/route.ts` | GET devuelve `{ assignments, monthStatus }`; POST guarda `manual: true` |
| `app/api/schedules/generate/route.ts` | Bloquea `D` con `manual=true` además de `V`/`B` |
| `app/api/holidays/[id]/route.ts` | DELETE revierte MF→M, TF→T, NF→N |
| `app/holidays/page.tsx` | Toast diferenciado según `reverted`; `data-testid` en inputs y botones |
| `components/schedule/prep-panel.tsx` | Nuevo componente `PrepPanel` + `MonthStatusBadge` |
| `components/schedule/schedule-grid.tsx` | Prop `lockedCells`, estilo visual de bloqueo, `data-testid` en celdas |
| `app/page.tsx` | Integración completa: `monthStatus`, `prepStep`, modo dual clic, modal confirm, `lockedCells` |
| `tests/unit/schedules/month-status.test.ts` | Nuevo archivo — 10 tests unitarios |
| `tests/e2e/sprint-11.spec.ts` | Nuevo archivo — 7 tests E2E (CP-79 a CP-85) |

---

## RFs cubiertos

| RF | Descripción |
|----|-------------|
| RF-04.9 | Celdas V y D(manual) bloqueadas en el grid |
| RF-05.8 | Confirmación explícita antes de regenerar |
| RF-07.6 | Revertir MF→M y TF→T al eliminar festivo |
| RF-07.7 | Revertir NF→N (día anterior) al eliminar festivo; toast con conteo |
| RF-11.4 | Toast diferenciado según número de turnos revertidos |
| RF-18.1 | Cálculo de `MonthStatus` desde las asignaciones |
| RF-18.2 | Badge de estado del mes en la UI |
| RF-18.3 | PrepPanel con 4 pasos desplegables |
| RF-18.4 | Modo dual de asignación (V/D directo sin modal en PrepPanel) |
| RF-18.5 | Paso Festivos con contador y enlace |
| RF-18.6 | Botón Generar solo visible en paso Generar |
| RF-18.7 | Botón Guardar preparación deshabilitado en estado `generated` |
| RF-18.8 | Campo `ShiftAssignment.manual` distingue asignaciones manuales de generadas |
