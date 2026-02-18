import { Router } from 'express'
import { createMagicLink, verifyToken, login } from '../controllers/auth.controller'

const router = Router()

/**
 * POST /api/auth/magic-link
 * Generar magic link para acceso a WebApp
 */
router.post('/magic-link', createMagicLink)

/**
 * POST /api/auth/verify
 * Verificar magic token y obtener JWT de sesión
 */
router.post('/verify', verifyToken)

/**
 * POST /api/auth/login
 * Login directo con teléfono (para testing)
 */
router.post('/login', login)

export default router
