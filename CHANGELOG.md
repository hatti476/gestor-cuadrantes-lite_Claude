# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

Formato inspirado en Keep a Changelog y versionado semántico.

## [Unreleased] — Sprint 5b (SPEC-011, revalidación de sesión)

### Security
- **El rol se revalida en cada petición** (SPEC-010 H-13): antes quedaba fijado en el JWT al iniciar sesión, y un usuario degradado, desactivado o borrado conservaba sus permisos hasta 30 días. Ahora el callback `jwt` relee de BD el rol y el estado en cada `getServerSession` (todas las API) y en cada consulta de sesión del cliente. Sesión deshabilitada → sin rol → 403 en las API y `proxy.ts` redirige a `/login`. Ante un error de BD se deniega.
- `GET /api/schedules/snapshot` exige un rol válido (antes bastaba con tener sesión).

### Fixed
- **Ascender a un TECNICO lo dejaba sin acceso**: al cambiar de rol, su Employee pasa a inactivo para conservar el historial, y el login (SPEC-010 H-12) lo trataba como desactivado. El estado del empleado solo cuenta ya para usuarios TECNICO (`isAccountDisabled`).

### Tests
- Unit: `lib/auth/session-claims.ts`, callbacks de NextAuth, `isAccountDisabled`, caso deshabilitado en `proxy.ts`.
- E2E: CP-183 (@smoke, técnico desactivado con sesión abierta), CP-184 (cambio de rol sin volver a entrar), CP-185 (técnico ascendido a ADMIN conserva el acceso).

## [Unreleased] — Sprint 5 (SPEC-010, auditoría de permisos)

### Fixed
- **`/admin` inaccesible para ADMIN** (H-01): `proxy.ts` seguía exigiendo el rol `SUPER_ADMIN`, eliminado en el refactor single-tenant, y redirigía al ADMIN a `/`. Ahora usa `isAdminRole` de `lib/auth/permissions.ts`. Test unitario de `proxy.ts` por rol.
- **Fila propia sin resaltar para TECNICO** (H-08): `GET /api/schedules` no devolvía `userId` del empleado, y el fallback de la vista mensual y multi-mes no podía identificar la fila del usuario.
- **Petición inútil a `/api/employees`** (H-06): la vista mensual solo la pide si el usuario es ADMIN, y espera a que la sesión esté cargada.
- **Orden de rotación de noches no editable** (H-09): se editaba con `Project.nightRotationOrder`, eliminado en el refactor, y `Employee.rotationOrder` no tenía API ni pantalla. Nuevo `POST /api/admin/users/[id]/rotation` (solo ADMIN) y columna «Rotación noches» con ↑/↓ en `/admin`; renumera los empleados activos 1..n.
- **Historial de cambios inaccesible** (H-02/H-03): vivía en `/employees`, que redirige a `/admin` desde la v1.7. Ahora hay un botón «Historial» por técnico en `/admin`. Eliminados `app/employees/`, `components/employees/` y el enlace «Empleados» del header; `/employees/*` redirige a `/admin` (antes `/employees/<id>/history` daba 404).
- **Aviso de mes vacío** (CP-13): «Sin turnos asignados este mes» no aparecía nunca para ADMIN porque se condicionaba a que no hubiera empleados.
- `/info`: la guía de ADMIN ya no menciona la pestaña «Usuarios» (no existe) y explica la rotación y el historial.
- **Empleados desactivados podían iniciar sesión** (H-12): `authorize` ahora los rechaza. El email del login se busca en minúsculas, como lo guarda el alta.
- **El alta de usuarios devolvía el hash de la contraseña** (H-11): `POST /api/admin/users` responde solo con id, email, rol y empleado.
- Rotación: el endpoint lee y escribe en la misma transacción y desempata por `id`, igual que la generación y `/api/employees`, para que la posición que ve el ADMIN sea la que usa el motor. El historial de `/admin` carga más allá de los 20 primeros cambios.

