# Sprint 13 — Release Notes

**Fecha**: 15/05/2026  
**Versión**: 1.4  
**Rama**: `feature/sprint-13-ccaa-history-docs`  
**Estado**: ✅ Completado

---

## Resumen ejecutivo

Sprint 13 completa la integración de festivos públicos por Comunidad Autónoma vía API externa (nager.at), mejora el historial de cambios de turnos con paginación y filtro por mes, actualiza la página `/info` con toda la documentación de la Fase 2, y entrega una guía de despliegue completa para producción. Incluye 9 nuevos casos de prueba E2E (CP-90 a CP-98) y correcciones de infraestructura de tests para coexistencia de servidor de dev y servidor de tests bajo Next.js 16.

---

## Funcionalidades implementadas

### 1. Selector de región por CCAA en proyectos (Tarea 1)

**Requisito**: RF-17 — Los proyectos deben poder asociarse a una Comunidad Autónoma española para la carga automática de festivos públicos.

#### Cambios en `/app/projects/page.tsx`

- Reemplaza el `<input type="text">` de región por un `<select>` con las 19 CCAA oficiales más la opción "Sin región definida".
- `data-testid="select-region"` en el selector.
- Columna "Región" en la tabla de proyectos muestra un badge azul (`data-testid="region-badge"`) cuando hay región configurada.
- El botón "Editar" proyecto ahora es accesible para `SUPER_ADMIN` y `PROJECT_ADMIN` (antes solo `SUPER_ADMIN`).
- `handleSelectProject` guarda `{ id, name, region }` en `localStorage["activeProject"]`.

#### Opciones disponibles

19 CCAA: Andalucía, Aragón, Asturias, Baleares, Canarias, Cantabria, Castilla-La Mancha, Castilla y León, Cataluña, Extremadura, Galicia, La Rioja, Madrid, Murcia, Navarra, País Vasco, Valencia, Ceuta, Melilla.

---

### 2. Carga automática de festivos por CCAA (Tarea 2)

**Requisito**: RF-17.2 — El sistema debe poder cargar automáticamente los festivos del mes activo desde una API externa, filtrando por la región del proyecto.

#### Nueva API `/api/holidays/public`

**Archivo**: `app/api/holidays/public/route.ts`

```
GET /api/holidays/public?year=YYYY&region=Madrid
```

- Llama a `https://date.nager.at/api/v3/PublicHolidays/{year}/ES` con timeout de 5 segundos via `AbortController`.
- Mapea 19 nombres de CCAA a códigos ISO 3166-2:ES (`ES-MD`, `ES-CT`, etc.).
- Filtra por `counties` para devolver solo los festivos que aplican a la región solicitada (incluyendo festivos nacionales sin counties).
- Devuelve `[{ date: "YYYY-MM-DD", description: string }]`.
- Devuelve HTTP 503 si la API externa no responde (timeout) o falla.

#### Cambios en `components/schedule/prep-panel.tsx`

Nuevas props:

| Prop | Tipo | Descripción |
|------|------|-------------|
| `projectRegion` | `string \| null` | CCAA del proyecto activo |
| `projectId` | `string \| null` | ID del proyecto activo |
| `onAutoLoadHolidays` | `() => Promise<void>` | Handler de carga automática |
| `loadingHolidays` | `boolean` | Estado de carga |

En el paso "Festivos" (Paso 3):
- Si `projectRegion` está configurada: botón "Cargar festivos automáticamente" (`data-testid="btn-auto-load-holidays"`).
- Si no hay región: mensaje informativo (`data-testid="msg-no-region"`) con enlace a `/projects` (`data-testid="link-configure-region"`).

#### Cambios en `app/page.tsx`

- Estado `activeProjectRegion` inicializado desde `localStorage["activeProject"].region`.
- Listener de evento `activeProjectChanged` para sincronizar región al cambiar de proyecto.
- Función `handleAutoLoadHolidays()`:
  1. Llama a `/api/holidays/public?year=${year}&region=${region}`.
  2. Para cada festivo devuelto, llama a `POST /api/holidays` para registrarlo.
  3. Muestra toast de éxito o error.

---

### 3. Paginación y filtro por mes en historial de empleado (Tarea 3)

**Requisito**: RF-18 — El historial de cambios de turno debe ser paginado y filtrable por mes.

#### Cambios en `app/api/employees/[id]/history/route.ts`

- Parámetros de query: `?page=1&limit=20&month=YYYY-MM`.
- Respuesta extendida:

```json
{
  "data": [...],
  "pagination": { "page": 1, "limit": 20, "total": 116, "totalPages": 6 },
  "availableMonths": ["2026-05", "2026-04", ...]
}
```

- Acceso ampliado: ahora accesible para `SUPER_ADMIN` y `PROJECT_ADMIN` (antes solo `SUPER_ADMIN`).
- Filtrado eficiente con `Prisma.where` por mes cuando se especifica.

#### Cambios en `app/employees/[id]/history/page.tsx`

