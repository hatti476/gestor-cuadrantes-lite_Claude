# Sprint 14 — Release Notes

**Fecha**: 18/05/2026  
**Versión**: 1.5  
**Rama**: `main`  
**Estado**: ✅ Completado

---

## Resumen ejecutivo

Sprint 14 es un sprint de estabilización post-Sprint 13: corrección de los 6 bugs
detectados durante el testing manual tras el cierre de la versión 1.4. No se añaden
funcionalidades nuevas; el objetivo es dejar el algoritmo de generación y la UI
sin defectos conocidos antes de abordar el refinamiento profundo del algoritmo
en Sprint 15.

---

## Bugs corregidos

### BUG-32 — Proyecto de localStorage persiste si no existe en la BD

| Campo | Valor |
|-------|-------|
| **Severidad** | 🟠 High |
| **Fichero** | `app/page.tsx` |

Al recargar la aplicación, si el proyecto guardado en `localStorage["activeProject"]`
ya no existe en la base de datos (fue eliminado), la home intentaba cargarlo y
quedaba en estado de error silencioso. El fix limpia `localStorage` y redirige al
selector de proyecto cuando la API devuelve 404 para el proyecto almacenado.

---

### BUG-33 — Empleado de reemplazo recibe dos bloques de noches consecutivos

| Campo | Valor |
|-------|-------|
| **Severidad** | 🟠 High |
| **Fichero** | `lib/schedules/generate.ts` |

Cuando un técnico en rotación de noches era sustituido por un empleado de reemplazo
en mitad del bloque, el algoritmo podía asignar al sustituto el resto del bloque
activo y además el siguiente bloque completo sin pausa. El fix garantiza que el
sustituto no puede aparecer en el plan de noches del bloque siguiente hasta que
hayan pasado los 3 días de descanso post-bloque.

---

### BUG-34 — Día 31 no se muestra en meses de 31 días

| Campo | Valor |
|-------|-------|
| **Severidad** | 🟡 Medium |
| **Fichero** | `app/page.tsx` |

El contenedor del grid usaba `overflow-x-hidden` en lugar de `overflow-x-auto`,
ocultando la columna del día 31 cuando el ancho disponible no era suficiente.
Cambiado a `overflow-x-auto` para habilitar el scroll horizontal.

---

### BUG-35 — Preferencia M/T ignorada en turnos MF/TF

| Campo | Valor |
|-------|-------|
| **Severidad** | 🟠 High |
| **Fichero** | `lib/schedules/generate.ts` |

`_pickWeekendShift` no leía `shiftPreference` ni `weeklyShift` del empleado al
elegir entre MF y TF en fines de semana y festivos. Rediseñada para respetar
estrictamente la preferencia; si el slot preferido ya está cubierto, el empleado
descansa (D) en lugar de recibir el turno contrario. Añadidos 2 tests de regresión.

---

### BUG-36 — Regla de 5 días consecutivos rota con MF/TF

| Campo | Valor |
|-------|-------|
| **Severidad** | 🟠 High |
| **Fichero** | `lib/schedules/generate.ts` |

`_updateState` no contabilizaba MF/TF como días de trabajo en el streak de
días consecutivos, permitiendo superar el límite de 5 días. El fix unifica el
conteo: cualquier turno de trabajo (M, T, MF, TF, tras `normalizeShift`) prolonga
el streak; solo D, N, J, V, B lo reinician. Añadido 1 test de regresión.

---

### BUG-37 — Pack Sáb+Dom no es indivisible

| Campo | Valor |
|-------|-------|
| **Severidad** | 🟠 High |
| **Fichero** | `lib/schedules/generate.ts` |

El algoritmo asignaba sábado y domingo de forma independiente, pudiendo dar el
sábado al empleado A y el domingo al empleado B. Añadida pre-selección de paquetes
Sáb+Dom antes del bucle principal: en cada sábado se elige un empleado para MF y
otro para TF que cubrirán ambos días. El plan pre-computado respeta disponibilidad,
plan de noches, preferencia J y el límite de consecutivos. Añadidos 2 tests de
regresión. 

---

## Métricas finales

| Métrica | Valor |
|---------|-------|
| Tests unitarios | 146/146 ✅ |
| Tests E2E | CP-01..CP-98 ✅ |
| Bugs cerrados en este sprint | 6 (BUG-32..BUG-37) |
| Bugs abiertos | 0 |
| Archivos modificados | `app/page.tsx`, `lib/schedules/generate.ts` |

---

## Próximo sprint

**Sprint 15** — Refinamiento del algoritmo de generación:
- Revisión integral de las reglas de equidad M/T a largo plazo
- Mejoras en la distribución de fines de semana entre empleados
- Posibles ajustes en el bloque de noches (v3) según retroalimentación