### Tests
- Nueva matriz de accesos por rol (`tests/e2e/access-matrix.spec.ts`, CP-177/178/179 @smoke): todos los endpoints de `/api` para ADMIN, TECNICO, VIEWER y sin sesión, y las páginas restringidas.
- `admin-users.spec.ts` reescrito: cada test crea y borra su propio usuario (antes borraba "el primer usuario" de la BD compartida). Selector inválido de AC-21 corregido.
- `sprint-19.spec.ts`: eliminada la espera a la pestaña `admin-tab-users` (ya no existe); CP-139/CP-140 esperan al grid o al aviso de no publicado en vez de usar `isVisible({ timeout })`, que no espera.
- CP-172 cerrado: los 10 fallos eran 3 bugs reales del refactor (SPEC-009 y SPEC-010), no condiciones de carrera.
- CP-71/72/73 usan un TECNICO desechable: antes desactivaban o modificaban técnicos sembrados (CP-73 desactivaba al usuario TECNICO del resto de specs). CP-72 comprueba además que el desactivado no puede entrar.
- 8 tests no-@smoke que fallaban también en `main` sin estar registrados, alineados con la versión LITE (CP-13, 17, 21, 40, 41, 45, 75, 97). CP-21/CP-45 borran el técnico que crean: un TECNICO extra en la BD compartida entraba en la rotación y rompía CP-154.
- Nuevos: CP-180/181/182 (rotación, historial y redirects en `/admin`), unit tests de `lib/employees/rotation.ts` y del endpoint de rotación.

### Docs
- README, `.github/context.md` y versión de `package.json` (1.5.0 → 2.7.0) alineados con la versión LITE.

## Sprint 4 (SPEC-009)

### Fixed
- **CI E2E**: `e2e-smoke.yml` y `e2e-nightly.yml` fijados a `runs-on: ubuntu-24.04`. `ubuntu-latest` pasó a Ubuntu 26.04, que Playwright 1.59.1 no soporta (`Playwright does not support chromium on ubuntu26.04-x64`), y el job fallaba al instalar navegadores sin ejecutar ningún test.
- **Vista multi-mes sin acceso desde la UI**: repuesto el botón "↔ Vista ampliada" (`btn-expanded-view`) que el refactor `f46b1bb` eliminó al quitar `projectId`. Visible para todos los roles, abre `/multi-month` con el mes que se está viendo y `span=3`. Vuelven a pasar CP-150/151/152.
- **Vista multi-mes rota para TECNICO y VIEWER**: mostraba "Error al cargar empleados" porque `GET /api/employees` es solo ADMIN. Ahora los empleados salen de las asignaciones (filtradas por publicación en el servidor), como en la vista mensual; sin meses publicados se muestra un aviso específico.
- **Centrado de la vista multi-mes**: con span par se muestra un mes más hacia delante (6 meses en mayo → marzo..agosto), se respeta el `span` de la URL y el scroll horizontal inicial deja centrado el mes que se estaba viendo. Lógica extraída a `lib/schedules/multi-month.ts` con tests unitarios.
- Tests E2E CP-173 (@smoke), CP-174, CP-175 (@smoke, uno por rol), CP-176.

### Changed
- `.gitignore`: añadidos `/.next-dev/`, `dev.log` y `cookies.txt`.

## [2.7.0] - 2026-09-07 ✅

### Changed — Refactor multi-proyecto → single-tenant (Sprint 1)
- **BREAKING**: eliminados `Project`, `ProjectMember` y `projectId` de todo el schema, APIs y UI. La app pasa de gestionar múltiples proyectos a un único cuadrante global.
- Roles simplificados de `SUPER_ADMIN | SUPER_VIEWER | PROJECT_ADMIN | USER | EMPLOYEE` a **`ADMIN | TECNICO | VIEWER`**. `permissions.ts` reescrito desde cero junto con todos los guards de API y condicionales de UI.
- Suite de tests auditada y realineada: 404 tests unitarios pasando (eliminados ~65 obsoletos de proyectos/roles antiguos, añadidos tests de permisos y roles), specs E2E de `/projects` y multi-proyecto eliminados.

### Fixed — Fixes post-refactor (Sprint 2)
- **Toggle modo preparación**: el segundo click sobre una celda V/D en modo preparación dejaba la celda en blanco; ahora restaura el turno anterior (o `D` por defecto).
- **Vista multi-mes** (`/multi-month`): quedó rota al eliminar `projectId`; reescrita para consumir `/api/employees`, `/api/schedules` y `/api/holidays` sin parámetros de proyecto.
- **Gestión de usuarios ADMIN**: añadido `DELETE /api/admin/users/[id]` (con transacción Employee+ShiftAssignments) y botón "Eliminar" con modal de confirmación en `/admin`.
- CI: creación de la BD SQLite de test antes de los unit tests; fixtures de `generate.test.ts` desactualizados tras el refactor (CP-163); build roto por `useSearchParams` sin `Suspense` en `/multi-month`.

