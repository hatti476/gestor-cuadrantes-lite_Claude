# Gestor de Cuadrantes — Contexto de Desarrollo

## Descripción
Aplicación web para gestionar los cuadrantes de turnos de un equipo de soporte 
técnico 24/7 compuesto por 8 personas (7 técnicos + 1 responsable). Sustituye 
un proceso manual en Excel, permitiendo generar cuadrantes mensuales 
automáticamente según reglas de rotación definidas, con posibilidad de edición 
manual posterior.

Diseñada para funcionar inicialmente en local y ser desplegable en servidor 
corporativo sin cambios de código. Desarrollada de forma incremental siguiendo 
metodología agile.

## Usuarios y Casos de Uso
- **Usuarios objetivo**: Responsable del equipo (admin) y 7 técnicos (empleados)
- **Caso de uso principal**: El admin genera el cuadrante de un mes con un clic,
  el sistema aplica las reglas de rotación automáticamente, el admin ajusta 
  manualmente las celdas que no encajen, y los técnicos consultan su turno 
  desde cualquier equipo de la empresa.
- **Casos de uso secundarios**:
  - Consultar cuadrante de meses anteriores
  - Modificar turno de un empleado en un día concreto
  - Gestionar el orden de rotación de noches
  - Ver contadores de turnos por empleado en el mes

## Funcionalidades MVP

### Must Have
- [ ] Autenticación con roles: admin y empleado
- [ ] Vista mensual tipo grid (columnas = días, filas = empleados)
- [ ] Celdas con código de turno (M/T/N/J/D/V/B) y color diferenciado
- [ ] Generación automática del cuadrante mensual según reglas de negocio
- [ ] Edición manual celda a celda (solo admin)
- [ ] Fila de contadores por empleado (nº de M, T, N, D, V, B en el mes)
- [ ] Navegación entre meses
- [ ] Gestión de empleados: altas, bajas y orden de rotación de noches
- [ ] Asignación de packs de fin de semana (Sáb+Dom) como unidad

### Nice to Have (v2)
- [ ] Turnos especiales de fin de semana: MF, TF, NF con marcado visual diferente
- [ ] Cálculo de remuneración extra por turnos de fin de semana y festivos
- [ ] Branding corporativo EPAM (colores y logo)
- [ ] Gestión de festivos nacionales/locales
- [ ] Exportación a Excel/PDF
- [ ] Notificaciones al empleado cuando cambia su turno

### Fuera de Scope
- [x] App móvil nativa
- [x] Integración con sistemas de RRHH externos
- [x] Gestión de nóminas o cálculo salarial completo
- [x] Multiempresa o multi-equipo (de momento un solo equipo)

## Tipos de Turno
| Código | Nombre | Horario | Color |
|--------|--------|---------|-------|
| M | Mañana | 7:00–15:00 | Naranja `#FF9800` |
| T | Tarde | 15:00–23:00 | Azul `#2196F3` |
| N | Noche | 23:00–7:00 | Azul oscuro `#1A237E` |
| J | Jornada normal | 9:00–18:00 (L-V) | Verde `#4CAF50` |
| D | Descanso | — | Gris claro `#F5F5F5` |
| V | Vacaciones | — | Verde claro `#8BC34A` |
| B | Baja | — | Rosa `#F48FB1` |
| MF | Mañana Finde (v2) | 7:00–15:00 sáb/dom | Naranja oscuro `#E65100` |
| TF | Tarde Finde (v2) | 15:00–23:00 sáb/dom | Azul oscuro `#0D47A1` |
| NF | Noche Finde (v2) | 23:00–7:00 sáb/dom | Índigo `#311B92` |

## Reglas de Negocio para Auto-generación
1. **Bloque de noches**: `2D + 7N (Vie 23h → Jue 23h) + 3D` = 12 días por bloque
2. **Rotación de noches**: orden configurable entre los 7 técnicos, cíclico
3. **Cobertura mínima laborable**: mínimo 2 personas en M y 2 en T de L-V
4. **Consistencia semanal**: un empleado no cambia de M a T (ni viceversa) dentro de la misma semana
5. **Máximo consecutivo**: 5 días seguidos de M o T → obligatorio 2D de descanso (configurable)
6. **Fines de semana**: pack Sáb+Dom asignado como unidad, 1 persona, turno M o T
7. **Equidad**: distribución equilibrada de M y T entre empleados a lo largo del mes
8. **Noches y fines de semana**: máximo 1 persona por turno siempre

