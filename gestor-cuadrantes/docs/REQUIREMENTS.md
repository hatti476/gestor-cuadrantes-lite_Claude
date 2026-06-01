# Documento de Requisitos — Gestor de Cuadrantes

**Versión**: 2.3.0 (Sprint 23 — cierre de sprint)  
**Última actualización**: 01/06/2026  
**Estado**: Vivo — se actualiza al cierre de cada sprint

---

## 1. Propósito y alcance

El **Gestor de Cuadrantes** es una aplicación web para la planificación y gestión de turnos de equipos de trabajo con cobertura 24 h. Permite a los administradores generar cuadrantes mensuales de forma automática mediante una rotación cíclica configurable, editarlos manualmente, gestionar festivos y exportarlos. Los técnicos pueden consultar su turno en tiempo real.

---

## 2. Usuarios del sistema

| Rol global | Descripción | Acceso |
|------------|-------------|--------|
| `SUPER_ADMIN` | Administrador global con acceso total a todos los proyectos | Lectura + escritura en todo |
| `SUPER_VIEWER` | Supervisor global en modo lectura | Lectura global, sin edición |
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
| RF-02.8 | Una tabla de contadores de turnos por tipo aparece debajo del grid, alineada a la izquierda, con su propia columna de empleado | 1→10 | ✅ |

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
| RF-04.7 | Un `PROJECT_ADMIN` puede asignar o cambiar turnos en el cuadrante de su proyecto | 10 | ✅ |
| RF-04.8 | Un `PROJECT_ADMIN` no puede editar turnos de proyectos a los que no pertenece como admin | 10 | ✅ |
| RF-04.9 | Las celdas con `V` y las celdas con `D` asignado manualmente se muestran bloqueadas (icono 🔒, borde dashed ámbar) y no se sobreescriben en la generación automática | 11 | ✅ |

---

### RF-05 — Generación automática de cuadrante

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RF-05.1 | ~~El sistema genera turnos siguiendo un patrón cíclico de 21 días: M×5, D×2, T×5, D×2, N×5, D×2~~ → **Reemplazado por RF-14 (algoritmo Fase 2)** | 3→9 | ✅ |
| RF-05.2 | ~~`rotationOrder` desplaza posición en ciclo 21 días~~ → **Reemplazado por RF-14** | 3→9 | ✅ |
| RF-05.3 | ~~Época de referencia 2026-01-01 UTC~~ → **Época de referencia `NIGHT_EPOCH_FRIDAY` 2026-01-02 (viernes)** | 3→9 | ✅ |
| RF-05.4 | Los turnos V/B/J ya asignados NO se sobreescriben en la generación automática | 3 | ✅ |
| RF-05.8 | La regeneración de un mes con cuadrante ya generado requiere confirmación explícita del usuario | 11 | ✅ |
| RF-05.5 | La generación aplica automáticamente las reglas de festivos y fines de semana (RF-06) | 3/4 | ✅ |
| RF-05.6 | Solo el SUPER_ADMIN puede disparar la generación automática | 3 | ✅ |
| RF-05.7 | La generación es idempotente: ejecutarla varias veces produce el mismo resultado | 3/9 | ✅ |

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
| RF-07.6 | Al eliminar un festivo, los turnos `MF` y `TF` del día se revierten automáticamente a `M` y `T` | 11 | ✅ |
| RF-07.7 | Al eliminar un festivo, el turno `NF` del día anterior se revierte a `N`; la UI muestra el número de turnos revertidos en el toast | 11 | ✅ |

---

