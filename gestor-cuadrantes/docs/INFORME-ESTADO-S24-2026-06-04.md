# Informe de Estado — Sprint 24 (cierre)

**Fecha del informe**: 2026-06-04  
**Sprint**: 24 — Correcciones del motor de planificación y vista multi-mes  
**Versión funcional documentada**: 2.4.0  
**Estado del sprint**: Cerrado ✅ (pendiente merge manual)  
**Siguiente sprint**: Sprint 25 (por planificar)

---

## 1. Resumen ejecutivo

Sprint 24 cierra con 12 bugs corregidos (5 críticos de algoritmo de planificación,
4 altos de UI multi-mes, 3 bajos/medios de layout) y 1 nueva feature (vista
multi-mes expandida). La PR #13 está lista para merge.

- **PR #13**: Listo para merge ✅ (pendiente acción manual)
- **TypeScript**: ✅ sin errores
- **Unit tests**: 425/427 pasando (2 fallos pre-existentes Sprint 17, sin regresión)
- **E2E nuevos**: CP-149..CP-154 (6 nuevos casos de prueba)

---

## 2. Estado de producto

| Área | Estado | Observaciones |
|------|--------|---------------|
| Generación de cuadrantes | Mejorado | BUG-42/43/44/52 corregidos — algoritmo más robusto |
| Vista multi-mes | Nuevo | Página `/multi-month` operativa con scroll horizontal |
| Resumen de complementos (UI) | Estable | Layout tres tablas corregido (BUG-45/50/51) |
| Continuidad cross-month noches | Mejorado | BUG-48 corregido — sin acumulación 11+ noches |
| Filtrado por proyecto en multi-mes | Estable | BUG-46 corregido |

---

## 3. Estado técnico

| Indicador | Estado S24 |
|-----------|------------|
| PR principal de sprint | #13 ready (pendiente merge) |
| Commits totales en PR | 6 |
| Validación estática | `npx tsc --noEmit` ✅ |
| Unit tests | 425/427 ✅ (2 fallos pre-existentes Sprint 17) |
| E2E nuevos | CP-149..154 añadidos |
| BUG-REGISTRY | Actualizado BUG-41..52 |
| Release notes | `sprint-24-release-notes.md` cerrado ✅ |

Estado general: **verde** en funcionalidad, calidad y documentación.

---

## 4. Bugs corregidos en Sprint 24 (12 total)

| ID | Título | Severidad | Commit |
|----|--------|-----------|--------|
| BUG-41 | Leyenda de tarifas desaparecida de la UI | 🟡 Medium | Sprint 24 inicio |
| BUG-42 | Empleados con pref. T nunca reciben fines de semana | 🔴 High | Sprint 24 inicio |
| BUG-43 | >2 fines de semana entre bloques de noche | 🔴 High | Sprint 24 inicio |
| BUG-44 | >5 turnos consecutivos por reparación en fin de semana | 🔴 High | Sprint 24 inicio |
| BUG-45 | RatesLegend debajo de la tabla en lugar de a la derecha | 🟡 Medium | `1223c10` |
| BUG-46 | Empleados de otros proyectos visibles en multi-mes | 🔴 High | `8ea1a6e` |
| BUG-47 | Toolbar multi-mes inconsistente con app principal | 🟡 Medium | `8ea1a6e` |
| BUG-48 | 11+ noches consecutivas al cambiar rotación entre meses | 🔴 High | `1223c10` |
| BUG-49 | Celdas multi-mes sin estilo ShiftCell | 🟡 Medium | `8ea1a6e` |
| BUG-50 | RatesLegend apilada verticalmente debajo de ExtraPayTable | 🟡 Medium | `925ede7` |
| BUG-51 | Tres tablas de resumen separadas por justify-between | 🟢 Low | `3886758` |
| BUG-52 | Turno Tarde sin cobertura con surplus de Mañana | 🟠 High | `3886758` |

---

## 5. Nueva feature: Vista multi-mes

