import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import {
  createCheckIn,
  getWeekCheckIns,
  getTodayCheckIn,
  getCheckInsHistory,
  getStreak,
} from '../controllers/checkin.controller'

const router = Router()

/**
 * Todas las rutas requieren autenticación
 */
router.use(authenticateToken)

/**
 * POST /api/check-ins
 * Crear nuevo check-in
 */
router.post('/', createCheckIn)

/**
 * GET /api/check-ins/week
 * Obtener check-ins de la semana actual
 */
router.get('/week', getWeekCheckIns)

/**
 * GET /api/check-ins/today
 * Verificar si existe check-in de hoy
 */
router.get('/today', getTodayCheckIn)

/**
 * GET /api/check-ins/history
 * Obtener historial con paginación
 */
router.get('/history', getCheckInsHistory)

/**
 * GET /api/check-ins/streak
 * Calcular racha actual
 */
router.get('/streak', getStreak)

export default router
