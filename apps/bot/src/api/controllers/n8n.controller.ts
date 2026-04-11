import { Request, Response } from 'express'
import { prisma, userService } from '@pulze/database'
import { builderBotClient } from '../../services/builderbot'
import {
  buildCheckinReminderCopy,
  buildReactivationCopy,
  buildCelebrationCopy,
  buildWeeklyReportCopy,
} from '../../services/messages/proactive-copy.service'

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
 * Texto fijo con datos del usuario (sin OpenAI). La redacción “bonita” puede ir en BuilderBot.
 */
export async function generateReminder(req: Request, res: Response) {
  try {
    const { userId } = req.body as { userId?: string }
    if (!userId) return res.status(400).json({ error: 'userId requerido' })

    const user = await userService.findById(userId)
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    const content = buildCheckinReminderCopy({
      name: user.name,
      currentStreak: user.currentStreak,
    })
    return res.json({ content })
  } catch (error: any) {
    console.error('Error generateReminder:', error)
    return res.status(500).json({ error: 'Error al armar recordatorio' })
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
    const content = buildReactivationCopy({
      name: user.name,
      daysSinceLastCheckIn: days,
      currentStreak: user.currentStreak,
    })
    return res.json({ content })
  } catch (error: any) {
    console.error('Error generateReactivation:', error)
    return res.status(500).json({ error: 'Error al armar reactivación' })
  }
}

/**
 * POST /api/n8n/openai/generate-celebration
 * Body: { userId, milestone } (milestone opcional; la racha sale del usuario en DB)
 */
export async function generateCelebration(req: Request, res: Response) {
  try {
    const { userId } = req.body as { userId?: string; milestone?: string }
    if (!userId) return res.status(400).json({ error: 'userId requerido' })

    const user = await userService.findById(userId)
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    const content = buildCelebrationCopy({
      name: user.name,
      currentStreak: user.currentStreak,
    })
    return res.json({ content })
  } catch (error: any) {
    console.error('Error generateCelebration:', error)
    return res.status(500).json({ error: 'Error al armar celebración' })
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

    const checkIns = (user.checkIns || []).map((c) => ({
      sleep: c.sleep,
      energy: c.energy,
      timestamp: c.timestamp,
    }))
    const content = buildWeeklyReportCopy({ name: user.name, checkIns })
    return res.json({ content })
  } catch (error: any) {
    console.error('Error generateWeeklyReport:', error)
    return res.status(500).json({ error: 'Error al armar resumen semanal' })
  }
}

/**
 * GET /api/n8n/standard-plans
 * Planes estándar activos para que n8n/IA los use.
 * Query: difficulty, category (opcionales).
 */
export async function getStandardPlans(req: Request, res: Response) {
  try {
    const { difficulty, category } = req.query

    const where: any = { isActive: true }
    if (difficulty) where.difficulty = difficulty
    if (category) where.category = category

    const plans = await prisma.standardPlan.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })

    return res.json({ plans, total: plans.length })
  } catch (error: any) {
    console.error('Error getStandardPlans:', error)
    return res.status(500).json({ error: 'Error al obtener planes estándar' })
  }
}

/**
 * POST /api/n8n/openai/adapt-routine
 * Body: { userId, planId?, checkInData? }
 * Adapta un plan estándar al usuario. Si no hay planId, la IA elige uno según nivel/restricciones.
 */
export async function adaptRoutine(req: Request, res: Response) {
  try {
    const { userId, planId, checkInData } = req.body as {
      userId?: string
      planId?: string
      checkInData?: { sleep?: number; energy?: number; mood?: string; willTrain?: boolean }
    }
    if (!userId) return res.status(400).json({ error: 'userId requerido' })

    const { adaptRoutineForUser } = await import('../../services/ai/routine-adapter.service')
    const result = await adaptRoutineForUser({ userId, planId, checkInData })

    if (!result) {
      return res.json({
        content: 'No hay planes estándar configurados. Agregá planes desde el backoffice.',
      })
    }

    return res.json({
      content: result.content,
      planId: result.planId,
      planTitle: result.planTitle,
    })
  } catch (error: any) {
    console.error('Error adaptRoutine:', error)
    return res.status(500).json({ error: 'Error al adaptar rutina' })
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
