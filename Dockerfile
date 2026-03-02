# Use Node 20 Alpine (lightweight, menos memoria en build que Nixpacks+apt)
FROM node:20-alpine

# Dependencias: libatomic (nativos), git (pnpm usa git para libsignal-node/baileys)
RUN apk add --no-cache libatomic git

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Set working directory
WORKDIR /app

# Copy package files (lockfile para install reproducible)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/bot ./apps/bot

# Install, generar Prisma, compilar database y bot
RUN pnpm install --frozen-lockfile && \
  pnpm --filter @pulze/database run generate && \
  pnpm --filter @pulze/database build && \
  pnpm run build:bot

# Expose port
EXPOSE 3001

# Start the bot
CMD ["node", "apps/bot/dist/app.js"]
