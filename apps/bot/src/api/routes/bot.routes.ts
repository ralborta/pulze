import { Router } from 'express'
import { handleBuilderBotWebhook } from '../controllers/webhook.controller'
import { verifyBuilderBotWebhook } from '../../services/builderbot/webhook-verifier'
import { requireApiKey } from '../middleware/apiKey'
import {
  getBotHealth,
  getUserContext,
  postOutboundMessage,
} from '../controllers/bot.controller'

const router = Router()

/**
 * GET /api/bot/health
 * Sin auth (monitoreo).
 */
router.get('/health', getBotHealth)

/**
 * POST /api/bot/inbound
 * Misma lógica que POST /api/webhooks/builderbot (BuilderBot → PULZE).
 * Verificación opcional: BUILDERBOT_WEBHOOK_SECRET / header x-webhook-secret.
 */
router.post('/inbound', verifyBuilderBotWebhook, handleBuilderBotWebhook)

/**
 * GET /api/bot/users/:phone/context
 * Estado del usuario para ramificar en BuilderBot. Requiere X-API-Key (N8N_API_KEY / API_KEY).
 */
router.get('/users/:phone/context', requireApiKey, getUserContext)

/**
 * POST /api/bot/messages/outbound
 * Envío explícito por API de BuilderBot. Requiere X-API-Key.
 * Body: { message, userId } o { message, phone }
 */
router.post('/messages/outbound', requireApiKey, postOutboundMessage)

export default router
