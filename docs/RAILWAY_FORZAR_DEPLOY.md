# Forzar deploy en Railway

Si Railway no toma los últimos cambios del repo, hacé **una** de estas dos cosas.

---

## Opción 1: Desde el dashboard de Railway

1. Entrá a **railway.app** → tu proyecto → servicio del **bot**.
2. **Settings** del servicio:
   - **Root Directory**: dejalo **vacío** (o `.`). Si tiene `apps/bot`, cambialo a vacío y guardá.
   - **Dockerfile Path**: `Dockerfile` o `/Dockerfile`.
3. En el último **Deploy** (pestaña Deployments):
   - Clic en los **tres puntos** (⋮) del deploy fallido o último.
   - **Redeploy** o **Clear build cache and redeploy**.
4. Si el servicio tiene **Source = GitHub**:
   - Revisá que la rama sea **master** (no `main`). Si es `main`, cambiá a **master** y guardá.

---

## Opción 2: Deploy desde tu máquina (sube el código actual)

Así Railway construye con el código que tenés en tu repo local (incluido el Dockerfile actual).

```bash
# Desde la raíz del repo (pulze/)
npm i -g @railway/cli
railway login
railway link    # elegí el proyecto y el servicio "bot"
railway up
```

Eso sube la carpeta actual y dispara un build en Railway. No hace falta tocar el dashboard.

---

## Qué cambiamos en el repo

- El **Dockerfile** usa solo `pnpm install` (sin `--frozen-lockfile`).
- Se agregó **`.railway-build-version`** para que el build no use una capa cacheada vieja.

Commit: `fix(railway): forzar rebuild sin frozen-lockfile + .railway-build-version`
