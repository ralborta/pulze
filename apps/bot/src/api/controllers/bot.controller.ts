import { Request, Response } from 'express'
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

/**
 * GET /api/bot/users/:phone/coaching-context
 * Contexto completo para Seguimiento (bloques + flags). No confundir con GET …/context (solo registered).
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
        take: 5,
      }),
      prisma.trainingLog.findMany({
        where: { userId: user.id },
        orderBy: { timestamp: 'desc' },
        take: 3,
      }),
      prisma.nutritionLog.findMany({
        where: { userId: user.id },
        orderBy: { timestamp: 'desc' },
        take: 5,
      }),
    ])

    const name = user.name && user.name !== 'pendiente' ? user.name : '(sin nombre)'
    const goal = user.goal && user.goal !== 'pendiente' ? user.goal : '—'

    const linesGeneral: string[] = []
    linesGeneral.push(`Usuario: ${name} · tel ${user.phone}`)
    linesGeneral.push(`Objetivo declarado: ${goal}`)
    if (user.restrictions && user.restrictions !== 'ninguna')
      linesGeneral.push(`Restricciones físicas: ${user.restrictions}`)
    if (user.dietaryRestriction && user.dietaryRestriction !== 'ninguna')
      linesGeneral.push(`Restricción alimentaria: ${user.dietaryRestriction}`)
    linesGeneral.push(`Nivel actividad: ${user.activityLevel ?? '—'}`)
    linesGeneral.push(`Comidas/día: ${user.mealsPerDay ?? '—'} · Proteína suficiente: ${user.proteinEnough ?? '—'}`)
    linesGeneral.push(`Racha check-ins: ${user.currentStreak} · Último check-in: ${user.lastCheckInDate ? formatDate(user.lastCheckInDate) : '—'}`)
    if (userCtx?.aiSummary) linesGeneral.push(`Resumen coach (IA): ${userCtx.aiSummary.slice(0, 1200)}`)

    const linesRoutine: string[] = []
    linesRoutine.push(...linesGeneral)
    if (userCtx?.trainingMemory != null) {
      linesRoutine.push(`Memoria entreno (JSON): ${JSON.stringify(userCtx.trainingMemory).slice(0, 1500)}`)
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
      linesNutrition.push(`Memoria nutrición (JSON): ${JSON.stringify(userCtx.nutritionMemory).slice(0, 1500)}`)
    }
    if (recentNutrition.length) {
      linesNutrition.push('Últimas entradas de comida / consultas:')
      for (const n of recentNutrition) {
        const head = `${formatDate(n.timestamp)} [${n.mealType}]: ${n.description.slice(0, 200)}`
        linesNutrition.push(n.userQuery ? `${head} · Pregunta: ${n.userQuery.slice(0, 120)}` : head)
      }
    }

    const contextBlock = linesGeneral.join('\n')
    const routineBlock = linesRoutine.join('\n')
    const nutritionBlock = linesNutrition.join('\n')

    return res.json({
      exists: true,
      userId: user.id,
      phone: user.phone,
      registered: user.onboardingComplete,
      nombre: user.name && user.name !== 'pendiente' ? user.name : '',
      flow: user.onboardingComplete ? (user.botEnabled === false ? 'operator' : 'menu') : 'onboarding',
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
      return res.json({ registered: false })
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
    const registered = !!(user?.onboardingComplete)
    return res.json({ registered })
  } catch (error: any) {
    console.error('Error getUserContext:', error)
    return res.status(500).json({ error: 'Error al obtener contexto del usuario' })
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
