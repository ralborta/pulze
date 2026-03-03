# PULZE – Plan de acción (backend + n8n + operador)

Documento único con todo lo acordado: backend, n8n como orquestador, operador humano, resumen de conversación y flujos a subir en n8n.

---

## 1. Decisiones ya tomadas

| Tema | Decisión |
|------|----------|
| Estructura de código | Mantener la actual (no refactor al doc). |
| Orquestación | n8n como orquestador: crons y flujos en n8n; API expone endpoints que n8n llama. |
| Puerto API | 3001 (como hasta ahora). |
| Contexto para prompts | No guardar toda la interacción; generar un **resumen** después de cada interacción y usar ese resumen (+ último mensaje) en el prompt. |
| Operador humano | Backend debe permitir activar/desactivar el bot por usuario para que un operador pueda atender al usuario final. |

---

## 2. Plan de acción por fases

### FASE 1 – Base de datos y operador

**Objetivo:** Soporte para “bot on/off” por usuario y, si hace falta, modelo para resumen de conversación.

1. **Schema (Prisma)**  
   - Agregar en `User` (o en una tabla de “sesión/chat” si preferís por conversación):
     - `botEnabled: Boolean @default(true)`  
     - Opcional: `operatorTakenOverAt: DateTime?` para auditoría.
   - `UserContext.aiSummary` y `lastAISummaryUpdate` ya existen; usarlos para el resumen post‑interacción.

2. **API – Operador**  
   - `PATCH /api/users/:userId/bot` (o similar) con body `{ "botEnabled": true \| false }` (protegido por auth admin/backoffice).  
   - Endpoint para backoffice: listar usuarios y estado del bot (ej. `GET /api/users` con filtro o campo `botEnabled`).

3. **Webhook BuilderBot**  
   - Al recibir mensaje: si `user.botEnabled === false`, **no** llamar a la IA ni enviar respuesta automática; guardar el mensaje en `Conversation` y opcionalmente marcar “pendiente de operador” (o exponer en `GET /api/users/:userId/conversation` para que el operador vea y responda por otro canal/API).

---

### FASE 2 – Resumen de conversación

**Objetivo:** Después de cada interacción, actualizar un resumen que luego se usa en el prompt.

1. **Lógica post‑respuesta**  
   - Tras guardar el par (mensaje usuario + respuesta asistente) en `Conversation`:
     - Si existe `UserContext` para ese usuario: llamar a OpenAI con “resumen anterior + último intercambio → nuevo resumen (breve)”.
     - Guardar resultado en `UserContext.aiSummary` y actualizar `lastAISummaryUpdate`.

2. **Uso en prompts**  
   - En `PromptBuilderService` / `ContextService`: en lugar de inyectar N últimos mensajes, inyectar `UserContext.aiSummary` + (opcional) el último mensaje del usuario para inmediatez.

3. **Frecuencia**  
   - Definir si el resumen se actualiza en **cada** interacción o cada **K** intercambios (ej. cada 2) para ahorrar llamadas a OpenAI.

---

### FASE 3 – Endpoints para n8n

**Objetivo:** n8n dispara por cron y llama a la API; la API no tiene crons propios para estos flujos.

1. **Listados para proactivos**  
   - `GET /api/users/pending-checkin`  
     - Query: fecha/hora (opcional, por timezone).  
     - Respuesta: usuarios con onboarding completo, sin check-in hoy, en su ventana de recordatorio (según `UserPreferences.reminderTime`).
   - `GET /api/users/inactive`  
     - Query: `days` (ej. 2–7).  
     - Respuesta: usuarios con último check-in hace ≥ N días (y opcionalmente filtro por `isActive`).
   - `GET /api/users/milestones` (opcional)  
     - Usuarios que cumplen racha/hito (ej. 7 días, 30 días) para mensaje de celebración.

