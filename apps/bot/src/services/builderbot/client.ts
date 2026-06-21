import axios, { AxiosInstance } from 'axios'

/**
 * Cliente de API de BuilderBot.app
 * Maneja el envío de mensajes proactivos a WhatsApp
 */
export class BuilderBotClient {
  private client: AxiosInstance
  private messagesClient: AxiosInstance
  private apiKey: string
  /** Key exclusiva para wa-api (console.builderbot.app); puede diferir de la del proyecto BB Cloud. */
  private waApiKey: string
  private botId: string

  /** Base URL del plugin assistant (p. ej. app.builderbot.cloud/api/v2). */
  private baseURL: string
  /** Base URL para envío de mensajes WhatsApp (wa-api.builderbot.app). */
  private messagesBaseURL: string

  private getMessagesTimeoutMs(): number {
    const raw = Number(process.env.BUILDERBOT_MESSAGES_TIMEOUT_MS)
    return Number.isFinite(raw) && raw >= 5000 ? raw : 45000
  }

  constructor() {
    this.apiKey = process.env.BUILDERBOT_API_KEY || ''
    this.botId = process.env.BUILDERBOT_BOT_ID || ''
    /** Token wa-api (console.builderbot.app). Si no está, usa BUILDERBOT_API_KEY. */
    this.waApiKey = (process.env.BUILDERBOT_WA_API_KEY || this.apiKey).trim()
    const envUrl = (process.env.BUILDERBOT_API_URL || '').replace(/\/$/, '')
    this.baseURL = envUrl || 'https://app.builderbot.cloud/api/v2'
    this.messagesBaseURL = (
      process.env.BUILDERBOT_MESSAGES_API_URL || 'https://wa-api.builderbot.app'
    ).replace(/\/$/, '')

    if (!this.apiKey) {
      console.warn('⚠️ BUILDERBOT_API_KEY no configurado')
    }
    if (!this.botId) {
      console.warn('⚠️ BUILDERBOT_BOT_ID no configurado (necesario para identificar el bot)')
    }

    this.client = axios.create({
      baseURL: `${this.baseURL}/v1`.replace(/\/v1\/v1$/, '/v1'),
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    })

    this.messagesClient = axios.create({
      baseURL: `${this.messagesBaseURL}/v1`.replace(/\/v1\/v1$/, '/v1'),
      headers: this.getMessagesAuthHeaders(),
      timeout: this.getMessagesTimeoutMs(),
    })
  }

  private usesWaMessagesApi(): boolean {
    return this.messagesBaseURL.includes('wa-api.builderbot.app')
  }

  /** wa-api: Authorization = token crudo (doc BuilderBot). Otras APIs: Bearer. */
  private getMessagesAuthHeaders(): Record<string, string> {
    if (this.usesWaMessagesApi()) {
      return {
        Authorization: this.waApiKey,
        'Content-Type': 'application/json',
      }
    }
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  private getApiV2Base(): string {
    return (process.env.BUILDERBOT_ASSISTANT_API_URL || process.env.BUILDERBOT_API_URL || 'https://app.builderbot.cloud/api/v2').replace(/\/$/, '')
  }

  /**
   * BuilderBot Cloud (bb- del Developer Settings) envía por app.builderbot.cloud/api/v2/{botId}/messages.
   * wa-api.builderbot.app es otro producto (console.builderbot.app) con otra key.
   */
  private getOutboundProvider(): 'cloud-v2' | 'wa-api' {
    const forced = process.env.BUILDERBOT_MESSAGES_PROVIDER?.trim().toLowerCase()
    if (forced === 'cloud' || forced === 'cloud-v2') return 'cloud-v2'
    if (forced === 'wa-api') return 'wa-api'
    if (this.botId && /^bb-/.test(this.apiKey.trim())) return 'cloud-v2'
    return 'wa-api'
  }

  private formatPhoneDigits(phone: string): string {
    return phone.replace(/\D/g, '')
  }

  /** E.164 con + (requerido por wa-api.builderbot.app). */
  private formatPhoneForWaApi(phone: string): string {
    const digits = this.formatPhoneDigits(phone)
    return digits ? `+${digits}` : ''
  }

  private buildWaApiMessageBody(
    phone: string,
    message: string,
    extra?: Record<string, unknown>
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      phone: this.formatPhoneForWaApi(phone),
      message: message.trim(),
    }
    const device = process.env.BUILDERBOT_DEVICE_ID?.trim()
    if (device) body.device = device
    if (extra) Object.assign(body, extra)
    return body
  }

  /** Prefijo de la key (sin secretos) para diagnóstico. */
  private apiKeyHint(): string {
    const k = this.apiKey.trim()
    if (!k) return '(vacía)'
    if (this.getOutboundProvider() === 'cloud-v2') {
      return `${k.slice(0, 6)}… (BuilderBot Cloud → outbound v2 OK)`
    }
    const wa = this.waApiKey.trim()
    if (wa.startsWith('eyJ')) return 'eyJ… (JWT — no válida para wa-api)'
    if (wa.startsWith('bbc-')) return 'bbc-… (no válida para wa-api)'
    if (wa.startsWith('bb-')) return `${wa.slice(0, 6)}… (proyecto bb- — usá outbound cloud-v2, no wa-api)`
    return `${wa.slice(0, 4)}…`
  }

