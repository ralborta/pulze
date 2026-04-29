import { Request, Response } from 'express'
import { userService, prisma } from '@pulze/database'
import { builderBotClient } from '../../services/builderbot'

function normalizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return ''
  try {
    return decodeURIComponent(phone).replace(/\s+/g, '').replace(/^\+/, '').trim()
  } catch {
    return phone.replace(/\s+/g, '').replace(/^\+/, '').trim()
  }
}

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
 * Lectura de estado para ramificar flows en BuilderBot (requiere X-API-Key).
 */
/** Solo dígitos (8–20) para teléfonos E.164 y JIDs/LID numéricos largos de WhatsApp. */
function isValidPhonePathSegment(s: string): boolean {
  if (!s || /[<>{}@]/.test(s)) return false
  return /^\d{8,20}$/.test(s)
}

export async function getUserContext(req: Request, res: Response) {
  try {
    const phone = normalizePhone(req.params.phone || '')
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
    if (!user) {
      return res.json({
        exists: false,
        phone,
        registered: false,
        onboardingComplete: false,
        nombre: '',
        flow: 'onboarding',
        botEnabled: true,
      })
    }

    const nombre =
      user.name && user.name !== 'pendiente' ? user.name : ''

    let flow: string = 'menu'
    if (!user.onboardingComplete) flow = 'onboarding'
    else if (user.botEnabled === false) flow = 'operator'

    return res.json({
      exists: true,
      userId: user.id,
      phone: user.phone,
      registered: user.onboardingComplete,
      onboardingComplete: user.onboardingComplete,
      nombre,
      flow,
      botEnabled: user.botEnabled,
      goal: user.goal !== 'pendiente' ? user.goal : null,
      currentStreak: user.currentStreak,
      lastCheckInDate: user.lastCheckInDate,
      reminderTime: user.preferences?.reminderTime ?? '08:00',
    })
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
      const normalized = normalizePhone(phone!)
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
