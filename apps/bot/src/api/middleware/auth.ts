import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

const JWT_SECRET = process.env.JWT_SECRET || 'pulze-secret-change-in-production'

export interface AuthRequest extends Request {
  userId?: string
  userPhone?: string
}

/**
 * Middleware para proteger rutas que requieren autenticación
 */
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string
      phone: string
    }

    req.userId = payload.userId
    req.userPhone = payload.phone
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' })
  }
}

/**
 * Middleware para rutas de admin (backoffice)
 */
export function authenticateAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // TODO: Implementar lógica de admin (verificar rol, permisos, etc.)
  // Por ahora solo verifica que haya token válido
  authenticateToken(req, res, next)
}

/**
 * Generar token JWT para un usuario
 */
export function generateToken(userId: string, phone: string): string {
  return jwt.sign(
    { userId, phone },
    JWT_SECRET,
    { expiresIn: '7d' } // Token válido por 7 días
  )
}

/**
 * Generar magic link token (duración corta)
 */
export function generateMagicToken(phone: string): string {
  return jwt.sign(
    { phone, type: 'magic-link' },
    JWT_SECRET,
    { expiresIn: '15m' } // Magic link válido por 15 minutos
  )
}

/**
 * Verificar magic link token
 */
export function verifyMagicToken(token: string): { phone: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      phone: string
      type: string
    }

    if (payload.type !== 'magic-link') {
      return null
    }

    return { phone: payload.phone }
  } catch (error) {
    return null
  }
}
