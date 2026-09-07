# Esfuerzo — Sprint 11: PrepPanel, MonthStatus, celdas bloqueadas y confirmación de regeneración

**Período**: 12/05/2026  
**Estado**: Completado ✅  
**Versión**: 1.1

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Project Manager (usuario) | Humano | ~2,0 h | Definición flujo de preparación mensual 4 pasos, validación visual de celdas bloqueadas, aprobación lógica MonthStatus |
| Dev Agent (`new-feature`) | IA | ~5,5 h equiv. | PrepPanel (acordeón 4 pasos), MonthStatus, campo `manual`, celdas bloqueadas, confirmación regeneración, reversión festivos |
| QA Agent (`qa-tester`) | IA | ~1,5 h equiv. | CP-79..CP-85 (7 nuevos tests), 10 tests unitarios MonthStatus |
| Debug Agent (`debug-pipeline`) | IA | ~0,5 h equiv. | Diagnóstico BUG-27 (turbopack.root 404) y BUG-28 (grid vacío sin turnos) |
| Doc Agent (`doc-writer`) | IA | — | No invocado este sprint |

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Interacciones PM | Resultado |
|-------|-------------|--------|-----------------|-----------|
| `computeMonthStatus()` — lógica ungenerated/preparation/generated | Dev | S | 1 (validación estados con D manual) | ✅ |
| Badge MonthStatus junto al título del mes | Dev | S | 0 | ✅ |
| `GET /api/schedules` devuelve `{ assignments, monthStatus }` | Dev | M | 0 | ✅ |
| Componente `PrepPanel` — acordeón 4 pasos | Dev | L | 2 (revisión flujo Vacaciones, Libres, Festivos, Generar) | ✅ |
| PrepPanel paso Vacaciones: click celda → asigna V directamente | Dev | M | 0 | ✅ |
| PrepPanel paso Libres: click celda → asigna D con `manual: true` | Dev | M | 1 (confirmación D manual vs. D generado) | ✅ |
| PrepPanel paso Festivos: contador + enlace a /holidays | Dev | S | 0 | ✅ |
| PrepPanel paso Generar: botón Generar solo en este paso | Dev | S | 1 (validación: botón siempre visible o solo en paso activo) | ✅ |
| Migración campo `manual` en ShiftAssignment | Dev | S | 0 | ✅ |
| `POST /api/schedules` guarda `manual: true` desde UI | Dev | S | 0 | ✅ |
| `POST /api/schedules/generate` bloquea `V`, `B`, `D manual` | Dev | M | 0 | ✅ |
| Celdas bloqueadas: borde dashed ámbar + 🔒 | Dev | S | 1 (validación visual) | ✅ |
| `data-testid="cell-{id}-{date}"` en cada `<td>` del grid | Dev | S | 0 | ✅ |
| Modal confirmación regeneración (si mes `generated`) | Dev | M | 0 | ✅ |
| `DELETE /api/holidays/[id]` revierte MF→M, TF→T, NF→N | Dev | M | 0 | ✅ |
| Toast diferenciado con conteo de turnos revertidos | Dev | S | 0 | ✅ |
| Fix BUG-27: eliminar `turbopack.root: __dirname` en next.config.ts | Dev | S | 0 | ✅ |
| Fix BUG-28: empleados desde API, no de asignaciones | Dev | M | 0 | ✅ |
| 10 tests unitarios `MonthStatus` | Dev | S | 0 | ✅ |
| Tests E2E CP-79..CP-85 (7 nuevos) | QA | M | 0 | ✅ |
| Release notes Sprint 11 | Doc | S | 0 | ✅ |

---

## Interacciones del Project Manager

1. **Definición del flujo PrepPanel 4 pasos** — el PM diseñó el flujo completo: Vacaciones → Libres → Festivos → Generar.
2. **Validación de MonthStatus con D manual** — el PM aclaró que un mes con solo D manuales (sin V) debe estar en estado `preparation`, no `ungenerated`.
3. **Revisión del paso Vacaciones** — confirmación de que pulsar una celda debe asignar V directamente sin modal.
4. **Corrección del paso Libres** — el PM señaló la diferencia entre D generado y D manual; el PrepPanel solo asigna D manual.
5. **Validación visual de celdas bloqueadas** — el PM aprobó el estilo borde dashed ámbar con 🔒.
6. **Aprobación visibilidad botón Generar** — solo visible cuando el paso Generar está activo (no siempre).
7. **Revisión modal de confirmación** — el PM validó que la confirmación solo aparece cuando ya hay datos generados.

---

## Métricas de calidad del sprint

| Métrica | Antes | Después |
|---------|-------|---------|
| Tests unitarios | 118/118 ✅ | 128/128 ✅ (+10 MonthStatus) |
| Tests E2E | 77/77 ✅ | 84/84 ✅ (+7 nuevos: CP-79..CP-85) |
| Bugs encontrados | — | 2 (BUG-27, BUG-28) |
| Bugs resueltos | — | 2 |
| Commits del sprint | — | 1 |
| Archivos nuevos | — | 3 |
| Archivos modificados | — | 10 |

---

## Datos de plataforma

- Modelo utilizado: claude-sonnet-4-20250514
- Plataforma: GitHub Copilot Chat / VS Code
