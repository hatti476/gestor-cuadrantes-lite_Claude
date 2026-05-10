# Esfuerzo — Sprint 2: Datos reales, editor de turnos y gestión de empleados

**Período**: 2026-05-09  
**Estado**: Completado ✅  
**Commit**: `98110ce`

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Project Manager (usuario) | Humano | ~1.5 h | Definición RF-12..RF-22, corrección de requisitos del proxy, validación UX del editor |
| Dev Agent (`new-feature`) | IA | ~4 h equiv. | API schedules CRUD, ShiftEditor modal, employee management, fix proxy.ts |
| QA Agent (`qa-tester`) | IA | ~1.5 h equiv. | CP-12..CP-22, 6 fixes de testabilidad, informe de QA |
| Debug Agent (`debug-pipeline`) | IA | ~0.5 h equiv. | Diagnóstico bug proxy.ts (BUG-01) |
| Doc Agent (`doc-writer`) | IA | — | No invocado este sprint |

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Interacciones PM | Resultado |
|-------|-------------|--------|-----------------|-----------|
| API GET /api/schedules (filtro mes) | Dev | M | 0 | ✅ |
| API POST /api/schedules (upsert turno) | Dev | M | 0 | ✅ |
| API DELETE /api/schedules (eliminar turno) | Dev | S | 0 | ✅ |
| Componente ShiftEditor (modal de edición) | Dev | M | 1 (revisión UX) | ✅ |
| API GET/POST/PATCH/DELETE /api/employees | Dev | M | 0 | ✅ |
| Página /employees (tabla + acciones) | Dev | M | 0 | ✅ |
| Fix proxy.ts → excluir rutas /api/ | Dev | S | 1 (validación seguridad) | ✅ |
| Añadir data-testid a botones y modales | Dev | S | 0 | ✅ |
| Tests unitarios (37 tests) | Dev | M | 0 | ✅ |
| Tests E2E CP-12..CP-22 | QA | M | 0 | ✅ |
| Release notes Sprint 2 | Doc | S | 0 | ✅ |

---

## Interacciones del Project Manager

1. Validación del diseño del ShiftEditor (modal vs. drawer).
2. Confirmación de que la API debe rechazar con 401 (no redirigir).
3. Decisión de no implementar paginación en la tabla de empleados (fuera de scope).
4. Aprobación de la política de contraseñas (mínimo 8 caracteres, sin reglas adicionales).
5. Corrección de rumbo: el test CP-18 debía verificar HTTP 401, no la redirección.

---

## Métricas de calidad del sprint

| Métrica | Valor |
|---------|-------|
| Tests unitarios al final del sprint | 37/37 ✅ |
| Tests E2E al final del sprint | 11/11 ✅ (total acumulado: 22/22) |
| Bugs encontrados | 4 (BUG-01..BUG-04) |
| Bugs resueltos en el sprint | 4 |
| Commits del sprint | ~4 |

---

## Datos de plataforma

- Tokens consumidos: N/A (no accesible desde el agente)
- Modelo utilizado: claude-sonnet-4-20250514
- Plataforma: GitHub Copilot Chat / VS Code
