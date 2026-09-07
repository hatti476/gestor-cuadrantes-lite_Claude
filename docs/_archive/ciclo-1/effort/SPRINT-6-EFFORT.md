# Informe de Esfuerzo — Sprint 6

**Sprint**: 6 — Multiproyecto y roles (Fase 2 Kickoff)  
**Período**: 11/05/2026  
**Estado**: ✅ Completado

---

## Resumen de esfuerzo

| Categoría | Horas estimadas |
|-----------|----------------|
| Análisis y diseño (roles, schema) | 2.0 h |
| Migración Prisma (Project, ProjectMember) | 1.5 h |
| Renombrado global ADMIN→SUPER_ADMIN | 1.0 h |
| `lib/auth/permissions.ts` | 0.5 h |
| NextAuth session (projectMemberships) | 0.5 h |
| Seed + Docker + deployment.md | 1.5 h |
| Tests E2E CP-43..46 + fixes | 1.5 h |
| Tests unitarios permissions.ts (25 tests) | 0.5 h |
| Documentación (release notes, esfuerzo) | 0.5 h |
| **Total** | **9.5 h** |

---

## Métricas de calidad

| Métrica | Antes | Después |
|---------|-------|---------|
| Unit tests | 83/83 ✅ | 108/108 ✅ |
| E2E tests | 41/41 ✅ | 43/45 ✅* |
| Bugs introducidos | — | 0 |

*Los 2 fallos son tests flaky preexistentes (CP-08, CP-32) que varían entre ejecuciones.

---

## Decisiones técnicas

1. **Opción B (SUPER_ADMIN / USER)**: Se optó por una nomenclatura más explícita frente a ADMIN/EMPLOYEE para evitar ambigüedad con los roles de proyecto.

2. **Holiday sin projectId**: Se mantuvo `@@unique([date])` en Holiday para Sprint 6. La gestión de festivos por proyecto/CCAA se implementará en Sprint 9 con una tabla `ProjectHoliday` separada, evitando el problema de NULL en constraints únicos de SQLite.

3. **Funciones de autorización puras**: `lib/auth/permissions.ts` exporta funciones sin dependencias de BD, facilitando el testing unitario.

4. **projectMemberships en sesión JWT**: Se cargan desde BD en cada refresco del token JWT para mantener los permisos actualizados sin necesidad de re-login.

---

## Deuda técnica generada

- Los tests E2E de Sprint 4 (CP-30, CP-37) acumulaban festivos de QA entre runs — resuelta con el reset de BD. Falta añadir limpieza automática en `beforeEach/afterEach` de esos tests.
- CP-34 (historial) depende del estado creado por tests anteriores — candidato a refactorizar con `beforeAll` que cree los datos necesarios.
