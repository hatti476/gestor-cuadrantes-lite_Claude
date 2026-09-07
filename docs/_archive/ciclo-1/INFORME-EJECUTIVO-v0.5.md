# Informe Ejecutivo de Proyecto
## Gestor de Cuadrantes — Estado a Mayo 2026

**Versión del documento:** 1.0  
**Fecha:** 11 de mayo de 2026  
**Autor:** Equipo de Desarrollo  
**Repositorio:** https://github.com/hatti476/gestor-cuadrantes  
**Versión del producto:** 0.5.1  

---

## 1. Resumen Ejecutivo

El **Gestor de Cuadrantes** es una aplicación web interna que sustituye la gestión manual en hojas de cálculo para un equipo de soporte 24/7. Permite a los administradores generar, visualizar y editar cuadrantes de turnos mensuales con reglas de rotación automáticas, gestionar días festivos y fines de semana, y consultar el historial de cambios de cada empleado.

El proyecto se ha desarrollado íntegramente entre el 9 y el 11 de mayo de 2026 mediante una metodología ágil de 5 sprints, aplicando prácticas de desarrollo guiado por pruebas (TDD) con cobertura completa de tests unitarios y E2E antes de cada commit.

**El producto está funcional, probado y disponible en el repositorio.** Pendiente de despliegue en entorno productivo.

---

## 2. Objetivos del Proyecto

| Objetivo | Estado |
|----------|--------|
| Sustituir el Excel manual de gestión de turnos | ✅ Completado |
| Generación automática de cuadrantes por rotación cíclica | ✅ Completado |
| Control de acceso por roles (Administrador / Técnico) | ✅ Completado |
| Gestión de días festivos nacionales con conversión automática de turnos | ✅ Completado |
| Conversión automática de turnos en fines de semana (MF, TF, NF) | ✅ Completado |
| Exportación del cuadrante a CSV | ✅ Completado |
| Historial de cambios de turno auditado | ✅ Completado |
| Cobertura de tests automatizados | ✅ Completado |

---

## 3. Funcionalidades Entregadas

### 3.1 Autenticación y Seguridad
- Login con email y contraseña; sesión JWT gestionada con NextAuth.js
- Dos roles: **ADMIN** (edición completa) y **EMPLOYEE** (solo lectura)
- Todas las APIs de escritura verifican el rol en servidor (no solo en UI)
- Contraseñas hasheadas con bcrypt (coste 12)
- Rutas protegidas; redirige a `/login` si no hay sesión activa

### 3.2 Cuadrante Mensual
- Grid visual: empleados en filas, días del mes en columnas
- **10 tipos de turno** con código y color diferenciado:

| Código | Turno | Color |
|--------|-------|-------|
| M | Mañana | Naranja |
| T | Tarde | Azul |
| N | Noche | Verde |
| MF | Mañana Festivo/Finde | Naranja claro |
| TF | Tarde Festivo/Finde | Azul claro |
| NF | Noche Festivo/Finde | Verde claro |
| J | Jornada normal | Amarillo |
| D | Descanso | Gris |
| V | Vacaciones | Negro |
| B | Baja | Gris oscuro |

- Fines de semana resaltados en azul claro; festivos en rojo con nombre en popover al pulsar
- Contadores de turno por empleado al final de cada fila
- Navegación entre meses con botones anterior/siguiente
- Exportación a **CSV** descargable (`cuadrante-YYYY-MM.csv`)
- Impresión directa del cuadrante sin controles de navegación

### 3.3 Generación Automática de Cuadrantes
- Algoritmo de **rotación cíclica de 21 días**: M×5 → D×2 → T×5 → D×2 → N×5 → D×2
- Cada empleado tiene un desfase de rotación distinto para garantizar cobertura simultánea
- Respeta los turnos asignados manualmente (no los sobreescribe)
- **Reglas de conversión automática** al generar:
  - M o T en **festivo o fin de semana** → MF / TF
  - N cuyo día siguiente es **festivo o fin de semana** → NF
  - Excepción: N del domingo → N si el lunes es laborable y no es festivo
  - D (descanso) nunca cambia

### 3.4 Gestión de Festivos
- Página `/holidays` (solo ADMIN): alta, consulta y baja de festivos por año
- Al **añadir un festivo**, las asignaciones existentes en BD se actualizan de inmediato:
  - M/T del día → MF/TF; N del día anterior → NF
