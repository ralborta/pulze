import { prisma } from '../client'
import type { Conversation, Prisma } from '@prisma/client'

export class ConversationService {
  /**
   * Guardar mensaje de conversación
   */
  async create(data: Prisma.ConversationCreateInput): Promise<Conversation> {
    return prisma.conversation.create({ data })
  }

  /**
   * Obtener historial de conversación de un usuario
   */
  async findByUserId(
    userId: string,
    options?: {
      take?: number
      skip?: number
    }
  ): Promise<Conversation[]> {
    return prisma.conversation.findMany({
      where: { userId },
      take: options?.take || 50,
      skip: options?.skip,
      orderBy: { timestamp: 'desc' },
    })
  }

  /**
   * Obtener últimos N mensajes (para contexto de IA)
   */
  async getRecentMessages(userId: string, limit: number = 10): Promise<Conversation[]> {
    return prisma.conversation.findMany({
      where: { userId },
      take: limit,
      orderBy: { timestamp: 'desc' },
    })
  }

  /**
   * Guardar intercambio completo (usuario + asistente)
   */
  async saveExchange(
    userId: string,
    userMessage: string,
    assistantMessage: string,
    metadata?: any
  ): Promise<void> {
    await prisma.conversation.createMany({
      data: [
        {
          userId,
          role: 'user',
          message: userMessage,
          metadata,
        },
        {
          userId,
          role: 'assistant',
          message: assistantMessage,
          metadata,
        },
      ],
    })
  }
}

export const conversationService = new ConversationService()