- Paginación completa con botones "← Anterior" (`data-testid="btn-prev-page"`) y "Siguiente →" (`data-testid="btn-next-page"`).
- Indicador de posición: `data-testid="pagination-info"` muestra "Página X de Y (N cambios totales)".
- `<select>` de filtro por mes (`data-testid="month-filter"`) con todas las opciones disponibles.
- Estado URL-less (React state) para página y mes seleccionado.

---

### 4. Actualización de página `/info` (Tarea 4)

**Requisito**: RF-19 — La página de ayuda debe reflejar toda la funcionalidad de la Fase 2.

#### Nuevas secciones para administradores (`SUPER_ADMIN` y `PROJECT_ADMIN`)

| Sección | Contenido |
|---------|-----------|
| Gestión de proyectos | Selector de región, aislamiento por proyecto |
| Preparar el cuadrante (4 pasos) | Explicación del flujo paso a paso |
| Festivos automáticos | Cómo usar la carga automática por CCAA |
| Preferencias de turno | Tipos M, T, J y comportamiento en generación |
| Orden de rotación nocturna | Configuración y reordenación drag&drop |

#### Secciones para todos los roles

| Sección | Contenido |
|---------|-----------|
| Tipos de turno | Los 10 tipos: M, T, N, MF, TF, NF, J, D, V, B |
| Cómo leer el cuadrante | Colores, contadores, exportación |

#### Sección exclusiva para empleados (`EMPLOYEE`)

| Sección | Contenido |
|---------|-----------|
| Tu turno actual | Cómo consultar asignaciones y historial |

---

### 5. Guía de despliegue en producción (Tarea 5)

**Archivo**: `docs/deployment.md`

Guía completa con 8 secciones:

1. **Requisitos del servidor**: Docker 24+, Compose 2+, 1 GB RAM, 5 GB disco, puertos 3000/5432.
2. **Variables de entorno**: Plantilla `.env.production` comentada con todos los campos necesarios.
3. **Primer despliegue**: Pasos step-by-step desde cero.
4. **Actualización sin downtime**: Proceso de actualización manteniendo el servicio activo.
5. **Backup y restore de PostgreSQL**: Comandos `pg_dump` / `pg_restore`.
6. **Troubleshooting**: 5 casos habituales (BD no arranca, `NEXTAUTH_SECRET`, CORS, etc.).
7. **Desarrollo local**: Setup rápido sin Docker.
8. **Scripts npm disponibles**: Todos los comandos del `package.json`.

---

## Tests E2E añadidos

| CP | Descripción | Estado |
|----|-------------|--------|
| CP-90 | Selector de región visible en edición; badge de región en listado de proyectos | ✅ |
| CP-91 | Botón "Cargar festivos" visible en Paso 3 cuando el proyecto tiene región | ✅ |
| CP-92 | Mensaje con enlace cuando el proyecto NO tiene región configurada | ✅ |
| CP-93 | Carga automática pre-rellena festivos del mes (mock de nager.at) | ✅ |
| CP-94 | Si la API externa falla (503), muestra toast y permite continuar | ✅ |
| CP-95 | Paginación del historial: página 1 → siguiente → número total correcto | ✅ |
| CP-96 | Filtro por mes en historial muestra solo registros del mes seleccionado | ✅ |
| CP-97 | `/info` muestra sección "Preparar el cuadrante" para PROJECT_ADMIN | ✅ |
| CP-98 | `/info` muestra sección "Tu turno actual" solo para EMPLOYEE | ✅ |

**Total**: 9/9 passing (aislamiento y suite completa).

---

## Correcciones de infraestructura de tests

### Coexistencia de servidores de dev y tests (Next.js 16)

**Problema**: Next.js 16 usa `.next/dev/lock` para detectar servidores en ejecución y rechaza arrancar un segundo servidor en el mismo directorio, impidiendo que Playwright arrancase el servidor de tests en puerto 3001 mientras el dev server estaba en puerto 3000.

**Solución**:

1. `next.config.ts`: `distDir: process.env.NEXT_DIST_DIR ?? ".next"` — permite usar un directorio de build distinto por variable de entorno.
2. `playwright.config.ts`: `webServer.env.NEXT_DIST_DIR = ".next-test"` — servidor de tests usa `.next-test/` como build dir.
3. `tests/e2e/global-setup.ts`: elimina `.next/dev/lock` antes de arrancar (capa de seguridad adicional).
4. `.gitignore`: añade `/.next-test/` para no commitear el build del servidor de tests.

---

## Métricas de calidad

| Métrica | Valor |
|---------|-------|
| Tests unitarios | 140/140 ✅ |
| Tests E2E Sprint 13 | 9/9 ✅ |
| Tests E2E anteriores (main) | Sin regresiones nuevas |
| Commits del sprint | 7 |
| Archivos modificados | 11 |
| Archivos nuevos | 2 (`/api/holidays/public/route.ts`, `sprint-13.spec.ts`) |

---

## Commits del sprint

```
62823e2 test: Sprint 13 E2E tests CP-90 to CP-98
6500b63 fix: remove duplicate content from /info help page
45e57e3 docs: complete deployment guide
e10e0a8 docs: update /info help page with Phase 2 content
e385400 feat: history pagination and month filter
8a4792d feat: auto-load public holidays by CCAA via nager.at
d622573 feat: region selector in project settings
```
