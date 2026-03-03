import { Request, Response, NextFunction } from 'express'

/**
 * Middleware para endpoints llamados por n8n (u otros servicios).
 * Requiere header X-API-Key o Authorization: Bearer <key> igual a N8N_API_KEY o API_KEY.
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = process.env.N8N_API_KEY || process.env.API_KEY
  if (!apiKey) {
    return res.status(503).json({
      error: 'API key no configurada (N8N_API_KEY o API_KEY)',
    })
  }

  const provided =
    req.headers['x-api-key'] ||
    (req.headers['authorization'] && req.headers['authorization'].startsWith('Bearer ')
      ? req.headers['authorization'].slice(7)
      : null)

  if (!provided || provided !== apiKey) {
    return res.status(401).json({ error: 'API key inválida o faltante' })
  }

  next()
}