### RF-08 — Gestión de empleados

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RF-08.1 | El SUPER_ADMIN puede crear un nuevo empleado con nombre, email, contraseña y rol | 2 | ✅ |
| RF-08.2 | El SUPER_ADMIN puede editar el nombre y rol de un empleado existente | 2 | ✅ |
| RF-08.3 | El SUPER_ADMIN puede desactivar un empleado (soft-delete: `active = false`); el historial de turnos se preserva | 2→10 | ✅ |
| RF-08.4 | El SUPER_ADMIN puede cambiar la contraseña de cualquier empleado | 3 | ✅ |
| RF-08.5 | El email debe ser único en el sistema | 2 | ✅ |
| RF-08.6 | El nombre debe tener al menos 2 caracteres | 2 | ✅ |
| RF-08.7 | Un técnico no puede acceder a la sección de empleados | 2 | ✅ |
| RF-08.8 | Los roles válidos son `SUPER_ADMIN` y `USER` | 6 | ✅ |
| RF-08.9 | Un empleado desactivado (`active = false`) no aparece en la API de empleados activos ni en la generación automática | 10 | ✅ |
| RF-08.10 | El SUPER_ADMIN puede reactivar un empleado desactivado | 10 | ✅ |
| RF-08.11 | Un PROJECT_ADMIN puede editar nombre, `shiftPreference` y rol de los empleados de su proyecto | 10 | ✅ |
| RF-08.12 | La UI de `/employees` muestra un badge de preferencia de turno (`shiftPreference`) junto a cada empleado | 10 | ✅ |

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
| RF-11.4 | El toast de eliminación de festivo indica cuántos turnos fueron revertidos, diferenciando el mensaje si fueron 0 o más de 0 | 11 | ✅ |

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
| RF-13.14 | Un PROJECT_ADMIN puede acceder a `/projects` para gestionar los miembros de sus proyectos | 8 | ✅ |
| RF-13.15 | Un PROJECT_ADMIN no puede crear, editar ni eliminar proyectos | 8 | ✅ |
| RF-13.16 | Un PROJECT_ADMIN puede añadir miembros con rol EMPLOYEE pero no con rol PROJECT_ADMIN | 8 | ✅ |
| RF-13.17 | Un usuario con rol EMPLOYEE (sin PROJECT_ADMIN) es redirigido de `/projects` | 8 | ✅ |

---

### RF-14 — Algoritmo de generación Fase 2 (bloques de noches)

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RF-14.1 | El algoritmo genera bloques de exactamente 12 días por técnico: 2D (pre-bloque) + 7N + 3D (post-bloque) | 9 | ✅ |
| RF-14.2 | La época de referencia nocturna es el viernes 2 de enero de 2026 (`NIGHT_EPOCH_FRIDAY`) | 9 | ✅ |
| RF-14.3 | Con 7 técnicos, el ciclo completo es 84 días (12 semanas); el técnico `rotationOrder=0` siempre empieza en viernes | 9 | ✅ |
| RF-14.4 | Nunca coinciden dos técnicos en turno N el mismo día | 9 | ✅ |
| RF-14.5 | El orden de rotación nocturna se configura mediante `nightRotationOrder` (JSON) en el proyecto; fallback a `rotationOrder` | 9 | ✅ |
| RF-14.6 | Cada empleado puede tener `shiftPreference` (`"M"`, `"T"`, `"J"` o `null`) que orienta su asignación. `J` (Jornada L-V) recibe turno tipo `J` en días laborables (L-V) y `D` en fines de semana y festivos; no computa para cobertura M/T | 9→12 | ✅ |
| RF-14.12 | El `nightRotationOrder` es editable desde la UI de `/projects` mediante un panel de reordenación drag-up/down con botones | 10 | ✅ |
| RF-14.13 | El `shiftPreference` de cada empleado es editable desde la UI de `/employees` mediante un selector en el formulario de edición; el API valida que el valor sea `"M"`, `"T"`, `"J"` o `null` | 10 | ✅ |
| RF-14.7 | En días laborables, el algoritmo aplica un objetivo soft de ≥ 2 empleados en M y ≥ 2 en T (cuando hay suficientes técnicos disponibles) | 9 | ✅ |
| RF-14.8 | Ningún empleado cambia entre turno M y T dentro de la misma semana ISO (best effort: puede ocurrir excepcionalmente si RF-16 lo requiere) | 9 | ✅ |
| RF-14.9 | Ningún empleado supera 5 días consecutivos con el mismo turno de trabajo | 9 | ✅ |
| RF-14.10 | La generación consulta los últimos 7 días del mes anterior (`prevMonthTail`) para aplicar la regla de máximo consecutivo en el inicio del mes | 9 | ✅ |
| RF-14.11 | Los turnos V/B/J existentes bloquean la celda; los turnos M/T/N/D de generaciones anteriores se regeneran | 9 | ✅ |

---

### RF-15 — Navegación y UX del header

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RF-15.1 | Las pestañas de navegación muestran cuál está activa mediante subrayado azul y texto en negrita | 9-PO | ✅ |
| RF-15.2 | El orden de las pestañas es: Proyectos → Cuadrante → Empleados → Ayuda | 9-PO | ✅ |
| RF-15.3 | El nombre del proyecto activo se muestra como badge en el header en todas las páginas | 9-PO | ✅ |
| RF-15.4 | La selección de proyecto se realiza exclusivamente desde la pestaña de Proyectos (no desde el cuadrante) | 9-PO | ✅ |
| RF-15.5 | Cada proyecto en `/projects` tiene un botón Seleccionar que lo activa y navega a la home | 9-PO | ✅ |
| RF-15.6 | El proyecto activo se persiste en `localStorage` y se sincroniza entre pestañas mediante un evento `activeProjectChanged` | 9-PO | ✅ |
| RF-15.7 | La tabla de proyectos muestra la información completa sin truncar; soporta scroll horizontal | 9-PO | ✅ |

