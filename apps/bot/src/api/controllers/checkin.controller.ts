import { Response } from 'express'
import { checkInService } from '@pulze/database'
import { AuthRequest } from '../middleware/auth'

/**
 * POST /api/check-ins
 * Crear nuevo check-in
 */
export async function createCheckIn(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const { sleep, energy, mood, willTrain, notes } = req.body

    // Validar campos requeridos
    if (!sleep || !energy || !mood || willTrain === undefined) {
      return res.status(400).json({
        error: 'Campos requeridos: sleep, energy, mood, willTrain',
      })
    }

    // Verificar si ya hizo check-in hoy
    const hasCheckIn = await checkInService.hasCheckInToday(req.userId)
    if (hasCheckIn) {
      return res.status(400).json({
        error: 'Ya realizaste tu check-in de hoy',
      })
    }

    // Crear check-in
    const checkIn = await checkInService.create({
      user: { connect: { id: req.userId } },
      sleep,
      energy,
      mood,
      willTrain,
      notes,
    })

    return res.status(201).json(checkIn)
  } catch (error: any) {
    console.error('Error creating check-in:', error)
    return res.status(500).json({ error: 'Error al crear check-in' })
  }
}

/**
 * GET /api/check-ins/week
 * Obtener check-ins de la semana actual
 */
export async function getWeekCheckIns(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const checkIns = await checkInService.getWeekCheckIns(req.userId)

    return res.json({
      checkIns,
      total: checkIns.length,
    })
  } catch (error: any) {
    console.error('Error getting week check-ins:', error)
    return res.status(500).json({ error: 'Error al obtener check-ins' })
  }
}

/**
 * GET /api/check-ins/today
 * Verificar si existe check-in de hoy
 */
export async function getTodayCheckIn(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const hasCheckIn = await checkInService.hasCheckInToday(req.userId)

    if (!hasCheckIn) {
      return res.json({
        exists: false,
        checkIn: null,
      })
    }

    const checkIns = await checkInService.findByUserId(req.userId, {
      take: 1,
      orderBy: { timestamp: 'desc' },
    })

    return res.json({
      exists: true,
      checkIn: checkIns[0] || null,
    })
  } catch (error: any) {
    console.error('Error getting today check-in:', error)
    return res.status(500).json({ error: 'Error al verificar check-in' })
  }
}

/**
 * GET /api/check-ins/history
 * Obtener historial de check-ins con paginación
 */
export async function getCheckInsHistory(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10

    const checkIns = await checkInService.findByUserId(req.userId, {
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { timestamp: 'desc' },
    })

    return res.json({
      checkIns,
      page,
      limit,
    })
  } catch (error: any) {
    console.error('Error getting check-ins history:', error)
    return res.status(500).json({ error: 'Error al obtener historial' })
  }
}

/**
 * GET /api/check-ins/streak
 * Calcular racha actual del usuario
 */
export async function getStreak(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const streak = await checkInService.calculateStreak(req.userId)

    return res.json({
      currentStreak: streak,
    })
  } catch (error: any) {
    console.error('Error calculating streak:', error)
    return res.status(500).json({ error: 'Error al calcular racha' })
  }
}
