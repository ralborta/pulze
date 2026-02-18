import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import { getPreferences, updatePreferences } from '../controllers/preferences.controller'

const router = Router()

/**
 * Todas las rutas requieren autenticación
 */
router.use(authenticateToken)

/**
 * GET /api/preferences
 * Obtener preferencias del usuario
 */
router.get('/', getPreferences)

/**
 * PATCH /api/preferences
 * Actualizar preferencias del usuario
 */
router.patch('/', updatePreferences)

export default router
