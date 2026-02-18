"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateService = exports.TemplateService = void 0;
const client_1 = require("../client");
class TemplateService {
    /**
     * Crear nueva plantilla
     */
    async create(data) {
        return client_1.prisma.messageTemplate.create({ data });
    }
    /**
     * Obtener plantilla por key
     */
    async findByKey(key) {
        return client_1.prisma.messageTemplate.findUnique({ where: { key } });
    }
    /**
     * Obtener plantillas por tipo
     */
    async findByType(type) {
        return client_1.prisma.messageTemplate.findMany({
            where: {
                type,
                isActive: true,
            },
        });
    }
    /**
     * Renderizar plantilla con variables
     */
    async render(key, variables) {
        const template = await this.findByKey(key);
        if (!template)
            throw new Error(`Template ${key} not found`);
        let content = template.content;
        // Reemplazar variables: {{nombre}} -> valor
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            content = content.replace(regex, value);
        });
        // Incrementar contador de uso
        await client_1.prisma.messageTemplate.update({
            where: { key },
            data: {
                usageCount: {
                    increment: 1,
                },
            },
        });
        return content;
    }
    /**
     * Actualizar plantilla
     */
    async update(id, data) {
        return client_1.prisma.messageTemplate.update({
            where: { id },
            data,
        });
    }
    /**
     * Obtener todas las plantillas (para backoffice)
     */
    async findAll() {
        return client_1.prisma.messageTemplate.findMany({
            orderBy: { usageCount: 'desc' },
        });
    }
    /**
     * Obtener plantillas más usadas
     */
    async getMostUsed(limit = 10) {
        return client_1.prisma.messageTemplate.findMany({
            where: { isActive: true },
            orderBy: { usageCount: 'desc' },
            take: limit,
        });
    }
}
exports.TemplateService = TemplateService;
exports.templateService = new TemplateService();
