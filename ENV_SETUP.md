# Environment Setup

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database (PostgreSQL from Railway)
DATABASE_URL="postgresql://user:password@host:port/database"

# OpenAI (opcional para el canal WhatsApp vía webhook; sí la vas a usar para otros procesos en el backend)
OPENAI_API_KEY="sk-..."

# BuilderBot.app (WhatsApp Integration)
BUILDERBOT_API_KEY="bb-64c..."  # Developer Settings → API Reference (flows, assistant Y proactivos Cloud v2)
BUILDERBOT_BOT_ID="df6916fd-6561-4f4f-afbc-be203eaf4839"
# BUILDERBOT_WA_API_KEY solo si usás console.builderbot.app/wa-api (producto legacy, otra cuenta)
# BUILDERBOT_MESSAGES_PROVIDER=cloud-v2  # default automático con key bb-
BUILDERBOT_ANSWER_ID="tu_answer_id"     # Flow ID del agente IA (para actualizar instrucciones)
BUILDERBOT_WEBHOOK_SECRET=""           # Opcional. Si usás verificación: generá un token y agregalo como header "x-webhook-secret" en BuilderBot
BUILDERBOT_API_URL="https://app.builderbot.cloud/api/v2"  # URL para assistant plugin (default)
BUILDERBOT_MESSAGES_API_URL="https://wa-api.builderbot.app"  # Envío saliente WhatsApp (proactivos, outbound)
BUILDERBOT_DEVICE_ID=""  # Opcional. ID del dispositivo WA en BuilderBot si tenés varios números

# JWT Authentication
JWT_SECRET="your-secret-key-here-change-in-production"

# App URLs (Easypanel — no usamos Vercel en producción)
WEBAPP_URL="https://pulze-webapp.wd75db.easypanel.host"
BACKOFFICE_URL="https://pulze-backoffice.wd75db.easypanel.host"
BOT_URL="https://pulze-pulze.wd75db.easypanel.host"

# Backoffice (solo si usás el panel admin)
BOT_API_URL="http://localhost:3001/api"   # Dev: localhost. Easypanel: http://nombre-bot:3001/api (ver docs/EASYPANEL_WEB_BACKOFFICE.md)
BACKOFFICE_API_KEY="tu-clave-secreta"      # Clave para que el backoffice llame al API admin (la misma en bot y backoffice)

# Environment
NODE_ENV="development"
PORT=3001
```

## BuilderBot.app Setup

1. Create account at https://app.builderbot.app
2. Connect your WhatsApp Business number
3. Get your **API Key** and **Bot ID** from Settings → API (el Bot ID identifica tu bot)
4. Get your Webhook Secret from Settings → Webhooks
5. Configure webhook URL: `https://your-api-url/api/webhooks/builderbot`
6. Enable events: `message`, `status`, `media`
7. Test connection with: `GET /api/webhooks/builderbot/health`

## Railway PostgreSQL Setup

1. Go to your Railway project
2. Click "+ New" → "Database" → "PostgreSQL"
3. Copy the DATABASE_URL from Railway variables
4. Add it to your `.env` file

## Running Migrations

```bash
# Generate Prisma Client
cd packages/database
pnpm prisma generate

# Create migration
pnpm prisma migrate dev --name init

# Apply migration to production
pnpm prisma migrate deploy
```

## Seed Database (Optional)

To populate the database with sample data:

```bash
cd packages/database
pnpm prisma db seed
```
