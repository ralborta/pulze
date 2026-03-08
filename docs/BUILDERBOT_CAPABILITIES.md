# BuilderBot - Capacidades para PULZE

## ⚠️ PULZE usa BuilderBot Cloud (app de pago por suscripción)

**No usamos el proyecto open-source** (builderbot.app / GitHub). Usamos **BuilderBot Cloud**: la aplicación de suscripción (app.builderbot.cloud / console.builderbot.app), no-code, con WhatsApp, IA integrada, webhooks y API REST según el plan.

Toda la integración (webhook, envío de mensajes, módulos, variables) debe basarse en la **documentación y consola de BuilderBot Cloud**, no en la doc del framework open-source.

---

## 🎯 Qué es BuilderBot Cloud (nuestro caso)

BuilderBot Cloud es la plataforma no-code de suscripción: creás chatbots para WhatsApp (y otros canales), con flows visuales, variables, IA y API. Los mensajes entran/salen por webhook y por la API (wa-api.builderbot.app). La lógica “pesada” (onboarding, check-in, IA) la lleva PULZE; BuilderBot Cloud es el canal y, si lo soporta el plan, los módulos/flows que elijas en la consola.

## ✅ En BuilderBot Cloud (nuestro caso)

En la **app de suscripción** tenés, según el plan: mensajería WhatsApp, flows (módulos) visuales, variables, IA integrada, webhooks hacia PULZE y API para enviar mensajes. No escribís código para el bot en Cloud; lo configurás en la consola. Los ejemplos en código que siguen son **referencia** (el open-source usa eso); en Cloud el equivalente se hace con la interfaz y la documentación de BuilderBot Cloud / Academy.

### 📱 **Mensajería**
- ✅ Envío y recepción de mensajes de texto
- ✅ **Notas de voz con transcripción automática**
- ✅ Imágenes (envío y recepción)
- ✅ Videos
- ✅ Documentos (PDF, etc.)
- ✅ Ubicación
- ✅ Contactos
- ✅ Botones interactivos
- ✅ Listas de opciones

### 🔄 **Flujos Conversacionales**
- ✅ Sistema de flows modulares
- ✅ Captura de respuestas del usuario
- ✅ Validación de inputs
- ✅ Estados y contexto
- ✅ Flujos anidados
- ✅ Redirección entre flows

### 🎤 **Notas de Voz (Importante para PULZE)**
```typescript
// BuilderBot transcribe automáticamente las notas de voz
addKeyword(EVENTS.VOICE_NOTE)
  .addAction(async (ctx, { flowDynamic }) => {
    // ctx.body ya contiene el texto transcrito
    console.log(ctx.body); // "Hola PULZE, ¿cómo estás?"
  });
```

**Ventajas:**
- No necesitas Whisper API de OpenAI
- Transcripción instantánea
- Sin costos adicionales
- Menos complejidad en el código

### 📊 **Eventos Disponibles**

```typescript
import { EVENTS } from '@builderbot/bot';

// Eventos del sistema
EVENTS.WELCOME        // Usuario inicia conversación
EVENTS.MEDIA          // Recibe multimedia (imagen, video, etc.)
EVENTS.LOCATION       // Recibe ubicación
EVENTS.DOCUMENT       // Recibe documento
EVENTS.VOICE_NOTE     // Recibe nota de voz (con transcripción)
EVENTS.ACTION         // Mensaje general (catch-all)
```

### 🔌 **Proveedores Soportados**

#### 1. **Baileys** (Gratis)
- Emula WhatsApp Web
- Login por QR
- Ideal para desarrollo y MVP
- Sin límites de mensajes
- **Limitación**: Puede ser bloqueado si se usa comercialmente

```typescript
import { BaileysProvider } from '@builderbot/provider-baileys';
const provider = createProvider(BaileysProvider);
```

#### 2. **Meta API** (Oficial)
- WhatsApp Business API oficial
- Requiere cuenta Business verificada
- Producción estable
- Webhooks incluidos
- **Costo**: Conversaciones gratis hasta cierto límite

```typescript
import { MetaProvider } from '@builderbot/provider-meta';
const provider = createProvider(MetaProvider, {
  jwtToken: process.env.META_API_TOKEN,
  numberId: process.env.META_PHONE_NUMBER_ID,
  verifyToken: process.env.META_VERIFY_TOKEN,
});
```

### 🗄️ **Bases de Datos Soportadas**

