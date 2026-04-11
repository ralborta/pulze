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

export interface AdaptRoutineResult {
  content: string
  planId?: string
  planTitle?: string
}

/**
 * Devuelve un plan estándar de la DB con contexto del usuario en texto (sin OpenAI).
 * La “adaptación fina” puede hacerse en BuilderBot / otro canal.
 */
export async function adaptRoutineForUser(input: AdaptRoutineInput): Promise<AdaptRoutineResult | null> {
  const { userId, planId, checkInData } = input

  const user = await userService.findById(userId)
  if (!user) return null

  let plan: { id: string; title: string; content: string; category: string; difficulty: string; equipment: string[] } | null = null

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

  return {
    content: lines.filter(Boolean).join('\n'),
    planId: plan.id,
    planTitle: plan.title,
  }
}
