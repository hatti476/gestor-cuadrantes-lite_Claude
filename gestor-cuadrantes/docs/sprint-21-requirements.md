# Sprint 21 — Refactorización de day-loop (Fase 2 de Modularización)

**Fecha estimada**: Junio 2026  
**Estado**: Pendiente (Sprint 20 completado, Sprint 21 listo para comenzar)  
**Versión de aplicación destino**: 2.1.0

---

## Objetivo

Finalizar la modularización de `lib/schedules/generate.ts` extrayendo el loop día-por-día en un módulo reutilizable `day-loop.ts`.

---

## Descripción

**Contexto** (Sprint 20):
- Se extrajeron 8 módulos algoritmécos de `generate.ts` (2350 líneas originales)
- `generate.ts` se redujo de 2350 a 1605 líneas (-32%)
- Raíz sin dependencias: `date-utils.ts`
- Arquitectura modular validada por 374 unit tests + 142 E2E tests

**Objetivo de Sprint 21**:
- Extraer el loop día-por-día (`generateMonthSchedule` líneas ~250–1500) que itera sobre cada día del mes
- Refactorizar los ~15 cierres internos anidados en una estructura `DayLoopContext` reutilizable
- Reducir `generate.ts` de 1605 a ≤300 líneas, dejando **solo orquestación**
- Mantener 100% pass rate en tests (unitarios + E2E obligatorio)
- Documentar arquitectura final en release notes

---

## Tareas Detalladas

### Task 1: Análisis de Cierres Internos (3h)
**Responsable**: yo  
**Descripción**:
- Mapear todos los cierres anidados en el loop día-por-día
- Identificar variables capturadas por cada cierre
- Documentar dependencias y orden de ejecución
- Crear diagrama de flujo (ASCII o visual)

**Entregables**:
- Documento de análisis en `docs/sprint-21-analysis.md`
- Diagrama de flujo en `docs/sprint-21-architecture.md`

---

### Task 2: Diseño de DayLoopContext (4h)
**Responsable**: yo  
**Descripción**:
- Diseñar estructura de datos `DayLoopContext`:
  - **Inputs**: Parámetros del loop (mes, empleados, festivos, etc.)
  - **State**: Variables de estado día-por-día (asignaciones, contadores, etc.)
  - **Outputs**: Resultados (assignments, warnings, coverage)
- Refactorizar cierres para usar contexto en lugar de capturar variables
- Validar que no hay dependencias circulares

**Entregables**:
- Tipos TypeScript en `lib/schedules/day-loop-context.ts`
- Documentación de interfaz en comentarios JSDoc

---

### Task 3: Crear day-loop.ts (~5h)
**Responsable**: yo  
**Descripción**:
- Crear módulo `lib/schedules/day-loop.ts` (~400 líneas estimado)
- Implementar función `executeDayLoop(context: DayLoopContext): DayLoopOutput`
- Migrar lógica día-por-día desde `generate.ts`
- Validar que el comportamiento es idéntico (no cambios)

**Entregables**:
- `lib/schedules/day-loop.ts` completo con JSDoc
- Imports consolidados y limpios

---

### Task 4: Refactorizar generate.ts (2h)
**Responsable**: yo  
**Descripción**:
- Simplificar `generateMonthSchedule()` para delegar todo el loop a `day-loop.ts`
- Actualizar imports/exports
- Consolidar orquestación a nivel de alto nivel
- Objetivo: ≤300 líneas de código activo

**Entregables**:
- `generate.ts` reducido y legible
- Funciones auxiliares de orquestación limpias

---

### Task 5: Unit Tests de day-loop.ts (4h)
**Responsable**: yo  
**Descripción**:
- Crear `tests/unit/scheduler/day-loop.test.ts`
- Escribir mínimo 20 tests unitarios cubriendo:
  - Loop día 1 del mes
  - Loop mes completo (múltiples días)
  - Edge cases (festivos, vacaciones, bloqueos manuales)
  - Continuidad cross-month (trailing state)
  - Coverage warnings
- Objetivo: 100% pass rate

**Entregables**:
- `tests/unit/scheduler/day-loop.test.ts` (~300 líneas)
- Mínimo 20 tests nuevos (acumulado: ≥400 tests unitarios)

---

### Task 6: Validación E2E (2h)
**Responsable**: yo  
**Descripción**:
- Ejecutar suite completa E2E: `npm run test:e2e` (142 tests)
- Verificar que no hay regresiones
- Documentar resultados (pass rate, duración, issues)

**Entregables**:
- Reporte E2E en release notes
- Sin failed tests (100% pass rate obligatorio)
- Confirmación explícita de no-regresión funcional (mismo input -> mismo output)

---

### Task 7: Documentación y Release Notes (2h)
**Responsable**: yo  
**Descripción**:
- Escribir `docs/sprint-21-release-notes.md`:
  - Resumen ejecutivo
  - Métricas de reducción (líneas, módulos, etc.)
  - Diagrama de arquitectura final
  - Commits atómicos
  - Deuda técnica pendiente (Sprint 22+)
- Actualizar `docs/REQUIREMENTS.md`:
  - Agregar versión 2.1 al historial
  - Actualizar backlog