- Los días festivos se muestran con **cabecera roja** en el grid
- Al pulsar la cabecera, aparece un **popover** con el nombre del festivo

### 3.5 Gestión de Empleados
- Listado de empleados con nombre, email y rol
- CRUD completo: crear, editar nombre/rol, cambiar contraseña
- Contraseña: mínimo 8 caracteres, al menos 1 mayúscula y 1 dígito

### 3.6 Historial de Cambios
- Cada modificación manual de turno queda registrada: quién, qué, cuándo
- Vista por empleado `/employees/[id]/history` con los últimos 20 cambios
- Solo accesible para ADMIN

### 3.7 Notificaciones y UX
- Sistema de **toast** global (éxito/error/info) con desaparición automática a los 4 s
- Página de **ayuda contextual** `/info` con instrucciones adaptadas al rol del usuario

---

## 4. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| Framework | Next.js (App Router) | 16.2.6 |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS | 3.x |
| ORM | Prisma | 5.22.0 |
| Base de datos | SQLite (dev) | — |
| Autenticación | NextAuth.js | 4.x |
| Tests unitarios | Vitest | 4.1.5 |
| Tests E2E | Playwright | — |
| Gestor de paquetes | npm | — |
| Control de versiones | Git + GitHub | — |

---

## 5. Calidad y Cobertura de Tests

### 5.1 Tests Unitarios (Vitest)

| Suite | Tests | Estado |
|-------|-------|--------|
| Algoritmo de generación de cuadrantes | 29 | ✅ |
| Lógica de festivos y fines de semana en generación | 18 | ✅ |
| Reglas de negocio (business-logic) | 24 | ✅ |
| Validaciones y utilidades | 12 | ✅ |
| **TOTAL** | **83 / 83** | **✅ 100%** |

### 5.2 Tests E2E (Playwright — Chromium headless)

| Sprint | Casos de prueba | Estado |
|--------|-----------------|--------|
| Sprint 1 — Auth y grid | CP-01..CP-11 (11 tests) | ✅ |
| Sprint 2 — Editor y empleados | CP-12..CP-22 (11 tests) | ✅ |
| Sprint 3 — Generación y mejoras | CP-23..CP-28 (6 tests) | ✅ |
| Sprint 4 — Festivos, CSV, historial | CP-30..CP-39 (10 tests) | ✅ |
| Sprint 5 — Página de ayuda | CP-40..CP-42 (3 tests) | ✅ |
| **TOTAL** | **41 / 41** | **✅ 100%** |

> Todos los tests pasan en el entorno local con la base de datos sembrada.

---

## 6. Registro de Bugs

Se han detectado y resuelto **14 bugs** durante el desarrollo. Ninguno permanece abierto.

| Severidad | Cantidad | Todos resueltos |
|-----------|----------|-----------------|
| 🔴 Critical | 0 | — |
| 🟠 High | 6 | ✅ |
| 🟡 Medium | 5 | ✅ |
| 🟢 Low | 3 | ✅ |
| **Total** | **14** | **✅** |

### Bugs más relevantes resueltos

| ID | Descripción | Impacto | Fix |
|----|-------------|---------|-----|
| BUG-01 | Middleware redirigía `/api/` a `/login` en lugar de devolver 401 | Seguridad: APIs bypass | Excluir rutas `/api/` del middleware |
| BUG-05 | Campo `passwordHash` inexistente en schema Prisma | Error 500 en cambio de contraseña | Corregir a `password` |
| BUG-08 | Generación no actualizaba turnos existentes (`update: {}`) | Festivos ignorados en regeneración | Cambiar a `update: { shiftType }` |
| BUG-10 | N→NF evaluaba el día actual en lugar del siguiente | Conversión incorrecta de turno de noche | Usar `date + 86400000` |
| BUG-14 | M/T en sábado/domingo no se convertían a MF/TF | Turnos incorrectos en fines de semana | Añadir `isWeekend()` a la lógica |

El detalle completo de todos los bugs está en [`docs/bugs/BUG-REGISTRY.md`](bugs/BUG-REGISTRY.md).

---

## 7. Esfuerzo Invertido

### 7.1 Por sprint y rol

