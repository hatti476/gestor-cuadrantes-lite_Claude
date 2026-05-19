# Gestor de Cuadrantes

Aplicacion web para gestionar cuadrantes mensuales de turnos de un equipo de soporte 24/7. Sustituye un Excel manual, permite generar el cuadrante automaticamente segun reglas de rotacion y deja margen para ajustes manuales posteriores.

## Estado

| Campo | Valor |
|-------|-------|
| Version funcional | 1.5 |
| Sprint actual | Sprint 15 - saneamiento tecnico y documental |
| Ultimo sprint cerrado | Sprint 14 - Estabilizacion |
| Tests unitarios | 146/146 |
| Tests E2E declarados | CP-01..CP-98 |
| Bugs abiertos conocidos | 0 |

## Stack

- Next.js 16.2.6 con App Router y TypeScript
- React 19
- Tailwind CSS 4
- Prisma 5.22
- SQLite en desarrollo y PostgreSQL en produccion
- NextAuth.js con CredentialsProvider y JWT
- Vitest para unit tests
- Playwright para E2E
- Docker Compose y manifiestos Kubernetes para despliegue

## Funcionalidad principal

- Autenticacion con roles globales `SUPER_ADMIN` y `USER`.
- Roles por proyecto: `PROJECT_ADMIN` y `EMPLOYEE`.
- Cuadrante mensual con filas por empleado y columnas por dia.
- Generacion automatica con bloques de noches, descansos, cobertura minima y preferencias M/T/J.
- Edicion manual de celdas, celdas bloqueadas y registro de cambios.
- Gestion de empleados, proyectos, miembros, festivos y region CCAA.
- Carga automatica de festivos publicos via nager.at.
- Contadores de turnos, exportacion CSV e impresion/PDF desde navegador.
- Pagina `/info` con ayuda contextual por rol.

## Desarrollo local

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run db:seed
npm run dev
```

La aplicacion queda disponible en `http://localhost:3000`.

## Scripts utiles

```bash
npm run dev          # servidor de desarrollo
npm run build        # build de produccion
npm run lint         # ESLint
npm run test:unit    # Vitest
npm run test:e2e     # Playwright
npm run db:seed      # datos iniciales
```

## Usuarios de prueba

| Email | Password | Rol |
|-------|----------|-----|
| `admin@cuadrantes.local` | `Admin1234!` | SUPER_ADMIN |
| `pm@cuadrantes.local` | `PM1234!` | USER + PROJECT_ADMIN |
| `tecnico1@cuadrantes.local` | `Tecnico1234!` | USER + EMPLOYEE |

## Documentacion

- Estado actual: `docs/INFORME-ESTADO-v1.5-2026-05-19.md`
- Requisitos: `docs/REQUIREMENTS.md`
- Bugs: `docs/bugs/BUG-REGISTRY.md`
- Despliegue: `docs/deployment.md`
- Release notes: `docs/sprint-*-release-notes.md`
