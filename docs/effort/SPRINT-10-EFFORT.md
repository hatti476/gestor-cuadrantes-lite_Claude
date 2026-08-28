# Esfuerzo — Sprint 10: Soft-delete, shiftPreference UI, PROJECT_ADMIN edición, contadores

**Período**: 12/05/2026  
**Estado**: Completado ✅  
**Commit**: `7fcc9a9`

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Project Manager (usuario) | Humano | ~1,5 h | Definición RF soft-delete, validación UI contadores, aprobación permisos PROJECT_ADMIN edición |
| Dev Agent (`new-feature`) | IA | ~5,0 h equiv. | Soft-delete Employee, shiftPreference UI, nightRotationOrder UI, PROJECT_ADMIN edita turnos, CountersTable independiente |
| QA Agent (`qa-tester`) | IA | ~1,5 h equiv. | CP-71..CP-78 (8 nuevos tests), análisis de cobertura |
| Debug Agent (`debug-pipeline`) | IA | — | No invocado este sprint |
| Doc Agent (`doc-writer`) | IA | — | No invocado este sprint |

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Interacciones PM | Resultado |
|-------|-------------|--------|-----------------|-----------|
| Migración `active` en Employee (soft-delete) | Dev | S | 0 | ✅ |
| `PATCH /api/employees/[id]` — acepta `active`, `shiftPreference`, `role` | Dev | M | 0 | ✅ |
| `GET /api/employees?includeInactive=true` — solo SUPER_ADMIN | Dev | S | 1 (confirmación: PROJECT_ADMIN no ve inactivos) | ✅ |
| `DELETE /api/employees/[id]` → soft-delete (`active = false`) | Dev | S | 0 | ✅ |
| UI `/employees`: botón Desactivar + modal confirmación | Dev | M | 1 (revisión UX del modal) | ✅ |
| UI `/employees`: botón Reactivar para inactivos | Dev | S | 0 | ✅ |
| `EmployeeForm`: selector shiftPreference (Sin pref / M / T) | Dev | S | 0 | ✅ |
| `EmployeeTable`: badge de preferencia por empleado | Dev | S | 0 | ✅ |
| `NightRotationPanel` en `/projects`: reordenación ↑/↓ + guardar | Dev | M | 1 (validación UX orden de rotación) | ✅ |
| `PUT /api/projects/[id]` acepta `nightRotationOrder` | Dev | S | 0 | ✅ |
| PROJECT_ADMIN puede editar turnos de su proyecto | Dev | M | 1 (aprobación permisos) | ✅ |
| `POST/DELETE /api/schedules` — acepta PROJECT_ADMIN | Dev | S | 0 | ✅ |
| `CountersTable` extraída del `ScheduleGrid` | Dev | M | 1 (revisión visual alineación) | ✅ |
| Corrección hueco vacío a la derecha del grid (`w-fit`) | Dev | S | 0 | ✅ |
| Tests E2E CP-71..CP-78 (8 nuevos) | QA | M | 0 | ✅ |
| Release notes Sprint 10 | Doc | S | 0 | ✅ |

---

## Interacciones del Project Manager

1. **Confirmación del scope soft-delete** — solo SUPER_ADMIN puede desactivar/reactivar; el historial de turnos debe preservarse íntegro.
2. **Revisión UX modal de desactivación** — el PM solicitó un modal de confirmación explícito con texto de advertencia.
3. **Aprobación permisos PROJECT_ADMIN edición** — el PM confirmó que PROJECT_ADMIN debe poder editar turnos de su proyecto con las mismas restricciones que SUPER_ADMIN.
4. **Validación UI orden de rotación nocturna** — botones ↑/↓ con guardado explícito (no auto-save).
5. **Revisión visual de la CountersTable** — el PM solicitó que los ceros se muestren en gris para distinguirlos de valores reales.

---

## Métricas de calidad del sprint

| Métrica | Antes | Después |
|---------|-------|---------|
| Tests unitarios | 118/118 ✅ | 118/118 ✅ (sin cambios — lógica cubierta E2E) |
| Tests E2E | 69/69 ✅ | 77/77 ✅ (+8 nuevos: CP-71..CP-78) |
| Bugs encontrados | — | 0 |
| Bugs resueltos | — | — |
| Commits del sprint | — | 1 |
| Archivos nuevos | — | 2 |
| Archivos modificados | — | 9 |

---

## Datos de plataforma

- Modelo utilizado: claude-sonnet-4-20250514
- Plataforma: GitHub Copilot Chat / VS Code