  /** Diagnóstico sin exponer secretos (health / debug prod). */
  getSendDiagnostics(): {
    canSend: boolean
    hasApiKey: boolean
    hasWaApiKey: boolean
    hasBotId: boolean
    outboundProvider: 'cloud-v2' | 'wa-api'
    messagesApiUrl: string
    cloudMessagesUrl: string | null
    assistantApiUrl: string
    usesWaMessagesApi: boolean
    hasDeviceId: boolean
    apiKeyHint: string
  } {
    const provider = this.getOutboundProvider()
    return {
      canSend: this.canSend(),
      hasApiKey: !!this.apiKey,
      hasWaApiKey: !!this.waApiKey,
      hasBotId: !!this.botId,
      outboundProvider: provider,
      messagesApiUrl: this.messagesBaseURL,
      cloudMessagesUrl:
        provider === 'cloud-v2' && this.botId
          ? `${this.getApiV2Base()}/${this.botId}/messages`
          : null,
      assistantApiUrl: this.baseURL,
      usesWaMessagesApi: this.usesWaMessagesApi(),
      hasDeviceId: !!process.env.BUILDERBOT_DEVICE_ID?.trim(),
      apiKeyHint: this.apiKeyHint(),
    }
  }

  /**
   * Prueba wa-api (solo si outboundProvider === wa-api).
   * console.builderbot.app usa otra key distinta de la bb- del proyecto Cloud.
   */
  async probeWaApiAuth(): Promise<{ ok: boolean; httpStatus?: number; error?: string; skipped?: boolean }> {
    if (this.getOutboundProvider() === 'cloud-v2') {
      return { ok: true, skipped: true, error: 'No aplica: outbound usa BuilderBot Cloud v2' }
    }
    if (!this.waApiKey) {
      return { ok: false, error: 'BUILDERBOT_WA_API_KEY / BUILDERBOT_API_KEY vacía' }
    }
    try {
      const response = await axios.get(`${this.messagesBaseURL}/v1/devices`, {
        headers: this.getMessagesAuthHeaders(),
        timeout: 8000,
        validateStatus: () => true,
      })
      if (response.status >= 200 && response.status < 300) {
        return { ok: true, httpStatus: response.status }
      }
      return {
        ok: false,
        httpStatus: response.status,
        error: response.data?.message || JSON.stringify(response.data),
      }
    } catch (error: any) {
      return { ok: false, error: error.message }
    }
  }

  /** Verifica que BUILDERBOT_API_KEY + BOT_ID pueden llamar a Cloud v2 /messages. */
  async probeCloudV2Auth(): Promise<{ ok: boolean; httpStatus?: number; error?: string; skipped?: boolean }> {
    if (this.getOutboundProvider() !== 'cloud-v2') {
      return { ok: true, skipped: true, error: 'No aplica: outbound usa wa-api' }
    }
    if (!this.apiKey || !this.botId) {
      return { ok: false, error: 'BUILDERBOT_API_KEY o BUILDERBOT_BOT_ID faltantes' }
    }
    try {
      const url = `${this.getApiV2Base()}/${this.botId}/messages`
      const response = await axios.post(
        url,
        { number: '0000000000', messages: { content: '\u200B' } },
        {
          headers: { 'Content-Type': 'application/json', 'x-api-builderbot': this.apiKey },
          timeout: 20000,
          validateStatus: () => true,
        }
      )
      if (response.status === 401 || response.status === 403) {
        return {
          ok: false,
          httpStatus: response.status,
          error: response.data?.message || JSON.stringify(response.data),
        }
      }
      return { ok: true, httpStatus: response.status }
    } catch (error: any) {
      return { ok: false, error: error.message }
    }
  }

  /** True si hay credenciales para el proveedor de outbound configurado. */
  canSend(): boolean {
    if (this.getOutboundProvider() === 'cloud-v2') {
      return !!(this.apiKey && this.botId)
    }
    if (!this.messagesBaseURL || !this.waApiKey) return false
    if (this.usesWaMessagesApi()) return true
    return !!this.botId
  }

  /** BuilderBot Cloud usa POST /v1/messages; otra API puede usar /bots/:id/messages/send */
  private getMessagesPath(): string {
    if (this.usesWaMessagesApi()) {
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
    timeoutMs?: number
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.canSend()) {
      return {
        success: false,
        error: 'BUILDERBOT_API_KEY / BOT_ID no configurados para envío WhatsApp.',
      }
    }
    if (this.getOutboundProvider() === 'cloud-v2') {
      return this.sendMessageViaCloudV2(params)
    }
    return this.sendMessageViaWaApi(params)
  }

