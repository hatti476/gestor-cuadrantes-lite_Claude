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

## Arquitectura final de módulos en `lib/schedules/`

```text
generate.ts (orquestador, <=300 líneas)
└── day-loop.ts (loop día-a-día, ~400 líneas)
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
  - Llamada única a `executeDayLoop(input)`.
  - Persistencia y respuesta.

- `day-loop.ts`
  - Iteración estrictamente cronológica del mes.
  - Aplicación ordenada de prioridades de negocio por día.
  - Acumulación de estado y warnings del loop.

- `day-loop-context.ts` (nuevo)
  - Contrato explícito de entrada/estado/salida del loop.
  - Eliminación de cierres acoplados al scope de `generate.ts`.

## Frontera de modularización
- Todo helper que hoy depende de variables capturadas del scope de `generateMonthSchedule` debe:
  - moverse a `day-loop.ts` como función interna al módulo, o
  - convertirse en función pura con parámetros explícitos (sin captura implícita).

Esto reduce acoplamiento, facilita pruebas unitarias específicas del loop y prepara Sprint 22 para evolución del algoritmo sin degradar legibilidad.
