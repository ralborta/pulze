import crypto from 'crypto'
import { Request, Response, NextFunction } from 'express'

/**
 * Middleware para verificar que el webhook viene de BuilderBot.
 *
 * Soporta dos modos (BuilderBot Cloud no expone webhook secret nativo):
 *
 * 1. Token simple: Si configurás BUILDERBOT_WEBHOOK_SECRET y en BuilderBot agregás
 *    un header personalizado "x-webhook-secret" con el mismo valor, verificamos que coincidan.
 *
 * 2. HMAC (futuro): Si BuilderBot envía x-builderbot-signature y x-builderbot-timestamp,
 *    verificamos la firma HMAC.
 *
 * Si BUILDERBOT_WEBHOOK_SECRET no está configurado, se salta la verificación.
 */
export function verifyBuilderBotWebhook(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const secret = process.env.BUILDERBOT_WEBHOOK_SECRET?.trim()

  if (!secret) {
    console.warn('⚠️ BUILDERBOT_WEBHOOK_SECRET no configurado - saltando verificación')
    return next()
  }

  // Modo 1: Token simple (header personalizado de BuilderBot)
  const tokenHeader = req.headers['x-webhook-secret'] as string
  if (tokenHeader?.trim()) {
    const received = Buffer.from(tokenHeader.trim(), 'utf8')
    const expected = Buffer.from(secret, 'utf8')
    if (received.length === expected.length && crypto.timingSafeEqual(received, expected)) {
      return next()
    }
    return res.status(401).json({ error: 'Invalid webhook secret' })
  }

  // Modo 2: HMAC (si BuilderBot lo soporta en el futuro)
  const signature = req.headers['x-builderbot-signature'] as string
  const timestamp = req.headers['x-builderbot-timestamp'] as string

  if (!signature || !timestamp) {
    return res.status(401).json({
      error: 'Missing x-webhook-secret or x-builderbot-signature. Agregá el header "x-webhook-secret" en BuilderBot con el mismo valor que BUILDERBOT_WEBHOOK_SECRET.',
    })
  }

  const now = Math.floor(Date.now() / 1000)
  const requestTime = parseInt(timestamp)
  if (Math.abs(now - requestTime) > 300) {
    return res.status(401).json({ error: 'Request timestamp too old' })
  }

  const payload = `${timestamp}.${JSON.stringify(req.body)}`
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  const signatureBuffer = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expectedSignature, 'hex')

  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  next()
}