```typescript
// Memory (desarrollo)
import { MemoryDB } from '@builderbot/bot';

// PostgreSQL
import { PostgreSQLAdapter } from '@builderbot/database-postgres';

// MySQL
import { MySQLAdapter } from '@builderbot/database-mysql';

// MongoDB
import { MongoAdapter } from '@builderbot/database-mongo';

// JSON (simple persistencia)
import { JsonFileAdapter } from '@builderbot/database-json';
```

### 🎨 **Métodos Útiles**

```typescript
// En cualquier flow
.addAction(async (ctx, { flowDynamic, state, gotoFlow, endFlow }) => {
  
  // Enviar mensaje dinámico
  await flowDynamic('Mensaje al usuario');
  
  // Enviar con delay
  await flowDynamic('Esperando...', { delay: 2000 });
  
  // Enviar multimedia
  await flowDynamic([
    { body: 'Aquí tu imagen', media: 'https://example.com/image.jpg' }
  ]);
  
  // Guardar en estado
  state.update({ userName: 'Juan' });
  const name = state.get('userName');
  
  // Ir a otro flow
  return gotoFlow(otherFlow);
  
  // Terminar conversación
  return endFlow();
});
```

### 🔔 **Idle State (Usuarios Inactivos)**

```typescript
// Detectar cuando un usuario no responde
.addAnswer('¿Necesitas algo más?', { idle: 30000 }, async (ctx, { flowDynamic }) => {
  await flowDynamic('Veo que estás ocupado. Escríbeme cuando quieras 😊');
});
```

### 📤 **API HTTP para Envío**

BuilderBot incluye un endpoint para enviar mensajes desde fuera del bot:

```bash
# Enviar mensaje
curl -X POST http://localhost:3001/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5491112345678",
    "message": "Hola desde la API"
  }'
```

Útil para:
- Notificaciones desde el backoffice
- Integraciones con otros sistemas
- Recordatorios programados

---

## 📦 Módulos, variables y disparar flows (BuilderBot Cloud – app de pago)

En **BuilderBot Cloud** (la app de suscripción que usamos) cada **proyecto** puede tener **varios flows/módulos** y **variables**. La idea: tener un módulo de onboarding, otro de nutrición, otro de gym, etc., y poder ejecutar uno u otro (o pasar variables) según lo que decida PULZE.

**Importante:** En Cloud esto se configura en la **consola** (flows visuales, variables). Si existe “disparar un flow por API” o “cambiar de módulo desde el webhook”, hay que confirmarlo en la **documentación o Academy de BuilderBot Cloud** (app.builderbot.cloud), no en la doc del open-source.

A continuación, **referencia del open-source** (por si en Cloud hay conceptos similares o endpoints equivalentes):

### Flows modulares (referencia open-source)

En el framework open-source cada “módulo” es un flow con su propia keyword o **evento**:

```typescript
import { addKeyword, createFlow, utils } from '@builderbot/bot';

// Módulo onboarding
const onboardingFlow = addKeyword(utils.setEvent('EVENT_ONBOARDING'))
  .addAnswer('¿Cómo te llamo?', { capture: true }, async (ctx, { state }) => {
    await state.update({ name: ctx.body });
  })
  .addAnswer('¿Cuál es tu objetivo?', { capture: true }, async (ctx, { state }) => {
    await state.update({ goal: ctx.body });
  });

// Módulo nutrición
const nutritionFlow = addKeyword(utils.setEvent('EVENT_NUTRITION'))
  .addAnswer('Cuéntame qué comiste hoy...', { capture: true }, ...);

// Módulo gym/entreno
const gymFlow = addKeyword(utils.setEvent('EVENT_GYM'))
  .addAnswer('¿Qué entrenamiento hiciste?', { capture: true }, ...);

// Registrar todos
const flow = createFlow([onboardingFlow, nutritionFlow, gymFlow, welcomeFlow]);
```

### Variables (state)

- **`state.update({ key: value })`**: guardar datos del usuario en la conversación.
- **`state.get('key')`**: leer en pasos siguientes.
- El state es **por usuario** y se mantiene entre mensajes de la misma conversación.

Así podés guardar nombre, objetivo, restricciones, etc. en onboarding y usarlos después en nutrición o gym.

### Disparar un flow desde la API (referencia open-source)

