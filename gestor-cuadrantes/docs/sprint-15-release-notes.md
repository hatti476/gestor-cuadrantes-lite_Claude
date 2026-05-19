# Sprint 15 — Release Notes

**Fecha**: 19/05/2026
**Versión**: 1.5
**Rama**: `feature/sprint-15-quality-baseline`
**Estado**: ✅ Completado

---

## Resumen ejecutivo

Sprint 15 consolida la línea base técnica y documental antes de iniciar nuevos
cambios funcionales. Tras el cierre de Sprint 14, se decide convertir la higiene
previa en un sprint propio porque incluye cambios de código, recuperación de
cobertura E2E, ajuste de build y actualización de documentación.

No se modifican reglas funcionales del algoritmo. El refinamiento de generación
y la robustez adicional de la API externa de festivos se posponen explícitamente
a Sprint 16.

---

## Objetivos cerrados

| Objetivo | Estado |
|----------|--------|
| Dejar ESLint limpio | ✅ |
| Excluir artefactos `.next-test/**` del lint | ✅ |
| Recuperar la cobertura declarada CP-01..CP-98 | ✅ |
| Verificar CP-29 como E2E real | ✅ |
| Evitar dependencia de Google Fonts en build | ✅ |
| Alinear README, requisitos e informe de estado | ✅ |
| Alinear versionado npm a `1.5.0` | ✅ |

---

## Cambios realizados

### 1. Baseline de lint y limpieza de código

**Archivos principales**:

- `eslint.config.mjs`
- `components/layout/header.tsx`
- `app/page.tsx`
- `app/employees/page.tsx`
- `app/employees/[id]/history/page.tsx`
- `app/holidays/page.tsx`
- `app/projects/page.tsx`
- `lib/schedules/generate.ts`
- `types/next-auth.d.ts`

Se elimina deuda de lint acumulada: imports no usados, estados no utilizados,
variables sobrantes en tests y warnings de hooks. También se añade `.next-test/**`
a los ignores globales de ESLint para evitar que artefactos generados ensucien la
validación del proyecto.

---

### 2. Build sin dependencia de Google Fonts

**Archivos**:

- `app/layout.tsx`
- `app/globals.css`

Se elimina `next/font/google` para evitar que el build dependa de resolución o
descarga de fuentes externas. La aplicación pasa a usar fuentes del sistema,
manteniendo una pila sans/mono estable para entornos offline o restringidos.

---

### 3. Recuperación de CP-29 en Playwright

**Archivo**: `tests/e2e/sprint-3.spec.ts`

Se añade de nuevo el caso CP-29 para verificar que la tabla de contadores muestra
los turnos especiales `MF`, `TF` y `NF`.

Resultado:

| Métrica | Valor |
|---------|-------|
| Tests E2E declarados | CP-01..CP-98 |
| Total Playwright listado | 98 tests en 13 archivos |
| CP-29 ejecutado | ✅ Passing |

---

### 4. Documentación alineada

**Archivos**:

- `README.md`
- `docs/REQUIREMENTS.md`
- `docs/deployment.md`
- `docs/INFORME-ESTADO-v1.5-2026-05-19.md`

La documentación queda actualizada con el estado real de la rama:

- Sprint 15 se define como saneamiento técnico y documental.
- Sprint 16 queda reservado para refinamiento del algoritmo y robustez de festivos externos.
- Requisitos actualizados a versión documental `2.7.0`.
- Estado de calidad documentado con lint, unitarios, build, listado E2E y CP-29.
- Guía de despliegue alineada con Next.js 16.

---

### 5. Versionado npm

**Archivos**:

- `package.json`
- `package-lock.json`

El paquete pasa de `0.1.0` a `1.5.0`, alineando el versionado npm con la versión
funcional documentada del producto.

---

## Riesgos cerrados

| Riesgo | Resolución |
|--------|------------|
| Lint no limpio | `npm run lint` queda en verde |
| `.next-test/**` evaluado por ESLint | Excluido en `eslint.config.mjs` |
| Discrepancia E2E 98 vs 97 | CP-29 recuperado |
| Build dependiente de Google Fonts | Sustituido por fuentes del sistema |
| Documentación desalineada | README, requisitos e informe actualizados |
| `package.json` en `0.1.0` | Versionado alineado a `1.5.0` |

---

## Riesgos pospuestos

| Riesgo | Decisión |
|--------|----------|
| Algoritmo concentrado en `lib/schedules/generate.ts` | Sprint 16 |
| Robustez adicional de API externa de festivos | Sprint 16 |

La decisión evita mezclar cambios de saneamiento con cambios funcionales del
generador, reduciendo el riesgo de regresiones antes de abordar el siguiente
incremento.

---

## Validaciones

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | ✅ Passing |
| `npm run test:unit` | ✅ 146/146 |
| `npm run build` | ✅ Passing |
| `npx playwright test --list` | ✅ 98 tests |
| `npx playwright test tests/e2e/sprint-3.spec.ts -g "CP-29" --reporter=list` | ✅ Passing |

---

## Métricas finales

| Métrica | Valor |
|---------|-------|
| Tests unitarios | 146/146 ✅ |
| Tests E2E declarados | CP-01..CP-98 ✅ |
| Bugs abiertos conocidos | 0 |
| Versión npm | 1.5.0 |
| Tipo de sprint | Saneamiento técnico y documental |

---

## Próximo sprint

**Sprint 16** — Refinamiento del algoritmo y robustez de festivos externos:

- Harness de simulación multi-mes para medir equidad.
- Métricas de reparto M/T, fines de semana, festivos, noches y descansos.
- Diagnósticos internos del generador en modo test/debug.
- Evaluación de cache/backfill para la API externa de festivos.
- Tests de regresión asociados a cualquier ajuste funcional.
