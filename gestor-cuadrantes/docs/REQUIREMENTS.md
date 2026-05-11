# Documento de Requisitos — Gestor de Cuadrantes

**Versión**: 1.7 (Sprint 7)  
**Última actualización**: 11/05/2026  
**Estado**: Vivo — se actualiza al cierre de cada sprint

---

## 1. Propósito y alcance

El **Gestor de Cuadrantes** es una aplicación web para la planificación y gestión de turnos de equipos de trabajo con cobertura 24 h. Permite a los administradores generar cuadrantes mensuales de forma automática mediante una rotación cíclica configurable, editarlos manualmente, gestionar festivos y exportarlos. Los técnicos pueden consultar su turno en tiempo real.

---

## 2. Usuarios del sistema

| Rol global | Descripción | Acceso |
|------------|-------------|--------|
| `SUPER_ADMIN` | Administrador global con acceso total a todos los proyectos | Lectura + escritura en todo |
| `USER` | Técnico / empleado estándar | Solo lectura del cuadrante |

| Rol de proyecto | Descripción | Acceso |
|-----------------|-------------|--------|
| `PROJECT_ADMIN` | Administrador dentro de un proyecto concreto | Gestión del cuadrante, empleados y festivos del proyecto |
| `EMPLOYEE` | Miembro técnico del proyecto | Consulta del cuadrante del proyecto |

> Los roles se almacenan como `String` en SQLite (sin Prisma enums) y se validan en capa de aplicación.

---

## 3. Requisitos funcionales

### RF-01 — Autenticación

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RF-01.1 | El sistema utiliza autenticación basada en email + contraseña cifrada (bcrypt) | 1 | ✅ |
| RF-01.2 | Las sesiones se gestionan mediante JWT (NextAuth CredentialsProvider, sin adapter de BD) | 1 | ✅ |
| RF-01.3 | Las contraseñas deben tener mínimo 8 caracteres, 1 mayúscula y 1 número | 1 | ✅ |
| RF-01.4 | Un usuario no autenticado es redirigido a `/login` | 1 | ✅ |
| RF-01.5 | El cierre de sesión redirige a `/login` | 1 | ✅ |
| RF-01.6 | El header muestra el email del usuario autenticado y su rol global como badge | 1 | ✅ |
| RF-01.7 | La sesión JWT incluye `id`, `role` (global) y `projectMemberships[]` | 6 | ✅ |
| RF-01.8 | Las membresías de proyecto se cargan desde BD en cada refresco del token | 6 | ✅ |

---

### RF-02 — Cuadrante mensual (visualización)

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RF-02.1 | La pantalla principal muestra un grid con filas = empleados y columnas = días del mes | 1 | ✅ |
| RF-02.2 | Las cabeceras de columna indican número de día y día de la semana | 1 | ✅ |
| RF-02.3 | Las columnas de sábado y domingo tienen fondo visual diferenciado | 1 | ✅ |
| RF-02.4 | Cada celda muestra el código de turno con su color definido | 1 | ✅ |
| RF-02.5 | El usuario puede navegar entre meses con botones `‹` y `›` | 1 | ✅ |
| RF-02.6 | Los días festivos se marcan con cabecera en color rojo | 4 | ✅ |
| RF-02.7 | Al pulsar la cabecera de un día festivo se muestra su descripción | 4 | ✅ |
| RF-02.8 | La última columna del grid muestra contadores de turnos por tipo para cada empleado | 1 | ✅ |

---

### RF-03 — Tipos de turno

| Código | Descripción | Horario |
|--------|-------------|---------|
| `M` | Mañana | 07:00–15:00 |
| `T` | Tarde | 15:00–23:00 |
| `N` | Noche | 23:00–07:00 |
| `MF` | Mañana en festivo / fin de semana | 07:00–15:00 |
| `TF` | Tarde en festivo / fin de semana | 15:00–23:00 |
| `NF` | Noche en festivo / fin de semana | 23:00–07:00 |
| `D` | Descanso | — |
| `V` | Vacaciones | — |
| `J` | Jornada especial | — |
| `B` | Formación / baja | — |

> Los códigos son los únicos valores válidos en `ShiftAssignment.shiftType`.

---