En el **open-source** se usa **POST /v1/register** y `bot.dispatch(event, payload)`. En **BuilderBot Cloud** (nuestra app) puede existir un endpoint o flujo equivalente; hay que **consultar la documentación / Academy de BuilderBot Cloud** (y el API tester en la consola) para ver si hay “trigger flow” o “dispatch” y qué body usar.

Desde PULZE, el flujo deseado sería:

1. Recibir el webhook de BuilderBot Cloud con el mensaje del usuario.
2. Decidir en nuestro backend qué “módulo” toca (onboarding, nutrición, gym, etc.).
3. O bien **llamar a la API de BuilderBot Cloud** (si existe endpoint para disparar un flow/módulo).
4. O bien **devolver en la respuesta del webhook** un campo que BuilderBot Cloud interprete como “usar este módulo/flow” (si la consola lo permite).

### Dónde verlo en BuilderBot Cloud (app de pago)

Todo esto se confirma en la **app de suscripción**, no en la doc del open-source:

- **Consola** (app.builderbot.cloud / console.builderbot.app): proyectos, flows/módulos, variables.
- **API / API tester** (según tu plan): si hay “trigger flow”, “dispatch” o “register” y qué parámetros pide.
- **Webhooks**: qué envía BuilderBot al webhook de PULZE (¿flow actual?, ¿variables?) y si la respuesta puede indicar “cambiar a flow X”.
- **Academy / documentación** de BuilderBot Cloud: cómo se nombran flows, variables y uso de la API.

En resumen: **sí es posible** en concepto (módulos onboarding, nutrición, gym + variables); para implementarlo con **BuilderBot Cloud** hay que usar **solo la doc y la consola de la app de pago**, no la del open-source.

---

## ✅ Que la app dispare el flow y envíe variables (tu idea)

Tu idea: **que la app (PULZE) verifique si está suscrito, y si no → que envíe a BuilderBot variables** para que BuilderBot abra un módulo/flow (ej. onboarding) y que todo se dispare desde la app.

**Sí es posible** con BuilderBot Cloud de dos maneras:

### 1. Respuesta del webhook con variables

- BuilderBot recibe el mensaje en WhatsApp y **llama a tu webhook** (PULZE).
- En PULZE: consultás tu base de datos (¿está suscrito?, ¿onboarding completo?) y respondés con un JSON, por ejemplo:
  ```json
  {
    "message": "Hola! Te redirijo al onboarding...",
    "subscribed": false,
    "flow": "onboarding"
  }
  ```
- En BuilderBot configurás un **Flow** donde el primer nodo es “HTTP Request” (o “Webhook”) que llama a PULZE; el nodo siguiente usa la **respuesta** (en muchos sistemas se expone como `$json` o similar).
- Con un nodo **Switch / IF** en el Flow usás esa variable (ej. `flow === "onboarding"`) y llamás al sub-workflow correspondiente (**Call Workflow** → onboarding, nutrición, gym). Así **la app “dispara” qué flow se ejecuta** y le **envía variables** en la misma respuesta.

Hay que confirmar en la consola de BuilderBot cómo se nombra la respuesta del HTTP Request (ej. `$json.flow`, `body.flow`) para usarla en el Switch.

### 2. API de BuilderBot: metadata del contacto

- BuilderBot tiene en su API la opción de **agregar o actualizar metadata del contacto** (variables por chat/contacto):
  - “Send message and **add metadata** to the chat's contact”
  - “**Update contact metadata**” (PATCH)
- Flujo posible:
  1. Llega mensaje → BuilderBot llama a tu webhook.
  2. PULZE verifica suscripción y responde con el mensaje a enviar.
  3. PULZE además llama a la **API de BuilderBot** para **actualizar metadata** del contacto (ej. `subscribed: false`, `flow: onboarding`).
  4. En BuilderBot tenés un Flow que, después de recibir mensaje (o en el siguiente paso), **lee la metadata del contacto** y con un Switch/Call Workflow envía al usuario al flow “onboarding”, “nutrición” o “gym”.

Así **la app envía variables a BuilderBot** vía API (metadata del contacto) y BuilderBot usa esas variables para decidir el módulo/flow.

### Resumen

| Qué querés | Cómo |
|------------|------|
| Que la app verifique si está suscrito | En el webhook de PULZE consultás tu DB y decidís. |
| Que la app envíe variables a BuilderBot | (1) En el **body de la respuesta del webhook** (message + flow, subscribed, etc.) y en el Flow usás esa respuesta en un Switch; o (2) llamando a la **API de BuilderBot** para **update contact metadata** con esas variables. |
| Que se dispare un módulo/flow según eso | En BuilderBot: nodo **Switch** según la variable (del webhook o de la metadata del contacto) + **Call Workflow** al flow de onboarding, nutrición o gym. |

