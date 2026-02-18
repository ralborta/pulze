import { UserWithRelations } from '@pulze/database'
import { CheckIn, Conversation } from '@prisma/client'

/**
 * PromptBuilderService - Construye prompts dinámicos y personalizados
 * 
 * Este es el corazón de la diferenciación de PULZE:
 * - Prompts contextuales (historia, patrones, preferencias)
 * - Prompts optimizados por tipo de interacción
 * - Memoria de conversación con resumen inteligente
 */
export class PromptBuilderService {
  /**
   * Prompt base del sistema (identidad de PULZE)
   */
  private getSystemIdentity(): string {
    return `Eres PULZE, un coach personal de bienestar en WhatsApp.

**Tu propósito:**
Acompañar a las personas en su transformación física, mental y emocional con:
- Constancia diaria (check-ins cortos y útiles)
- Recomendaciones personalizadas (entrenamiento, nutrición, descanso, mentalidad)
- Empatía y motivación genuina (no robótico, humano)

**Tu estilo:**
- Conversacional y cercano (tuteo)
- Respuestas breves y accionables (2-3 párrafos máximo)
- Emojis moderados (1-2 por mensaje)
- Positivo pero realista (no frases genéricas)

**Tus límites:**
- NO eres médico ni psicólogo (no diagnosticas)
- NO das planes sin contexto suficiente
- SI tienes dudas, preguntas antes de recomendar
`
  }

  /**
   * Construir prompt para check-in diario
   */
  buildCheckInPrompt(
    user: UserWithRelations,
    checkInData: { sleep: number; energy: number; mood: string; willTrain: boolean },
    recentConversations: Conversation[]
  ): { system: string; user: string } {
    const contextParts: string[] = []

    // Contexto del usuario
    contextParts.push(`**Usuario:** ${user.name}`)
    contextParts.push(`**Objetivo:** ${user.goal}`)
    
    if (user.restrictions) {
      contextParts.push(`**Restricciones:** ${user.restrictions}`)
    }

    // Racha y engagement
    if (user.currentStreak > 0) {
      contextParts.push(`**Racha actual:** ${user.currentStreak} días 🔥`)
    }

    // Patrones recientes (últimos 3 check-ins)
    if (user.checkIns && user.checkIns.length > 1) {
      const lastCheckIns = user.checkIns.slice(0, 3)
      const avgSleep = lastCheckIns.reduce((sum, c) => sum + c.sleep, 0) / lastCheckIns.length
      const avgEnergy = lastCheckIns.reduce((sum, c) => sum + c.energy, 0) / lastCheckIns.length
      
      contextParts.push(`**Promedio reciente:** Sueño ${avgSleep.toFixed(1)}/5, Energía ${avgEnergy.toFixed(1)}/5`)
    }

    // Conversación reciente (últimas 3 interacciones)
    if (recentConversations.length > 0) {
      const lastMessages = recentConversations
        .slice(0, 6) // 3 intercambios (user + assistant)
        .map(c => `${c.role === 'user' ? 'Usuario' : 'Tú'}: ${c.message}`)
        .join('\n')
      
      contextParts.push(`\n**Conversación reciente:**\n${lastMessages}`)
    }

    const system = `${this.getSystemIdentity()}

**CONTEXTO DEL USUARIO:**
${contextParts.join('\n')}

**TAREA:**
El usuario acaba de hacer su check-in diario. Analiza los datos y responde con:
1. **Feedback inmediato:** Comentario breve sobre su estado (sueño/energía/ánimo)
2. **Recomendación del día:** 1 acción específica y accionable basada en su estado y objetivo
3. **Pregunta de seguimiento:** 1 pregunta para mantener la conversación activa

Respuesta máxima: 150 palabras.`

    const userMessage = `Check-in de hoy:
- Sueño: ${checkInData.sleep}/5
- Energía: ${checkInData.energy}/5
- Ánimo: ${checkInData.mood}
- ¿Entrena hoy?: ${checkInData.willTrain ? 'Sí' : 'No'}`

    return { system, user: userMessage }
  }

  /**
   * Construir prompt para onboarding (primera vez)
   */
  buildOnboardingPrompt(
    step: 'welcome' | 'goal' | 'restrictions' | 'nutrition' | 'schedule',
    userData: Partial<UserWithRelations>,
    userResponse?: string
  ): { system: string; user: string } {
    const system = `${this.getSystemIdentity()}

**TAREA: Onboarding paso a paso**
Estás guiando al usuario en su primera configuración. Mantén el tono amigable, haz 1 pregunta por vez, y valida las respuestas antes de avanzar.`

    let userMessage = ''

    switch (step) {
      case 'welcome':
        userMessage = 'Inicia el onboarding. Saluda y pregunta su nombre.'
        break

      case 'goal':
        userMessage = `El usuario se llama ${userData.name}. Pregunta qué quiere lograr (opciones: bajar peso, ganar músculo, mejorar energía, crear hábitos, sentirse mejor).`
        break

      case 'restrictions':
        userMessage = `El usuario quiere: ${userData.goal}. Pregunta si tiene lesiones o limitaciones físicas.`
        break

      case 'nutrition':
        userMessage = `Restricciones: ${userData.restrictions || 'ninguna'}. Pregunta si quiere acompañamiento nutricional también (sí, no, solo consejos simples).`
        break

      case 'schedule':
        userMessage = `Todo registrado. Pregunta a qué hora prefiere recibir su check-in diario (mañana/mediodía/tarde/noche).`
        break
    }

    return { system, user: userMessage }
  }