### RF-04 — Edición manual de turnos

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RF-04.1 | El SUPER_ADMIN puede asignar o cambiar el turno de cualquier celda del grid | 2 | ✅ |
| RF-04.2 | Al pulsar una celda, se abre un editor modal con todos los tipos de turno | 2 | ✅ |
| RF-04.3 | El editor permite eliminar la asignación de turno (dejar la celda vacía) | 2 | ✅ |
| RF-04.4 | Cada cambio manual se registra en `ShiftChangeLog` con empleado, fecha, turno anterior, turno nuevo y usuario que realizó el cambio | 4 | ✅ |
| RF-04.5 | Un técnico (`USER`) no puede editar ningún turno | 2 | ✅ |
| RF-04.6 | Las acciones de edición muestran una notificación toast (verde = éxito, rojo = error) | 4 | ✅ |

---

### RF-05 — Generación automática de cuadrante

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RF-05.1 | El sistema genera turnos siguiendo un patrón cíclico de 21 días: M×5, D×2, T×5, D×2, N×5, D×2 | 3 | ✅ |
| RF-05.2 | Cada empleado tiene un `rotationOrder` que desplaza su posición en el ciclo (offset = `rotationOrder × 3 mod 21`) | 3 | ✅ |
| RF-05.3 | La época de referencia del ciclo es 2026-01-01 UTC | 3 | ✅ |
| RF-05.4 | Los turnos ya asignados manualmente NO se sobreescriben en la generación automática | 3 | ✅ |
| RF-05.5 | La generación aplica automáticamente las reglas de festivos y fines de semana (RF-06) | 3/4 | ✅ |
| RF-05.6 | Solo el SUPER_ADMIN puede disparar la generación automática | 3 | ✅ |
| RF-05.7 | La generación es idempotente: ejecutarla varias veces produce el mismo resultado | 3 | ✅ |

---

### RF-06 — Reglas de festivos y fines de semana

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RF-06.1 | Un turno `M` en día festivo o fin de semana (sábado/domingo) se convierte en `MF` | 3/4 | ✅ |
| RF-06.2 | Un turno `T` en día festivo o fin de semana se convierte en `TF` | 3/4 | ✅ |
| RF-06.3 | Un turno `N` cuyo día siguiente sea festivo o fin de semana se convierte en `NF` | 3/4 | ✅ |
| RF-06.4 | El turno `N` de un domingo NO se convierte en `NF` si el lunes siguiente es laborable (el turno termina el lunes) | 4 | ✅ |
| RF-06.5 | El turno `D` (descanso) no cambia en ningún caso | 3 | ✅ |
| RF-06.6 | Al añadir un festivo, los turnos `M` y `T` existentes en esa fecha se actualizan automáticamente a `MF`/`TF` | 4 | ✅ |
| RF-06.7 | Al añadir un festivo, el turno `N` del día anterior se actualiza automáticamente a `NF` | 4 | ✅ |

---

### RF-07 — Gestión de festivos

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RF-07.1 | El SUPER_ADMIN puede añadir un festivo indicando fecha y descripción | 4 | ✅ |
| RF-07.2 | El SUPER_ADMIN puede eliminar un festivo existente | 4 | ✅ |
| RF-07.3 | No pueden existir dos festivos con la misma fecha | 4 | ✅ |
| RF-07.4 | Los festivos se filtran por año | 4 | ✅ |
| RF-07.5 | Un técnico no puede crear ni eliminar festivos | 4 | ✅ |

---

### RF-08 — Gestión de empleados

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RF-08.1 | El SUPER_ADMIN puede crear un nuevo empleado con nombre, email, contraseña y rol | 2 | ✅ |
| RF-08.2 | El SUPER_ADMIN puede editar el nombre y rol de un empleado existente | 2 | ✅ |
| RF-08.3 | El SUPER_ADMIN puede eliminar un empleado | 2 | ✅ |
| RF-08.4 | El SUPER_ADMIN puede cambiar la contraseña de cualquier empleado | 3 | ✅ |
| RF-08.5 | El email debe ser único en el sistema | 2 | ✅ |
| RF-08.6 | El nombre debe tener al menos 2 caracteres | 2 | ✅ |
| RF-08.7 | Un técnico no puede acceder a la sección de empleados | 2 | ✅ |
| RF-08.8 | Los roles válidos son `SUPER_ADMIN` y `USER` | 6 | ✅ |

