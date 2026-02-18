import { Response } from 'express'
import { userService, checkInService, contentService, prisma } from '@pulze/database'
import { AuthRequest } from '../middleware/auth'

/**
 * GET /api/admin/users
 * Listar todos los usuarios (con filtros)
 */
export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const { status, premium, search } = req.query
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const where: any = {}

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    if (premium === 'true') {
      where.isPremium = true
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          stats: true,
          preferences: true,
        },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ])

    return res.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error('Error getting users:', error)
    return res.status(500).json({ error: 'Error al obtener usuarios' })
  }
}

/**
 * GET /api/admin/users/:id
 * Obtener detalle completo de un usuario
 */
export async function getUserById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        stats: true,
        preferences: true,
        checkIns: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
        conversations: {
          orderBy: { timestamp: 'desc' },
          take: 20,
        },
      },
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    return res.json(user)
  } catch (error: any) {
    console.error('Error getting user:', error)
    return res.status(500).json({ error: 'Error al obtener usuario' })
  }
}

/**
 * GET /api/admin/analytics
 * Obtener métricas generales de la plataforma
 */
export async function getAnalytics(req: AuthRequest, res: Response) {
  try {
    const days = parseInt(req.query.days as string) || 7

    // Estadísticas de usuarios
    const userStats = await userService.getStats()

    // Estadísticas de check-ins
    const checkInStats = await checkInService.getStats(days)

    // Estadísticas de contenidos
    const contentStats = await contentService.getStats()

    // Usuarios activos en los últimos N días
    const activeUsers = await userService.getActiveUsers(days)

    // Usuarios inactivos (más de 2 días sin check-in)
    const inactiveUsers = await userService.getInactiveUsers(2)

    // Calcular retención
    const date = new Date()
    date.setDate(date.getDate() - 7)
    const usersLastWeek = await prisma.user.count({
      where: {
        createdAt: { gte: date },
      },
    })

    const activeFromLastWeek = await prisma.user.count({
      where: {
        createdAt: { gte: date },
        lastCheckInDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    })

    const retention7d = usersLastWeek > 0 
      ? (activeFromLastWeek / usersLastWeek) * 100 
      : 0

    // Racha promedio
    const avgStreak = activeUsers.length > 0
      ? activeUsers.reduce((acc, u) => acc + u.currentStreak, 0) / activeUsers.length
      : 0

    return res.json({
      users: {
        ...userStats,
        activeInPeriod: activeUsers.length,
        inactiveCount: inactiveUsers.length,
      },
      checkIns: checkInStats,
      contents: contentStats,
      engagement: {
        retention7d: Math.round(retention7d * 10) / 10,
        averageStreak: Math.round(avgStreak * 10) / 10,
        checkInsPerUser: userStats.active > 0 
          ? Math.round((checkInStats.total / userStats.active) * 10) / 10 
          : 0,
      },
    })
  } catch (error: any) {
    console.error('Error getting analytics:', error)
    return res.status(500).json({ error: 'Error al obtener analytics' })
  }
}

/**
 * GET /api/admin/users/inactive
 * Obtener usuarios inactivos (para reactivación)
 */
export async function getInactiveUsers(req: AuthRequest, res: Response) {
  try {
    const days = parseInt(req.query.days as string) || 2

    const users = await userService.getInactiveUsers(days)

    return res.json({
      users,
      total: users.length,
      inactiveDays: days,
    })
  } catch (error: any) {
    console.error('Error getting inactive users:', error)
    return res.status(500).json({ error: 'Error al obtener usuarios inactivos' })
  }
}

/**
 * POST /api/admin/contents
 * Crear nuevo contenido
 */
export async function createContent(req: AuthRequest, res: Response) {
  try {
    const { category, type, title, description, content, tags, difficulty, duration } = req.body

    if (!category || !type || !title || !description || !content) {
      return res.status(400).json({
        error: 'Campos requeridos: category, type, title, description, content',
      })
    }

    const newContent = await contentService.create({
      category,
      type,
      title,
      description,
      content,
      tags: tags || [],
      difficulty,
      duration,
    })

    return res.status(201).json(newContent)
  } catch (error: any) {
    console.error('Error creating content:', error)
    return res.status(500).json({ error: 'Error al crear contenido' })
  }
}

/**
 * PATCH /api/admin/contents/:id
 * Actualizar contenido existente
 */
export async function updateContent(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { category, type, title, description, content, tags, difficulty, duration, isActive } = req.body

    const updatedContent = await contentService.update(id, {
      ...(category && { category }),
      ...(type && { type }),
      ...(title && { title }),
      ...(description && { description }),
      ...(content && { content }),
      ...(tags && { tags }),
      ...(difficulty && { difficulty }),
      ...(duration && { duration }),
      ...(isActive !== undefined && { isActive }),
    })

    return res.json(updatedContent)
  } catch (error: any) {
    console.error('Error updating content:', error)
    return res.status(500).json({ error: 'Error al actualizar contenido' })
  }
}

/**
 * DELETE /api/admin/contents/:id
 * Eliminar contenido (soft delete)
 */
export async function deleteContent(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params

    const deletedContent = await contentService.delete(id)

    return res.json({
      message: 'Contenido eliminado exitosamente',
      content: deletedContent,
    })
  } catch (error: any) {
    console.error('Error deleting content:', error)
    return res.status(500).json({ error: 'Error al eliminar contenido' })
  }
}

/**
 * GET /api/admin/templates
 * Obtener todas las plantillas
 */
export async function getTemplates(req: AuthRequest, res: Response) {
  try {
    const templates = await prisma.messageTemplate.findMany({
      orderBy: { usageCount: 'desc' },
    })

    return res.json({
      templates,
      total: templates.length,
    })
  } catch (error: any) {
    console.error('Error getting templates:', error)
    return res.status(500).json({ error: 'Error al obtener plantillas' })
  }
}

/**
 * PATCH /api/admin/templates/:id
 * Actualizar plantilla
 */
export async function updateTemplate(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { name, content, variables, type, isActive } = req.body

    const template = await prisma.messageTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(content && { content }),
        ...(variables && { variables }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return res.json(template)
  } catch (error: any) {
    console.error('Error updating template:', error)
    return res.status(500).json({ error: 'Error al actualizar plantilla' })
  }
}
