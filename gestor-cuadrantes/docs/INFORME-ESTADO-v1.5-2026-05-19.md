# Informe de Estado del Proyecto - Gestor de Cuadrantes

**Fecha del informe**: 2026-05-19
**Version funcional documentada**: 1.5
**Sprint actual**: Sprint 15 - Saneamiento tecnico y documental
**Ultimo sprint cerrado**: Sprint 14 - Estabilizacion
**Rama objetivo**: `feature/sprint-15-quality-baseline`
**Commit base**: `45ffa92 fix: Sprint 14 - BUG-32..BUG-37 + docs cierre`

---

## 1. Resumen ejecutivo

El proyecto esta en una posicion estable para planificar los siguientes sprints. Sprint 14 cerro la version 1.5 corrigiendo los bugs detectados tras Sprint 13, sin introducir funcionalidad nueva. Sprint 15 se dedica a cerrar riesgos tecnicos y documentales antes de volver a tocar reglas de negocio.

La aplicacion ya cubre el flujo principal: autenticacion, gestion multiproyecto, gestion de empleados, generacion automatica del cuadrante, edicion manual, festivos, historial, contadores, permisos por rol y ayuda contextual. No hay bugs funcionales abiertos en el registro actual.

Sprint 15 queda enfocado en esta pasada de saneamiento tecnico y documental: lint limpio, README y requisitos actualizados, E2E alineados a CP-01..CP-98, versionado npm en 1.5.0 y build desacoplado de Google Fonts. El refinamiento del algoritmo y la robustez adicional de la API externa de festivos se posponen a Sprint 16.

---

## 2. Estado de producto

| Area | Estado | Observaciones |
|------|--------|---------------|
| Autenticacion y sesiones | Estable | NextAuth con JWT, roles globales `SUPER_ADMIN`/`USER` y membresias por proyecto. |
| Cuadrante mensual | Estable | Grid mensual, navegacion por meses, colores de turno, contadores y fila propia resaltada. |
| Edicion manual | Estable | Admin y Project Admin pueden editar segun permisos; celdas manuales bloqueadas para generacion cuando aplica. |
| Generacion automatica | Funcional, foco Sprint 16 | Bloques de noche, cobertura minima, preferencias M/T/J, fines de semana y festivos. Ultimos bugs de algoritmo corregidos; el refinamiento de equidad queda pospuesto. |
| Empleados | Estable | CRUD, soft-delete, reactivacion, cambio de clave, preferencia de turno y scoping por proyecto. |
| Proyectos | Estable | Multiproyecto, miembros, region CCAA, orden de rotacion nocturna configurable. |
| Festivos | Estable | Gestion manual y carga automatica por CCAA via nager.at. |
| Historial | Estable | Paginado y filtrable por mes desde Sprint 13. |
| Exportacion | Basica | CSV e impresion/PDF via navegador. Excel/PDF avanzado queda como posible evolucion. |
| Ayuda y documentacion funcional | Actualizada | `/info`, `README.md` y `docs/REQUIREMENTS.md` quedan alineados con version 1.5. |

---

## 3. Estado tecnico

| Capa | Tecnologia / estado |
|------|---------------------|
| Framework | Next.js 16.2.6 con App Router y TypeScript |
| UI | Tailwind CSS |
| Base de datos dev | SQLite + Prisma 5.22 |
| Base de datos prod | PostgreSQL 16 en Docker Compose |
| Autenticacion | NextAuth.js 4.24 |
| Tests unitarios | Vitest |
| Tests E2E | Playwright |
| Despliegue | `Dockerfile.prod`, `docker-compose.prod.yml`, manifiestos `k8s/` |
| API externa | nager.at para festivos publicos por CCAA |

### Arquitectura relevante

- El nucleo de generacion vive en `lib/schedules/generate.ts`.
- Las reglas auxiliares de cuadrantes estan en `lib/schedules/business-logic.ts` y `lib/schedules/types.ts`.
- Los permisos estan centralizados en `lib/auth/permissions.ts`.
- Los colores de turno estan centralizados en `lib/constants/shift-colors.ts`.
- La UI principal se concentra en `app/page.tsx` y `components/schedule/`.

### Modelo de datos principal

Entidades clave actuales:

