import { Router } from 'express'
import { handleBuilderBotWebhook } from '../controllers/webhook.controller'
import { requireApiKey } from '../middleware/apiKey'
import {
  getBotHealth,
  getUserContext,
  getCoachingContext,
  postCompleteOnboarding,
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
 */
router.post('/inbound', handleBuilderBotWebhook)

/**
 * GET /api/bot/users/:phone/context
 * Estado del usuario para ramificar en BuilderBot. Requiere X-API-Key (API_KEY / N8N_API_KEY, cualquiera configurada).
 */
router.get('/users/:phone/context', requireApiKey, getUserContext)

/**
 * GET /api/bot/users/:phone/coaching-context
 * Bloques contextBlock / routineBlock / nutritionBlock para BuilderBot (misma auth que context).
 */
router.get('/users/:phone/coaching-context', requireApiKey, getCoachingContext)

/**
 * POST /api/bot/users/:phone/onboarding/complete
 * Cierra onboarding en DB (después del último paso del flow Registro en BuilderBot).
 */
router.post('/users/:phone/onboarding/complete', requireApiKey, postCompleteOnboarding)

/**
 * POST /api/bot/messages/outbound
 * Envío explícito por API de BuilderBot. Requiere X-API-Key.
 * Body: { message, userId } o { message, phone }
 */
router.post('/messages/outbound', requireApiKey, postOutboundMessage)

export default router
