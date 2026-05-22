# Informe de Estado del Proyecto — Gestor de Cuadrantes

**Fecha del informe**: 2026-05-22  
**Versión funcional documentada**: 1.7  
**Sprint actual**: Sprint 17 — correcciones del algoritmo II  
**Último sprint cerrado**: Sprint 17 — correcciones del algoritmo II  
**Rama objetivo**: `feature/sprint-17-algorithm-fixes-ii`  
**Commit base**: `e0b4fe6 docs: Sprint 17 release notes`

---

## 1. Resumen ejecutivo

Sprint 17 cierra las tres correcciones planificadas del algoritmo de generación que no pudieron resolverse en Sprint 16. La aplicación mantiene su posición estable en producción: 227/227 tests unitarios pasando, 115 casos E2E declarados (CP-01..CP-115) y cero bugs abiertos en el registro.

Los cambios de Sprint 17 son exclusivamente algorítmicos y no alteran la interfaz de usuario ni el modelo de datos. La corrección más crítica es `crossMonthRestDates`, que previene que la fase de reparación de cobertura en modo relajado convierta días de post-descanso nocturno cross-month a turnos de trabajo, incumpliendo la norma de 3 días de descanso obligatorio tras el bloque de noches. El campo `coverageWarnings` se añade a la respuesta de la API de generación para facilitar la revisión manual cuando el descanso forzado HARD reduce la cobertura M/T de un día laborable.

---

## 2. Estado de producto

| Área | Estado | Observaciones |
|------|--------|---------------|
| Autenticación y sesiones | Estable | NextAuth con JWT, roles globales `SUPER_ADMIN`/`USER` y membresías por proyecto. |
| Cuadrante mensual | Estable | Grid mensual, navegación por meses, colores de turno, contadores y fila propia resaltada. |
| Edición manual | Estable | Admin y Project Admin pueden editar según permisos; celdas manuales bloqueadas para generación cuando aplica. |
| Generación automática | Estable tras Sprint 17 | Bloques de noche, continuidad cross-month, cobertura mínima, preferencias M/T/J, paquetes Sáb+Dom extendibles a lunes festivo, descanso forzado HARD, `coverageWarnings`. |
| Panel de preparación | Estable | Toggle V/D, bajas B, festivos automáticos por CCAA, botón Generar contextual. |
| Complementos económicos | Estable | Tabla MF/TF/N/NF, extras navideños MN/TN/NN a 126,50 €, leyenda de tarifas. |
| Empleados | Estable | CRUD, soft-delete, reactivación, cambio de clave, preferencia de turno y scoping por proyecto. |
| Proyectos | Estable | Multiproyecto, miembros, región CCAA, orden de rotación nocturna configurable. |
| Festivos | Estable | Gestión manual y carga automática por CCAA vía nager.at. |
| Historial | Estable | Paginado y filtrable por mes. |
| Exportación | Básica | CSV e impresión/PDF vía navegador. Excel/PDF avanzado queda como posible evolución. |
| Ayuda y documentación funcional | Actualizada | `/info`, `README.md`, `docs/REQUIREMENTS.md` y este informe alineados con versión 1.7. |

---

## 3. Estado técnico

| Capa | Tecnología / estado |
|------|---------------------|
| Framework | Next.js 16.2.6 con App Router y TypeScript |
| UI | Tailwind CSS |
| Base de datos dev | SQLite + Prisma 5.22 |
| Base de datos prod | PostgreSQL 16 en Docker Compose |
| Autenticación | NextAuth.js 4.24 |
| Tests unitarios | Vitest — 227/227 ✅ |
| Tests E2E | Playwright — CP-01..CP-115 declarados |
| Despliegue | `Dockerfile.prod`, `docker-compose.prod.yml`, manifiestos `k8s/` |
| API externa | nager.at para festivos públicos por CCAA |

### Arquitectura relevante

- El núcleo de generación vive en `lib/schedules/generate.ts`.
- Las reglas auxiliares de cuadrantes están en `lib/schedules/business-logic.ts` y `lib/schedules/types.ts`.
- Los permisos están centralizados en `lib/auth/permissions.ts`.
- Los colores de turno están centralizados en `lib/constants/shift-colors.ts`.
- La UI principal se concentra en `app/page.tsx` y `components/schedule/`.

---

## 4. Métricas de calidad acumuladas

| Sprint | Tests unitarios | Tests E2E | Bugs abiertos |
|--------|----------------|-----------|---------------|
| 14 | 146 ✅ | CP-01..CP-98 (98) | 0 |
| 15 | 146 ✅ | CP-01..CP-98 (98) | 0 |
| 16 | 217 ✅ | CP-01..CP-109 (109) | 0 |
| 17 | 227 ✅ | CP-01..CP-115 (115) | 0 |

---

## 5. Riesgos activos

| Riesgo | Severidad | Mitigación |
|--------|-----------|-----------|
| Equidad M/T a largo plazo no garantizada | Media | El algoritmo aplica best-effort semanal; la equidad multi-mes queda como Sprint 18. |
| Suite E2E no ejecutada completa en CI | Media | Los E2E se validan manualmente por sprint; pendiente pipeline CI/CD. |
| Festivos externos (nager.at) sin cache | Baja | Si la API falla en producción, el usuario puede gestionar festivos manualmente. |

---

## 6. Próximos pasos (Sprint 18)

- Equidad M/T a largo plazo: reparto equilibrado de fines de semana y festivos entre empleados.
- Harness de simulación multi-mes para detectar desequilibrios del algoritmo antes de llegar a producción.
- Evaluar pipeline CI/CD con GitHub Actions (lint + unit + build + subset E2E).
