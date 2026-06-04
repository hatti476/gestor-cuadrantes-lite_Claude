# Esfuerzo — Sprint 24: Correcciones algoritmo y vista multi-mes

**Periodo**: 02/06/2026 - 04/06/2026  
**Estado**: En progreso 🔄  
**Versión**: 2.4.0  
**Rama**: `feature/sprint-24-scheduling-fixes`  
**Tipo de sprint**: Corrección de bugs de algoritmo + feature menor UI

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Product Owner / PM (usuario) | Humano | ~1,0 h | Detección de bugs en QA manual, confirmación de scope, revisión de UI |
| Dev Agent | IA | ~8,0 h equiv. | BUG-41..BUG-44 (análisis + implementación), RatesLegend, multi-month view, restyling |
| Doc Agent | IA | ~1,5 h equiv. | Release notes, effort report, BUG-REGISTRY (BUG-41..44), context.md |

**Total humano estimado**: ~1,0 h  
**Total IA estimado**: ~9,5 h equiv.  
**Total sprint estimado**: ~10,5 h

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Resultado |
|-------|-------------|--------|-----------|
| Análisis root cause BUG-41 (leyenda tarifas) | Dev | S | ✅ |
| Fix BUG-41: componente RatesLegend + CP-110 E2E | Dev | S | ✅ |
| Fix BUG-41: posición RatesLegend a la derecha | Dev | XS | ✅ |
| Análisis root cause BUG-42 (T-pref sin fines de semana) | Dev | M | ✅ |
| Fix BUG-42: Tier 2.5 en ensureWeekendPlan | Dev | S | ✅ |
| Análisis root cause BUG-43 (>2 fines de semana entre noches) | Dev | M | ✅ |
| Fix BUG-43: getWeekendsSinceLastNightBlock + filtro strict | Dev | M | ✅ |
| Análisis root cause BUG-44 (>5 días consecutivos tras repair) | Dev | M | ✅ |
| Fix BUG-44: eliminar guardia !isWeekend en forcedRestDates | Dev | XS | ✅ |
| Feature: botón Vista ampliada + página /multi-month | Dev | M | ✅ |
| Restyling multi-month (Header, useSession, Tailwind coherente) | Dev | S | ✅ |
| BUG-REGISTRY: BUG-41..BUG-44 | Doc | S | ✅ |
| Docs: sprint-24-release-notes.md, SPRINT-24-EFFORT.md | Doc | S | ✅ |
| Favicon: pendiente (binario ICO no accesible en sesión) | Dev | XS | ⏳ |

---

## Commits atómicos del sprint

| Hash | Mensaje |
|------|---------|
| `619cf80` | fix(sprint-24): BUG-41..44 + multi-month expanded view |
| `46330f6` | fix(sprint-24): rates legend position + multi-month app styling |

---

## Métricas de salida

| Métrica | Valor |
|---------|-------|
| Bugs corregidos | 4 (BUG-41..BUG-44) |
| Features añadidas | 1 (multi-month view) |
| Archivos modificados | `app/page.tsx`, `app/multi-month/page.tsx`, `lib/schedules/monthly-schedule-engine.ts`, `tests/e2e/sprint-16.spec.ts`, `docs/bugs/BUG-REGISTRY.md` |
| TypeScript | ✅ Clean (0 errors) |
| Tests unitarios | 419/419 (sin regresión) |
| E2E smoke | 22/22 (sin regresión en smoke) |
| CP-110 | ✅ Actualizado para verificar tarifas visibles |

---

## Notas de gestión

- Sprint iniciado directamente sobre análisis de sesión anterior (sesión compacta). El scope fue definido por el usuario en la sesión previa y confirmado implícitamente al retomar trabajo.
- No se creó rama `feature/sprint-24-*` al inicio (trabajo arrancó en `fix/sprint-23-iteration-extra-pay-alignment`); se creó retroactivamente al consolidar trabajo del sprint.
- Protocolo a seguir en sprints futuros: crear `feature/sprint-{N}-*` desde `main` **antes** de arrancar implementación, incluso si el scope ya está acordado.
- Favicon pendiente: el binario ICO (41.662 bytes) no es accesible desde el sistema de adjuntos de la sesión — el usuario debe proporcionar ruta del sistema de ficheros.