- Actualizar `CHANGELOG.md`

**Entregables**:
- `docs/sprint-21-release-notes.md` completo
- `docs/REQUIREMENTS.md` actualizado
- JSDoc en todos los módulos

---

## Métricas Esperadas

| Métrica | Línea Base (Sprint 20) | Objetivo Sprint 21 | Cambio |
|---------|----------------------|-------------------|--------|
| Líneas en `generate.ts` | 1605 | ≤300 | -81% |
| Módulos en `lib/schedules/` | 8 | 9 | +1 |
| Tests unitarios | 374 | ≥400 | +26 |
| Tests E2E | 142 | 142 | 0 (sin regresiones) |
| Pass rate unitarios | 100% | 100% | ✅ |
| Pass rate E2E | N/A | 100% | ✅ |
| Cobertura JSDoc | 95%+ | 95%+ | ✅ |

---

## Esfuerzo Estimado

| Tarea | Horas |
|-------|-------|
| 1. Análisis cierres | 3 |
| 2. Diseño DayLoopContext | 4 |
| 3. Crear day-loop.ts | 5 |
| 4. Refactorizar generate.ts | 2 |
| 5. Unit tests | 4 |
| 6. E2E validation | 2 |
| 7. Documentación | 2 |
| **TOTAL** | **22 horas** |

---

## Requisitos de Cierre

✅ **Código**:
- [ ] `generate.ts` ≤300 líneas activas
- [ ] `day-loop.ts` creado y funcional (~400 líneas)
- [ ] Arquitectura modular con raíz sin deps (date-utils.ts)
- [ ] Imports/exports consolidados y limpios

✅ **Tests**:
- [ ] 100% unit tests passing (≥400 tests)
- [ ] 100% E2E tests passing (142 tests, obligatorio)
- [ ] Cobertura de regresiones en task 5

✅ **Documentación**:
- [ ] JSDoc completo en `day-loop.ts` y módulos relacionados
- [ ] `docs/sprint-21-release-notes.md` completo
- [ ] `docs/REQUIREMENTS.md` actualizado
- [ ] Release notes con métricas y arquitectura

✅ **Comportamiento**:
- [ ] Sin cambios de comportamiento (refactoring puro)
- [ ] Misma salida para misma entrada
- [ ] Algoritmo de generación idéntico
- [ ] Casos golden comparados antes/después sin diferencias

✅ **Procedimiento**:
- [ ] Sprint Orchestrator checklist completado:
  - Release notes ✅
  - Tests unitarios ✅
  - Tests E2E ✅ (obligatorio)
  - Commits atómicos
  - Rama pusheada a origin
  - PR creada y revisada

---

## Deuda Técnica Posterior (Sprint 22+)

Después de Sprint 21, la deuda técnica será **mínima**:
- `generate.ts` ≤300 líneas (solo orquestación)
- 9 módulos independientes y reutilizables
- Arquitectura modular testeable y mantenible
- Próximos sprints pueden agregar features sin tocar generador

**Posibles mejoras futuras** (sin urgencia):
1. Refactorizar `day-loop.ts` en subfases (noches, descansos, etc.)
2. Harness de simulación multi-mes para validar equidad y cobertura
3. Diagnósticos/debug mode para explicar decisiones de algoritmo
4. Exportación de plan de generación para auditoría

---

## Sprint Orchestrator Checklist

✅ **Cierre de Sprint 21**:

| # | Artefacto | Ubicación | Responsable |
|---|-----------|-----------|-------------|
| 1 | Release notes | `docs/sprint-21-release-notes.md` | yo |
| 2 | Informe de esfuerzo | `docs/effort/SPRINT-21-EFFORT.md` | yo |
| 3 | Registro de bugs | `docs/bugs/BUG-REGISTRY.md` (si hay) | yo |
| 4 | REQUIREMENTS.md | `docs/REQUIREMENTS.md` | yo |
| 5 | Informe de estado | `docs/INFORME-ESTADO-v{X}-{DATE}.md` | yo |
| 6 | Tests unitarios | `tests/unit/` — 100% passing | yo |
| 6b | **Tests E2E** | `tests/e2e/` — 142/142 ✅ **OBLIGATORIO** | yo |
| 7 | Commits atómicos | rama feature-sprint-21-... | yo |
| 8 | Rama pusheada | origin/feature-sprint-21-... | yo |
| 9 | PR abierta | GitHub Pull Request | yo |

---

## Notas

- ✅ Este sprint es **refactoring puro** — sin cambios de comportamiento
- ✅ E2E tests son **obligatorios** (aprendizaje de Sprint 20)
- ✅ La modularización permite reutilización en futuros sprints
- ✅ Después de Sprint 21, el codebase será más mantenible
- ✅ Si no hay cambios tras el baseline, usar commit vacío:
  `git commit --allow-empty -m "chore: baseline test run before day-loop refactor"`
- ✅ Mensaje final recomendado de cierre:
  `"Sprint 21 completado. ≥400 unitarios ✅. 142 E2E ✅. generate.ts ≤300 líneas. Rama pusheada. Listo para merge."`
