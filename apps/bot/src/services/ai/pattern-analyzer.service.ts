import { UserWithRelations, checkInService, CheckIn } from '@pulze/database'

/**
 * Interfaz para patrones detectados
 */
export interface UserPatterns {
  bestCheckInTime: string | null // Hora en que más responde
  averageSleep: number
  averageEnergy: number
  trainingFrequency: number // % de días que entrena
  mostCommonMood: string
  streakTrend: 'improving' | 'stable' | 'declining'
  riskOfChurn: 'low' | 'medium' | 'high'
  motivators: string[] // Qué lo mantiene activo (racha, objetivo, etc.)
}

/**
 * PatternAnalyzer - Analiza comportamiento y patrones del usuario
 * 
 * Esto alimenta la personalización inteligente:
 * - Detecta mejor horario para mensajes
 * - Identifica tendencias de engagement
 * - Predice riesgo de abandono
 * - Encuentra motivadores personales
 */
export class PatternAnalyzer {
  /**
   * Analizar patrones completos del usuario
   */
  async analyzeUserPatterns(user: UserWithRelations): Promise<UserPatterns> {
    // Obtener check-ins de los últimos 30 días
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const checkIns = await checkInService.getCheckInsByDateRange(
      user.id,
      thirtyDaysAgo,
      new Date()
    )

    const patterns: UserPatterns = {
      bestCheckInTime: this.detectBestCheckInTime(checkIns),
      averageSleep: this.calculateAverage(checkIns, 'sleep'),
      averageEnergy: this.calculateAverage(checkIns, 'energy'),
      trainingFrequency: this.calculateTrainingFrequency(checkIns),
      mostCommonMood: this.findMostCommonMood(checkIns),
      streakTrend: this.detectStreakTrend(user),
      riskOfChurn: this.calculateChurnRisk(user, checkIns),
      motivators: this.identifyMotivators(user, checkIns),
    }

    return patterns
  }

  /**
   * Detectar el mejor horario para enviar mensajes
   * (basado en cuando responde más frecuentemente)
   */
  private detectBestCheckInTime(checkIns: CheckIn[]): string | null {
    if (checkIns.length < 5) return null

    const hourBuckets: Record<string, number> = {
      morning: 0,   // 6-11 AM
      midday: 0,    // 12-2 PM
      afternoon: 0, // 3-6 PM
      evening: 0,   // 7-10 PM
    }

    checkIns.forEach(checkIn => {
      const hour = checkIn.timestamp.getHours()
      
      if (hour >= 6 && hour < 12) hourBuckets.morning++
      else if (hour >= 12 && hour < 15) hourBuckets.midday++
      else if (hour >= 15 && hour < 19) hourBuckets.afternoon++
      else if (hour >= 19 && hour < 23) hourBuckets.evening++
    })

    const bestTime = Object.entries(hourBuckets)
      .sort(([, a], [, b]) => b - a)[0][0]

    return bestTime
  }

  /**
   * Calcular promedio de un campo (sleep o energy)
   */
  private calculateAverage(
    checkIns: CheckIn[],
    field: 'sleep' | 'energy'
  ): number {
    if (checkIns.length === 0) return 0
    
    const sum = checkIns.reduce((acc, c) => acc + c[field], 0)
    return parseFloat((sum / checkIns.length).toFixed(1))
  }

  /**
   * Calcular frecuencia de entrenamiento (% de días que entrena)
   */
  private calculateTrainingFrequency(checkIns: CheckIn[]): number {
    if (checkIns.length === 0) return 0

    const trainedDays = checkIns.filter(c => c.trainedToday).length
    return parseFloat(((trainedDays / checkIns.length) * 100).toFixed(1))
  }

