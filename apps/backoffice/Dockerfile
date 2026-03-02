# Backoffice PULZE (Next.js standalone)
# Build context en Easypanel: "apps/backoffice" (raíz = carpeta de esta app)
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build
RUN cp -r .next/static .next/standalone/.next/ && (cp -r public .next/standalone/ 2>/dev/null || true)

ENV HOSTNAME=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["node", ".next/standalone/server.js"]
