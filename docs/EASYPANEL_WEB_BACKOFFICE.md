# Deploy WebApp y Backoffice en Easypanel

Para que se vean la **WebApp** y el **Backoffice** además del bot, creá dos apps más en Easypanel (mismo repo, otro Dockerfile).

**Deploy automático al hacer push:** ver [EASYPANEL_DEPLOY.md](./EASYPANEL_DEPLOY.md) (integración GitHub en Easypanel o webhooks desde GitHub Actions).

## 1. WebApp (app para usuarios)

- **Nueva App** → Origen: **Git** (mismo repo que el bot).
- **Build**:
  - **Dockerfile path:** `apps/web/Dockerfile`
  - **Root directory / Build context:** raíz del repo (vacío o `.`). No uses `apps/web`.
- **Puerto:** `3000`.
- **Dominio:** Ej. `web.tudominio.com` o el subdominio que uses.
- **Variables de entorno:** por ahora ninguna obligatoria (si más adelante la web llama al bot/API, agregá `NEXT_PUBLIC_API_URL` o similar).

## 2. Backoffice (admin)

- **Nueva App** → Origen: **Git** (mismo repo).
- **Build**:
  - **Dockerfile path:** `apps/backoffice/Dockerfile`
  - **Root directory / Build context:** raíz del repo (vacío o `.`). No uses `apps/backoffice`.
- **Puerto:** `3000`.
- **Dominio:** Ej. `backoffice.tudominio.com`.
- **Variables de entorno** (obligatorias para que funcione con datos reales):
  - `BOT_API_URL` → URL interna del bot. En Easypanel usá el nombre del servicio: `http://nombre-del-bot:3001/api` (ej. si el bot se llama `pulze-bot`: `http://pulze-bot:3001/api`). O la URL externa si tenés dominio: `https://api.tudominio.com/api`.
  - `BACKOFFICE_API_KEY` → Clave secreta. La misma que configurás en el bot como `BACKOFFICE_API_KEY` (para que el backoffice pueda llamar al API admin).

## Resumen

| Servicio   | Dockerfile path              | Puerto | Env vars clave |
|-----------|------------------------------|--------|----------------|
| Bot/API   | `Dockerfile` (raíz)          | 3001   | `DATABASE_URL`, `BUILDERBOT_*`, `BACKOFFICE_API_KEY` |
| WebApp    | `apps/web/Dockerfile`        | 3000   | - |
| Backoffice| `apps/backoffice/Dockerfile` | 3000   | `BOT_API_URL`, `BACKOFFICE_API_KEY` |

Los tres usan el **mismo repositorio**; en cada app solo cambiás el **Dockerfile path** y el dominio/puerto.

**Importante:** En Easypanel, el backoffice **no** usa localhost. Debés configurar `BOT_API_URL` con la URL del bot: interna (`http://nombre-servicio-bot:3001/api`) o externa si tenés dominio.