Para implementarlo solo falta revisar en la **consola y documentación de BuilderBot** (API tester, Flows): formato exacto del “Update contact metadata” y cómo se expone la respuesta del HTTP Request en los nodos siguientes para usar las variables que envía la app.

---

## 📱 Cómo se integra tu estructura de flows (inicio → menu → nutricion) con PULZE

### Tu estructura en BuilderBot

- **Flow "inicio"**: trigger "hola" / cualquier mensaje → preguntar nombre → guardar `{{nombre}}` → siguiente: "menu"
- **Flow "menu"**: mostrar opciones (1 Nutrición, 2 Gym, 3 Progreso) → según respuesta ir a "nutricion", "gym", etc.
- **Flow "nutricion"**: mostrar plan nutrición → volver a "menu"

### Quién consulta la base de datos

**La base de datos está en PULZE (PostgreSQL), no en BuilderBot.** BuilderBot no consulta la DB directamente.

- Cuando el usuario manda un mensaje, BuilderBot puede llamar **primero** a nuestro webhook.
- **PULZE** (nuestro backend) recibe el mensaje y el teléfono, **consulta la DB** (¿existe usuario?, ¿completó onboarding?, ¿está suscrito?, etc.) y responde con un JSON.
- BuilderBot usa esa respuesta para decidir a qué flow ir y qué mensaje mostrar.

Es decir: **la consulta a la DB la hace PULZE en el webhook**; BuilderBot solo hace HTTP a nuestra URL y usa la respuesta.

### Flujo con verificación de registro (integrado)

1. **Trigger en BuilderBot**: cualquier mensaje entrante (o "hola").
2. **Primera acción del Flow**: **HTTP Request** a PULZE, por ejemplo:
   - **URL:** `https://pulze-pulze.wd75db.easypanel.host/api/webhooks/builderbot` (o la URL de tu API).
   - **Método:** POST.
   - **Body:** el mismo que BuilderBot recibe (from, message, etc.) o un JSON con `{ "from": "{{from}}", "message": "{{body}}" }`.
3. **PULZE hace**:
   - `userService.findByPhone(phone)` → ¿existe usuario?
   - Si no existe → crea usuario, onboarding no completo.
   - Si existe → lee `user.onboardingComplete`, `user.name`, suscripción si la tenés, etc.
   - Responde algo como:
     ```json
     {
       "message": "¡Hola! ¿Cuál es tu nombre?",
       "flow": "inicio",
       "registered": false,
       "nombre": null
     }
     ```
     o si ya está registrado:
     ```json
     {
       "message": "Hola {{nombre}}, ¿qué deseas? 1️⃣ Nutrición 2️⃣ Gym 3️⃣ Progreso",
       "flow": "menu",
       "registered": true,
       "nombre": "Juan"
     }
     ```
4. **En BuilderBot**, después del nodo HTTP Request:
   - Usás la **respuesta** (ej. `$json.flow`, `$json.registered`, `$json.nombre`).
   - **Switch / IF**: si `registered === false` → siguiente flow **"inicio"** (pedir nombre, etc.); si `registered === true` → siguiente flow **"menu"** (y podés usar `$json.nombre` en el mensaje).
   - El **mensaje** que mostrás al usuario puede ser `$json.message` (lo genera PULZE) o armar el texto en BuilderBot con las variables que devolvió PULZE.

Así **verificar registro = llamar al webhook de PULZE**; la lógica y la DB siguen en nuestra plataforma.

### Resumen

| Paso | Quién | Qué hace |
|------|--------|----------|
| Usuario escribe por WhatsApp | BuilderBot | Recibe el mensaje. |
| BuilderBot ejecuta el Flow | BuilderBot | Primer nodo: **HTTP Request** a PULZE (webhook). |
| PULZE recibe el request | **PULZE** | **Consulta la DB** (findByPhone, onboardingComplete, etc.). |
| PULZE responde | **PULZE** | Devuelve `{ message, flow, registered, nombre, ... }`. |
| BuilderBot recibe la respuesta | BuilderBot | Usa `flow` y `registered` en un **Switch** → siguiente flow: "inicio" o "menu". |
| BuilderBot envía mensaje al usuario | BuilderBot | Usa `message` de PULZE o arma el texto con `nombre`, etc. |

