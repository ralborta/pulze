import { Request, Response } from 'express'
import { prisma, userService } from '@pulze/database'
import { aiService, contextService } from '../../services/ai'
import { promptBuilderService } from '../../services/ai/prompt-builder.service'
import { builderBotClient } from '../../services/builderbot'

/**
 * GET /api/n8n/users/pending-checkin
 * Usuarios con onboarding completo, sin check-in hoy, en su ventana de recordatorio.
 * Query: hour (opcional, 0-23). Si no se envía, se usa la hora actual en America/Argentina/Buenos_Aires.
 */
export async function getPendingCheckin(req: Request, res: Response) {
  try {
    let hour: number
    if (req.query.hour != null) {
      hour = parseInt(req.query.hour as string, 10)
      if (isNaN(hour) || hour < 0 || hour > 23) {
        return res.status(400).json({ error: 'hour debe ser 0-23' })
      }
    } else {
      const now = new Date()
      hour = now.getHours()
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        onboardingComplete: true,
        botEnabled: true,
        checkIns: {
          none: {
            timestamp: { gte: today },
          },
        },
      },
      include: {
        preferences: true,
      },
    })

    const pending = users.filter((u) => {
      const preferredTime = u.preferences?.reminderTime || '08:00'
      const preferredHour = parseInt(preferredTime.split(':')[0], 10)
      return preferredHour === hour
    })

    return res.json({
      users: pending.map((u) => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        reminderTime: u.preferences?.reminderTime,
      })),
      total: pending.length,
    })
  } catch (error: any) {
    console.error('Error getPendingCheckin:', error)
    return res.status(500).json({ error: 'Error al obtener usuarios pendientes de check-in' })
  }
}

/**
 * GET /api/n8n/users/inactive
 * Usuarios con último check-in hace al menos N días (2-7 típico).
 * Query: days (default 2).
 */
export async function getInactive(req: Request, res: Response) {
  try {
    const days = parseInt(req.query.days as string, 10) || 2
    const since = new Date()
    since.setDate(since.getDate() - days)

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        onboardingComplete: true,
        botEnabled: true,
        OR: [
          { lastCheckInDate: { lt: since } },
          { lastCheckInDate: null },
        ],
      },
      include: {
        preferences: true,
        checkIns: { orderBy: { timestamp: 'desc' }, take: 1 },
      },
    })

    const withDays = users.map((u) => {
      const last = u.lastCheckInDate
        ? Math.floor((Date.now() - u.lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999
      return {
        id: u.id,
        name: u.name,
        phone: u.phone,
        daysSinceLastCheckIn: last,
        lastCheckInDate: u.lastCheckInDate,
        currentStreak: u.currentStreak,
        longestStreak: u.longestStreak,
      }
    })

    return res.json({ users: withDays, total: withDays.length })
  } catch (error: any) {
    console.error('Error getInactive:', error)
    return res.status(500).json({ error: 'Error al obtener usuarios inactivos' })
  }
}

/**
 * GET /api/n8n/users/active
 * Usuarios activos (onboarding completo, bot activo) para resumen semanal u otros flujos.
 * Query: limit (opcional, default 100).
 */
export async function getActive(req: Request, res: Response) {
  try {
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 100, 500)
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        onboardingComplete: true,
        botEnabled: true,
      },
      select: { id: true, name: true, phone: true },
      take: limit,
    })
    return res.json({ users, total: users.length })
  } catch (error: any) {
    console.error('Error getActive:', error)
    return res.status(500).json({ error: 'Error al obtener usuarios activos' })
  }
}

/**
 * GET /api/n8n/users/milestones
 * Usuarios que hoy cumplen un hito de racha (3, 7, 14, 30 días) para mensaje de celebración.
 */
export async function getMilestones(req: Request, res: Response) {
  try {
    const milestones = [3, 7, 14, 30]
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        onboardingComplete: true,
        botEnabled: true,
        currentStreak: { in: milestones },
      },
      include: { preferences: true },
    })

    const withMilestone = users.map((u) => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      milestone: `streak_${u.currentStreak}` as string,
      currentStreak: u.currentStreak,
    }))

    return res.json({ users: withMilestone, total: withMilestone.length })
  } catch (error: any) {
    console.error('Error getMilestones:', error)
    return res.status(500).json({ error: 'Error al obtener hitos' })
  }
}

/**
 * POST /api/n8n/openai/generate-reminder
 * Body: { userId }
 */
