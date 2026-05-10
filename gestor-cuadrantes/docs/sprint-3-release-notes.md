# Sprint 3 — Release Notes
**Proyecto:** Gestor de Cuadrantes  
**Versión:** 0.3.0  
**Fecha:** Mayo 2026  
**Estado:** Entregado ✅

---

## Objetivo del Sprint

Añadir generación automática del cuadrante por rotación, exportación a PDF, turnos especiales de fin de semana en el selector y cambio de contraseña de empleados.

---

## Requisitos implementados

### Funcionales
| ID | Requisito | Estado |
|----|-----------|--------|
| RF-20 | Admin puede cambiar la contraseña de un empleado desde `/employees` | ✅ |
| RF-21 | El selector de turnos (ShiftEditor) incluye MF, TF y NF (10 tipos totales) | ✅ |
| RF-22 | Admin puede generar automáticamente el cuadrante del mes con un click | ✅ |
| RF-23 | La generación respeta turnos ya asignados manualmente (no los sobreescribe) | ✅ |
| RF-24 | Botón "Exportar PDF" imprime el cuadrante sin los controles de navegación | ✅ |
| RF-25 | El contador de turnos por empleado incluye los tipos MF, TF y NF | ✅ |

### No Funcionales
| ID | Requisito | Estado |
|----|-----------|--------|
| RNF-10 | Tests unitarios Vitest para la lógica de generación automática | ✅ |
| RNF-11 | Tests unitarios para validación de cambio de contraseña | ✅ |
| RNF-12 | Tests E2E Playwright para los flujos nuevos (CP-23 a CP-28) | ✅ |
| RNF-13 | El contador del grid refleja todos los tipos de turno incluidos los festivos | ✅ |

---

## Funcionalidades a entregar

### Cambio de contraseña (admin)
- Botón "Clave" en la tabla de empleados
- Modal con campo `nueva contraseña` + `confirmar contraseña`
- `PATCH /api/employees/[id]/password` — solo ADMIN
- Validación: mínimo 8 chars, al menos 1 mayúscula y 1 dígito
- bcrypt cost 12

### Turnos especiales en el selector y contadores
- `ShiftEditor` muestra ahora 10 tipos: M, T, N, J, D, V, B, MF, TF, NF
- MF = Mañana Festivo (naranja claro), TF = Tarde Festivo (azul claro), NF = Noche Festivo (verde claro)
- El contador de turnos al final de cada fila del grid muestra también MF, TF y NF (corrección post-entrega inicial)

### Generación automática de cuadrante
- `POST /api/schedules/generate` — body: `{ year, month }` — solo ADMIN
- Algoritmo: patrón cíclico de 21 días (`M×5, D×2, T×5, D×2, N×5, D×2`)
- Offset por empleado: `(dayOfEpoch + rotationOrder × 3) % 21`
- Solo crea asignaciones para días sin turno asignado (respeta los manuales)
- Retorna `{ created: number }` con los turnos insertados

### Exportación a PDF
- Botón "Imprimir" en la cabecera del cuadrante
- Estilos `@media print`: oculta header, botones y controles; el grid ocupa el 100% de la página
- Sin dependencias externas — usa `window.print()` del navegador

---

## Limitaciones conocidas (fuera de scope Sprint 3)

- No hay historial de cambios / auditoría
- No hay exportación a Excel / CSV
- El algoritmo de generación usa rotación fija; no considera festivos ni vacaciones
- No hay UI para configurar el patrón de rotación

---

## Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@cuadrantes.local | Admin1234! |
| Técnico | tecnico1@cuadrantes.local | Tecnico1234! |

---

## Casos de prueba para QA

### CP-23 — Admin puede cambiar la contraseña de un empleado
1. En `/employees`, pulsar "Clave" en cualquier empleado
2. Introducir nueva contraseña válida y confirmarla
3. **Resultado esperado:** Mensaje de éxito; el empleado puede hacer login con la nueva contraseña

### CP-24 — Cambio de contraseña valida requisitos
1. En el modal de cambio de contraseña, introducir una contraseña débil (< 8 chars)
2. **Resultado esperado:** Mensaje de error visible; no se envía la petición

### CP-25 — Turnos MF/TF/NF disponibles en el selector
1. Como admin, hacer clic en una celda del grid para abrir ShiftEditor
2. **Resultado esperado:** El modal muestra los 10 tipos de turno (M, T, N, J, D, V, B, MF, TF, NF)

### CP-26 — Admin puede generar el cuadrante automáticamente
1. Navegar a un mes sin turnos (ej. Junio 2026)
2. Pulsar "Generar cuadrante"
3. **Resultado esperado:** El grid se rellena con turnos para todos los empleados

### CP-27 — La generación no sobreescribe turnos manuales
1. En Junio 2026, asignar manualmente un turno en una celda
2. Pulsar "Generar cuadrante"
3. **Resultado esperado:** El turno manual permanece; el resto se rellena automáticamente

### CP-28 — Botón "Imprimir" abre el diálogo del navegador
1. En el cuadrante cargado, pulsar "Imprimir"
2. **Resultado esperado:** Se abre el diálogo de impresión del sistema (o se llama a `window.print()`)

### CP-29 — El contador muestra MF, TF y NF
1. Como admin, asignar turnos MF, TF y NF a un empleado en el cuadrante
2. **Resultado esperado:** La columna "Contadores" al final de la fila muestra las etiquetas MF:n, TF:n, NF:n con sus colores correspondientes

---

## Entorno de pruebas

```
URL:        http://localhost:3000
Node.js:    v24.x
Next.js:    16.2.6
BD:         SQLite (dev.db en raíz del proyecto)
```
