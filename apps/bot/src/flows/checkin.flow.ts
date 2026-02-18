import { addKeyword } from '@builderbot/bot'
import { userService, checkInService, prisma } from '@pulze/database'
import { aiService, contextService } from '../services/ai'

/**
 * FLOW DE CHECK-IN DIARIO CONVERSACIONAL
 * Interacción natural con GPT para capturar estado del usuario
 */

export const checkInFlow = addKeyword(['checkin', 'check-in', 'check in', 'hola', 'buenos días', 'buen día'])
  .addAnswer(
    null,
    { capture: false },
    async (ctx, { flowDynamic, state, endFlow }) => {
      const phone = ctx.from

      // Buscar usuario
      const user = await userService.findByPhone(phone)

      if (!user) {
        await flowDynamic('Todavía no te conozco. Escribí "empezar" para comenzar tu onboarding.')
        return endFlow()
      }

      if (!user.onboardingComplete) {
        await flowDynamic('Primero terminemos tu onboarding. ¿Dónde quedamos?')
        return endFlow()
      }

      // Verificar si ya hizo check-in hoy
      const hasCheckIn = await checkInService.hasCheckInToday(user.id)

      if (hasCheckIn) {
        await flowDynamic(`Che ${user.name}, ya hiciste tu check-in de hoy! 🎉\n\n¿Querés charlamos sobre algo más?`)
        return endFlow()
      }

      // Guardar userId en estado
      await state.update({ userId: user.id, userName: user.name, checkInStep: 'start' })

      // Generar saludo personalizado con GPT
      const greeting = await aiService.generateCoachResponse(
        `Es el check-in matutino de ${user.name}. Racha actual: ${user.currentStreak} días.\nSaludalo con energía y preguntale de forma abierta cómo se siente hoy.`,
        await contextService.getUserContext(user.id)
      )

      await flowDynamic(greeting.content)
    }
  )

  // Captura respuesta inicial abierta
  .addAnswer(
    null,
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      const userResponse = ctx.body
      const currentState = state.getMyState()

      if (!currentState.userId) {
        await flowDynamic('⚠️ Hubo un error. Empezá de nuevo por favor.')
        return
      }

      // Guardar respuesta inicial
      await state.update({ initialResponse: userResponse, checkInStep: 'follow_up' })

      // Generar preguntas de seguimiento con GPT
      const followUp = await aiService.generateCoachResponse(
        `${currentState.userName} respondió: "${userResponse}"\nHacele preguntas de seguimiento naturales para entender su sueño, energía y si va a entrenar hoy. Máximo 2 preguntas.`,
        await contextService.getUserContext(currentState.userId)
      )

      await flowDynamic(followUp.content)
    }
  )

  // Captura datos específicos
  .addAnswer(
    null,
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      const detailResponse = ctx.body
      const currentState = state.getMyState()

      // Extraer información estructurada de las respuestas
      const extractionPrompt = `
De estos mensajes del usuario:
1. "${currentState.initialResponse}"
2. "${detailResponse}"

Extraé en formato JSON:
{
  "sleep": número del 1-5 (calidad de sueño),
  "energy": número del 1-5 (nivel de energía),
  "mood": texto corto describiendo ánimo,
  "willTrain": boolean (si va a entrenar hoy)
}

Si falta algo, estimalo razonablemente según el contexto.
Respondé SOLO con el JSON, nada más.
`

      const extracted = await aiService.extractInformation(
        `${currentState.initialResponse}\n${detailResponse}`,
        extractionPrompt
      )

      let checkInData
      try {
        checkInData = JSON.parse(extracted)
      } catch {
        // Fallback si GPT no devuelve JSON válido
        checkInData = {
          sleep: 3,
          energy: 3,
          mood: detailResponse,
          willTrain: detailResponse.toLowerCase().includes('sí') || detailResponse.toLowerCase().includes('si'),
        }
      }

      await state.update({ checkInData, checkInStep: 'recommendation' })

      // Generar recomendación personalizada
      const user = await userService.findById(currentState.userId)
      if (!user) return

      const recommendation = await aiService.generateDailyRecommendation({
        name: user.name,
        goal: user.goal,
        restrictions: user.restrictions,
        sleep: checkInData.sleep,
        energy: checkInData.energy,
        mood: checkInData.mood,
        willTrain: checkInData.willTrain,
      })

      // Guardar check-in en DB
      await checkInService.create({
        user: { connect: { id: user.id } },
        sleep: checkInData.sleep,
        energy: checkInData.energy,
        mood: checkInData.mood,
        willTrain: checkInData.willTrain,
        aiResponse: recommendation,
        recommendation: recommendation,
      })

      // Registrar analytics
      await prisma.analytics.create({
        data: {
          eventType: 'checkin_completed',
          userId: user.id,
          metadata: checkInData,
        },
      })

      // Calcular nueva racha
      const streak = await checkInService.calculateStreak(user.id)
      await userService.updateStreak(user.id, streak)

      // Enviar recomendación
      await flowDynamic(recommendation)

      // Verificar si debe celebrar racha
      if (contextService.shouldCelebrateStreak(streak)) {
        const celebration = await aiService.generateCoachResponse(
          `${user.name} alcanzó ${streak} días de racha. Celebralo de forma genuina y específica.`
        )

        await flowDynamic(`\n🔥 ${celebration.content}`)
      }

      // Guardar conversación
      await contextService.saveConversation(
        user.id,
        `${currentState.initialResponse}\n${detailResponse}`,
        recommendation,
        { type: 'checkin', data: checkInData }
      )

      // Limpiar estado
      await state.clear()
    }
  )

export default checkInFlow
