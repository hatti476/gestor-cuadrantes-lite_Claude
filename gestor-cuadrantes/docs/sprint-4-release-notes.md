# Sprint 4 — Release Notes
**Proyecto:** Gestor de Cuadrantes  
**Versión:** 0.4.0  
**Fecha:** Mayo 2026  
**Estado:** Entregado ✅

---

## Objetivo del Sprint

Incorporar gestión de festivos, exportación CSV, historial de cambios de turno y notificaciones de feedback consistentes en toda la aplicación.

---

## Requisitos implementados

### Funcionales
| ID | Requisito | Estado |
|----|-----------|--------|
| RF-26 | CRUD de festivos: el admin puede crear, listar y eliminar días festivos por año | ✅ |
| RF-27 | La generación automática asigna MF/TF en días festivos (M→MF, T→TF) y NF si el día siguiente al turno de noche es festivo (N→NF) | ✅ |
| RF-28 | Botón "Exportar CSV" descarga el cuadrante del mes activo como fichero .csv | ✅ |
| RF-29 | Historial de cambios: cada modificación manual de turno queda registrada (quién, qué, cuándo) | ✅ |
| RF-30 | Vista de historial por empleado (últimos 20 cambios) accesible desde `/employees` | ✅ |
| RF-31 | Al añadir un festivo, las asignaciones existentes del día se actualizan automáticamente (M→MF, T→TF) | ✅ |
| RF-32 | Al añadir un festivo, el turno N del día anterior se convierte automáticamente en NF | ✅ |
| RF-33 | El grid resalta visualmente los días festivos con fondo rojo en la cabecera, manteniendo la letra del día de la semana | ✅ |
| RF-34 | Al pulsar sobre la cabecera de un día festivo, se muestra un popover con el nombre del festivo; se cierra al hacer clic fuera | ✅ |

### No Funcionales
| ID | Requisito | Estado |
|----|-----------|--------|
| RNF-14 | Notificaciones toast globales (éxito/error) sustituyen los mensajes inline heterogéneos | ✅ |
| RNF-15 | Tests unitarios para lógica de festivos en la generación | ✅ |
| RNF-16 | Tests E2E Playwright para los flujos nuevos (CP-30 a CP-38) | ✅ |
| RNF-17 | El contador del grid se carga en paralelo con el cuadrante sin bloquear la UI | ✅ |

---

## Funcionalidades a entregar

### Gestión de festivos
- Modelo `Holiday` en Prisma: `{ id, date, description, year }`
- Página `/holidays` (solo ADMIN): tabla de festivos del año seleccionado + formulario de alta
- API `GET/POST /api/holidays` y `DELETE /api/holidays/[id]`
- **Al añadir un festivo**, las asignaciones ya existentes en BD se actualizan de inmediato:
  - Mismo día: `M→MF`, `T→TF`
  - Día anterior: `N→NF` (el turno de noche de 23:00–07:00 termina en el festivo)
- **Al generar el cuadrante**, la lógica de asignación aplica las mismas reglas:
  - `M→MF`, `T→TF` si el propio día es festivo
  - `N→NF` si el día **siguiente** al turno es festivo
  - `D` (descanso) no cambia en ningún caso
- Los días festivos se muestran con **cabecera roja** en el grid; la letra del día de la semana (L, M, X…) se mantiene visible
- Al pulsar sobre la cabecera de un día festivo aparece un **popover** con el nombre del festivo; se cierra haciendo clic fuera o volviendo a pulsar el mismo día

### Exportación CSV
- Botón "Exportar CSV" en la cabecera del cuadrante (junto a "Imprimir")
- Genera un archivo `cuadrante-YYYY-MM.csv` con columnas: `Empleado, Día 1, Día 2, ..., Día N`
- Implementado en el cliente con `Blob` + `URL.createObjectURL` — sin dependencias externas

### Historial de cambios
- Modelo `ShiftChangeLog` en Prisma: `{ id, employeeId, date, oldShift, newShift, changedBy, changedAt }`
- Cada `PATCH /api/shifts/[id]` y asignación nueva registra un log
- Página `/employees/[id]/history`: tabla con los últimos 20 cambios del empleado
- API `GET /api/employees/[id]/history`

