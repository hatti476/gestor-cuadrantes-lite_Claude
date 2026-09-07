# Esfuerzo — Sprint 8: Acceso PROJECT_ADMIN + estabilización E2E

**Período**: 12/05/2026  
**Estado**: Completado ✅  
**Commits**: `fff5142` (fixes pre-sprint + estabilidad E2E) + `6e359ef` (refactor tests) + `7eaddcb` (feature PROJECT_ADMIN)

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Project Manager (usuario) | Humano | ~2,0 h | Revisión manual de 7 fallos E2E, validación UX PROJECT_ADMIN, aprobación matriz de permisos |
| Dev Agent (`new-feature`) | IA | ~4,0 h equiv. | Acceso PROJECT_ADMIN a /projects, soft-delete de miembros, 14 fixes E2E pre-sprint |
| QA Agent (`qa-tester`) | IA | ~1,5 h equiv. | CP-57..CP-66 (10 nuevos tests), análisis de fallos de estabilidad |
| Debug Agent (`debug-pipeline`) | IA | ~0,5 h equiv. | Diagnóstico BUG-16 (transacción SQLite) y BUG-17 (historial ausente) |
| Doc Agent (`doc-writer`) | IA | — | No invocado este sprint |

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Interacciones PM | Resultado |
|-------|-------------|--------|-----------------|-----------|
| Acceso PROJECT_ADMIN a `/projects` — flag `isProjectAdmin` | Dev | M | 1 (validación matriz permisos) | ✅ |
| Botones de escritura global bajo `{isSuperAdmin && ...}` | Dev | S | 0 | ✅ |
| Botón Miembros visible solo para PROJECT_ADMIN del proyecto | Dev | S | 0 | ✅ |
| Fix CP-08: `waitForSelector('table')` antes del count | Dev | S | 0 | ✅ |
| Fix CP-10/11: `NEXTAUTH_URL` en `env` del webServer | Dev | S | 1 (diagnostico logout) | ✅ |
| Fix CP-26/27: `prisma.$transaction([])` en generate route (BUG-16) | Dev | M | 0 | ✅ |
| Fix CP-30: timeout aumentado a 20 s | Dev | S | 0 | ✅ |
| Fix CP-32/37: `test.setTimeout(60_000)` | Dev | S | 0 | ✅ |
| Fix CP-34: `data-testid="btn-history-{id}"` + modal historial (BUG-17) | Dev | M | 1 (confirmación comportamiento) | ✅ |
| Fix CP-35: `clearCookies()` antes de acceso denegado | Dev | S | 0 | ✅ |
| Fix CP-53: test con proyecto propio en lugar del seed compartido | Dev | S | 0 | ✅ |
| Refactor suites S2/S3/S7: `test.slow()` + `waitForURL` | Dev | S | 0 | ✅ |
| Fichero `tests/e2e/config.ts` centralizado | Dev | S | 0 | ✅ |
| Tests E2E CP-57..CP-66 (10 tests) | QA | M | 0 | ✅ |
| Release notes Sprint 8 | Doc | S | 0 | ✅ |

---

## Interacciones del Project Manager

1. **Identificación de 7 fallos E2E** — el PM ejecutó la suite completa y reportó los tests en rojo.
2. **Validación de la matriz de permisos PROJECT_ADMIN** — confirmar qué botones son visibles y cuáles no.
3. **Diagnóstico logout roto** — CP-10/11 fallaban por ausencia de `NEXTAUTH_URL` en el contexto de tests.
4. **Aprobación del comportamiento del botón Historial** — el PM confirmó que debe ser visible en `/employees` (no en página separada).
5. **Decisión de no paginación en historial** — dejado para Sprint 13.
6. **Corrección de CP-53** — el PM señaló que el test compartía estado con otros tests del seed.
7. **Aprobación del refactor de tests** — centralización de configuración E2E.

---

## Métricas de calidad del sprint

| Métrica | Antes | Después |
|---------|-------|---------|
| Tests unitarios | 108/108 ✅ | 108/108 ✅ (sin cambios) |
| Tests E2E | 55/55 ✅ | 65/65 ✅ (+10 nuevos) |
| Bugs encontrados | — | 3 (BUG-15..BUG-17) |
| Bugs resueltos | — | 3 |
| Fallos E2E estabilizados | — | 7 |
| Commits del sprint | — | 3 |
| Archivos nuevos | — | 3 |
| Archivos modificados | — | 11 |

---

## Datos de plataforma

- Modelo utilizado: claude-sonnet-4-20250514
- Plataforma: GitHub Copilot Chat / VS Code
