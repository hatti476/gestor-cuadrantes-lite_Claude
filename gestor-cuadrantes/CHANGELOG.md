# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

Formato inspirado en Keep a Changelog y versionado semántico.

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
