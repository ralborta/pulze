# BuilderBot Integration - Documentación Completa

## 📋 **Sobre BuilderBot.app**

### **¿Qué es?**
BuilderBot.app es una plataforma cloud que facilita la conexión y gestión de bots de WhatsApp Business API.

### **Capacidades Clave:**

#### **1. Procesamiento de Mensajes con IA Nativa (GRATIS/INCLUIDO)**
- ✅ **Extracción de entidades**: Nombres, números, fechas, lugares
- ✅ **Detección de intenciones**: Consulta, queja, solicitud, etc.
- ✅ **Conversión voz a texto**: Notas de voz automáticas
- ✅ **OCR de imágenes**: Extrae texto de fotos
- ✅ **Clasificación de contenido**: Detecta tipo de imagen (comida, persona, documento)

#### **2. Gestión de WhatsApp**
- ✅ Conexión con WhatsApp Business API
- ✅ Manejo de sesiones y estado
- ✅ Envío y recepción de mensajes
- ✅ Soporte para multimedia (imágenes, audio, video, documentos)
- ✅ Botones y listas interactivas

#### **3. Webhooks Bidireccionales**
- ✅ **Entrantes**: BuilderBot → Tu Backend (cuando usuario envía mensaje)
- ✅ **Salientes**: Tu Backend → BuilderBot (para enviar mensajes proactivos)

---

## 🏗️ **Arquitectura de Integración PULZE**

### **Flujo de Comunicación:**

```
┌────────────────────────────────────────────────────────┐
│  Usuario en WhatsApp                                   │
│  Envía: "¿Puedo comer pizza?"                          │
└────────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────────┐
│  BuilderBot.app (Plataforma Cloud)                     │
│  ✅ Recibe mensaje                                     │
│  ✅ Procesa con su IA:                                 │
│     - Detecta intención: "consulta_nutricion"         │
│     - Extrae entidad: "pizza"                         │
│     - Analiza sentimiento: "neutral/positivo"         │
│  ✅ Envía webhook a tu backend                        │
└────────────────────────────────────────────────────────┘
                    ↓
        POST https://tu-bot.railway.app/api/webhooks/builderbot
        {
          "from": "+5491112345678",
          "message": "¿Puedo comer pizza?",
          "intent": "consulta_nutricion",
          "entities": {
            "food": "pizza"
          },
          "sentiment": "neutral",
          "timestamp": "2024-02-17T19:30:00Z"
        }
                    ↓
┌────────────────────────────────────────────────────────┐
│  TU BACKEND (Railway)                                  │
│  1. Busca usuario por phone                            │
│  2. Carga contexto completo (UserContext)             │
│  3. Construye prompt dinámico con:                     │
│     - Perfil (objetivo, restricciones)                │
│     - Progreso (peso, racha, check-ins)               │
│     - Historial reciente                              │
│     - Patrones de comportamiento                      │
│  4. Decide si usar GPT-4 o respuesta template        │
│  5. Genera respuesta personalizada                    │
│  6. Guarda interacción en DB                          │
│  7. Actualiza contexto y patrones                     │
└────────────────────────────────────────────────────────┘
                    ↓
        RESPONSE 200 OK
        {
          "message": "Che Juan, mirá tu progreso: 7 días seguidos, -2kg...",
          "buttons": [],  // Opcional
          "media": null   // Opcional
        }
                    ↓
┌────────────────────────────────────────────────────────┐
│  BuilderBot.app                                        │
│  ✅ Recibe respuesta                                  │
│  ✅ Envía mensaje a usuario en WhatsApp               │
└────────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────────┐
│  Usuario en WhatsApp                                   │
│  Recibe: "Che Juan, mirá tu progreso..."              │
└────────────────────────────────────────────────────────┘
```

---

## 📤 **Mensajes Proactivos (PULZE → Usuario)**

### **Cron Job en tu Backend:**

