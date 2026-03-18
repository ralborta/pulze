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
 *
 * IMPORTANTE: nombre y message se envían como string vacío (no null) cuando no hay valor,
 * para evitar que BuilderBot concatene "null" en plantillas (ej. {{nombre}}{{flow}}).
 */
function webhookPayload(
  message: string | null,
  opts: { flow: string; registered: boolean; nombre?: string | null }
): { message: string; flow: string; registered: boolean; nombre: string } {
  const isPlaceholderName = (n: string | null | undefined) =>
    !n || n === 'pendiente' || /^@\w+$|^\{\{\s*\w+\s*\}\}$/.test(n)
  const nombre = opts.nombre && !isPlaceholderName(opts.nombre) ? opts.nombre : ''
  return {
    message: message ?? '',
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
    console.warn('⚠️ Webhook sin "from" válido (posiblemente prueba de BuilderBot):', event.from)
    const msgNoPhone =
      '¡Hola! Soy PULZE, tu coach de bienestar. Ahora te toca registrarte. Voy a necesitar tu nombre completo y algunos datos (peso, estatura, edad, sexo) para armarte tu plan a medida. ¿Empezamos con tu nombre completo?'
    return res.status(200).json(
      webhookPayload(msgNoPhone, { flow: 'onboarding', registered: false, nombre: null })
    )
  }

  // 1. Buscar o crear usuario (siempre por teléfono normalizado)
  let user = await userService.findByPhone(phone)
  if (!user && event.from !== phone) {
    user = await userService.findByPhone(event.from)
  }

  // Si es usuario nuevo → crear en DB + enviar instructions a BuilderBot, devolver flow
  if (!user) {
    await handleNewUser(phone, text)
    console.log('🆕 Usuario nuevo → instructions enviadas a BuilderBot')
    const msgNewUser =
      '¡Bienvenido! Soy PULZE, tu coach de bienestar. Ahora te toca registrarte. Voy a necesitar tu nombre completo y algunos datos (peso, estatura, edad, sexo) para armarte tu plan a medida. ¿Empezamos con tu nombre completo?'
    return res.json(webhookPayload(msgNewUser, { flow: 'onboarding', registered: false }))
  }

  // Si no completó onboarding → limpiar historial, primero JSON, después instructions.
  // clearConversation evita que el Plugin Assistant repita el mensaje de bienvenida.
  if (!user.onboardingComplete) {
    await builderBotClient.clearConversation(event.from).catch((err) =>
      console.warn('⚠️ clear-conversation falló (no crítico):', err?.message)
    )
    const { nombre: onboardingNombre, instructions } = await handleOnboarding(user.id, text, intent)
    const nombre = onboardingNombre || ((await userService.findById(user.id))?.name ?? user.name)
    res.json(webhookPayload('\u200B', { flow: 'onboarding', registered: true, nombre }))
    if (instructions) {
      pushInstructionsToBuilderBot(instructions).catch((err) =>
        console.error('❌ Error enviando instructions a BuilderBot:', err)
      )
    }
    return
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
 * Envía las instructions al Plugin Assistant de BuilderBot.
 */
async function pushInstructionsToBuilderBot(instructions: string): Promise<boolean> {
  const result = await builderBotClient.updateAssistantInstructions(instructions)
  return result.success
}

/**
 * Manejar nuevo usuario: crear en DB.
 * El primer mensaje ("Hola") devuelve el texto en el webhook — sin instructions.
 * Solo desde el segundo mensaje usamos instructions + message vacío.
 */
async function handleNewUser(phone: string, _message: string): Promise<void> {
  await userService.create({
    phone,
    name: 'pendiente',
    goal: 'pendiente',
    onboardingComplete: false,
  })
}

/** Campos de onboarding estructurado (para n8n/métricas). */
interface UserOnboardingFields {
  heightCm?: number | null
  weightKg?: number | null
  activityLevel?: string | null
  mealsPerDay?: number | null
  proteinEnough?: string | null
  dietaryRestriction?: string | null
  baselineSleep?: number | null
  baselineEnergy?: number | null
  baselineMood?: number | null
}

/**
 * Onboarding estructurado para n8n y métricas.
 * Orden: nombre → edad → altura → peso → actividad → restricciones → nutrición → baseline.
 */
async function handleOnboarding(
  userId: string,
  message: string,
  _intent?: string
): Promise<{ nombre: string; instructions: string }> {
  const user = await userService.findById(userId)
  if (!user) return { nombre: '', instructions: '' }

  let msg = (message || '').trim()
  if (/^@\w+$|^\{\{\s*\w+\s*\}\}$/.test(msg)) msg = ''

  let task = ''
  const u = user as typeof user & UserOnboardingFields

  // Paso 1: nombre
  if (user.name === 'pendiente') {
    if (msg) await userService.update(userId, { name: msg })
    const nombre = msg || 'el usuario'
    task =
      `El usuario acaba de decirte su nombre: "${nombre}". ` +
      `Confirmalo con entusiasmo. Preguntale su edad (en años). Una sola pregunta. ` +
      `NO repitas el mensaje de bienvenida.`

  // Paso 2: edad (Bloque 1 — Datos iniciales)
  } else if (u.age == null) {
    const ageMatch = msg?.match(/\d+/)
    const age = ageMatch ? parseInt(ageMatch[0], 10) : null
    if (age != null && age >= 10 && age <= 120) await userService.update(userId, { age })
    task =
      `El usuario ${user.name}, ${age ?? '?'} años. ` +
      `Preguntale SOLO su altura en cm (ej: 170). Una pregunta. Podés decir que puede agregar info si quiere.`

  // Paso 3: altura (Bloque 1)
  } else if (u.heightCm == null) {
    const hMatch = msg?.match(/\d+/)
    const h = hMatch ? parseInt(hMatch[0], 10) : null
    if (h != null && h >= 100 && h <= 250) await userService.update(userId, { heightCm: h })
    task =
      `El usuario ${user.name}, ${u.age} años, altura ${h ?? '?'} cm. ` +
      `Preguntale SOLO su peso actual en kg (ej: 75). Una pregunta. Podés decir que puede agregar info si quiere.`

  // Paso 4: peso (Bloque 1)
  } else if (u.weightKg == null) {
    const wMatch = msg?.replace(',', '.').match(/\d+(\.\d+)?/)
    const w = wMatch ? parseFloat(wMatch[0]) : null
    if (w != null && w >= 30 && w <= 300) await userService.update(userId, { weightKg: w })
    task =
      `El usuario ${user.name}, ${u.age} años, ${u.heightCm} cm, ${w ?? '?'} kg. ` +
      `Nueva sección: nivel de actividad. Pedile que elija 1 Sedentario, 2 Ligero, 3 Moderado, 4 Alto. Una sola pregunta.`

  // Paso 5: nivel de actividad (Bloque 2)
  } else if (!u.activityLevel || u.activityLevel === '') {
    let level: string | null = null
    if (msg) {
      if (/^1$|sedentario/i.test(msg)) level = 'sedentario'
      else if (/^2$|ligero/i.test(msg)) level = 'ligero'
      else if (/^3$|moderado/i.test(msg)) level = 'moderado'
      else if (/^4$|alto/i.test(msg)) level = 'alto'
    }
    if (level) await userService.update(userId, { activityLevel: level })
    task =
      `El usuario ${user.name}, actividad: ${level || 'pendiente'}. ` +
      `Nueva sección: restricciones. Preguntale si tiene lesión o limitación física. Si no, "ninguna". Una pregunta. Decile que puede agregar detalles si quiere.`

  // Paso 6: restricciones físicas (Bloque 3)
  } else if (user.restrictions == null || user.restrictions === '') {
    const restrictions = msg && /ningun[oa]|nada|no tengo/i.test(msg) ? 'ninguna' : (msg?.trim() || null)
    if (restrictions) await userService.update(userId, { restrictions })
    task = restrictions
      ? `El usuario ${user.name}. Restricciones: ${restrictions}. ` +
        `Nueva sección: alimentación. Preguntale SOLO cuántas comidas hace por día. Una pregunta. Decile que puede agregar info si quiere.`
      : `Preguntale si tiene lesión o limitación física. Si no, "ninguna". Una pregunta. Decile que puede agregar detalles si quiere.`

  // Paso 7: comidas por día (Bloque 4)
  } else if (u.mealsPerDay == null) {
    const mealsMatch = msg?.match(/\d+/)
    const meals = mealsMatch ? parseInt(mealsMatch[0], 10) : null
    if (meals != null && meals >= 1 && meals <= 10) await userService.update(userId, { mealsPerDay: meals })
    task =
      `El usuario ${user.name}, ${meals ?? '?'} comidas/día. ` +
      `Preguntale SOLO si consume suficiente proteína. Opciones: Sí, No, No sé. Una pregunta.`

  // Paso 8: proteína suficiente (Bloque 4)
  } else if (!u.proteinEnough || u.proteinEnough === '') {
    let protein: string | null = null
    if (msg) {
      if (/s[ií]|si\b|bastante|suficiente/i.test(msg) && !/no\s*s[eé]|no se/i.test(msg)) protein = 'sí'
      else if (/^no\b|no consumo|poco/i.test(msg)) protein = 'no'
      else if (/no\s*s[eé]|no se|maso menos|depende/i.test(msg)) protein = 'no_sé'
    }
    if (protein) await userService.update(userId, { proteinEnough: protein })
    task =
      `El usuario ${user.name}, proteína: ${protein || 'pendiente'}. ` +
      `Preguntale SOLO si tiene restricción alimentaria (celiaquía, vegan, etc). Si no, "ninguna". Una pregunta. Decile que puede agregar detalles si quiere.`

  // Paso 9: restricción alimentaria (Bloque 4)
  } else if (u.dietaryRestriction == null || u.dietaryRestriction === '') {
    const dietary = msg && /ningun[oa]|nada|no tengo/i.test(msg) ? 'ninguna' : (msg?.trim() || null)
    if (dietary) await userService.update(userId, { dietaryRestriction: dietary })
    const hasDietary = !!(dietary && dietary.length > 0)
    task = hasDietary
      ? `El usuario ${user.name} completó datos de alimentación. ` +
        `Nueva sección: estado actual. Pedile SOLO que califique su sueño del 1 al 10 (cómo duerme hoy). Una pregunta. Decile que puede agregar info si quiere.`
      : `Preguntale si tiene restricción alimentaria. Si no, "ninguna". Una pregunta. Decile que puede agregar detalles si quiere.`

  // Paso 10: baseline sueño (Bloque 5)
  } else if (u.baselineSleep == null) {
    const nMatch = msg?.match(/\d+/)
    const n = nMatch ? parseInt(nMatch[0], 10) : null
    if (n != null && n >= 1 && n <= 10) await userService.update(userId, { baselineSleep: n })
    task =
      `El usuario ${user.name}, sueño: ${n ?? '?'}/10. ` +
      `Pedile SOLO que califique su energía del 1 al 10 (cómo se siente hoy). Una pregunta.`

  // Paso 11: baseline energía (Bloque 5)
  } else if (u.baselineEnergy == null) {
    const nMatch = msg?.match(/\d+/)
    const n = nMatch ? parseInt(nMatch[0], 10) : null
    if (n != null && n >= 1 && n <= 10) await userService.update(userId, { baselineEnergy: n })
    task =
      `El usuario ${user.name}, energía: ${n ?? '?'}/10. ` +
      `Pedile SOLO que califique su ánimo del 1 al 10 (cómo está emocionalmente hoy). Una pregunta.`

  // Paso 12: baseline ánimo (Bloque 5)
  } else if (u.baselineMood == null) {
    const nMatch = msg?.match(/\d+/)
    const n = nMatch ? parseInt(nMatch[0], 10) : null
    if (n != null && n >= 1 && n <= 10) await userService.update(userId, { baselineMood: n })
    const updated = await userService.findById(userId) as (typeof user & UserOnboardingFields) | null
    if (updated?.baselineMood != null) {
      await userService.update(userId, { onboardingComplete: true })
      if (!user.goal || user.goal === 'pendiente') {
        await userService.update(userId, { goal: 'bienestar' })
      }
      task =
        `El usuario ${user.name} completó el onboarding. Baseline: Sueño ${updated.baselineSleep}, Energía ${updated.baselineEnergy}, Ánimo ${updated.baselineMood}. ` +
        `Confirmale que está todo listo y preguntale a qué hora prefiere su check-in diario. Mensaje de cierre cálido.`
    } else {
      task = `Pedile que califique su ánimo del 1 al 10. Una pregunta.`
    }
  } else {
    await userService.update(userId, { onboardingComplete: true })
    task =
      `El usuario ${user.name} completó su perfil. ` +
      `Confirmale que está todo listo. Mensaje de cierre cálido.`
  }

  const updatedUser = await userService.findById(userId)
  const nombre = updatedUser?.name ?? user.name
  const instructions = promptBuilderService.buildInstructions(
    task,
    {
      name: user.name,
      goal: user.goal !== 'pendiente' ? user.goal : undefined,
      restrictions: user.restrictions,
      bodyData: user.bodyData,
      streak: user.currentStreak,
    },
    { onboardingMode: true }
  )

  return { nombre: nombre === 'pendiente' ? '' : nombre, instructions }
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