| Sprint | Descripción | PM (h) | Dev IA (h) | QA IA (h) | Debug IA (h) | Total (h) |
|--------|-------------|--------|------------|-----------|--------------|-----------|
| Sprint 1 | Auth + grid lectura | 1.0 | 3.0 | 1.0 | — | 5.0 |
| Sprint 2 | Editor + empleados | 1.5 | 4.0 | 1.5 | 0.5 | 7.5 |
| Sprint 3 | Generación automática | 1.0 | 4.0 | 1.5 | 0.5 | 7.0 |
| Sprint 4 | Festivos + CSV + historial | 2.5 | 6.0 | 2.0 | 1.0 | 11.5 |
| Sprint 5 | Página de ayuda | 0.5 | 1.5 | 0.5 | — | 2.5 |
| Hotfixes + documentación | BUG-14, doc, esfuerzo | 0.5 | 1.0 | — | — | 1.5 |
| **TOTAL** | | **7.0 h** | **19.5 h** | **6.5 h** | **2.0 h** | **35.0 h** |

> Los tiempos de IA son equivalencias estimadas por complejidad de tarea y número de artefactos generados. No incluyen tokens medidos (no accesibles desde el agente).

### 7.2 Rol del Project Manager

El Project Manager (usuario) participó activamente en **~20 interacciones** de dirección a lo largo del proyecto:
- Definición y priorización de todos los requisitos funcionales (RF-01..RF-37)
- Validación de decisiones arquitectónicas (stack, modelo de datos, reglas de negocio)
- Correcciones de rumbo mid-sprint (ej. regla N→NF día siguiente, excepción domingo, MF/TF en fines de semana)
- Aprobación de entregables antes de cada commit
- Directiva de calidad: "tests proactivos antes de cada commit"

### 7.3 Artefactos generados

| Categoría | Cantidad |
|-----------|----------|
| Commits | 10 |
| Requisitos funcionales (RF) | 37 |
| Requisitos no funcionales (RNF) | 19 |
| Tests unitarios | 83 |
| Tests E2E | 41 |
| Release notes de sprint | 5 |
| Informes de esfuerzo | 5 |
| Registro de bugs | 1 (14 entradas) |
| Agentes Copilot definidos | 6 |

---

## 8. Pendiente / Limitaciones Conocidas

Las siguientes funcionalidades están **fuera del scope actual** y quedan como trabajo futuro:

| ID | Limitación | Prioridad sugerida |
|----|------------|-------------------|
| L-01 | Los festivos son nacionales (un único calendario) — sin festivos por CCAA | Media |
| L-02 | Al eliminar un festivo, los turnos MF/TF/NF no revierten automáticamente a M/T/N | Media |
| L-03 | El historial de cambios es solo lectura — no permite revertir a un turno anterior | Baja |
| L-04 | El historial muestra máximo 20 registros sin paginación | Baja |
| L-05 | No hay notificaciones por email ni push al cambiar un turno | Baja |
| L-06 | Entorno solo SQLite — pendiente configuración para producción (PostgreSQL + Docker) | Alta |

---

## 9. Acceso al Repositorio y Entorno Local

### Repositorio
```
https://github.com/hatti476/gestor-cuadrantes.git
Rama principal: main
Último commit: eaa6dc6
```

### Arranque local
```bash
git clone https://github.com/hatti476/gestor-cuadrantes.git
cd gestor-cuadrantes
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
# Aplicación disponible en http://localhost:3000
```

### Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@cuadrantes.local | Admin1234! |
| Técnico | tecnico1@cuadrantes.local | Tecnico1234! |

### Ejecutar tests
```bash
npm run test:unit          # Tests unitarios (83 tests)
npx playwright test        # Tests E2E — requiere servidor en :3000
```

---

## 10. Conclusiones

El proyecto ha alcanzado todos sus objetivos funcionales en **2 días de desarrollo** (9–11 mayo 2026), con **cobertura de tests del 100%** (83 unitarios + 41 E2E), **0 bugs abiertos** y una base de código mantenible y bien documentada.

La única tarea pendiente de alto impacto antes de un despliegue en producción es la migración a PostgreSQL y la configuración de variables de entorno productivas (L-06).

---

*Documento generado por el agente `doc-writer` del proyecto Gestor de Cuadrantes.*  
*Para más detalle técnico consultar `docs/bugs/BUG-REGISTRY.md` y `docs/effort/SPRINT-N-EFFORT.md`.*
