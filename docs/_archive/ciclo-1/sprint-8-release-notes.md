# Sprint 8 — Release Notes

**Fecha**: 12/05/2026  
**Versión**: 0.8  
**Commits**: `fff5142` (fix pre-sprint) + `6e359ef` (refactor tests) + `7eaddcb` (feature)  
**Estado**: ✅ Completado

---

## Resumen ejecutivo

Sprint 8 completa la Fase 2 de multiproyecto cerrando el acceso de **PROJECT_ADMIN** a la UI de gestión de proyectos. Hasta este sprint, `/projects` solo era accesible para SUPER_ADMIN; ahora un PROJECT_ADMIN puede ver sus proyectos y gestionar sus miembros sin acceder a funciones reservadas al SUPER_ADMIN. Adicionalmente se corrigieron 7 fallos E2E pre-existentes que bloqueaban la ejecución estable de la suite completa.

---

## Funcionalidades implementadas

### Acceso PROJECT_ADMIN a `/projects`

| Comportamiento | Antes | Después |
|---------------|-------|---------|
| Acceso a `/projects` | Redirigía a `/` | Carga la página |
| Botón `+ Nuevo proyecto` | — | No visible (solo SUPER_ADMIN) |
| Botones `Editar` / `Eliminar` | — | No visibles (solo SUPER_ADMIN) |
| Botón `Miembros` | — | Visible en sus proyectos |
| Añadir miembro con rol EMPLOYEE | — | ✅ Permitido |
| Añadir miembro con rol PROJECT_ADMIN | — | ❌ 403 Forbidden |
| Eliminar miembro de su proyecto | — | ✅ Permitido |
| Crear proyecto vía API | — | ❌ 403 Forbidden |

**Fichero modificado**: `app/projects/page.tsx`  
- Nuevo flag `isProjectAdmin` derivado de `session.user.projectMemberships`  
- Condición de acceso: `canAccess = isSuperAdmin || isProjectAdmin`  
- Botones de escritura global (Nuevo, Editar, Eliminar proyecto) siguen bajo `{isSuperAdmin && ...}`  
- Botón `Miembros` visible solo si el usuario es SUPER_ADMIN o tiene membresía PROJECT_ADMIN en ese proyecto concreto

---

## Correcciones de estabilidad (pre-sprint)

Resueltos 7 fallos E2E detectados al ejecutar la suite completa de 55 tests (commit `fff5142`):

| CP | Síntoma | Solución |
|----|---------|----------|
| CP-08 | `count()` de columnas de fin de semana fallaba si la tabla aún no era visible | Añadido `waitForSelector('table')` antes del count |
| CP-10, CP-11 | El logout redirigía a `/api/auth/signout` en lugar de `/login` porque `NEXTAUTH_URL` no estaba disponible en el contexto del webServer | Añadida `NEXTAUTH_URL` al `env` del webServer en `playwright.config.ts` |
| CP-26, CP-27 | Los upserts en lote de la generación automática fallaban en SQLite cuando no había transacción explícita | Refactorizado `app/api/schedules/generate/route.ts` para usar `prisma.$transaction([])` |
| CP-30 | Timeout en la carga inicial de `/holidays` durante compilación dev | Aumentado timeout a 20 s en ese test |
| CP-32, CP-37 | Fallos esporádicos por exceder el timeout por defecto de 30 s en tests con navegación larga | `test.setTimeout(60_000)` en los tests afectados |
| CP-34 | El botón `btn-history-{id}` y el modal de historial no existían en `/employees` | Añadidos `data-testid="btn-history-{id}"` y modal de historial en `app/employees/page.tsx` y `components/employees/employee-table.tsx` |
| CP-35 | La verificación de acceso denegado no limpiaba las cookies, permitiendo que la sesión anterior filtrase | Añadido `clearCookies()` antes de la comprobación de acceso |
| CP-53 | El test usaba el proyecto del seed compartido, afectando a otros tests de miembros | Cambiado para crear un proyecto propio en el test |

Adicionalmente, los tests de las suites Sprint 2, 3 y 7 se refactorizaron con `test.slow()` en CP-23/CP-48 y `waitForURL` en CP-20 para mejorar la estabilidad general (**commit `6e359ef`**).

---

## Bugs encontrados y resueltos

| ID | Descripción | Severidad | Commit fix |
|----|-------------|-----------|-----------|
| [BUG-15](bugs/BUG-REGISTRY.md#bug-15) | PROJECT_ADMIN redirigido de `/projects` a la home | 🟠 High | `7eaddcb` |
| [BUG-16](bugs/BUG-REGISTRY.md#bug-16) | Generación automática: batch upserts sin transacción fallaban en SQLite | 🟡 Medium | `fff5142` |
| [BUG-17](bugs/BUG-REGISTRY.md#bug-17) | Botón e historial de turnos ausentes en `/employees` | 🟡 Medium | `fff5142` |

---

## Tests

### Unitarios

Sin cambios en los tests unitarios. Todos siguen en verde: **108/108**.

### E2E Sprint 8 — nuevos tests

| ID | Descripción | Estado |
|----|-------------|--------|
| CP-57 | PROJECT_ADMIN accede a `/projects` sin ser redirigido | ✅ |
| CP-58 | PROJECT_ADMIN ve solo sus proyectos (no todos) | ✅ |
| CP-59 | PROJECT_ADMIN NO ve el botón `+ Nuevo proyecto` | ✅ |
| CP-60 | PROJECT_ADMIN NO ve los botones `Editar` ni `Eliminar` de proyecto | ✅ |
| CP-61 | PROJECT_ADMIN SÍ ve el botón `Miembros` en su proyecto | ✅ |
| CP-62 | PROJECT_ADMIN puede añadir un miembro (rol EMPLOYEE) | ✅ |
| CP-63 | API devuelve 403 si PROJECT_ADMIN intenta asignar rol PROJECT_ADMIN | ✅ |
| CP-64 | PROJECT_ADMIN puede eliminar un miembro de su proyecto | ✅ |
| CP-65 | EMPLOYEE sin PROJECT_ADMIN es redirigido de `/projects` | ✅ |
| CP-66 | API `POST /api/projects` devuelve 403 para PROJECT_ADMIN | ✅ |

**Total E2E**: 65/65 ✅ (10 nuevos Sprint 8 + 55 heredados Sprints 1-7)

---

## Archivos modificados

```
app/projects/page.tsx                             MODIFIED — acceso PROJECT_ADMIN
app/employees/page.tsx                            MODIFIED — modal historial de turno
app/api/schedules/generate/route.ts               MODIFIED — prisma.$transaction batch
components/employees/employee-table.tsx           MODIFIED — btn-history-{id} testid
playwright.config.ts                              MODIFIED — NEXTAUTH_URL en webServer
tests/e2e/sprint-8.spec.ts                        NEW — CP-57..CP-66
tests/e2e/sprint-1.spec.ts                        MODIFIED — estabilidad
tests/e2e/sprint-2.spec.ts                        MODIFIED — estabilidad
tests/e2e/sprint-3.spec.ts                        MODIFIED — estabilidad
tests/e2e/sprint-4.spec.ts                        MODIFIED — estabilidad
tests/e2e/sprint-7.spec.ts                        MODIFIED — estabilidad
tests/e2e/config.ts                               NEW — configuración centralizada
tests/e2e/helpers.ts                              MODIFIED — helpers centralizados
```

---

## Próximo sprint

**Sprint 9** — Reescritura del algoritmo de generación (Fase 2): bloques de noches 2D+7N+3D, continuidad entre meses, `shiftPreference` por empleado, `nightRotationOrder` por proyecto.
