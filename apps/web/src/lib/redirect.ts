const DEFAULT_REDIRECT = '/dashboard'

/** Rutas internas permitidas tras magic link (evita open redirect). */
export function sanitizeRedirect(redirect: string | null): string {
  if (!redirect) return DEFAULT_REDIRECT
  const t = redirect.trim()
  if (!t.startsWith('/') || t.startsWith('//') || t.includes('://')) return DEFAULT_REDIRECT
  return t
}
