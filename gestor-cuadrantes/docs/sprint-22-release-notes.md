# Sprint 22 Release Notes (v2.2.0)

## Resumen ejecutivo
Sprint 22 cierra la deuda arquitectonica abierta en Sprint 21: `generate-core.ts` deja de existir y la arquitectura modular queda consolidada con `generate.ts` como orquestador puro.

Ademas, se crea un paquete de utilidades anti-flake para E2E, se migran los 7 casos historicamente inestables y se activa una estrategia CI/CD de 3 workflows en GitHub Actions para bloqueo temprano en PR y deteccion nocturna de regresiones.

## Arquitectura final de `lib/schedules/`
```text
generate.ts (orquestador puro, 108 lineas)
└── monthly-schedule-engine.ts
    └── day-loop.ts (loop dia-a-dia)
        ├── night-blocks.ts
        ├── weekend-packs.ts
        ├── workday-shifts.ts
        ├── rest-rules.ts
        ├── coverage.ts
        ├── shift-transitions.ts
        ├── cross-month.ts
        ├── date-utils.ts
        └── day-loop-context.ts
```

Estado de cierre:
- `generate-core.ts`: eliminado
- `generate.ts`: orquestacion sin logica de negocio directa
- Contrato del loop diario: mantenido en `day-loop-context.ts`

## Metricas de tests: antes/despues
| Metrica | Antes Sprint 22 | Despues Sprint 22 |
|---------|------------------|-------------------|
| Tests unitarios | 404/404 | 404/404 |
| Tests E2E | 142/142 | 142/142 |
| Casos E2E flakey conocidos | 7 | 0 |
| Tests etiquetados `@smoke` | 0 | 18 |

## CI/CD adoptado
### `ci.yml` (Quality Gates)
- Trigger: `pull_request` y `push` a `main`
- Checks: `tsc --noEmit`, `eslint --max-warnings 0`, unit tests y build
- Politica: bloquea merge si falla cualquier check

### `e2e-smoke.yml` (PR Smoke)
- Trigger: `pull_request` a `main`
- Ejecuta solo tests `@smoke`
- Levanta app en `localhost:3000`, ejecuta Playwright y publica artefactos al fallar
- Politica: bloquea merge si falla

### `e2e-nightly.yml` (Full E2E)
- Trigger: cron diario `0 2 * * *` + `workflow_dispatch`
- Ejecuta suite completa Playwright
- Publica reporte HTML (retencion 30 dias)
- En fallo: crea issue automatica con fecha y lista de tests fallidos

## Deuda tecnica pendiente (Sprint 23+)
- Reducir complejidad de `monthly-schedule-engine.ts` mediante nuevas extracciones tematicas.
- Afinar cobertura de smoke tests por matriz de riesgo funcional (no solo por volumen).
- Enriquecer issue automatica nightly con enlaces directos a trazas relevantes por test.
- Formalizar metricas de estabilidad E2E (tiempo medio, varianza, reruns).