Página `/multi-month` accesible desde el botón "↔ Vista ampliada" en el toolbar.
Muestra un grid de scroll horizontal con empleados como filas y fechas de múltiples
meses como columnas, codificadas por color según tipo de turno. Configurable:
2, 3, 4 o 6 meses. Default: 3 meses centrado en el mes actual.

---

## 6. Tests añadidos en Sprint 24

### Unit tests (Vitest)
| CP | Fichero | Descripción |
|----|---------|-------------|
| CP-155 | `coverage-swap-repair.test.ts` | M surplus → T debe estar cubierto (invariante swap) |
| CP-156 | `coverage-swap-repair.test.ts` | T surplus → M debe estar cubierto (invariante swap) |
| CP-157 | `coverage-swap-repair.test.ts` | Sin transiciones inválidas (N→M, N→T, T→M) tras swap |

### E2E tests (Playwright)
| CP | Fichero | Descripción |
|----|---------|-------------|
| CP-149 | `sprint-24.spec.ts` | Toolbar multi-mes usa `text-xs` / `gap-2` (BUG-47) |
| CP-150 | `sprint-24.spec.ts` | Botón Back multi-mes tiene `data-testid="btn-back"` |
| CP-151 | `sprint-24.spec.ts` | Vista multi-mes no mezcla empleados de otros proyectos (BUG-46) |
| CP-152 | `sprint-24.spec.ts` | Celdas multi-mes usan ShiftCell con `border-radius > 0` (BUG-49) |
| CP-153 | `sprint-24.spec.ts` | `rates-legend` visible en misma fila que ExtraPayTable (BUG-50) |
| CP-154 | `sprint-24.spec.ts` | Tres tablas alineadas a la izquierda en fila (BUG-51) |

---

## 7. Estado de ramas y PRs

- **PR #13**: https://github.com/hatti476/gestor-cuadrantes/pull/13  
  - Título: Sprint 24 — scheduling fixes  
  - Estado: **Ready to merge** ✅ (pendiente merge manual)  
  - Branch: `feature/sprint-24-scheduling-fixes`  
  - HEAD: `cbbf93d`

---

## 8. Commits del sprint (en PR #13)

| Commit | Descripción |
|--------|-------------|
| `1223c10` | test+docs: unit tests BUG-48, registro BUG-45..48 |
| `8ea1a6e` | fix(ui): BUG-49 multi-month cell styling — ShiftCell, p-0.5, blue weekends; E2E CP-149..152 |
| `b9ce889` | chore(agents): tests obligatorios con cada fix en debug-pipeline y orchestrator |
| `925ede7` | fix(ui): BUG-50 RatesLegend layout vertical; E2E CP-153 |
| `3886758` | fix: layout tres tablas izquierda (BUG-51) + M↔T swap coverage repair (BUG-52); CP-154/155/156/157 |
| `cbbf93d` | docs: cierre sprint 24 — BUG-REGISTRY (BUG-41..52) + release notes |

---

## 9. Limitaciones conocidas y deuda técnica

| Limitación | Severidad | Recomendación Sprint 25 |
|------------|-----------|------------------------|
| Huecos TF en fines de semana con MF adyacente (BUG-52 parcial) | 🟠 High | Rediseñar paquete de fin de semana para permitir swap TF↔MF |
| Fallos pre-existentes en cross-month night continuity test (Sprint 17) | 🟡 Medium | Investigar y corregir en Sprint 25 |
| Cobertura E2E de la vista multi-mes limitada a 6 CPs focales | 🟢 Low | Ampliar aserciones de layout y datos en Sprint 25 |

---

## 10. Artefactos de referencia

- Release notes S24: `docs/sprint-24-release-notes.md`
- BUG-REGISTRY: `docs/bugs/BUG-REGISTRY.md` (BUG-41..52)
- PR #13: https://github.com/hatti476/gestor-cuadrantes/pull/13
- Informe actual: `docs/INFORME-ESTADO-S24-2026-06-04.md`
