#!/bin/sh
set -e
# Aplicar migraciones si DATABASE_URL está definida (en Easypanel el bot puede alcanzar la DB por nombre de servicio)
if [ -n "$DATABASE_URL" ] && [ -d /app/packages/database ]; then
  echo "Running Prisma migrations..."
  cd /app/packages/database && npx prisma migrate deploy
  cd /app
fi
exec node apps/bot/dist/app.js
