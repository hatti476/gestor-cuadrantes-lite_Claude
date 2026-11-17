# SPEC-012 — Paleta de edición unificada con arrastre + fixes de preparación, sesión, CSV, tarifas e impresión

## Metadatos

| Campo | Valor |
|-------|-------|
| ID | SPEC-012 |
| Tipo | feature + fix |
| Estado | ready |
| Prioridad | alta |
| Agentes asignados | @orchestrator, @qa, @backend, @frontend |
| Fecha de creación | 2026-11-17 |
| Sprint | Sprint-06 |

---

## Descripción

El DM ha probado manualmente la app (build actual de `main`, post SPEC-011) y reporta 6
hallazgos para el siguiente sprint. Se agrupan en una spec porque varios tocan el mismo
área (`app/page.tsx`, `schedule-grid.tsx`, `prep-panel.tsx`) y conviene secuenciarlos juntos:

1. **Unificar edición de celdas en una paleta única con arrastre** (feature + fix). Hoy
   coexisten dos mecanismos redundantes e inconsistentes entre sí para marcar turnos, y
   además una celda bloqueada (V/D manual) deja de poder editarse en cuanto se cierra el
   panel de preparación.
2. **Error de consola al cerrar sesión** (bug). `HomePage` intenta recargar el cuadrante
   justo cuando la sesión ya no es válida.
3. **Restricción de festivos/fines de semana** (bug/regla de negocio). No deben poder
   marcarse como Vacaciones (V) ni Baja (B); solo como Descanso (D).
4. **CSV sin pagas extra** (feature). La exportación no incluye lo que sí se ve en pantalla
   (`ExtraPayTable`).
5. **Tarifas desactualizadas** (chore). Las tarifas de `EXTRA_PAY_RATES` subieron un 20%.
6. **Impresión sin colores** (bug). Al imprimir, las celdas de turno pierden su color de
   fondo porque no se fuerza su conservación en `@media print`.

---

## Contexto y antecedentes

- Sesión de pruebas manuales del DM del 2026-11-17 sobre `main` (`cf92a9a`), con la app
  levantada vía `docker-compose.yml` + datos de `prisma/seed.ts`.
- Decisión del DM sobre el punto 1 (entre 3 opciones presentadas): **paleta de pintar
  única** — un selector de turno siempre visible en modo edición ADMIN (los 13 tipos de
  `VALID_SHIFT_TYPES`: M/T/N/J/D/V/B + variantes de finde MF/TF/NF + variantes de Navidad
  MN/TN/NN, más "borrar"), donde clic o clic-y-arrastre sobre las celdas aplica el turno
  seleccionado.
  Sustituye tanto los 3 pasos de preparación del panel (Vacaciones/Libres/Bajas) como el
  modal `ShiftEditor` para el modo de edición normal.
