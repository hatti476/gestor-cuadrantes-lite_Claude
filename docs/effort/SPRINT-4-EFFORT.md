# Esfuerzo — Sprint 4: Festivos, CSV, historial y notificaciones

**Período**: 2026-05-09 – 2026-05-10  
**Estado**: Completado ✅  
**Commits**: `a05f59e` (entrega inicial), `60f598a` (post-fixes + Sprint 5), `39255ad` (cobertura tests CP-37..39)

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Project Manager (usuario) | Humano | ~2.5 h | Definición RF-26..RF-34, 4 correcciones mid-sprint (lógica festivos, popover, contadores, cabecera) |
| Dev Agent (`new-feature`) | IA | ~6 h equiv. | Modelo Holiday + ShiftChangeLog, API festivos, generate con festivos, CSV export, historial, toast |
| QA Agent (`qa-tester`) | IA | ~2 h equiv. | CP-30..CP-39, informe de QA, identificación de gaps CP-37/38/39 |
| Debug Agent (`debug-pipeline`) | IA | ~1 h equiv. | Diagnóstico BUG-08..BUG-13, fixes en generate route y schedule-grid |
| Doc Agent (`doc-writer`) | IA | — | No invocado este sprint (creado en post-sprint) |

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Interacciones PM | Resultado |
|-------|-------------|--------|-----------------|-----------|
| Modelo Prisma Holiday + ShiftChangeLog | Dev | M | 0 | ✅ |
| API GET/POST /api/holidays | Dev | M | 0 | ✅ |
| API DELETE /api/holidays/[id] | Dev | S | 0 | ✅ |
| Auto-update asignaciones al añadir festivo (RF-31, RF-32) | Dev | M | 1 (confirmación regla N→NF) | ✅ |
| Lógica N→NF en generate.ts (día siguiente) | Dev | M | 2 (corrección de rumbo: día propio vs siguiente) | ✅ |
| Página /holidays (CRUD festivos) | Dev | M | 0 | ✅ |
| Cabecera roja + letra día semana en grid (RF-33) | Dev | S | 1 (corrección: eliminar "F") | ✅ |
| Popover con nombre del festivo al pulsar (RF-34) | Dev | S | 1 (holidayDates Set→Map) | ✅ |
| Botón Exportar CSV | Dev | M | 0 | ✅ |
| API GET /api/employees/[id]/history | Dev | S | 0 | ✅ |
| Página /employees/[id]/history | Dev | S | 0 | ✅ |
| Registro ShiftChangeLog en POST /api/schedules | Dev | S | 0 | ✅ |
| Botón Historial en employee-table | Dev | S | 0 | ✅ |
| Toast provider global + useToast hook | Dev | M | 0 | ✅ |
| Fix BUG-08: update:{} → update:{shiftType} en generate | Dev | S | 0 | ✅ |
| Fix BUG-09: excluir MF/TF/NF del existingSet | Dev | S | 0 | ✅ |
| Fix BUG-10: N→NF usa día siguiente (day+86400000) | Dev | S | 0 | ✅ |
| Fix BUG-11: holidayDates Map<string,string> | Dev | S | 0 | ✅ |
| Fix BUG-12: eliminar "F" en cabecera festivo | Dev | S | 0 | ✅ |
| Fix BUG-13: MF/TF/NF en shiftOrder de contadores | Dev | S | 0 | ✅ |
| Tests unitarios reglas festivos (61→74 tests) | Dev | M | 0 | ✅ |
| applyHolidayRule + removeHolidayRule en business-logic | Dev | S | 0 | ✅ |
| Tests E2E CP-30..CP-36 | QA | M | 0 | ✅ |
| Tests E2E CP-37..CP-39 (añadidos post-entrega) | QA | M | 1 (directiva proactiva de tests) | ✅ |
| Fix BUG-14: M/T en finde → MF/TF; N→NF si siguiente es finde | Dev | M | 1 (correción PM al revisar app) | ✅ |
| Tests unitarios weekend (74→83 tests) | Dev | S | 0 | ✅ |
| Release notes Sprint 4 | Doc | S | 0 | ✅ |

---

## Interacciones del Project Manager

1. **Definición de RF-26..RF-34** — 9 requisitos funcionales detallados para festivos, CSV, historial y toasts.
2. **Corrección regla N→NF** — el PM confirmó que el turno N termina el día siguiente, por lo que la regla debía mirar el día siguiente, no el propio.
3. **Corrección popover** — el PM señaló que el popover debía mostrar el nombre del festivo (requirió cambio `Set→Map`).
4. **Corrección cabecera** — el PM señaló que la "F" ocultaba la letra del día de la semana.
5. **Corrección contadores** — el PM señaló que MF/TF/NF no aparecían en los contadores.
6. **Directiva proactiva de tests** — "Si, hazlo de forma proactiva a partir de ahora" → toda nueva funcionalidad debe llevar tests unitarios + E2E antes de hacer commit.
7. **Revisión post-S5 de la app** — el PM detectó que M/T en sábado/domingo no se convertían a MF/TF (BUG-14). Corregió la regla de negocio y confirmó el caso especial del domingo.

---

## Métricas de calidad del sprint

| Métrica | Valor |
|---------|-------|
| Tests unitarios al final del sprint | 83/83 ✅ |
| Tests E2E al final del sprint | 10/10 ✅ (total acumulado: 38/38) |
| Bugs encontrados | 7 (BUG-08..BUG-14) |
| Bugs resueltos en el sprint | 7 |
| Commits del sprint | 4 (`a05f59e`, `60f598a`, `39255ad`, `6f7c19c`) |
| Ficheros modificados (estimado) | ~20 |

---

## Datos de plataforma

- Tokens consumidos: N/A (no accesible desde el agente)
- Modelo utilizado: claude-sonnet-4-20250514
- Plataforma: GitHub Copilot Chat / VS Code
