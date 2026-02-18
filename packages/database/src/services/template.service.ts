import { prisma } from '../client'
import type { MessageTemplate, Prisma } from '@prisma/client'

export class TemplateService {
  /**
   * Crear nueva plantilla
   */
  async create(data: Prisma.MessageTemplateCreateInput): Promise<MessageTemplate> {
    return prisma.messageTemplate.create({ data })
  }

  /**
   * Obtener plantilla por key
   */
  async findByKey(key: string): Promise<MessageTemplate | null> {
    return prisma.messageTemplate.findUnique({ where: { key } })
  }

  /**
   * Obtener plantillas por tipo
   */
  async findByType(type: string): Promise<MessageTemplate[]> {
    return prisma.messageTemplate.findMany({
      where: {
        type,
        isActive: true,
      },
    })
  }

  /**
   * Renderizar plantilla con variables
   */
  async render(key: string, variables: Record<string, string>): Promise<string> {
    const template = await this.findByKey(key)
    if (!template) throw new Error(`Template ${key} not found`)

    let content = template.content

    // Reemplazar variables: {{nombre}} -> valor
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      content = content.replace(regex, value)
    })

    // Incrementar contador de uso
    await prisma.messageTemplate.update({
      where: { key },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    })

    return content
  }

  /**
   * Actualizar plantilla
   */
  async update(
    id: string,
    data: Prisma.MessageTemplateUpdateInput
  ): Promise<MessageTemplate> {
    return prisma.messageTemplate.update({
      where: { id },
      data,
    })
  }

  /**
   * Obtener todas las plantillas (para backoffice)
   */
  async findAll(): Promise<MessageTemplate[]> {
    return prisma.messageTemplate.findMany({
      orderBy: { usageCount: 'desc' },
    })
  }

  /**
   * Obtener plantillas más usadas
   */
  async getMostUsed(limit: number = 10): Promise<MessageTemplate[]> {
    return prisma.messageTemplate.findMany({
      where: { isActive: true },
      orderBy: { usageCount: 'desc' },
      take: limit,
    })
  }
}

export const templateService = new TemplateService()
