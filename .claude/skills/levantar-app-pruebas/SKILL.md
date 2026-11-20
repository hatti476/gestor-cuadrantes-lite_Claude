---
name: levantar-app-pruebas
description: Levanta la app en localhost:3100 en modo desarrollo con la base de datos sincronizada y los usuarios de prueba precargados (seed). Usar antes de empezar un nuevo sprint para pruebas manuales, o cuando el usuario pida "levantar la app", "probar manualmente" o "usuarios de prueba".
---

# Levantar app para pruebas manuales

Flujo que el usuario repite antes de cada sprint para probar manualmente
la app con datos conocidos.

## Pasos

1. **Liberar procesos colgados de sesiones anteriores**:
   ```bash
   npm run dev:stop
   ```
   Esto detiene cualquier `next dev` / `next-server` de este proyecto
   que haya quedado en ejecución (de pruebas manuales anteriores, builds
   de verificación, etc.), en cualquier puerto salvo el 3000. Es la
   causa más habitual de que el 3100 aparezca ocupado.

   **El puerto 3000 es intocable**: ahí vive el contenedor Docker de
   producción (`docker-compose.prod.yml`), que corre de forma permanente
   y aislado en su propio namespace — `dev:stop` no lo detecta ni lo
   afecta, y este flujo tampoco debe intentar liberarlo ni matarlo. Si
   necesitas pararlo alguna vez, es `docker compose -f
   docker-compose.prod.yml down` (fuera de este flujo), nunca `kill`.

2. **Comprobar el puerto 3100** (por si queda algo que el script no
   detectó, p. ej. un proceso de otro proyecto):
   ```bash
   ss -ltnp 2>/dev/null | grep 3100
   ```
   - Si hay un proceso ocupándolo, identificar qué es (`ps -p <pid>`,
     `ls -la /proc/<pid>/cwd`) antes de matarlo (`kill <pid>`) — no
     asumir que siempre es seguro.

3. **Sincronizar el esquema y generar el cliente Prisma**:
   ```bash
   npx prisma db push
   ```

4. **Sembrar usuarios y datos de prueba**:
   ```bash
   npx tsx prisma/seed.ts
   ```
   Esto crea/actualiza (upsert, es idempotente):
   - `admin@cuadrantes.local` / `Admin1234!` (ADMIN)
   - `tecnico1..7@cuadrantes.local` / `Tecnico1234!` (TECNICO, con Employee)
   - `viewer@cuadrantes.local` / `Viewer1234!` (VIEWER)
   - Festivos nacionales 2026 y turnos de mayo 2026 de ejemplo

5. **Levantar el servidor de desarrollo** (NO usar `.next/standalone`,
   eso es un build de producción que puede estar desactualizado y usar
   una BD distinta):
   ```bash
   npm run dev > /tmp/nextdev.log 2>&1 &
   disown
   sleep 6
   tail -n 40 /tmp/nextdev.log
   ```

6. **Verificar**:
   ```bash
   curl -s -o /dev/null -w "login page: %{http_code}\n" http://localhost:3100/login
   ```
   Debe devolver `200`.

7. Reportar al usuario la URL (`http://localhost:3100`) y la tabla de
   credenciales de prueba.

## Al terminar la sesión de pruebas

Cuando el usuario acabe de probar manualmente, recordarle (o ejecutar si
lo pide) `npm run dev:stop` para no dejar el servidor colgado hasta la
siguiente sesión.

## Notas

- `prisma/seed.ts` usa `upsert`, así que ejecutarlo varias veces es seguro
  y no duplica datos.
- La BD es SQLite local (`prisma/dev.db`, `DATABASE_URL="file:./dev.db"`
  en `.env`), relativa al cwd del proceso — distinta de la del contenedor
  de producción (`prod.db` en su propio volumen Docker), así que sembrar
  aquí no afecta en absoluto a los datos reales de producción.
