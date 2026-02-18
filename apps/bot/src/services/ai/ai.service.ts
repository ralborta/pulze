import OpenAI from 'openai'
import { COACH_SYSTEM_PROMPT } from './prompts'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Servicio principal de IA para PULZE
 */
export class AIService {
  /**
   * Generar respuesta del coach usando GPT-4
   */
  async generateCoachResponse(
    userMessage: string,
    context?: string,
    conversationHistory?: ChatMessage[]
  ): Promise<AIResponse> {
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: COACH_SYSTEM_PROMPT },
      ]

      // Agregar contexto si existe
      if (context) {
        messages.push({
          role: 'system',
          content: `CONTEXTO DEL USUARIO:\n${context}`,
        })
      }

      // Agregar historial de conversación (últimas 10 interacciones)
      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-10)
        messages.push(...recentHistory)
      }

      // Agregar mensaje actual del usuario
      messages.push({
        role: 'user',
        content: userMessage,
      })

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.8, // Un poco de creatividad pero no mucha
        max_tokens: 300, // Respuestas concisas
      })

      const response = completion.choices[0].message.content || ''

      return {
        content: response,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
      }
    } catch (error: any) {
      console.error('Error generating AI response:', error)
      throw new Error('Error al generar respuesta del coach')
    }
  }

  /**
   * Extraer información estructurada de una respuesta del usuario
   * Útil para detectar objetivos, restricciones, etc.
   */
  async extractInformation(
    userMessage: string,
    extractionPrompt: string
  ): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Sos un asistente que extrae información específica de textos. Respondé solo con la información solicitada, sin agregar nada extra.',
          },
          {
            role: 'user',
            content: `${extractionPrompt}\n\nTexto del usuario: "${userMessage}"`,
          },
        ],
        temperature: 0.3, // Baja temperatura para extracción precisa
        max_tokens: 100,
      })

      return completion.choices[0].message.content || ''
    } catch (error: any) {
      console.error('Error extracting information:', error)
      return userMessage // Fallback: devolver el mensaje original
    }
  }

  /**
   * Clasificar intención del usuario
   */
  async classifyIntent(userMessage: string): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Clasificá la intención del usuario en una de estas categorías:
- checkin: Quiere hacer su check-in diario
- question: Hace una pregunta sobre salud/fitness/nutrición
- support: Necesita ayuda o soporte
- feedback: Da feedback o comenta algo
- casual: Conversación casual
- other: Otra cosa

Respondé SOLO con la categoría, nada más.`,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.2,
        max_tokens: 20,
      })

      return completion.choices[0].message.content?.toLowerCase().trim() || 'other'
    } catch (error: any) {
      console.error('Error classifying intent:', error)
      return 'other'
    }
  }

  /**
   * Generar micro-acción personalizada
   */
  async generateMicroAction(profile: {
    name: string
    goal: string
    restrictions?: string
    emotionalState?: number
  }): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: COACH_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Generá una micro-acción INMEDIATA para ${profile.name}.
Objetivo: ${profile.goal}
Restricciones: ${profile.restrictions || 'ninguna'}
Estado emocional: ${profile.emotionalState || 'no especificado'}/10

La acción debe ser:
1. Realizable HOY en menos de 15 minutos
2. Tener 2 componentes concretos
3. Adaptada a sus limitaciones
4. Generar sensación de logro

Formato: Presentala con energía, directo, 2-3 líneas máximo.`,
          },
        ],
        temperature: 0.9,
        max_tokens: 150,
      })

      return completion.choices[0].message.content || 'Tomá 2 vasos de agua y caminá 10 minutos suaves 💪'
    } catch (error: any) {
      console.error('Error generating micro action:', error)
      return 'Tomá 2 vasos de agua y caminá 10 minutos suaves 💪'
    }
  }

  /**
   * Generar recomendación del día basada en check-in
   */
  async generateDailyRecommendation(data: {
    name: string
    goal: string
    restrictions?: string
    sleep: number
    energy: number
    mood: string
    willTrain: boolean
  }): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: COACH_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `${data.name} hizo su check-in:
- Objetivo: ${data.goal}
- Restricciones: ${data.restrictions || 'ninguna'}
- Sueño: ${data.sleep}/5
- Energía: ${data.energy}/5
- Ánimo: ${data.mood}
- Va a entrenar: ${data.willTrain ? 'sí' : 'no'}

Generá recomendación que incluya:
1. Comentario empático sobre su estado
2. UNA recomendación concreta adaptada a HOY
3. Micro-plan ejecutable (qué hacer)
4. Pregunta de seguimiento

Máximo 4-5 líneas. Adaptalo TODO a su estado actual.`,
          },
        ],
        temperature: 0.8,
        max_tokens: 250,
      })

      return completion.choices[0].message.content || 'Seguí así! 💪'
    } catch (error: any) {
      console.error('Error generating recommendation:', error)
      return 'Seguí así! 💪'
    }
  }

  /**
   * Generar mensaje de reactivación personalizado
   */
  async generateReactivationMessage(data: {
    name: string
    goal: string
    daysInactive: number
    lastActivity?: string
  }): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: COACH_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `${data.name} lleva ${data.daysInactive} días sin responder.
Objetivo: ${data.goal}
Última actividad: ${data.lastActivity || 'hace varios días'}

Generá mensaje de reactivación que:
1. No lo culpe ni presione
2. Le recuerde su objetivo
3. Le ofrezca retomar sin drama
4. Se sienta como amigo que pregunta

${data.daysInactive >= 7 ? 'Es mucho tiempo, profundizá más en POR QUÉ empezó.' : 'Es poco tiempo, mantenelo ligero.'}

Máximo 3-4 líneas.`,
          },
        ],
        temperature: 0.85,
        max_tokens: 200,
      })

      return completion.choices[0].message.content || `Che ${data.name}, ¿cómo venís? Hace unos días que no charlamos 👀`
    } catch (error: any) {
      console.error('Error generating reactivation message:', error)
      return `Che ${data.name}, ¿cómo venís? Hace unos días que no charlamos 👀`
    }
  }
}

export const aiService = new AIService()
