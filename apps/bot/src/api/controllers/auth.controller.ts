import { Request, Response } from 'express'
import { userService } from '@pulze/database'
import { generateToken, generateMagicToken, verifyMagicToken } from '../middleware/auth'

/**
 * POST /api/auth/magic-link
 * Generar magic link para acceso a WebApp
 */
export async function createMagicLink(req: Request, res: Response) {
  try {
    const { phone } = req.body

    if (!phone) {
      return res.status(400).json({ error: 'Teléfono requerido' })
    }

    // Verificar que el usuario existe
    const user = await userService.findByPhone(phone)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    // Generar magic token
    const magicToken = generateMagicToken(phone)
    const webappUrl = process.env.WEBAPP_URL || 'http://localhost:3000'
    const magicLink = `${webappUrl}/auth?token=${magicToken}`

    return res.json({
      magicLink,
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
