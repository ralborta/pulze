import { Request, Response } from 'express'
import { userService } from '@pulze/database'
import { generateToken, verifyMagicToken } from '../middleware/auth'
import { buildMagicLink } from '../../services/auth/magic-link'

/**
 * POST /api/auth/magic-link
 * Generar magic link para acceso a WebApp (requiere X-API-Key).
 * Body: { phone, redirect?: "/dashboard" | "/check-ins" | ... }
 */
export async function createMagicLink(req: Request, res: Response) {
  try {
    const { phone, redirect } = req.body as { phone?: string; redirect?: string }

    if (!phone) {
      return res.status(400).json({ error: 'Teléfono requerido' })
    }

    const user = await userService.findByPhone(phone)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const magicLink = buildMagicLink(user.phone, redirect)

    return res.json({
      magicLink,
      redirect: redirect || '/dashboard',
      expiresIn: '15 minutos',
    })
  } catch (error: any) {
    console.error('Error creating magic link:', error)
    return res.status(500).json({ error: 'Error al generar magic link' })
  }
}

/**
 * POST /api/auth/verify
 * Verificar magic token y generar JWT de sesión
 */
export async function verifyToken(req: Request, res: Response) {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Token requerido' })
    }

    // Verificar magic token
    const payload = verifyMagicToken(token)
    if (!payload) {
      return res.status(403).json({ error: 'Token inválido o expirado' })
    }

    // Buscar usuario
    const user = await userService.findByPhone(payload.phone)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    // Generar JWT de sesión
    const sessionToken = generateToken(user.id, user.phone)

    return res.json({
      token: sessionToken,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        goal: user.goal,
      },
    })
  } catch (error: any) {
    console.error('Error verifying token:', error)
    return res.status(500).json({ error: 'Error al verificar token' })
  }
}

/**
 * POST /api/auth/login
 * Login directo con teléfono (para testing)
 */
export async function login(req: Request, res: Response) {
  try {
    const { phone } = req.body

    if (!phone) {
      return res.status(400).json({ error: 'Teléfono requerido' })
    }

    const user = await userService.findByPhone(phone)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const token = generateToken(user.id, user.phone)

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        goal: user.goal,
        currentStreak: user.currentStreak,
        isPremium: user.isPremium,
      },
    })
  } catch (error: any) {
    console.error('Error logging in:', error)
    return res.status(500).json({ error: 'Error al iniciar sesión' })
  }
}
