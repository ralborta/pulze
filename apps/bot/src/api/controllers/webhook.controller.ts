import { Request, Response } from 'express'
import { userService, prisma, checkInService } from '@pulze/database'
import { contextUpdater } from '../../services/ai'
import { adaptRoutineForUser } from '../../services/ai/routine-adapter.service'
import { parseCheckInMessage } from '../../utils/checkin-parser'
import { builderBotClient } from '../../services/builderbot'

/** Respuesta al canal: sin texto generado en PULZE; el copy lo arma BuilderBot. */
const BB_REPLY = '\u200B'

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

function isPlaceholder(value: string): boolean {
  return /^@\w+$|^\{\{\s*\w+\s*\}\}$|^\{\s*\w+\s*\}$/.test(value.trim())
}

/**
 * Normaliza identificador de contacto entrante (BuilderBot / WhatsApp):
 * - Toma el segmento antes de @ si viene como JID (`549...@s.whatsapp.net`, `...@newsletter`).
 * - Deja solo dígitos; si no hay dígitos útiles → vacío.
 * - Mínimo 8 dígitos (número razonable); máximo 20 para admitir LID/JIDs largos (el límite E.164
 *   de 15 dígitos no aplica a todos los formatos que envía WhatsApp Cloud API).
 */
function sanitizePhone(value: string): string {
  if (!value) return ''
  const raw = String(value).trim()
  if (!raw || isPlaceholder(raw)) return ''
  const localPart = raw.split('@')[0] ?? raw
  const digits = localPart.replace(/\D+/g, '')
  if (digits.length < 8) return ''
  if (digits.length > 20) {
    console.warn('⚠️ from demasiado largo tras normalizar, se trunca a 20 dígitos:', digits.slice(0, 6) + '…')
    return digits.slice(0, 20)
  }
  return digits
}

/** Extrae un teléfono desde cualquier formato (string, number, object con id/wa_id). */
function extractPhone(value: any): string {
  if (value == null) return ''
  if (typeof value === 'number') return sanitizePhone(String(value))
  if (typeof value === 'string') return sanitizePhone(value)
  const s = value?.id ?? value?.wa_id ?? value?.phone ?? value?.sender
  return s != null ? sanitizePhone(String(s)) : ''
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
  const eventNameRaw: string = String(raw.eventName ?? raw.event ?? '').toLowerCase()
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
  if (isPlaceholder(message)) message = ''
  if (from && isPlaceholder(from)) {
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
    res.status(200).json(webhookPayload(BB_REPLY, { flow: 'menu', registered: true, nombre: null }))
  }
}

