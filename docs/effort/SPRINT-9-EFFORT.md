# Esfuerzo — Sprint 9: Algoritmo Fase 2 + correcciones Product Owner

**Período**: 12/05/2026  
**Estado**: Completado ✅  
**Commits principales**: `db53644` (algoritmo Fase 2) + `55133a3` (correcciones PO / UX) + `e0ed638` (RF-16) + fixes post-PO

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Project Manager (usuario) | Humano | ~2,5 h | Definición Fase 2, validación algoritmo de noches, 6 correcciones UX detectadas en revisión manual |
| Dev Agent (`new-feature`) | IA | ~7,0 h equiv. | Reescritura completa del algoritmo (generate.ts), migración schema, API actualizada, 40 tests unitarios, correcciones UX header/projects |
| QA Agent (`qa-tester`) | IA | ~2,0 h equiv. | CP-67..CP-70 (4 nuevos tests E2E), análisis de BUG-18..BUG-20 |
| Debug Agent (`debug-pipeline`) | IA | ~1,0 h equiv. | Diagnóstico BUG-18 (_pickWeekendShift sin parámetro wKey), BUG-20 (estado obsoleto servidor E2E) |
| Doc Agent (`doc-writer`) | IA | — | No invocado este sprint |

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Interacciones PM | Resultado |
|-------|-------------|--------|-----------------|-----------|
| `NIGHT_EPOCH_FRIDAY` — época de referencia | Dev | S | 1 (confirmación viernes 2 ene 2026) | ✅ |
| `nightBlockDays()` — estructura 2D+7N+3D | Dev | M | 0 | ✅ |
| `computeNightBlocks()` — asignación cíclica por mes | Dev | M | 0 | ✅ |
| `_pickWorkdayShift()` — cobertura ≥2M+2T, consistencia semanal, pref, equidad | Dev | L | 2 (revisión lógica cobertura mínima, corrección pref) | ✅ |
| `_pickWeekendShift()` — pref-aware, máx 1 MF+1 TF | Dev | M | 1 (validación pack Sáb+Dom) | ✅ |
| `_updateState()` — contador consecutivos, prevMonthTail | Dev | M | 0 | ✅ |
| `generateMonthSchedule()` — bucle principal, 7 niveles de prioridad | Dev | L | 1 (revisión orden de prioridades) | ✅ |
| Migración `shiftPreference` en Employee | Dev | S | 0 | ✅ |
| Migración `nightRotationOrder` en Project | Dev | S | 0 | ✅ |
| `POST /api/schedules/generate` actualizado | Dev | M | 0 | ✅ |
| Fix BUG-18: parámetro `wKey` en `_pickWeekendShift` | Dev | S | 0 | ✅ |
| Fix BUG-19: clave `EMPLOYEE` duplicada en ROLE_BADGES | Dev | S | 0 | ✅ |
| Fix BUG-20: mitigación servidor E2E con estado obsoleto | Dev | S | 0 | ✅ |
| UX Header: pestaña activa + orden + badge proyecto activo (BUG-21..23) | Dev | M | 2 (validación visual, corrección orden pestañas) | ✅ |
| UX Projects: botón Seleccionar + fila activa + max-w eliminado (BUG-24..25) | Dev | M | 2 (revisión PM: selector confuso) | ✅ |
| UX Home: eliminar ProjectSelector + localStorage síncrono (BUG-26) | Dev | M | 1 (corrección timing) | ✅ |
| 40 tests unitarios (nightBlock, computeNight, applySpecialDay, generateMonth) | Dev | L | 0 | ✅ |
| Tests E2E CP-67..CP-70 (4 nuevos) | QA | M | 0 | ✅ |
| Release notes Sprint 9 | Doc | S | 0 | ✅ |

---

## Interacciones del Project Manager

1. **Definición de la Fase 2 del algoritmo** — confirmación del bloque 2D+7N+3D y la época de referencia (viernes 2 enero 2026).
2. **Validación del ciclo de 84 días** — 7 técnicos × 12 días = 84 días garantiza inicio en viernes para rotationOrder=0.
3. **Revisión de la lógica de cobertura mínima** — confirmar que ≥2M y ≥2T es requisito diario, no semanal.
4. **Corrección de prioridad** — el PM indicó que V/B/J manual deben ser bloqueantes absolutos (nivel 1).
5. **Validación del pack Sáb+Dom** — el PM confirmó que sábado y domingo deben ir juntos al mismo empleado (implementado correctamente en _pickWeekendShift).
6. **Revisión UX post-sprint** — el PM navegó la app y detectó 6 problemas de UX (BUG-21..BUG-26): pestañas sin resaltar activa, orden confuso, proyecto activo no visible en header, selector de proyecto en home confuso, tabla de proyectos truncada, timing de carga del cuadrante.
7. **Corrección del selector de proyecto** — el PM insistió en que el proyecto debe elegirse desde /projects, no desde la home (BUG-25).
8. **Validación de correcciones UX** — aprobación tras ver las correcciones aplicadas.
9. **Confirmación del orden de pestañas** — Proyectos → Cuadrante → Empleados → Ayuda.
10. **Aprobación de cierre de sprint** — tras validar 118 tests unit + 69 E2E en verde.

---

## Métricas de calidad del sprint

| Métrica | Antes | Después |
|---------|-------|---------|
| Tests unitarios | 108/108 ✅ | 118/118 ✅ (suite Fase 2; incremento neto +10 tras reorganización) |
| Tests E2E | 65/65 ✅ | 69/69 ✅ (+4 nuevos: CP-67..CP-70) |
| Bugs encontrados | — | 9 (BUG-18..BUG-26) |
| Bugs resueltos | — | 9 |
| Commits del sprint | — | 4 principales + fixes post-PO documentados |
| Archivos nuevos | — | 3+ (migración Prisma, tests unitarios scheduler, tests/e2e/sprint-9.spec.ts) |
| Archivos modificados | — | 8 |

---

## Notas

- Este es el sprint de mayor carga técnica del proyecto: reescritura completa del algoritmo de 500+ líneas.
- Las correcciones UX post-sprint (BUG-21..26) duplicaron el esfuerzo inicial previsto para el sprint.
- Los tests unitarios del algoritmo Fase 2 son la mayor suite de tests del proyecto, aunque el incremento neto del contador quedó en +10 por reorganización de suites previas.

## Datos de plataforma

- Modelo utilizado: claude-sonnet-4-20250514
- Plataforma: GitHub Copilot Chat / VS Code
