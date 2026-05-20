# Esfuerzo — Sprint 16: Correcciones del algoritmo y complementos económicos

**Período**: 19/05/2026 - 20/05/2026  
**Estado**: Completado ✅  
**Versión**: 1.6  
**Rama**: `feature/sprint-16-algorithm-fixes`  
**Commits**: `cb1d43c`..`fed6036` (11 commits en rama feature)

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Project Manager / Product Owner (usuario) | Humano | ~3,0 h | Prompt Sprint 16, validación manual en navegador, screenshots de bugs, definición de bajas, festivos precargados, Navidad y ayuda legal |
| Dev Agent (`new-feature`) | IA | ~10,0 h equiv. | Algoritmo de noches, fines de semana, descansos, ET, PrepPanel, complementos económicos y UI asociada |
| QA Agent (`qa-tester`) | IA | ~2,0 h equiv. | Tests unitarios, E2E CP-99..CP-109, regresiones de algoritmo y validación Playwright |
| Debug Agent (`debug-pipeline`) | IA | ~1,5 h equiv. | Diagnóstico de MF sin cubrir, descansos de 1 día, packs viernes/lunes festivo, reglas cross-month |
| Context/Doc Agent | IA | ~0,5 h equiv. | Release notes, context-sync, actualización de ayuda legal en `/info` |

**Total humano estimado**: ~3,0 h  
**Total IA estimado**: ~14,0 h equiv.  
**Total sprint estimado**: ~17,0 h

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Interacciones PM | Resultado |
|-------|-------------|--------|-----------------|-----------|
| Revisión del prompt inicial y corrección Sprint 15 → Sprint 16 | PM + Dev | S | 1 | ✅ |
| Crear rama `feature/sprint-16-algorithm-fixes` y commits atómicos por tarea | Dev | S | 0 | ✅ |
| Toggle de celdas `V` y `D manual` en PrepPanel | Dev | M | 1 (validación UX) | ✅ |
| Excluir preferencia `J` de rotación automática de noches | Dev | M | 0 | ✅ |
| Consistencia MF/TF alineada con pauta semanal M/T | Dev | L | 2 (bugs de cobertura en fines de semana) | ✅ |
| Integrar festivos viernes/lunes pegados al pack de fin de semana | Dev | M | 1 (casos PO con viernes festivo) | ✅ |
| Regla mínima de 2 días `D` entre bloques de trabajo, incluido cruce de mes | Dev | L | 2 (capturas con D único) | ✅ |
| Validación ET Art. 34.3 y warnings en generación/manual | Dev | L | 0 | ✅ |
| Tabla de complementos económicos `MF/TF/N/NF` + `P. Extra` | Dev | M | 1 (revisión maquetación) | ✅ |
| Leyenda de paga por turno junto a complementos | Dev | S | 1 | ✅ |
| Turnos navideños `MN/TN/NN` a 126,50 € | Dev | M | 1 | ✅ |
| Color de `NN` en verde para agrupar noches | Dev | S | 1 | ✅ |
| Precarga automática de festivos sobre cuadrante vacío | Dev | M | 1 | ✅ |
| Añadir bajas `B` al flujo de preparación | Dev | M | 1 | ✅ |
| Resumen legal de descansos en `/info` | Doc/Dev | S | 1 | ✅ |
| Tests E2E CP-99..CP-108 | QA | L | 0 | ✅ |
| Test E2E CP-109 para toggle de bajas | QA | S | 0 | ✅ |
| Estabilización final post-validación manual | Debug + Dev | L | 3 | ✅ |

---

## Interacciones del Project Manager

1. **Prompt Sprint 16 completo** — el PM definió 7 tareas con commits atómicos y detectó referencias erróneas a Sprint 15 en el texto inicial.
2. **Validación manual inicial** — el PM pidió levantar servidor y revisó la app en navegador antes de continuar.
3. **Feedback UI complementos** — se solicitó eliminar el título redundante, renombrar `Total €` a `P. Extra` y añadir leyenda de tarifas.
4. **Feedback algoritmo fines de semana** — el PM detectó MF/TF sin cubrir y pidió integrar festivos pegados al pack de fin de semana.
5. **Definición de Navidad** — se incorporaron `MN`, `TN`, `NN` con tarifa única de 126,50 € para fechas concretas de diciembre/enero.
6. **Segunda validación con capturas** — el PM volvió a detectar MF sin cubrir y descansos de un solo día.
7. **Nuevas funcionalidades de preparación** — se añadieron festivos precargados sin botón, bajas en PrepPanel y resumen legal en Ayuda.

---

## Métricas de calidad del sprint

| Métrica | Antes | Después |
|---------|-------|---------|
| Tests unitarios | 146/146 ✅ | 217/217 ✅ |
| E2E Sprint 16 | — | 11/11 ✅ (`CP-99..CP-109`) |
| Suite E2E completa | 98/98 ✅ | 108/108 ✅ en cierre inicial; pendiente repetir completa tras CP-109 |
| Lint | ✅ | ✅ Passing |
| Build | ✅ | ✅ Passing |
| Bugs/ajustes detectados por PM | — | 7 principales |
| Bugs/ajustes resueltos | — | 7 |
| Commits del sprint | — | 11 |

---

## Notas

- Sprint 16 es el sprint de mayor complejidad algorítmica desde Sprint 9.
- El esfuerzo PM/PO aumenta por validación manual real con navegador, capturas y redefinición de reglas funcionales durante el sprint.
- Los tests E2E completos se verificaron en el cierre inicial con CP-99..CP-108. Tras añadir CP-109, se ejecutó la especificación Sprint 16 completa en verde; conviene repetir la suite global antes del merge final.
- Las métricas de IA son equivalencias aproximadas de dedicación por complejidad y no tiempo real de proceso.

## Datos de plataforma

- Modelo utilizado: GPT-5 / Codex en entorno local
- Plataforma: Codex CLI / VS Code
