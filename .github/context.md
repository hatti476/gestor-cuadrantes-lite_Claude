# Gestor de Cuadrantes — Contexto de Desarrollo

## Descripción
Aplicación web para gestionar los cuadrantes de turnos de un equipo de soporte 
técnico 24/7 compuesto por 8 personas (7 técnicos + 1 responsable). Sustituye 
un proceso manual en Excel, permitiendo generar cuadrantes mensuales 
automáticamente según reglas de rotación definidas, con posibilidad de edición 
manual posterior.

Diseñada para funcionar inicialmente en local y ser desplegable en servidor 
corporativo sin cambios de código. Desarrollada de forma incremental siguiendo 
metodología agile.

## Usuarios y Casos de Uso
- **Usuarios objetivo**: Responsable del equipo (admin) y 7 técnicos (empleados)
- **Caso de uso principal**: El admin genera el cuadrante de un mes con un clic,
  el sistema aplica las reglas de rotación automáticamente, el admin ajusta 
  manualmente las celdas que no encajen, y los técnicos consultan su turno 
  desde cualquier equipo de la empresa.
- **Casos de uso secundarios**:
  - Consultar cuadrante de meses anteriores
  - Modificar turno de un empleado en un día concreto
  - Gestionar el orden de rotación de noches
  - Ver contadores de turnos por empleado en el mes

## Funcionalidades MVP

### Must Have
- [x] Autenticación con roles: admin y empleado
- [x] Vista mensual tipo grid (columnas = días, filas = empleados)
- [x] Celdas con código de turno (M/T/N/J/D/V/B/MF/TF/NF) y color diferenciado
- [x] Generación automática del cuadrante mensual según reglas de negocio
- [x] Edición manual celda a celda (solo admin)
- [x] Fila de contadores por empleado (nº de M, T, N, D, V, B, MF, TF, NF en el mes)
- [x] Navegación entre meses
- [x] Gestión de empleados: altas, bajas y orden de rotación de noches
- [x] Asignación de packs de fin de semana (Sáb+Dom) como unidad

### Nice to Have (v2)
- [x] Turnos especiales de fin de semana: MF, TF, NF con marcado visual diferente
- [x] Cálculo de remuneración extra por turnos de fin de semana, festivos y noches
- [ ] Branding corporativo EPAM (colores y logo)
- [x] Gestión de festivos nacionales/locales
- [x] Exportación CSV e impresión/PDF desde navegador
- [ ] Notificaciones al empleado cuando cambia su turno

### Fuera de Scope
- [x] App móvil nativa
- [x] Integración con sistemas de RRHH externos
- [x] Gestión de nóminas o cálculo salarial completo
- [x] Gestión de nóminas completa; Sprint 16 solo calcula complementos informativos por turno

## Tipos de Turno
| Código | Nombre | Horario | Color |
|--------|--------|---------|-------|
| M | Mañana | 7:00–15:00 | Naranja `#FF9800` |
| T | Tarde | 15:00–23:00 | Azul `#2196F3` |
| N | Noche | 23:00–7:00 | Azul oscuro `#1A237E` |
| J | Jornada normal | 9:00–18:00 (L-V) | Verde `#4CAF50` |
| D | Descanso | — | Gris claro `#F5F5F5` |
| V | Vacaciones | — | Verde claro `#8BC34A` |
| B | Baja | — | Rosa `#F48FB1` |
| MF | Mañana Finde (v2) | 7:00–15:00 sáb/dom | Naranja oscuro `#E65100` |
| TF | Tarde Finde (v2) | 15:00–23:00 sáb/dom | Azul oscuro `#0D47A1` |
| NF | Noche Finde (v2) | 23:00–7:00 sáb/dom | Índigo `#311B92` |
| MN | Mañana Navidad | 7:00–15:00 fechas navideñas | Rojo `#BE123C` |
| TN | Tarde Navidad | 15:00–23:00 fechas navideñas | Verde `#047857` |
| NN | Noche Navidad | 23:00–7:00 fechas navideñas | Violeta `#5B21B6` |

