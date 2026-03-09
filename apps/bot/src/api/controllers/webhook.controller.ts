import { Request, Response } from 'express'
import { userService, prisma, checkInService } from '@pulze/database'
import { aiService, contextService, contextUpdater, promptBuilderService } from '../../services/ai'
import { parseCheckInMessage } from '../../utils/checkin-parser'
import { builderBotClient } from '../../services/builderbot'

/**
 * Tipos de eventos de BuilderBot
 * BuilderBot puede enviar el texto en "message" o en "body"
 */
interface BuilderBotMessage {
  event: 'message' | 'status' | 'media' | 'outgoing'
  from: string
  message?: string
  body?: string
  type?: 'text' | 'image' | 'audio' | 'video' | 'document'
  
  // Procesamiento de IA de BuilderBot
  intent?: string
  entities?: Record<string, any>
  sentiment?: 'positive' | 'negative' | 'neutral'
  
  // Para imágenes
  media?: {
    url: string
    mime_type: string
    caption?: string
  }
  analysis?: {
    detected_objects?: string[]
    detected_text?: string
    confidence?: number
    category?: string
  }
  
  // Para estados de mensaje
  message_id?: string
  status?: 'sent' | 'delivered' | 'read' | 'failed'
  
  timestamp: string
}

/** Extrae un teléfono desde cualquier formato (string, number, object con id/wa_id). */
function extractPhone(value: any): string {
  if (value == null) return ''
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value.trim()
  const s = value?.id ?? value?.wa_id ?? value?.phone ?? value?.sender
  return s != null ? String(s).trim() : ''
}

/** Extrae texto de mensaje desde string u objeto (body, text.body, etc.). */
function extractMessageText(value: any): string {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  const t = value?.text?.body ?? value?.text ?? value?.body ?? value?.content
  return t != null ? String(t).trim() : ''
}

/**
 * Normaliza el body del webhook.
 * BuilderBot Cloud envía siempre: { eventName, data: { from, body, name, attachment, ... }, projectId }
 * - eventName: "message.incoming" | "message.outgoing" | etc.
 * - data.from: teléfono del usuario
 * - data.body: texto del mensaje
 * - data.name: nombre de WhatsApp del usuario (opcional)
 */
function normalizeBuilderBotPayload(body: any): BuilderBotMessage & { event: string } {
  const raw = body || {}
  const data = raw.data || {}

  // eventName puede ser "message.incoming", "message.outgoing", "message", etc.
  const eventNameRaw: string = raw.eventName ?? raw.event ?? ''
  // Normalizar a los tipos que usa el switch: message | status | media
  let event = 'message'
  if (eventNameRaw.includes('incoming') || eventNameRaw === 'message') event = 'message'
  else if (eventNameRaw.includes('outgoing')) event = 'outgoing'
  else if (eventNameRaw.includes('status')) event = 'status'
  else if (eventNameRaw.includes('media')) event = 'media'

  // from: siempre en data.from (BuilderBot Cloud); fallback raíz
  let from = extractPhone(data.from ?? raw.from ?? data.phone ?? data.sender ?? data.wa_id ?? '')

  // body (mensaje del usuario): data.body es el campo estándar de BuilderBot Cloud
  let message = extractMessageText(
    data.body ?? data.message ?? data.keyword ?? data.answer ?? data.respMessage ??
    data.text ?? data.content ?? raw.message ?? raw.body ?? ''
  )

  // Nombre de WhatsApp del usuario (opcional, para personalizar si se quiere)
  const whatsappName: string = typeof data.name === 'string' ? data.name.trim() : ''

  // Placeholders no resueltos (@body, @from, {{body}}) → no son contenido real (solo ocurre en pruebas)
  if (/^@\w+$|^\{\{\s*\w+\s*\}\}$/.test(message.trim())) message = ''
  if (from && /^@\w+$|^\{\{\s*\w+\s*\}\}$/.test(from.trim())) {
    console.warn('⚠️ from es placeholder (@from): no se puede identificar usuario')
    from = ''
  }

  return {
    ...raw,
    ...data,
    event,
    from,
    message,
    body: message,
    name: whatsappName,
    type: raw.type ?? data.type ?? 'text',
    intent: raw.intent ?? data.intent,
    entities: raw.entities ?? data.entities,
    timestamp: raw.timestamp ?? data.timestamp ?? new Date().toISOString(),
  }
}

