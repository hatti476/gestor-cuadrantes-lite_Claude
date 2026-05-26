# Informe de Estado del Proyecto — Gestor de Cuadrantes

**Fecha del informe**: 2026-05-26  
**Versión funcional documentada**: 1.9  
**Sprint actual**: Sprint 19 — Gestión de usuarios/proyectos (RBAC) + correcciones de algoritmo  
**Último sprint cerrado**: Sprint 19  
**Rama objetivo**: `feature/sprint-19-user-project-management`  
**Commit base**: `84c5eab docs: fix BUG-REGISTRY index`

---

## 1. Resumen ejecutivo

Sprint 19 entrega dos bloques de trabajo: la sección de administración unificada `/admin` con gestión completa de usuarios y proyectos bajo un modelo RBAC de cuatro roles, y tres correcciones al algoritmo de generación de cuadrantes que evitaban transiciones de turno inválidas y acumulación de fines de semana consecutivos.

La aplicación acumula 296 tests unitarios pasando y 141 casos E2E declarados (CP-01..CP-141). El registro de bugs refleja 40 bugs totales, todos resueltos. El algoritmo de generación es el área de mayor complejidad activa y se ha identificado como candidato a revisión explícita en Sprint 20.

---

## 2. Estado de producto

| Área | Estado | Observaciones |
|------|--------|---------------|
| Autenticación y sesiones | Estable | NextAuth con JWT; roles globales `SUPER_ADMIN`/`USER` y membresías por proyecto (`PROJECT_ADMIN`/`EMPLOYEE`/`SUPER_VIEWER`). |
| Administración `/admin` | Nuevo en Sprint 19 | Pestaña Usuarios (CRUD, desactivar, cambio clave, asignación proyectos) y Proyectos (CRUD, miembros inline). Solo `SUPER_ADMIN`. |
| Cuadrante mensual | Estable | Grid mensual, navegación por meses, colores de turno, contadores y fila propia resaltada. |
| Edición manual | Estable | `SUPER_ADMIN` y `PROJECT_ADMIN` editan según permisos; `SUPER_VIEWER` solo lectura. |
| Generación automática | Estable | Bloques de noche, continuidad cross-month, cobertura mínima, preferencias M/T/J, paquetes Sáb+Dom, descanso forzado HARD, `coverageWarnings`. Corregidos BUG-38/39/40 en Sprint 19. |
| Panel de preparación | Estable | Visible para `SUPER_ADMIN` y `PROJECT_ADMIN`; oculto para `SUPER_VIEWER`. |
| Complementos económicos | Estable | Tabla MF/TF/N/NF, extras navideños MN/TN/NN a 126,50 €, leyenda de tarifas. |
| Empleados | Estable | CRUD integrado en `/admin`; ruta `/employees` redirige a `/admin`. |
| Proyectos | Estable | Multiproyecto, miembros, región CCAA, orden de rotación nocturna configurable. |
| Festivos | Estable | Gestión manual y carga automática por CCAA vía nager.at. |
| Historial | Estable | Paginado y filtrable por mes. |
| Exportación | Básica | CSV e impresión/PDF vía navegador. |
| Ayuda y documentación funcional | Actualizada | `/info`, `README.md`, `docs/REQUIREMENTS.md` y este informe alineados con versión 1.9. |

---

## 3. Estado técnico

| Capa | Tecnología / estado |
|------|---------------------|
| Framework | Next.js 16.2.6 con App Router y TypeScript |
| UI | Tailwind CSS |
| Base de datos dev | SQLite + Prisma 5.22 |
| Base de datos prod | PostgreSQL 16 en Docker Compose |
| Autenticación | NextAuth.js 4.24 |
| Tests unitarios | Vitest — 296/296 ✅ |
| Tests E2E | Playwright — CP-01..CP-141 declarados |
| Despliegue | `Dockerfile.prod`, `docker-compose.prod.yml`, manifiestos `k8s/` |
| API externa | nager.at para festivos públicos por CCAA |

### Arquitectura relevante

- El núcleo de generación vive en `lib/schedules/generate.ts` (~2 300 líneas).
- Las reglas auxiliares están en `lib/schedules/business-logic.ts` y `lib/schedules/types.ts`.
- Los permisos están centralizados en `lib/auth/permissions.ts`.
- Los colores de turno están centralizados en `lib/constants/shift-colors.ts`.
- La UI principal se concentra en `app/page.tsx` y `components/schedule/`.
- La administración se concentra en `app/admin/page.tsx` y las rutas `app/api/admin/`.

---

## 4. Métricas de calidad acumuladas

| Sprint | Tests unitarios | Tests E2E | Bugs abiertos |
|--------|----------------|-----------|---------------|
| 14 | 146 ✅ | CP-01..CP-98 (98) | 0 |
| 15 | 146 ✅ | CP-01..CP-98 (98) | 0 |
| 16 | 217 ✅ | CP-01..CP-109 (109) | 0 |
| 17 | 227 ✅ | CP-01..CP-115 (115) | 0 |
| 18 | 257 ✅ | CP-01..CP-128 (128) | 0 |
| 19 | 296 ✅ | CP-01..CP-141 (141) | 0 |

---

## 5. Riesgos activos

| Riesgo | Severidad | Mitigación |
|--------|-----------|-----------|
| `generate.ts` supera 2 300 líneas sin documentación interna | Media | Planificado para Sprint 20: revisión explícita del algoritmo con refactoring moderado y documentación de secciones. |
| Feb 2026 con 8 empleados puede producir 3 fines de semana consecutivos | Baja | Matemáticamente inevitable cuando 2 empleados están en noches y 4 tienen la ventana de trabajo agotada. Documentado y aceptado en el test (≤3). |
| Suite E2E no ejecutada completa en CI | Media | Los E2E se validan manualmente por sprint; pendiente pipeline CI/CD. |
| Festivos externos (nager.at) sin cache | Baja | Si la API falla en producción, el usuario puede gestionar festivos manualmente. |

---

## 6. Próximos pasos (Sprint 20)

- **Revisión explícita del algoritmo**: refactoring moderado de `generate.ts`, documentación de secciones clave, posibles optimizaciones de rendimiento.
- **Nuevos bugs identificados por el PM**: pendiente de definición en el kick-off del sprint.
- **Nueva funcionalidad**: pendiente de definición en el kick-off del sprint.
- Evaluar pipeline CI/CD con GitHub Actions (lint + unit + build + subset E2E).
