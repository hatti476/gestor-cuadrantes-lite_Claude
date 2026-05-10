# Sprint 5 — Release Notes
**Proyecto:** Gestor de Cuadrantes  
**Versión:** 0.5.0  
**Fecha:** Mayo 2026  
**Estado:** Entregado ✅

---

## Objetivo del Sprint

Añadir una sección de ayuda contextual que muestre al usuario instrucciones de uso adaptadas a su rol (administrador o técnico).

---

## Requisitos implementados

### Funcionales
| ID | Requisito | Estado |
|----|-----------|--------|
| RF-35 | Página `/info` accesible desde la cabecera para todos los usuarios autenticados | ✅ |
| RF-36 | El contenido de `/info` se adapta al rol: el admin ve instrucciones de gestión; el técnico ve instrucciones de consulta | ✅ |
| RF-37 | La página muestra el email y rol del usuario en la cabecera de la guía | ✅ |

### No Funcionales
| ID | Requisito | Estado |
|----|-----------|--------|
| RNF-18 | La página `/info` redirige a `/login` si el usuario no está autenticado | ✅ |
| RNF-19 | Tests E2E Playwright para los flujos de la guía (CP-40 a CP-42) | ✅ |

---

## Funcionalidades entregadas

### Página de ayuda `/info`
- Enlace «Ayuda» en la barra de navegación del header (visible para todos los usuarios autenticados)
- Contenido organizado en secciones con icono, título y lista de puntos
- **Vista Administrador** — 5 secciones:
  - Gestión del cuadrante (navegación, asignación manual, generación automática, CSV, impresión)
  - Tipos de turno (descripción de los 10 códigos)
  - Gestión de festivos (añadir/eliminar, conversión automática M→MF, N→NF víspera, popover)
  - Gestión de empleados (editar, cambiar contraseña, historial)
  - Notificaciones (toasts de éxito/error)
- **Vista Técnico** — 3 secciones:
  - Consulta del cuadrante (navegación, tipos de turno, festivos, impresión)
  - Tipos de turno
  - Tu cuenta (email, cierre de sesión, contacto con admin para cambio de contraseña)

---

## Casos de prueba para QA

### CP-40 — El admin ve la guía de administrador
1. Iniciar sesión como admin y pulsar «Ayuda» en la cabecera
2. **Resultado esperado:** Se muestra la página `/info` con secciones «Gestión del cuadrante», «Gestión de festivos» y «Gestión de empleados»; aparece el rol «Administrador»

### CP-41 — El técnico ve la guía de empleado
1. Iniciar sesión como técnico y pulsar «Ayuda» en la cabecera
2. **Resultado esperado:** Se muestra «Consulta del cuadrante» y «Tu cuenta»; NO aparecen «Gestión de festivos» ni «Gestión de empleados»; aparece el rol «Técnico»

### CP-42 — `/info` redirige a login si no autenticado
1. Acceder a `/info` sin sesión iniciada
2. **Resultado esperado:** Redirección automática a `/login`

---

## Entorno de pruebas

```
URL:        http://localhost:3000
Node.js:    v24.x
Next.js:    16.2.6
BD:         SQLite (dev.db en raíz del proyecto)
```