/**
 * POST /api/webhooks/builderbot
 * Recibe mensajes de WhatsApp procesados por BuilderBot.
 * Por defecto solo devolvemos JSON (message, flow, registered, nombre); BuilderBot envía al cliente
 * usando la variable "message" en su flujo. Para que PULZE también envíe por API, usar
 * PULZE_SEND_VIA_BUILDERBOT_API=true.
 */
export async function handleBuilderBotWebhook(req: Request, res: Response) {
  try {
    let event = normalizeBuilderBotPayload(req.body) as BuilderBotMessage & { event: string }

    // Prueba de BuilderBot: si from vino como placeholder (@from) o vacío, usar PULZE_TEST_PHONE para poder probar
    const testPhone = process.env.PULZE_TEST_PHONE?.trim().replace(/^\+/, '')
    if (!event.from && testPhone) {
      event = { ...event, from: testPhone }
    }

    const eventType = event.event ?? 'message'
    const from = event.from
    const text = (event.message ?? event.body ?? '').trim()
    const hasMessage = !!text

    if (!hasMessage && req.body?.data && typeof req.body.data === 'object') {
      console.log('📦 data keys (mensaje no extraído):', Object.keys(req.body.data), 'valores from/body:', {
        dataFrom: req.body.data?.from,
        dataBody: typeof req.body.data?.body === 'string' ? req.body.data.body.slice(0, 80) : req.body.data?.body,
      })
    }
    console.log('📩 Webhook recibido:', {
      event: eventType,
      from: from ? from.slice(0, 6) + '***' : '(vacío)',
      hasMessage,
      messageLen: text.length,
      topKeys: Object.keys(req.body || {}),
    })

    const ev = { ...event, event: eventType }

    switch (ev.event) {
      case 'message':
        await handleIncomingMessage(ev, res)
        break

      case 'status':
        await handleMessageStatus(ev, res)
        break

      case 'media':
        await handleMediaMessage(ev, res)
        break

      case 'outgoing':
        // mensaje.saliente: solo acusar recibo, no procesar
        res.status(200).json({ received: true, event: 'outgoing' })
        break

      default:
        if (from && hasMessage) {
          await handleIncomingMessage(ev, res)
        } else {
          res.status(200).json({ received: true })
        }
    }
  } catch (error: any) {
    console.error('❌ Error en webhook:', error)
    // Siempre 200 + mensaje seguro: así BuilderBot no dispara su fallback ("problemas técnicos")
    // y el usuario recibe una sola respuesta. El mensaje "problemas técnicos" NO viene de PULZE.
    const safeMessage =
      'Disculpá, en este momento no pude procesar tu mensaje. ¿Podés intentar de nuevo en un segundo?'
    res.status(200).json(
      webhookPayload(safeMessage, { flow: 'menu', registered: true, nombre: null })
    )
  }
}

/** Normalizar teléfono para búsqueda/creación (quitar + y espacios) */
function normalizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return ''
  return phone.replace(/\s+/g, '').replace(/^\+/, '').trim()
}

/**
 * Respuesta estándar del webhook para que BuilderBot use en "Petición HTTP" → Respuesta.
 * Incluye variables para reglas y "Enviar a otro flow" (ej. flow === "onboarding").
 */
