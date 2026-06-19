import { Request, Response } from 'express'
import { userService, prisma, checkInService } from '@pulze/database'
import { contextUpdater } from '../../services/ai'
import { adaptRoutineForUser } from '../../services/ai/routine-adapter.service'
import { sendRoutineToWhatsApp } from '../../services/messaging/send-routine-whatsapp'
import { parseCheckInMessage } from '../../utils/checkin-parser'
import { isPlaceholder, sanitizePhone } from '../../utils/phone'
import { builderBotClient } from '../../services/builderbot'

/** Respuesta al canal: sin texto generado en PULZE; el copy lo arma BuilderBot. */
const BB_REPLY = '\u200B'

const SEGUIMIENTO_GREETING =
  'Hola! Soy PULZE, tu coach de bienestar 🌟 ¿Cómo venís hoy?'

const REGISTRO_GREETING =
  '¡Hola! Soy PULZE 🌟 Vamos a completar tu registro. ¿Cómo te llamás?'

/** Saludos sueltos: BuilderBot solo dispara Inicio con EVENTS.WELCOME (primer contacto). */
function isSimpleGreeting(text: string): boolean {
  const t = text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[!?.¿¡]+$/g, '')
  return /^(hola|buenas?|buen[oa]s?(?:\s+(?:dias?|tardes?|noches?))?|hey|que\s*tal|hi|hello)$/.test(
    t
  )
}

/**
 * Tipos de eventos de BuilderBot
 * BuilderBot puede enviar el texto en "message" o en "body"
 */
