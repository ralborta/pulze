import { Response } from 'express'
import { userService, checkInService, contentService, prisma } from '@pulze/database'
import { AuthRequest } from '../middleware/auth'

/** Imagen/vídeo asociado a un plan estándar (URL pública HTTPS). */
export type StandardPlanMediaItem = {
  url: string
  order: number
  caption?: string
  exerciseKey?: string
}

function normalizeStandardPlanMediaAssets(input: unknown): StandardPlanMediaItem[] | null {
  if (input == null) return null
  if (!Array.isArray(input)) return null
  const out: StandardPlanMediaItem[] = []
  let idx = 0
  for (const item of input) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    const url = typeof rec.url === 'string' ? rec.url.trim() : ''
    if (!url || !/^https:\/\//i.test(url)) continue
    const caption = typeof rec.caption === 'string' ? rec.caption.trim() : undefined
    const exerciseKey = typeof rec.exerciseKey === 'string' ? rec.exerciseKey.trim() : undefined
    const order = typeof rec.order === 'number' && !Number.isNaN(rec.order) ? rec.order : idx
    const row: StandardPlanMediaItem = { url, order }
    if (caption) row.caption = caption
    if (exerciseKey) row.exerciseKey = exerciseKey
    out.push(row)
    idx++
  }
  if (!out.length) return null
  out.sort((a, b) => a.order - b.order)
  return out
}

/**
 * GET /api/admin/users
 * Listar todos los usuarios (con filtros)
 */
export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const { status, premium, search, clean } = req.query
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    /** Por defecto excluye filas basura (placeholders de webhook mal resueltos, newsletter JIDs, etc.) */
    const excludeJunk = clean !== 'false' && clean !== '0'

    const conditions: object[] = []

    if (status === 'active') {
      conditions.push({ isActive: true })
    } else if (status === 'inactive') {
      conditions.push({ isActive: false })
    }

    if (premium === 'true') {
      conditions.push({ isPremium: true })
    }

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ],
      })
    }

    if (excludeJunk) {
      conditions.push(
        { NOT: { phone: { contains: '@' } } },
        { NOT: { phone: { contains: '\u007b' } } },
        { NOT: { phone: { contains: '(' } } },
        { NOT: { name: { equals: '{body}' } } },
        { NOT: { name: { startsWith: '_event_' } } }
      )
    }

    const where = conditions.length > 0 ? { AND: conditions } : {}

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
 * PATCH /api/admin/users/:id/bot
 * Activar o desactivar el bot para un usuario (operador toma control)
 */
