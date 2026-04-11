import OpenAI from 'openai'

/**
 * Cliente OpenAI para procesos futuros (reportes, análisis, etc.).
 * El canal WhatsApp / BuilderBot no debe usar esto para copy conversacional.
 */
let client: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) {
    throw new Error('OPENAI_API_KEY no configurada')
  }
  if (!client) {
    client = new OpenAI({ apiKey: key })
  }
  return client
}

export function hasOpenAIConfigured(): boolean {
  return !!(process.env.OPENAI_API_KEY?.trim())
}
