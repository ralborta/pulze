import { Router } from 'express'
import { handleBuilderBotWebhook } from '../controllers/webhook.controller'
import { verifyBuilderBotWebhook } from '../../services/builderbot/webhook-verifier'

const router = Router()

/**
 * POST /api/webhooks/builderbot
 * Webhook para recibir mensajes de BuilderBot.app
 */
router.post(
  '/builderbot',
  verifyBuilderBotWebhook, // Verificar firma
  handleBuilderBotWebhook   // Procesar mensaje
)

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
