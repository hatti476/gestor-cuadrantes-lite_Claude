# SPEC-010 — Auditoría de accesos y permisos tras el refactor a single-tenant

## Metadatos

| Campo | Valor |
|-------|-------|
| ID | SPEC-010 |
| Tipo | bug / chore |
| Estado | in-progress |
| Prioridad | alta |
| Agentes asignados | @orchestrator, @devlead, @security, @qa, @frontend |
| Fecha de creación | 2026-11-17 |
| Sprint | Sprint-05 |

---

## Descripción

Al revisar CP-172 en el Sprint 4 (SPEC-009) se vio que sus 10 fallos "por condiciones de
carrera" eran en realidad 3 bugs reales del refactor `f46b1bb` (multi-proyecto →
single-tenant), todos en la capa de **quién puede acceder a qué**. Esta spec audita esa
capa completa (páginas, `proxy.ts` y endpoints `/api`) contra los roles `ADMIN | TECNICO |
VIEWER`, corrige las discrepancias y añade un test que recorra la matriz para que una
regresión de permisos no vuelva a pasar desapercibida.

---

## Contexto y antecedentes

- SPEC-003 reescribió `lib/auth/permissions.ts` y los guards de API, pero `proxy.ts`
  quedó comprobando `SUPER_ADMIN`.
- SPEC-009 ya corrigió: botón `btn-expanded-view` borrado y `/multi-month` roto para
  TECNICO/VIEWER.
