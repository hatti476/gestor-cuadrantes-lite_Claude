# Esfuerzo — Sprint 1: Autenticación y vista de cuadrante

**Período**: 2026-05-09  
**Estado**: Completado ✅  
**Commit**: `a05f59e` (acumulado hasta Sprint 3)

---

## Resumen de esfuerzo

| Rol | Tipo | Tiempo estimado | Tareas principales |
|-----|------|-----------------|-------------------|
| Project Manager (usuario) | Humano | ~1 h | Definición de RF-01..RF-11, aprobación de diseño de BD, validación de credenciales de prueba |
| Dev Agent (`new-feature`) | IA | ~3 h equiv. | Scaffold Next.js + NextAuth + Prisma, grid de cuadrante, header con badges de rol |
| QA Agent (`qa-tester`) | IA | ~1 h equiv. | Generación y ejecución de CP-01..CP-11, corrección de selector (FIX-01) |
| Doc Agent (`doc-writer`) | IA | — | No invocado este sprint |

> **Nota**: los tiempos de IA son equivalencias estimadas basadas en la complejidad
> de las tareas y el número de artefactos generados, no en tokens medidos.

---

## Detalle de tareas

| Tarea | Responsable | Tamaño | Interacciones PM | Resultado |
|-------|-------------|--------|-----------------|-----------|
| Scaffold Next.js 16 + TypeScript + Tailwind | Dev | L | 1 (aprobación stack) | ✅ |
| Schema Prisma: User, Employee, ShiftAssignment | Dev | M | 1 (revisión campos) | ✅ |
| NextAuth CredentialsProvider + JWT | Dev | M | 0 | ✅ |
| Middleware proxy.ts (redirección sin sesión) | Dev | S | 0 | ✅ |
| Grid de cuadrante (lectura) + paleta de colores | Dev | L | 1 (validación colores) | ✅ |
| Header con badge de rol | Dev | S | 0 | ✅ |
| Navegación de meses | Dev | S | 0 | ✅ |
| Seed inicial (usuarios + 216 turnos Mayo 2026) | Dev | S | 0 | ✅ |
| Tests E2E CP-01..CP-11 | QA | M | 0 | ✅ |
| Release notes Sprint 1 | Doc | S | 0 | ✅ |

---

## Interacciones del Project Manager

1. Definición del stack tecnológico (Next.js, Prisma SQLite, NextAuth, Tailwind).
2. Definición de roles: ADMIN y EMPLOYEE.
3. Validación de la paleta de colores de turno.
4. Aprobación del diseño del grid (días en columnas, empleados en filas).
5. Aprobación de credenciales de prueba para `.env.test`.

---

## Métricas de calidad del sprint

| Métrica | Valor |
|---------|-------|
| Tests unitarios al final del sprint | 0 (no se implementaron en S1) |
| Tests E2E al final del sprint | 11/11 ✅ |
| Bugs encontrados | 0 (1 fix de testabilidad: FIX-01) |
| Bugs resueltos en el sprint | — |
| Commits del sprint | ~3 |

---

## Datos de plataforma

- Tokens consumidos: N/A (no accesible desde el agente)
- Modelo utilizado: claude-sonnet-4-20250514
- Plataforma: GitHub Copilot Chat / VS Code
