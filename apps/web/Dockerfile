# WebApp PULZE (Next.js standalone)
# Build context en Easypanel: raíz del repo (no poner Root directory = apps/web)
FROM node:20-alpine

WORKDIR /app

# Next.js embebe NEXT_PUBLIC_* en el bundle en build time
ARG NEXT_PUBLIC_API_URL=https://pulze-pulze.wd75db.easypanel.host
ARG NEXT_PUBLIC_WHATSAPP_NUMBER=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER

COPY apps/web ./
RUN npm install --legacy-peer-deps
RUN npm run build
RUN cp -r .next/static .next/standalone/.next/ && (cp -r public .next/standalone/ 2>/dev/null || true)

ENV HOSTNAME=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["node", ".next/standalone/server.js"]
