import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import {
  getContents,
  getContentById,
  getContentsByCategory,
  getPopularContents,
} from '../controllers/content.controller'

const router = Router()

/**
 * Rutas públicas (o con autenticación opcional)
 */

/**
 * GET /api/contents
 * Listar contenidos con filtros
 */
router.get('/', getContents)

/**
 * GET /api/contents/popular
 * Obtener contenidos más vistos
 */
router.get('/popular', getPopularContents)

/**
 * GET /api/contents/category/:category
 * Obtener contenidos por categoría
 */
router.get('/category/:category', getContentsByCategory)

/**
 * GET /api/contents/:id
 * Obtener contenido específico
 */
router.get('/:id', getContentById)

export default router
