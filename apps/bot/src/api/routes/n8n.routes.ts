import { Router } from 'express'
import { requireApiKey } from '../middleware/apiKey'
import {
  getPendingCheckin,
  getInactive,
  getActive,
  getMilestones,
  getStandardPlans,
  generateReminder,
  generateReactivation,
  generateCelebration,
  generateWeeklyReport,
  adaptRoutine,
  sendProactiveMessage,
} from '../controllers/n8n.controller'

const router = Router()

router.use(requireApiKey)

router.get('/users/pending-checkin', getPendingCheckin)
router.get('/users/inactive', getInactive)
router.get('/users/active', getActive)
router.get('/users/milestones', getMilestones)

router.get('/standard-plans', getStandardPlans)

// Rutas históricas /openai/*: el texto se arma con plantillas en servidor (sin OpenAI).
router.post('/openai/generate-reminder', generateReminder)
router.post('/openai/generate-reactivation', generateReactivation)
router.post('/openai/generate-celebration', generateCelebration)
router.post('/openai/generate-weekly-report', generateWeeklyReport)
router.post('/openai/adapt-routine', adaptRoutine)

router.post('/proactive-messages', sendProactiveMessage)

export default router
