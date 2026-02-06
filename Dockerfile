# Use Node 20 Alpine (lightweight, menos memoria en build que Nixpacks+apt)
FROM node:20-alpine

# Dependencias para módulos nativos (ej. Baileys / sharp)
RUN apk add --no-cache libatomic

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Set working directory
WORKDIR /app

# Copy package files (no exigimos lockfile: Railway a veces no lo incluye en el contexto)
COPY package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/bot ./apps/bot

# Install sin --frozen-lockfile (lockfile puede no estar si Root Directory no es la raíz)
RUN pnpm install

# Build the bot
RUN pnpm run build:bot

# Expose port
EXPOSE 3001

# Start the bot
CMD ["node", "apps/bot/dist/app.js"]
