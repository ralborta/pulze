# PULZE - WhatsApp Wellness Coach Platform

## 🎯 Visión
Plataforma de acompañamiento de bienestar que combina WhatsApp (constancia diaria) + WebApp (profundidad) + Backoffice (control total).

## 🏗️ Arquitectura

```
pulze/
├── apps/
│   ├── bot/              # BuilderBot + Backend API (Railway)
│   ├── web/              # WebApp PWA para usuarios (Vercel)
│   └── backoffice/       # Dashboard admin (Vercel)
├── packages/
│   ├── shared/           # Tipos, utils, constantes
│   ├── ai-engine/        # Motor de IA y personalización
│   └── database/         # Prisma + schemas
└── scripts/              # Deploy automation
```

## 🚀 Stack Tecnológico

### Backend (Railway)
- **BuilderBot**: Framework para WhatsApp
- **NestJS/Express**: API REST
- **Prisma**: ORM
- **PostgreSQL**: Base de datos principal
- **Redis**: Cache y sessions
- **OpenAI**: Motor de IA

### Frontend (Vercel)
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

## 🚢 Deploy

### Railway (Bot + Backend)
```bash
pnpm deploy:railway
```

### Vercel (Web + Backoffice)
```bash
pnpm deploy:vercel
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
pnpm deploy:railway       # Deploy a Railway
pnpm deploy:vercel        # Deploy a Vercel
```

## 📖 Documentación

- [Guía de desarrollo](./docs/DEVELOPMENT.md)
- [Arquitectura técnica](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)

## 📄 Licencia

Propiedad privada - Todos los derechos reservados
