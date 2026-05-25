# Copilot Workspace Instructions — Gestor de Cuadrantes

## Contexto del Proyecto
Aplicación web para gestionar cuadrantes de turnos de un equipo de soporte 24/7.
Sustituye un Excel manual. Genera cuadrantes mensuales automáticamente según 
reglas de rotación (bloques de noche, cobertura mínima diaria, equidad M/T) 
y permite edición manual posterior. Dos roles: admin (edita) y empleado (consulta).

## Stack
- **Framework**: Next.js 16.2.6 con App Router y TypeScript
- **Estilos**: Tailwind CSS
- **ORM**: Prisma (SQLite en dev, PostgreSQL en prod)
- **Auth**: NextAuth.js
- **Infraestructura**: Docker + Docker Compose
- **API externa**: nager.at para festivos públicos por CCAA (`/api/holidays/public`)

## Estado <!-- Actualizado: 2026-05-22 -->
Sprint 18 implementado en `feature/sprint-18-fixes-and-ux` — versión funcional 1.8. Tests unitarios: 257/257. E2E: CP-01..CP-128 declarados. Rama remota pusheada. Pendiente de PR y merge a `main`.

## Cambios Sprint 18 <!-- Actualizado: 2026-05-22 -->
- **TAREA 1 + 2**: Continuidad cross-month del paquete sáb+dom (MF/TF): si el mes anterior termina en sábado con MF/TF, el domingo del mes siguiente se asigna al mismo empleado. Avisos de cobertura crítica (`coverageWarnings`) para días con 0 o 1 empleado disponible.
- **TAREA 3**: Nuevo rol global `SUPER_VIEWER`: acceso de solo lectura a todos los proyectos sin membresías explícitas. Funciones `isSuperViewer()`, `canViewProject()` y `canEditProject()` en `lib/auth/permissions.ts`. Usuario seed: `viewer@cuadrantes.local` / `Viewer1234!`. Badge "Viewer" gris en header.
- **TAREA 4**: Columnas sáb/dom con fondo azul (`bg-blue-100`) y festivos en rojo intenso (`bg-red-200`) en el grid. Celdas festivo con `bg-red-50`.
- **TAREA 5**: Esquema de colores unificado por familia de turno: M y MF comparten naranja `#F97316`; T y TF azul `#3B82F6`; N y NF verde `#16A34A`. V y B con fondo negro `#111827`.
- **TAREA 6**: Snapshot de cuadrante antes de generar; botón "↩ Deshacer" restaura el estado pre-generación. API `/api/schedules/snapshot` y `/api/schedules/snapshot/restore`. Modelo `ScheduleSnapshot` en Prisma.
- **Bugfix**: Bloque N cross-month se interrumpe cuando el empleado tiene V/B en el mes siguiente (no planifica N ni D post-guardia sobre vacaciones).
- **Bugfix**: `weekendCount` en `EmpState` como criterio primario en `_pickWeekendPackageEmployee`; elimina la ventaja artificial de empleados con pocos turnos entre semana.
- **Agentes**: `orchestrator.md`, `new-feature.md` y `pre-merge-review.md` actualizados con regla de cobertura de tests obligatoria.

## Reglas Globales
- Escribe todo el código en inglés (variables, funciones, tipos, comentarios técnicos)
- Los comentarios que expliquen reglas de negocio de turnos pueden ser en español
- Sigue los principios SOLID; mantén funciones con responsabilidad única
- No uses `any` en TypeScript salvo casos justificados con comentario explicativo
- Maneja siempre los errores de forma explícita; no silencies excepciones
- Las rutas de edición (`/api/schedule/*`, `/api/employees/*`) deben verificar 
  siempre que el usuario tiene rol `admin` antes de ejecutar cualquier operación
- Los colores de turno están definidos en `lib/constants/shift-colors.ts`; 
  no los hardcodees en los componentes
- Las reglas de descanso, transiciones ET y complementos económicos se centralizan
  en `lib/schedules/business-logic.ts` cuando sean compartidas por UI/API/tests

## Contexto de Arquitectura
El algoritmo de generación vive principalmente en `lib/schedules/generate.ts`.
La lógica compartida de turnos vive en `lib/schedules/business-logic.ts`.
Mantén estas funciones independientes del framework: reciben datos, devuelven
el cuadrante generado y son testeables con Vitest.

## Historial de Decisiones <!-- Actualizado: 2026-05-22 -->
- Sprint 15 quedó como saneamiento técnico/documental; Sprint 16 asumió los cambios funcionales del algoritmo.
- Sprint 16 corrige reglas críticas del generador sin convertir el contador económico en nómina completa.
- El prompt inicial de Sprint 16 contenía referencias a Sprint 15; la rama y los artefactos válidos son `feature/sprint-16-algorithm-fixes` y `tests/e2e/sprint-16.spec.ts`.
- Sprint 18 añade `SUPER_VIEWER` como rol global de solo lectura; la gestión de usuarios desde UI se planifica para Sprint 19.
- El modelo `ScheduleSnapshot` usa `String` (no `Json`) para la columna snapshot por incompatibilidad de Prisma SQLite con el tipo Json.
- `weekendCount` en `EmpState` reemplaza a `mCount`/`tCount` como criterio de equidad en la asignación de paquetes de fin de semana.
