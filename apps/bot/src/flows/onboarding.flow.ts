import { addKeyword, EVENTS } from '@builderbot/bot'
import { userService, prisma } from '@pulze/database'
import { aiService, contextService, ONBOARDING_PROMPTS } from '../services/ai'
import { generateMagicToken } from '../api/middleware/auth'

/**
 * FLOW DE ONBOARDING INTELIGENTE
 * Implementa el diseño de 9 pasos con 40% GPT / 60% Flows
 */

export const onboardingFlow = addKeyword(EVENTS.WELCOME)
  // 1️⃣ Bienvenida y captura de nombre
  .addAnswer(
    '👋 Hola, soy PULZE, tu coach personal de bienestar.\n\nAntes de empezar, quiero conocerte un poco.\n\n¿Cómo te llamo?',
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      const name = ctx.body.trim()
      
      // Guardar nombre temporalmente en el estado
      await state.update({ 
        phone: ctx.from,
        name,
        onboardingStep: 1 
      })

      // Verificar si el usuario ya existe
      let user = await userService.findByPhone(ctx.from)
      
      if (user && user.onboardingComplete) {
        // Usuario existente que ya completó onboarding
        await flowDynamic(`Che ${name}! Ya nos conocemos 😊\n\n¿Querés hacer tu check-in de hoy?`)
        return
      }

      // Generar mensaje de bienvenida con GPT
      const welcomeMessage = await aiService.generateCoachResponse(
        ONBOARDING_PROMPTS.welcome(name)
      )

      await flowDynamic(welcomeMessage.content)
    }
  )

  // 2️⃣ Captura de objetivo
  .addAnswer(
    '¿Qué te gustaría lograr en este momento?\n\n1️⃣ Bajar peso\n2️⃣ Ganar músculo\n3️⃣ Mejorar energía\n4️⃣ Crear hábitos saludables\n5️⃣ Sentirme mejor conmigo\n\nPodés elegir un número o contarme con tus palabras.',
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      const goalInput = ctx.body.trim()
      const currentState = state.getMyState()

      // Mapeo de opciones
      const goalMap: { [key: string]: string } = {
        '1': 'Bajar peso',
        '2': 'Ganar músculo',
        '3': 'Mejorar energía',
        '4': 'Crear hábitos saludables',
        '5': 'Sentirme mejor conmigo',
      }

      const goal = goalMap[goalInput] || goalInput

      await state.update({ goal, onboardingStep: 2 })

      // Generar confirmación con GPT
      const confirmMessage = await aiService.generateCoachResponse(
        ONBOARDING_PROMPTS.confirmGoal(currentState.name, goal)
      )

      await flowDynamic(confirmMessage.content)
    }
  )

  // 3️⃣ Restricciones físicas
  .addAnswer(
    null,
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      const restrictions = ctx.body.toLowerCase() === 'ninguna' || ctx.body.toLowerCase() === 'ninguno' 
        ? null 
        : ctx.body.trim()

      await state.update({ restrictions, onboardingStep: 3 })

      // Pregunta sobre alimentación
      await flowDynamic(
        `${restrictions ? '🙏 Gracias por decírmelo. Voy a adaptar todo para cuidarte.' : '👍 Perfecto!'}\n\nAhora sobre tu alimentación, 2 datos rápidos:\n\n1️⃣ ¿Seguís algún tipo de alimentación?\n(Tradicional / Vegetariana / Vegana / Keto / Otra)\n\n2️⃣ ¿Tenés alergias o alimentos que no consumís?`
      )
    }
  )

  // 4️⃣ Perfil nutricional
  .addAnswer(
    null,
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      const nutritionProfile = ctx.body.trim()

      await state.update({ nutritionProfile, onboardingStep: 4 })

      // Nivel de acompañamiento
      await flowDynamic(
        'Ahora algo importante 👇\n\n¿Querés que te acompañe también con tu nutrición diaria?\n\n1️⃣ Sí, quiero guía completa (entreno + alimentación)\n2️⃣ Solo entrenamiento\n3️⃣ Solo consejos simples'
      )
    }
  )

  // 5️⃣ Nivel de acompañamiento
  .addAnswer(
    null,
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      const companionshipInput = ctx.body.trim()

      const companionshipMap: { [key: string]: string } = {
        '1': 'completo',
        '2': 'solo_entreno',
        '3': 'consejos_simples',
      }

      const companionshipLevel = companionshipMap[companionshipInput] || 'completo'

      await state.update({ companionshipLevel, onboardingStep: 5 })

      // Estado emocional
      await flowDynamic(
        'Perfecto 💪\n\nAhora algo más profundo...\n\nDel 1 al 10, ¿cómo te sentís hoy con tu cuerpo?\n\n(Esto me ayuda a personalizar tu acompañamiento)'
      )
    }
  )

  // 6️⃣ Estado emocional
  .addAnswer(
    null,
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      const emotionalState = parseInt(ctx.body.trim()) || 5

      await state.update({ emotionalState, onboardingStep: 6 })

      // Horario de check-in
      await flowDynamic(
        '¿Cuándo preferís que te escriba para tu check-in diario?\n\n1️⃣ Mañana (8-10 AM)\n2️⃣ Mediodía (12-2 PM)\n3️⃣ Tarde (6-8 PM)\n4️⃣ Noche (9-11 PM)'
      )
    }
  )

  // 7️⃣ Horario de check-in
  .addAnswer(
    null,
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      const timeInput = ctx.body.trim()

      const timeMap: { [key: string]: string } = {
        '1': '08:00',
        '2': '12:00',
        '3': '18:00',
        '4': '21:00',
      }

      const reminderTime = timeMap[timeInput] || '08:00'

      await state.update({ reminderTime, onboardingStep: 7 })

      const currentState = state.getMyState()

      // Generar micro-acción con GPT
      const microAction = await aiService.generateMicroAction({
        name: currentState.name,
        goal: currentState.goal,
        restrictions: currentState.restrictions,
        emotionalState: currentState.emotionalState,
      })

      await flowDynamic(`¡Listo ${currentState.name}! 🎉\n\nMañana empezamos formalmente.\n\nPero hoy quiero que hagas esto:\n\n${microAction}\n\n💡 El cambio empieza hoy, no mañana.`)
    }
  )

  // 8️⃣ Guardar usuario en DB y finalizar
  .addAnswer(
    'Te escribiré mañana para tu primer check-in.\n\nMientras tanto podés:\n📱 Ver tu progreso en la app\n📚 Explorar contenidos\n⚙️ Ajustar preferencias\n\n¿Te mando el link de acceso?',
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      const currentState = state.getMyState()

      try {
        // Crear usuario en base de datos
        const user = await userService.create({
          phone: currentState.phone,
          name: currentState.name,
          goal: currentState.goal,
          restrictions: currentState.restrictions,
          activityLevel: currentState.nutritionProfile,
          onboardingComplete: true,
        })

        // Crear preferencias
        await prisma.userPreferences.upsert({
          where: { userId: user.id },
          update: {
            reminderTime: currentState.reminderTime,
          },
          create: {
            userId: user.id,
            reminderTime: currentState.reminderTime,
          },
        })

        // Crear UserStats
        await prisma.userStats.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id },
        })

        // Guardar conversación inicial
        await contextService.saveConversation(
          user.id,
          'Onboarding completado',
          `Usuario: ${user.name}, Objetivo: ${user.goal}`,
          { type: 'onboarding', step: 'completed' }
        )

        // Registrar analytics
        await prisma.analytics.create({
          data: {
            eventType: 'onboarding_completed',
            userId: user.id,
            metadata: {
              goal: user.goal,
              companionshipLevel: currentState.companionshipLevel,
              emotionalState: currentState.emotionalState,
            },
          },
        })

        // Generar magic link
        const magicToken = generateMagicToken(user.phone)
        const webappUrl = process.env.WEBAPP_URL || 'http://localhost:3000'
        const magicLink = `${webappUrl}/auth?token=${magicToken}`

        // Enviar link
        await flowDynamic(
          `Acá está tu link de acceso:\n\n${magicLink}\n\n✨ Es personal y caduca en 7 días.\n\n¡Nos vemos mañana ${currentState.name}! 💪`
        )

        // Limpiar estado
        await state.clear()
      } catch (error: any) {
        console.error('Error saving onboarding data:', error)
        await flowDynamic(
          '⚠️ Hubo un error guardando tus datos. Por favor contactá a soporte.'
        )
      }
    }
  )

export default onboardingFlow
