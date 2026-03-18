# Guía: Prompt e instrucciones para BuilderBot

## Cómo funciona el flujo PULZE ↔ BuilderBot

1. **Usuario envía mensaje** → BuilderBot hace POST a tu webhook (`/api/webhooks/builderbot`)
2. **PULZE responde** con `{ message, flow, registered, nombre }`
3. **BuilderBot usa** esos campos según cómo esté armado tu flow

## APIs de BuilderBot que usa PULZE

| Endpoint | Uso |
|----------|-----|
| `POST /api/v2/{id}/clear-conversation` | Limpia el historial con el contacto antes del 2º mensaje en onboarding. Evita que el Plugin Assistant repita el mensaje de bienvenida. |
| `POST /api/v2/{id}/answer/{answerId}/plugin/assistant` | Actualiza las instructions (prompt) del asistente. |
| `POST /api/v2/{id}/mute` | Silenciar/activar bot (global). Útil si el flow responde antes del webhook. |

---

## ⚠️ Evitar doble respuesta y mensajes repetidos

**Problema:** Si el flow envía el mensaje del webhook Y además usa el Plugin Assistant, el usuario recibe dos mensajes. O el mensaje de bienvenida se repite cuando ya no corresponde.

**Solución:** PULZE limpia el historial (`clear-conversation`) en el 2º mensaje del onboarding y devuelve `message` con zero-width space. El flow de BuilderBot debe:

1. **Solo enviar** el campo `message` de la respuesta del webhook
2. **No enviar** al Plugin Assistant cuando el webhook devuelve un mensaje

Configurá el flow así:
- Nodo "Petición HTTP" → llama al webhook de PULZE
- Nodo "Enviar mensaje" → usa `{{message}}` (o la variable que mapee el JSON)
- **No** agregues un nodo de Plugin Assistant en paralelo que también responda

---

Hay **dos formas** de que el usuario reciba la respuesta:

| Método | Cuándo | Quién genera el mensaje |
|--------|--------|-------------------------|
| **Variable `message`** | Flow tiene nodo "Enviar mensaje" con `{{message}}` | PULZE (ya armado en el webhook) |
| **Plugin Assistant** | Flow envía al nodo de IA | La IA de BuilderBot (usando las `instructions`) |

---

## Si usás la variable `message` del webhook

En tu flow de BuilderBot, el nodo que envía el mensaje al usuario debe usar la respuesta del webhook:

- **Variable:** `message` (o como la exponga tu nodo "Petición HTTP")
- **Ejemplo en plantilla:** `{{message}}` o `{{body.message}}` según cómo BuilderBot mapee el JSON

En ese caso **no necesitás** instrucciones especiales en el prompt: el mensaje ya viene armado desde PULZE.

---

## Si usás el Plugin Assistant (Agente de IA)

Cuando el flow va al **Plugin Assistant**, la IA genera la respuesta usando las **instructions** que PULZE envía vía API (`updateAssistantInstructions`).  
**Importante:** el Plugin Assistant **no recibe** automáticamente el JSON del webhook. Solo recibe:

- El mensaje del usuario (`body`)
- Las **instructions** (system prompt) que PULZE actualiza por API

Por eso las instructions deben incluir **todos los datos** que la IA necesita para responder bien.

---

## Qué poner en el prompt para que reciba los datos y no responda otra cosa

### 1. Incluir explícitamente los datos en las instructions

Las instructions deben contener **todo el contexto** que la IA necesita. PULZE ya hace esto en `buildInstructions()`:

```
CONTEXTO DEL USUARIO:
Nombre del usuario: Juan
Objetivo: bajar peso
Peso/altura: 75 kg, 1.70 m
...

TAREA PARA ESTE TURNO:
El usuario acaba de decirte su nombre: "Juan". Confirmalo y preguntale peso y altura...
```

### 2. Instrucción clara de formato de salida

Para que la IA no agregue explicaciones ni texto extra:

```
IMPORTANTE: Respondé solo con el mensaje para el usuario. Sin explicaciones, sin prefijos, sin comillas. Directo y natural, como si fuera WhatsApp.
```

Variantes más estrictas que podés probar:

```
REGLA DE SALIDA: Tu respuesta debe ser ÚNICAMENTE el mensaje que el usuario verá en WhatsApp. Nada más. Sin "Aquí está tu mensaje:", sin markdown, sin explicaciones.
```

```
OUTPUT: Solo el texto del mensaje. Ni un carácter más. Sin prefijos como "Mensaje:" o comillas.
```

### 3. Si BuilderBot pasa la respuesta del webhook al Assistant

Si en tu flow el nodo "Plugin Assistant" recibe variables del webhook (por ejemplo `message`, `nombre`), podés referenciarlas en las instructions del nodo en BuilderBot, por ejemplo:

- `Si el webhook devolvió un mensaje en {{message}}, usalo literalmente. Si está vacío, generá según las instructions.`

Esto depende de cómo BuilderBot Cloud permita inyectar variables en el prompt del Assistant. Revisá la configuración del nodo en el flow.

### 4. Alternativa: no usar IA para onboarding

Si la IA sigue "inventando" respuestas, una opción es que **PULZE genere el mensaje** (con OpenAI o plantillas) y lo ponga en `message`. Así BuilderBot solo envía ese texto y no usa el Plugin Assistant para esos pasos.

En el webhook, en vez de:

```ts
webhookPayload('', { flow: 'onboarding', registered: true, nombre })
```

usarías:

```ts
const msg = '¡Gracias, Juan! Confirmo tu nombre. ¿Me pasás tu peso y altura? Algo como 75 kg y 1.70 m.'
webhookPayload(msg, { flow: 'onboarding', registered: true, nombre: 'Juan' })
```

---

## Resumen de recomendaciones

| Objetivo | Qué hacer |
|----------|-----------|
| Que la IA use los datos correctos | Poner todos los datos en la sección CONTEXTO de las instructions |
| Que no agregue texto extra | Incluir "Respondé solo con el mensaje. Sin explicaciones, prefijos ni comillas" |
| Que no invente respuestas | Ser muy explícito en la TAREA: "El usuario dijo X. Hacé Y. Una sola pregunta." |
| Evitar problemas con la IA | Considerar generar el mensaje en PULZE y enviarlo en `message` |

---

## Documentación de BuilderBot

- **Webhooks:** https://console.builderbot.app/help/webhooks (requiere login)
- **Flows:** https://console.builderbot.app/help/flows
- **API Assistant:** `POST /api/v2/{botId}/answer/{answerId}/plugin/assistant` con `{ "instructions": "..." }`
- **Soporte:** support@builderbot.cloud — para confirmar cómo el Plugin Assistant recibe variables del webhook
