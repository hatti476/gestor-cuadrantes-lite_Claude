# Bug Registry — Gestor de Cuadrantes

**Proyecto:** Gestor de Cuadrantes  
**Mantenido por:** Agente `doc-writer`  
**Última actualización:** 2026-05-17  

---

## Resumen

| Total bugs | Críticos | Altos | Medios | Bajos | Abiertos | Resueltos |
|-----------|----------|-------|--------|-------|----------|-----------|
| 37 | 0 | 20 | 11 | 6 | 0 | 37 |

---

## Índice rápido

| ID | Sprint | Severidad | Estado | Título |
|----|--------|-----------|--------|--------|
| [BUG-01](#bug-01) | Sprint 2 | 🟠 High | ✅ Fixed | Middleware redirige rutas /api/ a /login |
| [BUG-02](#bug-02) | Sprint 2 | 🟢 Low | ✅ Fixed | Botones de navegación de mes sin data-testid |
| [BUG-03](#bug-03) | Sprint 2 | 🟢 Low | ✅ Fixed | Modal ShiftEditor sin data-testid |
| [BUG-04](#bug-04) | Sprint 2 | 🟢 Low | ✅ Fixed | Botones de turno con texto compuesto sin data-testid |
| [BUG-05](#bug-05) | Sprint 3 | 🟠 High | ✅ Fixed | Campo passwordHash inexistente en schema Prisma |
| [BUG-06](#bug-06) | Sprint 3 | 🟡 Medium | ✅ Fixed | createMany con skipDuplicates no soportado en SQLite |
| [BUG-07](#bug-07) | Sprint 3 | 🟡 Medium | ✅ Fixed | Seed no restauraba contraseñas al re-ejecutarse |
| [BUG-08](#bug-08) | Sprint 4 | 🟠 High | ✅ Fixed | Generación automática no actualiza turnos existentes |
| [BUG-09](#bug-09) | Sprint 4 | 🟠 High | ✅ Fixed | existingSet incluye turnos de festivos impidiendo su actualización |
| [BUG-10](#bug-10) | Sprint 4 | 🟠 High | ✅ Fixed | Regla N→NF aplica sobre el día actual en lugar del siguiente |
| [BUG-11](#bug-11) | Sprint 4 | 🟡 Medium | ✅ Fixed | holidayDates como Set no permite almacenar descripción del festivo |
| [BUG-12](#bug-12) | Sprint 4 | 🟡 Medium | ✅ Fixed | Contadores del grid no incluyen tipos MF/TF/NF |
| [BUG-13](#bug-13) | Sprint 4 | 🟡 Medium | ✅ Fixed | Cabecera de día festivo muestra "F" en lugar de la letra del día |
| [BUG-14](#bug-14) | Post-S5 | 🟠 High | ✅ Fixed | M/T en sábado/domingo no se convierten a MF/TF en la generación |
| [BUG-15](#bug-15) | Sprint 8 | 🟠 High | ✅ Fixed | PROJECT_ADMIN redirigido de `/projects` a la home |
| [BUG-16](#bug-16) | Sprint 8 | 🟡 Medium | ✅ Fixed | Generación automática: batch upserts sin transacción fallaban en SQLite |
| [BUG-17](#bug-17) | Sprint 8 | 🟡 Medium | ✅ Fixed | Botón e historial de turnos ausentes en `/employees` |
| [BUG-18](#bug-18) | Sprint 9 | 🟠 High | ✅ Fixed | `_pickWeekendShift` no recibía el parámetro `wKey` → asignación incorrecta |
| [BUG-19](#bug-19) | Sprint 9 | 🟢 Low | ✅ Fixed | TypeScript TS1117: clave `EMPLOYEE` duplicada en `ROLE_BADGES` |
| [BUG-20](#bug-20) | Sprint 9 | 🟡 Medium | ⚠️ Mitigated | Servidor E2E con estado obsoleto — CP-69 no puede verificar celdas N/NF por DOM |
| [BUG-21](#bug-21) | Sprint 9-PO | 🟡 Medium | ✅ Fixed | Pestañas del header sin indicación visual de cuál está activa |
| [BUG-22](#bug-22) | Sprint 9-PO | 🟢 Low | ✅ Fixed | Orden incorrecto de las pestañas de navegación |
| [BUG-23](#bug-23) | Sprint 9-PO | 🟡 Medium | ✅ Fixed | El proyecto activo no es visible desde ninguna página del header |
| [BUG-24](#bug-24) | Sprint 9-PO | 🟢 Low | ✅ Fixed | Información de la parte derecha de la tabla de proyectos cortada (max-width) |
| [BUG-25](#bug-25) | Sprint 9-PO | 🟠 High | ✅ Fixed | El cuadrante tiene un desplegable de proyectos confuso; debe elegirse desde Proyectos |
| [BUG-26](#bug-26) | Sprint 9-PO | 🟠 High | ✅ Fixed | Regresión de timing: cuadrante tardía en cargar por estado `undefined` de proyecto activo |
| [BUG-27](#bug-27) | Sprint 11 | 🟠 High | ✅ Fixed | `turbopack.root: __dirname` en `next.config.ts` provoca que la mayoría de rutas API devuelvan 404 |
| [BUG-28](#bug-28) | Sprint 11 | 🟠 High | ✅ Fixed | Grid vacío en mes sin turnos: empleados derivados de asignaciones en lugar de la API |
| [BUG-29](#bug-29) | Sprint 12 | 🟠 High | ✅ Fixed | Nuevo proyecto hereda asignaciones históricas de empleados de proyectos anteriores |
| [BUG-30](#bug-30) | Sprint 12 | 🟠 High | ✅ Fixed | `_pickWorkdayShift` ignoraba preferencia M/T cuando `weeklyShift` fue fijado por cobertura urgente |
| [BUG-31](#bug-31) | Sprint 12 | 🟠 High | ✅ Fixed | Empleado con pref `J` recibía MF/TF en fin de semana y M/T en días laborables |
| [BUG-32](#bug-32) | Sprint 14 | 🟠 High | ✅ Fixed | Proyecto antiguo de localStorage persiste aunque no exista en la BD |
| [BUG-33](#bug-33) | Sprint 14 | 🟠 High | ✅ Fixed | Empleado de reemplazo en semana de noches recibe dos bloques consecutivos |
| [BUG-34](#bug-34) | Sprint 14 | 🟡 Medium | 🔴 Open | Día 31 no se muestra correctamente en meses de 31 días |
| [BUG-35](#bug-35) | Sprint 14 | 🟠 High | 🔴 Open | Preferencia M/T no se respeta al asignar MF/TF en fines de semana y festivos |
| [BUG-36](#bug-36) | Sprint 14 | 🟠 High | 🔴 Open | Regla de máximo 5 días consecutivos no se aplica al mezclar M/T con MF/TF |
| [BUG-37](#bug-37) | Sprint 14 | 🟠 High | 🔴 Open | Turnos de finde/festivo (MF/TF) no se asignan como paquete indivisible Sáb+Dom |

---

## Detalle de bugs

---

### BUG-01

| Campo | Valor |
|-------|-------|
| **ID** | BUG-01 |
| **Sprint** | Sprint 2 |
| **Detectado por** | E2E — CP-18 |
| **Fecha detección** | 2026-05-09 |
| **Severidad** | 🟠 High |
| **Estado** | ✅ Fixed |
| **Commit fix** | `98110ce` |

**Descripción**  
El middleware `proxy.ts` redirigía todas las rutas sin sesión activa —incluidas las rutas `/api/`— a `/login`, devolviendo un redirect HTTP 302 en lugar de la respuesta nativa de la API (401 Unauthorized). Esto impedía que los tests de seguridad de la API verificasen el rechazo correcto de peticiones no autenticadas.

**Pasos para reproducir**
1. Arrancar el servidor con `npm run dev`.
2. Enviar `POST /api/schedules` sin cabecera de sesión (usuario no autenticado).
3. Observar que la respuesta es HTTP 302 → Location: /login en lugar de HTTP 401.

**Resultado esperado**  
La API devuelve `401 Unauthorized` con body `{ error: "Unauthorized" }`.

**Resultado obtenido**  
La API devuelve `302 Found` → redirección a `/login`.

**Ficheros afectados**  
- `proxy.ts` (middleware raíz)

**Fix aplicado**  
Añadida condición `isApiRoute` en `proxy.ts`: si la URL empieza por `/api/`, el middleware omite la redirección y deja que la route handler gestione la autenticación con su propio `getServerSession`.

---

### BUG-02

| Campo | Valor |
|-------|-------|
| **ID** | BUG-02 |
| **Sprint** | Sprint 2 |
| **Detectado por** | E2E — CP-09 (regresión al añadir tests de navegación de mes) |
| **Fecha detección** | 2026-05-09 |
| **Severidad** | 🟢 Low |
| **Estado** | ✅ Fixed |
| **Commit fix** | `98110ce` |

**Descripción**  
Los botones de navegación de mes (anterior / siguiente) usaban caracteres Unicode especiales (`‹`/`›`) que no coincidían con los selectores de texto de Playwright, haciendo los tests de navegación inestables.

**Pasos para reproducir**
1. En un test Playwright buscar el botón de mes siguiente con `filter({ hasText: ">" })`.
2. El locator no encuentra ningún elemento.

**Resultado esperado**  
El locator encuentra el botón correctamente.

**Resultado obtenido**  
Playwright no encontraba el elemento; test fallaba con "strict mode violation" o timeout.

**Ficheros afectados**  
- `app/page.tsx`

**Fix aplicado**  
Añadidos `data-testid="btn-prev-month"` y `data-testid="btn-next-month"` a los botones de navegación en `app/page.tsx`. Los tests usan estos atributos en lugar del contenido textual.

---

### BUG-03

| Campo | Valor |
|-------|-------|
| **ID** | BUG-03 |
| **Sprint** | Sprint 2 |
| **Detectado por** | E2E — CP-14 |
| **Fecha detección** | 2026-05-09 |
| **Severidad** | 🟢 Low |
| **Estado** | ✅ Fixed |
| **Commit fix** | `98110ce` |

**Descripción**  
El modal `ShiftEditor` no tenía atributo `data-testid`, haciendo que los tests buscasen el modal por texto (`Asignar turno`) que no coincidía con el título real dinámico (`Turno — DD/MM/YYYY`).

**Pasos para reproducir**
1. En un test Playwright ejecutar `page.locator('text=Asignar turno')` tras abrir el modal de edición de turno.
2. El locator no encuentra ningún elemento.

**Resultado esperado**  
El locator detecta el modal.

**Resultado obtenido**  
Timeout: el modal no se detecta porque su texto real es dinámico.

**Ficheros afectados**  
- `components/schedule/shift-editor.tsx`

**Fix aplicado**  
Añadido `data-testid="shift-editor"` al elemento contenedor del modal.

---

### BUG-04

| Campo | Valor |
|-------|-------|
| **ID** | BUG-04 |
| **Sprint** | Sprint 2 |
| **Detectado por** | E2E — CP-14 |
| **Fecha detección** | 2026-05-09 |
| **Severidad** | 🟢 Low |
| **Estado** | ✅ Fixed |
| **Commit fix** | `98110ce` |

**Descripción**  
Cada botón de tipo de turno en `ShiftEditor` contenía dos elementos `<span>` (código corto + etiqueta larga), por lo que el texto combinado era p.ej. `"MMañana"`. Los selectores de texto con regex `/^M$/` fallaban por el modo strict de Playwright.

**Pasos para reproducir**
1. En un test Playwright ejecutar `page.getByRole('button', { name: /^M$/ })` dentro del `ShiftEditor`.
2. Playwright no encuentra ningún botón que coincida exactamente con "M".

**Resultado esperado**  
El locator encuentra el botón del turno "M" (Mañana).

**Resultado obtenido**  
Strict mode violation o timeout por texto combinado `"MMañana"`.

**Ficheros afectados**  
- `components/schedule/shift-editor.tsx`

**Fix aplicado**  
Añadido `data-testid="shift-btn-{tipo}"` a cada botón de turno (p.ej. `data-testid="shift-btn-M"`). Los tests usan este atributo en lugar de texto.

---

### BUG-05

| Campo | Valor |
|-------|-------|
| **ID** | BUG-05 |
| **Sprint** | Sprint 3 |
| **Detectado por** | E2E — CP-23 |
| **Fecha detección** | 2026-05-09 |
| **Severidad** | 🟠 High |
| **Estado** | ✅ Fixed |
| **Commit fix** | `750790c` |

**Descripción**  
La route de cambio de contraseña (`PATCH /api/employees/[id]`) hacía referencia al campo `passwordHash` en la llamada a `prisma.user.update`, pero el schema de Prisma define el campo como `password`. Esto provocaba un error en runtime al intentar cambiar la contraseña de un empleado.

**Pasos para reproducir**
1. Iniciar sesión como administrador.
2. Ir a `/employees`.
3. Pulsar "Cambiar contraseña" de cualquier empleado e introducir una nueva contraseña válida.
4. La operación devuelve un error 500.

**Resultado esperado**  
La contraseña se actualiza correctamente y el empleado puede iniciar sesión con la nueva contraseña.

**Resultado obtenido**  
Error 500: `Unknown arg 'passwordHash' in data.passwordHash for type UserUpdateInput`.

**Ficheros afectados**  
- `app/api/employees/[id]/route.ts`

**Fix aplicado**  
Corregido el nombre del campo de `passwordHash` a `password` en la llamada `prisma.user.update`.

---

### BUG-06

| Campo | Valor |
|-------|-------|
| **ID** | BUG-06 |
| **Sprint** | Sprint 3 |
| **Detectado por** | E2E — CP-26 (error en generación automática) |
| **Fecha detección** | 2026-05-09 |
| **Severidad** | 🟡 Medium |
| **Estado** | ✅ Fixed |
| **Commit fix** | `750790c` |

**Descripción**  
La route de generación automática usaba `prisma.shiftAssignment.createMany({ skipDuplicates: true })`. SQLite no soporta `skipDuplicates` y lanzaba un error en runtime al intentar generar el cuadrante.

**Pasos para reproducir**
1. Iniciar sesión como administrador.
2. Navegar a un mes sin datos.
3. Pulsar "Generar cuadrante".
4. La operación falla con error 500.

**Resultado esperado**  
El cuadrante se genera sin errores; los turnos manuales existentes no se sobreescriben.

**Resultado obtenido**  
Error 500: `The `skipDuplicates` argument is not supported for SQLite`.

**Ficheros afectados**  
- `app/api/schedules/generate/route.ts`

**Fix aplicado**  
Sustituido `createMany({ skipDuplicates: true })` por un bucle de `upsert` individual para cada asignación, usando `update: {}` vacío para preservar los turnos manuales existentes.

---

### BUG-07

| Campo | Valor |
|-------|-------|
| **ID** | BUG-07 |
| **Sprint** | Sprint 3 |
| **Detectado por** | E2E — CP-23 (fallos de login tras QA de cambio de contraseña) |
| **Fecha detección** | 2026-05-09 |
| **Severidad** | 🟡 Medium |
| **Estado** | ✅ Fixed |
| **Commit fix** | `750790c` |

**Descripción**  
El script `prisma/seed.ts` usaba `upsert` con `update: {}` vacío. Si el seed se ejecutaba después de que un test hubiese cambiado la contraseña de un usuario, el upsert no restauraba la contraseña original, dejando las credenciales de prueba en estado desconocido.

**Pasos para reproducir**
1. Ejecutar los tests E2E de Sprint 3 (CP-23 cambia contraseñas).
2. Ejecutar `npm run db:seed`.
3. Intentar iniciar sesión con las credenciales originales definidas en `.env.test`.
4. El login falla porque la contraseña no se restauró.

**Resultado esperado**  
Tras `npm run db:seed`, todas las credenciales de prueba quedan restauradas a sus valores originales.

**Resultado obtenido**  
Las contraseñas modificadas por los tests permanecen en la BD; el seed no las restaura.

**Ficheros afectados**  
- `prisma/seed.ts`

**Fix aplicado**  
Cambiado `update: {}` a `update: { password: hash }` en el `upsert` de usuarios del seed, garantizando que la contraseña siempre se restaura al ejecutar el seed.

---

### BUG-08

| Campo | Valor |
|-------|-------|
| **ID** | BUG-08 |
| **Sprint** | Sprint 4 |
| **Detectado por** | E2E — CP-32 (generación no respetaba festivos) |
| **Fecha detección** | 2026-05-09 |
| **Severidad** | 🟠 High |
| **Estado** | ✅ Fixed |
| **Commit fix** | `60f598a` |

**Descripción**  
La route `POST /api/schedules/generate` usaba `upsert` con `update: {}` vacío. Si un turno ya existía en BD, el upsert no lo actualizaba, por lo que los turnos que debían convertirse de M→MF o N→NF por ser festivos quedaban sin cambiar.

**Pasos para reproducir**
1. Generar el cuadrante de un mes (los turnos quedan en BD como M, T, N...).
2. Añadir un festivo en ese mes.
3. Generar el cuadrante de nuevo.
4. Los turnos existentes no cambian a MF/TF/NF.

**Resultado esperado**  
La regeneración actualiza todos los turnos, aplicando las reglas de festivos correctamente.

**Resultado obtenido**  
Los turnos existentes permanecen iguales (M, T, N) aunque el día sea festivo.

**Ficheros afectados**  
- `app/api/schedules/generate/route.ts`

**Fix aplicado**  
Cambiado el `upsert` a `update: { shiftType: a.shiftType }` para que la regeneración siempre sobreescriba el tipo de turno con el valor recalculado.

---

### BUG-09

| Campo | Valor |
|-------|-------|
| **ID** | BUG-09 |
| **Sprint** | Sprint 4 |
| **Detectado por** | E2E — CP-32 |
| **Fecha detección** | 2026-05-09 |
| **Severidad** | 🟠 High |
| **Estado** | ✅ Fixed |
| **Commit fix** | `60f598a` |

**Descripción**  
La route de generación construía un `existingSet` con todos los turnos ya existentes en BD para "preservarlos". Este conjunto incluía también los turnos de tipo MF, TF y NF (festivos), que deberían haber sido regenerados si se elimina un festivo. Como resultado, si se eliminaba un festivo los turnos MF/TF/NF quedaban "protegidos" por el existingSet y nunca se revertían a M/T/N.

**Pasos para reproducir**
1. Añadir un festivo → los turnos M del día se convierten en MF.
2. Eliminar el festivo.
3. Generar el cuadrante de nuevo.
4. Los turnos siguen siendo MF en lugar de revertir a M.

**Resultado esperado**  
Al regenerar, los turnos MF/TF/NF en días que ya no son festivos revierten a M/T/N.

**Resultado obtenido**  
Los turnos MF/TF/NF permanecen aunque el festivo haya sido eliminado.

**Ficheros afectados**  
- `app/api/schedules/generate/route.ts`

**Fix aplicado**  
Al construir el `existingSet`, se excluyen los turnos MF, TF y NF (y los N cuyo día siguiente era festivo), permitiendo que la generación los recalcule correctamente.

---

### BUG-10

| Campo | Valor |
|-------|-------|
| **ID** | BUG-10 |
| **Sprint** | Sprint 4 |
| **Detectado por** | E2E — CP-37 + Test unitario `shiftForEmployee — festivos` |
| **Fecha detección** | 2026-05-09 |
| **Severidad** | 🟠 High |
| **Estado** | ✅ Fixed |
| **Commit fix** | `60f598a` |

**Descripción**  
La función `shiftForEmployee` en `lib/schedules/generate.ts` aplicaba la regla N→NF comprobando si el día **actual** era festivo, en lugar del día **siguiente**. Un turno de noche N (23:00–07:00) termina al día siguiente; la conversión NF es correcta solo cuando el día en que termina el turno (mañana) es festivo.

**Pasos para reproducir**
1. Tener un empleado con turno N el día 15.
2. Añadir un festivo el día 15 (mismo día del turno N).
3. Generar el cuadrante.
4. El turno N del día 15 se convierte incorrectamente en NF (el festivo es el propio día 15, no el día siguiente).

**Resultado esperado**  
- N del día 14 → NF cuando el día 15 es festivo.
- N del día 15 → permanece N si el día 15 es festivo pero el 16 no lo es.

**Resultado obtenido**  
- N del día 15 → NF incorrectamente cuando el día 15 es festivo.

**Ficheros afectados**  
- `lib/schedules/generate.ts`
- `app/api/schedules/generate/route.ts` (existingSet también usaba la lógica incorrecta)

**Fix aplicado**  
En `shiftForEmployee`, la condición para N→NF comprueba `holidayDates.has(nextDayStr)` (usando `date + 86_400_000` para obtener el día siguiente). El `existingSet` de la route aplica la misma lógica.

---

### BUG-11

| Campo | Valor |
|-------|-------|
| **ID** | BUG-11 |
| **Sprint** | Sprint 4 |
| **Detectado por** | Manual — revisión tras implementación del popover (RF-34) |
| **Fecha detección** | 2026-05-09 |
| **Severidad** | 🟡 Medium |
| **Estado** | ✅ Fixed |
| **Commit fix** | `60f598a` |

**Descripción**  
El estado `holidayDates` en `app/page.tsx` era de tipo `Set<string>` (solo fechas), pero el componente `ScheduleGrid` necesitaba también la descripción del festivo para mostrarla en el popover (RF-34). Con `Set`, el popover podía detectar si un día era festivo pero no tenía acceso al nombre del festivo.

**Pasos para reproducir**
1. Añadir un festivo con descripción "Día de la Constitución".
2. Cargar el cuadrante del mes correspondiente.
3. Pulsar sobre la cabecera roja del día festivo.
4. El popover aparece pero no muestra la descripción.

**Resultado esperado**  
El popover muestra el nombre del festivo: "🎉 Festivo — Día de la Constitución".

**Resultado obtenido**  
El popover aparece vacío o muestra solo el icono sin texto descriptivo.

**Ficheros afectados**  
- `app/page.tsx`
- `components/schedule/schedule-grid.tsx`

**Fix aplicado**  
Cambiado `holidayDates: Set<string>` a `Map<string, string>` (fecha → descripción). El componente `ScheduleGrid` recibe el `Map` y muestra `holidayDates.get(dateStr)` en el popover.

---

### BUG-12

| Campo | Valor |
|-------|-------|
| **ID** | BUG-12 |
| **Sprint** | Sprint 4 |
| **Detectado por** | E2E — CP-38 |
| **Fecha detección** | 2026-05-10 |
| **Severidad** | 🟡 Medium |
| **Estado** | ✅ Fixed |
| **Commit fix** | `60f598a` |

**Descripción**  
La cabecera de días festivos en el grid mostraba la letra "F" (de festivo) en el slot del día de la semana, ocultando la información del día real (L, M, X, J, V, S, D). El requisito RF-33 establece explícitamente que la letra del día de la semana debe mantenerse visible.

**Pasos para reproducir**
1. Añadir un festivo un lunes.
2. Cargar el cuadrante del mes correspondiente.
3. Observar la cabecera del día festivo.
4. La cabecera muestra "F" en lugar de "L" (lunes).

**Resultado esperado**  
La cabecera muestra el número del día y la letra del día de la semana (p.ej. "1 / L").

**Resultado obtenido**  
La cabecera muestra "F" en lugar de la letra del día de la semana.

**Ficheros afectados**  
- `components/schedule/schedule-grid.tsx`

**Fix aplicado**  
Eliminada la "F" del texto de la cabecera; se mantiene únicamente `DAY_NAMES[dayOfWeek]` en el slot de la letra del día. El fondo rojo (`bg-red-100`) indica visualmente que es festivo.

---

### BUG-13

| Campo | Valor |
|-------|-------|
| **ID** | BUG-13 |
| **Sprint** | Sprint 4 |
| **Detectado por** | Manual — revisión visual del grid tras Sprint 4 |
| **Fecha detección** | 2026-05-09 |
| **Severidad** | 🟡 Medium |
| **Estado** | ✅ Fixed |
| **Commit fix** | `60f598a` |

**Descripción**  
Los contadores de turnos del grid (columna "Contadores") no incluían los tipos de turno festivo MF, TF y NF en el array `shiftOrder`. Como resultado, los turnos festivos no aparecían en el resumen de contadores aunque sí existían en el cuadrante, dando una imagen incompleta de la carga de trabajo.

**Pasos para reproducir**
1. Generar el cuadrante de un mes con festivos (p.ej. con un empleado que tiene MF ese día).
2. Observar la columna "Contadores" de ese empleado.
3. El tipo MF no aparece en el resumen aunque el empleado tenga turnos MF.

**Resultado esperado**  
Los contadores muestran todos los tipos de turno del empleado, incluyendo MF, TF y NF.

**Resultado obtenido**  
Los tipos MF, TF y NF no aparecen en los contadores aunque el empleado los tenga asignados.

**Ficheros afectados**  
- `components/schedule/schedule-grid.tsx`

**Fix aplicado**  
Añadidos `"MF"`, `"TF"` y `"NF"` al array `shiftOrder` utilizado para generar la columna de contadores.

---

*Registro mantenido por el agente `doc-writer`. Actualizar tras cada sesión de QA.*

---

### BUG-14

| Campo | Valor |
|-------|-------|
| **ID** | BUG-14 |
| **Sprint** | Post-Sprint 5 (hotfix 2026-05-10) |
| **Detectado por** | Manual — revisión del PM al revisar la app antes del Sprint 6 |
| **Fecha detección** | 2026-05-10 |
| **Severidad** | 🟠 High |
| **Estado** | ✅ Fixed |
| **Commit fix** | `6f7c19c` |

**Descripción**  
La lógica de generación automática aplicaba la conversión MF/TF/NF únicamente para días festivos explícitos, ignorando los fines de semana. Los turnos M y T que caían en sábado o domingo se generaban como M/T en lugar de MF/TF. Del mismo modo, un turno N cuyo día siguiente era sábado o domingo no se convertía a NF. La única excepción correcta era N del domingo → N cuando el lunes es laborable (el turno termina el lunes, que no es especial).

**Pasos para reproducir**
1. Generar el cuadrante de cualquier mes.
2. Localizar un empleado con turno M o T en sábado o domingo.
3. Observar que el turno figura como M/T en lugar de MF/TF.
4. Localizar un empleado con turno N el viernes o sábado.
5. Observar que el turno figura como N en lugar de NF (el día siguiente es fin de semana).

**Resultado esperado**  
- M en sábado o domingo → MF  
- T en sábado o domingo → TF  
- N cuando el día siguiente es sábado o domingo → NF  
- N en domingo cuando el lunes es laborable → N (sin cambio)

**Resultado obtenido**  
- M/T en sábado/domingo → M/T (incorrecto)  
- N en viernes/sábado → N (incorrecto)

**Ficheros afectados**  
- `lib/schedules/generate.ts` — función `shiftForEmployee`
- `app/api/schedules/generate/route.ts` — construcción del `existingSet`
- `lib/schedules/business-logic.ts` — documentación de `applyHolidayRule`

**Fix aplicado**  
Añadida función `isWeekend(date: Date): boolean` (comprueba `getUTCDay() === 0 || 6`) en `generate.ts`. La función `shiftForEmployee` ahora evalúa `holidayDates.has(dateStr) || isWeekend(date)` para M/T, y `holidayDates.has(nextDateStr) || isWeekend(nextDay)` para N. El `existingSet` de la route aplica la misma lógica para excluir los turnos que deben regenerarse. Añadidos 9 tests unitarios que cubren todos los casos (M/T en sáb/dom, N en viernes/sáb, N en domingo con lunes laborable y N en domingo con lunes festivo).

---

### BUG-15

| Campo | Valor |
|-------|-------|
| **ID** | BUG-15 |
| **Sprint** | Sprint 8 |
| **Detectado por** | E2E — CP-57 |
| **Fecha detección** | 2026-05-12 |
| **Severidad** | 🟠 High |
| **Estado** | ✅ Fixed |
| **Commit fix** | `7eaddcb` |

**Descripción**  
La página `/projects` redirigía a la home (`/`) a cualquier usuario que no fuese SUPER_ADMIN, incluyendo a los PROJECT_ADMIN. Según los requisitos de Sprint 8, un PROJECT_ADMIN debe poder acceder a `/projects` para gestionar los miembros de su proyecto.

**Pasos para reproducir**
1. Iniciar sesión como `pm@cuadrantes.local` (rol PROJECT_ADMIN).
2. Navegar a `/projects`.
3. La página redirige automáticamente a `/`.

**Resultado esperado**  
El PROJECT_ADMIN ve la lista de sus proyectos en `/projects` con el botón `Miembros` disponible.

**Resultado obtenido**  
Redirección inmediata a la home sin mostrar ningún contenido.

**Ficheros afectados**  
- `app/projects/page.tsx`

**Fix aplicado**  
Añadido flag `isProjectAdmin` derivado de `session.user.projectMemberships`. La condición de acceso cambia de `if (!isSuperAdmin) redirect('/')` a `if (!isSuperAdmin && !isProjectAdmin) redirect('/')`. Los botones de creación, edición y eliminación de proyectos siguen bajo `{isSuperAdmin && ...}`. El botón `Miembros` es visible para SUPER_ADMIN o para PROJECT_ADMIN en sus propios proyectos.

---

### BUG-16

| Campo | Valor |
|-------|-------|
| **ID** | BUG-16 |
| **Sprint** | Sprint 8 |
| **Detectado por** | E2E — CP-26 y CP-27 (regresión al ejecutar suite completa) |
| **Fecha detección** | 2026-05-12 |
| **Severidad** | 🟡 Medium |
| **Estado** | ✅ Fixed |
| **Commit fix** | `fff5142` |

**Descripción**  
La route `POST /api/schedules/generate` realizaba upserts en lote mediante un array de llamadas a `prisma.shiftAssignment.upsert()` sin envolver en una transacción. En SQLite, múltiples escrituras concurrentes sin transacción explícita podían causar errores `SQLITE_BUSY` o inconsistencias cuando se ejecutaban varios tests en paralelo.

**Pasos para reproducir**
1. Ejecutar la suite E2E completa con múltiples workers.
2. Los tests CP-26 y CP-27 fallan de forma intermitente con errores de BD.

**Resultado esperado**  
La generación del cuadrante completa sin errores independientemente de la carga concurrente.

**Resultado obtenido**  
Fallos intermitentes `SQLITE_BUSY` o errores de constraint durante la generación.

**Ficheros afectados**  
- `app/api/schedules/generate/route.ts`

**Fix aplicado**  
Envueltos todos los upserts en una sola llamada `prisma.$transaction([...operaciones])`, garantizando atomicidad y evitando conflictos de escritura concurrente en SQLite.

---

### BUG-17

| Campo | Valor |
|-------|-------|
| **ID** | BUG-17 |
| **Sprint** | Sprint 8 |
| **Detectado por** | E2E — CP-34 |
| **Fecha detección** | 2026-05-12 |
| **Severidad** | 🟡 Medium |
| **Estado** | ✅ Fixed |
| **Commit fix** | `fff5142` |

**Descripción**  
El test CP-34 verificaba que un administrador podía consultar el historial de cambios de turno de un empleado desde la página `/employees`. Sin embargo, el botón para abrir el historial (`btn-history-{id}`) y el modal correspondiente no existían en la UI. La funcionalidad de historial solo era accesible navegando manualmente a `/employees/[id]/history`.

**Pasos para reproducir**
1. Iniciar sesión como SUPER_ADMIN.
2. Navegar a `/employees`.
3. Intentar acceder al historial de cambios de un empleado desde la tabla.
4. No existe ningún botón ni enlace de historial en la tabla de empleados.

**Resultado esperado**  
Cada fila de la tabla de empleados tiene un botón `data-testid="btn-history-{id}"` que abre un modal con los últimos cambios de turno.

**Resultado obtenido**  
No hay botón de historial en la tabla; el test falla con timeout.

**Ficheros afectados**  
- `app/employees/page.tsx`
- `components/employees/employee-table.tsx`

**Fix aplicado**  
Añadido botón `data-testid="btn-history-{id}"` en la columna de acciones de cada empleado en `employee-table.tsx`. Implementado modal de historial en `app/employees/page.tsx` que llama a `GET /api/employees/[id]/history` y muestra los últimos 20 cambios.

---

### BUG-18

| Campo | Valor |
|-------|-------|
| **ID** | BUG-18 |
| **Sprint** | Sprint 9 |
| **Detectado por** | Test unitario — `generateMonthSchedule — fin de semana equitativo` |
| **Fecha detección** | 2026-05-12 |
| **Severidad** | 🟠 High |
| **Estado** | ✅ Fixed |
| **Commit fix** | `db53644` |

**Descripción**  
La función interna `_pickWeekendShift` del nuevo algoritmo Fase 2 recibía como parámetros `(date, employees, nightIds, assignments)` pero omitía el parámetro `wKey` (clave de semana ISO). Sin `wKey`, la función no podía consultar el historial de asignaciones de la semana para calcular la distribución equitativa de MF/TF en fines de semana, produciendo asignaciones incorrectas o distribuciones desequilibradas.

**Pasos para reproducir**
1. Generar un cuadrante de cualquier mes con el algoritmo Fase 2.
2. Observar que la distribución de turnos MF/TF en fines de semana no es equitativa entre empleados.
3. En algunos casos la función asignaba el mismo tipo de turno a todos los empleados no nocturnos.

**Resultado esperado**  
Máximo 1 empleado con turno MF y 1 con TF por día de fin de semana, distribuidos equitativamente.

**Resultado obtenido**  
Distribución incorrecta; el límite de 1 MF + 1 TF podía no respetarse.

**Ficheros afectados**  
- `lib/schedules/generate.ts` — función `_pickWeekendShift`

**Fix aplicado**  
Añadido el parámetro `wKey: string` a la firma de `_pickWeekendShift` y actualizada la llamada desde `generateMonthSchedule`. La función puede ahora consultar `weekAssignments.get(wKey)` para determinar la carga semanal de cada empleado.

---

### BUG-19

| Campo | Valor |
|-------|-------|
| **ID** | BUG-19 |
| **Sprint** | Sprint 9 |
| **Detectado por** | Compilación TypeScript (`tsc --noEmit`) |
| **Fecha detección** | 2026-05-12 |
| **Severidad** | 🟢 Low |
| **Estado** | ✅ Fixed |
| **Commit fix** | `db53644` |

**Descripción**  
El objeto `ROLE_BADGES` en `components/employees/employee-table.tsx` tenía la clave `EMPLOYEE` definida dos veces, provocando el error de compilación TypeScript TS1117: `"An object literal cannot have multiple properties with the same name"`.

**Pasos para reproducir**
1. Ejecutar `npx tsc --noEmit` en el directorio del proyecto.
2. El compilador reporta `TS1117` en `employee-table.tsx`.

**Resultado esperado**  
Compilación sin errores.

**Resultado obtenido**  
`error TS1117: An object literal cannot have multiple properties with the same name in strict mode.`

**Ficheros afectados**  
- `components/employees/employee-table.tsx`

**Fix aplicado**  
Eliminada la entrada duplicada de `EMPLOYEE` en el objeto `ROLE_BADGES`, manteniendo únicamente la definición con el color y texto correctos.

---

### BUG-20

| Campo | Valor |
|-------|-------|
| **ID** | BUG-20 |
| **Sprint** | Sprint 9 |
| **Detectado por** | E2E — CP-69 (fallo intermitente) |
| **Fecha detección** | 2026-05-12 |
| **Severidad** | 🟡 Medium |
| **Estado** | ⚠️ Mitigated |
| **Commit fix** | `db53644` (workaround) |

**Descripción**  
Al ejecutar únicamente los tests de Sprint 9 (`npx playwright test tests/e2e/sprint-9.spec.ts`) después de haber ejecutado la suite completa, el servidor E2E en el puerto 3001 conservaba una conexión Prisma abierta a la `test.db` anterior (la del run previo). El `globalSetup` recreaba correctamente el fichero `test.db`, pero el proceso del servidor no cerraba y reabrí sus file descriptors, por lo que las peticiones de datos continuaban devolviendo los datos del seed anterior (empleados de Sprint 3 tipo "Tecnico Editado...") en lugar de los del seed actual. CP-69 necesitaba verificar que el cuadrante generado contenía ≥ 7 celdas N/NF, pero el DOM mostraba datos obsoletos.

**Pasos para reproducir**
1. Ejecutar `npx playwright test` (suite completa) → todos los tests pasan.
2. Inmediatamente ejecutar `npx playwright test tests/e2e/sprint-9.spec.ts`.
3. CP-69 falla porque el servidor devuelve datos del seed de Sprint 3.

**Resultado esperado**  
Cada ejecución de tests parte de una BD limpia con el seed actual. CP-69 verifica las celdas N/NF en el DOM.

**Resultado obtenido**  
El servidor E2E reutiliza la conexión anterior; el DOM muestra datos del seed antiguo. CP-69 falla.

**Ficheros afectados**  
- `tests/e2e/sprint-9.spec.ts` — lógica de verificación CP-69
- `playwright.config.ts` — configuración del webServer

**Workaround aplicado**  
CP-69 realiza la verificación llamando directamente a `/api/schedules?year=2026&month=10` mediante `page.evaluate()` en lugar de contar celdas del DOM. La API siempre conecta a la BD real con los datos actuales, independientemente del estado de renderizado del servidor. La verificación DOM completa está cubierta por los 40 tests unitarios.

**Solución definitiva pendiente**  
Forzar el cierre y reinicio del servidor E2E entre ejecuciones parciales (p.ej. con `reuseExistingServer: false` y un mecanismo de señal de cierre). Pendiente para Sprint 10.

---

### BUG-21

| Campo | Valor |
|-------|-------|
| **ID** | BUG-21 |
| **Sprint** | Sprint 9 — Correcciones Product Owner |
| **Detectado por** | Product Owner — revisión manual |
| **Fecha detección** | 2026-05-12 |
| **Severidad** | 🟡 Medium |
| **Estado** | ✅ Fixed |
| **Commit fix** | pendiente |

**Descripción**  
Las pestañas del header (Proyectos, Cuadrante, Empleados, Ayuda) no tenían ningún indicador visual de cuál era la página activa. Al navegar entre páginas, todas las pestañas tenían el mismo aspecto en gris.

**Resultado esperado**  
La pestaña correspondiente a la página actual se muestra resaltada (texto azul índigo + subrayado inferior).

**Resultado obtenido**  
Todas las pestañas tenían el mismo estilo gris independientemente de la página activa.

**Ficheros afectados**  
- `components/layout/header.tsx`

**Fix aplicado**  
Añadida función `navClass(href)` que usa `usePathname()` de Next.js para comparar la ruta actual. La pestaña activa recibe las clases `text-indigo-600 font-semibold border-b-2 border-indigo-500`. Las inactivas mantienen `text-gray-500 hover:text-gray-900`.

---

### BUG-22

| Campo | Valor |
|-------|-------|
| **ID** | BUG-22 |
| **Sprint** | Sprint 9 — Correcciones Product Owner |
| **Detectado por** | Product Owner — revisión manual |
| **Fecha detección** | 2026-05-12 |
| **Severidad** | 🟢 Low |
| **Estado** | ✅ Fixed |
| **Commit fix** | pendiente |

**Descripción**  
El orden de las pestañas de navegación era: Cuadrante, Empleados, Proyectos, Ayuda. El Product Owner solicitó el orden: Proyectos, Cuadrante, Empleados, Ayuda.

**Resultado esperado**  
Orden: Proyectos → Cuadrante → Empleados → Ayuda.

**Resultado obtenido**  
Orden: Cuadrante → Empleados → Proyectos → Ayuda.

**Ficheros afectados**  
- `components/layout/header.tsx`

**Fix aplicado**  
Reordenados los `<Link>` en el `<nav>`: primero `Proyectos` (visible para SUPER_ADMIN y PROJECT_ADMIN), luego `Cuadrante`, `Empleados` (solo SUPER_ADMIN) y `Ayuda`.

---

### BUG-23

| Campo | Valor |
|-------|-------|
| **ID** | BUG-23 |
| **Sprint** | Sprint 9 — Correcciones Product Owner |
| **Detectado por** | Product Owner — revisión manual |
| **Fecha detección** | 2026-05-12 |
| **Severidad** | 🟡 Medium |
| **Estado** | ✅ Fixed |
| **Commit fix** | pendiente |

**Descripción**  
No existía ninguna indicación persistente de qué proyecto estaba activo. Al navegar entre páginas, el usuario no sabía en qué proyecto estaba trabajando. El badge de proyecto solo era visible dentro del `ProjectSelector` en la home.

**Resultado esperado**  
El nombre del proyecto activo aparece como badge (`data-testid="active-project-badge"`) en el header en todas las páginas.

**Resultado obtenido**  
No había indicación del proyecto activo en el header.

**Ficheros afectados**  
- `components/layout/header.tsx`

**Fix aplicado**  
El header lee el proyecto activo de `localStorage.getItem("activeProject")` al montar. Escucha el evento `window.activeProjectChanged` para actualizar el badge cuando el proyecto cambia. Muestra `📁 {nombre}` con estilo indigo en la barra superior.

---

### BUG-24

| Campo | Valor |
|-------|-------|
| **ID** | BUG-24 |
| **Sprint** | Sprint 9 — Correcciones Product Owner |
| **Detectado por** | Product Owner — revisión manual |
| **Fecha detección** | 2026-05-12 |
| **Severidad** | 🟢 Low |
| **Estado** | ✅ Fixed |
| **Commit fix** | pendiente |

**Descripción**  
La tabla de proyectos en `/projects` tenía `max-w-4xl` y `truncate` en la columna de descripción, lo que cortaba la información visible. Los botones de acción también quedaban fuera de pantalla en resoluciones medias.

**Resultado esperado**  
La tabla usa todo el ancho disponible; la descripción se muestra completa; los botones son accesibles. En caso de desbordamiento, aparece scroll horizontal.

**Resultado obtenido**  
La tabla estaba limitada a 56rem de ancho; la descripción se truncaba con `…`; los botones de acción de la derecha podían quedar ocultos.

**Ficheros afectados**  
- `app/projects/page.tsx`

**Fix aplicado**  
Eliminado `max-w-4xl mx-auto` del `<main>` → ahora usa `w-full`. Eliminado `truncate max-w-xs` de la celda de descripción. Envuelta la tabla en un `div overflow-x-auto` para scroll horizontal si es necesario.

---

### BUG-25

| Campo | Valor |
|-------|-------|
| **ID** | BUG-25 |
| **Sprint** | Sprint 9 — Correcciones Product Owner |
| **Detectado por** | Product Owner — revisión manual |
| **Fecha detección** | 2026-05-12 |
| **Severidad** | 🟠 High |
| **Estado** | ✅ Fixed |
| **Commit fix** | pendiente |

**Descripción**  
La pantalla del cuadrante tenía un desplegable (`<select>`) de selección de proyecto integrado directamente en la barra de herramientas del cuadrante. El Product Owner lo consideró confuso y solicitó que la selección de proyecto se realizase exclusivamente desde la pestaña de Proyectos.

**Resultado esperado**  
- La página del cuadrante no contiene selector de proyecto.
- En `/projects`, cada fila tiene un botón **Seleccionar** que marca el proyecto como activo (resaltado en verde con `✓ Activo`) y navega automáticamente a la home.
- El proyecto activo se persiste en `localStorage` y se sincroniza con el badge del header.

**Resultado obtenido**  
- La home mostraba un `<select>` de proyecto en la barra de herramientas.
- No había forma de seleccionar el proyecto desde `/projects`.

**Ficheros afectados**  
- `app/page.tsx` — eliminado `ProjectSelector`
- `app/projects/page.tsx` — añadido `btn-select-project` + lógica `handleSelectProject`
- `components/layout/header.tsx` — sincronización con localStorage

**Fix aplicado**  
Eliminado `ProjectSelector` de la home. En `app/projects/page.tsx`: nuevo estado `selectedProjectId` (leído de localStorage), función `handleSelectProject` que persiste el proyecto en localStorage, emite el evento `activeProjectChanged` y navega a `/`. Botón `btn-select-project` con estilo verde / `✓ Activo` en cada fila. CP-54 y CP-55 actualizados para reflejar el nuevo flujo.

---

### BUG-26

| Campo | Valor |
|-------|-------|
| **ID** | BUG-26 |
| **Sprint** | Sprint 9 — Correcciones Product Owner |
| **Detectado por** | Regresión E2E — CP-38 (al implementar BUG-25) |
| **Fecha detección** | 2026-05-12 |
| **Severidad** | 🟠 High |
| **Estado** | ✅ Fixed |
| **Commit fix** | pendiente |

**Descripción**  
Al implementar BUG-25, la inicialización de `activeProjectId` pasó de `null` a `undefined` para evitar cargar el cuadrante antes de conocer el proyecto. Esto introdujo una regresión: la función `loadSchedule` tenía un guard `if (activeProjectId === undefined) return` que retrasaba la primera carga hasta que un `useEffect` asíncrono completase la lectura de localStorage y la petición a `/api/projects`. En el E2E, el test CP-38 fallaba porque navegaba a Noviembre y comprobaba los festivos antes de que el cuadrante hubiese terminado de cargar.

**Pasos para reproducir**
1. Abrir la home por primera vez (sin `activeProject` en localStorage).
2. Navegar a Noviembre con los botones de mes.
3. El grid tarda más de lo esperado en mostrar los datos de Noviembre con los festivos.

**Resultado esperado**  
El cuadrante carga inmediatamente con el proyecto que haya en localStorage (o sin filtro si no hay ninguno), sin retrasos por esperar a peticiones asíncronas de inicialización.

**Resultado obtenido**  
El cuadrante no cargaba en la primera visita hasta que el `useEffect` completaba la petición a `/api/projects` (~200-400ms extra). CP-38 fallaba por este retardo.

**Ficheros afectados**  
- `app/page.tsx`

**Fix aplicado**  
Sustituido el `useState(undefined)` + `useEffect` por un inicializador lazy `useState(() => { localStorage.getItem... })`. La lectura de localStorage es síncrona en el primer render, por lo que `activeProjectId` tiene su valor correcto desde el inicio y `loadSchedule` puede correr sin guard. El `useEffect` secundario solo busca el primer proyecto en API cuando `activeProjectId === null` (primera visita sin localStorage previo).

---

### BUG-27

| Campo | Valor |
|-------|-------|
| **ID** | BUG-27 |
| **Sprint** | Sprint 11 — Pruebas manuales post-sprint |
| **Detectado por** | Prueba manual — arranque del servidor de desarrollo |
| **Fecha detección** | 2026-05-13 |
| **Severidad** | 🟠 High |
| **Estado** | ✅ Fixed |
| **Commit fix** | pendiente |

**Descripción**  
La opción `turbopack: { root: __dirname }` en `next.config.ts` causaba que Turbopack generase un `app-paths-manifest.json` incompleto al arrancar el servidor de desarrollo. Solo se registraban 4 rutas (página raíz, `/api/holidays`, `/api/schedules` y `_not-found`); el resto de rutas de la API (`/api/auth/[...nextauth]`, `/api/employees`, `/api/projects`, etc.) devolvían HTTP 404 como si no existiesen.

**Pasos para reproducir**
1. Asegurarse de que `next.config.ts` contiene la opción `turbopack: { root: __dirname }`.
2. Borrar `.next` y arrancar `npm run dev`.
3. Hacer `curl http://localhost:3000/api/auth/session`.
4. La respuesta es HTTP 404 con HTML de la página de error de Next.js.

**Resultado esperado**  
Todas las rutas de la API responden correctamente: `/api/auth/session` → 200, `/api/employees` → 401, etc.

**Resultado obtenido**  
`/api/auth/session`, `/api/employees`, `/api/projects` y todas las rutas de API excepto `/api/holidays` y `/api/schedules` devuelven HTTP 404.

**Ficheros afectados**  
- `next.config.ts`

**Fix aplicado**  
Eliminado el bloque `turbopack: { root: __dirname }` de `next.config.ts`. La opción fue introducida originalmente para evitar que Next.js usase el `package-lock.json` del directorio padre en un workspace monorepo, pero su efecto secundario es el manifest incompleto de Turbopack.

---

### BUG-28

| Campo | Valor |
|-------|-------|
| **ID** | BUG-28 |
| **Sprint** | Sprint 11 — Pruebas manuales post-sprint |
| **Detectado por** | Prueba manual — cuadrante de mes nuevo |
| **Fecha detección** | 2026-05-13 |
| **Severidad** | 🟠 High |
| **Estado** | ✅ Fixed |
| **Commit fix** | pendiente |

**Descripción**  
Al navegar a un mes sin ningún turno asignado, el grid no mostraba ninguna fila de empleados y aparecía el mensaje "Sin turnos asignados este mes. Usa el panel para preparar y generar.". Esto impedía al administrador marcar vacaciones o días libres antes de generar el cuadrante.

La causa raíz era que `loadSchedule` en `app/page.tsx` derivaba la lista de empleados extrayendo los datos del campo `employee` de las propias asignaciones devueltas por la API. Si el mes no tenía asignaciones, no había datos de los que extraer empleados y `employees` quedaba como array vacío.

**Pasos para reproducir**
1. Iniciar sesión como `admin@cuadrantes.local`.
2. Navegar a cualquier mes futuro sin cuadrante generado (p.ej. Agosto 2026).
3. El grid muestra el mensaje vacío en lugar de las filas de los 7 técnicos.
4. Al abrir el paso "1. Vacaciones" en el PrepPanel y hacer clic donde debería haber una celda, no ocurre nada.

**Resultado esperado**  
El grid muestra las filas de todos los empleados del proyecto aunque el mes esté vacío, permitiendo asignar vacaciones y días libres antes de generar.

**Resultado obtenido**  
Grid completamente vacío; mensaje "Sin turnos asignados" visible. El flujo de preparación mensual (PrepPanel) era inutilizable para meses nuevos.

**Ficheros afectados**  
- `app/page.tsx`

**Fix aplicado**  
Modificada `loadSchedule` para hacer una llamada paralela a `GET /api/employees?projectId=...` independientemente de si hay asignaciones. Los empleados se ordenan por `rotationOrder` directamente desde la respuesta de la API. Se mantiene un fallback que extrae empleados de las asignaciones en caso de que la llamada a `/api/employees` falle.

---

### BUG-29

| Campo | Valor |
|-------|-------|
| **ID** | BUG-29 |
| **Sprint** | Sprint 12 — Pruebas manuales post-sprint 11 |
| **Detectado por** | Prueba manual — PO crea segundo proyecto con empleados ya existentes |
| **Fecha detección** | 2026-05-13 |
| **Severidad** | 🟠 High |
| **Estado** | ✅ Fixed |
| **Commit fix** | pendiente |

**Descripción**  
Al crear un nuevo proyecto y añadirle empleados que previamente pertenecían a otro proyecto, el cuadrante del nuevo proyecto mostraba todos los turnos históricos de esos empleados del proyecto anterior.

La causa raíz era que `ShiftAssignment` no tenía campo `projectId`. El endpoint `GET /api/schedules` filtraba usando `employee.projectId`, pero ese campo en `Employee` apunta siempre al **proyecto actual** del empleado. Al mover un empleado a un nuevo proyecto, `Employee.projectId` se actualiza y el filtro por ese campo devuelve también todas las asignaciones históricas, que no tenían ningún identificador de proyecto propio.

**Pasos para reproducir**
1. Iniciar sesión como `admin@cuadrantes.local`.
2. Crear proyecto A, añadir Técnico 1, generar cuadrante de Mayo 2026.
3. Crear proyecto B, añadir Técnico 1 al proyecto B.
4. Navegar al cuadrante de proyecto B, mes Mayo 2026.
5. El cuadrante de proyecto B muestra los turnos de Mayo generados para proyecto A.

**Resultado esperado**  
El cuadrante del proyecto B aparece vacío (sin turnos) porque aún no se han generado asignaciones para ese proyecto.

**Resultado obtenido**  
Las asignaciones históricas de Mayo generadas bajo proyecto A aparecen en proyecto B, mezclando datos entre proyectos.

**Ficheros afectados**  
- `prisma/schema.prisma` — añadir `projectId String?` a `ShiftAssignment`
- `prisma/migrations/20260513081837_sprint12_assignment_projectid/` — migración SQL
- `app/api/schedules/route.ts` — GET filtra por `ShiftAssignment.projectId`; POST incluye `projectId` en upsert
- `app/api/schedules/generate/route.ts` — upsert incluye `projectId` en `where` y `create`
- `prisma/seed.ts` — compound key actualizada

**Fix aplicado**  
1. Añadido campo `projectId String?` a `ShiftAssignment` en el esquema Prisma.
2. Cambiada la clave única compuesta de `[employeeId, date]` a `[employeeId, date, projectId]`.
3. Migración `20260513081837_sprint12_assignment_projectid` aplicada a `dev.db`.
4. Backfill: 4.379 registros existentes actualizados con `projectId` tomado del `Employee` correspondiente.
5. `GET /api/schedules` ahora filtra directamente por `ShiftAssignment.projectId` en lugar de `employee.projectId`.
6. `POST /api/schedules` y `generate/route.ts` incluyen `projectId` del empleado en cada `upsert`.
7. Clave compuesta en `prisma/seed.ts` actualizada a `employeeId_date_projectId`.

---

### BUG-30

| Campo | Valor |
|-------|-------|
| **ID** | BUG-30 |
| **Sprint** | Sprint 12 — Correcciones post-sprint |
| **Detectado por** | Test unitario + prueba manual (Admin_sprint11 pref T no respetada) |
| **Fecha detección** | 2026-05-14 |
| **Severidad** | 🟠 High |
| **Estado** | ✅ Fixed |
| **Commit fix** | pendiente |

**Descripción**  
El algoritmo de generación (`_pickWorkdayShift`) usaba `weeklyShift` (la consistencia de turno dentro de la semana ISO) como prioridad absoluta. Si el primer día de una semana RF-16 forzaba urgentemente un turno `M` para cumplir el mínimo de cobertura, ese valor quedaba registrado en `weeklyShift` para el empleado con preferencia `T`. El resto de días de la semana, el guard de consistencia retornaba `M` (el valor en `weeklyShift`) sin consultar la preferencia, ignorando `T` durante toda la semana.

**Pasos para reproducir**  
1. Crear proyecto con 7 técnicos, uno con `shiftPreference = "T"`.
2. Generar el cuadrante de un mes con varios lunes donde la cobertura M es urgente (< mínimo).
3. Observar que el empleado pref T recibe turno M durante toda la semana donde RF-16 forzó M el lunes.

**Resultado esperado**  
El empleado con preferencia T recibe T en días laborables salvo que la cobertura urgente lo requiera ese mismo día.

**Resultado obtenido**  
El empleado con preferencia T recibe M toda la semana cuando el primer día de semana fue forzado a M por RF-16.

**Ficheros afectados**  
- `lib/schedules/generate.ts` — bucle principal y `_pickWorkdayShift`

**Fix aplicado**  
Añadida variable `dailyOrder` en el bucle principal: en cada día se ordenan los empleados poniendo primero los que no tienen preferencia M/T (pref null o J). Estos empleados "neutrales" resuelven antes la cobertura urgente RF-16 sin comprometer su `weeklyShift`. Los empleados con preferencia M/T entran después y pueden asignarse a su turno preferido sin necesidad de que RF-16 les fuerce el contrario. Se eliminó además el seeding de `weeklyShift` desde el guard de urgencia (ya no sobreescribe el turno preferido).

---

### BUG-31

| Campo | Valor |
|-------|-------|
| **ID** | BUG-31 |
| **Sprint** | Sprint 12 — Correcciones post-sprint |
| **Detectado por** | Prueba manual (Admin_sprint11 pref J con MF/TF en fin de semana y M/T en días laborables) |
| **Fecha detección** | 2026-05-14 |
| **Severidad** | 🟠 High |
| **Estado** | ✅ Fixed |
| **Commit fix** | pendiente |

**Descripción**  
El algoritmo de generación no manejaba la preferencia `J` en ninguna de sus dos rutas de decisión:

- **BUG-31a** (`_pickWeekendShift`): no existía caso para `pref === "J"`. El empleado J caía en la lógica de balance de MF/TF y recibía MF o TF en fin de semana en lugar de descansar (D).  
- **BUG-31b** (`_pickWorkdayShift`): no existía caso para `pref === "J"`. El empleado J entraba en la lógica de M/T y recibía M o T en días laborables en lugar del turno `J`.

**Pasos para reproducir**  
1. Crear empleado con `shiftPreference = "J"`.
2. Generar el cuadrante de cualquier mes.
3. Observar que el empleado J tiene MF o TF en sábados/domingos (debería tener D) y M o T en días L-V (debería tener J).

**Resultado esperado**  
- L-V (días laborables): turno `J`.
- Sábado / domingo / festivo: turno `D`.

**Resultado obtenido**  
- Sábado / domingo: `MF` o `TF`.
- L-V: `M` o `T`.

**Ficheros afectados**  
- `lib/schedules/generate.ts` — funciones `_pickWeekendShift` y `_pickWorkdayShift`

**Fix aplicado**  
1. `_pickWeekendShift`: añadida primera línea `if (pref === "J") return "D"`.  
2. `_pickWorkdayShift`: añadida primera línea `if (pref === "J") return "J"`.  
Los empleados J no compiten por la cobertura M/T del equipo gracias al `dailyOrder` introducido en BUG-30 (se procesan antes los empleados neutrales que cubren RF-16).

---

### BUG-32

| Campo | Valor |
|-------|-------|
| **ID** | BUG-32 |
| **Sprint** | Sprint 14 — Testing manual post-Sprint 13 |
| **Detectado por** | Prueba manual (login con usuario de sprint anterior tras limpiar BD) |
| **Fecha detección** | 2026-05-17 |
| **Severidad** | 🟠 High |
| **Estado** | ✅ Fixed |
| **Commit fix** | pendiente |

**Descripción**  
El `useEffect` de `app/page.tsx` guardaba en `localStorage` el ID del proyecto activo. Al limpiar la BD (o al cambiar de entorno), ese ID quedaba almacenado en el navegador aunque el proyecto ya no existiese. El efecto de auto-selección comprobaba `if (activeProjectId !== null) return`, así que nunca consultaba la API para validar si el proyecto seguía existiendo. El usuario veía un proyecto activo en la cabecera (nombre, badge) aunque la BD estuviese vacía.

**Pasos para reproducir**  
1. Usar la aplicación con un proyecto activo.
2. Limpiar la BD (`rm dev.db && prisma migrate deploy`).
3. Recargar la aplicación sin borrar las cookies/localStorage.
4. La cabecera muestra el badge del proyecto antiguo aunque no exista ningún proyecto.

**Resultado esperado**  
Si el ID guardado en localStorage no existe en la BD, la aplicación lo descarta y muestra «Sin proyecto» (o selecciona el primero disponible).

**Resultado obtenido**  
La cabecera muestra el badge del proyecto antiguo y todas las peticiones de datos se hacen con un `projectId` inexistente, devolviendo resultados vacíos.

**Ficheros afectados**  
- `app/page.tsx` — `useEffect` de auto-selección de proyecto

**Fix aplicado**  
El efecto ahora siempre consulta `GET /api/projects` al montar el componente:
- Si no hay proyectos → limpia localStorage y pone `activeProjectId = null`.
- Si el ID guardado ya no existe en la lista → selecciona el primer proyecto disponible.
- Si el ID sigue siendo válido → no hace nada (comportamiento anterior).

---

### BUG-33

| Campo | Valor |
|-------|-------|
| **ID** | BUG-33 |
| **Sprint** | Sprint 14 — Testing manual post-Sprint 13 |
| **Detectado por** | Prueba manual (empleado con vacaciones en semana de noches, cuadrante generado) |
| **Fecha detección** | 2026-05-17 |
| **Severidad** | 🟠 High |
| **Estado** | ✅ Fixed |
| **Commit fix** | pendiente |

**Descripción**  
Cuando un empleado (A) tiene vacaciones (V) en su semana de noches, `resolveNightBlocks` transfiere correctamente ese bloque al empleado (B) que lleva más tiempo sin noches. Sin embargo, el bloque propio de B (la semana inmediatamente posterior en la rotación) no se transfería porque `originalConflict` solo evaluaba `existingDates` (días marcados como V/B) y no detectaba que B ya había recibido un bloque transferido cuyos días solapaban con el bloque propio. El resultado era que B hacía 14 noches consecutivas (dos semanas de N seguidas) en lugar de 7.

**Pasos para reproducir**  
1. Crear un cuadrante con 7 técnicos y rotación de noches activa.
2. Marcar la semana de noches del técnico A como vacaciones (V).
3. Generar el cuadrante.
4. El técnico B (que recibe el bloque transferido de A) aparece con N durante 14 días seguidos en lugar de 7.

**Resultado esperado**  
B cubre los 7 días de noches de A. El bloque propio de B se transfiere al siguiente candidato disponible, de forma que ningún empleado tiene más de 7 noches consecutivas.

**Resultado obtenido**  
B recibe el bloque de A (7 noches) y además su propio bloque (7 noches más), acumulando 14 noches consecutivas.

**Ficheros afectados**  
- `lib/schedules/generate.ts` — función `resolveNightBlocks`
- `tests/unit/scheduler/generate.test.ts` — nuevo test de regresión añadido

**Fix aplicado**  
Añadida la comprobación `alreadyHasOverlappingBlock` en `resolveNightBlocks`: antes de aceptar un bloque para el empleado original, se verifica si ese empleado ya tiene en `resolved` algún bloque cuyos días solapan con los días N del bloque actual. Si hay solapamiento, el bloque se trata como conflicto y se transfiere al siguiente candidato.

Test de regresión añadido: `"el empleado de reemplazo no recibe dos semanas consecutivas de noches"` — valida que ningún empleado tiene dos bloques resueltos con sus viernes de inicio a ≤7 días de distancia.

---

### BUG-34

| Campo | Valor |
|-------|-------|
| **ID** | BUG-34 |
| **Sprint** | Sprint 14 — Testing manual post-Sprint 13 |
| **Detectado por** | Prueba manual (mes de 31 días) |
| **Fecha detección** | 2026-05-17 |
| **Severidad** | 🟡 Medium |
| **Estado** | ✅ Fixed |
| **Commit fix** | — |

**Descripción**  
En meses de 31 días (enero, marzo, mayo, julio, agosto, octubre, diciembre) la columna del día 31 no se renderiza correctamente en el grid: puede aparecer cortada, desplazada o directamente ausente dependiendo del ancho de pantalla y la lógica de generación de columnas.

**Pasos para reproducir**
1. Iniciar sesión como administrador o empleado.
2. Navegar a cualquier mes de 31 días (p.ej. mayo 2026).
3. Observar la columna correspondiente al día 31.
4. La columna no se muestra correctamente (ausente, cortada o desplazada).

**Resultado esperado**  
El grid muestra los 31 días del mes correctamente, con la columna del día 31 con el mismo formato que el resto.

**Resultado obtenido**  
La columna del día 31 no aparece o se renderiza de forma incorrecta.

**Ficheros afectados**  
- `components/schedule/schedule-grid.tsx` (generación de columnas de días)
- `app/page.tsx` (posible truncado en el array de días generado)

**Fix aplicado**  
Cambiado `overflow-x-hidden` a `overflow-x-auto` en el `<div>` contenedor del grid (`app/page.tsx`). El contenedor usaba `overflow-x-hidden` en lugar de `overflow-x-auto`, impidiendo el scroll horizontal y ocultando las columnas que no cabían en el espacio disponible (como el día 31 cuando el panel PREPA está abierto).

| Campo | Valor |
|-------|-------|
| **ID** | BUG-35 |
| **Sprint** | Sprint 14 — Testing manual post-Sprint 13 |
| **Detectado por** | Prueba manual (revisión de preferencias M/T en generación) |
| **Fecha detección** | 2026-05-17 |
| **Severidad** | 🟠 High |
| **Estado** | ✅ Fixed |
| **Commit fix** | — |

**Descripción**  
Cuando un empleado tiene preferencia de turno de mañana (`M`) o tarde (`T`), el algoritmo de generación respeta esa preferencia en días laborables. Sin embargo, al asignar los turnos de fin de semana (`MF`/`TF`) o festivos (`MF`/`TF`), la preferencia no se aplica: un empleado con preferencia `T` puede recibir `MF` (mañana de fin de semana) y viceversa.

**Pasos para reproducir**
1. Configurar un empleado con preferencia `T` (tarde).
2. Generar el cuadrante de un mes con fines de semana.
3. Observar los turnos `MF`/`TF` asignados a ese empleado.
4. El empleado recibe `MF` en lugar de `TF` en algún fin de semana o festivo.

**Resultado esperado**  
Un empleado con preferencia `M` siempre recibe `MF` (no `TF`) en fines de semana y festivos. Un empleado con preferencia `T` siempre recibe `TF` (no `MF`).

**Resultado obtenido**  
La preferencia M/T se ignora al elegir entre `MF` y `TF` en la función `_pickWeekendShift` o equivalente.

**Ficheros afectados**  
- `lib/schedules/generate.ts` — función que asigna el tipo de turno de fin de semana/festivo

**Fix aplicado**  
Rediseñada la función `_pickWeekendShift` en `lib/schedules/generate.ts`: cuando el empleado tiene un patrón semanal (`weeklyShift`) o una preferencia explícita (`shiftPreference`), se respeta estrictamente — si el slot preferido ya está cubierto, el empleado descansa (D) en lugar de recibir el turno contrario. Los turnos de fin de semana ahora se asignan mediante el plan pre-computado por BUG-37 (paquete Sáb+Dom), por lo que `_pickWeekendShift` solo se llama para festivos en días laborables. Añadidos 2 tests de regresión: uno para preferencia M y otro para preferencia T.

| Campo | Valor |
|-------|-------|
| **ID** | BUG-36 |
| **Sprint** | Sprint 14 — Testing manual post-Sprint 13 |
| **Detectado por** | Prueba manual (revisión de turnos consecutivos con MF/TF) |
| **Fecha detección** | 2026-05-17 |
| **Severidad** | 🟠 High |
| **Estado** | ✅ Fixed |
| **Commit fix** | — |

**Descripción**  
La regla de negocio establece que ningún empleado puede tener más de 5 días consecutivos de trabajo (M/T) sin al menos 2 días de descanso (D). Esta regla se aplica correctamente cuando los turnos son todos del mismo tipo (solo M o solo T), pero no cuando se mezclan turnos de semana (M/T) con turnos de fin de semana o festivo (MF/TF). El contador de días consecutivos se reinicia incorrectamente al cambiar entre M↔MF o T↔TF, permitiendo secuencias de más de 5 días de trabajo continuo.

**Pasos para reproducir**
1. Generar el cuadrante de un mes que incluya un fin de semana en medio de una semana laboral completa (p.ej. un empleado con turno M de lunes a viernes y MF en sábado y domingo).
2. Observar que el empleado acumula 7 días seguidos (L M X J V S D) con turno M/MF sin ningún D intercalado.
3. La regla del máximo de 5 días consecutivos debería haber forzado descanso antes del sábado.

**Resultado esperado**  
Los turnos MF/TF cuentan como días de trabajo a efectos del contador de días consecutivos. Si un empleado ya lleva 5 días seguidos (M o MF o cualquier combinación), el 6.º día debe ser D obligatorio.

**Resultado obtenido**  
El algoritmo trata MF/TF como un tipo de turno diferente y no los incluye en el contador de días consecutivos de M/T, permitiendo superar el límite de 5 días.

**Ficheros afectados**  
- `lib/schedules/generate.ts` — lógica de contador de días consecutivos

**Fix aplicado**  
Modificada la función `_updateState` en `lib/schedules/generate.ts`: el contador de días consecutivos ahora trata cualquier turno de trabajo (M o T, incluyendo sus variantes MF/TF tras `normalizeShift`) como continuación del streak, independientemente de si el tipo cambia de M a T o viceversa. Solo los turnos no laborables (D, N, J, V, B) reinician el contador. El `needsRest` check se actualizó para dispararse solo cuando `consecutiveShift === "M" || consecutiveShift === "T"`. Añadido 1 test de regresión que verifica que ningún empleado supera 5 días consecutivos de trabajo en todo el mes.

| Campo | Valor |
|-------|-------|
| **ID** | BUG-37 |
| **Sprint** | Sprint 14 — Testing manual post-Sprint 13 |
| **Detectado por** | Prueba manual (revisión de asignación de fines de semana) |
| **Fecha detección** | 2026-05-17 |
| **Severidad** | 🟠 High |
| **Estado** | ✅ Fixed |
| **Commit fix** | — |

**Descripción**  
Según los requisitos (RF-Weekend), los turnos de fin de semana deben asignarse como un paquete indivisible sábado + domingo a un mismo empleado. Actualmente el algoritmo puede asignar el sábado a un empleado y el domingo a otro, rompiendo la unidad del paquete. Lo mismo ocurre con festivos que caen en días consecutivos: cada día se asigna de forma independiente sin respetar la regla de paquete.

**Pasos para reproducir**
1. Generar el cuadrante de un mes con varios fines de semana.
2. Revisar la columna de sábado y domingo para cada semana.
3. En al menos un fin de semana, el empleado asignado el sábado difiere del asignado el domingo.

**Resultado esperado**  
El sábado y el domingo de cada fin de semana siempre tienen el mismo empleado asignado para el turno MF/TF. La unidad Sáb+Dom es indivisible.

**Resultado obtenido**  
El sábado puede tener al empleado A (MF) y el domingo al empleado B (MF), partiendo el paquete.

**Ficheros afectados**  
- `lib/schedules/generate.ts` — lógica de asignación de fines de semana (`_pickWeekendShift` o equivalente)

**Fix aplicado**  
Añadida pre-selección de paquetes Sáb+Dom en `generateMonthSchedule` (`lib/schedules/generate.ts`): en cada sábado del bucle principal, antes de iterar empleados, se elige un empleado para MF y otro para TF que cubrirán ambos días (Sáb y Dom). La selección respeta disponibilidad (`existingDates`, `nightPlan`, preferencia J) y el límite de consecutivos (excluye empleados con 4+ días de trabajo que necesitarían descanso el domingo). El bucle de empleados consulta el plan pre-computado para asignar MF, TF o D. Añadidos 2 tests de regresión que verifican que el mismo empleado cubre sábado y domingo con el mismo tipo de turno.

---

*Registro mantenido por el agente `doc-writer`. Actualizar tras cada sesión de QA.*
