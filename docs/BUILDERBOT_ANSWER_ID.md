# Cómo obtener el BUILDERBOT_ANSWER_ID

El `BUILDERBOT_ANSWER_ID` es el identificador del **Agente de IA** o nodo "Answer" en tu flow de BuilderBot. PULZE lo usa para enviar instrucciones dinámicas al agente vía API.

## Documentación oficial (BuilderBot Cloud)

Según la [documentación de BuilderBot Cloud](https://app.builderbot.cloud):

- **Endpoint:** `POST /api/v2/{id}/answer/{answerId}/plugin/assistant`
- **Base URL:** `https://app.builderbot.cloud/api/v2`
- **Body:** `{ "instructions": "..." }`
- **Header:** `x-api-builderbot: API_KEY`

PULZE usa esta URL por defecto. Si necesitás otra, configurá `BUILDERBOT_ASSISTANT_API_URL` o `BUILDERBOT_API_URL`.

## Referencia: builderchat

El proyecto **builderchat** usa el mismo endpoint. Si builderchat funciona, usá las **mismas variables** en PULZE:
- `BUILDERBOT_BOT_ID` = Project ID (ej: `df6916fd-6561-4f4f-afbc-be203eaf4839`)
- `BUILDERBOT_ANSWER_ID` = Flow ID (ej: `75296dcd-976a-4b2b-a943-5f4fbb05eb4c`)
- `BUILDERBOT_API_KEY`

## Dónde buscarlo

### 1. URL del navegador (más común)
Cuando editas un flow en BuilderBot Cloud:

1. Entrá a **app.builderbot.cloud** o **console.builderbot.app**
2. Abrí tu proyecto
3. Editá el flow que tiene el **Agente de IA** o nodo que responde con OpenAI
4. **Hacé clic en el nodo del Agente** (el que hace la petición HTTP a PULZE o el que usa IA)
5. Mirá la **URL del navegador** — a veces el ID aparece en la ruta, por ejemplo:
   - `.../flows/75296dcd-976a-4b2b-a943-5f4fbb05eb4c`
   - `.../answer/abc123-def456`
   - `.../plugin/assistant/xyz789`

El ID suele ser un **UUID** (ej: `75296dcd-976a-4b2b-a943-5f4fbb05eb4c`) o un string alfanumérico.

### 2. Configuración del nodo
En la configuración del nodo "Petición HTTP" o "Agente IA":
- Buscá un campo "ID" o "Answer ID"
- O en "Propiedades avanzadas" / "Metadata"

### 3. Inspección de red (DevTools)
1. Abrí las DevTools del navegador (F12) → pestaña **Network**
2. Hacé una acción en el flow (ej: enviar un mensaje de prueba)
3. Buscá requests a `wa-api.builderbot.app` o la API de BuilderBot
4. Revisá la URL de las peticiones — el answer ID puede estar en la ruta

### 4. Documentación / Soporte de BuilderBot
- **Help Center:** https://console.builderbot.app/help
- **Soporte:** support@builderbot.cloud
- Preguntá: *"¿Cuál es el endpoint para actualizar el prompt/instrucciones del Agente de IA vía API? ¿Dónde encuentro el Answer ID?"*

## Variables relacionadas

| Variable | Dónde | Ejemplo |
|----------|-------|---------|
| `BUILDERBOT_BOT_ID` | Settings → API del proyecto | `proj_abc123` |
| `BUILDERBOT_ANSWER_ID` | Flow / nodo del Agente (ver arriba) | `75296dcd-976a-4b2b-a943-5f4fbb05eb4c` |
| `BUILDERBOT_API_KEY` | Settings → API | `bb_live_xxx` |

## BUILDERBOT_WEBHOOK_SECRET (opcional)

BuilderBot Cloud **no muestra** un campo para webhook secret en su configuración. Opciones:

### Sin verificación (por defecto)
Dejá `BUILDERBOT_WEBHOOK_SECRET` vacío. El webhook funciona; solo verás un warning en logs.

### Con verificación (token en header personalizado)
1. Generá un token: `openssl rand -hex 32`
2. En **BuilderBot** → Configuración de webhooks → "Headers personalizados" → agregar:
   - **Nombre:** `x-webhook-secret`
   - **Valor:** tu token
3. En **Easypanel** (PULZE) → Variables de entorno:
   - `BUILDERBOT_WEBHOOK_SECRET` = el mismo token

---

## Si el endpoint no existe (404)

Es posible que BuilderBot Cloud **no exponga** un endpoint para actualizar instrucciones dinámicamente. En ese caso:

1. **Contactá a BuilderBot** para confirmar si existe ese endpoint
2. **Plan B:** PULZE podría generar el mensaje con OpenAI y devolverlo en `message` (en vez de confiar en que BuilderBot use instrucciones dinámicas)