2. **Generación de mensajes (IA)**  
   - `POST /api/openai/generate-reminder`  
     - Body: `{ "userId": "..." }`.  
     - Respuesta: texto del recordatorio de check-in (usando resumen + contexto del usuario).
   - `POST /api/openai/generate-reactivation`  
     - Body: `{ "userId": "...", "daysSinceLastCheckIn": number }`.  
     - Respuesta: texto de reactivación.
   - `POST /api/openai/generate-celebration` (opcional)  
     - Body: `{ "userId": "...", "milestone": "streak_7" \| ... }`.  
     - Respuesta: texto de celebración.
   - `POST /api/openai/generate-weekly-report` (opcional)  
     - Body: `{ "userId": "..." }`.  
     - Respuesta: resumen semanal para el usuario.

3. **Envío por BuilderBot**  
   - `POST /api/proactive-messages`  
     - Body: `{ "userId": "...", "content": "texto", "messageType": "checkin_reminder" \| "reactivation" \| "celebration" \| "weekly_report" }`.  
     - La API envía el mensaje vía BuilderBot y guarda en `ProactiveMessage`.

4. **Auth**  
   - Todos estos endpoints para n8n: proteger con API key (header `Authorization: Bearer <API_KEY>` o `X-API-Key`).

---

### FASE 4 – n8n: flujos a crear y subir

**Objetivo:** Definir los flujos que vas a generar en n8n y subir (importar). El calendario/cron se maneja **solo en n8n** (Schedule Trigger).

Cada flujo se dispara por **Schedule Trigger**; luego usa nodos **HTTP Request** hacia tu API (base URL configurada en variable de n8n).

---

#### Flujo 1 – Recordatorio de check-in

- **Trigger:** Schedule – cada hora de 8:00 a 22:00 (o según timezone Argentina).
- **Pasos:**
  1. HTTP Request: `GET {{API_URL}}/api/n8n/users/pending-checkin` (header `X-API-Key` o `Authorization: Bearer {{API_KEY}}`).
  2. Iterar sobre cada usuario devuelto (`body.users`).
  3. Por cada usuario: `POST {{API_URL}}/api/n8n/openai/generate-reminder` con `{ "userId": "..." }` → `body.content`.
  4. Con el texto: `POST {{API_URL}}/api/n8n/proactive-messages` con `{ "userId", "content", "messageType": "checkin_reminder" }`.
- **Export:** JSON listo en `docs/n8n-flows/01-recordatorio-checkin.json` (importar en n8n: ··· → Import from File).

---

#### Flujo 2 – Reactivación (inactivos 2–7 días)

- **Trigger:** Schedule – diario a las 10:00 (America/Argentina/Buenos_Aires).
- **Pasos:**
  1. HTTP Request: `GET {{API_URL}}/api/n8n/users/inactive?days=2` (header API key).
  2. Iterar sobre cada usuario (`body.users`).
  3. Por cada usuario: `POST {{API_URL}}/api/n8n/openai/generate-reactivation` con `{ "userId", "daysSinceLastCheckIn" }` → `body.content`.
  4. Con el texto: `POST {{API_URL}}/api/n8n/proactive-messages` con `messageType: "reactivation"`.
- **Export:** `docs/n8n-flows/02-reactivacion.json`

---

#### Flujo 3 – Celebración (rachas / hitos)

- **Trigger:** Schedule – diario a las 18:00.
- **Pasos:**
  1. HTTP Request: `GET {{API_URL}}/api/n8n/users/milestones` (header API key).
  2. Iterar sobre cada usuario con hito (`body.users`).
  3. Por cada uno: `POST {{API_URL}}/api/n8n/openai/generate-celebration` con `{ "userId", "milestone" }` → `body.content`.
  4. Con el texto: `POST {{API_URL}}/api/n8n/proactive-messages` con `messageType: "celebration"`.
- **Export:** `docs/n8n-flows/03-celebracion.json`

---

#### Flujo 4 – Resumen semanal (opcional)

