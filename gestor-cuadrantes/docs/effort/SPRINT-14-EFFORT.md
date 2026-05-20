# Esfuerzo — Sprint 14: Estabilización post-Sprint 13 (BUG-32..BUG-37)

**Período**: 18/05/2026  
**Estado**: Completado ✅  
**Versión**: 1.5  
**Rama**: `feature/sprint-14-stabilization`  
**PR**: https://github.com/hatti476/gestor-cuadrantes/pull/1

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Project Manager (usuario) | Humano | ~1,5 h | Testing manual post-Sprint 13 (detección BUG-32..37), cierre de sprint, revisión PR, merge a GitHub |
| Dev Agent (`new-feature`) | IA | ~2,5 h equiv. | Fix BUG-32..37 en app/page.tsx y lib/schedules/generate.ts, 5 tests de regresión |
| Pre-merge Review Agent | IA | ~0,5 h equiv. | Revisión de código, TypeScript, tests, documentación; generación del texto del PR |
| Context-Sync Agent | IA | ~0,5 h equiv. | Actualización context.md, copilot/context.md, BUG-REGISTRY, sprint-14-release-notes |
| Doc Agent (`doc-writer`) | IA | — | No invocado explícitamente (tareas asumidas por agente principal) |

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Interacciones PM | Resultado |
|-------|-------------|--------|-----------------|-----------|
| Fix BUG-32: limpiar localStorage si proyecto 404 | Dev | S | 1 (PM detectó bug en pruebas) | ✅ |
| Fix BUG-33: sustituto de noches no recibe bloque doble | Dev | M | 1 (PM detectó patrón en cuadrante generado) | ✅ |
| Fix BUG-34: `overflow-x-hidden` → `overflow-x-auto` | Dev | S | 1 (PM navegó a mayo 2026, día 31 ausente) | ✅ |
| Fix BUG-35: `_pickWeekendShift` respeta `shiftPreference` estrictamente | Dev | M | 1 (PM revisó cuadrante de empleado pref T con MF) | ✅ |
| Fix BUG-36: `_updateState` unifica streak M/T/MF/TF | Dev | M | 1 (PM contó días consecutivos en cuadrante) | ✅ |
| Fix BUG-37: pre-selección paquete Sáb+Dom antes del bucle | Dev | M | 1 (PM comprobó que Sáb y Dom tenían empleados distintos) | ✅ |
| Test regresión BUG-35: pref M → solo MF (nunca TF) | Dev | S | 0 | ✅ |
| Test regresión BUG-35: pref T → solo TF (nunca MF) | Dev | S | 0 | ✅ |
| Test regresión BUG-36: ningún empleado supera 5 días consecutivos | Dev | S | 0 | ✅ |
| Test regresión BUG-37: mismo empleado cubre Sáb+Dom (x2) | Dev | S | 0 | ✅ |
| Actualización BUG-REGISTRY: BUG-34..37 Open → Fixed | Context-sync | S | 0 | ✅ |
| Creación sprint-14-release-notes.md | Context-sync | S | 0 | ✅ |
| Actualización context.md + copilot/context.md → v1.5 | Context-sync | S | 0 | ✅ |
| Pre-merge review: tests, TypeScript, diff, docs | Pre-merge | M | 1 (PM solicitó ejecución del agente) | ✅ |
| Generación texto PR en GitHub | Pre-merge | S | 0 | ✅ |
| Commit de Sprint 14 en rama feature | Dev | S | 1 (PM indicó crear rama nueva en lugar de mergear directo) | ✅ |
| Push rama `feature/sprint-14-stabilization` | Dev | S | 0 | ✅ |
| Creación PR #1 en GitHub via `gh pr create` | Dev | S | 1 (PM solicitó creación automática del PR) | ✅ |

---

## Interacciones del Project Manager

1. **Testing manual post-Sprint 13** — el PM realizó pruebas en la aplicación y detectó los 6 bugs (BUG-32..37).
2. **Detección BUG-32** — proyecto en localStorage que ya no existía en la BD causaba estado de error silencioso.
3. **Detección BUG-33** — el PM observó en el cuadrante generado que el empleado de reemplazo recibía dos semanas de noches seguidas.
4. **Detección BUG-34** — al navegar a mayo 2026, el día 31 no aparecía en el grid.
5. **Detección BUG-35** — empleado con preferencia T recibía MF en algunos fines de semana.
6. **Detección BUG-36** — el PM contó manualmente los días consecutivos y encontró una secuencia de 7 días sin descanso.
7. **Detección BUG-37** — el sábado y el domingo de un mismo fin de semana tenían empleados distintos asignados.
8. **Solicitud de rama separada** — el PM indicó crear `feature/sprint-14-stabilization` en lugar de hacer merge directo a main.
9. **Solicitud de ejecución del agente pre-merge-review** — el PM pidió el review formal antes del PR.
10. **Solicitud de creación automática del PR** — el PM pidió crear el PR directamente desde el agente.

---

## Métricas de calidad del sprint

| Métrica | Antes | Después |
|---------|-------|---------|
| Tests unitarios | 141/141 ✅ | 146/146 ✅ (+5 regresión BUG-35/36/37) |
| Tests E2E | 98/98 ✅ | 98/98 ✅ (sin nuevos) |
| Bugs detectados | — | 6 (BUG-32..BUG-37) |
| Bugs resueltos | — | 6 |
| Bugs abiertos al cierre | — | 0 |
| Commits del sprint | — | 1 |
| Archivos modificados | — | 4 (app/page.tsx, lib/schedules/generate.ts, tests/unit/scheduler/generate.test.ts, docs/) |
| PR generado | — | #1 ✅ |

---

## Notas

- Sprint de estabilización puro: sin funcionalidades nuevas, solo corrección de bugs y cierre formal.
- El ratio de interacciones PM/sprint es el más alto del proyecto (10) porque el PM realizó el testing manual completo, que en sprints anteriores se delegaba en el agente QA.
- El agente `pre-merge-review` fue invocado por primera vez en este sprint, habiendo sido creado previamente sin uso.

## Datos de plataforma

- Modelo utilizado: claude-sonnet-4-20250514
- Plataforma: GitHub Copilot Chat / VS Code
