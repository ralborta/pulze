# Quick Deploy — Easypanel (producción PULZE)

**PULZE en producción corre en Easypanel, no en Vercel ni Railway (bot).**

## URLs actuales

| Servicio | URL |
|----------|-----|
| Bot/API | `https://pulze-pulze.wd75db.easypanel.host` |
| WebApp | `https://pulze-webapp.wd75db.easypanel.host` |
| n8n | `https://pulze-n8n.wd75db.easypanel.host` |

## Apps en Easypanel (mismo repo GitHub)

Cada app: **Git** → repo `ralborta/pulze` → **build context = raíz** (`.`).

| App | Dockerfile | Puerto |
|-----|------------|--------|
| Bot | `Dockerfile` | 3001 |
| Web | `apps/web/Dockerfile` | 3000 |
| Backoffice | `apps/backoffice/Dockerfile` | 3000 |

Detalle de variables: [EASYPANEL_WEB_BACKOFFICE.md](./EASYPANEL_WEB_BACKOFFICE.md)

## Variables clave

### Bot (Easypanel)

```bash
DATABASE_URL=postgresql://...
WEBAPP_URL=https://pulze-webapp.wd75db.easypanel.host
JWT_SECRET=...
API_KEY=...                    # BuilderBot / n8n
BUILDERBOT_MESSAGES_API_URL=https://wa-api.builderbot.app
BUILDERBOT_API_KEY=...
BUILDERBOT_BOT_ID=df6916fd-6561-4f4f-afbc-be203eaf4839
```

### Web (Easypanel) — en el **build**

```bash
NEXT_PUBLIC_API_URL=https://pulze-pulze.wd75db.easypanel.host
NEXT_PUBLIC_WHATSAPP_NUMBER=54911XXXXXXXX
```

### Backoffice (Easypanel)

```bash
BOT_API_URL=http://pulze-pulze:3001/api
BACKOFFICE_API_KEY=...   # misma que en el bot
```

## Deploy automático al push

Ver [EASYPANEL_DEPLOY.md](./EASYPANEL_DEPLOY.md) (webhook GitHub en Easypanel o secretos `EASYPANEL_*_WEBHOOK` en GitHub Actions).

## Checklist post-deploy

- [ ] `GET https://pulze-pulze.wd75db.easypanel.host/api/bot/health` → `ok`
- [ ] `https://pulze-webapp.wd75db.easypanel.host/dashboard` carga
- [ ] `WEBAPP_URL` en el bot = dominio real de la web
- [ ] BuilderBot ONLINE y WhatsApp conectado
- [ ] Mensaje de prueba por WA → responde el coach

## Desarrollo local

```bash
pnpm install
pnpm dev:bot
pnpm dev:web
```

---

> **Nota:** Las secciones antiguas de Vercel/Railway en `DEPLOYMENT_GUIDE.md` son legado. Para prod usá solo Easypanel.