---

### RF-09 — Historial de cambios

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RF-09.1 | El sistema registra cada cambio manual de turno con: empleado, fecha, turno anterior, turno nuevo, usuario y timestamp | 4 | ✅ |
| RF-09.2 | El SUPER_ADMIN puede consultar el historial de los últimos 20 cambios de cualquier empleado | 4 | ✅ |
| RF-09.3 | Un técnico no puede consultar el historial | 4 | ✅ |

---

### RF-10 — Exportación

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RF-10.1 | Cualquier usuario autenticado puede exportar el cuadrante activo en formato CSV | 4 | ✅ |
| RF-10.2 | El CSV incluye el nombre del empleado en la primera columna y los turnos de cada día en las siguientes | 4 | ✅ |
| RF-10.3 | El nombre de archivo del CSV sigue el formato `cuadrante-YYYY-MM.csv` | 4 | ✅ |
| RF-10.4 | Cualquier usuario autenticado puede imprimir el cuadrante o guardarlo como PDF mediante `window.print()` | 4 | ✅ |
| RF-10.5 | Los controles de la UI (botones, navegación) se ocultan en modo impresión | 4 | ✅ |

---

### RF-11 — Notificaciones

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RF-11.1 | Las acciones exitosas muestran un toast verde con descripción de la acción | 4 | ✅ |
| RF-11.2 | Los errores muestran un toast rojo | 4 | ✅ |
| RF-11.3 | Los toasts desaparecen automáticamente tras 4 segundos | 4 | ✅ |

---

### RF-12 — Ayuda contextual

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RF-12.1 | Existe una página `/info` accesible para todos los usuarios autenticados | 5 | ✅ |
| RF-12.2 | La página `/info` muestra secciones diferenciadas según el rol del usuario (SUPER_ADMIN vs USER) | 5 | ✅ |
| RF-12.3 | La ayuda de SUPER_ADMIN incluye: cuadrante, tipos de turno, festivos, empleados, notificaciones | 5 | ✅ |
| RF-12.4 | La ayuda de USER incluye: consulta del cuadrante, tipos de turno, impresión | 5 | ✅ |

---

### RF-13 — Multiproyecto (Fase 2)

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RF-13.1 | El sistema soporta múltiples proyectos, cada uno con sus propios empleados | 6 | ✅ |
| RF-13.2 | Un usuario puede ser miembro de varios proyectos con distintos roles | 6 | ✅ |
| RF-13.3 | Los roles dentro de un proyecto son `PROJECT_ADMIN` y `EMPLOYEE` | 6 | ✅ |
| RF-13.4 | Un `SUPER_ADMIN` tiene acceso de administrador en todos los proyectos sin necesidad de membresía explícita | 6 | ✅ |
| RF-13.5 | Un `PROJECT_ADMIN` gestiona solo su proyecto; no puede acceder a proyectos de terceros | 7 | ✅ API |
| RF-13.6 | Las membresías de proyecto se incluyen en el token JWT y son accesibles en todos los componentes | 6 | ✅ |
| RF-13.7 | El seed crea automáticamente el proyecto "Equipo Soporte 24h" con todos los usuarios de prueba asignados | 6 | ✅ |
| RF-13.8 | El SUPER_ADMIN puede crear, editar y eliminar proyectos | 7 | ✅ |
| RF-13.9 | El SUPER_ADMIN o PROJECT_ADMIN puede añadir y eliminar miembros de un proyecto | 7 | ✅ |
| RF-13.10 | Solo el SUPER_ADMIN puede asignar el rol `PROJECT_ADMIN` a un miembro | 7 | ✅ |
| RF-13.11 | El cuadrante puede filtrarse por proyecto mediante `?projectId=` | 7 | ✅ |
| RF-13.12 | La UI muestra un selector de proyecto activo para SUPER_ADMIN y un badge de proyecto para USER | 7 | ✅ |
| RF-13.13 | El enlace "Proyectos" en el header es visible únicamente para SUPER_ADMIN | 7 | ✅ |

---

## 4. Requisitos no funcionales

### RNF-01 — Seguridad

