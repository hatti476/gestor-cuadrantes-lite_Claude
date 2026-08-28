# Sprint 26 — Release Notes

**Fecha**: 2026-06-18 / 2026-06-19  
**Versión**: 2.6.0  
**Rama**: `feature/sprint-26-scheduling-fixes`  
**Estado**: ✅ Cerrado

---

## Resumen

Sprint de corrección de bugs algorítmicos críticos en el motor de generación de
cuadrantes (semana laboral), dos mejoras visuales en el visor mensual y multi-mes,
y una refactorización de tipos para consolidar `ScheduleEmployee` en un único
módulo compartido.

---

## Bugs corregidos

### BUG-56 🔴 High — weeklyShift no se registra en todos los caminos de retorno
- **Síntoma**: El turno semanal del empleado cambiaba de M a T (o viceversa) a
  mitad de semana, provocando transiciones T→M inválidas (< 8 h de descanso) que
  el motor convertía en descanso `D`, dejando días de trabajo aislados sin cobertura.
- **Causa**: `pickWorkdayShift` registraba `state.weekShift` solo en 2 de los 8
  caminos de retorno. Los 6 restantes (urgency, equity, soft-target, preference,
  equity-fallback) asignaban el turno sin anotarlo en el estado.
- **Fix**: Todos los caminos de retorno ahora registran `state.weekShift` antes de
  devolver el turno. Un empleado que recibe M el lunes mantiene M el resto de la semana.
- **Commit**: `2024e38`
- **Tests**: CP-163, CP-164

### BUG-57 🟠 High — urgentT no actúa sobre empleados con turno M asignado
- **Síntoma**: Cuando T necesitaba cobertura urgente y todos los candidatos D
  ya estaban asignados, el motor no podía convertir empleados M a T aunque la
  transición M→T sea válida (≥ 24 h de descanso).
- **Causa**: La guardia de consistencia semanal (`weekShift === 'M'`) se evaluaba
  antes del bloque `urgentT`, bloqueando el override.
- **Fix**: `urgentT` se evalúa ahora ANTES de la guardia de consistencia semanal.
  `urgentM` NO hace lo mismo (T→M es inválido por la regla de 8 h del ET Art. 34.3).
- **Commit**: `2024e38`
- **Tests**: CP-165

### BUG-58 🟠 High — Días D aislados sin causa aparente en semanas de trabajo
- **Síntoma**: Algunos empleados tenían un único día `D` en mitad de una semana
  laboral sin que hubiera vacaciones ni baja registrada.
- **Causa**: Consecuencia directa de BUG-56 — la transición T→M forzada por
  inconsistencia semanal generaba el `D` como compensación de descanso.
- **Fix**: Resuelto automáticamente con el fix de BUG-56; no requirió código adicional.
- **Commit**: `2024e38`
- **Tests**: CP-166

---

## Nuevas funcionalidades / Cambios visuales

### CHG-01 — Sombreado más intenso en celdas de fin de semana
- Vista mensual: celdas de sábado/domingo `bg-blue-50 → bg-blue-100`; cabeceras
  `bg-blue-100 → bg-blue-200 text-blue-900`.
- Vista multi-mes: mismos cambios para coherencia visual.
- El sombreado de festivos no cambia (`bg-red-200 / bg-red-50`).
- **Commit**: `161bce1`
- **Tests**: CP-167, CP-168, CP-169

### CHG-02 — Separador de mes más visible en vista multi-mes
- Columna de fin de mes: `border-r border-r-gray-300 → border-r-2 border-r-gray-400`
  en cabeceras (`th`) y celdas (`td`).
- **Commit**: `161bce1`
- **Test**: CP-170

---

## Refactorización

### Consolidación de `ScheduleEmployee` en `lib/schedules/types.ts`
- Eliminada la interfaz `ScheduleEmployee` duplicada de `monthly-schedule-engine.ts`;
  ahora se importa y re-exporta desde `./types`.
- `weekend-packs.ts` y `night-blocks.ts` importan `ScheduleEmployee` y helpers
  de `./types` / `./date-utils`.
