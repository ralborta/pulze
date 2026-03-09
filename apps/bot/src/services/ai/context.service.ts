import { conversationService, userService, prisma } from '@pulze/database'
import { ChatMessage } from './ai.service'

/** Nombre seguro para prompts: nunca usar @body, @from ni "pendiente" en la respuesta al usuario. */
function displayName(name: string | null | undefined): string {
  if (!name || name === 'pendiente' || /^@\w+$|^\{\{\s*\w+\s*\}\}$/.test(name)) return 'Usuario'
  return name
}

/**
 * Servicio para manejar contexto y memoria del usuario
 */
export class ContextService {
  /**
   * Obtener contexto completo del usuario para alimentar a GPT
   */
  async getUserContext(userId: string): Promise<string> {
    const user = await userService.findById(userId)
    if (!user) return ''

    const contextParts: string[] = []

    // Información básica (nunca exponer @body/@from al modelo)
    contextParts.push(`Nombre: ${displayName(user.name)}`)
    contextParts.push(`Objetivo: ${user.goal}`)

    if (user.restrictions) {
      contextParts.push(`Restricciones físicas: ${user.restrictions}`)
    }

    if (user.bodyData) {
      contextParts.push(`Peso/altura (para planes y rutinas): ${user.bodyData}`)
    }

    if (user.activityLevel) {
      contextParts.push(`Nivel de actividad: ${user.activityLevel}`)
    }

    // Racha y engagement
    if (user.currentStreak > 0) {
      contextParts.push(`Racha actual: ${user.currentStreak} días`)
    }

    if (user.longestStreak > 0) {
      contextParts.push(`Mejor racha: ${user.longestStreak} días`)
    }

    // Estadísticas
    if (user.stats) {
      if (user.stats.averageSleep) {
        contextParts.push(`Promedio sueño: ${user.stats.averageSleep.toFixed(1)}/5`)
      }
      if (user.stats.averageEnergy) {
        contextParts.push(`Promedio energía: ${user.stats.averageEnergy.toFixed(1)}/5`)
      }
      if (user.stats.trainingDays > 0) {
        contextParts.push(`Días entrenados: ${user.stats.trainingDays}`)
      }
    }

    // Preferencias
    if (user.preferences) {
      contextParts.push(`Horario check-in: ${user.preferences.reminderTime}`)
    }

    // Resumen de conversación reciente (para no inyectar todo el historial)
    const summary = await this.getConversationSummary(userId)
    if (summary) {
      contextParts.push(`\nResumen conversación reciente:\n${summary}`)
    }

    return contextParts.join('\n')
  }

  /**
   * Obtener resumen de conversación guardado (UserContext.aiSummary).
   * Se usa en el prompt en lugar del historial completo.
   */
  async getConversationSummary(userId: string): Promise<string | null> {
    const ctx = await prisma.userContext.findUnique({
      where: { userId },
      select: { aiSummary: true },
    })
    return ctx?.aiSummary ?? null
  }

  /**
   * Obtener historial de conversación reciente
   */
  async getConversationHistory(
    userId: string,
    limit: number = 10
  ): Promise<ChatMessage[]> {
    const conversations = await conversationService.getRecentMessages(userId, limit * 2) // x2 porque cada intercambio son 2 mensajes

    return conversations.map((conv: { role: string; message: string }) => ({
      role: conv.role as 'user' | 'assistant',
      content: conv.message,
    }))
  }

  /**
   * Guardar intercambio de conversación
   */
  async saveConversation(
    userId: string,
    userMessage: string,
    assistantMessage: string,
    metadata?: any
  ): Promise<void> {
    await conversationService.saveExchange(
      userId,
      userMessage,
      assistantMessage,
      metadata
    )
  }

  /**
   * Obtener resumen de actividad reciente para contexto
   */
  async getActivitySummary(userId: string): Promise<string> {
    const user = await userService.findById(userId)
    if (!user || !user.checkIns || user.checkIns.length === 0) {
      return 'Usuario nuevo, sin actividad previa.'
    }

    const recentCheckIns = user.checkIns.slice(0, 7) // Últimos 7 check-ins
    const summary: string[] = []

    summary.push(`Últimos check-ins (${recentCheckIns.length}):`)

    recentCheckIns.forEach((checkIn: { timestamp: Date; sleep: number; energy: number; trainedToday: boolean }, index: number) => {
      const date = new Date(checkIn.timestamp).toLocaleDateString('es-AR')
      summary.push(
        `${index + 1}. ${date}: Sueño ${checkIn.sleep}/5, Energía ${checkIn.energy}/5, ${checkIn.trainedToday ? 'Entrenó' : 'No entrenó'}`
      )
    })

    return summary.join('\n')
  }

  /**
   * Construir contexto completo para GPT
   */
  async buildFullContext(userId: string): Promise<{
    userContext: string
    conversationHistory: ChatMessage[]
    activitySummary: string
  }> {
    const [userContext, conversationHistory, activitySummary] = await Promise.all([
      this.getUserContext(userId),
      this.getConversationHistory(userId),
      this.getActivitySummary(userId),
    ])

    return {
      userContext,
      conversationHistory,
      activitySummary,
    }
  }

  /**
   * Detectar si el usuario debe recibir felicitación por racha
   */
  shouldCelebrateStreak(streak: number): boolean {
    return streak === 3 || streak === 7 || streak === 14 || streak === 30
  }

  /**
   * Detectar si el usuario está en riesgo de abandono
   */
  async isAtRisk(userId: string): Promise<boolean> {
    const user = await userService.findById(userId)
    if (!user) return false

    // Riesgo si:
    // 1. No hizo check-in en últimas 48h
    // 2. Su racha bajó significativamente
    // 3. Energía/sueño consistentemente bajos

    const now = new Date()
    const lastCheckIn = user.lastCheckInDate ? new Date(user.lastCheckInDate) : null

    if (!lastCheckIn) return true // Nunca hizo check-in

    const hoursSinceLastCheckIn = (now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60)

    if (hoursSinceLastCheckIn > 48) return true // Más de 48h sin check-in

    // Verificar patrón de energía/sueño bajo
    if (user.stats) {
      if (user.stats.averageSleep && user.stats.averageSleep < 2.5) return true
      if (user.stats.averageEnergy && user.stats.averageEnergy < 2.5) return true
    }

    return false
  }
}

export const contextService = new ContextService()
