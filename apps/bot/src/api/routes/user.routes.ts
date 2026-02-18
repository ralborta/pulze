import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import { getMe, updateMe, getMyStats } from '../controllers/user.controller'

const router = Router()

/**
 * Todas las rutas de /api/users requieren autenticación
 */
router.use(authenticateToken)

/**
 * GET /api/users/me
 * Obtener datos del usuario actual
 */
router.get('/me', getMe)

/**
 * PATCH /api/users/me
 * Actualizar perfil del usuario
 */
router.patch('/me', updateMe)

/**
 * GET /api/users/me/stats
 * Obtener estadísticas del usuario
 */
router.get('/me/stats', getMyStats)

export default router
