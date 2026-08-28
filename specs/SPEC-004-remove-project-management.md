# SPEC-004 — Eliminar Gestión de Proyectos (UI + API)

## Metadatos

| Campo | Valor |
|-------|-------|
| ID | SPEC-004 |
| Tipo | feature |
| Estado | ready |
| Prioridad | media |
| Agentes asignados | @orchestrator, @qa, @backend, @frontend, @devlead |
| Fecha de creación | 2026-08-27 |
| Sprint | Sprint-01 |

---

## Descripción

Eliminar toda la superficie de gestión de proyectos: página `/projects`, endpoints `/api/projects/*`, componente `ProjectSelector`, selector del `Header` y pestaña de proyectos en `/admin`. Limpiar la persistencia de proyecto activo en `localStorage`. Las queries al cuadrante y empleados dejan de requerir `projectId`.

---

## Contexto y antecedentes

Tras la migración de esquema (SPEC-002) y el refactor de permisos (SPEC-003), la capa multi-proyecto ya no existe en BD ni en lógica de permisos. Ahora hay que limpiar la UI y API que la exponían.

---

## Historia de usuario

Como **usuario final**,
quiero **una interfaz simplificada sin selector de proyectos**,
para **acceder directamente al cuadrante único del sistema**.

---

## Criterios de aceptación

- [ ] AC-01: Directorio `app/projects/` eliminado completamente
- [ ] AC-02: Directorio `app/api/projects/` eliminado completamente
- [ ] AC-03: Componente `components/projects/project-selector.tsx` eliminado
- [ ] AC-04: `components/layout/header.tsx` — eliminado `ProjectSelector` y referencias a proyecto activo
- [ ] AC-05: `app/admin/page.tsx` — eliminada pestaña "Proyectos"; mantener solo gestión de usuarios
- [ ] AC-06: `app/page.tsx` — eliminada lógica de `projectId` activo en `localStorage`; limpiados parámetros `projectId` en llamadas a `/api/schedules` y `/api/employees`
- [ ] AC-07: Eliminados hooks/utils que lean `localStorage` para proyecto activo
- [ ] AC-08: **RF-02**: Sin concepto de proyecto en ninguna capa visible
- [ ] AC-09: Motor de generación (`lib/schedules/monthly-schedule-engine.ts`) **no se toca** en este sprint
- [ ] AC-10: Endpoints `/api/schedules` y `/api/employees` funcionan sin `projectId`
- [ ] AC-11: Navegar a `/projects` retorna 404
- [ ] AC-12: Header no muestra selector de proyecto
- [ ] AC-13: `/admin` muestra únicamente pestaña de usuarios
- [ ] AC-14: Cuadrante principal carga empleados y turnos correctamente sin `projectId`
- [ ] AC-15: `npm run ci:check` — 0 imports rotos referenciando rutas/modelos eliminados

---

## Referencias visuales

- Captura del Header sin selector de proyecto: `./assets/SPEC-004-header-sin-proyecto.png`
- Captura de /admin solo con pestaña usuarios: `./assets/SPEC-004-admin-solo-usuarios.png`

---

## Flujo del usuario

1. Eliminar `app/projects/` y `app/api/projects/`
2. Eliminar `components/projects/project-selector.tsx`
3. Limpiar `Header.tsx` — quitar ProjectSelector
4. Limpiar `app/admin/page.tsx` — quitar pestaña proyectos
5. Limpiar `app/page.tsx` — quitar localStorage projectId, limpiar query params
6. Verificar: `/projects` → 404, Header limpio, `/admin` solo usuarios, cuadrante carga
7. Ejecutar `npm run ci:check`

---

## Fuera de scope

- No tocar motor de generación de cuadrantes
- No modificar permisos (hecho en SPEC-003)
- No tocar tests (se hace en SPEC-005)

---

## Notas técnicas para los agentes

- Módulo probable: `app/projects/`, `app/api/projects/`, `components/projects/`, `components/layout/header.tsx`, `app/admin/page.tsx`, `app/page.tsx`
- Dependencias externas: ninguna
- Riesgo de regresión: **medio** — roturas de import si no se limpian bien

---

## Casos de test sugeridos

- Test E2E: `tests/e2e/navigation/no-projects.spec.ts`
  - `@smoke` `/projects` retorna 404
  - `@smoke` Header no contiene selector de proyecto
  - `@smoke` Panel `/admin` no muestra pestaña de proyectos

---

## Historial de cambios

| Fecha | Autor | Cambio |
|-------|-------|--------|
| 2026-08-27 | @orchestrator | Creación de la spec |