# Bug Registry — Gestor de Cuadrantes

**Proyecto:** Gestor de Cuadrantes  
**Mantenido por:** Agente `doc-writer`  
**Última actualización:** 2026-05-10  

---

## Resumen

| Total bugs | Críticos | Altos | Medios | Bajos | Abiertos | Resueltos |
|-----------|----------|-------|--------|-------|----------|-----------|
| 13 | 0 | 5 | 5 | 3 | 0 | 13 |

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