interface BuilderBotMessage {
  event: 'message' | 'status' | 'media' | 'outgoing' | 'internal_builderbot'
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

/** Ignora placeholders (@from, {{var}}); devuelve el primer teléfono válido entre candidatos. */
function firstValidPhone(...candidates: any[]): string {
  for (const c of candidates) {
    if (c == null || c === '') continue
    if (typeof c === 'string' && isPlaceholder(c)) continue
    const p = extractPhone(c)
    if (p) return p
  }
  return ''
}

/** Primer texto de mensaje útil; ignora @body / {{…}} sin resolver. */
function firstValidMessage(...candidates: any[]): string {
  for (const c of candidates) {
    const t = extractMessageText(c)
    if (t && !isPlaceholder(t)) return t
  }
  return ''
}

/**
 * Normaliza el body del webhook.
 * BuilderBot Cloud envía siempre: { eventName, data: { from, body, name, attachment, ... }, projectId }
 * - eventName: "message.incoming" | "message.outgoing" | etc.
 * - data.from: teléfono del usuario
 * - data.body: texto del mensaje
 * - data.name: nombre de WhatsApp del usuario (opcional)
 *
 * A veces data.from / data.body llegan como literales "@from" / "@body" (plantilla sin sustituir);
 * en ese caso usamos los mismos campos en la raíz del JSON si vienen resueltos.
 */
function normalizeBuilderBotPayload(body: any): BuilderBotMessage & { event: string } {
  const raw = body || {}
  const data = raw.data || {}

  // eventName puede ser "message.incoming", "message.outgoing", "message", etc.
  const eventNameRaw: string = String(raw.eventName ?? raw.event ?? '').toLowerCase()
  /**
   * Señales internas (intent + value) sin projectId: no son mensaje de usuario.
   * Si el cliente envía `eventName: message.incoming` (p. ej. HTTP desde BuilderBot hacia /inbound),
   * no degradar a internal_builderbot: si no, nunca corre handleOnboarding ni se guarda la DB.
   */
  const isInternalIntentSignal =
    raw &&
    typeof raw === 'object' &&
    raw.projectId == null &&
    raw.intent != null &&
    Object.prototype.hasOwnProperty.call(raw, 'value') &&
    !eventNameRaw.includes('incoming')
  // Normalizar a los tipos que usa el switch: message | status | media
  let event = 'message'
  if (isInternalIntentSignal) event = 'internal_builderbot'
  else if (eventNameRaw.includes('incoming') || eventNameRaw === 'message') event = 'message'
  else if (eventNameRaw.includes('outgoing')) event = 'outgoing'
  else if (eventNameRaw.includes('status')) event = 'status'
  else if (eventNameRaw.includes('media')) event = 'media'

  const from = firstValidPhone(
    data.from,
    raw.from,
    data.phone,
    data.sender,
    data.wa_id,
    raw.phone,
    raw.sender
  )

  const message = firstValidMessage(
    data.body,
    data.message,
    data.keyword,
    data.answer,
    data.respMessage,
    data.text,
    data.content,
    data.value,
    raw.message,
    raw.body,
    raw.value
  )

  // Nombre de WhatsApp del usuario (opcional, para personalizar si se quiere)
  let whatsappName: string = typeof data.name === 'string' ? data.name.trim() : ''
  if (!whatsappName && typeof raw.name === 'string' && !isPlaceholder(raw.name)) {
    whatsappName = raw.name.trim()
  }
  if (isPlaceholder(whatsappName)) whatsappName = ''

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

    const webhookVerbose = process.env.PULZE_WEBHOOK_VERBOSE === 'true'
    const bodyRoot = req.body || {}
    const hasProjectEnvelope = bodyRoot.projectId != null

    // Solo diagnóstico útil: envelope típico Cloud (projectId) pero sin texto extraíble
    if (
      !hasMessage &&
      hasProjectEnvelope &&
      bodyRoot.data &&
      typeof bodyRoot.data === 'object' &&
      eventType !== 'outgoing' &&
      eventType !== 'internal_builderbot'
    ) {
      console.log('📦 data keys (mensaje no extraído):', Object.keys(bodyRoot.data), 'valores from/body:', {
        dataFrom: bodyRoot.data?.from,
        dataBody:
          typeof bodyRoot.data?.body === 'string' ? bodyRoot.data.body.slice(0, 80) : bodyRoot.data?.body,
      })
    }
    if (eventType !== 'internal_builderbot' && (eventType !== 'outgoing' || webhookVerbose)) {
      console.log('📩 Webhook recibido:', {
        event: eventType,
        from: from ? from.slice(0, 6) + '***' : '(vacío)',
        hasMessage,
        messageLen: text.length,
        topKeys: Object.keys(bodyRoot),
      })
    }

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

      case 'internal_builderbot':
        res.status(200).json({ received: true, event: 'internal_builderbot' })
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
  opts: { flow: string; registered: boolean; nombre?: string | null; hasUserText?: boolean }
): {
  message: string
  flow: string
  registered: boolean
  registered_s: string
  route: string
  nombre: string
  hasUserText: boolean
} {
  const isPlaceholderName = (n: string | null | undefined) =>
    !n || n === 'pendiente' || /^@\w+$|^\{\{\s*\w+\s*\}\}$/.test(n)
  const nombre = opts.nombre && !isPlaceholderName(opts.nombre) ? opts.nombre : ''
  return {
    message: message ?? '',
    flow: opts.flow,
    registered: opts.registered,
    registered_s: opts.registered ? 'true' : 'false',
    route: opts.flow === 'menu' || opts.flow === 'operator' ? 'seguimiento' : 'registro',
    nombre,
    /** false cuando no hubo texto de usuario (p. ej. ping de BuilderBot). No usar `flow` para saltar de módulo en ese caso. */
    hasUserText: opts.hasUserText !== false,
  }
}

/**
 * Envía la respuesta por la API de BuilderBot solo si PULZE_SEND_VIA_BUILDERBOT_API=true.
 * Por defecto solo devolvemos el JSON del webhook y BuilderBot envía al cliente con la variable "message".
 */
function shouldSendViaBuilderBotApi(): boolean {
  return process.env.PULZE_SEND_VIA_BUILDERBOT_API === 'true'
}

async function sendReplyViaBuilderBot(
  phone: string,
  message: string | null,
  opts?: { force?: boolean }
): Promise<void> {
  if (!message?.trim() || message === BB_REPLY || !phone) return
  if (!opts?.force && (!shouldSendViaBuilderBotApi() || !builderBotClient.canSend())) return
  if (opts?.force && !builderBotClient.canSend()) return
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

  // Sin texto útil: no crear usuario, no tocar DB ni onboarding. Evita “avanzar” por webhooks vacíos
  // o dobles disparos. En BuilderBot: solo ramificar por `flow` si `hasUserText === true`.
  if (!text) {
    let userSkip = await userService.findByPhone(phone)
    if (!userSkip && event.from !== phone) {
      userSkip = await userService.findByPhone(event.from)
    }
    if (userSkip?.botEnabled === false) {
      return res
        .status(200)
        .json(webhookPayload(null, { flow: 'operator', registered: true, nombre: userSkip.name, hasUserText: false }))
    }
    if (!userSkip) {
      return res.status(200).json(
        webhookPayload(BB_REPLY, { flow: 'onboarding', registered: false, nombre: null, hasUserText: false })
      )
    }
    if (!userSkip.onboardingComplete) {
      const nombre =
        userSkip.name && userSkip.name !== 'pendiente' ? userSkip.name : null
      return res.status(200).json(
        webhookPayload(BB_REPLY, { flow: 'onboarding', registered: true, nombre, hasUserText: false })
      )
    }
    const nombreOk =
      userSkip.name && userSkip.name !== 'pendiente' ? userSkip.name : null
    return res.status(200).json(
      webhookPayload(BB_REPLY, { flow: 'menu', registered: true, nombre: nombreOk, hasUserText: false })
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
      /** Mismo pipeline que el resto del onboarding: si el primer mensaje ya trae nombre/datos, se guardan en DB. */
      await handleOnboarding(created.id, text, intent)
    }
    const fresh = created ? await userService.findByPhone(phone) : null
    const nombreNuevo =
      fresh?.name && fresh.name !== 'pendiente' ? fresh.name : null
    console.log('🆕 Usuario nuevo → flujo onboarding (copy en BuilderBot)')
    return res.json(webhookPayload(BB_REPLY, { flow: 'onboarding', registered: false, nombre: nombreNuevo }))
  }

  // Si no completó onboarding → opcionalmente limpiar historial en BuilderBot (solo al primer mensaje
  // de usuario en DB: si se llama en cada turno, Cloud puede quedar sin contexto y dejar de contestar).
  if (!user.onboardingComplete) {
    const priorUserMessages = await prisma.conversation.count({
      where: { userId: user.id, role: 'user' },
    })
    if (priorUserMessages === 0) {
      await builderBotClient.clearConversation(event.from).catch((err) =>
        console.warn('⚠️ clear-conversation falló (no crítico):', err?.message)
      )
    }
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
    const onboardingReply = isSimpleGreeting(text) ? REGISTRO_GREETING : BB_REPLY
    await prisma.conversation.create({
      data: {
        userId: user.id,
        role: 'assistant',
        message: onboardingReply,
        metadata: { intent, phase: 'onboarding' },
      },
    })
    await prisma.userStats.update({
      where: { userId: user.id },
      data: { messagesSent: { increment: 1 } },
    })
    if (onboardingReply !== BB_REPLY) {
      await sendReplyViaBuilderBot(phone, onboardingReply, { force: true })
    }
    res.json(webhookPayload(onboardingReply, { flow: 'onboarding', registered: true, nombre }))
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
    if (isSimpleGreeting(text)) {
      response = SEGUIMIENTO_GREETING
    }
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

  try {
    await prisma.userStats.update({
      where: { userId: user.id },
      data: {
        messagesSent: { increment: 1 },
      },
    })
  } catch (err: any) {
    console.error('⚠️ userStats.update (mensajes enviados) falló — se responde igual al webhook:', err?.message)
  }

  try {
    await prisma.analytics.create({
      data: {
        eventType: `message_${intent || 'general'}`,
        userId: user.id,
        metadata: { intent, entities },
      },
    })
  } catch (err: any) {
    console.error('⚠️ analytics.create falló — se responde igual al webhook:', err?.message)
  }

  try {
    const forceOutbound = response !== BB_REPLY
    await sendReplyViaBuilderBot(event.from, response, { force: forceOutbound })
  } catch (err: any) {
    console.error('⚠️ sendReplyViaBuilderBot falló:', err?.message)
  }

  res.json(webhookPayload(response, { flow: 'menu', registered: true, nombre: user.name }))
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
    if (msg) {
      const trimmed = msg.trim()
      const soloSaludo = /^(hola|buen[oa]s?(\s+d[ií]as?)?|hey|qu[eé] tal|buen[oa]s\s+tardes?|buen[oa]s\s+noches?)[\s!.¿?]*$/i.test(
        trimmed
      )
      if (!soloSaludo) {
        let nameCandidate = trimmed.split(/\r?\n/)[0].trim().slice(0, 120)
        const mIntro = nameCandidate.match(
          /^(?:me llamo|me dicen|soy|mi nombre es|nombre:?)\s+(.+)$/i
        )
        if (mIntro) nameCandidate = mIntro[1].trim()
        if (nameCandidate) await userService.update(userId, { name: nameCandidate })
      }
    }

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
    if (
      process.env.PULZE_ROUTINE_SEND_IMAGES === 'true' &&
      fromPhone &&
      routineResult?.mediaAssets?.length
    ) {
      const delivery = await sendRoutineToWhatsApp({
        phone: fromPhone,
        userId,
        sendImages: true,
        skipText: true,
        checkInData: {
          sleep: parsed.sleep,
          energy: parsed.energy,
          mood: parsed.mood,
          willTrain: parsed.willTrain,
        },
      })
      if (!delivery.ok) {
        console.warn('⚠️ Envío de imágenes de rutina falló:', delivery.error)
      }
    }
  }

  await prisma.checkIn.update({
    where: { id: checkIn.id },
    data: { aiResponse: note },
  })

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
