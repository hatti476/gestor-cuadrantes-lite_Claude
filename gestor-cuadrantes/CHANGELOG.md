# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

Formato inspirado en Keep a Changelog y versionado semántico.

## [2.5.0] - 2026-06-08 ✅

### Added
- **Fila propia resaltada en multi-mes**: la fila del empleado logado aparece con fondo índigo, borde `ring-2 ring-indigo-300` e indicador `▶` en la vista `/multi-month`, consistente con la vista mensual normal.
- **Festivos en rojo en multi-mes**: las cabeceras de días festivos aparecen con `bg-red-200 text-red-800` en `/multi-month`; celdas sin turno en festivos con `bg-red-50`.
- **`tests/e2e/known-failures.md`**: nuevo fichero con 14 fallos E2E pre-existentes documentados, para distinguir regresiones de fallos conocidos en cada sprint.

### Fixed
- **BUG-53** 🟠: EMPLOYEE recibía 403 en `/api/employees` y `/api/holidays`, impidiendo ver la vista multi-mes. Fix: permisos ampliados a miembros del proyecto con `canViewProject`.
- **BUG-54** 🔴: Proyecto activo se reseteaba al primer proyecto en cada carga (stale closure en `useEffect`). Fix: leer `localStorage` dentro del `.then()` del fetch.
- **BUG-55** 🟠: PROJECT_ADMIN no veía el PrepPanel (Generar, Vacaciones, Bajas…). Fix: condición `{isAdmin && ...}` cambiada a `{canEdit && ...}`.

### Process
- Smoke tests obligatorios tras cada commit de tarea en el flujo de agentes.
- `review-safe` mandatorio para ficheros críticos de UI/permisos.
- CP-XX (criterios de aceptación) definidos en sprint planning antes de implementar.
- Matriz de roles en `qa-tester`: todo cambio de permisos genera tests multi-rol.

## [2.4.0] - 2026-06-04 ✅

### Added
- **Vista ampliada multi-mes**: nueva página `/multi-month` con scroll horizontal tipo Excel (2/3/4/6 meses configurables, empleados en filas, fechas en columnas, coloreado por tipo de turno). Accesible desde el botón "↔ Vista ampliada" en la barra de herramientas del cuadrante.
- **Leyenda de tarifas** (`RatesLegend`): caja visual a la derecha del resumen de complementos mostrando la tarifa por turno (MF=33€, TF=33€, N=38,5€, NF=49,5€, MN/TN/NN=126,5€ en Navidad).

### Fixed
- **BUG-41**: leyenda de tarifas de complementos desaparecida — restaurada con `RatesLegend` y CP-110 endurecido para verificar contenido visible.
- **BUG-42**: empleados con preferencia T nunca recibían fines de semana — añadido Tier 2.5 en `ensureWeekendPlan` que ignora el límite de ventana de trabajo para empleados con preferencia coincidente.
- **BUG-43**: empleados recibían >2 fines de semana entre bloques de noche — añadido `getWeekendsSinceLastNightBlock` y filtro en modo estricto (Tiers 1/2).
- **BUG-44**: más de 5 turnos de día consecutivos causados por reparación de cobertura en fin de semana — eliminada guardia `!isWeekend` al añadir a `forcedRestDates`, haciendo los descansos forzados de sábado/domingo inmunes a la fase de reparación.

## [2.3.1] - 2026-06-02

### Fixed
- Eliminada la fila redundante "Paga/turno" del bloque de complementos para alinear la tabla con el cuadrante y la tabla de contadores.
- Endurecida la cobertura E2E del resumen de complementos con verificación de layout real y ausencia de cabecera redundante (CP-110).

## [2.3.0] - 2026-06-01

### Added
- Publicación de cuadrantes por mes/proyecto con persistencia en `Schedule` (`published`, `publishedAt`, `publishedBy`).
- Endpoint `PATCH /api/schedules/publish` con validación, autorización e idempotencia.
- Pruebas E2E Sprint 23 (`CP-143` a `CP-146`) y tests unitarios de permisos para publicación.

### Changed
- `GET /api/schedules` ahora aplica gating de publicación para usuarios de solo lectura y devuelve `monthStatus: "unpublished"` cuando corresponde.
- `POST /api/schedules/generate` crea/actualiza el registro `Schedule` para el mes/proyecto generado.
- UI del cuadrante: badge de publicación, acción publicar/despublicar y mensaje "Cuadrante no disponible aún" en meses no publicados para perfiles read-only.

### Fixed
- Estabilidad de smoke E2E en flujo de visibilidad read-only (CP-146) evitando dependencias de estado compartido entre pruebas.
- Integridad del bloque nocturno de 7 días en generación mensual (TASK-01).
- Layout del grid en pantallas ultrawide con ancho intrínseco y celdas cuadradas (TASK-02).

## [2.2.0] - 2026-05-29

### Refactoring
- Eliminado `generate-core.ts`: arquitectura modular cerrada.
- `generate.ts` consolidado como orquestador puro (`<=300` líneas; actual 108).

### Testing
- Utilidades anti-flake E2E: `wait-utils`, `auth-utils`, `db-utils`, `retry-utils`, `fixtures/base`.
- 7 tests flakey migrados a utilidades estables (CP-15, CP-37, CP-38, CP-68, CP-77, CP-115, CP-116).

### CI/CD
- GitHub Actions: `ci.yml` (quality gates en PR/push a `main`).
- GitHub Actions: `e2e-smoke.yml` (smoke suite en PR).
- GitHub Actions: `e2e-nightly.yml` (suite completa nightly).
- 18 tests etiquetados como `@smoke`.

## [2.1.0] - 2026-05-27

### Refactoring
- Extraído `day-loop.ts` del núcleo de `generate.ts`.
- `generate.ts` reducido a 10 líneas (orquestador/facade, objetivo `<=300` cumplido).
- `DayLoopContext` introducido como estructura de datos explícita del loop.
- Arquitectura modular completada en `lib/schedules/` con `day-loop` y contratos dedicados.

### Tests
- Unit: 404/404 en verde.
- E2E: 142/142 en verde.

## [2.0.0] - 2026-05-26

### Changed
- Refactor modular de `lib/schedules/generate.ts` en 8 módulos especializados.
- Reducción aproximada del orquestador principal de ~2350 a ~1605 líneas.

### Fixed
- Correcciones de integración detectadas durante la modularización (imports y tipado estructural).

### Tests
- Ampliación de tests unitarios a 374 casos totales.
- Baseline E2E de Sprint 19 mantenido.

## [1.9.0] - 2026-05-26

### Added
- Sección `/admin` unificada con pestañas de usuarios y proyectos.
- Nuevos endpoints `api/admin/users` para gestión administrativa.
- Soporte explícito para rol global `SUPER_VIEWER` en navegación y permisos.

### Changed
- Revisión de permisos en rutas API con matriz RBAC más estricta.
- Redirección de `/employees` hacia `/admin`.

### Fixed
- Correcciones de algoritmo de cobertura y fines de semana (BUG-38, BUG-39, BUG-40).