function webhookPayload(
  message: string | null,
  opts: { flow: string; registered: boolean; nombre?: string | null }
): { message: string | null; flow: string; registered: boolean; nombre: string | null } {
  const isPlaceholderName = (n: string | null | undefined) =>
    !n || n === 'pendiente' || /^@\w+$|^\{\{\s*\w+\s*\}\}$/.test(n)
  const nombre = opts.nombre && !isPlaceholderName(opts.nombre) ? opts.nombre : null
  return {
    message: message ?? null,
    flow: opts.flow,
    registered: opts.registered,
    nombre,
  }
}

/**
 * Envía la respuesta por la API de BuilderBot solo si PULZE_SEND_VIA_BUILDERBOT_API=true.
 * Por defecto solo devolvemos el JSON del webhook y BuilderBot envía al cliente con la variable "message".
 */
function shouldSendViaBuilderBotApi(): boolean {
  return process.env.PULZE_SEND_VIA_BUILDERBOT_API === 'true'
}

async function sendReplyViaBuilderBot(phone: string, message: string | null): Promise<void> {
  if (!message?.trim() || !phone) return
  if (!shouldSendViaBuilderBotApi() || !builderBotClient.canSend()) return
  const to = phone.includes('+') ? phone : `+${phone}`
  const result = await builderBotClient.sendMessage({ phone: to, message })
  if (!result.success) {
    console.error('❌ BuilderBot sendMessage falló:', result.error, { phone: to.slice(0, 6) + '***' })
  }
}

/**
 * Manejar mensaje entrante
 * Acepta texto en event.message o event.body (BuilderBot puede usar cualquiera)
 */
async function handleIncomingMessage(event: BuilderBotMessage, res: Response) {
  const text = (event.message ?? event.body ?? '').trim()
  const phone = normalizePhone(event.from)
  const { intent, entities, type } = event

  if (!phone) {
    // Sin teléfono (ej. prueba del panel de BuilderBot con @from sin resolver):
    // devolver el mensaje de bienvenida para que la prueba sea realista.
    console.warn('⚠️ Webhook sin "from" válido (posiblemente prueba de BuilderBot):', event.from)
    const { system, user: userPrompt } = promptBuilderService.buildOnboardingPrompt('welcome', {
      name: 'pendiente',
      goal: 'pendiente',
    })
    let welcomeMsg = fallbackFirstMessage
    try {
      const aiResp = await aiService.generateResponseWithPrompt(system, userPrompt)
      welcomeMsg = aiResp.content?.trim() || fallbackFirstMessage
    } catch (_) {}
    return res.status(200).json(
      webhookPayload(welcomeMsg, { flow: 'onboarding', registered: false, nombre: null })
    )
  }

  // 1. Buscar o crear usuario (siempre por teléfono normalizado)
  let user = await userService.findByPhone(phone)
  if (!user && event.from !== phone) {
    user = await userService.findByPhone(event.from)
  }

  // Si es usuario nuevo, iniciar onboarding → BuilderBot usa flow "onboarding"
  if (!user) {
    const response = await handleNewUser(phone, text)
    console.log('🆕 Usuario nuevo, respuesta onboarding:', response?.slice(0, 80) + '...')
    await sendReplyViaBuilderBot(event.from, response)
    return res.json(webhookPayload(response, { flow: 'onboarding', registered: false }))
  }

  // Si no completó onboarding → BuilderBot usa flow "onboarding"
  if (!user.onboardingComplete) {
    const response = await handleOnboarding(user.id, text, intent)
    await sendReplyViaBuilderBot(event.from, response)
    return res.json(
      webhookPayload(response, { flow: 'onboarding', registered: true, nombre: user.name })
    )
  }

  // Si el bot está desactivado (operador humano atiende), solo guardar mensaje y no responder
  if (user.botEnabled === false) {
    await prisma.conversation.create({
      data: {
        userId: user.id,
        role: 'user',
        message: text,
        metadata: { intent, entities, type, operatorMode: true },
      },
    })
    await prisma.userStats.update({
      where: { userId: user.id },
      data: {
        messagesReceived: { increment: 1 },
        lastActiveDate: new Date(),
      },
    })
    return res
      .status(200)
      .json(webhookPayload(null, { flow: 'operator', registered: true, nombre: user.name }))
  }

  // 2. Guardar mensaje en conversación
  await prisma.conversation.create({
    data: {
      userId: user.id,
      role: 'user',
      message: text,
      metadata: { intent, entities, type },
    },
  })

  // 3. Actualizar stats
  await prisma.userStats.update({
    where: { userId: user.id },
    data: {
      messagesReceived: { increment: 1 },
      lastActiveDate: new Date(),
    },
  })

  // 4. Decidir tipo de respuesta según intent
  let response: string

  if (intent === 'checkin' || text.toLowerCase().includes('check')) {
    // Check-in diario
    response = await handleCheckIn(user.id, text, entities)
  } else if (intent === 'consulta_nutricion') {
    // Consulta sobre nutrición
    response = await handleNutritionQuery(user, text, entities)
  } else if (intent === 'consulta_entreno') {
    // Consulta sobre entrenamiento
    response = await handleTrainingQuery(user, text, entities)
  } else {
    // Conversación general
    response = await handleGeneralConversation(user, text, intent)
  }

  // 5. Guardar respuesta en conversación
  await prisma.conversation.create({
    data: {
      userId: user.id,
      role: 'assistant',
      message: response,
      metadata: { intent },
    },
  })

  // 5b. Actualizar resumen de conversación (para usar en el próximo prompt)
  await contextUpdater.updateConversationSummary(user.id, text, response)

  // 6. Actualizar stats
  await prisma.userStats.update({
    where: { userId: user.id },
    data: {
      messagesSent: { increment: 1 },
    },
  })

  // 7. Registrar analytics
  await prisma.analytics.create({
    data: {
      eventType: `message_${intent || 'general'}`,
      userId: user.id,
      metadata: { intent, entities },
    },
  })

  // 8. Enviar por API de BuilderBot para que llegue a WhatsApp (no solo devolver en webhook)
  await sendReplyViaBuilderBot(event.from, response)
  res.json(
    webhookPayload(response, { flow: 'menu', registered: true, nombre: user.name })
  )
}

