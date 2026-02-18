import { Response } from 'express'
import { contentService } from '@pulze/database'
import { AuthRequest } from '../middleware/auth'

/**
 * GET /api/contents
 * Listar contenidos (con filtros opcionales)
 */
export async function getContents(req: AuthRequest, res: Response) {
  try {
    const { category, type } = req.query

    let contents

    if (category) {
      contents = await contentService.findByCategory(category as string)
    } else if (type) {
      contents = await contentService.findByType(type as string)
    } else {
      contents = await contentService.findAll({ isActive: true })
    }

    return res.json({
      contents,
      total: contents.length,
    })
  } catch (error: any) {
    console.error('Error getting contents:', error)
    return res.status(500).json({ error: 'Error al obtener contenidos' })
  }
}

/**
 * GET /api/contents/:id
 * Obtener contenido específico (incrementa contador de vistas)
 */
export async function getContentById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params

    const content = await contentService.findByIdAndView(id)

    if (!content) {
      return res.status(404).json({ error: 'Contenido no encontrado' })
    }

    return res.json(content)
  } catch (error: any) {
    console.error('Error getting content:', error)
    return res.status(500).json({ error: 'Error al obtener contenido' })
  }
}

/**
 * GET /api/contents/category/:category
 * Obtener contenidos por categoría
 */
export async function getContentsByCategory(req: AuthRequest, res: Response) {
  try {
    const { category } = req.params

    const contents = await contentService.findByCategory(category)

    return res.json({
      category,
      contents,
      total: contents.length,
    })
  } catch (error: any) {
    console.error('Error getting contents by category:', error)
    return res.status(500).json({ error: 'Error al obtener contenidos' })
  }
}

/**
 * GET /api/contents/popular
 * Obtener contenidos más vistos
 */
export async function getPopularContents(req: AuthRequest, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10

    const contents = await contentService.getMostViewed(limit)

    return res.json({
      contents,
      total: contents.length,
    })
  } catch (error: any) {
    console.error('Error getting popular contents:', error)
    return res.status(500).json({ error: 'Error al obtener contenidos populares' })
  }
}
