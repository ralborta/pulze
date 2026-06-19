# Deploy WebApp y Backoffice en Easypanel

PULZE en producción corre en **Easypanel** (bot, n8n, web, backoffice). **No hace falta Vercel.**

**Deploy automático al hacer push:** ver [EASYPANEL_DEPLOY.md](./EASYPANEL_DEPLOY.md).

## Arquitectura actual

| Servicio   | Easypanel (ejemplo) | Puerto |
|-----------|---------------------|--------|
| Bot/API   | `pulze-pulze.wd75db.easypanel.host` | 3001 |
| n8n       | `pulze-n8n.wd75db.easypanel.host` | — |
| WebApp    | `https://pulze-webapp.wd75db.easypanel.host` | 3000 |
| Backoffice| **crear app** → ej. `pulze-backoffice...` | 3000 |

Hoy la web está en Easypanel; los magic links del bot deben usar `WEBAPP_URL` con ese dominio.

---

## 1. WebApp (usuarios + magic link `/auth`)

### App en Easypanel

- **URL producción:** `https://pulze-webapp.wd75db.easypanel.host`
- **Dockerfile path:** `apps/web/Dockerfile`
- **Build context:** raíz del repo (`.`)
- **Puerto:** `3000`

### Variables de entorno (build + runtime)

En Easypanel, agregalas **antes del primer build** (Next.js las embebe al compilar):

| Variable | Ejemplo | Para qué |
|----------|---------|----------|
| `NEXT_PUBLIC_API_URL` | `https://pulze-pulze.wd75db.easypanel.host` | La web llama al bot (`/api/auth/verify`, `/api/users/me`, etc.) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `5491133788190` | Links `wa.me` en dashboard y preferencias |

Si cambiás `NEXT_PUBLIC_*`, **redeploy con rebuild** (no alcanza restart).

### Bot: `WEBAPP_URL`

En la app del **bot**, agregá o corregí:

```
WEBAPP_URL=https://pulze-webapp.wd75db.easypanel.host
```

(sin barra final; usá el dominio real de tu app web en Easypanel)

Sin esto, los magic links de WhatsApp apuntan a localhost o a una URL vieja de Vercel.

---

## 2. Backoffice (admin)

- **Dockerfile path:** `apps/backoffice/Dockerfile`
- **Build context:** raíz del repo
- **Puerto:** `3000`

| Variable | Valor |
|----------|--------|
| `BOT_API_URL` | `http://pulze-pulze:3001/api` (nombre interno del servicio bot) **o** URL externa del bot |
| `BACKOFFICE_API_KEY` | Misma clave que en el bot |

---

## Checklist rápido

1. Crear app **Web** en Easypanel (`apps/web/Dockerfile`, puerto 3000).
2. Setear `NEXT_PUBLIC_API_URL` y `NEXT_PUBLIC_WHATSAPP_NUMBER` → **deploy**.
3. Copiar el dominio de la web → ponerlo en el bot como `WEBAPP_URL` → **redeploy bot**.
4. Probar: abrir `https://tu-web/auth` (debe mostrar error de token, no 404).
5. Completar onboarding en WA → debe llegar link con el dominio de Easypanel.

---

## Resumen Dockerfile

| Servicio   | Dockerfile path              | Puerto |
|-----------|------------------------------|--------|
| Bot/API   | `Dockerfile` (raíz)          | 3001   |
| WebApp    | `apps/web/Dockerfile`        | 3000   |
| Backoffice| `apps/backoffice/Dockerfile` | 3000   |

Los tres usan el **mismo repositorio**; solo cambia el Dockerfile path.
