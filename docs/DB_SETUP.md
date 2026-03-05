# Base de datos – correr desde acá

## Opción 1: Postgres local con Docker (del repo)

Desde la raíz del repo:

```bash
# Asegurate de que no haya otro Postgres usando el puerto 5432
docker compose up -d

# Esperá unos segundos y aplicá migraciones
cd packages/database
DATABASE_URL="postgresql://pulze:pulze@localhost:5432/pulze" pnpm prisma migrate deploy

# Opcional: generar cliente y seed
pnpm prisma generate
pnpm prisma db seed
```

La URL del compose es: `postgresql://pulze:pulze@localhost:5432/pulze`.

**Si aparece "Authentication failed" (P1000) con usuario `pulze`:** puede que en el puerto 5432 esté otro Postgres (no el del compose). Probá:

1. **Usar solo el contenedor del repo** (y reiniciar con volumen nuevo):
   ```bash
   docker compose down -v
   docker compose up -d
   # esperar ~5 segundos
   cd packages/database && DATABASE_URL="postgresql://pulze:pulze@localhost:5432/pulze" pnpm prisma migrate deploy
   ```

2. **Si en 5432 está otro servidor** (ej. Postgres de sistema o de Easypanel vía túnel), usá las credenciales de ese servicio. Muchos usan usuario `postgres` y una contraseña que te dan en el panel:
   ```bash
   DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/pulze" pnpm prisma migrate deploy
   ```
   (reemplazá `TU_PASSWORD` y el nombre de la DB si es distinto)

## Opción 2: Usar la DB de Easypanel

Si ya tenés PostgreSQL en Easypanel:

1. Copiá la **connection string** (DATABASE_URL) del servicio de base de datos.
2. En tu máquina:
   ```bash
   cd packages/database
   DATABASE_URL="postgresql://usuario:password@host:5432/pulze" pnpm prisma migrate deploy
   ```
3. Las migraciones se aplican contra esa DB (init + add_bot_operator_fields).

## Migraciones en el repo

- `20250101000000_init` – Crea todas las tablas (User, CheckIn, Conversation, etc.).
- `20260302000000_add_bot_operator_fields` – Agrega `botEnabled` y `operatorTakenOverAt` a User.

Si la DB está vacía, `migrate deploy` aplica ambas en orden. Si la DB ya tenía las tablas creadas por otro medio (ej. `db push`), puede que solo haga falta aplicar la segunda; si falla, revisá el historial de migraciones en la tabla `_prisma_migrations`.
