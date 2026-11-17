# SPEC-011 — Revalidar rol y estado del usuario en cada petición

## Metadatos

| Campo | Valor |
|-------|-------|
| ID | SPEC-011 |
| Tipo | bug (seguridad) |
| Estado | done |
| Prioridad | alta |
| Agentes asignados | @backend, @security, @qa |
| Fecha de creación | 2026-11-17 |
| Sprint | Sprint-05 |

---

## Descripción

Hallazgo H-13 de SPEC-010. La sesión es un JWT de NextAuth en el que el rol se guarda
**solo al iniciar sesión**. Nada lo vuelve a comprobar en la base de datos, así que si un
ADMIN degrada a alguien, desactiva a un técnico o borra un usuario, esa persona conserva
sus permisos hasta que el token caduca (30 días, valor por defecto de NextAuth).

---

## Contexto y antecedentes

- `app/api/auth/[...nextauth]/route.ts`: el callback `jwt` solo copia `role` cuando llega
  `user`, es decir, en el login.
- En NextAuth 4, cada `getServerSession` (lo usan todas las rutas `/api`) y cada
  `GET /api/auth/session` (lo usa `useSession` en el cliente) decodifica el JWT y ejecuta el
  callback `jwt` (`node_modules/next-auth/core/routes/session.js`). **Solo
  `GET /api/auth/session` reescribe la cookie**: en App Router, `getServerSession` recibe un
  `res` con `setCookie() {}` (`next-auth/next/index.js`). Las API ven siempre el estado de BD;
  `proxy.ts`, que lee la cookie con `getToken`, va con retraso hasta que el cliente consulta
  la sesión (al montar la página o al recuperar el foco).
- Decisión del DM (2026-11-17): comprobar en BD en cada petición. Con unos 20 usuarios, una
  consulta por petición por clave primaria es despreciable.

---

## Criterios de aceptación

- [x] AC-01: El callback `jwt` relee de BD el rol y `employee.active` del usuario del token en
  cada ejecución (no solo en el login).
- [x] AC-02: Si el rol ha cambiado, la sesión refleja el rol nuevo en la siguiente petición.
- [x] AC-03: Si el usuario no existe o su empleado está desactivado, la sesión queda sin rol:
  todas las comprobaciones de permisos devuelven `false` (las API responden 403) y
  `proxy.ts` trata el token como sin sesión (redirige a `/login`).
- [x] AC-04: Si la consulta a BD falla, se deniega (sin rol) y se registra el error; no se
  mantiene el rol antiguo.
- [x] AC-05: Tests unitarios de la lógica de revalidación y del caso "deshabilitado" en
  `proxy.ts`; test E2E: un TECNICO desactivado con sesión abierta deja de poder leer el
  cuadrante en su siguiente petición.
- [x] AC-06: `tsc`, `vitest` y la suite E2E en verde.
- [x] AC-07 (revisión): el estado del empleado solo deshabilita a usuarios con rol TECNICO
  (`isAccountDisabled`), tanto en el login como en la revalidación. Un TECNICO ascendido a
  ADMIN/VIEWER (cuyo Employee queda inactivo por el cambio de rol) conserva el acceso (CP-185).
- [x] AC-08 (revisión): `GET /api/schedules/snapshot` exige un rol válido.

---

## Fuera de scope

- NO incluye: reducir `maxAge` de la sesión ni cambiar a sesiones en BD.
- NO incluye: que `proxy.ts` consulte la BD por sí mismo. La barrera de seguridad son las
  API (que usan `getServerSession`); todas las páginas son de cliente y no cargan datos en el
  servidor, así que lo que `proxy.ts` deje pasar con la cookie desfasada no expone nada. Efecto
  de UX aceptado: un usuario recién ascendido a ADMIN que abre `/admin` directamente puede ser
  redirigido a `/` la primera vez.

---

## Notas técnicas para los agentes

- Lógica en `lib/auth/session-claims.ts` (función pura salvo la consulta a Prisma).
- `types/next-auth.d.ts`: `JWT.role` pasa a opcional y se añade `disabled?: boolean`.
- Riesgo de regresión: medio — afecta a todas las peticiones autenticadas.

---

## Historial de cambios

| Fecha | Autor | Cambio |
|-------|-------|--------|
| 2026-11-17 | @security | Creación a partir de H-13 (SPEC-010), con la decisión del DM. |
| 2026-11-17 | @devlead / @security | Revisión: ALTO (ascender a un TECNICO lo expulsaba, también en el login de SPEC-010 H-12) corregido con `isAccountDisabled`. Corregida la premisa sobre la reescritura de la cookie. `GET /api/schedules/snapshot` exige rol. Tests de los callbacks y aserciones de CP-183/184 más específicas. |
