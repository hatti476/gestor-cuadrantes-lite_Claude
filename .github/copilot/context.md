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

## Estado <!-- Actualizado: 2026-06-01 -->
**Sprint 23 completado** — versión 2.3.0 en main. 
- **Tests**: 419 unit + 142 E2E (22/22 smoke green)
- **Features**: Publication control (RF-20) fully implemented
- **Fixes**: Night block integrity (7-tech), Ultrawide layout
- **Docs**: REQUIREMENTS.md v2.3.0, CHANGELOG.md updated, Release notes + analysis completed
- **Status**: Production-ready; merged to main 2026-06-01

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