### Fixed — CP-171, causa raíz real (Sprint 3)
- La suite E2E `@smoke`/nightly en CI levantaba un segundo `next dev -p 3001` además del servidor ya construido en :3000. Nuevo `playwright.ci.config.ts` sin `webServer` propio, apuntando al servidor ya levantado; `globalSetup` resiembra esa misma BD en vez de borrar el fichero. Workflows actualizados a `prisma migrate deploy` (antes `db push`).
- Tres hipótesis descartadas tras fallar en CI real: contención de CPU bcrypt/`workers:2`, resolución de ruta relativa de `DATABASE_URL`, y `next start` incompatible con `output: standalone` (se cambió a `node .next/standalone/server.js`, mismo patrón que `Dockerfile.prod`) — necesario pero no suficiente.
- **Causa raíz real**: el log del servidor (`next-server-log`, artifact de la ejecución fallida) mostraba `[auth] Usuario encontrado: ninguno` — el servidor respondía correctamente, pero `tests/e2e/config.ts` lee las credenciales de test de variables de entorno que normalmente provee `.env.test` (fichero en `.gitignore`, inexistente en CI), así que los 30 tests enviaban login con email/password vacíos contra usuarios reales ya sembrados. Fix: las 6 variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `TECH_EMAIL`, `TECH_PASSWORD`, `VIEWER_EMAIL`, `VIEWER_PASSWORD`) añadidas al bloque `env:` de `e2e-smoke.yml` y `e2e-nightly.yml`. **Confirmado en CI real** (PR #32, run 37751532946, commit `6cd3dbf`): 24/37 tests pasan (antes 2/37); los 10 restantes son CP-172 (ya documentado, sin relación con el login).

### Fixed — Auditoría de usuarios TECNICO y preferencia de turno
- **Seed con 8 técnicos en vez de 7**: `prisma/seed.ts` y `tests/e2e/global-setup.ts` creaban un "Técnico Ejemplo" extra (`tecnico@cuadrantes.local`) con `rotationOrder` colisionando con "Técnico 1" y sin turnos asignados. Eliminado; el seed ahora crea exactamente 1 ADMIN + 7 TECNICO + 1 VIEWER.
- **BUG**: `POST /api/admin/users` rechazaba `shiftPreference: "J"` (jornada normal) con 400, aunque la UI de `/admin` ofrece esa opción y el motor de generación la trata como válida. Ahora usa `isValidShiftPreference` (misma fuente de verdad que `/api/employees/[id]`).
- **BUG**: `PATCH /api/admin/users/[id]` no validaba `shiftPreference` en absoluto. Ahora rechaza con 400 cualquier valor fuera de `M | T | J | null`.

### Known issues
- **CP-172**: 10 tests E2E (admin-users, multi-month, sprint-19, sprint-24) con fallos propios por condiciones de carrera de estado compartido al correr en paralelo — pendiente de investigar (ver `tests/e2e/known-failures.md`).

## [2.6.0] - 2026-06-19 ✅

### Fixed
- **BUG-56** 🔴: `weeklyShift` no se registraba en 6 de los 8 caminos de retorno de `pickWorkdayShift`, causando transiciones T→M inválidas que el motor convertía en `D` aislados.
- **BUG-57** 🟠: Override `urgentT` bloqueado por la guardia de consistencia semanal; ahora se evalúa antes para permitir M→T cuando hay déficit de cobertura urgente.
- **BUG-58** 🟠: Días `D` aislados sin vacaciones/baja — consecuencia de BUG-56, resuelto automáticamente.

### Changed
- **CHG-01**: Celdas de fin de semana con sombreado más intenso (`bg-blue-100` / `bg-blue-200`) en vista mensual y multi-mes.
- **CHG-02**: Separador entre meses en vista multi-mes con `border-r-2 border-r-gray-400` para mayor visibilidad.

### Refactored
- `ScheduleEmployee` consolidado en `lib/schedules/types.ts`; eliminada la interfaz duplicada de `monthly-schedule-engine.ts`.

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
