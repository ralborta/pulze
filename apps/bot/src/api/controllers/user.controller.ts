import { Response } from 'express'
import { userService } from '@pulze/database'
import { AuthRequest } from '../middleware/auth'

/**
 * GET /api/users/me
 * Obtener datos del usuario actual
 */
export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const user = await userService.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    return res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      goal: user.goal,
      restrictions: user.restrictions,
      activityLevel: user.activityLevel,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastCheckInDate: user.lastCheckInDate,
      isPremium: user.isPremium,
      onboardingComplete: user.onboardingComplete,
      createdAt: user.createdAt,
      preferences: user.preferences,
      stats: user.stats,
    })
  } catch (error: any) {
    console.error('Error getting user:', error)
    return res.status(500).json({ error: 'Error al obtener usuario' })
  }
}

/**
 * PATCH /api/users/me
 * Actualizar perfil del usuario
 */
export async function updateMe(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const { name, email, goal, restrictions, activityLevel } = req.body

    const updatedUser = await userService.update(req.userId, {
      ...(name && { name }),
      ...(email && { email }),
      ...(goal && { goal }),
      ...(restrictions !== undefined && { restrictions }),
      ...(activityLevel && { activityLevel }),
    })

    return res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      goal: updatedUser.goal,
      restrictions: updatedUser.restrictions,
      activityLevel: updatedUser.activityLevel,
    })
  } catch (error: any) {
    console.error('Error updating user:', error)
    return res.status(500).json({ error: 'Error al actualizar usuario' })
  }
}

/**
 * GET /api/users/me/stats
 * Obtener estadísticas del usuario
 */
export async function getMyStats(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const user = await userService.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    return res.json({
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      totalCheckIns: user.stats?.totalCheckIns || 0,
      averageSleep: user.stats?.averageSleep || null,
      averageEnergy: user.stats?.averageEnergy || null,
      trainingDays: user.stats?.trainingDays || 0,
      messagesReceived: user.stats?.messagesReceived || 0,
      messagesSent: user.stats?.messagesSent || 0,
      contentsViewed: user.stats?.contentsViewed || 0,
      lastActiveDate: user.stats?.lastActiveDate || null,
    })
  } catch (error: any) {
    console.error('Error getting user stats:', error)
    return res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
}
