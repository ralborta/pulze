import { generateMagicToken } from '../../api/middleware/auth'

const DEFAULT_REDIRECT = '/dashboard'

/** Rutas internas permitidas en ?redirect= (evita open redirect). */
export function sanitizeWebappRedirect(redirect?: string): string {
  if (!redirect || typeof redirect !== 'string') return DEFAULT_REDIRECT
  const t = redirect.trim()
  if (!t.startsWith('/') || t.startsWith('//') || t.includes('://')) return DEFAULT_REDIRECT
  return t
}

export function buildMagicLink(phone: string, redirect?: string): string {
  const webappUrl = (process.env.WEBAPP_URL || 'http://localhost:3000').replace(/\/$/, '')
  const magicToken = generateMagicToken(phone)
  const safeRedirect = sanitizeWebappRedirect(redirect)
  const params = new URLSearchParams({ token: magicToken })
  if (safeRedirect !== DEFAULT_REDIRECT) {
    params.set('redirect', safeRedirect)
  }
  return `${webappUrl}/auth?${params.toString()}`
}

export function buildWebappWelcomeMessage(magicLink: string, name?: string): string {
  const n = (name || '').trim().split(/\s+/)[0] || 'ahí'
  return `¡Listo ${n}! 🎉 Tu registro en PULZE quedó completo.

En WhatsApp seguimos con check-ins y tu coach. Para ver tu progreso en gráficos:

👉 ${magicLink}

(El link vale 15 minutos)`
}