- Investigación de código confirma 3 problemas concretos detrás del punto 1:
  - `app/page.tsx` `handleCellClick` (L332-379): el branch de preparación solo cubre
    `prepStep === "vacaciones" || "libres"`. Si `prepStep === "bajas"`, cae al modo normal
    y abre el modal — contradice la descripción del paso en `prep-panel.tsx` ("Quedan
    bloqueadas") y es la raíz del "parece repetitivo".
  - `lockedCells` (`app/page.tsx` L576-580) solo marca como bloqueadas las celdas con V o
    D manual — **no B**, pese a que `prep-panel.tsx` dice que Bajas también bloquea.
  - `ScheduleGrid` (`schedule-grid.tsx` L154): `clickable = !!onCellClick && (!isLocked ||
    allowLockedCellClick)`, y `allowLockedCellClick = canEdit && prepStep !== null`
    (`app/page.tsx` L697). Fuera de un paso de preparación activo, una celda bloqueada deja
    de ser clicable sin alternativa — de ahí "una vez marco un tipo de turno, no me deja
    modificarlo".
- Punto 2: `loadSchedule` (`app/page.tsx` L259-309) solo espera a `sessionStatus ===
  "loading"`; no se detiene si `sessionStatus === "unauthenticated"`. Al cerrar sesión,
  `Header.handleSignOut` (`components/layout/header.tsx` L32-42) invalida la sesión antes
  de navegar (`signOut({redirect: false})` + `router.push` + `router.refresh()`), y el
  efecto de `HomePage` se reactiva con sesión ya inválida, lanzando un fetch a
  `/api/schedules` que responde 401 → `throw new Error("Error cargando cuadrante")` →
  overlay de Next.js. Confirmado con el stack trace aportado por el DM.
- Punto 3: ni `handleCellClick`, ni `validateScheduleBody`
  (`lib/schedules/business-logic.ts` L164-201), ni la paleta nueva del punto 1 comprueban
  hoy si la fecha es festivo/sábado/domingo antes de permitir V o B.
- Punto 4: `handleExportCSV` (`app/page.tsx` L538-570) solo exporta la grid de turnos; no
  incluye los contadores de `EXTRA_PAY_SHIFTS` ni el total que sí calcula
  `calculateExtraPay` (usado por `ExtraPayTable`, L103-184).
- Punto 5: tarifas actuales en `EXTRA_PAY_RATES`
  (`lib/schedules/business-logic.ts` L47-55):
  `MF: 33, TF: 33, N: 38.5, NF: 49.5, MN: 126.5, TN: 126.5, NN: 126.5`.
  Tarifas nuevas aportadas por el DM — todas exactamente ×1.2 (+20%) sobre las actuales:
  `MF: 39.6, TF: 39.6, N: 46.2, NF: 59.4` y **"Especial Navidad": 151.8**, que por el
  mismo ratio (126.5 × 1.2 = 151.8) aplica uniforme a `MN`, `TN` y `NN` (hoy ya comparten
  el mismo valor entre sí). **Confirmado por el DM el 2026-11-17.**
- Punto 6: `app/globals.css` (bloque `@media print`, L28-42) oculta controles y cabecera
  pero no incluye `print-color-adjust`/`-webkit-print-color-adjust`, por lo que el
  navegador puede omitir los `backgroundColor` inline de `ShiftCell` al imprimir
  ("Gráficos de fondo" desactivado por defecto en muchos navegadores).

---

## Historias de usuario

### 1. Paleta de edición unificada con arrastre
Como **ADMIN preparando o editando el cuadrante**,
quiero **un único selector con todos los tipos de turno (incluidas las variantes de finde
y Navidad) que pueda aplicar con clic o
arrastrando sobre varias celdas**,
para **marcar turnos, vacaciones, libres y bajas de forma rápida y consistente, sin un
modal por celda ni mecanismos distintos según la fase de preparación**.

### 2. Sin error al cerrar sesión
Como **cualquier usuario autenticado**,
quiero **cerrar sesión sin que aparezca un error en consola/overlay**,
para **confiar en que el cierre de sesión es limpio**.

### 3. Festivos y fines de semana solo como descanso
Como **ADMIN preparando el mes**,
quiero **que el sistema impida marcar un festivo, sábado o domingo como Vacaciones o
Baja**,
para **evitar que se "gasten" días de vacaciones/baja en días que ya son de descanso**.

### 4. CSV con pagas extra
Como **ADMIN exportando el cuadrante**,
quiero **que el CSV incluya los contadores de turnos con paga extra y el total por
empleado**,
para **usar el CSV como base de nómina sin tener que mirar la pantalla también**.

### 5. Tarifas actualizadas
Como **ADMIN consultando pagas extra**,
quiero **que las tarifas reflejen la subida del 20% vigente**,
para **que los cálculos de paga extra sean correctos**.

### 6. Impresión con colores
Como **cualquier usuario imprimiendo el cuadrante**,
quiero **que la copia impresa conserve los colores de cada tipo de turno**,
para **poder leerla igual que en pantalla**.

---

## Criterios de aceptación

### 1. Paleta de edición unificada con arrastre
- [x] AC-01: Existe una única paleta con los 13 tipos de turno de `VALID_SHIFT_TYPES`
  (M/T/N/J/D/V/B/MF/TF/NF/MN/TN/NN) + "borrar" siempre visible para el ADMIN en la vista
  del cuadrante, sustituyendo los 3 pasos de preparación (Vacaciones/Libres/Bajas) del
  panel y el modal `ShiftEditor` para asignar/cambiar turnos. Se mantienen las 6 variantes
  de finde/Navidad (antes seleccionables en el modal `SHIFT_OPTIONS`) para no perder la
  capacidad de forzar manualmente un turno festivo.
- [ ] AC-02: Clic en una celda con un turno de la paleta seleccionado aplica ese turno
  directamente (sin modal).
- [ ] AC-03: Clic y arrastre (mousedown + mouseenter con botón pulsado + mouseup) sobre
  varias celdas aplica el turno seleccionado a todas las celdas recorridas.
- [ ] AC-04: Seleccionar "borrar" y pintar sobre una celda elimina la asignación (igual
  que el botón "Eliminar" del modal anterior).
- [ ] AC-05: Una celda con V, D manual o B puede volver a editarse con la paleta en
  cualquier momento — ya no depende de estar dentro de un "paso" concreto del panel
  anterior (se elimina el concepto `allowLockedCellClick` ligado a `prepStep`).
- [ ] AC-06: El "bloqueo" de una celda (icono 🔒, para que el generador automático no la
  sobreescriba) se sigue aplicando a V, D manual **y también a B** (fix de la
  inconsistencia actual).
- [ ] AC-07: El panel de preparación deja de tener pasos clicables "Vacaciones"/"Días
  libres"/"Bajas" con descripciones separadas; conserva (o integra en la paleta) los
  contadores de V/D/B/festivos y las acciones "Guardar preparación"/"Generar cuadrante".
- [ ] AC-08: No afecta a TECNICO/VIEWER — siguen sin poder editar (`canEdit` sigue
  gobernando la visibilidad de la paleta).
- [x] AC-08b (retirado): se investigó si había que preservar el aviso de descanso
  insuficiente del modal (`ShiftEditor` → prop `getTransitionWarning`, basada en
  `validateShiftTransition`). Confirmado por grep: `app/page.tsx` nunca pasa esa prop —
  la funcionalidad existe en el componente pero **no está conectada en producción hoy**.
  No hay nada que preservar; no se añade ningún indicador nuevo para esto en la paleta
  (se evita complejidad para una funcionalidad que ya no era real).

### 2. Sin error al cerrar sesión
- [ ] AC-09: Al pulsar "Cerrar sesión", no se lanza ningún fetch a `/api/schedules`,
  `/api/holidays` ni `/api/employees` tras invalidarse la sesión.
- [ ] AC-10: No aparece el overlay de error de Next.js ni un `console.error` en el flujo
  de logout.
- [ ] AC-11: La redirección a `/login` sigue funcionando igual que hoy.

### 3. Festivos y fines de semana solo como descanso
- [ ] AC-12: La paleta/API rechaza (o ignora con aviso) asignar V o B a una fecha que sea
  festivo (según `holidayDates`/tabla de festivos) o sábado/domingo.
- [ ] AC-13: La validación se aplica también en servidor (`POST /api/schedules` /
  `validateScheduleBody` o equivalente), no solo en el cliente.
- [ ] AC-14: D sigue permitido (y es la única opción válida) en festivos/fines de semana.
- [ ] AC-15: El bloqueo no afecta a M/T/N/J ni a los días de semana no festivos.

### 4. CSV con pagas extra
- [ ] AC-16: El CSV exportado incluye, por empleado, una columna por cada tipo de turno
  con paga extra vigente ese mes (igual criterio que `ExtraPayTable`: excluye MN/TN/NN
  fuera de diciembre/enero) con el recuento de turnos.
- [ ] AC-17: El CSV incluye una columna final "Paga extra" con el total en euros por
  empleado (mismo cálculo que `calculateExtraPay`).
- [ ] AC-18: El formato numérico en el CSV es coherente (usar punto o coma decimal de
  forma consistente con el resto del fichero; documentar la elección).

### 5. Tarifas actualizadas
- [ ] AC-19: `EXTRA_PAY_RATES` refleja: `MF: 39.6, TF: 39.6, N: 46.2, NF: 59.4, MN: 151.8,
  TN: 151.8, NN: 151.8`.
- [ ] AC-20: `RatesLegend`, `ExtraPayTable` y el nuevo CSV (punto 4) muestran las tarifas
  nuevas sin cambios adicionales de código (ya leen de `EXTRA_PAY_RATES`).
- [ ] AC-21: Tests unitarios de `calculateExtraPay` actualizados a las tarifas nuevas.

### 6. Impresión con colores
- [ ] AC-22: Al imprimir (o exportar a PDF desde el diálogo de impresión), las celdas de
  turno conservan su color de fondo tal como se ve en pantalla.
- [ ] AC-23: El resto de reglas de impresión existentes (ocultar header/controles) sigue
  funcionando igual.

> Cada criterio de aceptación debe poder responderse con SÍ o NO.

---

## Referencias visuales

El DM no ha adjuntado capturas en esta ronda (reporte por texto). Si en la validación de
@qa se detectan matices visuales, añadirlas en `specs/assets/SPEC-012-*.png` y
referenciarlas aquí.

---

## Flujo del usuario

### Paleta de edición unificada (punto 1)
1. El ADMIN abre el cuadrante de un mes. Ve la paleta de turnos (en lugar del panel de
   pasos de preparación actual).
2. Selecciona, por ejemplo, "V" (Vacaciones) en la paleta.
3. Hace clic en una celda → se marca V. Hace clic y arrastra sobre varias celdas
   seguidas → todas quedan marcadas V (salvo festivos/fin de semana, ver punto 3, que se
   ignoran con un aviso).
4. Cambia la selección de la paleta a "borrar" y arrastra sobre celdas ya marcadas →
   quedan vacías.
5. Cambia la selección a "M" y repite sobre otras celdas para turnos manuales.
6. Las celdas V/D-manual/B quedan con el icono 🔒 (no las sobreescribe "Generar
   cuadrante"), pero el ADMIN puede seguir editándolas con la paleta en cualquier momento.

### Cierre de sesión (punto 2)
1. Usuario autenticado en `/` pulsa "Cerrar sesión".
2. La sesión se invalida y el usuario es redirigido a `/login` sin que se dispare ningún
   fetch adicional a las APIs del cuadrante ni aparezca error en consola.

---

## Fuera de scope

- NO incluye soporte táctil/móvil para el arrastre (solo ratón de escritorio).
- NO incluye deshacer/rehacer (undo/redo) de pintado múltiple.
- NO incluye exportar el CSV con el mismo formato condicional de colores (eso es Excel,
  no CSV plano) — el punto 6 (colores) es solo para impresión/PDF.
- NO incluye cambiar el algoritmo de generación automática (`/api/schedules/generate`),
  solo cómo se marcan manualmente V/D/B.
- NO incluye auditoría/historial de quién pintó cada celda.

---

## Notas técnicas para los agentes

- **Punto 1**: `app/page.tsx` (`handleCellClick`, `editingCell`, `prepStep` y todo su
  estado asociado), `components/schedule/prep-panel.tsx` (reemplazar o reducir a
  contadores + acciones), `components/schedule/schedule-grid.tsx` (añadir manejo de
  `onMouseDown`/`onMouseEnter`/`onMouseUp` para el arrastre; hoy solo tiene `onClick`),
  `components/schedule/shift-editor.tsx` (queda obsoleto si se sustituye por completo —
  confirmar con @devlead si se elimina o se conserva para algún caso residual).
  Riesgo de regresión: **alto** — toca el flujo de edición principal usado por todos los
  tests E2E existentes de preparación/generación.
  AC-08b: no se preserva ningún aviso de `validateShiftTransition` porque no estaba
  conectado en producción (ver arriba) — fuera de scope, sin indicador nuevo.
- **Punto 2**: fix mínimo sugerido — en `loadSchedule`, añadir guarda para
  `sessionStatus === "unauthenticated"` (no solo `"loading"`) antes de hacer fetch.
  Riesgo de regresión: bajo.
- **Punto 3**: añadir validación en `lib/schedules/business-logic.ts` (nueva función, p.
  ej. `isRestDayOnly(date, holidayDates)`) reutilizable desde cliente (paleta) y servidor
  (`app/api/schedules/route.ts`). Riesgo de regresión: medio — revisar que no bloquee la
  generación automática existente, que ya convierte M→MF/T→TF/N→NF en días especiales.
- **Punto 4**: extender `handleExportCSV` en `app/page.tsx` reutilizando la misma lógica
  de columnas que `ExtraPayTable` (filtrar MN/TN/NN fuera de dic/ene) y
  `calculateExtraPay`. Riesgo de regresión: bajo.
- **Punto 5**: cambio de constantes en `lib/schedules/business-logic.ts`
  (`EXTRA_PAY_RATES`). Riesgo de regresión: bajo. Confirmado: "Especial Navidad" (151.8)
  aplica igual a MN, TN y NN.
- **Punto 6**: `app/globals.css`, bloque `@media print` — añadir `print-color-adjust:
  exact;` y `-webkit-print-color-adjust: exact;` (y `color-adjust: exact;` para Firefox)
  sobre `*` o sobre el contenedor del grid. Riesgo de regresión: muy bajo.

---

## Casos de test sugeridos

- Unitario: paleta — seleccionar turno + "pintar" celda única asigna correctamente (por
  tipo: cualquiera de los 13 + borrar).
- Unitario: paleta — arrastre sobre rango de celdas aplica el turno a todas menos las
  que el usuario no recorrió.
- Unitario: celda con V/D/B bloqueada sigue siendo editable con la paleta fuera de
  cualquier "paso" (ya no existe el concepto de paso).
- Unitario: `calculateExtraPay` con las tarifas nuevas.
- Unitario: intento de asignar V o B a fecha festiva/sábado/domingo → rechazado (cliente
  y servidor).
- Unitario: `handleExportCSV` incluye columnas de paga extra y total coincide con
  `ExtraPayTable` en pantalla.
- E2E: logout desde `/` no muestra error de consola ni hace fetch extra (se puede
  comprobar interceptando `console.error` / requests de red en el test).
- E2E @smoke: ADMIN selecciona "V" en la paleta, arrastra sobre 5 días seguidos de un
  empleado, los 5 quedan marcados V; intenta sobre un domingo dentro del rango y ese día
  queda en D, no en V.
- E2E @smoke: impresión — snapshot/verificación de que las celdas con turno mantienen
  `backgroundColor` en el DOM bajo `@media print` (o verificación visual manual
  documentada si no es viable en Playwright).

---

## Historial de cambios

| Fecha | Autor | Cambio |
|-------|-------|--------|
| 2026-11-17 | @orchestrator | Creación de la spec a partir de pruebas manuales del DM (6 hallazgos). Diseño del punto 1 (paleta única con arrastre) confirmado por el DM entre 3 opciones presentadas. |
| 2026-11-17 | @orchestrator | DM confirma que la tarifa "Especial Navidad" (151,8) aplica igual a MN/TN/NN. Estado → `ready`. |
