# Deploy automático a Railway (cada push a GitHub)

Para que **cada push a `master`** dispare un deploy en Railway, tenés que **conectar el repo de GitHub** al servicio en Railway.

## Pasos en Railway

1. Entrá a **[railway.app](https://railway.app)** y abrí tu **proyecto** (el que tiene el servicio del bot).

2. Entrá al **servicio** del bot (el que usa el Dockerfile).

3. En el servicio, andá a **Settings** (o la pestaña de configuración).

4. Buscá la sección **Source** / **Repository** / **Connect Repo** / **Deploy from GitHub**:
   - Si el servicio **no** tiene un repo conectado: hacé clic en **Connect Repository** (o similar) y elegí **GitHub**.
   - Autorizá a Railway para ver tus repos (si te lo pide).
   - Elegí el repo **ralborta/pulze**.
   - Elegí la rama **master** (la que usás para pushear).

5. **Root Directory**: dejalo **vacío** o poné **`.`** (punto). Así Railway usa la raíz del repo y el Dockerfile + `pnpm-lock.yaml` se incluyen en el build.

6. **Dockerfile Path**: si te lo pide, dejá **`Dockerfile`** o **`/Dockerfile`** (está en la raíz).

7. Guardá los cambios. A partir de ahí, **cada push a `master`** va a disparar un deploy automático.

---

## Si no ves "Connect Repo"

- Puede estar en **Project Settings** (no en el servicio): **Settings** → **Sources** o **Integrations** → **GitHub**.
- O al **crear el servicio**: cuando Railway te pregunte el origen, elegí **GitHub** → **ralborta/pulze** → rama **master**.

---

## Alternativa: deploy desde GitHub Actions

Si preferís que el deploy lo haga el workflow de GitHub (en lugar de Railway al detectar el push), tené que definir estos **secrets** en el repo:

- **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Nombre del secret   | Dónde sacarlo en Railway |
|---------------------|---------------------------|
| `RAILWAY_TOKEN`     | Proyecto → **Settings** → **Tokens** → **Create Project Token** (no el token de cuenta). |
| `RAILWAY_PROJECT_ID`| En la URL del proyecto: `railway.com/project/ESTE_ID` o en Settings del proyecto. |
| `RAILWAY_SERVICE_ID`| Servicio bot → Settings o en la URL del servicio. |

Con esos tres secrets, el job `deploy-railway` del workflow va a poder hacer `railway up` en cada push a `master`.
