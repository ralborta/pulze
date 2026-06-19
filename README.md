# PULZE - WhatsApp Wellness Coach Platform

## 🎯 Visión
Plataforma de acompañamiento de bienestar que combina WhatsApp (constancia diaria) + WebApp (profundidad) + Backoffice (control total).

## 🏗️ Arquitectura

```
pulze/
├── apps/
│   ├── bot/              # Backend API + webhooks (Easypanel)
│   ├── web/              # WebApp PWA para usuarios (Easypanel)
│   └── backoffice/       # Dashboard admin (Easypanel)
├── packages/
│   ├── shared/           # Tipos, utils, constantes
│   ├── ai-engine/        # Motor de IA y personalización
│   └── database/         # Prisma + schemas
└── scripts/              # Deploy automation
```

## 🚀 Stack Tecnológico

### Backend (Easypanel + PostgreSQL)
- **BuilderBot Cloud**: Canal WhatsApp
- **Express**: API REST (`apps/bot`)
- **Prisma**: ORM
- **PostgreSQL**: Base de datos (Railway u otro host; no el bot en Railway hoy)
- **OpenAI**: Motor de IA
- **n8n**: Crons proactivos (Easypanel)

### Frontend (Easypanel — Docker / Next.js standalone)
- **Next.js 15**: Framework React
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **shadcn/ui**: Componentes UI
- **React Query**: Data fetching

## 📦 Instalación

```bash
# Instalar pnpm si no lo tienes
npm install -g pnpm

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales

# Setup base de datos
pnpm db:migrate

# Desarrollo
pnpm dev:bot          # Bot + Backend
pnpm dev:web          # WebApp
pnpm dev:backoffice   # Dashboard admin
```

## 🚢 Deploy (producción = Easypanel)

Todo el stack vivo está en **Easypanel** (mismo repo, distinto Dockerfile por app):

| App | Dockerfile | URL ejemplo |
|-----|------------|-------------|
| Bot/API | `Dockerfile` (raíz) | `https://pulze-pulze.wd75db.easypanel.host` |
| WebApp | `apps/web/Dockerfile` | `https://pulze-webapp.wd75db.easypanel.host` |
| Backoffice | `apps/backoffice/Dockerfile` | (tu subdominio Easypanel) |
| n8n | (servicio aparte) | `https://pulze-n8n.wd75db.easypanel.host` |

Guías:
- [Web + Backoffice en Easypanel](./docs/EASYPANEL_WEB_BACKOFFICE.md)
- [Deploy automático (GitHub → Easypanel)](./docs/EASYPANEL_DEPLOY.md)
- [Variables de entorno](./ENV_SETUP.md)

**No usamos Vercel** en este proyecto. El script `pnpm deploy:vercel` quedó por legado; ignorarlo.

### Railway (solo referencia / DB)

```bash
pnpm deploy:railway   # opcional; el bot en prod no está en Railway hoy
```

## 📱 Features V1

### WhatsApp Bot
- ✅ Onboarding conversacional
- ✅ Check-in diario automatizado
- ✅ Recomendaciones personalizadas
- ✅ Resumen semanal
- ✅ Procesamiento de notas de voz (BuilderBot nativo)
- ✅ Conversación libre con IA
- ✅ Sistema de memoria contextual

### WebApp (Usuarios)
- ✅ Dashboard de progreso
- ✅ Historial de check-ins
- ✅ Biblioteca de contenidos
- ✅ Configuración de preferencias
- ✅ PWA (instalable en móvil)

### Backoffice (Admin)
- ✅ Gestión de usuarios
- ✅ Analytics y métricas
- ✅ Gestión de contenidos
- ✅ Plantillas de mensajes
- ✅ Sistema de alertas
- ✅ Reportes exportables

## 🔑 Variables de Entorno

Ver `.env.example` para la lista completa.

## 📊 Métricas Clave

- % completación onboarding
- % respuesta check-in día 1 y 7
- Racha promedio
- Tasa de reactivación
- Conversión a Premium
- NPS/satisfacción

## 🛠️ Scripts Disponibles

```bash
pnpm dev:bot              # Desarrollo bot + backend
pnpm dev:web              # Desarrollo webapp
pnpm dev:backoffice       # Desarrollo backoffice
pnpm build:bot            # Build producción bot
pnpm build:web            # Build producción web
pnpm build:backoffice     # Build producción backoffice
pnpm db:migrate           # Migrar base de datos
pnpm db:studio            # Abrir Prisma Studio
pnpm deploy:railway       # Legacy / DB (prod bot = Easypanel)
```

## 📖 Documentación

- [Web + Backoffice Easypanel](./docs/EASYPANEL_WEB_BACKOFFICE.md)
- [Deploy Easypanel](./docs/EASYPANEL_DEPLOY.md)

## 📄 Licencia

Propiedad privada - Todos los derechos reservados
