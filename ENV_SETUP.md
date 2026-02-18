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
BUILDERBOT_WEBHOOK_SECRET="webhook_secret_..."
BUILDERBOT_API_URL="https://api.builderbot.app/v1"

# JWT Authentication
JWT_SECRET="your-secret-key-here-change-in-production"

# App URLs
WEBAPP_URL="https://pulze-web.vercel.app"
BACKOFFICE_URL="https://pulze-backoffice.vercel.app"
BOT_URL="https://your-railway-bot.up.railway.app"

# Environment
NODE_ENV="development"
PORT=3001
```

## BuilderBot.app Setup

1. Create account at https://app.builderbot.app
2. Connect your WhatsApp Business number
3. Get your API Key from Settings → API
4. Get your Webhook Secret from Settings → Webhooks
5. Configure webhook URL: `https://your-railway-bot.up.railway.app/api/webhooks/builderbot`
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
