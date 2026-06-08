# Informe de Estado — Sprint 25

**Fecha**: 2026-06-08  
**Sprint**: 25  
**Versión**: 2.5.0  
**Rama**: `feature/sprint-24-scheduling-fixes`  
**Estado**: ✅ Cerrado — pendiente merge manual

---

## Resumen ejecutivo

Sprint centrado en la corrección de tres bugs de permisos que bloqueaban a usuarios con roles EMPLOYEE y PROJECT_ADMIN, más dos mejoras visuales en la vista multi-mes. El sprint incluye además una revisión profunda del flujo de trabajo de los agentes de IA para prevenir este tipo de bugs en el futuro.

**Resultado**: 3 bugs corregidos, 2 features añadidas, 5 nuevos tests E2E, 5 agentes mejorados. 5/5 nuevos tests en verde. Suite completa: 127 passing, 14 failing (todos pre-existentes y documentados).

---

## Estado del producto

| Área | Estado | Notas |
|------|--------|-------|
| Vista mensual (cuadrante) | ✅ Estable | BUG-54/55 corregidos; SUPER_ADMIN y PROJECT_ADMIN pueden seleccionar proyecto y generar cuadrante |
| Vista multi-mes | ✅ Mejorada | BUG-53 corregido; festivos en rojo y fila propia resaltada |
| API de permisos | ✅ Estable | Permisos de EMPLOYEE y PROJECT_ADMIN correctamente configurados |
| Generación de cuadrantes | ✅ Estable | PROJECT_ADMIN puede generar a través del PrepPanel |
| Tests E2E | ✅ 127/141 | 14 fallos pre-existentes documentados en known-failures.md |
| TypeScript | ✅ 0 errores | `tsc --noEmit` limpio |

---

## Bugs corregidos en este sprint

| ID | Severidad | Descripción | Commit |
|----|-----------|-------------|--------|
| BUG-53 | 🟠 High | EMPLOYEE recibe 403 en `/api/employees` y `/api/holidays` | `8cf8803` |
| BUG-54 | 🔴 Critical | Proyecto activo se resetea al primer proyecto (stale closure) | `8cf8803` |
| BUG-55 | 🟠 High | PROJECT_ADMIN no ve PrepPanel (Generar, Vacaciones…) | `9c03938` |

---

## Bugs abiertos pendientes (pre-existentes, no abordados en este sprint)

Los 14 fallos E2E pre-existentes están documentados en `tests/e2e/known-failures.md`. Los más relevantes por impacto:

| ID | Sprint detectado | Descripción resumida |
|----|-----------------|----------------------|
| CP-89 | Sprint 12 | Own-row en schedule-grid no encontrada para admin (sin empleado vinculado) |
| CP-75 | Sprint 10 | EMPLOYEE ve "no publicado" en lugar del grid (seed sin cuadrante publicado) |
| CP-139 | Sprint 19 | SUPER_VIEWER grid no visible (mismo motivo que CP-75) |

---

## Mejoras de proceso implementadas

El sprint incorpora 4 mejoras al flujo de trabajo de los agentes que reducen la probabilidad de bugs de permisos escapando a producción:

1. **Smoke tests tras cada commit** — regresiones detectadas al mismo commit que las introduce
2. **`review-safe` obligatorio** — para commits que tocan permisos de UI
3. **CP-XX antes de implementar** — criterios de aceptación definidos en planning
4. **`known-failures.md`** — base de fallos pre-existentes para distinguir regresiones

---

## Métricas de calidad

| Métrica | Sprint 24 | Sprint 25 | Tendencia |
|---------|-----------|-----------|-----------|
| Tests E2E passing | 122 | 127 | ↑ +5 |
| Tests E2E failing (pre-exist.) | 14 | 14 | → |
| Bugs críticos abiertos | 1 (BUG-54) | 0 | ↓ ✅ |
| Errores TypeScript | 0 | 0 | → ✅ |

---

## Próximo sprint

Pendiente de definir con el usuario. Candidatos:
- Resolución de fallos pre-existentes (CP-89, CP-75, CP-139)
- Nuevas funcionalidades según roadmap
