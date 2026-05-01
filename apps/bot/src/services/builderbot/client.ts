import axios, { AxiosInstance } from 'axios'

/**
 * Cliente de API de BuilderBot.app
 * Maneja el envío de mensajes proactivos a WhatsApp
 */
export class BuilderBotClient {
  private client: AxiosInstance
  private apiKey: string
  private botId: string

  /** Base URL de la API (sin /v1). Por defecto wa-api.builderbot.app (BuilderBot Cloud). */
  private baseURL: string

  constructor() {
    this.apiKey = process.env.BUILDERBOT_API_KEY || ''
    this.botId = process.env.BUILDERBOT_BOT_ID || ''
    const envUrl = (process.env.BUILDERBOT_API_URL || '').replace(/\/$/, '')
    this.baseURL = envUrl || 'https://wa-api.builderbot.app'

    if (!this.apiKey) {
      console.warn('⚠️ BUILDERBOT_API_KEY no configurado')
    }
    if (!this.botId) {
      console.warn('⚠️ BUILDERBOT_BOT_ID no configurado (necesario para identificar el bot)')
    }

    this.client = axios.create({
      baseURL: `${this.baseURL}/v1`.replace(/\/v1\/v1$/, '/v1'),
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    })
  }

  /** True si está configurada la URL de la API y se pueden enviar mensajes. */
  canSend(): boolean {
    return !!(this.baseURL && this.apiKey && this.botId)
  }

  /** BuilderBot Cloud usa POST /v1/messages; otra API puede usar /bots/:id/messages/send */
  private getMessagesPath(): string {
    if (this.baseURL.includes('wa-api.builderbot.app')) {
      return '/messages'
    }
    return this.botId ? `/bots/${this.botId}/messages/send` : '/messages/send'
  }

  private getTemplatePath(): string {
    return this.botId ? `/bots/${this.botId}/messages/template` : '/messages/template'
  }

  private getStatusPath(messageId: string): string {
    return this.botId ? `/bots/${this.botId}/messages/${messageId}/status` : `/messages/${messageId}/status`
  }

  private getWebhookPath(): string {
    return this.botId ? `/bots/${this.botId}/webhooks/config` : '/webhooks/config'
  }

