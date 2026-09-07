# Sprint 2 — Release Notes
**Proyecto:** Gestor de Cuadrantes  
**Versión:** 0.2.0  
**Fecha:** Mayo 2026  
**Estado:** En desarrollo

---

## Objetivo del Sprint

Reemplazar los datos mock por datos reales persistidos en base de datos, habilitar la edición de turnos para administradores y añadir la gestión básica de empleados.

---

## Requisitos implementados

### Funcionales
| ID | Requisito | Estado |
|----|-----------|--------|
| RF-10 | API `GET /api/schedules?year=&month=` devuelve los turnos del mes desde BD | ⏳ |
| RF-11 | El grid muestra datos reales — no mock | ⏳ |
| RF-12 | Si no hay datos para el mes, el grid aparece vacío (sin aviso "Vista de ejemplo") | ⏳ |
| RF-13 | Admin puede hacer clic en una celda para asignar o cambiar el turno | ⏳ |
| RF-14 | API `POST /api/schedules` crea o actualiza un turno (solo ADMIN) | ⏳ |
| RF-15 | API `DELETE /api/schedules/:id` elimina un turno (solo ADMIN) | ⏳ |
| RF-16 | Listado de empleados en `/employees` (nombre, email, rol) | ⏳ |
| RF-17 | Admin puede crear un nuevo empleado desde `/employees` | ⏳ |
| RF-18 | Admin puede editar nombre y rol de un empleado | ⏳ |
| RF-19 | Empleados tipo EMPLOYEE no pueden acceder a `/employees` | ⏳ |

### No Funcionales
| ID | Requisito | Estado |
|----|-----------|--------|
| RNF-06 | Las APIs de escritura validan el rol en el servidor (no solo en UI) | ⏳ |
| RNF-07 | Tests unitarios Vitest para toda la lógica de negocio nueva | ⏳ |
| RNF-08 | Tests E2E Playwright para los flujos de usuario nuevos (CP-12 a CP-22) | ⏳ |
| RNF-09 | Ninguna contraseña ni secret en el código fuente | ⏳ |

---

## Funcionalidades a entregar

### API del cuadrante
- `GET /api/schedules?year=YYYY&month=M` — devuelve `ShiftAssignment[]` del mes
- `POST /api/schedules` — body: `{ employeeId, day, shiftType }` — crea o actualiza
- `DELETE /api/schedules/:id` — elimina la asignación
- Autorización: POST y DELETE requieren rol `ADMIN` (verificado en servidor con `getServerSession`)

### Vista del cuadrante con datos reales
- `app/page.tsx` deja de usar `MOCK_ASSIGNMENTS` y consume `GET /api/schedules`
- Indicador de carga mientras se obtienen datos
- Mensaje "Sin turnos asignados" si el mes está vacío
- Se elimina el aviso "Vista de ejemplo"

### Editor de turnos (ADMIN)
- Clic en celda del grid abre un modal/popover con selector de turno (M/T/N/J/D/V/B)
- Guardar llama a `POST /api/schedules` y actualiza el grid en tiempo real
- Opción "Limpiar celda" llama a `DELETE /api/schedules/:id`
- Solo visible para usuarios con rol `ADMIN`

### Gestión de empleados
- Ruta `/employees` — protegida: solo ADMIN
- Listado en tabla con nombre, email y rol
- Formulario de alta: nombre, email, contraseña, rol
- Formulario de edición: nombre y rol (no email ni contraseña)

---

## Limitaciones conocidas (fuera de scope Sprint 2)

- No hay generación automática de cuadrantes
- No hay historial de cambios / auditoría
- No hay exportación a PDF/Excel
- La edición de contraseñas de empleados queda para Sprint 3
- Los turnos de fin de semana especiales (MF/TF/NF) no se exponen en el selector de Sprint 2

---

## Credenciales de prueba

Mismas que Sprint 1 (no cambian):

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@cuadrantes.local | Admin1234! |
| Técnico | tecnico1@cuadrantes.local | Tecnico1234! |

---

## Casos de prueba para QA

### CP-12 — Grid carga datos reales de BD
1. Sembrar la BD con turnos para Mayo 2026 (`npm run db:seed`)
2. Acceder a `/` autenticado
3. **Resultado esperado:** El grid muestra los turnos de BD, no el mock; no aparece "Vista de ejemplo"

### CP-13 — Mes sin datos muestra grid vacío
1. Navegar a un mes sin turnos asignados (ej. Junio 2026)
2. **Resultado esperado:** Grid con celdas vacías y mensaje "Sin turnos asignados este mes"

### CP-14 — Admin puede asignar un turno
1. Acceder como admin, hacer clic en una celda vacía del grid
2. Seleccionar tipo de turno "M" y guardar
3. **Resultado esperado:** La celda se actualiza con el color naranja del turno M

### CP-15 — Admin puede cambiar un turno existente
1. Hacer clic en una celda que ya tiene turno asignado
2. Seleccionar otro tipo y guardar
3. **Resultado esperado:** La celda actualiza su color y código inmediatamente

### CP-16 — Admin puede eliminar un turno
1. Hacer clic en una celda con turno asignado, seleccionar "Limpiar"
2. **Resultado esperado:** La celda queda vacía

### CP-17 — Empleado no puede editar turnos
1. Acceder como `tecnico1`, hacer clic en una celda del grid
2. **Resultado esperado:** No aparece el modal/selector de turno; las celdas no son clicables

### CP-18 — API rechaza escritura sin rol ADMIN
1. Hacer `POST /api/schedules` con token JWT de técnico
2. **Resultado esperado:** Respuesta `403 Forbidden`

### CP-19 — Listado de empleados visible para ADMIN
1. Acceder como admin a `/employees`
2. **Resultado esperado:** Tabla con los 8 empleados del seed (nombre, email, rol)

### CP-20 — Empleado no puede acceder a `/employees`
1. Acceder como técnico a `/employees`
2. **Resultado esperado:** Redirige a `/` (o muestra 403)

### CP-21 — Admin puede crear un empleado
1. En `/employees`, rellenar el formulario con nombre, email, contraseña y rol
2. **Resultado esperado:** El empleado aparece en la tabla; puede hacer login con sus credenciales

### CP-22 — Admin puede editar un empleado
1. En `/employees`, pulsar Editar en un empleado, cambiar nombre o rol
2. **Resultado esperado:** La tabla refleja los cambios

---

## Entorno de pruebas

```
URL:        http://localhost:3000
Node.js:    v24.x
Next.js:    16.2.6
BD:         SQLite (dev.db en raíz del proyecto)
```

Para levantar el entorno:
```bash
cd gestor-cuadrantes
cp .env.example .env   # si es la primera vez
npm install
npm run db:seed
npm run dev
```

Para ejecutar los tests:
```bash
npm run test:unit      # Vitest — lógica y APIs
npm run test:e2e       # Playwright — flujos de usuario
```
