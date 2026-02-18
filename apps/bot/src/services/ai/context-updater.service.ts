import { prisma, UserWithRelations } from '@pulze/database'
import { CheckIn, Conversation } from '@prisma/client'
import { patternAnalyzer } from './pattern-analyzer.service'
import { aiService } from './ai.service'

/**
 * ContextUpdater - Actualiza contexto del usuario post-interacción
 * 
 * Mantiene UserContext actualizado con:
 * - Resumen de patrones de comportamiento
 * - Insights clave sobre progreso
 * - Preferencias detectadas
 * - Histórico de objetivos y logros
 * 
 * Se regenera cada N interacciones (umbral configurable)
 */
export class ContextUpdater {
  private readonly UPDATE_THRESHOLD = 50 // Regenerar resumen cada 50 mensajes

  /**
   * Actualizar contexto después de un check-in
   */
  async updateAfterCheckIn(
    user: UserWithRelations,
    checkIn: CheckIn
  ): Promise<void> {
    try {
      // Obtener o crear UserContext
      let context = await prisma.userContext.findUnique({
        where: { userId: user.id },
      })

      if (!context) {
        context = await prisma.userContext.create({
          data: {
            userId: user.id,
            nutritionMemory: {},
            trainingMemory: {},
            emotionalMemory: {},
          },
        })
      }

      // Actualizar memoria emocional con datos del check-in
      const emotionalMemory = context.emotionalMemory as Record<string, any>
      const moodHistory = (emotionalMemory.moodHistory || []) as Array<{mood: string, date: string}>
      moodHistory.push({ mood: checkIn.mood, date: checkIn.timestamp.toISOString() })
      
      // Mantener solo últimos 30
      if (moodHistory.length > 30) moodHistory.shift()

      // Contar interacciones desde emotionalMemory
      const interactionCount = moodHistory.length

      // Regenerar resumen si alcanzó el umbral
      let aiSummary = context.aiSummary
      if (interactionCount % this.UPDATE_THRESHOLD === 0) {
        aiSummary = await this.generateAISummary(user)
      }

      // Guardar contexto actualizado
      await prisma.userContext.update({
        where: { userId: user.id },
        data: {
          emotionalMemory: { ...emotionalMemory, moodHistory },
          aiSummary,
          lastAISummaryUpdate: aiSummary !== context.aiSummary ? new Date() : undefined,
        },
      })
    } catch (error) {
      console.error('Error updating context after check-in:', error)
    }
  }

  /**
   * Actualizar contexto después de una conversación
   */
  async updateAfterConversation(
    user: UserWithRelations,
    userMessage: string,
    assistantResponse: string
  ): Promise<void> {
    try {
      // Obtener o crear UserContext
      let context = await prisma.userContext.findUnique({
        where: { userId: user.id },
      })

      if (!context) {
        context = await prisma.userContext.create({
          data: {
            userId: user.id,
            nutritionMemory: {},
            trainingMemory: {},
            emotionalMemory: {},
          },
        })
      }

      // Detectar temas de conversación
      const topics = this.detectConversationTopics(userMessage)

      // Actualizar memoria según los temas
      let nutritionMemory = context.nutritionMemory as Record<string, any>
      let trainingMemory = context.trainingMemory as Record<string, any>

      if (topics.includes('nutrition')) {
        nutritionMemory = this.updateMemory(userMessage, nutritionMemory)
      }

      if (topics.includes('training')) {
        trainingMemory = this.updateMemory(userMessage, trainingMemory)
      }

      // Contar interacciones totales
      const nutritionCount = (nutritionMemory.recentQueries || []).length
      const trainingCount = (trainingMemory.recentQueries || []).length
      const interactionCount = nutritionCount + trainingCount

      // Regenerar resumen si es necesario
      let aiSummary = context.aiSummary
      if (interactionCount > 0 && interactionCount % this.UPDATE_THRESHOLD === 0) {
        aiSummary = await this.generateAISummary(user)
      }

      // Guardar
      await prisma.userContext.update({
        where: { userId: user.id },
        data: {
          nutritionMemory,
          trainingMemory,
          aiSummary,
          lastAISummaryUpdate: aiSummary !== context.aiSummary ? new Date() : undefined,
        },
      })
    } catch (error) {
      console.error('Error updating context after conversation:', error)
    }
  }

  /**
   * Forzar regeneración del resumen AI
   */
  async forceRefreshAISummary(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
        stats: true,
        checkIns: {
          orderBy: { timestamp: 'desc' },
          take: 30,
        },
      },
    })

    if (!user) throw new Error('User not found')

    const summary = await this.generateAISummary(user as UserWithRelations)

    await prisma.userContext.upsert({
      where: { userId },
      create: {
        userId,
        nutritionMemory: {},
        trainingMemory: {},
        emotionalMemory: {},
        aiSummary: summary,
        lastAISummaryUpdate: new Date(),
      },
      update: {
        aiSummary: summary,
        lastAISummaryUpdate: new Date(),
      },
    })

    return summary
  }

  // ==========================
  // Private Helper Methods
  // ==========================

  /**
   * Detectar temas de conversación
   */
  private detectConversationTopics(message: string): string[] {
    const topics: string[] = []
    const lowerMessage = message.toLowerCase()

    const nutritionKeywords = ['comida', 'comer', 'dieta', 'nutrición', 'calorías', 'proteína']
    if (nutritionKeywords.some(kw => lowerMessage.includes(kw))) {
      topics.push('nutrition')
    }

    const trainingKeywords = ['entreno', 'ejercicio', 'gym', 'músculo', 'fuerza']
    if (trainingKeywords.some(kw => lowerMessage.includes(kw))) {
      topics.push('training')
    }

    return topics
  }

  /**
   * Actualizar memoria (genérico para nutrition o training)
   */
  private updateMemory(
    message: string,
    currentMemory: Record<string, any>
  ): Record<string, any> {
    const queries = (currentMemory.recentQueries || []) as Array<{message: string, timestamp: string}>
    queries.push({ message, timestamp: new Date().toISOString() })

    if (queries.length > 20) queries.shift()

    return {
      ...currentMemory,
      recentQueries: queries,
      lastQuery: new Date().toISOString(),
    }
  }

  /**
   * Generar resumen AI del usuario
   */
  private async generateAISummary(user: UserWithRelations): Promise<string> {
    try {
      const patterns = await patternAnalyzer.analyzeUserPatterns(user)
      const insights = patternAnalyzer.generateInsights(patterns)

      const summaryPrompt = `Resumen ejecutivo del usuario para coaching:

Usuario: ${user.name}
Objetivo: ${user.goal}
Racha: ${user.currentStreak}/${user.longestStreak} días

Patrones:
- Horario preferido: ${patterns.bestCheckInTime || 'no determinado'}
- Promedio sueño: ${patterns.averageSleep}/5
- Promedio energía: ${patterns.averageEnergy}/5
- Frecuencia entrenamiento: ${patterns.trainingFrequency}%
- Tendencia: ${patterns.streakTrend}
- Riesgo abandono: ${patterns.riskOfChurn}

${insights}

Resume en 150 palabras: perfil, fortalezas, áreas de mejora, recomendaciones para futuras interacciones.`

      const result = await aiService.generateCoachResponse(
        summaryPrompt,
        undefined,
        []
      )

      return result.content
    } catch (error) {
      console.error('Error generating AI summary:', error)
      return `${user.name} - Objetivo: ${user.goal} - Racha: ${user.currentStreak} días`
    }
  }
}

export const contextUpdater = new ContextUpdater()
