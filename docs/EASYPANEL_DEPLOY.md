# Deploy automático en Easypanel

Hay dos formas de que un push a `master` dispare el deploy en Easypanel.

## Opción 1: Integración GitHub en Easypanel (recomendada)

Easypanel puede escuchar pushes y hacer deploy solo, sin GitHub Actions.

1. **Token de GitHub**
   - En GitHub: **Settings → Developer settings → Personal access tokens** (o Fine-grained).
   - Classic: permisos `repo` y `admin:repo_hook`.
   - Fine-grained: **Metadata** (read), **Contents** (read), **Webhooks** (read and write).
   - Creá el token y copialo.

2. **En Easypanel**
   - **Settings → Github** → pegá el token → guardar.
   - En cada **App** (Bot, Web, Backoffice): en la configuración del servicio, activá **Auto Deploy** (o la opción de deploy al recibir push).

Easypanel agrega un webhook al repo; cada push a la rama configurada dispara el deploy de esa app.

## Opción 2: GitHub Actions + Webhook de Easypanel

Si preferís que el workflow de GitHub dispare el deploy:

1. **En Easypanel**, en cada app que quieras redeployar:
   - Entrá a la app → **Deploy** o **Settings**.
   - Copiá la **Deploy Webhook URL** (suele ser algo como `https://tu-easypanel.com/api/.../deploy`).

2. **En GitHub**
   - **Settings → Secrets and variables → Actions**.
   - Agregá uno o más secretos:
     - `EASYPANEL_BOT_WEBHOOK` → URL del webhook del servicio Bot.
     - `EASYPANEL_WEB_WEBHOOK` → URL del servicio Web.
     - `EASYPANEL_BACKOFFICE_WEBHOOK` → URL del servicio Backoffice.
     - O una sola: `EASYPANEL_WEBHOOK_URL` (para un solo servicio).

En cada push a `master`, después de que pasen los tests, el workflow llama a las URLs que tengas configuradas y Easypanel hace el deploy de esas apps.

Resumen: **Opción 1** no requiere secretos en GitHub. **Opción 2** no requiere configurar el token en Easypanel y te deja todo en el mismo workflow (tests + Railway/Vercel + Easypanel).
