# Sprint 1 — Release Notes
**Proyecto:** Gestor de Cuadrantes  
**Versión:** 0.1.0  
**Fecha:** Mayo 2026  
**Estado:** Listo para QA

---

## Objetivo del Sprint

Establecer la base técnica del proyecto: infraestructura, autenticación con roles y vista del cuadrante mensual en modo solo lectura con datos de ejemplo.

---

## Requisitos implementados

### Funcionales
| ID | Requisito | Estado |
|----|-----------|--------|
| RF-01 | Autenticación con email y contraseña | ✓ |
| RF-02 | Roles de usuario: ADMIN y EMPLOYEE | ✓ |
| RF-03 | Protección de rutas — redirige a `/login` si no hay sesión | ✓ |
| RF-04 | Vista mensual tipo grid (columnas = días, filas = empleados) | ✓ |
| RF-05 | Celdas con código de turno (M/T/N/J/D/V/B) y color diferenciado | ✓ |
| RF-06 | Fila de contadores por empleado (nº de cada turno en el mes) | ✓ |
| RF-07 | Navegación entre meses con botones anterior/siguiente | ✓ |
| RF-08 | Leyenda de colores de turno | ✓ |
| RF-09 | Header con email del usuario, rol y botón de cerrar sesión | ✓ |

### No Funcionales
| ID | Requisito | Estado |
|----|-----------|--------|
| RNF-01 | Código en TypeScript sin `any` | ✓ |
| RNF-02 | Colores de turno centralizados en `lib/constants/shift-colors.ts` | ✓ |
| RNF-03 | Contraseñas hasheadas con bcrypt (coste 12) | ✓ |
| RNF-04 | Variables de entorno en `.env` — nunca hardcodeadas | ✓ |
| RNF-05 | Docker Compose funcional para desarrollo local | ✓ |

---

## Funcionalidades entregadas

### Autenticación
- Login con email y contraseña en `/login`
- Sesión gestionada con NextAuth.js (estrategia JWT)
- Cierre de sesión desde el header
- Redirección automática a `/login` para rutas no autenticadas
- Redirección post-login a la ruta solicitada originalmente

### Vista del cuadrante
- Grid mensual con 8 empleados y 31 días (datos mock de Mayo 2026)
- Celdas coloreadas por tipo de turno según paleta acordada:
  - **M** Mañana — naranja `#FF9800`
  - **T** Tarde — azul `#2196F3`
  - **N** Noche — verde `#4CAF50`
  - **J** Jornada normal — amarillo `#FFC107`
  - **D** Descanso — gris claro `#F5F5F5`
  - **V** Vacaciones — negro `#212121`
  - **B** Baja — negro oscuro `#37474F`
- Fines de semana resaltados visualmente en el encabezado
- Columna de contadores al final de cada fila (ej. `M:12`, `N:7`)
- Leyenda de colores al pie del grid
- Navegación entre meses (los meses sin datos muestran el mock de Mayo 2026)
- Scroll horizontal para meses con muchos días

### Base de datos
- Schema Prisma con los modelos: `User`, `Employee`, `ShiftAssignment`, `Schedule`
- Tablas auxiliares de NextAuth: `Account`, `Session`, `VerificationToken`
- Migración inicial aplicada (`20260508161135_init`)
- Script de seed con 1 admin + 7 técnicos

### Infraestructura
- `docker-compose.yml` para desarrollo local con SQLite
- `Dockerfile.dev` con hot-reload
- `.env.example` documentado con todas las variables necesarias

---

## Tareas técnicas realizadas

