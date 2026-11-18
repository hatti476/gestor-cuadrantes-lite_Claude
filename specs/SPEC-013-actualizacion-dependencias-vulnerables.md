# SPEC-013 — Actualización de dependencias con vulnerabilidades conocidas

## Metadatos

| Campo | Valor |
|-------|-------|
| ID | SPEC-013 |
| Tipo | chore |
| Estado | draft |
| Prioridad | alta (next-auth/next son críticos) |
| Agentes asignados | @orchestrator, @devlead, @security, @backend |
| Fecha de creación | 2026-11-18 |
| Sprint | Sprint-07 (candidata) |

---

## Descripción

`npm audit --omit=dev` sobre `main` (detectado durante la revisión de seguridad de
SPEC-012, no introducido por esa spec) reporta 10 vulnerabilidades: 4 críticas, 4 altas,
2 moderadas. Las críticas están en **`next-auth`, `@auth/prisma-adapter`
(→`@auth/core`) y `next`** — no son dependencias periféricas, son el framework y la
librería de autenticación de la app.

---

## Contexto y antecedentes

- No se tocó en Sprint-06 (SPEC-012) porque cambiar versiones de dependencias no estaba
  en el alcance pedido por el DM (6 hallazgos de UX/negocio) y un bump de Next.js merece
  su propio ciclo de pruebas, no colarse en un sprint de UI.
- Detalle completo en la memoria de proyecto `project_npm_audit_sprint7` (sesión Claude).

---

## Criterios de aceptación

### Parte A — `npm audit fix` (sin --force, bajo riesgo)
- [ ] AC-01: Aplicar `npm audit fix` para `@auth/core`, `next-auth`, `nanoid`, `uuid`,
  `source-map-js`, `baseline-browser-mapping`.
- [ ] AC-02: Suite completa (`npm run test:all`) sigue en verde tras el fix.
- [ ] AC-03: Login/logout, revalidación de sesión (SPEC-011) y permisos por rol
  verificados manualmente — `next-auth` es la librería de autenticación.

### Parte B — `next` 16.2.6 → 16.4.6 (requiere `--force`, revisión explícita)
- [ ] AC-04: Revisar el changelog de Next.js 16.3/16.4 en busca de breaking changes
  (especialmente App Router, Image Optimization, Server Actions — varios advisories
  tocan justo esas áreas).
- [ ] AC-05: Probar en especial: `/api/holidays/public` (fetch saliente a nager.at),
  cualquier uso de `next/image`, y el flujo completo de auth tras el bump.
- [ ] AC-06: Suite completa + smoke E2E en verde tras el bump.
- [ ] AC-07: Decisión explícita del DM/@devlead antes de fijar la nueva versión en
  `package.json` (no es un fix automático silencioso).

---

## Fuera de scope

- NO incluye vulnerabilidades en `devDependencies` (no auditadas aquí; revisar aparte si
  hace falta).
- NO incluye cambios de funcionalidad — solo versiones de dependencias.

---

## Notas técnicas para los agentes

- Separar la Parte A (segura, casi inmediata) de la Parte B (`next --force`, con su
  propio plan de pruebas) — no bloquear una por la otra.
- Confirmar versiones exactas en `package.json` antes de empezar (`next: "16.2.6"`,
  `next-auth: "^4.24.14"`, `@auth/prisma-adapter: "^2.11.2"` a fecha de esta spec).

---

## Historial de cambios

| Fecha | Autor | Cambio |
|-------|-------|--------|
| 2026-11-18 | @security | Creación del draft a partir de `npm audit` durante la revisión de SPEC-012. Pendiente de que el DM la priorice para Sprint-07. |
