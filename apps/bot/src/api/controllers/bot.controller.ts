import { Request, Response } from 'express'
import type { Prisma } from '@prisma/client'
import { userService, prisma } from '@pulze/database'
import { builderBotClient } from '../../services/builderbot'
import { decodePhonePathSegment, isPlaceholder, sanitizePhone } from '../../utils/phone'

/**
 * GET /api/bot/health
 */
export function getBotHealth(_req: Request, res: Response) {
  res.json({
    status: 'ok',
    service: 'pulze-bot-api',
    timestamp: new Date().toISOString(),
  })
}

/**
 * GET /api/bot/users/:phone/context
 * Ramificación Inicio en BuilderBot (requiere X-API-Key).
 * registered: true solo si el usuario existe y ya completó onboarding (onboardingComplete) → Seguimiento;
 * false → Registro (alta o onboarding incompleto).
 * Respuesta incluye `phone` (solo dígitos, normalizado como en la búsqueda) para depuración en BuilderBot.
 * Nota: un usuario “en progreso” (fila en DB, nombre/edad pendientes) debe seguir en Registro;
 * usar !!user rompía la ramificación y mezclaba Seguimiento con el alta.
 * Contexto enriquecido: GET …/coaching-context.
 */
/** Solo dígitos (8–20) para teléfonos E.164 y JIDs/LID numéricos largos de WhatsApp. */
function isValidPhonePathSegment(s: string): boolean {
  if (!s || /[<>{}@]/.test(s)) return false
  return /^\d{8,20}$/.test(s)
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Evita mostrar en coaching texto de bot / links pegados que quedaron mal en User o UserContext. */
function looksLikeAssistantChatter(s: string): boolean {
  const t = s.trim()
  if (t.length < 28) return false
  if (/https?:\/\//i.test(t)) return true
  if (/¿c[oó]mo est[aá]s|¿en qu[eé] puedo ayudarte|si tienes alguna pregunta|te gustaría hablar/i.test(t)) {
    return true
  }
  return false
}

function coachingDisplayName(raw: string | null | undefined): string {
  if (!raw || raw === 'pendiente') return '(sin nombre)'
  const t = raw.trim()
  if (looksLikeAssistantChatter(t)) return '(sin nombre)'
  return t.length > 80 ? `${t.slice(0, 80)}…` : t
}

/**
 * Nombre para saludar y para BuilderBot (`name` / `nombre` en JSON).
 * Sin "(sin nombre)": string vacío si aún no hay nombre fiable en Pulze.
 */
function coachingNameForAssistant(raw: string | null | undefined): string {
  if (raw == null || raw === 'pendiente') return ''
  const t = raw.trim()
  if (!t || isPlaceholder(t)) return ''
  if (looksLikeAssistantChatter(t)) return ''
  return t.length > 100 ? `${t.slice(0, 100)}…` : t
}

function coachingDisplayGoal(raw: string | null | undefined): string {
  if (!raw || raw === 'pendiente') return '—'
  const t = raw.trim()
  if (looksLikeAssistantChatter(t)) return '—'
  return t.length > 120 ? `${t.slice(0, 120)}…` : t
}

function coachingDisplayRestriction(raw: string | null | undefined): string | null {
  if (raw == null || raw === '' || raw === 'ninguna') return null
  const t = raw.trim()
  if (looksLikeAssistantChatter(t)) return null
  return t.length > 200 ? `${t.slice(0, 200)}…` : t
}

type UserRowForCoaching = {
  name: string
  phone: string
  goal: string
  age: number | null
  sex: string | null
  heightCm: number | null
  weightKg: number | null
  activityLevel: string | null
  mealsPerDay: number | null
  proteinEnough: string | null
  dietaryRestriction: string | null
  restrictions: string | null
  baselineSleep: number | null
  baselineEnergy: number | null
  baselineMood: number | null
}

/**
 * Snapshot de alta onboarding: gym / nutrición. No incluye el hilo de WhatsApp (eso lo tiene BuilderBot).
 */
function registrationLinesForCoaching(user: UserRowForCoaching): string[] {
  const out: string[] = []
  const nameSaludo = coachingNameForAssistant(user.name) || '—'
  out.push('--- Registro (entreno + plan alimenticio) — recordatorio; no reemplaza el historial del chat ---')
  out.push(`Nombre (Pulze / saludo): ${nameSaludo} · Tel: ${user.phone}`)
  out.push(`Objetivo: ${coachingDisplayGoal(user.goal)}`)
  if (user.age != null) out.push(`Edad: ${user.age}`)
  if (user.sex) out.push(`Sexo: ${user.sex}`)
  if (user.heightCm != null) out.push(`Altura: ${user.heightCm} cm`)
  if (user.weightKg != null) out.push(`Peso: ${user.weightKg} kg`)
  out.push(`Nivel actividad: ${user.activityLevel ?? '—'}`)
  out.push(`Comidas/día: ${user.mealsPerDay ?? '—'} · Proteína suficiente: ${user.proteinEnough ?? '—'}`)
  const diet = coachingDisplayRestriction(user.dietaryRestriction)
  if (diet && user.dietaryRestriction !== 'ninguna') out.push(`Restricción alimentaria: ${diet}`)
  const phys = coachingDisplayRestriction(user.restrictions)
  if (phys) out.push(`Restricciones físicas: ${phys}`)
  if (user.baselineSleep != null || user.baselineEnergy != null || user.baselineMood != null) {
    out.push(
      `Baseline inicial (sueño / energía / ánimo): ${user.baselineSleep ?? '—'} · ${user.baselineEnergy ?? '—'} · ${user.baselineMood ?? '—'}`
    )
  }
  return out
}

/** aiSummary acumulativo: no exponer bloques con URLs/UTM/cleexs en el texto al asistente vía coaching-context. */
function aiSummaryForCoachingDisplay(raw: string | null | undefined): string {
  if (!raw?.trim()) return ''
  const t = raw.trim()
  if (/https?:\/\//i.test(t)) return ''
  if (/\butm_(source|medium|campaign|content)=/i.test(t)) return ''
  if (/vercel\.app|diagnosticid=/i.test(t)) return ''
  const stripped = t.replace(/https?:\/\/[^\s]+/gi, ' ').replace(/\s+/g, ' ').trim()
  if (stripped.length < 20) return ''
  return stripped.slice(0, 1200)
}

/**
 * GET /api/bot/users/:phone/coaching-context
 * Contexto para retomar otro día (Seguimiento): registro en DB + breve resumen de hábitos.
 * El hilo conversacional reciente lo mantiene BuilderBot; aquí no va el transcript.
 *
 * Campos para BuilderBot: `name` y `nombre` (mismo valor) = nombre en Pulze para saludar;
 * mapear en el nodo HTTP con messageMapping, p. ej. `2\\n{phone}\\n{name}\\n...` para rellenar `{name}` en el flow.
 */
export async function getCoachingContext(req: Request, res: Response) {
  try {
    const raw = decodePhonePathSegment(req.params.phone || '')
    if (!raw) {
      return res.status(400).json({ error: 'Teléfono inválido o faltante' })
    }
    if (isPlaceholder(raw)) {
      return res.json({
        exists: false,
        phone: raw,
        name: '',
        nombre: '',
        contextBlock: '',
        routineBlock: '',
        nutritionBlock: '',
      })
    }
    const phone = sanitizePhone(raw)
    if (!phone) {
      return res.status(400).json({ error: 'Teléfono inválido o faltante' })
    }
    if (!isValidPhonePathSegment(phone)) {
      return res.status(400).json({
        error:
          'En la URL debe ir el número real, solo dígitos. No uses placeholders sin resolver en el path.',
        received: phone,
      })
    }

    const user = await userService.findByPhone(phone)
    if (!user) {
      return res.json({
        exists: false,
        phone,
        name: '',
        nombre: '',
        contextBlock: '',
        routineBlock: '',
        nutritionBlock: '',
      })
    }

    const [userCtx, recentCheckIns, recentTraining, recentNutrition] = await Promise.all([
      prisma.userContext.findUnique({ where: { userId: user.id } }),
      prisma.checkIn.findMany({
        where: { userId: user.id },
        orderBy: { timestamp: 'desc' },
        take: 3,
      }),
      prisma.trainingLog.findMany({
        where: { userId: user.id },
        orderBy: { timestamp: 'desc' },
        take: 2,
      }),
      prisma.nutritionLog.findMany({
        where: { userId: user.id },
        orderBy: { timestamp: 'desc' },
        take: 3,
      }),
    ])

    const linesGeneral: string[] = []
    linesGeneral.push(...registrationLinesForCoaching(user))
    linesGeneral.push(
      `Racha check-ins: ${user.currentStreak}d · Último check-in: ${user.lastCheckInDate ? formatDate(user.lastCheckInDate) : '—'}`
    )
    const summaryLine = aiSummaryForCoachingDisplay(userCtx?.aiSummary ?? null)
    if (summaryLine) {
      linesGeneral.push(`Resumen hábitos (patrones desde DB; no es la conversación del día): ${summaryLine}`)
    }

    const linesRoutine: string[] = []
    linesRoutine.push(...linesGeneral)
    if (userCtx?.trainingMemory != null) {
      const raw = JSON.stringify(userCtx.trainingMemory)
      if (raw.length > 2)
        linesRoutine.push(`Memoria entreno (compacta): ${raw.slice(0, 400)}${raw.length > 400 ? '…' : ''}`)
    }
    if (recentCheckIns.length) {
      linesRoutine.push('Últimos check-ins:')
      for (const c of recentCheckIns) {
        linesRoutine.push(
          `- ${formatDate(c.timestamp)} sueño ${c.sleep}/5 energía ${c.energy}/5 ánimo ${c.mood} · entrena ${c.willTrain ? 'sí' : 'no'}`
        )
      }
    }
    if (recentTraining.length) {
      linesRoutine.push('Últimos entrenos registrados:')
      for (const t of recentTraining) {
        linesRoutine.push(
          `- ${formatDate(t.timestamp)} ${t.exerciseType} ${t.duration ? t.duration + ' min' : ''} ${t.howFelt ?? ''}`
        )
      }
    }

    const linesNutrition: string[] = []
    linesNutrition.push(...linesGeneral)
    if (userCtx?.nutritionMemory != null) {
      const raw = JSON.stringify(userCtx.nutritionMemory)
      if (raw.length > 2)
        linesNutrition.push(`Memoria nutrición (compacta): ${raw.slice(0, 400)}${raw.length > 400 ? '…' : ''}`)
    }
    if (recentNutrition.length) {
      linesNutrition.push('Últimas notas de comida / consultas:')
      for (const n of recentNutrition) {
        const head = `${formatDate(n.timestamp)} [${n.mealType}]: ${n.description.slice(0, 200)}`
        linesNutrition.push(n.userQuery ? `${head} · Pregunta: ${n.userQuery.slice(0, 120)}` : head)
      }
    }

    const contextBlock = linesGeneral.join('\n')
    const routineBlock = linesRoutine.join('\n')
    const nutritionBlock = linesNutrition.join('\n')

    /** Mismo valor: `name` para variables tipo {name} en BuilderBot; `nombre` por compatibilidad. */
    const name = coachingNameForAssistant(user.name)

    return res.json({
      exists: true,
      userId: user.id,
      phone: user.phone,
      registered: user.onboardingComplete,
      name,
      nombre: name,
      flow: user.onboardingComplete ? (user.botEnabled === false ? 'operator' : 'menu') : 'onboarding',
      coachingPurpose:
        'Usar al retomar otro día. El historial del hilo lo tiene BuilderBot. Aquí: datos de registro (gym/alimentación) y guía breve de hábitos; saludá y preguntá cómo sigue (sin recontar charlas largas).',
      contextBlock,
      routineBlock,
      nutritionBlock,
    })
  } catch (error: any) {
    console.error('Error getCoachingContext:', error)
    return res.status(500).json({ error: 'Error al obtener contexto de coaching' })
  }
}

export async function getUserContext(req: Request, res: Response) {
  try {
    const raw = decodePhonePathSegment(req.params.phone || '')
    if (!raw) {
      return res.status(400).json({ error: 'Teléfono inválido o faltante' })
    }
    if (isPlaceholder(raw)) {
      return res.json({
        registered: false,
        registered_s: 'false',
        userExists: false,
        onboardingComplete: false,
        phone: '',
        /** Para reglas HTTP en Inicio: `route === "registro"` | `=== "seguimiento"` (más estable que boolean). */
        route: 'registro',
        /** Lo que llegó en el path (ej. "@from"): si ves esto, BuilderBot no sustituyó la variable en la URL. */
        receivedInPath: raw,
      })
    }
    const phone = sanitizePhone(raw)
    if (!phone) {
      return res.status(400).json({ error: 'Teléfono inválido o faltante' })
    }
    if (!isValidPhonePathSegment(phone)) {
      return res.status(400).json({
        error:
          'En la URL debe ir el número real, solo dígitos (ej. 5491122334455). No uses <TELÉFONO> ni {{variables}} sin resolver en el path.',
        received: phone,
      })
    }

    const user = await userService.findByPhone(phone)
    const userExists = !!user
    const onboardingComplete = !!(user?.onboardingComplete)
    /** Misma semántica que antes del campo extra: solo “listo para Seguimiento” si onboarding cerró en DB. */
    const registered = onboardingComplete
    /**
     * BuilderBot (reglas HTTP): muchos flows comparan texto; `includes`/`boolean` en JSON a veces no matchea y el flow termina sin mensaje.
     * Usar `registered_s` en las reglas (p. ej. conditionRule registered_s, ===, true/false).
     */
    const registered_s = registered ? 'true' : 'false'
    /** Despachador Inicio: regla HTTP `route` + `===` evita ambigüedad con tipos JSON. */
    const route = registered ? 'seguimiento' : 'registro'
    return res.json({ registered, registered_s, route, userExists, onboardingComplete, phone })
  } catch (error: any) {
    console.error('Error getUserContext:', error)
    return res.status(500).json({ error: 'Error al obtener contexto del usuario' })
  }
}

/**
 * POST /api/bot/users/:phone/onboarding/complete
 * Marca onboarding completo en DB (misma X-API-Key que GET context).
 * Último nodo del flow Registro en BuilderBot: llamar acá cuando el copy diga “onboarding terminado”;
 * sin esto, GET /context sigue con registered=false aunque WhatsApp muestre mensaje de cierre.
 *
 * Body opcional: { "fillDefaults": true } (default true) — rellena campos nulos con valores neutros
 * para n8n/dashboard (baselines 5, restricciones "ninguna", etc.). No inventa nombre/edad/peso/altura.
 */
export async function postCompleteOnboarding(req: Request, res: Response) {
  try {
    const raw = decodePhonePathSegment(req.params.phone || '')
    if (!raw) {
      return res.status(400).json({ error: 'Teléfono inválido o faltante' })
    }
    if (isPlaceholder(raw)) {
      return res.status(400).json({ error: 'Placeholder de teléfono no válido' })
    }
    const phone = sanitizePhone(raw)
    if (!phone) {
      return res.status(400).json({ error: 'Teléfono inválido o faltante' })
    }
    if (!isValidPhonePathSegment(phone)) {
      return res.status(400).json({
        error: 'En la URL debe ir el número real, solo dígitos.',
        received: phone,
      })
    }

    const user = await userService.findByPhone(phone)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    if (user.onboardingComplete) {
      return res.json({ success: true, onboardingComplete: true, alreadyComplete: true })
    }

    if (!user.name || user.name === 'pendiente') {
      return res.status(400).json({
        error:
          'Nombre aún pendiente en Pulze. Pasá las respuestas por el webhook hasta tener nombre, o actualizá el usuario antes de cerrar.',
      })
    }

    const fillDefaults = (req.body as { fillDefaults?: boolean } | undefined)?.fillDefaults !== false

    const patch: Prisma.UserUpdateInput = { onboardingComplete: true }

    if (fillDefaults) {
      if (!user.goal || user.goal === 'pendiente') patch.goal = 'bienestar'
      if (user.restrictions == null || user.restrictions === '') patch.restrictions = 'ninguna'
      if (user.dietaryRestriction == null || user.dietaryRestriction === '') {
        patch.dietaryRestriction = 'ninguna'
      }
      if (user.activityLevel == null || user.activityLevel === '') patch.activityLevel = 'moderado'
      if (user.mealsPerDay == null) patch.mealsPerDay = 3
      if (user.proteinEnough == null || user.proteinEnough === '') patch.proteinEnough = 'no_sé'
      if (user.baselineSleep == null) patch.baselineSleep = 5
      if (user.baselineEnergy == null) patch.baselineEnergy = 5
      if (user.baselineMood == null) patch.baselineMood = 5
    }

    await userService.update(user.id, patch)
    return res.json({ success: true, onboardingComplete: true })
  } catch (error: any) {
    console.error('Error postCompleteOnboarding:', error)
    return res.status(500).json({ error: 'Error al completar onboarding' })
  }
}

/**
 * POST /api/bot/messages/outbound
 * Envía un mensaje por BuilderBot (misma vía que n8n proactive-messages). Requiere X-API-Key.
 */
export async function postOutboundMessage(req: Request, res: Response) {
  try {
    const { userId, phone, message, messageType } = req.body as {
      userId?: string
      phone?: string
      message?: string
      messageType?: string
    }
    if (!message?.trim()) {
      return res.status(400).json({ error: 'message es requerido' })
    }
    if (!userId && !phone) {
      return res.status(400).json({ error: 'userId o phone es requerido' })
    }

    let resolvedPhone: string
    let uid: string

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, phone: true },
      })
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
      resolvedPhone = user.phone
      uid = user.id
    } else {
      const normalized = sanitizePhone(String(phone).trim())
      const user = await userService.findByPhone(normalized)
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
      resolvedPhone = user.phone
      uid = user.id
    }

    const sent = await builderBotClient.sendMessage({
      phone: resolvedPhone.includes('+') ? resolvedPhone : `+${resolvedPhone}`,
      message: message.trim(),
    })

    if (!sent.success) {
      return res.status(502).json({
        error: 'Error al enviar por BuilderBot',
        detail: sent.error,
      })
    }

    await prisma.proactiveMessage.create({
      data: {
        userId: uid,
        messageType: messageType || 'outbound_api',
        content: message.trim(),
        status: 'sent',
        sentAt: new Date(),
      },
    })

    return res.json({ success: true, userId: uid, messageType: messageType || 'outbound_api' })
  } catch (error: any) {
    console.error('Error postOutboundMessage:', error)
    return res.status(500).json({ error: 'Error al enviar mensaje' })
  }
}