- `User`: credenciales, rol global y relacion con empleado/membresias.
- `Project`: proyecto, region CCAA y `nightRotationOrder`.
- `ProjectMember`: rol por proyecto.
- `Employee`: usuario asociado, `rotationOrder`, `shiftPreference`, `active`, `projectId`.
- `ShiftAssignment`: turno por empleado/fecha/proyecto, con marca `manual`.
- `Holiday`: festivos.
- `ShiftChangeLog`: historial de cambios manuales.
- `Schedule`: registro de generacion por mes y año.

---

## 4. Estado de calidad

### Validaciones ejecutadas en este informe

| Comando | Resultado | Nota |
|---------|-----------|------|
| `npm run test:unit` | PASS | 146/146 tests unitarios. |
| `npm run build` | PASS | Compilacion Next.js OK sin dependencia de `next/font/google`. |
| `npx playwright test --list` | PASS | Detecta 98 tests E2E en 13 archivos. No ejecuta navegadores. |
| `npx playwright test tests/e2e/sprint-3.spec.ts -g "CP-29" --reporter=list` | PASS | Verifica el contador de turnos especiales MF, TF y NF. |
| `npm run lint` | PASS | ESLint limpio; `.next-test/**` queda excluido. |

### Cobertura documentada

| Suite | Estado documentado |
|-------|--------------------|
| Unitarios | 146/146 al cierre de Sprint 14. Confirmado en este informe. |
| E2E | CP-01..CP-98 declarados en Playwright tras recuperar CP-29. |

### Hallazgos de calidad relevantes

1. El registro de bugs indica 37 bugs totales, 37 resueltos y 0 abiertos.
2. Los fixes de Sprint 14 estan cubiertos principalmente por tests unitarios de regresion en `tests/unit/scheduler/generate.test.ts`.
3. No existe suite E2E especifica de Sprint 14.
4. Sprint 14 no añade suite E2E propia; sus regresiones de algoritmo quedan cubiertas por unit tests y testing manual.
5. El build usa fuentes del sistema para evitar dependencia de red durante compilacion.

---

## 5. Sprint 14 cerrado

Sprint 14 fue un sprint de estabilizacion post-Sprint 13. No agrego funcionalidad nueva; cerro los defectos detectados en testing manual.

| Bug | Severidad | Estado | Area |
|-----|-----------|--------|------|
| BUG-32 | High | Fixed | Proyecto obsoleto en `localStorage`. |
| BUG-33 | High | Fixed | Sustituto de noches recibia dos bloques consecutivos. |
| BUG-34 | Medium | Fixed | Dia 31 oculto por `overflow-x-hidden`. |
| BUG-35 | High | Fixed | Preferencia M/T ignorada en MF/TF. |
| BUG-36 | High | Fixed | Maximo de 5 dias roto al mezclar M/T con MF/TF. |
| BUG-37 | High | Fixed | Pack Sab+Dom no era indivisible. |

Resultado: version funcional 1.5 sin bugs abiertos conocidos.

---

## 6. Riesgos y deuda tecnica

| Riesgo / deuda | Estado | Resolucion / siguiente paso |
|----------------|--------|-----------------------------|
| Lint no limpio | Cerrado | `npm run lint` pasa en verde. |
| `.next-test/**` no ignorado por ESLint | Cerrado | Añadido a `globalIgnores` en `eslint.config.mjs`. |
| Documentacion desalineada | Cerrado | `README.md`, `docs/REQUIREMENTS.md` y este informe quedan actualizados a version 1.5. |
| Discrepancia E2E 98 vs 97 | Cerrado | Recuperado CP-29; Playwright declara 98 tests. |
| Dependencia de Google Fonts en build | Cerrado | Eliminado `next/font/google`; se usan fuentes del sistema. |
| `package.json` version `0.1.0` | Cerrado | `package.json` y `package-lock.json` alineados a `1.5.0`. |
| Algoritmo concentrado en `generate.ts` | Pendiente Sprint 16 | Introducir harness de simulacion y modularizar solo si reduce riesgo sin cambiar comportamiento. |
| API externa de festivos | Pendiente Sprint 16 | Mantener tolerancia a fallo; valorar cache/backfill si produccion lo necesita. |

---

## 7. Sprint 15 - Saneamiento tecnico y documental

Objetivo: **cerrar los riesgos detectados antes de planificar nuevas reglas funcionales**.

### Alcance

Estado: completado el 2026-05-19.

