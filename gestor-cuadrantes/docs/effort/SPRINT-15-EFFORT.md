# Esfuerzo — Sprint 15: Quality baseline, lint, CP-29 y documentación v1.5

**Período**: 19/05/2026  
**Estado**: Completado ✅  
**Versión**: 1.5  
**Rama**: `feature/sprint-15-quality-baseline`  
**Commits**: `971d5c9` (quality baseline) + `ec58bed` (release notes)

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Project Manager (usuario) | Humano | ~0,75 h | Decisión de convertir la higiene técnica en sprint propio, validación de cobertura CP-01..CP-98, priorización de Sprint 16 |
| Dev Agent (`new-feature`) | IA | ~1,5 h equiv. | Limpieza ESLint, eliminación de Google Fonts, recuperación CP-29, versionado npm 1.5.0 |
| QA Agent (`qa-tester`) | IA | ~0,5 h equiv. | Verificación CP-29, listado Playwright, validación de baseline lint/unit/build |
| Doc/Context Agent | IA | ~0,5 h equiv. | README, REQUIREMENTS, deployment, informe de estado y release notes alineados a v1.5 |
| Debug Agent (`debug-pipeline`) | IA | — | No invocado este sprint |

**Total humano estimado**: ~0,75 h  
**Total IA estimado**: ~2,5 h equiv.  
**Total sprint estimado**: ~3,25 h

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Interacciones PM | Resultado |
|-------|-------------|--------|-----------------|-----------|
| Crear sprint técnico separado para baseline de calidad | PM + Dev | S | 1 (decisión de alcance) | ✅ |
| Excluir `.next-test/**` de ESLint | Dev | S | 0 | ✅ |
| Limpieza de imports, estados y hooks con warnings | Dev | M | 0 | ✅ |
| Sustituir `next/font/google` por fuentes del sistema | Dev | S | 0 | ✅ |
| Recuperar CP-29 en `tests/e2e/sprint-3.spec.ts` | QA + Dev | S | 1 (validación gap 97/98) | ✅ |
| Alinear `package.json` y `package-lock.json` a `1.5.0` | Dev | S | 0 | ✅ |
| Actualizar README, REQUIREMENTS, deployment e informe de estado | Doc/Context | M | 1 (validación documental) | ✅ |
| Posponer cambios funcionales del algoritmo a Sprint 16 | PM + Dev | S | 1 (priorización) | ✅ |
| Validaciones lint, unit, build y listado E2E | QA | M | 0 | ✅ |
| Release notes Sprint 15 | Doc/Context | S | 0 | ✅ |

---

## Interacciones del Project Manager

1. **Decisión de sprint de saneamiento** — el PM separó explícitamente la higiene técnica de los cambios funcionales del generador.
2. **Validación de la discrepancia CP-29** — se confirmó que el hueco 97/98 debía cerrarse como E2E real.
3. **Priorización de Sprint 16** — los ajustes de algoritmo y festivos externos quedaron fuera de Sprint 15 para reducir riesgo.
4. **Revisión de documentación** — el PM mantuvo el informe de estado y requisitos como fuente de verdad antes de iniciar el siguiente sprint.

---

## Métricas de calidad del sprint

| Métrica | Antes | Después |
|---------|-------|---------|
| Lint | Con deuda acumulada | ✅ Passing |
| Tests unitarios | 146/146 ✅ | 146/146 ✅ |
| Tests E2E declarados | CP-01..CP-98 con CP-29 ausente | CP-01..CP-98 ✅ |
| Playwright list | 97 tests | 98 tests |
| Build | Dependiente de Google Fonts | ✅ Passing sin fuente externa |
| Bugs abiertos conocidos | — | 0 |
| Commits del sprint | — | 2 |

---

## Notas

- Sprint de higiene y consolidación: no se modifican reglas funcionales del algoritmo.
- Las métricas de esfuerzo son equivalencias aproximadas por complejidad, artefactos generados y validaciones ejecutadas; no son tiempos reales medidos de ejecución IA.
- Sprint 16 queda preparado como sprint funcional de algoritmo, descansos, ET y complementos económicos.

## Datos de plataforma

- Modelo utilizado: GPT-5 / Codex en entorno local
- Plataforma: Codex CLI / VS Code
