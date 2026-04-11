import { Request, Response, NextFunction } from 'express'

function firstHeader(req: Request, names: string[]): string | undefined {
  for (const name of names) {
    const key = name.toLowerCase()
    const v = req.headers[key]
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (Array.isArray(v) && v[0]) return String(v[0]).trim()
  }
  return undefined
}

/**
 * Middleware para endpoints llamados por n8n (u otros servicios).
 * Acepta la misma clave que N8N_API_KEY / API_KEY en el servidor vía:
 * - X-API-Key (recomendado; solo guiones, suele pasar bien por nginx)
 * - Pulze-Api-Key (alternativa si el builder/proxy filtra "x-api-key")
 * - X-N8N-API-Key, n8n_api_key
 * - Authorization: Bearer <key>
 * - GET: query ?api_key= o ?apiKey= (útil si el panel no envía headers custom; puede quedar en logs del proxy)
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = (process.env.N8N_API_KEY || process.env.API_KEY || '').trim()
  if (!apiKey) {
    return res.status(503).json({
      error: 'API key no configurada (N8N_API_KEY o API_KEY)',
    })
  }

  let provided = firstHeader(req, [
    'x-api-key',
    'pulze-api-key',
    'x-n8n-api-key',
    'n8n_api_key',
  ])

  if (!provided && req.headers['authorization']?.startsWith('Bearer ')) {
    provided = req.headers['authorization'].slice(7).trim()
  }

  if (!provided && req.method === 'GET') {
    const q = req.query.api_key ?? req.query.apiKey
    if (typeof q === 'string' && q.trim()) provided = q.trim()
  }

  if (!provided || provided !== apiKey) {
    return res.status(401).json({ error: 'API key inválida o faltante' })
  }

  next()
}