## Reglas de Negocio para Auto-generación <!-- Actualizado: 2026-05-19 -->
1. **Bloque de noches**: `2D + 7N (Vie 23h → Jue 23h) + 3D` = 12 días por bloque
2. **Rotación de noches**: orden configurable entre técnicos elegibles, cíclico; empleados con `shiftPreference = "J"` quedan excluidos de noches automáticas
3. **Cobertura mínima laborable**: mínimo 2 personas en M y 2 en T de L-V
4. **Consistencia semanal**: un empleado no cambia de M a T (ni viceversa) dentro de la misma semana
5. **Descanso entre bloques**: 5 días consecutivos de trabajo fuerzan 2 días `D` consecutivos, también en cruce de mes
6. **Fines de semana y festivos**: pack Sáb+Dom asignado como unidad; viernes/lunes festivos pegados se integran en el mismo pack y `weekendShift` mantiene MF/TF alineado con la pauta semanal M/T
7. **Equidad**: distribución equilibrada de M y T entre empleados a lo largo del mes
8. **Noches y fines de semana**: máximo 1 persona por turno siempre
9. **Cumplimiento ET Art. 34.3**: la generación evita transiciones con menos de 12 h de descanso y devuelve warnings informativos
10. **Asignaciones manuales**: el editor puede forzar turnos manuales, incluyendo noches en empleados `J`; las advertencias ET no bloquean la edición

## Estado Actual <!-- Actualizado: 2026-05-19 -->

| Campo | Valor |
|-------|-------|
| Versión funcional | 1.6 (Sprint 16 implementado) |
| Rama activa | `feature/sprint-16-algorithm-fixes` |
| Sprints completados | 16 de 16 |
| Tests unitarios | 213/213 ✅ |
| Tests E2E | CP-01..CP-108 (108/108) ✅ |
| Última validación local | `npm run lint` ✅; `npm run test:unit` ✅; `npm run build` ✅; `npx playwright test --workers=1` ✅ |
| Próximo paso | Revisión pre-merge y PR contra `main` |

### Cambios completados en Sprint 16
- ✅ PrepPanel permite toggle de `V` y `D` manual: segundo clic elimina la asignación bloqueada vía `DELETE /api/schedules`.
- ✅ Empleados con preferencia `J` quedan fuera de la rotación automática de noches (`N`, `NF` y descansos de bloque).
- ✅ El generador mantiene consistencia semanal también en `MF`/`TF` mediante `weekendShift`.
- ✅ Los festivos viernes/lunes pegados al fin de semana se añaden al pack MF/TF correspondiente.
- ✅ La cobertura de fin de semana recupera slots MF/TF abiertos cuando el descanso forzado deja huecos y hay personal disponible.
- ✅ El descanso forzado exige 2 días `D` consecutivos entre bloques de trabajo, incluyendo cruce de mes.
- ✅ `validateShiftTransition` aplica ET Art. 34.3 y evita transiciones automáticas con menos de 12 h de descanso.
- ✅ `ShiftEditor` muestra advertencia visible por transiciones ET inválidas sin bloquear ediciones manuales.
- ✅ Nueva tabla de complementos con recuento MF/TF/N/NF, columna `P. Extra`, leyenda de tarifas y extras navideños MN/TN/NN en enero/diciembre.
- ✅ Tests E2E Sprint 16 añadidos en `tests/e2e/sprint-16.spec.ts` (CP-99..CP-108).

## Stack Técnico
| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend + Backend | Next.js 16.2.6 (App Router) | Full-stack en un solo framework, máximo soporte de Copilot |
| Estilos | Tailwind CSS | Utility-first, fácil personalización de colores de turno |
| Base de datos (local) | SQLite + Prisma ORM | Sin instalación adicional, funciona en cualquier PC |
| Base de datos (producción) | PostgreSQL + Prisma ORM | Mismos modelos, cambio solo de connection string |
| Autenticación | NextAuth.js | Gestión de sesiones y roles integrada con Next.js |
| Infraestructura | Docker + Docker Compose | Portabilidad garantizada local → servidor corporativo |
| Lenguaje | TypeScript | Tipado estático, reduce errores en lógica de turnos |

## Arquitectura de Alto Nivel

El algoritmo de generación vive principalmente en `lib/schedules/generate.ts`
y la lógica compartida en `lib/schedules/business-logic.ts`. Las funciones de
negocio se mantienen desacopladas de la UI para poder testearlas con Vitest.

## Decisiones Técnicas Clave
- **Next.js App Router sobre Pages Router**: más moderno, mejor soporte futuro,
  Server Components reducen JS en cliente
- **Prisma sobre consultas SQL directas**: los modelos tipados previenen errores 
  en la lógica de rotación y facilitan la migración SQLite→PostgreSQL
- **SQLite en desarrollo**: elimina la necesidad de instalar PostgreSQL localmente,
  reduce fricción para empezar
- **Docker Compose desde el inicio**: aunque en local no es estrictamente necesario,
  garantiza que el despliegue en servidor corporativo sea idéntico al entorno de dev