```
Cada hora, tu backend:
  1. Detecta usuarios que necesitan mensaje
  2. Construye prompt con contexto completo
  3. Genera mensaje personalizado (GPT-4)
  4. Llama API de BuilderBot para enviar
```

### **Ejemplo de API Call:**

```typescript
// POST https://api.builderbot.app/v1/messages/send
{
  "api_key": "tu_api_key",
  "phone": "+5491112345678",
  "message": "Buenos días Juan 🌅\n\nAyer me dijiste que dormiste solo 5 horas...",
  "buttons": [
    { "id": "checkin_si", "text": "Sí, hoy mejor" },
    { "id": "checkin_no", "text": "No, sigo igual" }
  ]
}
```

---

## 🔑 **Endpoints de BuilderBot API**

### **1. Enviar Mensaje**
```http
POST https://api.builderbot.app/v1/messages/send
Authorization: Bearer YOUR_API_KEY

Body:
{
  "phone": "+5491112345678",
  "message": "Texto del mensaje",
  "buttons": [],  // Opcional
  "media": {      // Opcional
    "url": "https://...",
    "type": "image" // image, audio, video, document
  }
}
```

### **2. Enviar Mensaje con Template**
```http
POST https://api.builderbot.app/v1/messages/template
Authorization: Bearer YOUR_API_KEY

Body:
{
  "phone": "+5491112345678",
  "template_id": "checkin_morning",
  "variables": {
    "name": "Juan",
    "streak": "7"
  }
}
```

### **3. Obtener Estado de Mensaje**
```http
GET https://api.builderbot.app/v1/messages/{message_id}/status
Authorization: Bearer YOUR_API_KEY
```

### **4. Configurar Webhook**
```http
POST https://api.builderbot.app/v1/webhooks/config
Authorization: Bearer YOUR_API_KEY

Body:
{
  "url": "https://tu-bot.railway.app/api/webhooks/builderbot",
  "events": ["message", "status", "media"]
}
```

---

## 📸 **Manejo de Imágenes (BuilderBot Nativo)**

### **Recepción de Imagen:**

```json
POST /api/webhooks/builderbot
{
  "from": "+5491112345678",
  "type": "image",
  "media": {
    "url": "https://cdn.builderbot.app/...",
    "mime_type": "image/jpeg",
    "caption": "Mi almuerzo de hoy"
  },
  "analysis": {
    "detected_objects": ["plato", "pollo", "arroz", "ensalada"],
    "detected_text": "",  // OCR si hay texto
    "confidence": 0.92,
    "category": "food"
  }
}
```

### **Tu Backend procesa:**

```typescript
if (message.type === 'image' && message.analysis.category === 'food') {
  // 1. Guardar en NutritionLog
  await prisma.nutritionLog.create({
    data: {
      userId: user.id,
      mealType: detectMealType(currentTime),
      description: message.analysis.detected_objects.join(', '),
      photoUrl: message.media.url,
    }
  })
  
  // 2. Generar feedback (opcional con GPT-4 Vision para análisis profundo)
  const feedback = await generateNutritionFeedback(user, message.analysis)
  
  // 3. Responder
  return {
    message: feedback
  }
}
```

---

## 🎯 **Optimización de Costos**

### **Regla de Oro:**

```typescript
// ❌ NO uses GPT-4 para:
- Extraer datos básicos → BuilderBot ya lo hace
- Validar formato → BuilderBot ya lo hace  
- Conversación simple → Templates predefinidos

// ✅ SÍ usa GPT-4 para:
- Recomendaciones personalizadas basadas en 5+ variables
- Micro-acciones adaptadas a perfil completo
- Mensajes emocionales profundos
- Análisis nutricional avanzado de imágenes (GPT-4 Vision)
```

### **Ejemplo de Decisión:**

