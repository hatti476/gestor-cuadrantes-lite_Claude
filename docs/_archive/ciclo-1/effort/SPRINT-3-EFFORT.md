# Esfuerzo — Sprint 3: Generación automática, exportación y mejoras

**Período**: 2026-05-09  
**Estado**: Completado ✅  
**Commit**: `750790c`

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Project Manager (usuario) | Humano | ~1 h | Definición RF-23..RF-25, validación lógica de generación cíclica |
| Dev Agent (`new-feature`) | IA | ~4 h equiv. | Algoritmo generación 21 días, API generate, cambio contraseña, MF/TF/NF, impresión |
| QA Agent (`qa-tester`) | IA | ~1.5 h equiv. | CP-23..CP-28, 6 fixes de código/test, informe de QA |
| Debug Agent (`debug-pipeline`) | IA | ~0.5 h equiv. | Diagnóstico BUG-06 (skipDuplicates SQLite) y BUG-07 (seed) |
| Doc Agent (`doc-writer`) | IA | — | No invocado este sprint |

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Interacciones PM | Resultado |
|-------|-------------|--------|-----------------|-----------|
| Algoritmo cíclico 21 días en lib/schedules/generate.ts | Dev | L | 2 (validación patrón, revisión tipos) | ✅ |
| API POST /api/schedules/generate | Dev | M | 0 | ✅ |
| Tipos MF, TF, NF en ShiftEditor y API | Dev | S | 1 (confirmación scope) | ✅ |
| API PATCH /api/employees/[id] — cambio contraseña | Dev | S | 0 | ✅ |
| Página /employees — modal cambio contraseña | Dev | S | 0 | ✅ |
| Botón Imprimir (window.print) | Dev | S | 0 | ✅ |
| Fix campo password vs passwordHash (BUG-05) | Dev | S | 0 | ✅ |
| Fix createMany → upsert individual (BUG-06) | Dev | S | 0 | ✅ |
| Fix seed restaura contraseñas (BUG-07) | Dev | S | 0 | ✅ |
| Tests unitarios (52→57 tests) | Dev | M | 0 | ✅ |
| Tests E2E CP-23..CP-28 | QA | M | 0 | ✅ |
| Release notes Sprint 3 | Doc | S | 0 | ✅ |

---

## Interacciones del Project Manager

1. Confirmación del patrón cíclico de 21 días (M×7 → T×7 → N×7).
2. Decisión de respetar siempre los turnos manuales en la generación (no sobreescribir).
3. Validación de los tipos de turno festivo (MF, TF, NF) como subconjunto de los existentes.
4. Corrección de rumbo: CP-26 no puede asumir un mes limpio si hay tests previos.

---

## Métricas de calidad del sprint

| Métrica | Valor |
|---------|-------|
| Tests unitarios al final del sprint | 57/57 ✅ |
| Tests E2E al final del sprint | 6/6 ✅ (total acumulado: 28/28) |
| Bugs encontrados | 3 (BUG-05..BUG-07) |
| Bugs resueltos en el sprint | 3 |
| Commits del sprint | ~3 |

---

## Datos de plataforma

- Tokens consumidos: N/A (no accesible desde el agente)
- Modelo utilizado: claude-sonnet-4-20250514
- Plataforma: GitHub Copilot Chat / VS Code
