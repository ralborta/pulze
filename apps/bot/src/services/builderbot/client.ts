import axios, { AxiosInstance } from 'axios'

/**
 * Cliente de API de BuilderBot.app
 * Maneja el envío de mensajes proactivos a WhatsApp
 */
export class BuilderBotClient {
  private client: AxiosInstance
  private apiKey: string

  constructor() {
    this.apiKey = process.env.BUILDERBOT_API_KEY || ''
    
    if (!this.apiKey) {
      console.warn('⚠️ BUILDERBOT_API_KEY no configurado')
    }

    this.client = axios.create({
      baseURL: process.env.BUILDERBOT_API_URL || 'https://api.builderbot.app/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    })
  }

  /**
   * Enviar mensaje de texto a un usuario
   */
  async sendMessage(params: {
    phone: string
    message: string
    buttons?: Array<{ id: string; text: string }>
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await this.client.post('/messages/send', {
        phone: params.phone,
        message: params.message,
        buttons: params.buttons || [],
      })

      return {
        success: true,
        messageId: response.data.message_id,
      }
    } catch (error: any) {
      console.error('Error sending message:', error.response?.data || error.message)
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
      const response = await this.client.post('/messages/send', {
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
      const response = await this.client.post('/messages/template', {
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
      const response = await this.client.get(`/messages/${messageId}/status`)

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
      await this.client.post('/webhooks/config', {
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