  /**
   * BuilderBot Cloud: POST /api/v2/{botId}/messages
   * Header x-api-builderbot + body { number, messages: { content } }
   */
  private async sendMessageViaCloudV2(params: {
    phone: string
    message: string
    timeoutMs?: number
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const number = this.formatPhoneDigits(params.phone)
    if (!number) return { success: false, error: 'Número vacío' }
    try {
      const url = `${this.getApiV2Base()}/${this.botId}/messages`
      const response = await axios.post(
        url,
        { number, messages: { content: params.message.trim() } },
        {
          headers: { 'Content-Type': 'application/json', 'x-api-builderbot': this.apiKey },
          timeout: params.timeoutMs ?? this.getMessagesTimeoutMs(),
          validateStatus: () => true,
        }
      )
      if (response.status < 200 || response.status >= 300) {
        const err =
          response.data?.error ||
          response.data?.message ||
          (Array.isArray(response.data?.error) ? JSON.stringify(response.data.error) : null) ||
          JSON.stringify(response.data)
        return { success: false, error: String(err) }
      }
      if (response.data?.error === 'Bot is not online') {
        return { success: false, error: 'Bot is not online (BuilderBot Cloud)' }
      }
      return { success: true, messageId: response.data?.message_id }
    } catch (error: any) {
      console.error('Error sending message (Cloud v2):', error.response?.data || error.message)
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.response?.data?.error ||
          JSON.stringify(error.response?.data) ||
          error.message,
      }
    }
  }

  private async sendMessageViaWaApi(params: {
    phone: string
    message: string
    buttons?: Array<{ id: string; text: string }>
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const path = this.getMessagesPath()
      const body = this.usesWaMessagesApi()
        ? this.buildWaApiMessageBody(params.phone, params.message)
        : { phone: params.phone, message: params.message, buttons: params.buttons || [] }
      const response = await this.postWaMessage(path, body)

      return {
        success: true,
        messageId: response.data.message_id,
      }
    } catch (error: any) {
      const msg = error.response?.data?.message ?? error.message ?? ''
      const isENOTFOUND = String(msg).includes('ENOTFOUND') || String(error.code).includes('ENOTFOUND')
      if (isENOTFOUND) {
        console.error(
          '❌ No se pudo conectar a la API de mensajes de BuilderBot (DNS/red). Revisá BUILDERBOT_MESSAGES_API_URL (por defecto https://wa-api.builderbot.app).',
          msg
        )
      } else {
        console.error('Error sending message (wa-api):', error.response?.data || error.message)
      }
      return {
        success: false,
        error:
          error.response?.data?.message ||
          (typeof error.response?.data === 'string' ? error.response.data : null) ||
          JSON.stringify(error.response?.data) ||
          error.message,
      }
    }
  }

  /** POST wa-api; reintenta con ?token= si Authorization devuelve 403. */
  private async postWaMessage(path: string, body: Record<string, unknown>) {
    try {
      return await this.messagesClient.post(path, body)
    } catch (error: any) {
      if (error.response?.status !== 403 || !this.usesWaMessagesApi()) throw error
      return await this.messagesClient.post(`${path}?token=${encodeURIComponent(this.waApiKey)}`, body)
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
        error: 'BuilderBot API no configurada (BUILDERBOT_MESSAGES_API_URL / KEY / BOT_ID).',
      }
    }
    try {
      const path = this.getMessagesPath()
      const caption = (params.caption ?? params.message ?? '').trim() || '\u200B'

      const body = this.usesWaMessagesApi()
        ? this.buildWaApiMessageBody(params.phone, caption, {
            media: { url: params.imageUrl, type: 'image' as const },
          })
        : {
            phone: params.phone,
            message: params.message,
            media: {
              url: params.imageUrl,
              type: 'image',
              caption: params.caption,
            },
          }

      const response = this.usesWaMessagesApi()
        ? await this.postWaMessage(path, body)
        : await this.messagesClient.post(path, body)

      return {
        success: true,
        messageId: response.data.message_id,
      }
    } catch (error: any) {
      console.error('Error sending image message:', error.response?.data || error.message)
      return {
        success: false,
        error:
          error.response?.data?.message ||
          (typeof error.response?.data === 'string' ? error.response.data : null) ||
          JSON.stringify(error.response?.data) ||
          error.message,
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
        error:
          error.response?.data?.message ||
          (typeof error.response?.data === 'string' ? error.response.data : null) ||
          JSON.stringify(error.response?.data) ||
          error.message,
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
        error:
          error.response?.data?.message ||
          (typeof error.response?.data === 'string' ? error.response.data : null) ||
          JSON.stringify(error.response?.data) ||
          error.message,
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
        error:
          error.response?.data?.message ||
          (typeof error.response?.data === 'string' ? error.response.data : null) ||
          JSON.stringify(error.response?.data) ||
          error.message,
      }
    }
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
