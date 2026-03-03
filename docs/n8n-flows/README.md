# Flujos n8n para PULZE

Los archivos están en el repo; después del push a GitHub podés importarlos así:

- **Import from File:** descargá los JSON desde GitHub (`docs/n8n-flows/*.json`) y en n8n: ··· → Import from File.
- **Import from URL:** en n8n: ··· → Import from URL y pegá la URL raw de cada archivo (ej. `https://raw.githubusercontent.com/TU_USUARIO/pulze/master/docs/n8n-flows/01-recordatorio-checkin.json`; reemplazá TU_USUARIO y la rama si usás otra).

**Antes de activar cada flujo:**

1. En n8n, definí variables de entorno (o usá las que ya tengas):
   - **API_URL**: base de tu API (ej. `https://tu-dominio.com`)
   - **API_KEY**: mismo valor que `N8N_API_KEY` o `API_KEY` en el backend

2. Los nodos HTTP Request usan `{{ $env.API_URL }}` y `{{ $env.API_KEY }}`. Si en tu n8n las variables tienen otro nombre, reemplazá en cada nodo (o configurá `API_URL` / `API_KEY` en Settings → Variables).

3. Revisá cada **Schedule Trigger**: los JSON traen cron tipo `0 8-22 * * *` (cada hora 8–22), `0 10 * * *` (10:00), etc. Ajustá timezone en el trigger si hace falta (ej. America/Argentina/Buenos_Aires).

4. Si al importar algún nodo da error de versión, editá el nodo en la UI y guardá (n8n suele actualizar al tipo correcto).

---

| Archivo | Flujo | Trigger |
|---------|--------|---------|
| `01-recordatorio-checkin.json` | Recordatorio de check-in | Cada hora 8–22 |
| `02-reactivacion.json` | Reactivación (inactivos 2–7 días) | Diario 10:00 |
| `03-celebracion.json` | Celebración (rachas 3,7,14,30) | Diario 18:00 |
| `04-resumen-semanal.json` | Resumen semanal | Lunes 9:00 |