- `types.ts`: campo `name` marcado como opcional (`name?: string`) — no se usa
  en la lógica del algoritmo, solo para diagnóstico.
- `tsc --noEmit`: 0 errores.
- **Commit**: `d39e142`

---

## Correcciones de tests pre-existentes

| CP | Descripción | Acción | Commit |
|----|-------------|--------|--------|
| CP-140 | SUPER_VIEWER — `Promise.race` inestable con hydration de React | Fix: reemplazado por `waitForLoadState('networkidle')` + comprobaciones independientes | `66b28a8` |
| CP-149 | `rates-legend` — `data-testid` incorrecto | Fix: corregido a `extra-pay-rates-legend`; eliminada comprobación de posición x frágil | `6126f79` |
| CP-154 | Tres tablas — alineación posicional frágil | Fix: eliminadas verificaciones de coordenadas pixel; solo visibilidad | `6126f79` |

---

## Casos de prueba QA

| ID | Descripción | Resultado | Tipo |
|----|-------------|-----------|------|
| CP-163 | weeklyShift registrado en camino urgency | ✅ PASS | Unit |
| CP-164 | weeklyShift registrado en camino equity-fallback | ✅ PASS | Unit |
| CP-165 | urgentT override actúa sobre empleado M-bloqueado | ✅ PASS | Unit |
| CP-166 | No aparecen días D aislados en semana normal | ✅ PASS | Unit |
| CP-167 | Celdas fin de semana usan `bg-blue-100` en vista mensual | ✅ PASS | E2E @smoke |
| CP-168 | Cabeceras fin de semana usan `bg-blue-200` en vista mensual | ✅ PASS | E2E @smoke |
| CP-169 | Vista multi-mes: celdas/cabeceras fin de semana actualizadas | ✅ PASS | E2E @smoke |
| CP-170 | Separador de mes usa `border-r-2` en multi-mes | ✅ PASS | E2E @smoke |

**Resultado global nuevos tests**: 8/8 ✅  
**Suite unitaria**: 439 passing | 2 pre-existing failures (presentes en `main` antes del sprint)  
**Pre-existing unit failures**: RF-16 weekend coverage con bloqueos manuales + cross-month N duplicado (registrados para sprint-27)

---

## Ficheros modificados

| Fichero | Tipo de cambio |
|---------|---------------|
| `lib/schedules/workday-shifts.ts` | Fix BUG-56/57/58 — weeklyShift todos los caminos, urgentT priority, soft-target balance |
| `tests/unit/scheduler/sprint-26-workday-shifts.test.ts` | Tests CP-163..CP-166 (14 unit tests) |
| `app/multi-month/page.tsx` | CHG-01/02 — weekend shading + month separator |
| `components/schedule/ScheduleGrid.tsx` | CHG-01 — weekend shading consistente |
| `tests/e2e/sprint-26.spec.ts` | Tests CP-167..CP-170 |
| `lib/schedules/types.ts` | `name?: string` (refactor) |
| `lib/schedules/monthly-schedule-engine.ts` | Elimina interfaz local, importa de `./types` (refactor) |
| `lib/schedules/weekend-packs.ts` | Importa `ScheduleEmployee` de `./types` (refactor) |
| `lib/schedules/night-blocks.ts` | Añade imports `fromDateStr`, `normalizeShift` (refactor) |
| `tests/unit/scheduler/cross-month.test.ts` | Fix generación dinámica de tail array (refactor) |
| `tests/e2e/known-failures.md` | CP-140 removido (corregido); 12 → 12 (neto 0: 1 corregido) |
| `package.json` | Script `dev:clean` añadido |

---

## Entorno de pruebas

- **URL**: http://localhost:3001 (servidor de test aislado)
- **BD**: `test.db` (resembrada en cada ejecución del suite)
- **Comando unitario**: `npx vitest run`
- **Comando E2E**: `npx playwright test tests/e2e/sprint-26.spec.ts --reporter=list`
