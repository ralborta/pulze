# WebApp PULZE (Next.js standalone)
FROM node:20-alpine AS base

WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web ./apps/web

RUN corepack enable pnpm && pnpm install --filter @pulze/web
RUN pnpm --filter @pulze/web build

# Standalone: copiar static y public
RUN cd apps/web && \
  cp -r .next/static .next/standalone/.next/ && \
  (cp -r public .next/standalone/ 2>/dev/null || true)

WORKDIR /app/apps/web
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["node", ".next/standalone/server.js"]
