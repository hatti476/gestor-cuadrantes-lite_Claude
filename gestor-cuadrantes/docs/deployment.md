# Guía de Despliegue — Gestor de Cuadrantes

> Última actualización: Sprint 6 (Fase 2)

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