  /**
   * Construir prompt para conversación general
   * (cuando el usuario escribe fuera del check-in)
   */
  buildConversationPrompt(
    user: UserWithRelations,
    userMessage: string,
    recentConversations: Conversation[]
  ): { system: string; user: string } {
    const contextParts: string[] = []

    contextParts.push(`**Usuario:** ${user.name}`)
    contextParts.push(`**Objetivo:** ${user.goal}`)
    contextParts.push(`**Racha:** ${user.currentStreak} días`)

    // Historial reciente
    if (recentConversations.length > 0) {
      const lastMessages = recentConversations
        .slice(0, 10) // Últimos 5 intercambios
        .map(c => `${c.role === 'user' ? 'Usuario' : 'Tú'}: ${c.message}`)
        .join('\n')
      
      contextParts.push(`\n**Conversación reciente:**\n${lastMessages}`)
    }

    const system = `${this.getSystemIdentity()}

**CONTEXTO DEL USUARIO:**
${contextParts.join('\n')}

**TAREA:**
Responde la consulta del usuario de forma útil y personalizada. Si pregunta sobre ejercicios, nutrición, o bienestar, da recomendaciones específicas basadas en su objetivo y restricciones.

Respuesta máxima: 200 palabras.`

    return { system, user: userMessage }
  }

  /**
   * Construir prompt para reactivación
   * (cuando el usuario lleva 2+ días sin check-in)
   */
  buildReactivationPrompt(
    user: UserWithRelations,
    daysSinceLastCheckIn: number
  ): { system: string; user: string } {
    const contextParts: string[] = []
    
    contextParts.push(`**Usuario:** ${user.name}`)
    contextParts.push(`**Objetivo:** ${user.goal}`)
    contextParts.push(`**Última racha:** ${user.longestStreak} días (récord personal)`)
    contextParts.push(`**Días sin check-in:** ${daysSinceLastCheckIn}`)

    const system = `${this.getSystemIdentity()}

**CONTEXTO:**
${contextParts.join('\n')}

**TAREA:**
Genera un mensaje de reactivación empático y motivador. NO uses frases genéricas tipo "¿qué pasó?". 
Enfócate en:
1. Recordar su objetivo original
2. Mencionar su mejor racha (si existe)
3. Proponer 1 micro-acción simple para volver (ej: "¿te animas a un check-in rápido hoy?")

Máximo: 100 palabras.`

    const userMessage = `Genera el mensaje de reactivación ahora.`

    return { system, user: userMessage }
  }

  /**
   * Construir prompt para análisis de imagen
   * (cuando el usuario envía foto de comida, ejercicio, etc.)
   */
  buildImageAnalysisPrompt(
    user: UserWithRelations,
    imageType: 'food' | 'exercise' | 'other',
    imageCaption?: string
  ): { system: string; user: string } {
    const system = `${this.getSystemIdentity()}

**CONTEXTO DEL USUARIO:**
- Nombre: ${user.name}
- Objetivo: ${user.goal}
- Restricciones: ${user.restrictions || 'ninguna'}

**TAREA:**
El usuario envió una imagen${imageCaption ? ` con el texto: "${imageCaption}"` : ''}.

Analiza la imagen y responde:
- Si es comida: comenta porciones, balance nutricional, y 1 sugerencia práctica
- Si es ejercicio/postura: comenta técnica, errores comunes, y 1 corrección clave
- Si es otra cosa: interpreta la intención y responde acorde

Respuesta máxima: 150 palabras.`

    const userMessage = `Imagen enviada (tipo: ${imageType})`

    return { system, user: userMessage }
  }

  /**
   * Construir prompt para resumen semanal
   */
  buildWeeklySummaryPrompt(
    user: UserWithRelations,
    weeklyCheckIns: CheckIn[]
  ): { system: string; user: string } {
    const system = `${this.getSystemIdentity()}

**TAREA: Resumen Semanal**
Genera un resumen motivador de la semana del usuario. Incluye:
1. **Consistencia:** Check-ins completados vs. esperados
2. **Tendencias:** Mejoras o caídas en sueño/energía/entrenamiento
3. **Logro destacado:** Algo positivo específico
4. **Ajuste sugerido:** 1 cambio simple para la próxima semana

Máximo: 200 palabras.`

    const checkInsSummary = weeklyCheckIns.map((c, i) => 
      `Día ${i + 1}: Sueño ${c.sleep}/5, Energía ${c.energy}/5, Entrenó: ${c.trainedToday ? 'Sí' : 'No'}`
    ).join('\n')

    const userMessage = `Usuario: ${user.name}
Objetivo: ${user.goal}
Racha actual: ${user.currentStreak} días

**Check-ins de la semana:**
${checkInsSummary}

Total: ${weeklyCheckIns.length}/7 check-ins`

    return { system, user: userMessage }
  }
}

export const promptBuilderService = new PromptBuilderService()
