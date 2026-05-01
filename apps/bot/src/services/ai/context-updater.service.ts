import { prisma, UserWithRelations, CheckIn, Conversation } from '@pulze/database'
import { patternAnalyzer } from './pattern-analyzer.service'

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

  /** Evita que links, pegotes largos o basura de reenvíos entre en aiSummary (coaching-context). */
  private shouldRecordMessageInSummary(text: string): boolean {
    const t = (text || '').trim()
    if (!t) return false
    if (t.length > 900) return false
    if (/https?:\/\//i.test(t)) return false
    if (/\butm_(source|medium|campaign|content)=/i.test(t)) return false
    if (t.split(/\r?\n/).length > 12) return false
    return true
  }

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
   * Actualizar resumen de conversación después de cada interacción.
   * Se llama desde el webhook tras guardar mensaje usuario + respuesta asistente.
   * El nuevo resumen se usa en el siguiente prompt (en lugar de todo el historial).
   */
  async updateConversationSummary(
    userId: string,
    userMessage: string,
    assistantMessage: string
  ): Promise<void> {
    try {
      let context = await prisma.userContext.findUnique({
        where: { userId },
      })

      if (!context) {
        context = await prisma.userContext.create({
          data: {
            userId,
            nutritionMemory: {},
            trainingMemory: {},
            emotionalMemory: {},
          },
        })
      }

      if (!this.shouldRecordMessageInSummary(userMessage)) {
        return
      }

      const safeUser = userMessage.slice(0, 500)
      // Sin OpenAI: el copy lo genera BuilderBot. Opcional: podés guardar último turno en texto plano.
      const snippet = `${(context.aiSummary || '').slice(-3500)}\nU: ${safeUser}`
      await prisma.userContext.update({
        where: { userId },
        data: {
          aiSummary: snippet.slice(-4000),
          lastAISummaryUpdate: new Date(),
        },
      })
    } catch (error) {
      console.error('Error updating conversation summary:', error)
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
   * Resumen no generativo (datos de DB / patrones). La redacción la hace BuilderBot.
   */
  private async generateAISummary(user: UserWithRelations): Promise<string> {
    try {
      const patterns = await patternAnalyzer.analyzeUserPatterns(user)
      const insights = patternAnalyzer.generateInsights(patterns)
      return [
        `${user.name} | objetivo: ${user.goal} | racha: ${user.currentStreak}/${user.longestStreak}d`,
        `sueño ~${patterns.averageSleep}/5 energía ~${patterns.averageEnergy}/5`,
        insights || '',
      ]
        .filter(Boolean)
        .join('\n')
    } catch (error) {
      console.error('Error generating summary snapshot:', error)
      return `${user.name} - Objetivo: ${user.goal} - Racha: ${user.currentStreak} días`
    }
  }
}

export const contextUpdater = new ContextUpdater()
