import crypto from 'crypto'
import { Request, Response, NextFunction } from 'express'

/**
 * Middleware para verificar que el webhook viene de BuilderBot
 */
export function verifyBuilderBotWebhook(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const signature = req.headers['x-builderbot-signature'] as string
  const timestamp = req.headers['x-builderbot-timestamp'] as string
  const secret = process.env.BUILDERBOT_WEBHOOK_SECRET

  if (!secret) {
    console.warn('⚠️ BUILDERBOT_WEBHOOK_SECRET no configurado - saltando verificación')
    return next()
  }

  if (!signature || !timestamp) {
    return res.status(401).json({
      error: 'Missing signature or timestamp',
    })
  }

  // Verificar timestamp (no más de 5 minutos de antigüedad)
  const now = Math.floor(Date.now() / 1000)
  const requestTime = parseInt(timestamp)

  if (Math.abs(now - requestTime) > 300) {
    return res.status(401).json({
      error: 'Request timestamp too old',
    })
  }

  // Calcular firma esperada
  const payload = `${timestamp}.${JSON.stringify(req.body)}`
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  // Comparación segura contra timing attacks
  const signatureBuffer = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expectedSignature, 'hex')

  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return res.status(401).json({
      error: 'Invalid signature',
    })
  }

  next()
}