/** Normalizar teléfono para búsqueda/creación (quitar + y espacios) */
function normalizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return ''
  return sanitizePhone(phone)
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
  // No enviar solo espacio/ZWSP: el mensaje lo genera BuilderBot
  if (!message?.trim() || message === BB_REPLY || !phone) return
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
    return res.status(200).json(webhookPayload(BB_REPLY, { flow: 'onboarding', registered: false, nombre: null }))
  }

  // 1. Buscar o crear usuario (siempre por teléfono normalizado)
  let user = await userService.findByPhone(phone)
  if (!user && event.from !== phone) {
    user = await userService.findByPhone(event.from)
  }

  // Si es usuario nuevo → crear en DB + enviar instructions a BuilderBot, devolver flow
  if (!user) {
    await handleNewUser(phone, text)
    const created = await userService.findByPhone(phone)
    if (created && text) {
      await prisma.conversation.create({
        data: {
          userId: created.id,
          role: 'user',
          message: text,
          metadata: { intent, entities, type, phase: 'first_contact' },
        },
      })
      await prisma.userStats.update({
        where: { userId: created.id },
        data: {
          messagesReceived: { increment: 1 },
          lastActiveDate: new Date(),
        },
      })
    }
    console.log('🆕 Usuario nuevo → flujo onboarding (copy en BuilderBot)')
    return res.json(webhookPayload(BB_REPLY, { flow: 'onboarding', registered: false }))
  }

  // Si no completó onboarding → limpiar historial, primero JSON, después instructions.
  // clearConversation evita que el Plugin Assistant repita el mensaje de bienvenida.
  if (!user.onboardingComplete) {
    await builderBotClient.clearConversation(event.from).catch((err) =>
      console.warn('⚠️ clear-conversation falló (no crítico):', err?.message)
    )
    if (text) {
      await prisma.conversation.create({
        data: {
          userId: user.id,
          role: 'user',
          message: text,
          metadata: { intent, entities, type, phase: 'onboarding' },
        },
      })
      await prisma.userStats.update({
        where: { userId: user.id },
        data: {
          messagesReceived: { increment: 1 },
          lastActiveDate: new Date(),
        },
      })
    }
    const { nombre: onboardingNombre } = await handleOnboarding(user.id, text, intent)
    const nombre = onboardingNombre || ((await userService.findById(user.id))?.name ?? user.name)
    await prisma.conversation.create({
      data: {
        userId: user.id,
        role: 'assistant',
        message: BB_REPLY,
        metadata: { intent, phase: 'onboarding' },
      },
    })
    await prisma.userStats.update({
      where: { userId: user.id },
      data: { messagesSent: { increment: 1 } },
    })
    res.json(webhookPayload(BB_REPLY, { flow: 'onboarding', registered: true, nombre }))
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

  const looksLikeCheckIn =
    intent === 'checkin' ||
    text.toLowerCase().includes('check') ||
    parseCheckInMessage(text) != null

  const lower = text.toLowerCase()
  const looksLikeNutrition =
    intent === 'consulta_nutricion' ||
    /\b(comida|dieta|nutrición|nutricion|calorías|calorias|proteína|proteina|carbohidratos|grasas|comer|alimentación|alimentacion|macros|hidratación|hidratacion)\b/.test(lower)
  const looksLikeTraining =
    intent === 'consulta_entreno' ||
    /\b(rutina|ejercicio|entrenar|gym|musculación|musculacion|cardio|pesas|repeticiones|series|estiramiento)\b/.test(lower)

  let response = BB_REPLY
  if (looksLikeCheckIn) {
    response = await handleCheckIn(user.id, text, entities, phone)
  } else if (looksLikeNutrition) {
    await handleNutritionQuery(user, text, entities)
  } else if (looksLikeTraining) {
    await handleTrainingQuery(user, text, entities)
  } else {
    await handleGeneralConversation(user, text, intent)
  }

  await prisma.conversation.create({
    data: {
      userId: user.id,
      role: 'assistant',
      message: response,
      metadata: { intent },
    },
  })

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
): Promise<{ nombre: string }> {
  const user = await userService.findById(userId)
  if (!user) return { nombre: '' }

  let msg = (message || '').trim()
  if (isPlaceholder(msg)) msg = ''

  const u = user as typeof user & UserOnboardingFields

  // Paso 1: nombre
  if (user.name === 'pendiente') {
    if (msg) await userService.update(userId, { name: msg })

  // Paso 2: edad (Bloque 1 — Datos iniciales)
  } else if (u.age == null) {
    const ageMatch = msg?.match(/\d+/)
    const age = ageMatch ? parseInt(ageMatch[0], 10) : null
    if (age != null && age >= 10 && age <= 120) await userService.update(userId, { age })

  // Paso 3: altura (Bloque 1)
  } else if (u.heightCm == null) {
    const hMatch = msg?.match(/\d+/)
    const h = hMatch ? parseInt(hMatch[0], 10) : null
    if (h != null && h >= 100 && h <= 250) await userService.update(userId, { heightCm: h })

  // Paso 4: peso (Bloque 1)
  } else if (u.weightKg == null) {
    const wMatch = msg?.replace(',', '.').match(/\d+(\.\d+)?/)
    const w = wMatch ? parseFloat(wMatch[0]) : null
    if (w != null && w >= 30 && w <= 300) await userService.update(userId, { weightKg: w })

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

  // Paso 6: restricciones físicas (Bloque 3)
  } else if (user.restrictions == null || user.restrictions === '') {
    const restrictions = msg && /ningun[oa]|nada|no tengo/i.test(msg) ? 'ninguna' : (msg?.trim() || null)
    if (restrictions) await userService.update(userId, { restrictions })

  // Paso 7: comidas por día (Bloque 4)
  } else if (u.mealsPerDay == null) {
    const mealsMatch = msg?.match(/\d+/)
    const meals = mealsMatch ? parseInt(mealsMatch[0], 10) : null
    if (meals != null && meals >= 1 && meals <= 10) await userService.update(userId, { mealsPerDay: meals })

  // Paso 8: proteína suficiente (Bloque 4)
  } else if (!u.proteinEnough || u.proteinEnough === '') {
    let protein: string | null = null
    if (msg) {
      if (/s[ií]|si\b|bastante|suficiente/i.test(msg) && !/no\s*s[eé]|no se/i.test(msg)) protein = 'sí'
      else if (/^no\b|no consumo|poco/i.test(msg)) protein = 'no'
      else if (/no\s*s[eé]|no se|maso menos|depende/i.test(msg)) protein = 'no_sé'
    }
    if (protein) await userService.update(userId, { proteinEnough: protein })

  // Paso 9: restricción alimentaria (Bloque 4)
  } else if (u.dietaryRestriction == null || u.dietaryRestriction === '') {
    const dietary = msg && /ningun[oa]|nada|no tengo/i.test(msg) ? 'ninguna' : (msg?.trim() || null)
    if (dietary) await userService.update(userId, { dietaryRestriction: dietary })

  // Paso 10: baseline sueño (Bloque 5)
  } else if (u.baselineSleep == null) {
    const nMatch = msg?.match(/\d+/)
    const n = nMatch ? parseInt(nMatch[0], 10) : null
    if (n != null && n >= 1 && n <= 10) await userService.update(userId, { baselineSleep: n })

  // Paso 11: baseline energía (Bloque 5)
  } else if (u.baselineEnergy == null) {
    const nMatch = msg?.match(/\d+/)
    const n = nMatch ? parseInt(nMatch[0], 10) : null
    if (n != null && n >= 1 && n <= 10) await userService.update(userId, { baselineEnergy: n })

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
    }
  } else {
    await userService.update(userId, { onboardingComplete: true })
  }

  const updatedUser = await userService.findById(userId)
  const nombre = updatedUser?.name ?? user.name
  return { nombre: nombre === 'pendiente' ? '' : nombre }
}