export async function generateReminder(req: Request, res: Response) {
  try {
    const { userId } = req.body as { userId?: string }
    if (!userId) return res.status(400).json({ error: 'userId requerido' })

    const user = await userService.findById(userId)
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    const context = await contextService.getUserContext(userId)
    const prompt = `Genera un mensaje breve de recordatorio de check-in para ${user.name}. Racha actual: ${user.currentStreak} días. Tono amigable, 2-3 líneas. Pide que responda con sueño (1-5), energía (1-5) y ánimo.`
    const result = await aiService.generateCoachResponse(prompt, context, [])

    return res.json({ content: result.content })
  } catch (error: any) {
    console.error('Error generateReminder:', error)
    return res.status(500).json({ error: 'Error al generar recordatorio' })
  }
}

/**
 * POST /api/n8n/openai/generate-reactivation
 * Body: { userId, daysSinceLastCheckIn }
 */
export async function generateReactivation(req: Request, res: Response) {
  try {
    const { userId, daysSinceLastCheckIn } = req.body as {
      userId?: string
      daysSinceLastCheckIn?: number
    }
    if (!userId) return res.status(400).json({ error: 'userId requerido' })

    const user = await userService.findById(userId)
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    const days = typeof daysSinceLastCheckIn === 'number' ? daysSinceLastCheckIn : 2
    const { system, user: userPrompt } = promptBuilderService.buildReactivationPrompt(
      user as any,
      days
    )
    const result = await aiService.generateCoachResponse(userPrompt, system, [])

    return res.json({ content: result.content })
  } catch (error: any) {
    console.error('Error generateReactivation:', error)
    return res.status(500).json({ error: 'Error al generar reactivación' })
  }
}

/**
 * POST /api/n8n/openai/generate-celebration
 * Body: { userId, milestone } (milestone opcional, ej. streak_7)
 */
export async function generateCelebration(req: Request, res: Response) {
  try {
    const { userId, milestone } = req.body as { userId?: string; milestone?: string }
    if (!userId) return res.status(400).json({ error: 'userId requerido' })

    const user = await userService.findById(userId)
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    const days = user.currentStreak
    const prompt = `${user.name} alcanzó ${days} días de racha. Genera una felicitación breve (2-3 líneas), específica y genuina.`
    const result = await aiService.generateCoachResponse(prompt, undefined, [])

    return res.json({ content: result.content })
  } catch (error: any) {
    console.error('Error generateCelebration:', error)
    return res.status(500).json({ error: 'Error al generar celebración' })
  }
}

/**
 * POST /api/n8n/openai/generate-weekly-report
 * Body: { userId }
 */
export async function generateWeeklyReport(req: Request, res: Response) {
  try {
    const { userId } = req.body as { userId?: string }
    if (!userId) return res.status(400).json({ error: 'userId requerido' })

    const user = await userService.findById(userId)
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    const checkIns = user.checkIns || []
    const { system, user: userPrompt } = promptBuilderService.buildWeeklySummaryPrompt(
      user as any,
      checkIns
    )
    const result = await aiService.generateCoachResponse(userPrompt, system, [])

    return res.json({ content: result.content })
  } catch (error: any) {
    console.error('Error generateWeeklyReport:', error)
    return res.status(500).json({ error: 'Error al generar resumen semanal' })
  }
}

/**
 * POST /api/n8n/proactive-messages
 * Body: { userId, content, messageType }
 * Envía el mensaje por BuilderBot y guarda en ProactiveMessage.
 */
export async function sendProactiveMessage(req: Request, res: Response) {
  try {
    const { userId, content, messageType } = req.body as {
      userId?: string
      content?: string
      messageType?: string
    }
    if (!userId || !content) {
      return res.status(400).json({ error: 'userId y content requeridos' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, name: true },
    })
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    const sent = await builderBotClient.sendMessage({
      phone: user.phone,
      message: content,
    })

    if (!sent.success) {
      return res.status(502).json({
        error: 'Error al enviar por BuilderBot',
        detail: sent.error,
      })
    }

    await prisma.proactiveMessage.create({
      data: {
        userId: user.id,
        messageType: messageType || 'proactive',
        content,
        status: 'sent',
        sentAt: new Date(),
      },
    })

    return res.json({
      success: true,
      userId: user.id,
      messageType: messageType || 'proactive',
    })
  } catch (error: any) {
    console.error('Error sendProactiveMessage:', error)
    return res.status(500).json({ error: 'Error al enviar mensaje proactivo' })
  }
}
