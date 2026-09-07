# Informe de Estado — Sprint 20 (cierre)

**Fecha del informe**: 2026-05-26  
**Sprint**: 20 — Refactor modular del generador  
**Versión funcional documentada**: 2.0  
**Estado del sprint**: Cerrado ✅  
**Siguiente sprint**: Sprint 21 (planificado)

---

## 1. Resumen ejecutivo

Sprint 20 cierra una fase de deuda técnica del motor de planificación de turnos.  
Se modularizó `lib/schedules/generate.ts` sin cambiar el comportamiento funcional esperado, extrayendo bloques de lógica a módulos dedicados y reforzando la mantenibilidad.

Resultado documentado del cierre:
- `generate.ts`: ~2350 → ~1605 líneas (-32%)
- 8 módulos nuevos en `lib/schedules/`
- 374 tests unitarios en verde
- Baseline E2E mantenido

---

## 2. Estado de producto

| Área | Estado | Observaciones |
|------|--------|---------------|
| Funcionalidad de usuario | Estable | Sprint 20 no añade features; mantiene comportamiento |
| Algoritmo de generación | Estable | Misma salida esperada, estructura interna modular |
| Administración RBAC | Estable | Sin cambios funcionales respecto a Sprint 19 |
| Exportación, festivos e historial | Estable | Sin cambios funcionales |

---

## 3. Estado técnico

| Capa | Estado Sprint 20 |
|------|------------------|
| Arquitectura `lib/schedules/` | Modularizada (8 módulos nuevos + orquestador principal) |
| Dependencias internas | Sin ciclos declarados entre módulos extraídos |
| Tests unitarios | 374/374 ✅ |
| E2E | Baseline de Sprint 19 mantenido |
| Riesgo principal remanente | `generate.ts` sigue con ~1605 líneas |

---

## 4. Módulos extraídos en Sprint 20

- `date-utils.ts`
- `night-blocks.ts`
- `rest-rules.ts`
- `shift-transitions.ts`
- `coverage.ts`
- `weekend-packs.ts`
- `workday-shifts.ts`
- `cross-month.ts`

---

## 5. Calidad y defectos

| Indicador | Estado |
|-----------|--------|
| Bugs abiertos críticos/altos del sprint | 0 |
| Bugs detectados durante refactor | BUG-38, BUG-39 |
| Estado de BUG-38/39 | Cerrados ✅ |

---

## 6. Riesgos activos al cierre

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| `generate.ts` mantiene alta complejidad por el loop día-a-día | Media | Sprint 21: extraer `day-loop.ts` y reducir a orquestación |
| E2E aún no integrado de forma completa en CI/CD | Media | Planificar pipeline gradual en próximos sprints |

---

## 7. Próximos pasos (Sprint 21)

1. Extraer loop día-a-día a `day-loop.ts`.
2. Reducir `generate.ts` a capa de orquestación.
3. Mantener 100% pass rate en unit y E2E.
4. Cerrar actualización documental completa al final del sprint.

---

## 8. Artefactos del cierre de Sprint 20

- Release notes: `docs/sprint-20-release-notes.md`
- Effort: `docs/effort/SPRINT-20-EFFORT.md`
- Requisitos actualizados: `docs/REQUIREMENTS.md`
- Registro de bugs: `docs/bugs/BUG-REGISTRY.md`
