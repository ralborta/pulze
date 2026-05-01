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

function acceptedApiSecrets(): string[] {
  const raw = [
    process.env.API_KEY,
    process.env.N8N_API_KEY,
    process.env.X_API_KEY,
    /** Easypanel / .env a veces usa este nombre para el secreto inbound (no confundir con el header HTTP) */
    process.env['X-API-Key'],
  ]
  const trimmed = raw.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean)
  return [...new Set(trimmed)]
}

/**
 * Middleware para endpoints llamados por n8n, BuilderBot u otros servicios.
 * Valida el header (o Bearer / query en GET) contra cualquier valor configurado en entorno:
 * API_KEY, N8N_API_KEY, X_API_KEY o X-API-Key (mismos nombres que suelen usarse en el panel).
 * Headers aceptados:
 * - X-API-Key (recomendado; solo guiones, suele pasar bien por nginx)
 * - Pulze-Api-Key (alternativa si el builder/proxy filtra "x-api-key")
 * - X-N8N-API-Key, n8n_api_key
 * - Authorization: Bearer <key>
 * - GET: query ?api_key= o ?apiKey= (útil si el panel no envía headers custom; puede quedar en logs del proxy)
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const accepted = acceptedApiSecrets()
  if (!accepted.length) {
    return res.status(503).json({
      error: 'API key no configurada (API_KEY, N8N_API_KEY, X_API_KEY o X-API-Key)',
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

  if (!provided || !accepted.includes(provided)) {
    return res.status(401).json({ error: 'API key inválida o faltante' })
  }

  next()
}
