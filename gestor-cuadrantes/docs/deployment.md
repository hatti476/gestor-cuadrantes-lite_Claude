# Guía de Despliegue — Gestor de Cuadrantes

> Última actualización: Sprint 13 (2026-05-14)

---

## Índice

1. [Requisitos del servidor](#1-requisitos-del-servidor)
2. [Variables de entorno de producción](#2-variables-de-entorno-de-producción)
3. [Primer despliegue](#3-primer-despliegue)
4. [Actualización sin downtime](#4-actualización-sin-downtime)
5. [Backup y restauración de PostgreSQL](#5-backup-y-restauración-de-postgresql)
6. [Troubleshooting](#6-troubleshooting)
7. [Desarrollo local](#7-desarrollo-local)
8. [Scripts npm disponibles](#8-scripts-npm-disponibles)

---

## 1. Requisitos del servidor

| Componente | Versión mínima |
|-----------|---------------|
| Docker | 24.0 |
| Docker Compose | 2.0 |
| RAM | 1 GB |
| Disco | 5 GB |

**Puertos que deben estar libres:**
- `3000` — aplicación Next.js
- `5432` — PostgreSQL

---

## 2. Variables de entorno de producción

Crea el fichero `.env.production` en la raíz del proyecto (nunca subas este fichero al repositorio):

```ini
# URL de conexión a PostgreSQL
# Formato: postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/BASE_DE_DATOS
# En Docker Compose, HOST es el nombre del servicio (db)
DATABASE_URL=postgresql://gestor:CAMBIA_ESTO@db:5432/gestor_cuadrantes

# URL base de la aplicación (sin barra final)
# Debe coincidir con el dominio real o la IP del servidor
NEXTAUTH_URL=https://tu-dominio.com

# Secreto para firmar los tokens de sesión de NextAuth
# Genera uno seguro con: openssl rand -base64 32
NEXTAUTH_SECRET=CAMBIA_ESTO_CON_openssl_rand_base64_32

# Usuario de PostgreSQL (debe coincidir con POSTGRES_USER del servicio db)
POSTGRES_USER=gestor

# Contraseña de PostgreSQL (usa una contraseña fuerte, mínimo 20 caracteres)
POSTGRES_PASSWORD=CAMBIA_ESTO_POR_CONTRASEÑA_FUERTE

# Nombre de la base de datos de producción
POSTGRES_DB=gestor_cuadrantes
```

> **Generar un secreto seguro:** `openssl rand -base64 32`

---

## 3. Primer despliegue

```bash
# 1. Clonar el repositorio
git clone https://github.com/hatti476/gestor-cuadrantes.git
cd gestor-cuadrantes

# 2. Copiar y editar las variables de entorno ANTES de continuar
cp .env.example .env.production
# Edita .env.production con los valores reales (ver sección 2)

# 3. Construir y lanzar los contenedores en segundo plano
docker-compose -f docker-compose.prod.yml up -d

# 4. Aplicar las migraciones de base de datos
docker exec gestor-app npx prisma migrate deploy

# 5. Sembrar los datos iniciales (usuarios de prueba y configuración base)
docker exec gestor-app npm run db:seed
```

La aplicación estará disponible en `http://IP-DEL-SERVIDOR:3000`  
(o en el dominio configurado en `NEXTAUTH_URL`).

---

## 4. Actualización sin downtime

```bash
# 1. Obtener el código actualizado
git pull

# 2. Reconstruir solo el contenedor de la app (sin tocar la BD)
docker-compose -f docker-compose.prod.yml build app

# 3. Reiniciar solo la app sin afectar el resto de servicios
docker-compose -f docker-compose.prod.yml up -d --no-deps app
```

> Las migraciones pendientes se aplican automáticamente al arrancar el contenedor.

---

## 5. Backup y restauración de PostgreSQL

### Backup

```bash
# Genera un dump SQL con fecha en el nombre
docker exec gestor-db pg_dump -U postgres gestor > backup-$(date +%Y%m%d).sql
```

### Restauración

```bash
# Restaurar desde un backup (sustituye YYYYMMDD por la fecha del backup)
docker exec -i gestor-db psql -U postgres gestor < backup-YYYYMMDD.sql
```

> **Recomendación:** Automatiza el backup diario con `cron` y guarda los ficheros en un almacenamiento externo.

---

## 6. Troubleshooting

### La app no arranca — error de conexión a la base de datos

**Síntoma:** El contenedor `gestor-app` se reinicia en bucle con error `Can't reach database server`.

**Solución:**
```bash
# Verificar que el contenedor de BD está activo
docker ps | grep gestor-db

# Ver logs de la BD
docker logs gestor-db

# Comprobar que DATABASE_URL en .env.production apunta a 'db' (nombre del servicio)
# y que el usuario/contraseña coinciden con POSTGRES_USER/POSTGRES_PASSWORD
```

---

### Migraciones pendientes al arrancar

**Síntoma:** Error `The migration ... is applied but not listed in the Prisma schema`.

**Solución:**
```bash
docker exec gestor-app npx prisma migrate deploy
docker-compose -f docker-compose.prod.yml restart app
```

---

### Seed falla por datos duplicados

**Síntoma:** Error `Unique constraint failed` al ejecutar `npm run db:seed`.

**Solución:** El seed usa `upsert`; si falla es porque la BD ya tiene datos en conflicto.
```bash
# Opción 1: Ignorar (los datos ya existen, no es necesario volver a sembrar)
# Opción 2: Resetear la BD (⚠️ DESTRUYE todos los datos)
docker exec gestor-app npx prisma migrate reset --force
docker exec gestor-app npm run db:seed
```

---

### Puerto 3000 ya en uso

**Síntoma:** Error `address already in use 0.0.0.0:3000`.

**Solución:**
```bash
# Identificar qué proceso usa el puerto
sudo ss -tlnp | grep :3000

# Detenerlo o cambiar el puerto en docker-compose.prod.yml:
# ports:
#   - "3001:3000"   # Mapear al puerto 3001 del host
```

---

### Variables de entorno no cargadas

**Síntoma:** `NEXTAUTH_SECRET` o `DATABASE_URL` aparecen como `undefined` en los logs.

**Solución:**
```bash
# Verificar que el fichero .env.production existe y tiene las variables
cat .env.production | grep -v "^#" | grep -v "^$"

# Asegúrate de pasar el fichero correcto al comando up
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

---

## 7. Desarrollo local

### Requisitos
- Node.js 20+
- npm 10+

```bash
# 1. Instalar dependencias
cd gestor-cuadrantes
npm install

# 2. Crear .env a partir del ejemplo
cp .env.example .env

# 3. Aplicar migraciones y sembrar datos de prueba
npx prisma migrate dev
npm run db:seed

# 4. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en http://localhost:3000.

### Usuarios de prueba (seed)

| Email | Contraseña | Rol global | Rol en proyecto |
|-------|-----------|-----------|-----------------|
| admin@cuadrantes.local | Admin1234! | SUPER_ADMIN | PROJECT_ADMIN |
| pm@cuadrantes.local | PM1234! | USER | PROJECT_ADMIN |
| tecnico1@cuadrantes.local | Tecnico1234! | USER | EMPLOYEE |

---

## 8. Scripts npm disponibles

| Script | Descripción |
|--------|------------|
| `npm run dev` | Servidor de desarrollo con hot-reload |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción (requiere build previo) |
| `npm run test:unit` | Suite de tests unitarios (Vitest) |
| `npm run test:e2e` | Suite de tests E2E (Playwright) |
| `npm run db:seed` | Sembrar datos de prueba en la BD |
| `npm run lint` | Linter ESLint |

---

## Arquitectura de contenedores (producción)

```
gestor-app  (Next.js 14, puerto 3000)
    └── gestor-db  (PostgreSQL 16, puerto 5432)
```

Los datos de PostgreSQL se persisten en un volumen Docker nombrado `gestor_pgdata`.


---

## 1. Entornos

| Entorno | Base de datos | Docker Compose | Puerto |
|---------|--------------|----------------|--------|
| Desarrollo | SQLite (`dev.db`) | `docker-compose.yml` | 3000 |
| Producción | PostgreSQL 16 | `docker-compose.prod.yml` | 3000 |

---

## 2. Desarrollo local

### Requisitos
- Node.js 20+
- npm 10+

### Pasos

```bash
# 1. Instalar dependencias
cd gestor-cuadrantes
npm install

# 2. Crear .env a partir del ejemplo
cp .env.example .env
# Editar .env si necesitas cambiar NEXTAUTH_SECRET

# 3. Aplicar migraciones y sembrar datos de prueba
npx prisma migrate dev
npm run db:seed

# 4. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en http://localhost:3000.

### Usuarios de prueba

| Email | Contraseña | Rol global | Rol en proyecto |
|-------|-----------|-----------|-----------------|
| admin@cuadrantes.local | Admin1234! | SUPER_ADMIN | PROJECT_ADMIN |
| pm@cuadrantes.local | PM1234! | USER | PROJECT_ADMIN |
| tecnico1@cuadrantes.local | Tecnico1234! | USER | EMPLOYEE |

---

## 3. Producción con Docker + PostgreSQL

### Requisitos
- Docker 24+
- Docker Compose v2

### Configurar variables de entorno

Crear un fichero `.env.prod` (no subir al repositorio) con:

```ini
POSTGRES_USER=gestor
POSTGRES_PASSWORD=CAMBIA_ESTO_POR_CONTRASEÑA_FUERTE
POSTGRES_DB=gestor_cuadrantes
DATABASE_URL=postgresql://gestor:CAMBIA_ESTO@db:5432/gestor_cuadrantes
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=CAMBIA_ESTO_CON_openssl_rand_base64_32
```

> Generar NEXTAUTH_SECRET: `openssl rand -base64 32`

### Construir y lanzar

```bash
# Construir imágenes y lanzar en background
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Ver logs
docker compose -f docker-compose.prod.yml logs -f app

# Sembrar datos iniciales (solo primera vez)
docker compose -f docker-compose.prod.yml exec app node -e "require('./prisma/seed')"
```

### Ejecutar migraciones manualmente (si es necesario)

```bash
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

---

## 4. Prisma y base de datos

### Crear nueva migración (desarrollo)

```bash
npx prisma migrate dev --name descripcion_del_cambio
```

### Aplicar migraciones en producción

Las migraciones se aplican automáticamente al arrancar el contenedor (`CMD` del Dockerfile.prod). Para aplicarlas manualmente:

```bash
DATABASE_URL="..." npx prisma migrate deploy
```

### Inspeccionar la BD (desarrollo)

```bash
npx prisma studio
```

---

## 5. Variables de entorno — referencia completa

| Variable | Descripción | Requerida |
|----------|------------|-----------|
| `DATABASE_URL` | Connection string de la BD | ✅ |
| `NEXTAUTH_URL` | URL base de la aplicación | ✅ |
| `NEXTAUTH_SECRET` | Secreto para JWT de NextAuth | ✅ |
| `POSTGRES_USER` | Usuario PostgreSQL (solo prod) | prod |
| `POSTGRES_PASSWORD` | Contraseña PostgreSQL (solo prod) | prod |
| `POSTGRES_DB` | Nombre de la base de datos (solo prod) | prod |

---

## 6. Arquitectura de roles

### Roles globales (`User.role`)

| Valor | Descripción |
|-------|-------------|
| `SUPER_ADMIN` | Acceso total a todos los proyectos y configuración global |
| `USER` | Acceso solo a los proyectos donde es miembro |

### Roles de proyecto (`ProjectMember.role`)

| Valor | Descripción |
|-------|-------------|
| `PROJECT_ADMIN` | Gestiona empleados, turnos y festivos del proyecto |
| `EMPLOYEE` | Puede ver su propio cuadrante |

---

## 7. Scripts npm disponibles

| Script | Descripción |
|--------|------------|
| `npm run dev` | Servidor de desarrollo con hot-reload |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción (requiere build previo) |
| `npm run test:unit` | Suite de tests unitarios (Vitest) |
| `npm run test:e2e` | Suite de tests E2E (Playwright) |
| `npm run db:seed` | Sembrar datos de prueba en la BD |
| `npm run lint` | Linter ESLint |