| ID | Descripción | Estado |
|----|-------------|--------|
| RNF-01.1 | Las contraseñas se almacenan cifradas con bcrypt (coste 12) | ✅ |
| RNF-01.2 | Todas las rutas API requieren sesión autenticada; devuelven 401 si no hay sesión | ✅ |
| RNF-01.3 | Las operaciones de escritura restringidas devuelven 403 si el rol es insuficiente | ✅ |
| RNF-01.4 | Los tokens JWT están firmados con `NEXTAUTH_SECRET` (mínimo 32 bytes aleatorios) | ✅ |
| RNF-01.5 | Las rutas de gestión (`/employees`, `/holidays`) no son accesibles por técnicos | ✅ |
| RNF-01.6 | Los roles se validan en capa de aplicación, no solo en el cliente | ✅ |

### RNF-02 — Rendimiento

| ID | Descripción | Estado |
|----|-------------|--------|
| RNF-02.1 | La carga inicial del cuadrante mensual debe completarse en menos de 2 segundos en entorno local | ✅ |
| RNF-02.2 | La generación automática de un mes completo para 7+ empleados completa en menos de 5 segundos | ✅ |

### RNF-03 — Mantenibilidad

| ID | Descripción | Estado |
|----|-------------|--------|
| RNF-03.1 | La lógica de negocio se separa en funciones puras (`lib/`) sin dependencias de BD ni HTTP | ✅ |
| RNF-03.2 | Toda función pura de lógica de negocio debe tener cobertura de tests unitarios | ✅ |
| RNF-03.3 | Cada flujo de usuario nuevo debe tener al menos un test E2E | ✅ |
| RNF-03.4 | El código TypeScript no debe tener errores de compilación (`tsc --noEmit`) | ✅ |

### RNF-04 — Escalabilidad

| ID | Descripción | Estado |
|----|-------------|--------|
| RNF-04.1 | En desarrollo se usa SQLite; en producción PostgreSQL 16 mediante Docker | ✅ |
| RNF-04.2 | El stack de producción se define en `docker-compose.prod.yml` con healthcheck en la BD | ✅ |
| RNF-04.3 | Las migraciones de BD se aplican automáticamente al arrancar el contenedor de producción | ✅ |

### RNF-05 — Usabilidad

| ID | Descripción | Estado |
|----|-------------|--------|
| RNF-05.1 | La interfaz es responsive y utiliza Tailwind CSS | ✅ |
| RNF-05.2 | Los colores de turno son consistentes en todo el sistema y están centralizados en `lib/constants/shift-colors.ts` | ✅ |
| RNF-05.3 | Existe una leyenda de colores de turno visible en la pantalla del cuadrante | ✅ |

---

## 5. Modelo de datos

### Entidades principales

```
User            — id, email, password (bcrypt), role (SUPER_ADMIN|USER)
Employee        — id, name, userId (→User), rotationOrder, projectId?
Project         — id, name, description, region?, createdAt
ProjectMember   — id, projectId (→Project), userId (→User), role (PROJECT_ADMIN|EMPLOYEE)
ShiftAssignment — id, employeeId (→Employee), date (UTC midnight), shiftType
ShiftChangeLog  — id, employeeId, date, oldShift?, newShift, changedBy, changedAt
Holiday         — id, date (UTC midnight), description, year
Schedule        — id, month, year (registro de última generación)
```

### Restricciones de integridad

- `ShiftAssignment`: único por `(employeeId, date)`
- `Holiday`: único por `date`
- `ProjectMember`: único por `(projectId, userId)`
- `Employee.userId`: único (relación 1:1 con User)
- Cascada: al borrar `Employee` se borran sus `ShiftAssignment` y `ShiftChangeLog`
- Cascada: al borrar `Project` se borran sus `ProjectMember`

---