| Tarea | Descripción |
|-------|-------------|
| Setup Next.js 14 | App Router, TypeScript, Tailwind CSS, ESLint |
| Prisma 5 + SQLite | Schema, migración inicial, singleton de cliente |
| NextAuth.js | CredentialsProvider + JWT, tipos extendidos (id, role en sesión) |
| bcryptjs | Hash de contraseñas en seed y verificación en login |
| proxy.ts | Protección de rutas en Next.js 16 (reemplaza middleware.ts) |
| shift-colors.ts | Fuente de verdad de colores — no hardcodeados en componentes |
| ScheduleGrid | Componente de tabla con sticky column, resaltado de fines de semana |
| ShiftCell | Celda individual con color e icono del turno |
| Header | Componente de cabecera con datos de sesión |
| Mock data | Cuadrante de ejemplo Mayo 2026 con 8 patrones de turno distintos |
| db:seed | Script reproducible para poblar la BD de desarrollo |

---

## Limitaciones conocidas (fuera de scope Sprint 1)

- Los datos del cuadrante son **mock** — no se persisten ni generan automáticamente
- La navegación entre meses no carga datos reales de BD
- No hay edición de celdas
- No hay gestión de empleados (CRUD)
- Los turnos MF/TF/NF (fines de semana v2) están definidos en constantes pero no se usan en el mock

---

## Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@cuadrantes.local | Admin1234! |
| Técnico | tecnico1@cuadrantes.local | Tecnico1234! |
| Técnico | tecnico2@cuadrantes.local | Tecnico1234! |
| Técnico | tecnico3@cuadrantes.local | Tecnico1234! |
| Técnico | tecnico4@cuadrantes.local | Tecnico1234! |
| Técnico | tecnico5@cuadrantes.local | Tecnico1234! |
| Técnico | tecnico6@cuadrantes.local | Tecnico1234! |
| Técnico | tecnico7@cuadrantes.local | Tecnico1234! |

---

## Casos de prueba para QA

### CP-01 — Acceso sin sesión
1. Abrir `http://localhost:3000` sin estar autenticado
2. **Resultado esperado:** Redirige a `/login?callbackUrl=%2F`

### CP-02 — Login con credenciales incorrectas
1. Introducir email o contraseña erróneos y pulsar Entrar
2. **Resultado esperado:** Mensaje "Email o contraseña incorrectos" en rojo, sin redirigir

### CP-03 — Login admin correcto
1. Entrar con `admin@cuadrantes.local` / `Admin1234!`
2. **Resultado esperado:** Redirige a `/`, header muestra email y badge `ADMIN`

### CP-04 — Login técnico correcto
1. Entrar con `tecnico1@cuadrantes.local` / `Tecnico1234!`
2. **Resultado esperado:** Redirige a `/`, header muestra badge `EMPLOYEE`

### CP-05 — Vista del cuadrante
1. Acceder a `/` autenticado
2. **Resultado esperado:** Grid con 8 filas (empleados) y 31 columnas (días de Mayo 2026), celdas coloreadas

### CP-06 — Colores de turno
1. Verificar visualmente cada tipo de celda en el grid
2. **Resultado esperado:** M=naranja, T=azul, N=verde, J=amarillo, D=gris, V=negro, B=negro oscuro

### CP-07 — Contadores de turno
1. Observar la última columna de cada fila del grid
2. **Resultado esperado:** Badges con el formato `Turno:N` sumando el total de días del mes

### CP-08 — Fines de semana resaltados
1. Observar el encabezado del grid
2. **Resultado esperado:** Las columnas de sábado (S) y domingo (D) tienen fondo azul claro

### CP-09 — Navegación de meses
1. Pulsar el botón `‹` y luego `›`
2. **Resultado esperado:** El título cambia (Abril 2026 → Mayo 2026) y aparece aviso "Vista de ejemplo"

### CP-10 — Cierre de sesión
1. Pulsar "Cerrar sesión" en el header
2. **Resultado esperado:** Redirige a `/login`, la sesión queda destruida

### CP-11 — Acceso directo a ruta protegida post-logout
1. Después del CP-10, intentar acceder a `http://localhost:3000`
2. **Resultado esperado:** Redirige a `/login`

---

## Entorno de pruebas

```
URL:        http://localhost:3000
Node.js:    v24.x
Next.js:    16.2.6
BD:         SQLite (prisma/dev.db)
```

Para levantar el entorno:
```bash
cd gestor-cuadrantes
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```
