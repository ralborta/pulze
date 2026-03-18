# Planes estándar y rutinas diarias

Los **planes estándar** son la base que los administradores crean en el backoffice. La IA los adapta a cada usuario según su contexto (restricciones, nivel, objetivo).

## Flujo

1. **Backoffice** → Admin crea planes en "Planes rutinas" (título, categoría, nivel, equipo, contenido plantilla).
2. **Check-in** → Usuario registrado hace check-in (ej: "4, 3, bien, sí"). Si dice que va a entrenar, recibe la rutina adaptada.
3. **n8n** → Puede llamar `POST /api/n8n/openai/adapt-routine` con `userId` para obtener rutina y enviarla por WhatsApp.

## API

### Admin (requiere BACKOFFICE_API_KEY o JWT)

- `GET /api/admin/standard-plans` — Listar planes
- `POST /api/admin/standard-plans` — Crear plan
- `PATCH /api/admin/standard-plans/:id` — Actualizar
- `DELETE /api/admin/standard-plans/:id` — Eliminar

### n8n (requiere X-API-Key)

- `GET /api/n8n/standard-plans?difficulty=&category=` — Planes activos
- `POST /api/n8n/openai/adapt-routine` — Adaptar rutina
  - Body: `{ userId, planId?, checkInData? }`
  - Devuelve: `{ content, planId, planTitle }`

## Check-in para usuarios registrados

Cuando el usuario envía un mensaje que:
- tiene intent `checkin`, o
- contiene "check", o
- tiene formato de check-in (ej: "4, 3, bien, sí")

→ Se procesa como check-in. Si `willTrain: true`, se agrega la rutina adaptada a la respuesta.

## Migración

```bash
cd packages/database && DATABASE_URL="..." pnpm prisma migrate deploy
```
