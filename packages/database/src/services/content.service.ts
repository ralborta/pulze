import { prisma } from '../client'
import type { Content, Prisma } from '@prisma/client'

export class ContentService {
  /**
   * Crear nuevo contenido
   */
  async create(data: Prisma.ContentCreateInput): Promise<Content> {
    return prisma.content.create({ data })
  }

  /**
   * Obtener contenidos por categoría
   */
  async findByCategory(category: string): Promise<Content[]> {
    return prisma.content.findMany({
      where: {
        category,
        isActive: true,
      },
      orderBy: { viewCount: 'desc' },
    })
  }

  /**
   * Obtener contenidos por tipo
   */
  async findByType(type: string): Promise<Content[]> {
    return prisma.content.findMany({
      where: {
        type,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Buscar contenidos por tags
   */
  async findByTags(tags: string[]): Promise<Content[]> {
    return prisma.content.findMany({
      where: {
        tags: {
          hasSome: tags,
        },
        isActive: true,
      },
    })
  }

  /**
   * Obtener contenido por ID y actualizar contador de vistas
   */
  async findByIdAndView(id: string): Promise<Content | null> {
    await prisma.content.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    })

    return prisma.content.findUnique({ where: { id } })
  }

  /**
   * Obtener contenidos más populares
   */
  async getMostViewed(limit: number = 10): Promise<Content[]> {
    return prisma.content.findMany({
      where: { isActive: true },
      orderBy: { viewCount: 'desc' },
      take: limit,
    })
  }

  /**
   * Actualizar contenido
   */
  async update(id: string, data: Prisma.ContentUpdateInput): Promise<Content> {
    return prisma.content.update({
      where: { id },
      data,
    })
  }

  /**
   * Eliminar contenido (soft delete)
   */
  async delete(id: string): Promise<Content> {
    return prisma.content.update({
      where: { id },
      data: { isActive: false },
    })
  }

  /**
   * Obtener todos los contenidos (para backoffice)
   */
  async findAll(filters?: {
    category?: string
    type?: string
    isActive?: boolean
  }): Promise<Content[]> {
    return prisma.content.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Obtener estadísticas de contenidos
   */
  async getStats() {
    const total = await prisma.content.count()
    const byCategory = await prisma.content.groupBy({
      by: ['category'],
      _count: true,
      where: { isActive: true },
    })

    const mostViewed = await this.getMostViewed(5)

    return {
      total,
      byCategory,
      mostViewed: mostViewed.map((c) => ({
        title: c.title,
        views: c.viewCount,
      })),
    }
  }
}

export const contentService = new ContentService()
