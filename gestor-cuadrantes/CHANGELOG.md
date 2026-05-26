# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

Formato inspirado en Keep a Changelog y versionado semántico.

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
