/**
 * Normalización compartida: webhook, GET /users/:phone/context, etc.
 * Debe coincidir con lo que BuilderBot / WhatsApp envían en `from` y en el path HTTP.
 */

export function isPlaceholder(value: string): boolean {
  return /^@\w+$|^\{\{\s*\w+\s*\}\}$|^\{\s*\w+\s*\}$/.test(value.trim())
}

/**
 * Identificador entrante (JID `549...@s.whatsapp.net`, LID, o solo dígitos).
 * Toma el segmento antes de @; deja solo dígitos; 8–20 caracteres.
 */
export function sanitizePhone(value: string): string {
  if (!value) return ''
  const raw = String(value).trim()
  if (!raw || isPlaceholder(raw)) return ''
  const localPart = raw.split('@')[0] ?? raw
  const digits = localPart.replace(/\D+/g, '')
  if (digits.length < 8) return ''
  if (digits.length > 20) {
    console.warn('⚠️ Teléfono demasiado largo tras normalizar, se trunca a 20 dígitos:', digits.slice(0, 6) + '…')
    return digits.slice(0, 20)
  }
  return digits
}

/** Decodifica segmento de URL y quita espacios / + inicial (sin tocar JID aún). */
export function decodePhonePathSegment(param: string): string {
  if (!param || typeof param !== 'string') return ''
  try {
    return decodeURIComponent(param).replace(/\s+/g, '').replace(/^\+/, '').trim()
  } catch {
    return param.replace(/\s+/g, '').replace(/^\+/, '').trim()
  }
}
