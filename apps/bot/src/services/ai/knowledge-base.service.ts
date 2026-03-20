import { contentService, prisma } from '@pulze/database'

const MAX_ITEMS = 8
const MAX_CONTENT_LENGTH = 400

/**
 * Obtiene la base de conocimiento de nutrición para inyectar en prompts.
 * La IA usa esto como referencia al responder consultas nutricionales.
 */
export async function getNutritionKnowledgeBase(): Promise<string> {
  const contents = await contentService.findByCategory('Nutrición')
  if (contents.length === 0) return ''

  const items = contents.slice(0, MAX_ITEMS).map((c) => {
    const text = c.content.length > MAX_CONTENT_LENGTH
      ? c.content.slice(0, MAX_CONTENT_LENGTH) + '...'
      : c.content
    return `**${c.title}** (${c.type}):\n${text}`
  })

  return `BASE DE CONOCIMIENTO - NUTRICIÓN (usá esto como referencia principal):\n${items.join('\n\n')}`
}

/**
 * Obtiene la base de conocimiento de entrenamiento (Contenidos + resumen de Planes estándar).
 * La IA usa esto como referencia al responder consultas de entrenamiento.
 */
export async function getTrainingKnowledgeBase(): Promise<string> {
  const [contents, plans] = await Promise.all([
    contentService.findByCategory('Entrenamiento'),
    prisma.standardPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      take: 5,
    }),
  ])

  const parts: string[] = []

  if (contents.length > 0) {
    const contentItems = contents.slice(0, 5).map((c) => {
      const text = c.content.length > MAX_CONTENT_LENGTH
        ? c.content.slice(0, MAX_CONTENT_LENGTH) + '...'
        : c.content
      return `**${c.title}** (${c.type}):\n${text}`
    })
    parts.push(`BASE DE CONOCIMIENTO - ENTRENAMIENTO:\n${contentItems.join('\n\n')}`)
  }

  if (plans.length > 0) {
    const planItems = plans.map((p) => {
      const text = p.content.length > MAX_CONTENT_LENGTH
        ? p.content.slice(0, MAX_CONTENT_LENGTH) + '...'
        : p.content
      return `**${p.title}** (${p.difficulty}, ${p.category}):\n${text}`
    })
    parts.push(`PLANES ESTÁNDAR (adaptá según nivel y restricciones del usuario):\n${planItems.join('\n\n')}`)
  }

  return parts.length > 0 ? parts.join('\n\n') : ''
}
