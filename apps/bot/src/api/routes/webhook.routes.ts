import { Router } from 'express'
import { handleBuilderBotWebhook } from '../controllers/webhook.controller'

const router = Router()

/**
 * POST /api/webhooks/builderbot
 * Webhook para recibir mensajes de BuilderBot.app
 */
router.post('/builderbot', handleBuilderBotWebhook)

/**
 * GET /api/webhooks/builderbot/health
 * Health check para el webhook
 */
router.get('/builderbot/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'builderbot-webhook',
    timestamp: new Date().toISOString(),
  })
})

export default router
