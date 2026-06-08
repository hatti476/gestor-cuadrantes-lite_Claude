# Known E2E Test Failures

Fichero de fallos pre-existentes del suite Playwright.
Mantenido por `qa-tester` al cierre de cada sprint.

**Regla**: si un test falla y NO está en esta lista → es una regresión. STOP.
**Regla**: si un test que está aquí empieza a pasar → eliminarlo de la lista y documentarlo
en las release notes del sprint como "bug corregido".

---

## Fallos pre-existentes activos

Confirmados como pre-existentes mediante `git stash` en Sprint 25 (2026-06-05).

| ID | Descripción | Sprint detectado | Causa conocida |
|----|-------------|-----------------|----------------|
| CP-12 | Grid no muestra empleados en estado inicial | Sprint 2 | Seed de test no tiene empleados en el proyecto del test |
| CP-13 | Texto de estado vacío incorrecto | Sprint 2 | Mensaje hardcodeado no coincide con el esperado en el test |
| CP-33 | CSV download timeout | Sprint 4 | Timeout de descarga demasiado corto para el entorno CI |
| CP-75 | TECH user ve mensaje "no publicado" en lugar del grid | Sprint 10 | Seed de test no tiene cuadrante publicado para EMPLOYEE |
| CP-89 | Own-row highlight en schedule-grid no encontrada | Sprint 12 | Usuario admin no tiene registro de empleado; `emp.userId` no coincide |
| CP-91 | Auto-load holidays botón — comportamiento incorrecto | Sprint 13 | Comportamiento del botón cambió en sprint posterior |
| CP-92 | Auto-load holidays — validación de duplicados | Sprint 13 | Race condition con otros tests que crean festivos |
| CP-93 | Auto-load holidays — feedback de toast | Sprint 13 | Toast desaparece antes de que el test lo detecte |
| CP-94 | Auto-load holidays — recarga del grid | Sprint 13 | Timing de recarga variable |
| CP-109 | PrepPanel B toggle no encontrado | Sprint 16 | data-testid del toggle cambiado en refactor posterior |
| CP-124 | Botón undo generation no encontrado | Sprint 18 | Funcionalidad eliminada o renombrada en sprint posterior |
| CP-139 | SUPER_VIEWER grid no visible | Sprint 19 | Cuadrante no publicado en seed; SUPER_VIEWER requiere publicado |
| CP-149 | RatesLegend testid incorrecto | Sprint 24 | data-testid del componente cambiado |
| CP-154 | Alineación de columnas en tabla de tarifas | Sprint 24 | Cambio de layout en sprint 24 no actualizado en el test |

**Total pre-existentes**: 14  
**Última verificación**: Sprint 25 (2026-06-05)  
**Método de verificación**: `git stash` de cambios sprint-25 + ejecución completa del suite

---

## Historial de fallos corregidos

| ID | Descripción | Sprint corregido | Commit |
|----|-------------|-----------------|--------|
| BUG-53 / CP-158 | EMPLOYEE recibía 403 en `/api/employees` y `/api/holidays` | Sprint 25 | `8cf8803` |
| BUG-54 / CP-159 | Stale closure reseteaba proyecto activo al primer proyecto | Sprint 25 | `8cf8803` |
| BUG-55 / CP-162 | PROJECT_ADMIN no veía PrepPanel (Generar, Vacaciones...) | Sprint 25 | `9c03938` |
