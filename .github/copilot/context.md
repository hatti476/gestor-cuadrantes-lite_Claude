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

## Estado <!-- Actualizado: 2026-05-19 -->
Sprint 16 implementado en `feature/sprint-16-algorithm-fixes` — versión funcional 1.6. Tests unitarios: 213/213. E2E: 108/108 (CP-01..CP-108). Rama remota: `origin/feature/sprint-16-algorithm-fixes`. Próximo paso: revisión pre-merge y PR contra `main`.

## Cambios Sprint 16 <!-- Actualizado: 2026-05-19 -->
- `PrepPanel` permite toggle de celdas `V` y `D` manual: un segundo clic elimina la asignación bloqueada con `DELETE /api/schedules`.
- `shiftPreference = "J"` queda fuera de la rotación automática de noches: no recibe `N`, `NF` ni descansos de pre/post bloque salvo asignación manual.
- La consistencia semanal M/T se extiende a fines de semana y festivos mediante `weekendShift`, evitando cambios abruptos `MF`/`TF`.
- Los festivos viernes/lunes pegados a un fin de semana se integran en el mismo pack MF/TF; el plan recupera slots abiertos si el descanso forzado deja una mañana/tarde sin cubrir.
- Tras 5 días consecutivos de trabajo, el generador fuerza 2 días `D` consecutivos, también al cruzar de mes con `prevMonthTail`.
- `validateShiftTransition(prevShift, nextShift)` aplica ET Art. 34.3: mínimo 12 h de descanso. La generación sustituye transiciones inválidas por `D` y devuelve `warnings`.
- `ShiftEditor` muestra advertencia visible de descanso ET cuando una edición manual entra en conflicto con el día anterior o siguiente; no bloquea la edición.
- Nueva tabla de complementos junto a contadores: recuenta `MF`, `TF`, `N`, `NF`, muestra columna `P. Extra` y leyenda de importes.
- Enero/diciembre añaden turnos especiales `MN`, `TN`, `NN` para Navidad/Reyes con tarifa 126,50 € por turno.
- E2E Sprint 16 vive en `tests/e2e/sprint-16.spec.ts` y cubre CP-99..CP-108.

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

## Historial de Decisiones <!-- Actualizado: 2026-05-19 -->
- Sprint 15 quedó como saneamiento técnico/documental; Sprint 16 asumió los cambios funcionales del algoritmo.
- Sprint 16 corrige reglas críticas del generador sin convertir el contador económico en nómina completa.
- El prompt inicial de Sprint 16 contenía referencias a Sprint 15; la rama y los artefactos válidos son `feature/sprint-16-algorithm-fixes` y `tests/e2e/sprint-16.spec.ts`.