---

### RF-18 — Estado del mes y panel de preparación

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RF-18.1 | El sistema calcula el estado del mes: `ungenerated` (sin asignaciones), `preparation` (solo V/D manual), `generated` (algún turno M/T/N/MF/TF/NF presente) | 11 | ✅ |
| RF-18.2 | Un badge visible junto al título del mes muestra el estado: gris "Sin generar", azul "En preparación", verde "Generado" | 11 | ✅ |
| RF-18.3 | El cuadrante incluye un `PrepPanel` lateral con 4 pasos desplegables: Vacaciones, Libres, Festivos, Generar | 11 | ✅ |
| RF-18.4 | En el paso Vacaciones, al pulsar una celda se asigna `V` directamente sin modal; en el paso Libres se asigna `D` con `manual=true` | 11 | ✅ |
| RF-18.5 | El paso Festivos muestra el contador de festivos del mes y un enlace a `/holidays` | 11 | ✅ |
| RF-18.6 | El botón Generar solo es visible cuando el paso Generar está activo en el `PrepPanel` | 11 | ✅ |
| RF-18.7 | El botón Guardar preparación está deshabilitado cuando el mes ya está en estado `generated` | 11 | ✅ |
| RF-18.8 | El campo `ShiftAssignment.manual` (Boolean, default false) distingue las asignaciones manuales de las generadas automáticamente | 11 | ✅ |

---

### RF-17 — Tabla de contadores de turnos

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|---------|
| RF-17.1 | La tabla de contadores se muestra debajo del grid del cuadrante, antes de la leyenda, alineada a la izquierda | 10 | ✅ |
| RF-17.2 | La tabla tiene su propia columna de empleado sticky con los mismos nombres que el grid | 10 | ✅ |
| RF-17.3 | Las cabeceras de turno en la tabla de contadores utilizan el mismo estilo de color y tipografía que las celdas del grid | 10 | ✅ |
| RF-17.4 | La tabla de contadores comparte el mismo estilo visual del grid (bordes, esquinas redondeadas, sombra, hover de filas) | 10 | ✅ |
| RF-17.5 | El grid no se extiende más allá del ancho de su contenido; no deja espacio vacío a la derecha | 10 | ✅ |
| RF-17.6 | Cada celda de contador tiene `data-testid="counter-{employeeId}-{shiftType}"` | 10 | ✅ |

### RF-19 — Identificación visual de la fila propia en el grid

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RF-19.1 | Cuando el usuario autenticado tiene un empleado asociado que aparece en el cuadrante, su fila se resalta visualmente con fondo `indigo-50` y borde `ring-indigo-300` | 12 | ✅ |
| RF-19.2 | El nombre del empleado en la fila propia aparece en color `indigo-700` y con un indicador `▶` a la izquierda | 12 | ✅ |
| RF-19.3 | La fila propia tiene `data-testid="own-row"` para facilitar los tests | 12 | ✅ |
| RF-19.4 | Si el usuario no tiene empleado asociado (ej. SUPER_ADMIN sin fila), el grid se muestra sin ninguna fila resaltada | 12 | ✅ |

---

### RF-20 — Publicación de cuadrantes por mes/proyecto

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RF-20.1 | El sistema persiste el estado de publicación del mes por proyecto (`Schedule.published`, `publishedAt`, `publishedBy`) | 23 | ✅ |
| RF-20.2 | La entidad `Schedule` es única por `(year, month, projectId)` y usa `id` autoincremental | 23 | ✅ |
| RF-20.3 | Solo `SUPER_ADMIN` y `PROJECT_ADMIN` del proyecto activo pueden publicar/despublicar un mes | 23 | ✅ |
| RF-20.4 | Existe endpoint `PATCH /api/schedules/publish` idempotente para alternar publicación/despublicación | 23 | ✅ |
| RF-20.5 | `GET /api/schedules` devuelve `published` y, para usuarios de solo lectura en mes no publicado, responde `monthStatus = "unpublished"` y `assignments = []` | 23 | ✅ |
| RF-20.6 | El botón de publicar/despublicar y el badge de estado son visibles solo para perfiles con permisos de edición | 23 | ✅ |
| RF-20.7 | Un usuario de solo lectura (`USER`/`SUPER_VIEWER`) ve el mensaje "Cuadrante no disponible aún" cuando el mes no está publicado | 23 | ✅ |
| RF-20.8 | Al generar un mes se crea/actualiza su registro `Schedule` en estado no publicado por defecto | 23 | ✅ |