No hace falta que BuilderBot tenga su propia base de datos para “verificar registro”: **esa verificación la hace PULZE en el webhook**. Solo tenés que configurar en BuilderBot que el primer paso del flow sea llamar a nuestra API y usar la respuesta para decidir el siguiente flow.

**Nota:** Nuestro webhook actual ya consulta la DB y devuelve `{ message }`. Para que BuilderBot use los flows inicio/menu/nutricion y solo pida "qué flow y qué variables", se puede extender la respuesta con `flow`, `registered`, `nombre`, o crear un endpoint `/api/webhooks/builderbot/route` que solo devuelva esas variables.

---

## 🚀 Arquitectura Recomendada para PULZE

```
┌─────────────────────────────────────────┐
│         USUARIOS (WhatsApp)              │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          BUILDERBOT (Railway)            │
│                                          │
│  ┌────────────────────────────────┐    │
│  │  Provider (Baileys/Meta)       │    │
│  └────────────────────────────────┘    │
│                  │                       │
│  ┌───────────────┴───────────────┐     │
│  │                                │     │
│  ▼                                ▼     │
│  Flows                      Services    │
│  • Welcome                  • AI        │
│  • CheckIn                  • User      │
│  • Conversation             • CheckIn   │
│  • Voice Notes              • Scheduler │
│                                          │
└─────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
    [PostgreSQL]      [OpenAI API]
```

## 💡 Tips para PULZE

### 1. **Usar Baileys para MVP**
```typescript
// Rápido, gratis, ideal para validar
const provider = createProvider(BaileysProvider);
```

### 2. **Migrar a Meta API para Producción**
```typescript
// Cuando tengas usuarios reales
const provider = createProvider(MetaProvider, {
  jwtToken: process.env.META_API_TOKEN,
  // ...
});
```

### 3. **Aprovechar Notas de Voz**
```typescript
// Usuario envía voz → BuilderBot transcribe → IA responde
addKeyword(EVENTS.VOICE_NOTE)
  .addAction(async (ctx, { flowDynamic }) => {
    const aiResponse = await openai.chat.completions.create({
      messages: [{ role: 'user', content: ctx.body }]
    });
    await flowDynamic(aiResponse);
  });
```

### 4. **Estado Persistente**
```typescript
// Guardar contexto entre mensajes
state.update({
  lastCheckIn: new Date(),
  streak: 7,
  goal: 'bajar peso'
});
```

### 5. **Schedulers Externos**
BuilderBot no tiene cron jobs nativos, pero puedes usar:
- Node-cron
- Bull (con Redis)
- External scheduler → API HTTP de BuilderBot

## 📚 Recursos

- **BuilderBot Cloud (el que usamos):** [app.builderbot.cloud](https://app.builderbot.cloud), [builderbot.cloud](https://www.builderbot.cloud) — Academy y documentación de la app de pago por suscripción.
- Referencia open-source (solo conceptos): [builderbot.app](https://builderbot.app), [GitHub](https://github.com/codigoencasa/builderbot).

## ⚠️ Limitaciones a Conocer

1. **Baileys puede ser bloqueado**: No usar comercialmente sin riesgo
2. **Sin videollamadas**: BuilderBot es solo mensajería
3. **Rate limits**: Meta API tiene límites por tier
4. **Sesiones**: Baileys guarda sesión local (no cloud)

## ✅ Lo que BuilderBot NO hace (y necesitas agregar)

- ❌ AI/ML (necesitas OpenAI, Anthropic, etc.)
- ❌ Analytics avanzado (necesitas tu DB + lógica)
- ❌ Dashboard admin (necesitas crear tu backoffice)
- ❌ Payments (necesitas Stripe, MercadoPago, etc.)
- ❌ Email (necesitas SendGrid, etc.)

**BuilderBot es el motor de mensajería. El resto lo construyes tú.**

## 🎉 Conclusión

BuilderBot te da:
- ✅ Conexión con WhatsApp
- ✅ Gestión de conversaciones
- ✅ Transcripción de voz
- ✅ Multimedia
- ✅ Estados y contexto

Tú agregas:
- 🧠 Inteligencia (OpenAI)
- 📊 Lógica de negocio
- 💾 Persistencia (DB)
- 📱 Frontend (WebApp)
- 💼 Backoffice

**Es el stack perfecto para PULZE** 🚀
