# Environment Setup

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database (PostgreSQL from Railway)
DATABASE_URL="postgresql://user:password@host:port/database"

# OpenAI API
OPENAI_API_KEY="sk-..."

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