/**
 * Check-in: parsea, persiste en DB. El mensaje al usuario lo genera BuilderBot.
 */
async function handleCheckIn(
  userId: string,
  message: string,
  _entities?: Record<string, any>,
  fromPhone?: string
): Promise<string> {
  const parsed = parseCheckInMessage(message)

  if (!parsed) {
    return BB_REPLY
  }

  const alreadyToday = await checkInService.hasCheckInToday(userId)
  if (alreadyToday) {
    return BB_REPLY
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

  let note = `Check-in OK · racha ${streak}d · S${parsed.sleep} E${parsed.energy} · ${parsed.mood}`
  let routineMedia:
    | { url: string; caption?: string; order: number; exerciseKey?: string }[]
    | null
    | undefined
  if (parsed.willTrain) {
    const routineResult = await adaptRoutineForUser({
      userId,
      checkInData: {
        sleep: parsed.sleep,
        energy: parsed.energy,
        mood: parsed.mood,
        willTrain: parsed.willTrain,
      },
    })
    if (routineResult?.content) {
      note += `\n\nRutina (plan estándar):\n${routineResult.content}`
    }
    routineMedia = routineResult?.mediaAssets
  }

  await prisma.checkIn.update({
    where: { id: checkIn.id },
    data: { aiResponse: note },
  })

  const sendRoutineImages =
    process.env.PULZE_ROUTINE_SEND_IMAGES === 'true' &&
    fromPhone &&
    routineMedia &&
    routineMedia.length > 0

  if (sendRoutineImages && builderBotClient.canSend()) {
    const to = fromPhone.includes('+') ? fromPhone : `+${fromPhone}`
    const assets = routineMedia!
    for (const item of assets) {
      const caption =
        [item.caption, item.exerciseKey].filter(Boolean).join(' · ') || '\u200B'
      const result = await builderBotClient.sendMessageWithImage({
        phone: to,
        message: caption,
        imageUrl: item.url,
        caption: item.caption,
      })
      if (!result.success) {
        console.warn('⚠️ Envío de imagen de rutina falló:', result.error, item.url?.slice(0, 48))
      }
    }
  }

  return BB_REPLY
}

async function handleNutritionQuery(user: any, message: string, entities?: Record<string, any>): Promise<void> {
  if (entities?.food) {
    await prisma.nutritionLog.create({
      data: {
        userId: user.id,
        mealType: 'consulta',
        description: message,
        userQuery: message,
        aiResponse: null,
      },
    })
  }
}

async function handleTrainingQuery(_user: any, _message: string, _entities?: Record<string, any>): Promise<void> {
  /* Copy en BuilderBot */
}

async function handleGeneralConversation(_user: any, _message: string, _intent?: string): Promise<void> {
  /* Copy en BuilderBot */
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
  const { media, analysis } = event
  const fromNorm = normalizePhone(event.from)

  if (!media) {
    return res.status(200).json({ received: true })
  }

  const user = fromNorm ? await userService.findByPhone(fromNorm) : null
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

    return res.json(webhookPayload(BB_REPLY, { flow: 'menu', registered: true, nombre: user.name }))
  }

  res.json(webhookPayload(BB_REPLY, { flow: 'menu', registered: true, nombre: user.name }))
}
