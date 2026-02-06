# Use Node 20 Alpine (lightweight, menos memoria en build que Nixpacks+apt)
FROM node:20-alpine

# Dependencias para módulos nativos (ej. Baileys / sharp)
RUN apk add --no-cache libatomic

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/bot ./apps/bot
COPY .railway-build-version ./

# Install: solo "pnpm install" (sin --frozen-lockfile)
RUN pnpm install

# Build the bot
RUN pnpm run build:bot

# Expose port
EXPOSE 3001

# Start the bot
CMD ["node", "apps/bot/dist/app.js"]
