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

## Estado <!-- Actualizado: 2026-06-04 -->
**Sprint 24 en curso** — versión 2.4.0 en `feature/sprint-24-scheduling-fixes`. 
- **Tests baseline**: 419 unit + 142 E2E (22/22 smoke green)
- **Fixes**: BUG-41 (leyenda tarifas), BUG-42 (T-pref weekends), BUG-43 (max 2 weekends/nightblock), BUG-44 (>5 consecutive days repair)
- **Feature**: Vista ampliada multi-mes (`/multi-month`, horizontal scroll)
- **Pendiente**: favicon ICO, E2E para multi-month view

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

## Contexto de Arquitectura
El algoritmo de generación en `/lib/scheduler/` debe ser independiente del 
framework: funciones puras que reciben datos y devuelven el cuadrante generado, 
fácilmente testeables con Jest.