## 6. API REST

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/schedules?year&month[&projectId]` | Autenticado | Lista de turnos del mes (filtrable por proyecto) |
| POST | `/api/schedules` | SUPER_ADMIN | Crear/actualizar turno individual |
| DELETE | `/api/schedules` | SUPER_ADMIN | Eliminar turno |
| POST | `/api/schedules/generate` | SUPER_ADMIN | Generar cuadrante automático |
| GET | `/api/employees[?projectId]` | Autenticado | Lista de empleados (filtrable por proyecto) |
| POST | `/api/employees` | SUPER_ADMIN | Crear empleado |
| PUT | `/api/employees/[id]` | SUPER_ADMIN | Editar empleado |
| DELETE | `/api/employees/[id]` | SUPER_ADMIN | Eliminar empleado |
| GET | `/api/employees/[id]/history` | SUPER_ADMIN | Historial de cambios |
| GET | `/api/holidays?year` | Autenticado | Lista de festivos del año |
| POST | `/api/holidays` | SUPER_ADMIN | Añadir festivo |
| DELETE | `/api/holidays/[id]` | SUPER_ADMIN | Eliminar festivo |
| GET | `/api/projects` | Autenticado | Lista proyectos accesibles |
| POST | `/api/projects` | SUPER_ADMIN | Crear proyecto |
| GET | `/api/projects/[id]` | Miembro | Detalle + miembros |
| PUT | `/api/projects/[id]` | PROJECT_ADMIN / SUPER_ADMIN | Editar proyecto |
| DELETE | `/api/projects/[id]` | SUPER_ADMIN | Eliminar proyecto |
| GET | `/api/projects/[id]/members` | Miembro | Listar miembros |
| POST | `/api/projects/[id]/members` | PROJECT_ADMIN / SUPER_ADMIN | Añadir miembro |
| DELETE | `/api/projects/[id]/members/[userId]` | PROJECT_ADMIN / SUPER_ADMIN | Eliminar miembro |

---

## 7. Reglas de autorización (resumen)

```
isSuperAdmin(session)              → role === "SUPER_ADMIN"
isProjectAdmin(session, projectId) → isSuperAdmin OR memberships.some(m => m.projectId === id && m.role === "PROJECT_ADMIN")
canViewProject(session, projectId) → isSuperAdmin OR memberships.some(m => m.projectId === id)
hasAdminAccess(session)            → isSuperAdmin OR memberships.some(m => m.role === "PROJECT_ADMIN")
```

Implementadas en `lib/auth/permissions.ts` como funciones puras sin efectos secundarios.

---

## 8. Cobertura de tests

| Suite | Archivo | Tests | Estado |
|-------|---------|-------|--------|
| Unit | `schedules/business-logic` | 12 | ✅ |
| Unit | `schedules/generate` | 36 | ✅ |
| Unit | `employees/business-logic` | 35 | ✅ |
| Unit | `auth/permissions` | 25 | ✅ |
| **Total unit** | | **108** | ✅ |
| E2E Sprint 1 | CP-01..CP-11 | 11 | ✅ |
| E2E Sprint 2 | CP-12..CP-29 | 18 | ✅ |
| E2E Sprint 3 | CP-23..CP-29 | 6 | ✅ |
| E2E Sprint 4 | CP-30..CP-42 | 10 | ✅ (2 flaky) |
| E2E Sprint 5 | CP-40..CP-42 | 3 | ✅ |
| E2E Sprint 6 | CP-43..CP-46 | 4 | ✅ |
| E2E Sprint 7 | CP-47..CP-56 | 10 | ✅ |
| **Total E2E** | | **55** | ✅ |

---

## 9. Backlog Fase 2 (pendiente)

| Sprint | Funcionalidad | Requisitos asociados |
|--------|--------------|----------------------|
| 8 | Roles de proyecto en UI, panel multi-proyecto para PROJECT_ADMIN, permisos granulares en escritura | RF-13 |
| 9 | Festivos por CCAA/proyecto (`ProjectHoliday`), integración con API pública de festivos | RF-07 ampliado |
| 10 | Notificaciones email, dashboard de métricas, exportación avanzada | Nuevos RF |

---

## 10. Historial de versiones

| Versión | Sprint | Cambios principales |
|---------|--------|---------------------|
| 0.1 | 1 | Autenticación, cuadrante de solo lectura |
| 0.2 | 2 | Editor de turnos, gestión de empleados |
| 0.3 | 3 | Generación automática, cambio de contraseña, turnos especiales |
| 0.4 | 4 | Festivos, exportación CSV/PDF, historial de cambios, toasts |
| 0.5 | 5 | Página de ayuda contextual por rol |
| 0.6 | 6 | Roles SUPER_ADMIN/USER, arquitectura multiproyecto, Docker producción |
| 0.7 | 7 | API proyectos (CRUD), gestión de miembros, scoping cuadrante por proyecto, UI /projects |
