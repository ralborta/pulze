"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationService = exports.ConversationService = void 0;
const client_1 = require("../client");
class ConversationService {
    /**
     * Guardar mensaje de conversación
     */
    async create(data) {
        return client_1.prisma.conversation.create({ data });
    }
    /**
     * Obtener historial de conversación de un usuario
     */
    async findByUserId(userId, options) {
        return client_1.prisma.conversation.findMany({
            where: { userId },
            take: options?.take || 50,
            skip: options?.skip,
            orderBy: { timestamp: 'desc' },
        });
    }
    /**
     * Obtener últimos N mensajes (para contexto de IA)
     */
    async getRecentMessages(userId, limit = 10) {
        return client_1.prisma.conversation.findMany({
            where: { userId },
            take: limit,
            orderBy: { timestamp: 'desc' },
        });
    }
    /**
     * Guardar intercambio completo (usuario + asistente)
     */
    async saveExchange(userId, userMessage, assistantMessage, metadata) {
        await client_1.prisma.conversation.createMany({
            data: [
                {
                    userId,
                    role: 'user',
                    message: userMessage,
                    metadata,
                },
                {
                    userId,
                    role: 'assistant',
                    message: assistantMessage,
                    metadata,
                },
            ],
        });
    }
}
exports.ConversationService = ConversationService;
exports.conversationService = new ConversationService();