  /**
   * Enviar mensaje de texto a un usuario
   */
  async sendMessage(params: {
    phone: string
    message: string
    buttons?: Array<{ id: string; text: string }>
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.canSend()) {
      return {
        success: false,
        error: 'BUILDERBOT_API_URL no configurada. Configurala en Easypanel con la URL base que indica BuilderBot.',
      }
    }
    try {
      const path = this.getMessagesPath()
      const body = path === '/messages'
        ? { number: params.phone.replace(/^\+/, ''), message: params.message }
        : { phone: params.phone, message: params.message, buttons: params.buttons || [] }
      const response = await this.client.post(path, body)

      return {
        success: true,
        messageId: response.data.message_id,
      }
    } catch (error: any) {
      const msg = error.response?.data?.message ?? error.message ?? ''
      const isENOTFOUND = String(msg).includes('ENOTFOUND') || String(error.code).includes('ENOTFOUND')
      if (isENOTFOUND) {
        console.error(
          '❌ No se pudo conectar a la API de BuilderBot (DNS/red). Revisá BUILDERBOT_API_URL en Easypanel y que la URL base sea la correcta (consulta la documentación o soporte de BuilderBot).',
          msg
        )
      } else {
        console.error('Error sending message:', error.response?.data || error.message)
      }
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      }
    }
  }

  /**
   * Enviar mensaje con imagen
   */
  async sendMessageWithImage(params: {
    phone: string
    message: string
    imageUrl: string
    caption?: string
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.canSend()) {
      return {
        success: false,
        error: 'BuilderBot API no configurada (BUILDERBOT_API_URL / KEY / BOT_ID).',
      }
    }
    try {
      const path = this.getMessagesPath()
      const number = params.phone.replace(/^\+/, '').trim()
      const caption = (params.caption ?? params.message ?? '').trim() || '\u200B'

      const body =
        path === '/messages'
          ? {
              number,
              message: caption,
              media: { url: params.imageUrl, type: 'image' as const },
            }
          : {
              phone: params.phone,
              message: params.message,
              media: {
                url: params.imageUrl,
                type: 'image',
                caption: params.caption,
              },
            }

      const response = await this.client.post(path, body)

      return {
        success: true,
        messageId: response.data.message_id,
      }
    } catch (error: any) {
      console.error('Error sending image message:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      }
    }
  }

  /**
   * Enviar mensaje usando template predefinido
   */
  async sendTemplate(params: {
    phone: string
    templateId: string
    variables: Record<string, string>
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await this.client.post(this.getTemplatePath(), {
        phone: params.phone,
        template_id: params.templateId,
        variables: params.variables,
      })

      return {
        success: true,
        messageId: response.data.message_id,
      }
    } catch (error: any) {
      console.error('Error sending template:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      }
    }
  }

  /**
   * Obtener estado de un mensaje
   */
  async getMessageStatus(messageId: string): Promise<{
    success: boolean
    status?: 'sent' | 'delivered' | 'read' | 'failed'
    error?: string
  }> {
    try {
      const response = await this.client.get(this.getStatusPath(messageId))

      return {
        success: true,
        status: response.data.status,
      }
    } catch (error: any) {
      console.error('Error getting message status:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      }
    }
  }

  /**
   * Configurar webhook (solo una vez, al setup)
   */
  async configureWebhook(webhookUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.post(this.getWebhookPath(), {
        url: webhookUrl,
        events: ['message', 'status', 'media'],
      })

      return { success: true }
    } catch (error: any) {
      console.error('Error configuring webhook:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      }
    }
  }

  /** Base URL API v2 de BuilderBot Cloud (clear-conversation, mute, assistant). */
  private getApiV2Base(): string {
    return (process.env.BUILDERBOT_ASSISTANT_API_URL || process.env.BUILDERBOT_API_URL || 'https://app.builderbot.cloud/api/v2').replace(/\/$/, '')
  }

  /**
   * Limpiar historial de conversación con un contacto.
   * Doc: POST /api/v2/{id}/clear-conversation
   * Evita que el Plugin Assistant repita mensajes anteriores (ej. bienvenida).
   */
  async clearConversation(phone: string): Promise<{ success: boolean; error?: string }> {
    if (!this.botId || !this.apiKey) {
      return { success: false, error: 'BUILDERBOT_BOT_ID o BUILDERBOT_API_KEY no configurados' }
    }
    const number = phone.replace(/^\+/, '').replace(/\s+/g, '').trim()
    if (!number) return { success: false, error: 'Número vacío' }
    try {
      const url = `${this.getApiV2Base()}/${this.botId}/clear-conversation`
      await axios.post(url, { number }, {
        headers: { 'Content-Type': 'application/json', 'x-api-builderbot': this.apiKey },
        timeout: 10000,
      })
      console.log('✅ Conversación limpiada en BuilderBot:', number.slice(0, 6) + '***')
      return { success: true }
    } catch (error: any) {
      console.error('❌ Error clear-conversation:', error.response?.data || error.message)
      return { success: false, error: error.response?.data?.message || error.message }
    }
  }

  /**
   * Silenciar o activar el bot (global).
   * Doc: POST /api/v2/{id}/mute con { "flag": true } (silenciar) o { "flag": false } (activar)
   */
  async mute(flag: boolean): Promise<{ success: boolean; error?: string }> {
    if (!this.botId || !this.apiKey) {
      return { success: false, error: 'BUILDERBOT_BOT_ID o BUILDERBOT_API_KEY no configurados' }
    }
    try {
      const url = `${this.getApiV2Base()}/${this.botId}/mute`
      await axios.post(url, { flag }, {
        headers: { 'Content-Type': 'application/json', 'x-api-builderbot': this.apiKey },
        timeout: 10000,
      })
      console.log('✅ Bot', flag ? 'silenciado' : 'activado')
      return { success: true }
    } catch (error: any) {
      console.error('❌ Error mute:', error.response?.data || error.message)
      return { success: false, error: error.response?.data || error.message }
    }
  }

  /**
   * Actualizar las instrucciones (system prompt) del Agente de IA en BuilderBot.
   * Doc oficial: POST /api/v2/{id}/answer/{answerId}/plugin/assistant
   * Base URL: https://app.builderbot.cloud (BuilderBot Cloud API v2)
   */
  async updateAssistantInstructions(instructions: string): Promise<{ success: boolean; error?: string }> {
    const answerId = process.env.BUILDERBOT_ANSWER_ID?.trim()
    if (!answerId) {
      console.warn('⚠️ BUILDERBOT_ANSWER_ID no configurado — no se pueden actualizar instructions')
      return { success: false, error: 'BUILDERBOT_ANSWER_ID no configurado' }
    }
    if (!this.botId || !this.apiKey) {
      return { success: false, error: 'BUILDERBOT_BOT_ID o BUILDERBOT_API_KEY no configurados' }
    }
    try {
      const url = `${this.getApiV2Base()}/${this.botId}/answer/${answerId}/plugin/assistant`
      const response = await axios.post(
        url,
        { instructions },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-builderbot': this.apiKey,
          },
          timeout: 10000,
        }
      )
      console.log('✅ Instructions actualizadas en BuilderBot:', response.status)
      return { success: true }
    } catch (error: any) {
      console.error('❌ Error actualizando instructions en BuilderBot:', error.response?.data || error.message)
      return { success: false, error: error.response?.data?.message || error.message }
    }
  }

  /**
   * Verificar que la API está funcionando
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health')
      return true
    } catch (error) {
      return false
    }
  }
}

export const builderBotClient = new BuilderBotClient()
