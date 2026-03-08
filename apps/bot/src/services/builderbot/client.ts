import axios, { AxiosInstance } from 'axios'

/**
 * Cliente de API de BuilderBot.app
 * Maneja el envío de mensajes proactivos a WhatsApp
 */
export class BuilderBotClient {
  private client: AxiosInstance
  private apiKey: string
  private botId: string

  /** Base URL de la API (sin /v1). Si no está configurada, no se pueden enviar mensajes por API. */
  private baseURL: string

  constructor() {
    this.apiKey = process.env.BUILDERBOT_API_KEY || ''
    this.botId = process.env.BUILDERBOT_BOT_ID || ''
    this.baseURL = (process.env.BUILDERBOT_API_URL || '').replace(/\/$/, '')

    if (!this.apiKey) {
      console.warn('⚠️ BUILDERBOT_API_KEY no configurado')
    }
    if (!this.botId) {
      console.warn('⚠️ BUILDERBOT_BOT_ID no configurado (necesario para identificar el bot)')
    }
    if (!this.baseURL) {
      console.warn('⚠️ BUILDERBOT_API_URL no configurada: no se enviarán respuestas por API. Obtené la URL base en BuilderBot (consola/docs) y configurala para que el mensaje llegue a WhatsApp.')
    }

    this.client = axios.create({
      baseURL: this.baseURL ? `${this.baseURL}/v1` : 'http://localhost',
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

  private getMessagesPath(): string {
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
      const response = await this.client.post(this.getMessagesPath(), {
        phone: params.phone,
        message: params.message,
        buttons: params.buttons || [],
      })

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
    try {
      const response = await this.client.post(this.getMessagesPath(), {
        phone: params.phone,
        message: params.message,
        media: {
          url: params.imageUrl,
          type: 'image',
          caption: params.caption,
        },
      })

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
