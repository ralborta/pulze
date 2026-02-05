# BuilderBot - Capacidades Nativas

## 🎯 ¿Qué es BuilderBot?

BuilderBot es un framework open-source para crear chatbots de WhatsApp, Telegram y otros canales. Está optimizado para conversaciones de baja frecuencia y ofrece una arquitectura modular.

## ✅ Capacidades Nativas (Sin configuración adicional)

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

- [Documentación oficial](https://builderbot.app/)
- [GitHub](https://github.com/codigoencasa/builderbot)
- [Discord](https://link.codigoencasa.com/DISCORD)
- [Ejemplos](https://builderbot.app/uses-cases)

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
