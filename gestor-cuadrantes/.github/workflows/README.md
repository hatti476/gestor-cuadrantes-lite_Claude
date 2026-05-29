# CI/CD Workflows

## ci.yml — Quality Gates (PR)
Ejecuta en cada PR a `main` y también en push a `main`.
Bloquea el merge si falla.
Checks: TypeScript + ESLint + Unit tests + Build.

## e2e-smoke.yml — Smoke E2E (PR)
Ejecuta en cada PR a `main`.
Bloquea el merge si falla.
Cubre los tests críticos etiquetados con `@smoke`.

## e2e-nightly.yml — Full E2E (nightly)
Ejecuta a las 02:00 UTC cada día sobre `main`.
No bloquea merge. Crea issue si hay fallos.
Cubre la suite E2E completa.

## Cómo ejecutar localmente
`npm run test:unit`          # Tests unitarios
`npm run test:e2e:smoke`     # Solo smoke tests
`npm run test:e2e`           # Suite completa
`npm run ci:check`           # TypeScript + ESLint
