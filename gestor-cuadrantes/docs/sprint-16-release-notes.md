# Sprint 16 — Release Notes

**Fecha**: 19/05/2026  
**Versión**: 1.6  
**Rama**: `feature/sprint-16-algorithm-fixes`  
**Estado**: ✅ Completado

---

## Resumen ejecutivo

Sprint 16 corrige reglas críticas del algoritmo de generación y añade una nueva
tabla de complementos económicos. El foco principal ha sido evitar asignaciones
no deseadas en noches, reforzar descansos mínimos, alinear fines de semana con
la pauta semanal M/T y validar el descanso legal mínimo de 12 horas entre turnos.

También se añade cobertura E2E CP-99..CP-108 y se estabiliza el reset de base de
datos de Playwright para que la suite completa arranque desde un estado limpio.

---

## Objetivos cerrados

| Objetivo | Estado |
|----------|--------|
| Toggle de vacaciones y días libres manuales en PrepPanel | ✅ |
| Excluir preferencia J de la rotación automática de noches | ✅ |
| Mantener consistencia MF/TF con la pauta semanal M/T | ✅ |
| Exigir 2 días de descanso consecutivos entre bloques | ✅ |
| Validar descanso mínimo ET Art. 34.3 entre turnos | ✅ |
| Añadir tabla de complementos económicos | ✅ |
| Crear E2E CP-99..CP-108 | ✅ |
| Recuperar suite E2E completa | ✅ |

---

## Cambios realizados

### 1. PrepPanel con toggle para V y D manual

**Archivos principales**:

- `app/page.tsx`
- `components/schedule/schedule-grid.tsx`

Las celdas marcadas desde el panel de preparación ahora pueden desmarcarse con
un segundo clic:

- `V` se elimina y la celda queda vacía.
- `D` manual se elimina y la celda queda vacía.
- Si ya existe otro turno, se pide confirmación antes de sustituirlo.

Al borrar una celda bloqueada se llama a `DELETE /api/schedules`, se retira el
bloqueo visual y se actualizan los contadores del paso.

---

### 2. Preferencia J fuera de noches automáticas

**Archivos principales**:

- `lib/schedules/generate.ts`
- `app/api/schedules/generate/route.ts`
- `tests/unit/scheduler/generate.test.ts`

Los empleados con `shiftPreference = "J"` quedan excluidos de la rotación
automática de noches. No reciben `N`, `NF` ni descansos de pre/post bloque de
noches generados automáticamente.

Si hay menos de 7 empleados elegibles, el algoritmo redistribuye la cobertura
nocturna entre los disponibles sin dejar días sin noche. Las asignaciones
manuales siguen respetándose y pueden incluir noches aunque el empleado sea J.

---

### 3. Consistencia semanal de fines de semana y festivos

**Archivos principales**:

- `lib/schedules/generate.ts`
- `tests/unit/scheduler/generate.test.ts`

Se añade `weekendShift` por empleado y semana para mantener la pauta de MF/TF:

- Pauta `M` o `weeklyShift = M` → preferencia por `MF`.
- Pauta `T` o `weeklyShift = T` → preferencia por `TF`.
- Sin preferencia → reparto equilibrado.

La cobertura mínima en fines de semana y festivos se mantiene: al menos 1 `MF`
y 1 `TF` por día cuando hay dos o más empleados disponibles.

---

### 4. Descanso mínimo de 2 días entre bloques de trabajo

**Archivos principales**:

- `lib/schedules/generate.ts`
- `tests/unit/scheduler/generate.test.ts`

La regla de descanso forzado pasa de “5 días consecutivos del mismo turno” a
“5 días consecutivos de trabajo”. Cuando se fuerza descanso, el algoritmo
garantiza 2 días `D` consecutivos antes de volver a asignar trabajo.

La regla también se aplica en el cruce de mes usando `prevMonthTail`.

---

### 5. Cumplimiento ET Art. 34.3

**Archivos principales**:

- `lib/schedules/business-logic.ts`
- `lib/schedules/generate.ts`
- `app/api/schedules/generate/route.ts`
- `app/page.tsx`
- `components/schedule/shift-editor.tsx`
- `tests/unit/lib/business-logic.test.ts`

Se añade:

```ts
validateShiftTransition(prevShift, nextShift)
```

La función calcula si la transición entre turnos respeta al menos 12 horas de
descanso. El generador evita transiciones prohibidas sustituyendo el turno por
`D` y devuelve `warnings` a la API para informar al administrador.

El editor manual muestra una advertencia visible cuando el cambio seleccionado
deja menos de 12 horas respecto al día anterior o siguiente. La advertencia no
bloquea la edición manual.

---

### 6. Tabla de complementos económicos

**Archivos principales**:

- `app/page.tsx`
- `lib/schedules/business-logic.ts`
- `tests/unit/lib/business-logic.test.ts`

Se añade una nueva tabla junto a los contadores:

- `data-testid="extra-pay-table"`
- Columnas `MF`, `TF`, `N`, `NF` y `Total €`
- Tarifas:
  - `MF`: 33,00 €
  - `TF`: 33,00 €
  - `N`: 38,50 €
  - `NF`: 49,50 €

La fila total suma todos los importes del mes visible y los valores cero se
muestran en gris.

---

### 7. E2E Sprint 16 y estabilización de suite

**Archivos principales**:

- `tests/e2e/sprint-16.spec.ts`
- `tests/e2e/helpers.ts`
- `tests/e2e/global-setup.ts`

Se crean los casos CP-99..CP-108:

| CP | Cobertura |
|----|-----------|
| CP-99 | Toggle de celda V en PrepPanel |
| CP-100 | Toggle de D manual en PrepPanel |
| CP-101 | Preferencia J excluida de noches |
| CP-102 | `weeklyShift M` alineado con `MF` |
| CP-103 | Sin transición T→M tras generar |
| CP-104 | Sin transición N→T/N→M tras generar |
| CP-105 | Sin único D entre bloques de trabajo |
| CP-106 | Advertencia ET en edición manual |
| CP-107 | Tabla de complementos visible |
| CP-108 | Total económico calculado correctamente |

Además, el `global-setup` de Playwright limpia realmente `prisma/test.db` y
resemilla datos conocidos, evitando contaminación entre ejecuciones.

---

## Validaciones

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | ✅ Passing |
| `npm run test:unit` | ✅ 184/184 |
| `npx playwright test --workers=1` | ✅ 108/108 |

---

## Métricas finales

| Métrica | Valor |
|---------|-------|
| Tests unitarios | 184/184 ✅ |
| Tests E2E | 108/108 ✅ |
| Casos E2E nuevos | CP-99..CP-108 |
| Commits del sprint | 7 |
| Rama remota | `origin/feature/sprint-16-algorithm-fixes` |

---

## Notas técnicas

- El prompt inicial contenía referencias erróneas a Sprint 15. Se ejecutó todo
  contra `feature/sprint-16-algorithm-fixes`.
- El archivo E2E creado es `tests/e2e/sprint-16.spec.ts`.
- La instrucción de pre-merge debe apuntar a `feature/sprint-16-algorithm-fixes`.

---

## Próximo paso

Preparar revisión pre-merge y PR contra `main` cuando se indique el cierre del
sprint.