/**
 * Manejar nuevo usuario: primer mensaje con prompt cerrado (no hardcodeado).
 */
async function handleNewUser(phone: string, _message: string): Promise<string> {
  await userService.create({
    phone,
    name: 'pendiente',
    goal: 'pendiente',
    onboardingComplete: false,
  })

  try {
    const { system, user: userPrompt } = promptBuilderService.buildOnboardingPrompt('welcome', {
      name: 'pendiente',
      goal: 'pendiente',
    })
    const response = await aiService.generateResponseWithPrompt(system, userPrompt)
    return response.content?.trim() || fallbackFirstMessage
  } catch (e) {
    console.warn('⚠️ Fallback mensaje de bienvenida (IA no disponible):', (e as Error).message)
    return fallbackFirstMessage
  }
}

const fallbackFirstMessage =
  '👋 ¡Hola! Soy PULZE, tu coach personal de bienestar.\n\nAntes de empezar, quiero conocerte un poco.\n\n¿Cómo te llamo?'

/**
 * Manejar onboarding paso a paso.
 * Detecta el paso actual (nombre → objetivo → restricciones), actualiza el usuario y genera la siguiente pregunta con IA.
 */
async function handleOnboarding(
  userId: string,
  message: string,
  _intent?: string
): Promise<string> {
  const user = await userService.findById(userId)
  if (!user) return `Algo falló. ¿Podés escribirme de nuevo?`

  let msg = (message || '').trim()
  // No guardar variables no resueltas de BuilderBot (ej. @body, {{body}})
  if (/^@\w+$|^\{\{\s*\w+\s*\}\}$/.test(msg)) msg = ''
  if (!msg) return `Escribime algo así puedo conocerte un poco mejor 😊`

  // Paso 1: nombre pendiente → el mensaje es el nombre
  if (user.name === 'pendiente') {
    await userService.update(userId, { name: msg })
    const { system, user: userPrompt } = promptBuilderService.buildOnboardingPrompt('goal', {
      ...user,
      name: msg,
    })
    const response = await aiService.generateResponseWithPrompt(system, userPrompt)
    return response.content
  }

  // Paso 2: objetivo pendiente → el mensaje es el objetivo
  if (user.goal === 'pendiente') {
    await userService.update(userId, { goal: msg })
    const { system, user: userPrompt } = promptBuilderService.buildOnboardingPrompt('restrictions', {
      ...user,
      goal: msg,
    })
    const response = await aiService.generateResponseWithPrompt(system, userPrompt)
    return response.content
  }

  // Paso 3: restricciones no definidas → el mensaje son las restricciones (o "ninguna")
  if (user.restrictions == null || user.restrictions === '') {
    const restrictions = /ningun[oa]|nada|no tengo/i.test(msg) ? 'Ninguna' : msg
    await userService.update(userId, {
      restrictions: restrictions === 'Ninguna' ? null : restrictions,
    })
    const { system, user: userPrompt } = promptBuilderService.buildOnboardingPrompt('body_data', {
      ...user,
      restrictions: restrictions === 'Ninguna' ? undefined : restrictions,
    })
    const response = await aiService.generateResponseWithPrompt(system, userPrompt)
    return response.content
  }

  // Paso 4: peso/altura no definidos → el mensaje son los datos corporales
  if (user.bodyData == null || user.bodyData === '') {
    await userService.update(userId, { bodyData: msg })
    const { system, user: userPrompt } = promptBuilderService.buildOnboardingPrompt('schedule', {
      ...user,
      bodyData: msg,
    })
    const response = await aiService.generateResponseWithPrompt(system, userPrompt)
    await userService.update(userId, { onboardingComplete: true })
    return response.content
  }

  // Ya completó onboarding pero el flag no se actualizó
  await userService.update(userId, { onboardingComplete: true })
  return `Ya tenés todo listo. Cuando quieras hacer tu primer check-in, escribime. 😊`
}