- **Trigger:** Schedule – por ejemplo lunes 9:00.
- **Pasos:**
  1. `GET {{API_URL}}/api/n8n/users/active` (header API key).
  2. Por cada usuario: `POST {{API_URL}}/api/n8n/openai/generate-weekly-report` con `{ "userId" }` → `body.content`.
  3. Con el texto: `POST {{API_URL}}/api/n8n/proactive-messages` con `messageType: "weekly_report"`.
- **Export:** `docs/n8n-flows/04-resumen-semanal.json`

---

### FASE 5 – Scheduler actual en el backend

- Cuando los flujos de n8n estén en producción y estables:
  - Desactivar o eliminar el **ProactiveScheduler** del backend (crons de recordatorio, reactivación y celebración) para no duplicar lógica.
- Opcional: mantener un solo job en backend solo para casos que no quieras orquestar en n8n (si los hubiera).

---

### FASE 6 – Backoffice y operador

- **Pantalla operador (backoffice):**
  - Lista de conversaciones/usuarios con “bot desactivado” o “tomados por operador”.
  - Ver historial reciente (`GET /api/users/:userId/conversation` o similar).
  - Enviar mensaje como “operador” (endpoint que envíe por BuilderBot con flag o metadata `role: operator`).
- **API:**  
  - Endpoint para “enviar mensaje como operador” (ej. `POST /api/users/:userId/send-message` con body `{ "content": "..." }`, auth admin).

---

### FASE 7 – Testing y despliegue

- Tests de integración de los nuevos endpoints (pending-checkin, inactive, generate-reminder, proactive-messages).
- Probar cada flujo en n8n (con API en staging) y luego importar los JSON en producción.
- Variables de entorno: `API_URL`, `N8N_API_KEY` (o la que use la API para n8n), y en n8n la URL base de la API + API key.

---

## 3. Resumen de flujos n8n para subir

| # | Nombre              | Trigger (cron)     | Acción principal                                      |
|---|---------------------|--------------------|-------------------------------------------------------|
| 1 | Recordatorio check-in | Cada hora 8–22   | GET pending-checkin → generate-reminder → proactive-messages |
| 2 | Reactivación        | Diario 10:00       | GET inactive → generate-reactivation → proactive-messages    |
| 3 | Celebración         | Diario 18:00       | GET milestones → generate-celebration → proactive-messages    |
| 4 | Resumen semanal     | Lunes 9:00         | GET active → generate-weekly-report → proactive-messages      |

Los generás en n8n, los exportás (JSON) y los subís/importás donde corresponda.

---

## 4. Orden sugerido de implementación

1. Fase 1 – Schema + operador (bot on/off) + webhook.  
2. Fase 2 – Resumen post‑interacción + uso en prompts.  
3. Fase 3 – Endpoints para n8n (listados, generate-*, proactive-messages).  
4. Fase 4 – Crear y exportar flujos en n8n; importar y configurar Schedule.  
5. Fase 5 – Apagar ProactiveScheduler del backend.  
6. Fase 6 – Backoffice operador (lista + envío de mensaje).  
7. Fase 7 – Tests y deploy.

---

## 5. Variables de entorno (recordatorio)

- **Backend:** `DATABASE_URL`, `OPENAI_API_KEY`, `BUILDERBOT_API_KEY`, `BUILDERBOT_BOT_ID`, `BUILDERBOT_WEBHOOK_SECRET`, `BUILDERBOT_API_URL`, `PORT=3001`, `N8N_API_KEY` o `API_KEY`.
- **n8n:** Variable `API_URL` (base de la API, ej. `https://tu-api.com`), `API_KEY` (mismo valor que `N8N_API_KEY` en el backend; header `X-API-Key` o `Authorization: Bearer <key>`).

---

**Documento listo para usar como plan único.** Los flujos se generan en n8n y se suben por import; el resto se implementa en el repo según este orden y sin cambiar la estructura actual.