```typescript
async function handleMessage(message, user) {
  // BuilderBot ya procesó
  const { intent, entities } = message
  
  // Decisión de routing
  if (intent === 'consulta_simple') {
    // Usar template predefinido (GRATIS)
    return templates.getResponse(intent, entities)
  }
  
  if (intent === 'consulta_nutricion' || intent === 'consulta_entreno') {
    // Necesita contexto profundo → GPT-4
    const context = await buildFullContext(user.id)
    return await aiService.generateCoachResponse(message, context)
  }
  
  if (intent === 'checkin') {
    // Mezcla: BuilderBot extrae datos, GPT-4 genera recomendación
    const checkInData = extractCheckInData(entities)
    const recommendation = await aiService.generateDailyRecommendation(user, checkInData)
    return recommendation
  }
}
```

---

## 🔐 **Autenticación y Seguridad**

### **API Key de BuilderBot:**
```bash
# En tu .env
BUILDERBOT_API_KEY="bb_live_xxxxxxxxxxxxxxxxxx"
BUILDERBOT_WEBHOOK_SECRET="webhook_secret_xxxxxxxxxxx"
```

### **Verificar Webhook:**
```typescript
// Middleware para verificar que el webhook viene de BuilderBot
function verifyBuilderBotWebhook(req, res, next) {
  const signature = req.headers['x-builderbot-signature']
  const timestamp = req.headers['x-builderbot-timestamp']
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.BUILDERBOT_WEBHOOK_SECRET)
    .update(`${timestamp}.${JSON.stringify(req.body)}`)
    .digest('hex')
  
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' })
  }
  
  next()
}
```

---

## 📊 **Eventos de BuilderBot**

BuilderBot puede enviarte diferentes tipos de eventos:

### **1. message** - Mensaje entrante
```json
{
  "event": "message",
  "from": "+5491112345678",
  "message": "texto...",
  "type": "text|image|audio|video|document",
  "timestamp": "..."
}
```

### **2. status** - Cambio de estado de mensaje
```json
{
  "event": "status",
  "message_id": "msg_xxx",
  "status": "sent|delivered|read|failed",
  "timestamp": "..."
}
```

### **3. media** - Archivo multimedia procesado
```json
{
  "event": "media",
  "message_id": "msg_xxx",
  "media": { ... },
  "analysis": { ... }
}
```

---

## 🚀 **Próximos Pasos de Implementación**

### **FASE 1: Webhook Receiver (AHORA)**
1. ✅ Crear endpoint POST /api/webhooks/builderbot
2. ✅ Verificar firma de BuilderBot
3. ✅ Parsear mensaje y extraer datos
4. ✅ Routing según intent
5. ✅ Responder con JSON

### **FASE 2: Context Engine**
1. ✅ PromptBuilderService
2. ✅ PatternAnalyzer
3. ✅ ContextUpdater
4. ✅ AISummaryGenerator

### **FASE 3: Proactive System**
1. ✅ BuilderBot API Client
2. ✅ Scheduler (cron jobs)
3. ✅ Message Queue
4. ✅ Proactive message generation

### **FASE 4: Image Processing (V2)**
1. ✅ Nutrition photo analysis
2. ✅ Progress photo tracking
3. ✅ GPT-4 Vision integration

---

## 📝 **Checklist de Configuración**

- [ ] Crear cuenta en BuilderBot.app
- [ ] Conectar número de WhatsApp Business
- [ ] Obtener API Key
- [ ] Configurar webhook URL apuntando a Railway
- [ ] Agregar webhook secret a .env
- [ ] Probar envío de mensaje de prueba
- [ ] Configurar eventos (message, status, media)
- [ ] Validar recepción de webhooks

---

## 🔗 **Links Útiles**

- Dashboard BuilderBot: https://app.builderbot.app
- Documentación API: https://docs.builderbot.app
- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp
- Límites y Rate Limits: https://docs.builderbot.app/limits

---

**Conclusión:** BuilderBot maneja todo el "plumbing" de WhatsApp y procesamiento básico con IA, mientras tu backend se enfoca en la inteligencia y personalización profunda que hace único a PULZE.
