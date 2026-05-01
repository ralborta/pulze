import { prisma, userService } from '@pulze/database'

export interface AdaptRoutineInput {
  userId: string
  planId?: string
  checkInData?: {
    sleep?: number
    energy?: number
    mood?: string
    willTrain?: boolean
  }
}

export interface AdaptRoutineMediaItem {
  url: string
  order: number
  caption?: string
  exerciseKey?: string
}

export interface AdaptRoutineResult {
  content: string
  planId?: string
  planTitle?: string
  /** URLs públicas asociadas al plan (orden sugerido para WhatsApp). La IA elige el plan; no inventa enlaces. */
  mediaAssets?: AdaptRoutineMediaItem[] | null
}

/**
 * Devuelve un plan estándar de la DB con contexto del usuario en texto (sin OpenAI).
 * La “adaptación fina” puede hacerse en BuilderBot / otro canal.
 */
export async function adaptRoutineForUser(input: AdaptRoutineInput): Promise<AdaptRoutineResult | null> {
  const { userId, planId, checkInData } = input

  const user = await userService.findById(userId)
  if (!user) return null

  let plan: {
    id: string
    title: string
    content: string
    category: string
    difficulty: string
    equipment: string[]
    mediaAssets?: unknown
  } | null = null

  if (planId) {
    plan = await prisma.standardPlan.findFirst({
      where: { id: planId, isActive: true },
    })
  }

  if (!plan) {
    const userLevel = (user as any).activityLevel || 'ligero'
    const difficultyMap: Record<string, string> = {
      sedentario: 'Principiante',
      ligero: 'Principiante',
      moderado: 'Intermedio',
      alto: 'Avanzado',
    }
    const suggestedDifficulty = difficultyMap[userLevel] || 'Principiante'

    plan = await prisma.standardPlan.findFirst({
      where: { isActive: true, difficulty: suggestedDifficulty },
      orderBy: { sortOrder: 'asc' },
    })
  }

  if (!plan) return null

  const lines: string[] = []
  lines.push(`📋 ${plan.title} (${plan.category} · ${plan.difficulty})`)
  lines.push('')
  if (user.restrictions) lines.push(`⚠️ Recordá tus restricciones: ${user.restrictions}`)
  if (checkInData?.willTrain === false) lines.push(`Hoy indicaste que no entrenás; ajustá la rutina a tu día.`)
  lines.push('')
  lines.push(plan.content)

  const rawMedia = plan.mediaAssets
  let mediaAssets: AdaptRoutineMediaItem[] | null = null
  if (rawMedia != null && Array.isArray(rawMedia)) {
    const parsed: AdaptRoutineMediaItem[] = []
    let i = 0
    for (const item of rawMedia) {
      if (!item || typeof item !== 'object') continue
      const rec = item as Record<string, unknown>
      const url = typeof rec.url === 'string' ? rec.url.trim() : ''
      if (!url || !/^https:\/\//i.test(url)) continue
      const caption = typeof rec.caption === 'string' ? rec.caption.trim() : undefined
      const exerciseKey = typeof rec.exerciseKey === 'string' ? rec.exerciseKey.trim() : undefined
      const order = typeof rec.order === 'number' && !Number.isNaN(rec.order) ? rec.order : i
      const row: AdaptRoutineMediaItem = { url, order }
      if (caption) row.caption = caption
      if (exerciseKey) row.exerciseKey = exerciseKey
      parsed.push(row)
      i++
    }
    if (parsed.length) {
      parsed.sort((a, b) => a.order - b.order)
      mediaAssets = parsed
    }
  }

  return {
    content: lines.filter(Boolean).join('\n'),
    planId: plan.id,
    planTitle: plan.title,
    mediaAssets,
  }
}
