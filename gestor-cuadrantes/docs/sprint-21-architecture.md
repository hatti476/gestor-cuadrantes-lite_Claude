# Sprint 21 — Arquitectura Day-Loop (Fase 2)

## Flujo de ejecución por día (objetivo de extracción)

```text
Para cada día del mes (día 1 → día N):
  │
  ├── 1. Verificar celdas bloqueadas (V/B/D manual)
  │      - Si está bloqueada: no sobreescribir
  │
  ├── 2. Aplicar reglas de descanso HARD
  │      - 5+ días de trabajo seguidos
  │      - secuencia de descanso obligatorio en curso
  │
  ├── 3. Consultar NightBlockPlan
  │      - Asignar N o D de pre/post bloque
  │
  ├── 4. Consultar WeekendPackPlan
  │      - Resolver MF/TF/D en sáb-dom-festivos adyacentes
  │
  ├── 5. Asignar turno laborable si aplica
  │      - M/T/J según cobertura, semana, preferencia y equidad
  │
  ├── 6. Validar transición ET Art.34.3
  │      - Si rompe descanso mínimo: convertir a D + warning
  │
  └── 7. Evaluar cobertura y emitir warnings
         - hard coverage (mínimo)
         - soft coverage (objetivo)
```

## Arquitectura final de módulos en `lib/schedules/` (post Sprint 22)

```text
generate.ts (orquestador puro, <=300 líneas)
└── monthly-schedule-engine.ts (engine mensual especializado)
    ├── day-loop.ts (loop día-a-día modular)
    ├── night-blocks.ts
    ├── weekend-packs.ts
    ├── workday-shifts.ts
    ├── rest-rules.ts
    ├── coverage.ts
    ├── shift-transitions.ts
    ├── cross-month.ts
    └── date-utils.ts (raíz sin dependencias)
```

## Responsabilidades objetivo por módulo
- `generate.ts`
  - Validación de entrada.
  - Carga de datos y contexto.
  - Construcción de planes previos.
  - Delegación de la ejecución al engine mensual especializado.
  - Persistencia y respuesta.

- `monthly-schedule-engine.ts`
  - Implementa la lógica integral de generación mensual.
  - Orquesta night blocks, continuidad cross-month, cobertura y reparaciones.
  - Mantiene el contrato estable de `generateMonthSchedule`.

- `day-loop.ts`
  - Iteración estrictamente cronológica del mes.
  - Aplicación ordenada de prioridades de negocio por día.
  - Acumulación de estado y warnings del loop.

- `day-loop-context.ts` (nuevo)
  - Contrato explícito de entrada/estado/salida del loop.
  - Eliminación de cierres acoplados al scope de `generate.ts`.

## Cierre de deuda Sprint 22
- `generate-core.ts` ha sido eliminado.
- El punto de entrada estable es `generate.ts`.
- La lógica de negocio queda consolidada en módulos especializados, con `monthly-schedule-engine.ts` como engine mensual.