  /**
   * Encontrar el mood más común
   */
  private findMostCommonMood(checkIns: CheckIn[]): string {
    if (checkIns.length === 0) return 'neutral'

    const moodCounts: Record<string, number> = {}

    checkIns.forEach(checkIn => {
      const mood = checkIn.mood.toLowerCase()
      moodCounts[mood] = (moodCounts[mood] || 0) + 1
    })

    return Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)[0][0]
  }

  /**
   * Detectar tendencia de racha (mejorando, estable, declinando)
   */
  private detectStreakTrend(user: UserWithRelations): 'improving' | 'stable' | 'declining' {
    const current = user.currentStreak
    const longest = user.longestStreak

    if (current === 0) return 'declining'
    if (current >= longest * 0.8) return 'improving' // Cerca del récord
    if (current >= longest * 0.5) return 'stable'
    return 'declining'
  }

  /**
   * Calcular riesgo de abandono (churn)
   */
  private calculateChurnRisk(
    user: UserWithRelations,
    recentCheckIns: CheckIn[]
  ): 'low' | 'medium' | 'high' {
    const riskFactors: number[] = []

    // Factor 1: Días sin check-in
    const daysSinceLastCheckIn = user.lastCheckInDate
      ? Math.floor(
          (Date.now() - user.lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 999

    if (daysSinceLastCheckIn >= 7) riskFactors.push(3)
    else if (daysSinceLastCheckIn >= 3) riskFactors.push(2)
    else if (daysSinceLastCheckIn >= 1) riskFactors.push(1)
    else riskFactors.push(0)

    // Factor 2: Racha actual vs. récord
    const streakRatio = user.longestStreak > 0 
      ? user.currentStreak / user.longestStreak 
      : 1

    if (streakRatio < 0.3) riskFactors.push(2)
    else if (streakRatio < 0.6) riskFactors.push(1)
    else riskFactors.push(0)

    // Factor 3: Frecuencia de check-ins últimos 7 días
    const last7Days = recentCheckIns.slice(0, 7)
    if (last7Days.length < 3) riskFactors.push(2)
    else if (last7Days.length < 5) riskFactors.push(1)
    else riskFactors.push(0)

    const totalRisk = riskFactors.reduce((a, b) => a + b, 0)

    if (totalRisk >= 5) return 'high'
    if (totalRisk >= 3) return 'medium'
    return 'low'
  }

  /**
   * Identificar motivadores personales
   * (qué mantiene al usuario activo)
   */
  private identifyMotivators(
    user: UserWithRelations,
    checkIns: CheckIn[]
  ): string[] {
    const motivators: string[] = []

    // Motivador 1: Racha
    if (user.currentStreak >= 7) {
      motivators.push('racha')
    }

    // Motivador 2: Mejora visible en energía
    if (checkIns.length >= 7) {
      const recent = checkIns.slice(0, 7)
      const older = checkIns.slice(7, 14)
      
      const recentAvgEnergy = this.calculateAverage(recent, 'energy')
      const olderAvgEnergy = this.calculateAverage(older, 'energy')

      if (recentAvgEnergy > olderAvgEnergy + 0.5) {
        motivators.push('energia_mejorando')
      }
    }

    // Motivador 3: Consistencia en entrenamiento
    const trainingFreq = this.calculateTrainingFrequency(checkIns)
    if (trainingFreq >= 70) {
      motivators.push('entrenamiento_consistente')
    }

    // Motivador 4: Objetivo claro
    if (user.goal && user.goal !== 'Sin definir') {
      motivators.push('objetivo_claro')
    }

    return motivators
  }

  /**
   * Generar insights accionables para el coach (GPT)
   */
  generateInsights(patterns: UserPatterns): string {
    const insights: string[] = []

    // Insight 1: Calidad de descanso
    if (patterns.averageSleep < 3) {
      insights.push('⚠️ Sueño promedio bajo (${patterns.averageSleep}/5) - priorizar descanso')
    } else if (patterns.averageSleep >= 4) {
      insights.push('✅ Buena calidad de sueño (${patterns.averageSleep}/5)')
    }

    // Insight 2: Energía
    if (patterns.averageEnergy < 3) {
      insights.push('⚠️ Energía baja (${patterns.averageEnergy}/5) - revisar nutrición y descanso')
    }

    // Insight 3: Entrenamiento
    if (patterns.trainingFrequency >= 70) {
      insights.push('🔥 Excelente frecuencia de entrenamiento (${patterns.trainingFrequency}%)')
    } else if (patterns.trainingFrequency < 40) {
      insights.push('⚠️ Baja frecuencia de entrenamiento (${patterns.trainingFrequency}%) - motivar')
    }

    // Insight 4: Riesgo de abandono
    if (patterns.riskOfChurn === 'high') {
      insights.push('🚨 Alto riesgo de abandono - enviar reactivación urgente')
    } else if (patterns.riskOfChurn === 'medium') {
      insights.push('⚠️ Riesgo medio de abandono - reforzar motivación')
    }

    // Insight 5: Tendencia de racha
    if (patterns.streakTrend === 'improving') {
      insights.push('📈 Racha en crecimiento - felicitar y motivar a mantener')
    } else if (patterns.streakTrend === 'declining') {
      insights.push('📉 Racha en declive - reforzar compromiso')
    }

    return insights.join('\n')
  }

  /**
   * Determinar si debe enviarse mensaje proactivo
   */
  shouldSendProactiveMessage(
    user: UserWithRelations,
    patterns: UserPatterns
  ): { send: boolean; type: string; reason: string } | null {
    // Caso 1: Alto riesgo de abandono
    if (patterns.riskOfChurn === 'high') {
      return {
        send: true,
        type: 'reactivation',
        reason: 'Usuario con alto riesgo de abandono',
      }
    }

    // Caso 2: Racha a punto de romperse
    const daysSinceLastCheckIn = user.lastCheckInDate
      ? Math.floor(
          (Date.now() - user.lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0

    if (user.currentStreak >= 7 && daysSinceLastCheckIn === 1) {
      return {
        send: true,
        type: 'streak_reminder',
        reason: 'Racha en riesgo (>7 días, 1 día sin check-in)',
      }
    }

    // Caso 3: Hito de racha alcanzado
    if (user.currentStreak > 0 && user.currentStreak % 7 === 0) {
      return {
        send: true,
        type: 'streak_milestone',
        reason: `Hito de racha alcanzado (${user.currentStreak} días)`,
      }
    }

    // Caso 4: Mejora notable en energía
    if (patterns.averageEnergy >= 4 && patterns.streakTrend === 'improving') {
      return {
        send: true,
        type: 'progress_celebration',
        reason: 'Usuario mostrando mejora notable',
      }
    }

    return null
  }
}

export const patternAnalyzer = new PatternAnalyzer()