## Estructura de Sprints
| Sprint | Objetivo | Features |
|--------|----------|----------|
| 1 | Base del proyecto | Setup, Docker, login, vista cuadrante (solo lectura con datos mock) |
| 2 | Edición manual | Edición celda a celda, guardado en BD, navegación entre meses |
| 3 | Auto-generación | Algoritmo de rotación de noches + relleno de laborables |
| 4 | Empleados y contadores | CRUD empleados, orden rotación, fila de contadores |
| 5 | Fines de semana | Asignación de packs Sáb+Dom, reglas de cobertura |
| 6 | Pulido y despliegue | Tests, Docker producción, documentación de despliegue |
| 7 | Exportación y festivos | Exportación CSV, gestión de festivos, turnos MF/TF/NF |
| 8 | Multiproyecto base | Proyectos múltiples, roles PROJECT_ADMIN, miembros |
| 9 | Bloque de noches v2 | NIGHT_EPOCH_FRIDAY, celdas bloqueadas (V/L), historial |
| 10 | Permisos y contadores | PROJECT_ADMIN edita su proyecto, tabla contadores, nightRotationOrder |
| 11 | Preferencias y prep | shiftPreference M/T, PrepPanel 4 pasos, MonthStatus, vacaciones |
| 12 | Aislamiento y noches | ShiftAssignment.projectId, resolveNightBlocks, pref J, RF-19 |
| 13 | CCAA + historial + docs | Festivos por CCAA (nager.at), historial paginado, /info Fase 2, deployment.md |
| 14 | Estabilización | BUG-32..BUG-37: localStorage stale, doble bloque noches, día 31, pref M/T en MF/TF, consecutivos, pack Sáb+Dom |
| 15 | Saneamiento técnico | Lint limpio, build sin Google Fonts, CP-01..CP-98 alineados, docs y versión npm 1.5.0 |
| 16 | Correcciones algoritmo + extras | Toggle PrepPanel, preferencia J fuera de noches, consistencia MF/TF, festivos pegados a finde, 2D descanso, ET 12 h, complementos económicos y navideños, CP-99..CP-108 |

## Historial de Decisiones <!-- Actualizado: 2026-05-19 -->
- **Sprint 14**: se cerraron BUG-32..BUG-37 detectados en testing manual post-Sprint 13, incluyendo localStorage stale, doble bloque de noches, día 31, preferencia M/T en MF/TF, consecutivos y pack Sáb+Dom indivisible.
- **Sprint 15**: se separó el saneamiento técnico/documental de los cambios funcionales para no mezclar recuperación de calidad con reglas de negocio.
- **Sprint 16**: se corrigieron reglas críticas del generador, se añadió el contador económico informativo y se incorporaron extras navideños; la gestión de nóminas completa sigue fuera de alcance.

## Restricciones y Requisitos No Funcionales
- **Rendimiento**: uso interno, máx. ~20 usuarios concurrentes. Sin requisitos especiales
- **Seguridad**: credenciales en variables de entorno, sesiones con NextAuth, 
  rutas de edición protegidas por rol admin
- **Escalabilidad**: diseñado para un equipo, arquitectura permite multi-equipo en v3
- **Cumplimiento**: datos de empleados (nombres, turnos). Considerar GDPR si se 
  despliega en servidor corporativo con datos reales
- **Disponibilidad**: servidor interno empresa, SLA definido por infraestructura corporativa

## Convenciones del Proyecto
- Idioma del código: **inglés** (variables, funciones, componentes, comentarios técnicos)
- Idioma de negocio: **español** (comentarios de reglas de turno, mensajes de UI)
- Estilo de commits: **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`)
- Estructura de ramas: **trunk-based** (main + feature branches de corta vida)
- Componentes: nomenclatura PascalCase, ficheros kebab-case

## Glosario
| Término | Definición |
|---------|-----------|
| Cuadrante | Tabla mensual que asigna un turno a cada empleado cada día |
| Bloque de noches | Secuencia fija: 2D + 7N + 3D asignada a un técnico en rotación |
| Pack de finde | Sábado y domingo asignados juntos al mismo empleado y turno |
| Festivo pegado | Festivo viernes/lunes que se une al pack MF/TF del fin de semana contiguo |
| Rotación | Orden cíclico en que los técnicos se van alternando el bloque de noches |
| Cobertura mínima | Garantía de al menos 2 personas en M y 2 en T cada día laborable |
| Admin | Responsable del equipo con permisos de edición |
| Empleado | Técnico con permisos solo de visualización |
