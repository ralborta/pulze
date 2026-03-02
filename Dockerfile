# Use Node 20 Alpine (lightweight, menos memoria en build que Nixpacks+apt)
FROM node:20-alpine

# Dependencias: libatomic, git, openssl (Prisma lo necesita en Alpine)
RUN apk add --no-cache libatomic git openssl

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Set working directory
WORKDIR /app

# Copy package files (lockfile para install reproducible)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/bot ./apps/bot

# Install y generar Prisma
RUN pnpm install && pnpm --filter @pulze/database run generate

# Compilar database (falla aquí si tsc da error)
RUN pnpm --filter @pulze/database build

# Compilar bot
RUN pnpm run build:bot

# Expose port
EXPOSE 3001

# Start the bot
CMD ["node", "apps/bot/dist/app.js"]
