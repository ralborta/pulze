# PULZE - Guía de Desarrollo

## Configuración Inicial

### Requisitos
- Node.js 18+
- pnpm 8+
- PostgreSQL 14+
- Cuenta OpenAI
- Cuenta Railway (para bot)
- Cuenta Vercel (para frontends)

### Instalación

1. Clonar el repositorio:
```bash
git clone <repo-url>
cd pulze
```

2. Ejecutar setup:
```bash
./scripts/setup.sh
```

3. Configurar `.env`:
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

4. Instalar dependencias:
```bash
pnpm install
```

5. Configurar base de datos:
```bash
pnpm db:migrate
```

## Desarrollo

### Ejecutar el Bot
```bash
pnpm dev:bot
# Bot corriendo en http://localhost:3001
# Escanea el QR para conectar WhatsApp
```

### Ejecutar WebApp
```bash
pnpm dev:web
# WebApp corriendo en http://localhost:3000
```

### Ejecutar Backoffice
```bash
pnpm dev:backoffice
# Backoffice corriendo en http://localhost:3002
```

### Ejecutar todo simultáneamente
```bash
# Terminal 1
pnpm dev:bot

# Terminal 2
pnpm dev:web

# Terminal 3
pnpm dev:backoffice
```

## Estructura del Proyecto

```
pulze/
├── apps/
│   ├── bot/              # BuilderBot + Backend API
│   │   ├── src/
│   │   │   ├── app.ts            # Entry point
│   │   │   ├── flows/            # Flujos conversacionales
│   │   │   ├── services/         # Lógica de negocio
│   │   │   ├── api/              # API REST
│   │   │   └── utils/            # Utilidades
│   │   └── package.json
│   │
│   ├── web/              # WebApp PWA (usuarios)
│   │   ├── src/
│   │   │   └── app/              # Next.js App Router
│   │   └── package.json
│   │
│   └── backoffice/       # Dashboard admin
│       ├── src/
│       │   └── app/              # Next.js App Router
│       └── package.json
│
├── packages/
│   ├── database/         # Prisma + schemas
│   │   └── prisma/
│   │       └── schema.prisma
│   │
│   └── shared/           # Código compartido
│       └── src/
│           ├── types/            # TypeScript types
│           ├── utils/            # Funciones utils
│           └── constants/        # Constantes
│
└── scripts/              # Scripts de automatización
```

## BuilderBot (WhatsApp)

### Crear un nuevo flujo

1. Crear archivo en `apps/bot/src/flows/`:
```typescript
// my-flow.flow.ts
import { addKeyword } from '@builderbot/bot'

export const myFlow = addKeyword(['trigger'])
  .addAnswer('Respuesta', { capture: true }, async (ctx, { flowDynamic }) => {
    // Lógica
  })
```

2. Registrar en `apps/bot/src/flows/index.ts`:
```typescript
import { myFlow } from './my-flow.flow'

class FlowManager {
  getAllFlows() {
    return [
      welcomeFlow,
      checkInFlow,
      myFlow,  // <-- Agregar aquí
    ]
  }
}
```

### Agregar un servicio

1. Crear en `apps/bot/src/services/`:
```typescript
// my-service.service.ts
class MyService {
  async doSomething() {
    // Lógica
  }
}

export const myService = new MyService()
```

2. Usar en flows:
```typescript
import { myService } from '../services/my-service.service'
```

## Base de Datos (Prisma)

### Crear migración
```bash
cd packages/database
pnpm migrate
```

### Agregar modelo
1. Editar `packages/database/prisma/schema.prisma`:
```prisma
model MyModel {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
}
```

2. Generar migración:
```bash
pnpm migrate
```

### Usar Prisma Studio
```bash
pnpm db:studio
# Abre en http://localhost:5555
```

## API REST

### Agregar endpoint

En `apps/bot/src/api/index.ts`:
```typescript
apiRouter.get('/my-endpoint', async (req, res) => {
  try {
    const data = await myService.getData()
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Message' })
  }
})
```

### Endpoints disponibles

- `GET /health` - Health check
- `GET /api/users` - Listar usuarios
- `GET /api/users/:phone` - Usuario específico
- `GET /api/users/:phone/checkins` - Check-ins del usuario
- `GET /api/users/:phone/streak` - Racha del usuario
- `GET /api/users/:phone/weekly-summary` - Resumen semanal
- `GET /api/stats` - Estadísticas generales

## Deploy

### Railway (Bot + Backend)

1. Instalar Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login:
```bash
railway login
```

3. Crear proyecto:
```bash
railway init
```

4. Deploy:
```bash
pnpm deploy:railway
```

### Vercel (WebApp + Backoffice)

1. Instalar Vercel CLI:
```bash
npm install -g vercel
```

2. Login:
```bash
vercel login
```

3. Deploy:
```bash
pnpm deploy:vercel
```

### GitHub Actions (CI/CD)

El proyecto incluye CI/CD automático. Configura estos secrets en GitHub:

- `RAILWAY_TOKEN`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_WEB_PROJECT_ID`
- `VERCEL_BACKOFFICE_PROJECT_ID`

Cada push a `main` desplegará automáticamente.

## Testing

### Probar el bot localmente

1. Ejecutar bot:
```bash
pnpm dev:bot
```

2. Escanear QR con WhatsApp

3. Enviar mensaje: "hola"

### Probar API

```bash
# Health check
curl http://localhost:3001/health

# Stats
curl http://localhost:3001/api/stats
```

## Tips de Desarrollo

### Debug del bot
- Logs en consola con `logger.info()`, `logger.error()`
- Ver estado de sesión en `bot_sessions/`

### Hot reload
- El bot usa `tsx watch` para auto-reload
- Next.js apps tienen hot reload automático

### Variables de entorno
- Nunca commitear `.env`
- Usar `.env.example` como template
- En producción, configurar en Railway/Vercel

## Troubleshooting

### Bot no conecta
1. Verificar QR no expiró
2. Revisar `bot_sessions/` y borrar si hay problemas
3. Reiniciar bot

### Error de base de datos
1. Verificar PostgreSQL corriendo
2. Verificar `DATABASE_URL` en `.env`
3. Ejecutar `pnpm db:migrate`

### Build falla
1. Limpiar `node_modules`: `rm -rf node_modules && pnpm install`
2. Limpiar builds: `rm -rf apps/*/dist apps/*/.next`
3. Rebuild: `pnpm build:bot && pnpm build:web`

## Recursos

- [BuilderBot Docs](https://builderbot.app/)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Railway Docs](https://docs.railway.app/)
- [Vercel Docs](https://vercel.com/docs)
