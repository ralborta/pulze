# WebApp PULZE (Next.js standalone)
# Build context en Easypanel: raíz del repo (no poner Root directory = apps/web)
FROM node:20-alpine

WORKDIR /app

# Copiar la app web desde el monorepo (contexto = raíz del repo)
COPY apps/web ./
RUN npm install --legacy-peer-deps
RUN npm run build
RUN cp -r .next/static .next/standalone/.next/ && (cp -r public .next/standalone/ 2>/dev/null || true)

ENV HOSTNAME=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["node", ".next/standalone/server.js"]
