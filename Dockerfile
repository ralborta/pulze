# Use Node 20 Alpine (lightweight, menos memoria en build que Nixpacks+apt)
FROM node:20-alpine

# Dependencias para módulos nativos (ej. Baileys / sharp)
RUN apk add --no-cache libatomic

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Set working directory
WORKDIR /app

# Copy package files (incl. lockfile para --frozen-lockfile)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/bot ./apps/bot

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the bot
RUN pnpm run build:bot

# Expose port
EXPOSE 3001

# Start the bot
CMD ["node", "apps/bot/dist/app.js"]