/**
 * Manejar check-in diario.
 * Parsea el mensaje (ej. "4, 3, bien, sí"), guarda CheckIn, arma prompt y responde con IA.
 */
async function handleCheckIn(
  userId: string,
  message: string,
  entities?: Record<string, any>
): Promise<string> {
  const parsed = parseCheckInMessage(message)

  if (!parsed) {
    return `Para tu check-in diario, escribime así:\n1️⃣ Sueño (1-5)\n2️⃣ Energía (1-5)\n3️⃣ Cómo estás en una palabra\n4️⃣ ¿Entrenás hoy? (sí/no)\n\nEjemplo: 4, 3, bien, sí`
  }

  const alreadyToday = await checkInService.hasCheckInToday(userId)
  if (alreadyToday) {
    return `Ya registraste tu check-in de hoy. Si querés contarme algo más, escribime 😊`
  }

  const checkIn = await checkInService.create({
    user: { connect: { id: userId } },
    sleep: parsed.sleep,
    energy: parsed.energy,
    mood: parsed.mood,
    willTrain: parsed.willTrain,
    trainedToday: false,
  })

  const streak = await checkInService.calculateStreak(userId)
  await userService.updateStreak(userId, streak)

  const user = await userService.findById(userId)
  if (!user) return `Check-in guardado. ¡Seguimos!`

  const recentConversations = await contextService.getConversationHistory(userId, 3)
  const conversationsForPrompt = recentConversations.map((m) => ({ role: m.role, message: m.content }))
  const { system, user: userPrompt } = promptBuilderService.buildCheckInPrompt(
    user as any,
    {
      sleep: parsed.sleep,
      energy: parsed.energy,
      mood: parsed.mood,
      willTrain: parsed.willTrain,
    },
    conversationsForPrompt
  )

  const response = await aiService.generateResponseWithPrompt(system, userPrompt)

  await prisma.checkIn.update({
    where: { id: checkIn.id },
    data: { aiResponse: response.content },
  })

  return response.content
}