export async function updateUserBot(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { botEnabled } = req.body as { botEnabled?: boolean }

    if (typeof botEnabled !== 'boolean') {
      return res.status(400).json({ error: 'botEnabled debe ser true o false' })
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        botEnabled,
        ...(botEnabled === false ? { operatorTakenOverAt: new Date() } : { operatorTakenOverAt: null }),
      },
    })

    return res.json({ user, botEnabled: user.botEnabled })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    console.error('Error updating user bot:', error)
    return res.status(500).json({ error: 'Error al actualizar estado del bot' })
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
          take: 50,
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
      ? activeUsers.reduce((acc: number, u: { currentStreak: number }) => acc + u.currentStreak, 0) / activeUsers.length
      : 0

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [newUsersToday, assistantMessagesToday] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.conversation.count({
        where: {
          role: 'assistant',
          timestamp: { gte: todayStart },
        },
      }),
    ])

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
      activityToday: {
        newUsers: newUsersToday,
        checkInsCompleted: checkInStats.todayCount,
        messagesSent: assistantMessagesToday,
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
 * GET /api/admin/contents
 * Listar todos los contenidos (para backoffice, incluye inactivos)
 */
export async function getContents(req: AuthRequest, res: Response) {
  try {
    const { category, type, isActive } = req.query

    const where: any = {}
    if (category) where.category = category
    if (type) where.type = type
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false

    const contents = await prisma.content.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return res.json({ contents, total: contents.length })
  } catch (error: any) {
    console.error('Error getting contents:', error)
    return res.status(500).json({ error: 'Error al obtener contenidos' })
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
 * POST /api/admin/templates
 * Crear nueva plantilla
 */
export async function createTemplate(req: AuthRequest, res: Response) {
  try {
    const { key, name, content, variables, type } = req.body

    if (!key || !name || !content) {
      return res.status(400).json({
        error: 'Campos requeridos: key, name, content',
      })
    }

    const template = await prisma.messageTemplate.create({
      data: {
        key,
        name,
        content,
        variables: Array.isArray(variables) ? variables : [],
        type: type || 'general',
      },
    })

    return res.status(201).json(template)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una plantilla con esa key' })
    }
    console.error('Error creating template:', error)
    return res.status(500).json({ error: 'Error al crear plantilla' })
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

/**
 * GET /api/admin/standard-plans
 * Listar planes estándar (base para rutinas diarias)
 */
export async function getStandardPlans(req: AuthRequest, res: Response) {
  try {
    const { category, difficulty, active } = req.query

    const where: any = {}
    if (category) where.category = category
    if (difficulty) where.difficulty = difficulty
    if (active === 'true') where.isActive = true
    if (active === 'false') where.isActive = false

    const plans = await prisma.standardPlan.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })

    return res.json({ plans, total: plans.length })
  } catch (error: any) {
    console.error('Error getting standard plans:', error)
    return res.status(500).json({ error: 'Error al obtener planes estándar' })
  }
}

/**
 * POST /api/admin/standard-plans
 * Crear plan estándar
 */
export async function createStandardPlan(req: AuthRequest, res: Response) {
  try {
    const { title, description, content, category, difficulty, equipment, duration, tags, sortOrder, mediaAssets } =
      req.body

    if (!title || !content || !category || !difficulty) {
      return res.status(400).json({
        error: 'Campos requeridos: title, content, category, difficulty',
      })
    }

    const media = normalizeStandardPlanMediaAssets(mediaAssets)

    const plan = await prisma.standardPlan.create({
      data: {
        title,
        description: description || null,
        content,
        category,
        difficulty,
        equipment: Array.isArray(equipment) ? equipment : [],
        duration: duration || null,
        tags: Array.isArray(tags) ? tags : [],
        sortOrder: sortOrder ?? 0,
        mediaAssets: media ?? undefined,
      },
    })

    return res.status(201).json(plan)
  } catch (error: any) {
    console.error('Error creating standard plan:', error)
    return res.status(500).json({ error: 'Error al crear plan estándar' })
  }
}

/**
 * PATCH /api/admin/standard-plans/:id
 * Actualizar plan estándar
 */
export async function updateStandardPlan(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { title, description, content, category, difficulty, equipment, duration, tags, sortOrder, isActive, mediaAssets } =
      req.body

    const mediaPatch =
      mediaAssets === undefined ? {} : { mediaAssets: normalizeStandardPlanMediaAssets(mediaAssets) }

    const plan = await prisma.standardPlan.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(content && { content }),
        ...(category && { category }),
        ...(difficulty && { difficulty }),
        ...(Array.isArray(equipment) && { equipment }),
        ...(duration !== undefined && { duration }),
        ...(Array.isArray(tags) && { tags }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
        ...mediaPatch,
      },
    })

    return res.json(plan)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Plan no encontrado' })
    }
    console.error('Error updating standard plan:', error)
    return res.status(500).json({ error: 'Error al actualizar plan' })
  }
}

/**
 * DELETE /api/admin/standard-plans/:id
 * Eliminar plan estándar
 */
export async function deleteStandardPlan(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params

    await prisma.standardPlan.delete({
      where: { id },
    })

    return res.json({ message: 'Plan eliminado exitosamente' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Plan no encontrado' })
    }
    console.error('Error deleting standard plan:', error)
    return res.status(500).json({ error: 'Error al eliminar plan' })
  }
}
