# Sprint 20 Release Notes — Refactoring del Algoritmo de Generación

**Fecha:** 2026-05-28  
**Branch:** `feature/sprint-20-algorithm-refactor`  
**Tests:** 374/374 ✅ (296 originales + 78 nuevos)  
**Objetivo:** Refactorizar `lib/schedules/generate.ts` (2350 líneas) en módulos especializados sin cambiar el comportamiento del algoritmo.

---

## Resumen ejecutivo

Sprint 20 es un sprint de deuda técnica puro. El objetivo único es mejorar la mantenibilidad del motor de generación de cuadrantes sin modificar ninguna regla de negocio. La métrica de éxito era simple: **296/296 tests unitarios en verde antes y después del refactoring**.

Resultado final: **374/374 tests en verde** (se añadieron 78 tests nuevos para las interfaces de los módulos extraídos).

---

## Módulos nuevos creados

| Módulo | Contenido | Líneas |
|--------|-----------|--------|
| `lib/schedules/date-utils.ts` | Helpers de fecha, normalización de turnos | ~110 |
| `lib/schedules/night-blocks.ts` | Ciclo nocturno 2D+7N+3D, rotación, resolución de conflictos | ~200 |
| `lib/schedules/rest-rules.ts` | Reglas de descanso HARD (máx. 5 días consecutivos) | ~150 |
| `lib/schedules/shift-transitions.ts` | Validación de transiciones ET Art.34.3 | ~50 |
| `lib/schedules/coverage.ts` | Evaluación de cobertura mínima RF-16 | ~120 |
| `lib/schedules/weekend-packs.ts` | Selección de paquetes de fin de semana MF/TF | ~200 |
| `lib/schedules/workday-shifts.ts` | Asignación de turnos laborables M/T | ~80 |
| `lib/schedules/cross-month.ts` | Continuidad cross-month (bloques nocturnos + packs de finde) | ~280 |

---

## Cambios en `lib/schedules/generate.ts`

- **Antes:** 2350 líneas (función monolítica)
- **Después:** 1605 líneas (reducción del 32%)
- Toda la lógica sigue siendo equivalente — el orquestador llama a los módulos extraídos
- Re-exportaciones de compatibilidad hacia atrás conservadas para no romper imports existentes
- Imports reorganizados al inicio del archivo (eliminados imports al final)

### Reducción detallada

| Extracción | Líneas eliminadas | Commit |
|------------|-------------------|--------|
| `date-utils.ts` | ~110 | `refactor: extract night block logic` |
| `night-blocks.ts` | ~200 | `refactor: extract night block logic to night-blocks.ts` |
| `rest-rules.ts` | ~150 | `refactor: extract rest rules to rest-rules.ts` |
| `shift-transitions.ts` | ~30 | `refactor: extract shift transition validation` |
| `coverage.ts` | ~80 | `refactor: extract coverage logic to coverage.ts` |
| `weekend-packs.ts` | ~210 | `refactor: extract weekend pack logic to weekend-packs.ts` |
| `workday-shifts.ts` | ~80 | `refactor: extract workday shift logic to workday-shifts.ts` |
| `cross-month.ts` | ~179 | `refactor: extract cross-month continuity logic to cross-month.ts` |
| Import cleanup | ~44 | `refactor: clean up generate.ts import/export structure` |

---

## Tests nuevos (Task 5)

Se añadieron 4 nuevos archivos de test para validar las interfaces públicas de los módulos extraídos:

| Archivo | Tests | Módulo cubierto |
|---------|-------|-----------------|
| `tests/unit/scheduler/date-utils.test.ts` | 23 | `date-utils.ts` |
| `tests/unit/scheduler/rest-rules.test.ts` | 19 | `rest-rules.ts` |
| `tests/unit/scheduler/coverage.test.ts` | 9 | `coverage.ts` |
| `tests/unit/scheduler/cross-month.test.ts` | 27 | `cross-month.ts` |

---

## Bugs identificados y resueltos (Task 6)

| ID | Descripción | Estado |
|----|-------------|--------|
| BUG-38 | `weekend-packs.ts`: imports incompletos (`toDateStr`, `addDays`, `fromDateStr` no importados) → 68 tests fallaban con `ReferenceError` | ✅ Fixed |
| BUG-39 | `workday-shifts.ts`: uso de tipo `ScheduleEmployee` (circular dep) → resuelto con structural typing | ✅ Fixed |

---

## Arquitectura final del módulo de schedules

```
lib/schedules/
├── generate.ts          ← Orquestador principal (1605 líneas, -32%)
├── date-utils.ts        ← Helpers de fecha (NEW) — sin dependencias
├── night-blocks.ts      ← Ciclo nocturno (NEW) — depende de date-utils
├── rest-rules.ts        ← Reglas de descanso (NEW) — depende de date-utils
├── shift-transitions.ts ← Transiciones de turno (NEW) — depende de business-logic
├── coverage.ts          ← Cobertura RF-16 (NEW) — depende de date-utils
├── weekend-packs.ts     ← Paquetes de finde (NEW) — depende de date-utils
├── workday-shifts.ts    ← Turnos laborables (NEW) — depende de date-utils
├── cross-month.ts       ← Continuidad cross-month (NEW) — depende de date-utils + rest-rules
└── business-logic.ts    ← Lógica de negocio (existente, sin cambios)
```

### Grafo de dependencias (sin ciclos)

```
generate.ts
  ├── business-logic.ts  (isValidShiftType, validateShiftTransition)
  ├── date-utils.ts      (isWeekend, toDateStr, fromDateStr, addDays, ...)
  ├── night-blocks.ts    ← date-utils
  ├── rest-rules.ts      ← date-utils
  ├── shift-transitions.ts ← business-logic
  ├── coverage.ts        ← date-utils
  ├── weekend-packs.ts   ← date-utils
  ├── workday-shifts.ts  ← date-utils
  └── cross-month.ts     ← date-utils + rest-rules
```

---

## Deuda técnica pendiente

- **Task 3.8 completo:** `generate.ts` sigue con 1605 líneas. Para alcanzar el objetivo ≤300 líneas habría que extraer el bucle día-a-día (~1000 líneas) a un módulo `day-loop.ts`. Esto se planifica para **Sprint 21**.
- El bucle principal `generateMonthSchedule` contiene ~15 closures internas que necesitan un `DayLoopContext` para ser extraídas sin romper la encapsulación.

---

## Historial de commits

```
be1ca25 refactor: clean up generate.ts import/export structure (Task 3.8 partial)
dd9b93f refactor: extract cross-month continuity logic to cross-month.ts
5b022a8 refactor: extract workday shift logic to workday-shifts.ts  
7d179af refactor: extract weekend pack logic to weekend-packs.ts
[...commits anteriores del sprint...]
```

---

## Notas de ejecución

- **Enfoque de edición:** Archivos con caracteres Unicode en comentarios (─) se editaron con scripts Python (`with open(..., encoding='utf-8')`) en lugar del tool `replace_string_in_file` para evitar fallos de matching.
- **Dependencias circulares:** Resueltas usando `date-utils.ts` como módulo raíz sin dependencias, y structural typing en lugar de imports de tipo hacia `generate.ts`.
- **Backward compatibility:** Todos los re-exports de `generate.ts` se mantienen para que los tests que importan desde `generate.ts` sigan funcionando sin cambios.
