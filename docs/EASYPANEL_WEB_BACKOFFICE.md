# Deploy WebApp y Backoffice en Easypanel

Para que se vean la **WebApp** y el **Backoffice** además del bot, creá dos apps más en Easypanel (mismo repo, otro Dockerfile).

## 1. WebApp (app para usuarios)

- **Nueva App** → Origen: **Git** (mismo repo que el bot).
- **Build**:
  - **Dockerfile path:** `apps/web/Dockerfile`
  - **Build context:** raíz del repo (por defecto suele ser `.`).
- **Puerto:** `3000`.
- **Dominio:** Ej. `web.tudominio.com` o el subdominio que uses.
- **Variables de entorno:** por ahora ninguna obligatoria (si más adelante la web llama al bot/API, agregá `NEXT_PUBLIC_API_URL` o similar).

## 2. Backoffice (admin)

- **Nueva App** → Origen: **Git** (mismo repo).
- **Build**:
  - **Dockerfile path:** `apps/backoffice/Dockerfile`
  - **Build context:** raíz del repo.
- **Puerto:** `3000`.
- **Dominio:** Ej. `backoffice.tudominio.com`.

## Resumen

| Servicio   | Dockerfile path              | Puerto |
|-----------|------------------------------|--------|
| Bot/API   | `Dockerfile` (raíz)          | 3001   |
| WebApp    | `apps/web/Dockerfile`        | 3000   |
| Backoffice| `apps/backoffice/Dockerfile` | 3000   |

Los tres usan el **mismo repositorio**; en cada app solo cambiás el **Dockerfile path** y el dominio/puerto.