/**
 * Manejar consulta de nutrición
 */
async function handleNutritionQuery(
  user: any,
  message: string,
  entities?: Record<string, any>
): Promise<string> {
  // Construir contexto completo
  const context = await contextService.getUserContext(user.id)
  const history = await contextService.getConversationHistory(user.id, 5)

  // Generar respuesta con GPT
  const response = await aiService.generateCoachResponse(
    message,
    context,
    history
  )

  // Guardar en NutritionLog si es consulta sobre comida
  if (entities?.food) {
    await prisma.nutritionLog.create({
      data: {
        userId: user.id,
        mealType: 'consulta',
        description: message,
        userQuery: message,
        aiResponse: response.content,
      },
    })
  }

  return response.content
}

/**
 * Manejar consulta de entrenamiento
 */
async function handleTrainingQuery(
  user: any,
  message: string,
  entities?: Record<string, any>
): Promise<string> {
  // Construir contexto completo
  const context = await contextService.getUserContext(user.id)
  const history = await contextService.getConversationHistory(user.id, 5)

  // Generar respuesta con GPT
  const response = await aiService.generateCoachResponse(
    message,
    context,
    history
  )

  return response.content
}

/**
 * Manejar conversación general
 */
async function handleGeneralConversation(
  user: any,
  message: string,
  intent?: string
): Promise<string> {
  // Para conversación general, usar contexto ligero
  const context = await contextService.getUserContext(user.id)

  const response = await aiService.generateCoachResponse(
    message,
    context
  )

  return response.content
}

/**
 * Manejar cambio de estado de mensaje
 */
async function handleMessageStatus(event: BuilderBotMessage, res: Response) {
  const { message_id, status } = event

  if (!message_id || !status) {
    return res.status(200).json({ received: true })
  }

  // Actualizar estado del mensaje en ProactiveMessage si existe
  await prisma.proactiveMessage.updateMany({
    where: {
      // Necesitaríamos guardar el message_id al enviar
      content: { contains: message_id },
    },
    data: {
      status,
      ...(status === 'delivered' && { sentAt: new Date() }),
      ...(status === 'read' && { readAt: new Date() }),
    },
  })

  res.status(200).json({ received: true })
}

/**
 * Manejar mensaje con media
 */
async function handleMediaMessage(event: BuilderBotMessage, res: Response) {
  const { from, media, analysis } = event

  if (!media) {
    return res.status(200).json({ received: true })
  }

  const user = await userService.findByPhone(from)
  if (!user) {
    return res.status(200).json({ received: true })
  }

  // Si es imagen de comida, guardar en NutritionLog
  if (analysis?.category === 'food') {
    await prisma.nutritionLog.create({
      data: {
        userId: user.id,
        mealType: 'foto',
        description: analysis.detected_objects?.join(', ') || 'Comida',
        photoUrl: media.url,
      },
    })

    const response = `Vi tu foto 📸\n\n${
      analysis.detected_objects?.length
        ? `Detecté: ${analysis.detected_objects.join(', ')}\n\n`
        : ''
    }¿Cómo estuvo? ¿Te sentiste satisfecho/a?`

    await sendReplyViaBuilderBot(event.from, response)
    return res.json(
      webhookPayload(response, { flow: 'menu', registered: true, nombre: user.name })
    )
  }

  // Para otros tipos de imágenes
  res.json(
    webhookPayload('Recibí tu imagen 👍', { flow: 'menu', registered: true, nombre: user.name })
  )
}
