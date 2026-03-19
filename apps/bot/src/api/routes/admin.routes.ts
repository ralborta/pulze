import { Router } from 'express'
import { authenticateAdmin } from '../middleware/auth'
import {
  getUsers,
  getUserById,
  updateUserBot,
  getAnalytics,
  getInactiveUsers,
  getContents,
  createContent,
  updateContent,
  deleteContent,
  getTemplates,
  createTemplate,
  updateTemplate,
  getStandardPlans,
  createStandardPlan,
  updateStandardPlan,
  deleteStandardPlan,
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
router.patch('/users/:id/bot', updateUserBot)
router.get('/users/:id', getUserById)

/**
 * Analytics
 */
router.get('/analytics', getAnalytics)

/**
 * Content Management
 */
router.get('/contents', getContents)
router.post('/contents', createContent)
router.patch('/contents/:id', updateContent)
router.delete('/contents/:id', deleteContent)

/**
 * Template Management
 */
router.get('/templates', getTemplates)
router.post('/templates', createTemplate)
router.patch('/templates/:id', updateTemplate)

/**
 * Standard Plans (base para rutinas diarias)
 */
router.get('/standard-plans', getStandardPlans)
router.post('/standard-plans', createStandardPlan)
router.patch('/standard-plans/:id', updateStandardPlan)
router.delete('/standard-plans/:id', deleteStandardPlan)

export default router
