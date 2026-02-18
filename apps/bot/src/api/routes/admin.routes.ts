import { Router } from 'express'
import { authenticateAdmin } from '../middleware/auth'
import {
  getUsers,
  getUserById,
  getAnalytics,
  getInactiveUsers,
  createContent,
  updateContent,
  deleteContent,
  getTemplates,
  updateTemplate,
} from '../controllers/admin.controller'

const router = Router()

/**
 * Todas las rutas de admin requieren autenticación de admin
 */
router.use(authenticateAdmin)

/**
 * Users Management
 */
router.get('/users', getUsers)
router.get('/users/inactive', getInactiveUsers)
router.get('/users/:id', getUserById)

/**
 * Analytics
 */
router.get('/analytics', getAnalytics)

/**
 * Content Management
 */
router.post('/contents', createContent)
router.patch('/contents/:id', updateContent)
router.delete('/contents/:id', deleteContent)

/**
 * Template Management
 */
router.get('/templates', getTemplates)
router.patch('/templates/:id', updateTemplate)

export default router
