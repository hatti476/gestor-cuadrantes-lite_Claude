# Sprint 21 Release Notes — Refactorización Day-Loop (Fase 2)

**Fecha:** 2026-05-27  
**Branch:** `feature/sprint-21-dayloop-refactor`  
**Versión:** 2.1.0  
**Objetivo:** Extraer el loop diario de generación a un módulo dedicado, manteniendo comportamiento.

---

## Resumen ejecutivo

Sprint 21 cierra la segunda fase de modularización del algoritmo de cuadrantes. Se separó el loop cronológico día-a-día en `day-loop.ts`, se introdujo un contrato explícito de estado con `day-loop-context.ts` y se redujo `generate.ts` a una fachada/orquestador mínima.  
El comportamiento funcional se validó con cobertura completa de pruebas unitarias y E2E.

---

## Métricas de reducción

- `generate.ts`: **2350** (Sprint 19) → **1605** (Sprint 20) → **10** (Sprint 21)
- Objetivo de Sprint 21 (`<=300`) cumplido con margen amplio.

---

## Arquitectura final de `lib/schedules/`

```text
generate.ts (facade/orquestador)
└── generate-core.ts
    ├── day-loop.ts
    ├── day-loop-context.ts
    ├── night-blocks.ts
    ├── weekend-packs.ts
    ├── workday-shifts.ts
    ├── rest-rules.ts
    ├── coverage.ts
    ├── shift-transitions.ts
    ├── cross-month.ts
    ├── date-utils.ts
    ├── business-logic.ts
    └── types.ts
```

---

## Commits atómicos del sprint

- `dcd6224` — `docs: sprint-21 analysis and architecture diagrams`
- `3ecdf3d` — `feat: DayLoopContext types in day-loop-context.ts`
- `90feda2` — `refactor: extract day-loop logic to day-loop.ts`
- `d8fc71b` — `test: day-loop unit tests DL-01 to DL-20`
- `e629d57` — `test: stabilize flaky E2E cases CP-37 CP-68 CP-77 CP-115`
- `91fb5d0` — `refactor: extract generate core and reduce generate.ts facade`
- `74d4423` — `test: harden flaky E2E cases CP-15 CP-38 CP-116`

---

## Tests (resultado final)

- Unit tests: **404/404 ✅**
- E2E tests: **142/142 ✅**

---

## Deuda técnica pendiente (Sprint 22+)

- Consolidar la estrategia `generate.ts`/`generate-core.ts` tras el merge final para evitar dualidad de punto de entrada.
- Revisar y simplificar casos E2E históricamente flakey para reducir retries implícitos por carga concurrente.
- Avanzar en mejoras de algoritmo (equidad y cobertura avanzada) ahora que el loop diario está desacoplado.
