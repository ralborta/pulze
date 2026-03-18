import { prisma, userService } from '@pulze/database'
import { aiService } from './ai.service'

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
 * Adapta un plan estándar al usuario según su contexto y check-in.
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

  const contextParts: string[] = []
  contextParts.push(`Usuario: ${user.name}`)
  contextParts.push(`Objetivo: ${user.goal}`)
  if (user.restrictions) contextParts.push(`Restricciones: ${user.restrictions}`)
  if (user.bodyData) contextParts.push(`Peso/altura: ${user.bodyData}`)
  if ((user as any).activityLevel) contextParts.push(`Nivel actividad: ${(user as any).activityLevel}`)
  if (checkInData) {
    if (checkInData.sleep != null) contextParts.push(`Sueño hoy: ${checkInData.sleep}/5`)
    if (checkInData.energy != null) contextParts.push(`Energía hoy: ${checkInData.energy}/5`)
    if (checkInData.mood) contextParts.push(`Ánimo: ${checkInData.mood}`)
    if (checkInData.willTrain !== undefined) contextParts.push(`¿Entrena hoy?: ${checkInData.willTrain ? 'Sí' : 'No'}`)
  }

  const prompt = `Adaptá esta rutina estándar al usuario. Respetá sus restricciones y ajustá intensidad/ejercicios si hace falta.

**Plan base:** ${plan.title}
**Contenido:**
${plan.content}

**Contexto del usuario:**
${contextParts.join('\n')}

Generá la rutina adaptada en texto, lista para enviar por WhatsApp. Máximo 300 palabras. Sin explicaciones previas, directo a la rutina.`

  const result = await aiService.generateCoachResponse(prompt, undefined, [])

  return {
    content: result.content,
    planId: plan.id,
    planTitle: plan.title,
  }
}
