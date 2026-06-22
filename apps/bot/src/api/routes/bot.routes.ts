import { Router } from 'express'
import { handleBuilderBotWebhook } from '../controllers/webhook.controller'
import { requireApiKey } from '../middleware/apiKey'
import {
  getBotHealth,
  getUserContext,
  getCoachingContext,
  postBotContext,
  postBotCheck,
  postBotCheckByPhone,
  postCoachingContext,
  postCompleteOnboarding,
  getMagicLink,
  postRoutineReminder,
  patchUserProfile,
  postOutboundMessage,
} from '../controllers/bot.controller'

const router = Router()

/**
 * GET /api/bot/health
 * Sin auth (monitoreo).
 */
router.get('/health', getBotHealth)

/**
 * POST /api/bot/check
 * Inicio BuilderBot: solo verifica registro. Teléfono en body, query o path /users/:phone/check.
 */
router.post('/check', requireApiKey, postBotCheck)

/**
 * POST /api/bot/users/:phone/check
 * Preferido en BuilderBot: {from} en la URL (Constanza usa ?phone={from}).
 */
router.post('/users/:phone/check', requireApiKey, postBotCheckByPhone)

/**
 * POST /api/bot/inbound
 */
router.post('/inbound', handleBuilderBotWebhook)

/**
 * POST /api/bot/users/:phone/inbound
 * Mismo handler; teléfono en path cuando BB no resuelve {from} en el body JSON.
 */
router.post('/users/:phone/inbound', requireApiKey, handleBuilderBotWebhook)

/**
 * GET /api/bot/users/:phone/context
 */
router.get('/users/:phone/context', requireApiKey, getUserContext)

/**
 * POST /api/bot/context
 * Ramificación Inicio (BuilderBot): teléfono en body.phone / body.from.
 */
router.post('/context', requireApiKey, postBotContext)

/**
 * GET /api/bot/users/:phone/coaching-context
 * Bloques contextBlock / routineBlock / nutritionBlock para BuilderBot (misma auth que context).
 */
router.get('/users/:phone/coaching-context', requireApiKey, getCoachingContext)

/**
 * POST /api/bot/coaching-context
 * Contexto coaching (Seguimiento): teléfono en body.
 */
router.post('/coaching-context', requireApiKey, postCoachingContext)

/**
 * PATCH /api/bot/users/:phone/profile
 * Campos de onboarding / perfil (parcial). Misma auth que context.
 */
router.patch('/users/:phone/profile', requireApiKey, patchUserProfile)

/**
 * POST /api/bot/users/:phone/onboarding/complete
 * Cierra onboarding en DB (después del último paso del flow Registro en BuilderBot).
 */
router.post('/users/:phone/onboarding/complete', requireApiKey, postCompleteOnboarding)

/**
 * GET /api/bot/users/:phone/magic-link
 * Magic link a la WebApp para el teléfono del usuario. Query: redirect (opcional).
 */
router.get('/users/:phone/magic-link', requireApiKey, getMagicLink)

/**
 * POST /api/bot/users/:phone/routine-reminder
 * Recordatorio: mensaje + imágenes del plan (BuilderBot flow de ejecución).
 */
router.post('/users/:phone/routine-reminder', requireApiKey, postRoutineReminder)

/**
 * POST /api/bot/messages/outbound
 * Envío explícito por API de BuilderBot. Requiere X-API-Key.
 * Body: { message, userId } o { message, phone }
 */
router.post('/messages/outbound', requireApiKey, postOutboundMessage)

export default router