### Notificaciones toast
- Componente `<Toast>` global en `app/layout.tsx` — contexto React con `useToast()`
- Reemplaza todos los `alert()`, mensajes de estado inline y `console.error` visibles al usuario
- Variantes: `success` (verde), `error` (rojo), `info` (azul) — auto-desaparece a los 4 s

---

## Limitaciones conocidas (fuera de scope Sprint 4)

- Los festivos son nacionales (un solo calendario), no hay festivos por comunidad/región
- No hay notificaciones por email ni push
- El historial no permite revertir cambios (solo lectura)
- No hay paginación en el historial (máximo 20 registros mostrados)

---

## Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@cuadrantes.local | Admin1234! |
| Técnico | tecnico1@cuadrantes.local | Tecnico1234! |

---

## Casos de prueba para QA

### CP-30 — Admin puede añadir un festivo y los turnos se actualizan
1. Ir a `/holidays`
2. Introducir fecha y descripción del festivo y pulsar "Añadir"
3. **Resultado esperado:** El festivo aparece en la tabla; los turnos M y T de ese día en BD pasan a MF y TF; el turno N del día anterior pasa a NF — sin necesidad de regenerar el cuadrante

### CP-31 — Admin puede eliminar un festivo
1. En `/holidays`, pulsar "Eliminar" en un festivo existente
2. **Resultado esperado:** El festivo desaparece de la tabla

### CP-32 — La generación respeta la lógica de festivos
1. Añadir un festivo en un día concreto del mes próximo
2. Generar el cuadrante de ese mes
3. **Resultado esperado:**
   - Empleados con turno M ese día → MF; con T → TF
   - Empleados con turno N el día anterior → NF (turno que termina en el festivo)
   - Empleados con turno D → D (sin cambio)

### CP-33 — Exportar CSV descarga el fichero correcto
1. Con el cuadrante de Mayo 2026 cargado, pulsar "Exportar CSV"
2. **Resultado esperado:** Se descarga `cuadrante-2026-05.csv` con los empleados y sus turnos

### CP-34 — Historial registra cambios de turno
1. Como admin, cambiar el turno de un empleado en el cuadrante
2. Ir a `/employees` → historial del empleado
3. **Resultado esperado:** La tabla muestra el cambio: turno anterior, nuevo turno, fecha y usuario que cambió

### CP-35 — Solo el admin ve el historial
1. Iniciar sesión como técnico
2. Intentar acceder a `/employees/[id]/history`
3. **Resultado esperado:** Redirección a `/login` o respuesta 403

### CP-36 — Las notificaciones toast aparecen y desaparecen
1. Como admin, realizar cualquier acción que devuelva éxito (ej. generar cuadrante)
2. **Resultado esperado:** Aparece un toast verde con mensaje de éxito; desaparece automáticamente en ~4 s

### CP-37 — El turno N de la víspera de un festivo se convierte en NF
1. Con un cuadrante generado, añadir un festivo en un día que tenga al menos un empleado con turno N el día anterior
2. **Resultado esperado:** El turno N del día anterior pasa a NF inmediatamente en el grid

### CP-38 — El grid muestra los días festivos con cabecera roja
1. Con un festivo registrado, abrir el cuadrante del mes correspondiente
2. **Resultado esperado:** La columna del día festivo tiene fondo rojo; la letra del día de la semana sigue visible (L, M, X…)

### CP-39 — Pulsar la cabecera de un festivo muestra su nombre
1. En el cuadrante, pulsar sobre la cabecera roja de un día festivo
2. **Resultado esperado:** Aparece un popover con el nombre del festivo (ej. "Día de la Constitución")
3. Pulsar fuera del popover
4. **Resultado esperado:** El popover se cierra

---

## Entorno de pruebas

```
URL:        http://localhost:3000
Node.js:    v24.x
Next.js:    16.2.6
BD:         SQLite (dev.db en raíz del proyecto)
```
