import { Response } from 'express'
import { prisma } from '@pulze/database'
import { AuthRequest } from '../middleware/auth'

/**
 * GET /api/preferences
 * Obtener preferencias del usuario
 */
export async function getPreferences(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    })

    if (!preferences) {
      // Crear preferencias por defecto si no existen
      const newPreferences = await prisma.userPreferences.create({
        data: { userId: req.userId },
      })
      return res.json(newPreferences)
    }

    return res.json(preferences)
  } catch (error: any) {
    console.error('Error getting preferences:', error)
    return res.status(500).json({ error: 'Error al obtener preferencias' })
  }
}

/**
 * PATCH /api/preferences
 * Actualizar preferencias del usuario
 */
export async function updatePreferences(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const { reminderTime, reminderDays, language, timezone } = req.body

    const preferences = await prisma.userPreferences.upsert({
      where: { userId: req.userId },
      update: {
        ...(reminderTime && { reminderTime }),
        ...(reminderDays && { reminderDays }),
        ...(language && { language }),
        ...(timezone && { timezone }),
      },
      create: {
        userId: req.userId,
        ...(reminderTime && { reminderTime }),
        ...(reminderDays && { reminderDays }),
        ...(language && { language }),
        ...(timezone && { timezone }),
      },
    })

    return res.json(preferences)
  } catch (error: any) {
    console.error('Error updating preferences:', error)
    return res.status(500).json({ error: 'Error al actualizar preferencias' })
  }
}
