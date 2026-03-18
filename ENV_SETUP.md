# Environment Setup

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database (PostgreSQL from Railway)
DATABASE_URL="postgresql://user:password@host:port/database"

# OpenAI API
OPENAI_API_KEY="sk-..."

# BuilderBot.app (WhatsApp Integration)
BUILDERBOT_API_KEY="bb_live_..."
BUILDERBOT_BOT_ID="tu_bot_id"          # Project ID (obligatorio)
BUILDERBOT_ANSWER_ID="tu_answer_id"     # Flow ID del agente IA (para actualizar instrucciones)
BUILDERBOT_WEBHOOK_SECRET=""           # Opcional. Si usás verificación: generá un token y agregalo como header "x-webhook-secret" en BuilderBot
BUILDERBOT_API_URL="https://app.builderbot.cloud/api/v2"  # URL para assistant plugin (default)

# JWT Authentication
JWT_SECRET="your-secret-key-here-change-in-production"

# App URLs
WEBAPP_URL="https://pulze-web.vercel.app"
BACKOFFICE_URL="https://pulze-backoffice.vercel.app"
BOT_URL="https://your-railway-bot.up.railway.app"

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
