# Sprint 17 — Release Notes

**Fecha**: 19/05/2026  
**Versión**: 1.7  
**Rama**: `feature/sprint-17-algorithm-fixes-ii`  
**Estado**: ✅ Completado

---

## Resumen ejecutivo

Sprint 17 cierra tres correcciones críticas del algoritmo de generación de cuadrantes que afectaban a la continuidad del turno de noches entre meses, al descanso forzado tras acumulación de jornadas diurnas y al cálculo del paquete extendido de fin de semana cuando el lunes es festivo.

Se añade además el campo `coverageWarnings` a la respuesta de la API de generación, cobertura E2E CP-110..CP-115 y 8 tests unitarios nuevos.

---

## Objetivos cerrados

| Objetivo | Estado |
|----------|--------|
| Tarea 1: Descanso forzado HARD (2D) tras ≥5 M/T consecutivos cross-month | ✅ |
| Tarea 1: `coverageWarnings` en respuesta de API de generación | ✅ |
| Tarea 2: Continuidad cross-month del bloque nocturno (mid-block y post-rest) | ✅ |
| Tarea 3: Paquete extendido Sáb+Dom+Lun festivo con mismo par de empleados | ✅ |
| 8 tests unitarios nuevos (Tareas 1-3) — 87/87 pasando | ✅ |
| E2E CP-110..CP-115 | ✅ |

---

## Cambios realizados

### Tarea 1 — Descanso forzado HARD y `coverageWarnings`

**Archivos modificados**:

- `lib/schedules/generate.ts`
- `app/api/schedules/generate/route.ts`

**Descripción**:

El algoritmo ahora aplica un descanso forzado HARD de 2 días (D) cuando un empleado acumula ≥5 turnos diurnos consecutivos (M o T) cruzando la frontera de fin de mes. Este descanso no puede ser convertido a turno de trabajo por la fase de reparación de cobertura.

Cuando este descanso forzado cae en un día laborable (lunes-viernes) y deja alguna cobertura M/T por debajo del mínimo, el algoritmo emite una `CoverageWarning` con la fecha, el `employeeId` del empleado forzado a descansar y un mensaje descriptivo.

El campo `coverageWarnings: CoverageWarning[]` se incluye ahora en la respuesta de `POST /api/schedules/generate`, permitiendo a la interfaz alertar al responsable del cuadrante de que puede ser necesaria una revisión manual.

**Fix técnico clave** — `trailingPostRestD >= 2 && trailingPostRestD < 3`:

La detección de continuidad de post-descanso nocturno en el inicio del nuevo mes requería que el empleado hubiera terminado el mes anterior con ≥2 días D tras las noches (no solo 1) para desambiguar el caso de un único D de interrupción de bloque frente al D de post-descanso real.

---

### Tarea 2 — Continuidad cross-month del bloque nocturno

**Archivo modificado**: `lib/schedules/generate.ts`

**Descripción**:

El algoritmo detecta empleados que terminaron el mes anterior a mitad de un bloque nocturno (1–6 noches) y los completa al inicio del nuevo mes con las noches restantes, seguidas de 3 días de post-descanso (D).

Si el empleado terminó el mes anterior con el bloque completo (7 noches), recibe directamente los 3 días D de post-descanso al inicio del nuevo mes.

Si el empleado terminó con 2 días D (post-descanso iniciado al final del mes anterior), recibe el D restante al inicio del nuevo mes.

**Fix técnico clave** — `crossMonthRestDates` y pre-seed de `forcedRestDates`:

Los días D de post-descanso que el algoritmo TAREA 2 añade al `nightPlan` al inicio del mes se registran ahora también en `crossMonthRestDates`, que pre-inicializa `forcedRestDates`. Esto garantiza que la fase de reparación en modo relajado (`allowNightPlanRest: true`) no pueda convertir esos días D a turnos de trabajo, preservando el descanso obligatorio post-bloque.

Sin este fix, el reparador relajado convertía el tercer día de post-descanso a M cuando la cobertura era baja, incumpliendo la norma de 3 días de descanso tras el bloque nocturno.

---

### Tarea 3 — Paquete extendido Sáb+Dom+Lun festivo

**Archivo modificado**: `lib/schedules/generate.ts`

**Descripción**:

Cuando el lunes inmediatamente siguiente a un domingo forma parte de un festivo configurado, el paquete de fin de semana (normalmente Sáb+Dom) se extiende a un paquete de 3 días (Sáb+Dom+Lun). El mismo par de empleados (uno para MF, otro para TF) cubre los tres días del paquete extendido.

El lunes festivo recibe `MF`/`TF` en lugar de `M`/`T`, igual que el sábado y el domingo del paquete.

**Fix técnico clave** — exclusión de fines de semana de `forcedRestDates` (Priority 2):

Los días de descanso forzado caídos en fin de semana o festivo se registraban incorrectamente en `forcedRestDates`, impidiendo que el planificador de paquetes de fin de semana pudiera reasignar esas celdas. La corrección excluye los días no laborables (`isWeekend || holidayDates.has`) del registro en `forcedRestDates`, permitiendo que los paquetes extendidos operen correctamente.

**Fix técnico clave** — comprobación de fixabilidad del aislamiento D en `canRepairCoverageWithShift`:

Se añade un guard que impide reparar un turno si convertirlo crearía un único D aislado entre dos bloques de trabajo en el caso en que el D aislado caiga en el día previo a un fin de semana o festivo de paquete corto (< 2 días). Esto evita violaciones del descanso mínimo entre bloques diurnos al reparar cobertura.

---

## Tests unitarios nuevos (87 en total)

| Test | Descripción |
|------|-------------|
| Tarea 1 — emite coverageWarning cuando descanso forzado deja laborable sin cobertura | Verifica que el warning se emite para Jun1 y Jun2 |
| Tarea 1 — el empleado puede trabajar con normalidad a partir del día 3 | Jun3 recibe M o T tras los 2D forzados |
| Tarea 2 — empleado con 4N al final del mes anterior completa las 3 noches restantes | Jun1-3 = N |
| Tarea 2 — empleado que completa 7N recibe 3D post-descanso en el nuevo mes | Jun1-3 = D |
| Tarea 2 — continuidad cross-month mantiene exactamente 1 turno N por día | ≤1 N por día en junio |
| Tarea 3 — festivo lunes extiende paquete a 3 días con el mismo empleado | MF consistente Sáb+Dom+Lun |
| Tarea 3 — el lunes festivo recibe MF/TF (no M/T) | shiftType ∈ {MF, TF} para Jun8 festivo |

---

## E2E nuevos (CP-110..CP-115)

| CP | Descripción |
|----|-------------|
| CP-110 | API de generación incluye el campo `coverageWarnings` en la respuesta |
| CP-111 | `coverageWarnings` tiene estructura correcta (date, employeeId, message) |
| CP-112 | Ningún día del mes tiene 2 empleados con turno N simultáneamente |
| CP-113 | Festivo lunes contiguo al domingo recibe MF o TF (no M ni T) |
| CP-114 | Paquete extendido Sáb+Dom+Lun festivo: mismo empleado cubre MF los 3 días |
| CP-115 | Paquete extendido Sáb+Dom+Lun festivo: mismo empleado cubre TF los 3 días |

---

## Deuda técnica

- `nightBlockRestDates` se construye pero no se usa en la fase de reparación (removido por ser demasiado agresivo en sprint previo). Pendiente de revisión en sprint futuro si aparecen nuevos casos de D de bloque nocturno convertidos incorrectamente.
