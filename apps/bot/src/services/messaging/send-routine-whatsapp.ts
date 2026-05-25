import { adaptRoutineForUser, type AdaptRoutineInput } from '../ai/routine-adapter.service'
import { builderBotClient } from '../builderbot'

export type SendRoutineWhatsAppResult = {
  ok: boolean
  content?: string
  planId?: string
  planTitle?: string
  imagesSent: number
  error?: string
}

/**
 * Envía rutina adaptada por WhatsApp (texto + imágenes del plan estándar).
 * Usado en check-in, recordatorio diario (BuilderBot HTTP) y n8n.
 */
export async function sendRoutineToWhatsApp(options: {
  phone: string
  userId: string
  sendImages?: boolean
  checkInData?: AdaptRoutineInput['checkInData']
  /** Si viene string (incluso vacío), reemplaza el intro por defecto. */
  introPrefix?: string
  /** Solo imágenes, sin mensaje de texto previo (p. ej. check-in donde el copy va por BuilderBot). */
  skipText?: boolean
}): Promise<SendRoutineWhatsAppResult> {
  const result = await adaptRoutineForUser({
    userId: options.userId,
    checkInData: options.checkInData,
  })

  if (!result) {
    return { ok: false, imagesSent: 0, error: 'no_plan' }
  }

  if (!builderBotClient.canSend()) {
    return { ok: false, imagesSent: 0, error: 'builderbot_not_configured' }
  }

  const to = options.phone.includes('+') ? options.phone : `+${options.phone}`

  if (!options.skipText) {
    const intro =
      options.introPrefix === undefined ? 'Te dejo tu rutina de hoy 💪\n\n' : options.introPrefix
    const text = intro ? `${intro}${result.content}`.trim() : result.content.trim()
    if (text) {
      const textResult = await builderBotClient.sendMessage({ phone: to, message: text })
      if (!textResult.success) {
        return { ok: false, imagesSent: 0, error: textResult.error ?? 'text_send_failed' }
      }
    }
  }

  let imagesSent = 0
  const shouldSendImages =
    options.sendImages !== false &&
    (options.sendImages === true || process.env.PULZE_ROUTINE_SEND_IMAGES === 'true')

  if (shouldSendImages && result.mediaAssets?.length) {
    for (const item of result.mediaAssets) {
      const caption =
        [item.caption, item.exerciseKey].filter(Boolean).join(' · ') || '\u200B'
      const img = await builderBotClient.sendMessageWithImage({
        phone: to,
        message: caption,
        imageUrl: item.url,
        caption: item.caption,
      })
      if (img.success) imagesSent++
    }
  }

  return {
    ok: true,
    content: result.content,
    planId: result.planId,
    planTitle: result.planTitle,
    imagesSent,
  }
}
