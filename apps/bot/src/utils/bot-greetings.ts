export const SEGUIMIENTO_GREETING =
  'Hola! Soy PULZE, tu coach de bienestar 🌟 ¿Cómo venís hoy?'

export const REGISTRO_GREETING =
  '¡Hola! Soy PULZE 🌟 Vamos a completar tu registro. ¿Cómo te llamás?'

export function isSimpleGreeting(text: string): boolean {
  const t = text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[!?.¿¡]+$/g, '')
  return /^(hola|buenas?|buen[oa]s?(?:\s+(?:dias?|tardes?|noches?))?|hey|que\s*tal|hi|hello)$/.test(
    t
  )
}
