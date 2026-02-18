import { Request, Response } from 'express'
import { userService, prisma } from '@pulze/database'
import { aiService, contextService } from '../../services/ai'

/**
 * Tipos de eventos de BuilderBot
 */
interface BuilderBotMessage {
  event: 'message' | 'status' | 'media'
  from: string
  message?: string
  type?: 'text' | 'image' | 'audio' | 'video' | 'document'
  
  // Procesamiento de IA de BuilderBot
  intent?: string
  entities?: Record<string, any>
  sentiment?: 'positive' | 'negative' | 'neutral'
  
  // Para imágenes
  media?: {
    url: string
    mime_type: string
    caption?: string
  }
  analysis?: {
    detected_objects?: string[]
    detected_text?: string
    confidence?: number
    category?: string
  }
  
  // Para estados de mensaje
  message_id?: string
  status?: 'sent' | 'delivered' | 'read' | 'failed'
  
  timestamp: string
}

/**
 * POST /api/webhooks/builderbot
 * Recibe mensajes de WhatsApp procesados por BuilderBot
 */
export async function handleBuilderBotWebhook(req: Request, res: Response) {
  try {
    const event: BuilderBotMessage = req.body

    console.log('📩 Webhook recibido:', {
      event: event.event,
      from: event.from,
      type: event.type,
      intent: event.intent,
    })

    // Manejar según tipo de evento
    switch (event.event) {
      case 'message':
        await handleIncomingMessage(event, res)
        break

      case 'status':
        await handleMessageStatus(event, res)
        break

      case 'media':
        await handleMediaMessage(event, res)
        break

      default:
        res.status(200).json({ received: true })
    }
  } catch (error: any) {
    console.error('❌ Error en webhook:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    })
  }
}

/**
 * Manejar mensaje entrante
 */
async function handleIncomingMessage(event: BuilderBotMessage, res: Response) {
  const { from, message, intent, entities, type } = event

  // 1. Buscar o crear usuario
  let user = await userService.findByPhone(from)

  // Si es usuario nuevo, iniciar onboarding
  if (!user) {
    const response = await handleNewUser(from, message || '')
    return res.json({ message: response })
  }

  // Si no completó onboarding, continuar onboarding
  if (!user.onboardingComplete) {
    const response = await handleOnboarding(user.id, message || '', intent)
    return res.json({ message: response })
  }

  // 2. Guardar mensaje en conversación
  await prisma.conversation.create({
    data: {
      userId: user.id,
      role: 'user',
      message: message || '',
      metadata: { intent, entities, type },
    },
  })

  // 3. Actualizar stats
  await prisma.userStats.update({
    where: { userId: user.id },
    data: {
      messagesReceived: { increment: 1 },
      lastActiveDate: new Date(),
    },
  })

  // 4. Decidir tipo de respuesta según intent
  let response: string

  if (intent === 'checkin' || message?.toLowerCase().includes('check')) {
    // Check-in diario
    response = await handleCheckIn(user.id, message || '', entities)
  } else if (intent === 'consulta_nutricion') {
    // Consulta sobre nutrición
    response = await handleNutritionQuery(user, message || '', entities)
  } else if (intent === 'consulta_entreno') {
    // Consulta sobre entrenamiento
    response = await handleTrainingQuery(user, message || '', entities)
  } else {
    // Conversación general
    response = await handleGeneralConversation(user, message || '', intent)
  }

  // 5. Guardar respuesta en conversación
  await prisma.conversation.create({
    data: {
      userId: user.id,
      role: 'assistant',
      message: response,
      metadata: { intent },
    },
  })

  // 6. Actualizar stats
  await prisma.userStats.update({
    where: { userId: user.id },
    data: {
      messagesSent: { increment: 1 },
    },
  })

  // 7. Registrar analytics
  await prisma.analytics.create({
    data: {
      eventType: `message_${intent || 'general'}`,
      userId: user.id,
      metadata: { intent, entities },
    },
  })

  res.json({ message: response })
}

/**
 * Manejar nuevo usuario
 */
async function handleNewUser(phone: string, message: string): Promise<string> {
  // Crear usuario pendiente
  await userService.create({
    phone,
    name: 'pendiente',
    goal: 'pendiente',
    onboardingComplete: false,
  })

  // Mensaje de bienvenida
  return `👋 ¡Hola! Soy PULZE, tu coach personal de bienestar.\n\nAntes de empezar, quiero conocerte un poco.\n\n¿Cómo te llamo?`
}

/**
 * Manejar onboarding en progreso
 */
async function handleOnboarding(
  userId: string,
  message: string,
  intent?: string
): Promise<string> {
  // TODO: Implementar lógica de onboarding paso por paso
  // Por ahora, respuesta placeholder
  return `Gracias por tu respuesta. Continuemos con tu perfil...`
}

/**
 * Manejar check-in diario
 */
async function handleCheckIn(
  userId: string,
  message: string,
  entities?: Record<string, any>
): Promise<string> {
  // TODO: Implementar lógica de check-in
  // Por ahora, respuesta placeholder
  return `¡Perfecto! Registrando tu check-in...`
}

/**
 * Manejar consulta de nutrición
 */
async function handleNutritionQuery(
  user: any,
  message: string,
  entities?: Record<string, any>
): Promise<string> {
  // Construir contexto completo
  const context = await contextService.getUserContext(user.id)
  const history = await contextService.getConversationHistory(user.id, 5)

  // Generar respuesta con GPT
  const response = await aiService.generateCoachResponse(
    message,
    context,
    history
  )

  // Guardar en NutritionLog si es consulta sobre comida
  if (entities?.food) {
    await prisma.nutritionLog.create({
      data: {
        userId: user.id,
        mealType: 'consulta',
        description: message,
        userQuery: message,
        aiResponse: response.content,
      },
    })
  }

  return response.content
}

/**
 * Manejar consulta de entrenamiento
 */
async function handleTrainingQuery(
  user: any,
  message: string,
  entities?: Record<string, any>
): Promise<string> {
  // Construir contexto completo
  const context = await contextService.getUserContext(user.id)
  const history = await contextService.getConversationHistory(user.id, 5)

  // Generar respuesta con GPT
  const response = await aiService.generateCoachResponse(
    message,
    context,
    history
  )

  return response.content
}

/**
 * Manejar conversación general
 */
async function handleGeneralConversation(
  user: any,
  message: string,
  intent?: string
): Promise<string> {
  // Para conversación general, usar contexto ligero
  const context = await contextService.getUserContext(user.id)

  const response = await aiService.generateCoachResponse(
    message,
    context
  )

  return response.content
}

/**
 * Manejar cambio de estado de mensaje
 */
async function handleMessageStatus(event: BuilderBotMessage, res: Response) {
  const { message_id, status } = event

  if (!message_id || !status) {
    return res.status(200).json({ received: true })
  }

  // Actualizar estado del mensaje en ProactiveMessage si existe
  await prisma.proactiveMessage.updateMany({
    where: {
      // Necesitaríamos guardar el message_id al enviar
      content: { contains: message_id },
    },
    data: {
      status,
      ...(status === 'delivered' && { sentAt: new Date() }),
      ...(status === 'read' && { readAt: new Date() }),
    },
  })

  res.status(200).json({ received: true })
}

/**
 * Manejar mensaje con media
 */
async function handleMediaMessage(event: BuilderBotMessage, res: Response) {
  const { from, media, analysis } = event

  if (!media) {
    return res.status(200).json({ received: true })
  }

  const user = await userService.findByPhone(from)
  if (!user) {
    return res.status(200).json({ received: true })
  }

  // Si es imagen de comida, guardar en NutritionLog
  if (analysis?.category === 'food') {
    await prisma.nutritionLog.create({
      data: {
        userId: user.id,
        mealType: 'foto',
        description: analysis.detected_objects?.join(', ') || 'Comida',
        photoUrl: media.url,
      },
    })

    const response = `Vi tu foto 📸\n\n${
      analysis.detected_objects?.length
        ? `Detecté: ${analysis.detected_objects.join(', ')}\n\n`
        : ''
    }¿Cómo estuvo? ¿Te sentiste satisfecho/a?`

    return res.json({ message: response })
  }

  // Para otros tipos de imágenes
  res.json({
    message: 'Recibí tu imagen 👍',
  })
}
