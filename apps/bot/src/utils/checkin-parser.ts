/**
 * Parsea el mensaje del usuario para extraer datos de check-in.
 * Formatos aceptados: "4, 3, bien, sí" | "4 3 bien" | "sueño 4 energía 3 ánimo bien"
 */
export interface ParsedCheckIn {
  sleep: number
  energy: number
  mood: string
  willTrain: boolean
}

export function parseCheckInMessage(message: string): ParsedCheckIn | null {
  if (!message || typeof message !== 'string') return null

  const trimmed = message.trim().toLowerCase()

  // Buscar dos números 1-5 (sueño y energía)
  const numbers = trimmed.match(/\b[1-5]\b/g)
  if (!numbers || numbers.length < 2) return null

  const sleep = Math.min(5, Math.max(1, parseInt(numbers[0], 10)))
  const energy = Math.min(5, Math.max(1, parseInt(numbers[1], 10)))

  // Ánimo: quitar los números y palabras clave, el resto es mood; si no hay nada, "bien"
  let mood = 'bien'
  const sinNumeros = trimmed.replace(/\b[1-5]\b/g, '').replace(/,/g, ' ').trim()
  const palabras = sinNumeros.split(/\s+/).filter(Boolean)
  const skip = ['sueño', 'energia', 'energía', 'ánimo', 'animo', 'entreno', 'entrenar', 'si', 'sí', 'no']
  const moodWords = palabras.filter(p => !skip.includes(p))
  if (moodWords.length > 0) {
    mood = moodWords.join(' ').slice(0, 50)
  }

  // ¿Va a entrenar? sí/si/yes -> true
  const willTrain = /\b(sí|si|yes|sip|dale)\b/i.test(trimmed) && !/\b(no|nop)\b/i.test(trimmed)

  return { sleep, energy, mood, willTrain }
}