---

### RF-16 — Cobertura mínima garantizada por turno

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RF-16.1 | Cada día laborable (L-V no festivo) tiene **como mínimo 1 empleado en M y 1 en T** (hard requirement) | 9-PO | ✅ |
| RF-16.2 | La garantía de cobertura mínima tiene prioridad sobre la consistencia semanal M/T del empleado | 9-PO | ✅ |
| RF-16.3 | En días laborables se intenta que sean ≥ 2 en M y ≥ 2 en T cuando hay técnicos suficientes disponibles (soft target) | 9-PO | ✅ |
| RF-16.4 | Cada día de fin de semana o festivo tiene **como mínimo 1 empleado en MF y 1 en TF** cuando hay ≥ 2 técnicos disponibles (no en D ni N) | 9-PO | ✅ |
| RF-16.5 | Las noches solo tienen 1 técnico por día (ya garantizado por el bloque de rotación nocturna) | 9 | ✅ |

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
Employee        — id, name, userId (→User), rotationOrder, shiftPreference?, projectId?, active (Boolean, default true)
Project         — id, name, description, region?, nightRotationOrder?, createdAt
ProjectMember   — id, projectId (→Project), userId (→User), role (PROJECT_ADMIN|EMPLOYEE)
ShiftAssignment — id, employeeId (→Employee), date (UTC midnight), shiftType, manual (Boolean, default false)
ShiftChangeLog  — id, employeeId, date, oldShift?, newShift, changedBy, changedAt
Holiday         — id, date (UTC midnight), description, year
Schedule        — id, year, month, projectId, published, publishedAt?, publishedBy? (estado de publicación por mes/proyecto)
```

### Restricciones de integridad

- `ShiftAssignment`: único por `(employeeId, date)`
- `Holiday`: único por `date`
- `ProjectMember`: único por `(projectId, userId)`
- `Schedule`: único por `(year, month, projectId)`
- `Employee.userId`: único (relación 1:1 con User)
- Cascada: al borrar `Employee` se borran sus `ShiftAssignment` y `ShiftChangeLog`
- Cascada: al borrar `Project` se borran sus `ProjectMember`

---

## 6. API REST

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/schedules?year&month[&projectId]` | Autenticado | Lista de turnos + `monthStatus` del mes (filtrable por proyecto) |
| POST | `/api/schedules` | SUPER_ADMIN / PROJECT_ADMIN | Crear/actualizar turno individual |
| DELETE | `/api/schedules` | SUPER_ADMIN / PROJECT_ADMIN | Eliminar turno |
| POST | `/api/schedules/generate` | SUPER_ADMIN / PROJECT_ADMIN | Generar cuadrante automático (scope por proyecto) |
| PATCH | `/api/schedules/publish` | SUPER_ADMIN / PROJECT_ADMIN | Publicar o despublicar el mes activo del proyecto |
| GET | `/api/employees[?projectId]` | Autenticado | Lista de empleados (filtrable por proyecto) |
| POST | `/api/employees` | SUPER_ADMIN | Crear empleado |
| PUT | `/api/employees/[id]` | SUPER_ADMIN | Editar empleado |
| PATCH | `/api/employees/[id]` | SUPER_ADMIN / PROJECT_ADMIN | Editar nombre, `shiftPreference`, rol y estado `active` del empleado |
| PUT | `/api/employees/[id]` | SUPER_ADMIN / PROJECT_ADMIN | Cambiar contraseña |
| DELETE | `/api/employees/[id]` | SUPER_ADMIN | Soft-delete empleado (`active = false`) |
| GET | `/api/employees/[id]/history` | SUPER_ADMIN / SUPER_VIEWER / PROJECT_ADMIN propio | Historial de cambios |
| GET | `/api/holidays?year` | Autenticado | Lista de festivos del año |
| POST | `/api/holidays` | SUPER_ADMIN | Añadir festivo |
| DELETE | `/api/holidays/[id]` | SUPER_ADMIN | Eliminar festivo (revierte MF→M, TF→T, NF→N automáticamente) |
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
canPublishSchedule(session, id)    → isProjectAdmin(session, id)
```

Implementadas en `lib/auth/permissions.ts` como funciones puras sin efectos secundarios.

---

## 8. Cobertura de tests

| Suite | Cobertura | Estado |
|-------|-----------|--------|
| Unit | 374 tests (296 base + 78 nuevos de Sprint 20) | ✅ |
| E2E | 142 tests definidos en `tests/e2e/` | ✅ |
| Alcance Sprint 20 | Nuevas suites para `date-utils`, `rest-rules`, `coverage`, `cross-month` | ✅ |

---

## 9. Backlog pendiente (Sprint 11+)

| Funcionalidad | Requisito | Prioridad |
|---------------|-----------|-----------|
| Festivos por CCAA/proyecto (`ProjectHoliday`), integración con API pública de festivos | RF-07 ampliado | Media |
| Vista personalizada del técnico (solo sus turnos y próximos días) | Nuevos RF | Baja |
| Solicitud / aprobación de vacaciones (flujo V con aprobación por PROJECT_ADMIN) | Nuevos RF | Alta |
| Notificaciones email al técnico cuando se asigna/modifica su turno | Nuevos RF | Alta |
| Dashboard de proyecto: cobertura diaria, ausencias, horas totales | Nuevos RF | Alta |
| Pipeline CI/CD + deploy automático en producción | Operativo | Media |

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
| 0.8 | 8 | Permisos PROJECT_ADMIN en /projects, correcciones E2E |
| 0.9 | 9 | Algoritmo Fase 2 (bloques de noches), RF-16 cobertura mínima, UX PO |
| 1.0 | 10 | Soft-delete empleados, shiftPreference UI, PROJECT_ADMIN edición turnos, nightRotationOrder UI, tabla de contadores separada |
| 1.1 | 11 | Estado del mes (MonthStatus + badge), PrepPanel 4 pasos, campo `manual` en asignaciones, celdas bloqueadas (🔒), revert MF/TF/NF al eliminar festivo, confirmación antes de regenerar |
| 1.2 | 12 | Aislamiento de asignaciones por proyecto (BUG-29 + `ShiftAssignment.projectId`), `resolveNightBlocks` (transferencia de bloque en vacaciones), preferencia Jornada (J), fila propia resaltada en el grid (RF-19) |
| 1.3 | 12 | BUG-30: `_pickWorkdayShift` ignoraba preferencia M/T cuando `weeklyShift` fue fijado por cobertura urgente — corregido con `dailyOrder` (empleados sin preferencia resuelven cobertura primero). BUG-31a: `_pickWeekendShift` no retornaba `"D"` para pref `"J"` — corregido. BUG-31b: `_pickWorkdayShift` asignaba M/T en lugar de `"J"` a empleados con pref `"J"` — corregido retornando `"J"` directamente. Validación `shiftPreference` movida a `business-logic.ts` (testeable). Tests unitarios de regresión BUG-30 y BUG-31 añadidos. |
| 2.0 | 20 | **Refactor modular de generate.ts**: extracción de 1,190 líneas en 8 módulos independientes (date-utils, night-blocks, rest-rules, shift-transitions, coverage, weekend-packs, workday-shifts, cross-month). Reducción de 2350 → 1605 líneas (-32%). Tests unitarios 296 → 374 (78 nuevos), E2E baseline 142 tests ejecutados. Bugs BUG-38 (missing imports) y BUG-39 (circular deps) encontrados y cerrados. Arquitectura modular con raíz sin deps (date-utils.ts). Sprint Orchestrator formalizado con E2E como requerimiento obligatorio. |

---

## 11. Sprint 21 — Refactorización de day-loop (Fase 2)

**Estado**: Pendiente | **Versión destino**: 2.1.0 | **Esfuerzo estimado**: 22 horas

Para detalles completos, ver: [docs/sprint-21-requirements.md](sprint-21-requirements.md)

**Resumen**:
- Extraer loop día-por-día de `generate.ts` a módulo `day-loop.ts`
- Reducir `generate.ts` de 1605 a ≤300 líneas (-81%)
- Refactorizar ~15 cierres internos en estructura `DayLoopContext`
- Agregar mínimo 26 tests unitarios nuevos
- Ejecutar E2E completo (142 tests, **obligatorio**)

**Requisitos de cierre**:
- 100% unit tests passing (≥400 tests)
- 100% E2E tests passing (142 tests)
- `generate.ts` ≤300 líneas
- Release notes + documentación completa
- Sin cambios de comportamiento