- CI tras SPEC-009 (PR #76, run 43911077542): 33 pasan, 4 fallan (todos de `/admin`),
  3 no se ejecutan (`sprint-19.spec.ts` es `serial`: al fallar CP-133 se saltan los
  siguientes).

---

## Matriz de accesos (esperado según roles de SPEC-003)

Leyenda: ✅ permitido · ❌ denegado (403 / redirect) · 🔒 solo meses publicados

### Páginas

| Ruta | ADMIN | TECNICO | VIEWER | Real hoy | Estado |
|------|-------|---------|--------|----------|--------|
| `/` | ✅ edición | ✅ 🔒 | ✅ 🔒 | igual | OK |
| `/multi-month` | ✅ | ✅ 🔒 | ✅ 🔒 | igual (tras SPEC-009) | OK |
| `/holidays` | ✅ | ❌ | ❌ | igual (guard cliente; API protegida) | OK |
| `/info` | ✅ | ✅ | ✅ | igual | OK |
| `/admin` | ✅ | ❌ | ❌ | **❌ para todos** — `proxy.ts` exige `SUPER_ADMIN` | **H-01** |
| `/employees` | → `/admin` | ❌ | ❌ | redirect de `proxy.ts` a `/admin` | **H-02** |
| `/employees/[id]/history` | ✅ | ❌ | ❌ | redirect a `/admin/[id]/history` → 404 | **H-03** |

### API

| Endpoint | ADMIN | TECNICO | VIEWER | Real hoy | Estado |
|----------|-------|---------|--------|----------|--------|
| `GET /api/schedules` | ✅ | 🔒 | 🔒 | igual (`canViewSchedules`) | OK |
| `POST`/`DELETE /api/schedules` | ✅ | ❌ | ❌ | igual | OK |
| `POST /api/schedules/generate` | ✅ | ❌ | ❌ | igual | OK |
| `PATCH /api/schedules/publish` | ✅ | ❌ | ❌ | igual | OK |
| `POST /api/schedules/snapshot`, `/restore` | ✅ | ❌ | ❌ | igual | OK |
| `GET /api/schedules/snapshot` | ✅ | — | — | cualquier sesión (solo devuelve si existe) | H-05 |
| `GET /api/employees` | ✅ | ❌ | ❌ | igual; la home lo llama igualmente con TECNICO/VIEWER | H-06 |
| `POST /api/employees`, `PATCH`/`PUT`/`DELETE /api/employees/[id]` | ✅ | ❌ | ❌ | igual | OK |
| `GET /api/employees/[id]/history` | ✅ | ❌ | ❌ | igual | OK |
| `GET /api/holidays` | ✅ | ✅ | ✅ | igual | OK |
| `POST /api/holidays`, `DELETE /api/holidays/[id]`, `GET /api/holidays/public` | ✅ | ❌ | ❌ | igual | OK |
| `GET`/`POST /api/admin/users`, `PATCH`/`PUT`/`DELETE /api/admin/users/[id]` | ✅ | ❌ | ❌ | igual | OK |

Conclusión: **los guards de API son coherentes**. Los problemas están en `proxy.ts`, en
rutas de UI heredadas y en los tests.

---

## Hallazgos

| ID | Severidad | Origen | Hallazgo |
|----|-----------|--------|----------|
| H-01 | **ALTO** | refactor `f46b1bb` | `proxy.ts:17` exige `role === "SUPER_ADMIN"` para `/admin`; el ADMIN es redirigido a `/` y la gestión de usuarios es inaccesible. Causa de los 4 fallos restantes de CP-172. |
| H-02 | MEDIO | ciclo 1 (`b550ef8`, 2026-05-22) | `/employees` redirige a `/admin` desde la v1.7–1.9, así que `app/employees/page.tsx` es inalcanzable. Con ella se quedaron sin UI: **editar el orden de rotación de noches** (Must Have del MVP) y el **historial de cambios por empleado** (Sprint 13). `/admin` no tiene ninguna de las dos. El header sigue mostrando "Empleados" (→ `/admin`) junto a "Administración". |
| H-03 | MEDIO | ciclo 1 | `/employees/[id]/history` redirige a `/admin/[id]/history`, que no existe (404). Ningún enlace apunta a ella. |
| H-04 | MEDIO | tests | `admin-users.spec.ts`: AC-20/21 borran "el primer usuario" de la BD compartida (puede borrar un usuario sembrado que usan otros specs); AC-21 usa un selector inválido (`text=A, text=B`). `sprint-19.spec.ts` CP-133 espera la pestaña `admin-tab-users`, que ya no existe. |
| H-05 | BAJO | — | `GET /api/schedules/snapshot` responde a cualquier sesión. Solo revela si existe un snapshot del mes; sin datos sensibles. Se deja documentado. |
| H-06 | BAJO | refactor | La home pide `GET /api/employees` también para TECNICO/VIEWER, recibe 403 en cada carga y usa el fallback. Ruido en logs y una petición inútil. |
| H-07 | BAJO | docs | `README.md`, `.github/context.md` y `package.json` (`1.5.0`) describen la versión multi-proyecto (roles, usuarios de prueba, versión). |
| H-08 | MEDIO | refactor | `GET /api/schedules` no incluye `userId` del empleado. Como TECNICO/VIEWER no pueden usar `/api/employees`, el fallback de la vista mensual y multi-mes no puede identificar su fila: **la fila propia del TECNICO no se resalta** (funcionalidad de la 2.5.0). |
| H-09 | **ALTO** | refactor | El orden de rotación de noches se editaba con `Project.nightRotationOrder`; al eliminar `Project`, la generación pasó a usar `Employee.rotationOrder`, que **ninguna API ni pantalla permite cambiar** (solo se asigna al crear el empleado). Funcionalidad Must Have del MVP perdida. |
| H-10 | MEDIO | tests | 8 tests no-@smoke fallaban también en `main` y no estaban registrados (la nightly no corría desde el cambio de runner): textos de `/info` de la era multi-proyecto (CP-40/41), CP-97 contradictorio tras sustituir roles, CP-17/75 asumen que TECNICO ve meses sin publicar, CP-21/45 usan la página muerta `/employees`, y CP-13 porque el aviso de mes vacío nunca aparecía para ADMIN. |
| H-11 | ADVERTENCIA | ciclo 1 | `POST /api/admin/users` devolvía el usuario completo, **incluido el hash bcrypt de la contraseña**. |
| H-12 | **ALTO** | ciclo 1 | `authorize` (NextAuth) no comprobaba `employee.active`: **un TECNICO desactivado podía seguir iniciando sesión**, aunque `/info` dice que no. |
| H-13 | ADVERTENCIA | ciclo 1 | El rol se fija en el JWT al hacer login y no se vuelve a comprobar en BD: un usuario degradado, desactivado o borrado conserva sus permisos hasta que caduca el token (30 días por defecto). **Pendiente de decisión del DM** (fuera de este PR). |
| H-14 | ALTO | tests | CP-71/72/73 (`sprint-10.spec.ts`) desactivaban y modificaban técnicos sembrados (CP-73 desactivaba a Técnico 1, el usuario TECNICO del resto de specs). En `main` no llegaban a ejecutarse por H-01. |

---

## Criterios de aceptación

- [x] AC-01 (H-01): `proxy.ts` protege `/admin` con el rol `ADMIN`, usando la misma fuente de
  verdad que `lib/auth/permissions.ts`. TECNICO y VIEWER siguen redirigidos a `/`.
- [x] AC-02 (H-01): test unitario de `proxy.ts` por rol (ADMIN pasa; TECNICO, VIEWER y sin
  sesión no).
- [x] AC-03 (H-04): los tests de `/admin` crean su propio usuario desechable antes de
  borrarlo; ningún test borra usuarios sembrados. Selector de AC-21 corregido. CP-133 sin
  la pestaña inexistente.
- [x] AC-04: test E2E de matriz de API (`tests/e2e/access-matrix.spec.ts`, @smoke) que
  compruebe por rol el código de respuesta de cada endpoint de la tabla anterior.
- [x] AC-05 (H-06): la home solo pide `/api/employees` si el usuario es ADMIN.
- [x] AC-06 (H-02/H-03, decisión DM: opción 1): `/admin` muestra la columna «Rotación noches»
  (posición 1..n) con ↑/↓ y un botón «Historial» por técnico. `app/employees/`,
  `components/employees/` y el enlace «Empleados» del header eliminados; `/employees/*` redirige
  a `/admin`.
- [x] AC-09 (H-09): `POST /api/admin/users/[id]/rotation` (solo ADMIN, `direction: up|down`)
  intercambia posiciones y renumera los empleados activos 1..n. Unit tests de la lógica y del
  endpoint; incluido en la matriz de accesos.
- [x] AC-10 (H-08): `GET /api/schedules` incluye `employee.userId`.
- [x] AC-11 (H-10): los 8 tests antiguos alineados con el comportamiento actual; los que crean
  técnicos los borran al terminar.
- [x] AC-12 (H-11): el alta de usuarios no devuelve `password` (test unitario).
- [x] AC-13 (H-12): `authorize` rechaza empleados desactivados y busca el email en minúsculas
  (`lib/auth/authorize.ts`, test unitario; CP-72 lo cubre en E2E).
- [x] AC-14 (H-14): CP-71/72/73 usan un TECNICO desechable (`createDisposableTecnico`).
- [x] AC-15 (revisión): el endpoint de rotación lee y escribe en la misma transacción, reescribe
  todas las filas (inactivos detrás de los activos) y desempata por `id`, igual que la generación,
  `/api/employees` y `/admin`. El historial de `/admin` pagina con «Cargar más».
- [x] AC-07 (H-07): README, `.github/context.md` y `package.json` alineados con 2.7/LITE.
- [x] AC-08: `known-failures.md` sin CP-172; `tsc`, `vitest` y la suite @smoke en verde.

---

## Decisión del DM (2026-11-17)

Opción elegida: **1 — llevarlas a `/admin`**. Opciones que se plantearon:

1. **Llevarlas a `/admin`**: columna/acción de orden de rotación y botón "Historial" en la
   tabla de usuarios TECNICO. Borrar `app/employees/` y el enlace "Empleados" del header.
2. **Quitar el redirect** y recuperar `/employees` como página propia, solo ADMIN.
3. **Dejarlas fuera** (borrar `app/employees/` y el enlace) y abrir una spec aparte.

---

## Fuera de scope

- NO incluye: actualizar Playwright ni cambiar `ci.yml`.
- NO incluye: cambiar el modelo de roles ni abrir endpoints a más roles.
- NO incluye: CP-164/CP-165 (timeout local del webServer, lint pre-existente).

---

## Notas técnicas para los agentes

- `proxy.ts` es el middleware de Next.js 16 (renombrado de `middleware.ts`). Recibe el
  token JWT de NextAuth, con `role` en `token.role` (ver `app/api/auth/[...nextauth]/route.ts`).
- Riesgo de regresión: medio — `proxy.ts` afecta a todas las rutas; cubrir con test unitario.

---

## Historial de cambios

| Fecha | Autor | Cambio |
|-------|-------|--------|
| 2026-11-17 | @orchestrator / @security | Creación: inventario de 8 páginas y 13 ficheros de rutas API, matriz por rol y hallazgos H-01..H-07. |
| 2026-11-17 | @devlead / @qa | Implementados AC-01..AC-07 y AC-09..AC-11. Añadidos H-08, H-09, H-10 durante la implementación. Smoke local 46/46 con caché `.next-test` limpia (la caché de Turbopack servía la versión antigua de `proxy.ts`). |
| 2026-11-17 | @devlead / @security | Revisión: ALTO en tests (H-14) y ADVERTENCIAS de rotación (empates, concurrencia) e historial, corregidos. Añadidos H-11, H-12 (corregidos) y H-13 (pendiente). SUGERENCIAS sin cambio: CP-17/75 no prueban la edición si el mes no está publicado; CP-180/181 son comprobaciones de UI. |
