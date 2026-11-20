# Gestor de Cuadrantes

Aplicacion web para gestionar cuadrantes mensuales de turnos de un equipo de soporte 24/7. Sustituye un Excel manual, permite generar el cuadrante automaticamente segun reglas de rotacion y deja margen para ajustes manuales posteriores.

## Estado

| Campo | Valor |
|-------|-------|
| Version funcional | 2.7 (LITE, single-tenant) |
| Ciclo actual | Ciclo 2 — Sprint 5 (SPEC-010, auditoria de permisos) |
| Ultimo sprint cerrado | Sprint 4 — SPEC-009 (CI ubuntu-24.04, vista multi-mes) |
| Especificaciones | `specs/` (SDD, ver `AGENTS.md`) |
| Fallos conocidos | `tests/e2e/known-failures.md` |

## Stack

- Next.js 16.2.6 con App Router y TypeScript
- React 19
- Tailwind CSS 4
- Prisma 5.22
- SQLite (el `schema.prisma` actual solo declara `provider = "sqlite"`)
- NextAuth.js con CredentialsProvider y JWT
- Vitest para unit tests
- Playwright para E2E
- Docker Compose y manifiestos Kubernetes para despliegue

## Funcionalidad principal

- Un unico cuadrante global (sin proyectos) con tres roles:
  - `ADMIN`: acceso completo (generar, editar, publicar, usuarios, festivos).
  - `TECNICO`: solo lectura, ve los meses publicados; tiene fila propia en el cuadrante.
  - `VIEWER`: solo lectura, ve los meses publicados.
- Cuadrante mensual con filas por empleado y columnas por dia.
- Generacion automatica con bloques de noches, descansos, cobertura minima y preferencias M/T/J.
- Edicion manual de celdas, celdas bloqueadas y registro de cambios.
- Gestion de usuarios/empleados (`/admin`), festivos y region CCAA.
- Vista ampliada multi-mes (`/multi-month`) con scroll horizontal.
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

La aplicacion queda disponible en `http://localhost:3100` (el puerto 3000
queda reservado para el contenedor de produccion, ver `docker-compose.prod.yml`).

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
| `admin@cuadrantes.local` | `Admin1234!` | ADMIN |
| `tecnico1@cuadrantes.local` … `tecnico7@cuadrantes.local` | `Tecnico1234!` | TECNICO |
| `viewer@cuadrantes.local` | `Viewer1234!` | VIEWER |

## Documentacion

- Especificaciones vigentes (SDD): `specs/`
- Changelog: `CHANGELOG.md`
- Fallos E2E conocidos: `tests/e2e/known-failures.md`
- Historico del ciclo 1 (arquitectura multi-proyecto, ya eliminada): `docs/_archive/ciclo-1/`