## Stack Técnico
| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend + Backend | Next.js 14 (App Router) | Full-stack en un solo framework, máximo soporte de Copilot |
| Estilos | Tailwind CSS | Utility-first, fácil personalización de colores de turno |
| Base de datos (local) | SQLite + Prisma ORM | Sin instalación adicional, funciona en cualquier PC |
| Base de datos (producción) | PostgreSQL + Prisma ORM | Mismos modelos, cambio solo de connection string |
| Autenticación | NextAuth.js | Gestión de sesiones y roles integrada con Next.js |
| Infraestructura | Docker + Docker Compose | Portabilidad garantizada local → servidor corporativo |
| Lenguaje | TypeScript | Tipado estático, reduce errores en lógica de turnos |

## Arquitectura de Alto Nivel

El algoritmo de generación vive en `/lib/scheduler/` completamente desacoplado 
de la UI, lo que permite testearlo de forma independiente.

## Decisiones Técnicas Clave
- **Next.js App Router sobre Pages Router**: más moderno, mejor soporte futuro,
  Server Components reducen JS en cliente
- **Prisma sobre consultas SQL directas**: los modelos tipados previenen errores 
  en la lógica de rotación y facilitan la migración SQLite→PostgreSQL
- **SQLite en desarrollo**: elimina la necesidad de instalar PostgreSQL localmente,
  reduce fricción para empezar
- **Docker Compose desde el inicio**: aunque en local no es estrictamente necesario,
  garantiza que el despliegue en servidor corporativo sea idéntico al entorno de dev

## Estructura de Sprints
| Sprint | Objetivo | Features |
|--------|----------|----------|
| 1 | Base del proyecto | Setup, Docker, login, vista cuadrante (solo lectura con datos mock) |
| 2 | Edición manual | Edición celda a celda, guardado en BD, navegación entre meses |
| 3 | Auto-generación | Algoritmo de rotación de noches + relleno de laborables |
| 4 | Empleados y contadores | CRUD empleados, orden rotación, fila de contadores |
| 5 | Fines de semana | Asignación de packs Sáb+Dom, reglas de cobertura |
| 6 | Pulido y despliegue | Tests, Docker producción, documentación de despliegue |

## Restricciones y Requisitos No Funcionales
- **Rendimiento**: uso interno, máx. ~20 usuarios concurrentes. Sin requisitos especiales
- **Seguridad**: credenciales en variables de entorno, sesiones con NextAuth, 
  rutas de edición protegidas por rol admin
- **Escalabilidad**: diseñado para un equipo, arquitectura permite multi-equipo en v3
- **Cumplimiento**: datos de empleados (nombres, turnos). Considerar GDPR si se 
  despliega en servidor corporativo con datos reales
- **Disponibilidad**: servidor interno empresa, SLA definido por infraestructura corporativa

## Convenciones del Proyecto
- Idioma del código: **inglés** (variables, funciones, componentes, comentarios técnicos)
- Idioma de negocio: **español** (comentarios de reglas de turno, mensajes de UI)
- Estilo de commits: **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`)
- Estructura de ramas: **trunk-based** (main + feature branches de corta vida)
- Componentes: nomenclatura PascalCase, ficheros kebab-case

## Glosario
| Término | Definición |
|---------|-----------|
| Cuadrante | Tabla mensual que asigna un turno a cada empleado cada día |
| Bloque de noches | Secuencia fija: 2D + 7N + 3D asignada a un técnico en rotación |
| Pack de finde | Sábado y domingo asignados juntos al mismo empleado y turno |
| Rotación | Orden cíclico en que los técnicos se van alternando el bloque de noches |
| Cobertura mínima | Garantía de al menos 2 personas en M y 2 en T cada día laborable |
| Admin | Responsable del equipo con permisos de edición |
| Empleado | Técnico con permisos solo de visualización |