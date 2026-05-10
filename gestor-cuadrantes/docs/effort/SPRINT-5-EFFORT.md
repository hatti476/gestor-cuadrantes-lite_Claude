# Esfuerzo — Sprint 5: Página de ayuda contextual

**Período**: 2026-05-10  
**Estado**: Completado ✅  
**Commit**: `60f598a` (junto a post-fixes Sprint 4)

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Project Manager (usuario) | Humano | ~0.5 h | Definición RF-35..RF-37, aprobación del contenido de la guía por rol |
| Dev Agent (`new-feature`) | IA | ~1.5 h equiv. | Página /info, enlace Ayuda en header, contenido por rol |
| QA Agent (`qa-tester`) | IA | ~0.5 h equiv. | CP-40..CP-42, informe de QA |
| Doc Agent (`doc-writer`) | IA | — | No invocado este sprint (creado post-sprint) |

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Interacciones PM | Resultado |
|-------|-------------|--------|-----------------|-----------|
| Página /info (componente Server, SSR) | Dev | M | 1 (revisión contenido secciones) | ✅ |
| Enlace "Ayuda" en header (todos los roles) | Dev | S | 0 | ✅ |
| Contenido admin: 5 secciones | Dev | M | 0 | ✅ |
| Contenido técnico: 3 secciones | Dev | M | 0 | ✅ |
| Redirección /info → /login si no autenticado | Dev | S | 0 | ✅ |
| Tests E2E CP-40..CP-42 | QA | S | 0 | ✅ |
| Release notes Sprint 5 | Doc | S | 0 | ✅ |

---

## Interacciones del Project Manager

1. Definición del alcance de la página de ayuda (solo lectura, sin interactividad).
2. Validación de las secciones para cada rol (admin: 5, técnico: 3).
3. Confirmación de que el enlace debe ser visible para todos los usuarios autenticados.

---

## Métricas de calidad del sprint

| Métrica | Valor |
|---------|-------|
| Tests unitarios al final del sprint | 74/74 ✅ (sin cambios en S5) |
| Tests E2E al final del sprint | 3/3 ✅ (total acumulado: 41/41) |
| Bugs encontrados | 0 |
| Bugs resueltos en el sprint | — |
| Commits del sprint | 1 (compartido con post-fixes S4) |
| Ficheros modificados (estimado) | ~5 |

---

## Datos de plataforma

- Tokens consumidos: N/A (no accesible desde el agente)
- Modelo utilizado: claude-sonnet-4-20250514
- Plataforma: GitHub Copilot Chat / VS Code
