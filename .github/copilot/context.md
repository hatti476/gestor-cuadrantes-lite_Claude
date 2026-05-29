# Copilot Workspace Instructions — Gestor de Cuadrantes

## Estado actual (Sprint 22 cerrado, 2026-05-29)
- Version: **2.2.0**
- Rama de trabajo: `feature/sprint-22-close-refactor-cicd`
- Baseline validado: **404/404 unit** y **142/142 E2E**
- Refactor cerrado: `generate-core.ts` eliminado
- `generate.ts` consolidado como orquestador puro (108 lineas)
- Suite E2E endurecida con helpers anti-flake y 18 tests `@smoke`
- CI/CD activo con tres workflows:
  - `ci.yml` (quality gates PR/push)
  - `e2e-smoke.yml` (PR smoke, bloquea merge)
  - `e2e-nightly.yml` (suite completa nocturna + issue automatica)

## Arquitectura vigente de scheduler
```text
generate.ts
└── monthly-schedule-engine.ts
    └── day-loop.ts
        ├── night-blocks.ts
        ├── weekend-packs.ts
        ├── workday-shifts.ts
        ├── rest-rules.ts
        ├── coverage.ts
        ├── shift-transitions.ts
        ├── cross-month.ts
        ├── date-utils.ts
        └── day-loop-context.ts
```

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

## Estado <!-- Actualizado: 2026-05-17 -->
Sprint 13 completado — versión 1.4 en main. Tests: 146 unit + 98 E2E (CP-01..CP-98).  
Sprint 14 en curso: BUG-32..BUG-37 corregidos (todos los bugs detectados resueltos). Tests unitarios: 146/146.

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