- `npm run lint` queda en verde.
- CP-29 recuperado; `npx playwright test --list` lista CP-01..CP-98.
- `README.md` y `docs/REQUIREMENTS.md` quedan alineados a version 1.5.
- Build desacoplado de Google Fonts.
- `package.json` y `package-lock.json` quedan alineados a version `1.5.0`.

### Criterios de salida Sprint 15

- `npm run lint` en verde.
- `npm run test:unit` en verde.
- `npm run build` en verde.
- E2E CP-29 ejecutado en verde.
- Documentacion de estado lista para planning.

---

## 8. Recomendacion para Sprint 16

Objetivo sugerido: **refinamiento medible del algoritmo de generacion y robustez de festivos externos**.

### Linea 1 - Motor de simulacion del algoritmo

- Crear escenarios deterministas de 3, 6 y 12 meses.
- Medir equidad M/T, fines de semana, festivos, noches, descansos y desviacion por empleado.
- Generar salida comparable para detectar regresiones de reparto.
- Cubrir casos limite: vacaciones en noches, empleados con `J`, equipos con capacidad reducida, festivos consecutivos, cambio de mes y cambio de año.

### Linea 2 - Mejoras de equidad

- Formalizar hard constraints vs soft constraints.
- Mejorar reparto de fines de semana/festivos para evitar concentraciones.
- Revisar la equidad M/T a largo plazo, no solo dentro del mes.
- Mantener la consistencia semanal M/T salvo cuando cobertura minima lo impida.

### Linea 3 - Observabilidad del generador

- Opcional pero recomendable: devolver diagnosticos internos del generador en modo test/debug.
- Ejemplos: motivo de asignacion, restricciones bloqueantes, empleados descartados por descanso/noches/preferencia.
- Esto ayudara a explicar cuadrantes al responsable y a depurar futuras incidencias.

### Linea 4 - Robustez de festivos externos

- Mantener el comportamiento actual de tolerancia a fallo.
- Valorar cache local por region/año para reducir dependencia de nager.at.
- Definir estrategia de backfill manual si la API externa no responde.
- Cubrir errores de red y respuestas incompletas con tests.

### Criterios de salida propuestos Sprint 16

- Unit tests del algoritmo ampliados con escenarios multi-mes.
- Metricas de equidad documentadas antes/despues.
- Riesgos de API externa documentados y mitigados si se decide cache/backfill.
- `npm run test:unit` en verde.
- Build de produccion en verde.
- Lint limpio o deuda residual explicitamente documentada y aceptada.
- Cualquier ajuste del algoritmo con caso de regresion asociado.

---

## 9. Ideas para sprints posteriores

### Sprint 17 - Experiencia operativa

- Vista personal del tecnico: proximos turnos, resumen mensual y cambios recientes.
- Dashboard de cobertura diaria: deficits M/T/MF/TF, ausencias, bloqueos y alertas.
- Mejoras de exportacion: Excel real y PDF maquetado.
- Flujo de solicitud/aprobacion de vacaciones si se quiere pasar de edicion manual a proceso formal.

### Sprint 18 - Produccion y mantenimiento

- Pipeline CI con lint, unit, build y subset E2E.
- Politica de backups y restore validada en entorno PostgreSQL.
- Versionado y release notes automatizables.
- Documentacion de operacion para servidor corporativo.
- Estrategia para fuentes locales y dependencias externas en builds sin internet.

### Sprint 19 - Robustez avanzada

- Auditoria ampliada de cambios por proyecto.
- Alertas por reglas incumplidas o cobertura insuficiente.
- Validaciones de seguridad sobre todas las rutas de escritura.

---

## 10. Fuentes revisadas

- `.github/context.md`
- `.github/copilot/context.md`
- `docs/sprint-14-release-notes.md`
- `docs/sprint-13-release-notes.md`
- `docs/bugs/BUG-REGISTRY.md`
- `docs/REQUIREMENTS.md`
- `docs/deployment.md`
- `package.json`
- `prisma/schema.prisma`
- `playwright.config.ts`
- `eslint.config.mjs`
- `Dockerfile.prod`
- `docker-compose.prod.yml`
- `tests/unit/**`
- `tests/e2e/**`

---

## 11. Decision recomendada para planning

Cerrar Sprint 15 como rama de saneamiento tecnico y documental. Planificar Sprint 16 con foco principal en algoritmo y robustez de festivos externos, ya con metricas, tests y documentacion alineadas como punto de partida.
